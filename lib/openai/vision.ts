import OpenAI from "openai";

import {
  costFromUsage,
  type ModelKey,
} from "@/lib/openai/cost-estimator";
import type {
  IngredientsResultV2,
  VisionJSONResponseV2,
} from "@/lib/openai/vision-v2-types";

const DEFAULT_MODEL: ModelKey = "gpt-4o-mini";

export interface IngredientsResult {
  ingredients: string[];
  detected_allergens: string[];
  confidence: number;
  source_language: string;
  ocr_text: string;
  warnings: string[];
}

export interface VisionJSONResponse {
  data: IngredientsResult;
  tokensUSD?: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  raw: unknown;
}

interface ExtractParams {
  apiKey: string;
  imageUrlOrBase64: string;
  model?: ModelKey;
  locale?: string;
  pricingModel?: ModelKey;
}

export async function extractIngredientsJSONViaSDK({
  apiKey,
  imageUrlOrBase64,
  locale = "es-CL",
  model = DEFAULT_MODEL,
  pricingModel = model,
}: ExtractParams): Promise<VisionJSONResponse> {
  const client = new OpenAI({ apiKey });

  const schema = {
    type: "object",
    properties: {
      ingredients: {
        type: "array",
        items: { type: "string" },
        description: "Lista de ingredientes en español (Chile), limpios.",
      },
      detected_allergens: {
        type: "array",
        items: { type: "string" },
        description:
          "Alergenos detectados explícita o implícitamente en la etiqueta.",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confianza global del resultado (0..1).",
      },
      source_language: {
        type: "string",
        description:
          "Idioma detectado del texto de la etiqueta, ej: 'es'.",
      },
      ocr_text: {
        type: "string",
        description:
          "Texto crudo relevante del envase (ingredientes, advertencias, 'puede contener', etc.).",
      },
      warnings: {
        type: "array",
        items: { type: "string" },
        description:
          "Notas o advertencias (ambigüedades, texto borroso, etc.).",
      },
    },
    required: [
      "ingredients",
      "detected_allergens",
      "confidence",
      "source_language",
      "ocr_text",
      "warnings",
    ],
    additionalProperties: false,
  } as const;

  const system = [
    "Eres un asistente experto en leer etiquetas de alimentos en español (Chile).",
    "Devuelve SOLAMENTE JSON que cumpla EXACTAMENTE el schema indicado.",
    "Procesa TODO el texto visible de la etiqueta, no solo el bloque de ingredientes.",
    "Extrae la lista de ingredientes manteniendo porcentajes, aditivos y anotaciones tal como aparecen.",
    "Si no encuentras ingredientes, devuelve ingredients: [].",
    "Incluye detected_allergens con posibles alérgenos explícitos o implícitos aunque estén en otra sección (p. ej. 'Puede contener', 'Contiene ingrendientes alpergenos').",
    "Estima confidence entre 0 y 1.",
    "Incluye siempre warnings (usa [] si no hay advertencias) y ocr_text (usa \"\" si no puedes extraer texto).",
  ].join(" ");

  const userPrompt = [
    "Tarea: Devuelve un JSON válido según el schema.",
    "Analiza todas las secciones que contengan ingredientes, alérgenos o advertencias relacionadas.",
    `Locale de referencia: ${locale}.`,
  ].join(" ");

  const response = await client.responses.create({
    model,
    input: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "input_text", text: userPrompt },
          { type: "input_image", image_url: imageUrlOrBase64, detail: "auto" },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "ingredients_schema",
        schema,
        strict: true,
      },
    },
  });

  type OutputContent =
    | { type: "output_text"; text: string }
    | { type: string; text?: string };

  const firstOutput = response.output?.[0];
  const outputContent =
    firstOutput && "content" in firstOutput && Array.isArray(firstOutput.content)
      ? (firstOutput.content as OutputContent[])
      : undefined;

  const extractedText =
    outputContent?.find(
      (item) => item.type === "output_text" && typeof item.text === "string",
    )?.text ?? null;

  const legacyText = (() => {
    const candidate = (response as { output_text?: unknown }).output_text;
    return typeof candidate === "string" ? candidate : null;
  })();

  const jsonText = extractedText ?? legacyText ?? "";

  if (!jsonText) {
    throw new Error("Respuesta vacía o sin output_text.");
  }

  let parsed: IngredientsResult;

  try {
    parsed = JSON.parse(jsonText) as IngredientsResult;
  } catch {
    const cleaned = jsonText.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned) as IngredientsResult;
  }

  const usage = response.usage as
    | {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      }
    | undefined;

  const tokensUSD =
    usage !== undefined
      ? costFromUsage(pricingModel, {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
        })
      : undefined;

  return {
    data: parsed,
    tokensUSD,
    usage,
    raw: response,
  };
}

/**
 * Extract ingredients with structured mentions (V2)
 *
 * Enhanced version that returns:
 * - Mentions with type, section, offset, evidence
 * - Allergen implications (via synonyms/E-numbers)
 * - Quality assessment with legibility
 *
 * This enables:
 * - Precise highlighting in UI
 * - Explainable risk decisions
 * - Better diet/intolerance matching
 */
export async function extractIngredientsJSONV2ViaSDK({
  apiKey,
  imageUrlOrBase64,
  locale = "es-CL",
  model = DEFAULT_MODEL,
  pricingModel = model,
}: ExtractParams): Promise<VisionJSONResponseV2> {
  const client = new OpenAI({ apiKey });

  const schema = {
    type: "object",
    properties: {
      ocr_text: {
        type: "string",
        description: "Texto completo relevante extraído del envase (ingredientes, advertencias, claims, etc.).",
      },
      language: {
        type: "string",
        description: "Idioma detectado del texto (ej: 'es', 'es-CL').",
      },
      quality: {
        type: "object",
        properties: {
          legibility: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Legibilidad del texto en la imagen (low=borroso/ángulo malo, medium=aceptable, high=muy claro).",
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Confianza global de la extracción (0..1).",
          },
        },
        required: ["legibility", "confidence"],
        additionalProperties: false,
      },
      mentions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            surface: {
              type: "string",
              description: "Texto original tal como aparece en la etiqueta.",
            },
            canonical: {
              type: "string",
              description: "Forma normalizada: minúsculas, sin tildes, espacios por guiones bajos.",
            },
            type: {
              type: "string",
              enum: ["ingredient", "allergen", "claim", "warning", "icon"],
              description: "Tipo de mención. 'claim' para 'Sin X', 'warning' para 'Puede contener', 'icon' para badges del frente.",
            },
            section: {
              type: "string",
              enum: ["ingredients", "may_contain", "front_label", "nutrition", "other"],
              description: "Sección de donde viene. 'may_contain' para trazas/puede contener, 'front_label' para iconos.",
            },
            offset: {
              type: "object",
              properties: {
                start: { type: "integer" },
                end: { type: "integer" },
              },
              required: ["start", "end"],
              additionalProperties: false,
              description: "Índices de caracteres en ocr_text (para resaltar en UI).",
            },
            enumbers: {
              type: "array",
              items: { type: "string" },
              description: "E-numbers encontrados en esta mención (ej: ['E471', 'E322']).",
            },
            implies_allergens: {
              type: "array",
              items: { type: "string" },
              description: "Claves de alérgenos que esta mención implica (por sinónimos/mapeo semántico). Ej: 'leche desnatada' → ['leche'].",
            },
            evidence: {
              type: "string",
              description: "Snippet exacto de texto para mostrar como evidencia.",
            },
          },
          required: ["surface", "canonical", "type", "section", "offset", "enumbers", "implies_allergens", "evidence"],
          additionalProperties: false,
        },
        description: "Lista de menciones encontradas en la etiqueta con clasificación y evidencia.",
      },
      detected_allergens: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Clave normalizada del alérgeno (ej: 'leche', 'gluten', 'frutos_secos').",
            },
            source_mentions: {
              type: "array",
              items: { type: "integer" },
              description: "Índices en el array 'mentions' que apoyan este alérgeno.",
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Confianza de esta detección específica (0..1).",
            },
          },
          required: ["key", "source_mentions", "confidence"],
          additionalProperties: false,
        },
        description: "Alérgenos detectados con referencias a las menciones que los soportan.",
      },
      warnings: {
        type: "array",
        items: { type: "string" },
        description: "Advertencias sobre la calidad de la extracción (texto borroso, ambigüedades, etc.). Usa [] si no hay.",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confianza global del análisis (0..1).",
      },
    },
    required: ["ocr_text", "language", "quality", "mentions", "detected_allergens", "warnings", "confidence"],
    additionalProperties: false,
  } as const;

  const system = [
    "Eres un asistente experto en leer etiquetas de alimentos en español (Chile).",
    "Devuelve SOLAMENTE JSON que cumpla EXACTAMENTE el schema indicado.",
    "Procesa TODO el texto visible: ingredientes, advertencias, claims ('Sin X'), iconos, badges.",
    "CRITICAL: Clasifica 'Puede contener' o 'Trazas de' como section='may_contain', type='warning'.",
    "CRITICAL: Si dice 'Sin gluten' o 'Libre de X', usa type='claim' y NO agregues implies_allergens para X.",
    "CRITICAL: Badges/iconos del frente (ej: 'Con leche', '🥚 Huevo') → section='front_label', type='icon'.",
    "Para cada mention, extrae offset (start/end) sobre ocr_text, E-numbers presentes, y implies_allergens usando mapeo semántico.",
    "Normaliza 'canonical' sin tildes ni mayúsculas (ej: 'Leche Pasteurizada' → 'leche_pasteurizada').",
    "Extrae E-numbers con formato E### o E#### (ej: E471, E1422).",
    "Mapea ingredientes a alérgenos conocidos: 'leche desnatada' → implies_allergens=['leche'], 'almidón de trigo' → implies_allergens=['gluten'].",
    "Evalúa legibility basándote en claridad, ángulo, iluminación, enfoque del texto.",
    "Llena evidence con snippet exacto relevante.",
    "warnings debe incluir cualquier ambigüedad, texto cortado, borroso, etc.",
  ].join(" ");

  const userPrompt = [
    "Tarea: Devuelve un JSON válido según el schema.",
    "Analiza todas las secciones: ingredientes, advertencias de trazas, claims nutricionales, badges/iconos.",
    "Distingue claramente type y section para cada mention.",
    "Extrae offsets precisos para highlighting posterior.",
    `Locale de referencia: ${locale}.`,
  ].join(" ");

  const response = await client.responses.create({
    model,
    input: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "input_text", text: userPrompt },
          { type: "input_image", image_url: imageUrlOrBase64, detail: "auto" },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "ingredients_v2_schema",
        schema,
        strict: true,
      },
    },
  });

  type OutputContent =
    | { type: "output_text"; text: string }
    | { type: string; text?: string };

  const firstOutput = response.output?.[0];
  const outputContent =
    firstOutput && "content" in firstOutput && Array.isArray(firstOutput.content)
      ? (firstOutput.content as OutputContent[])
      : undefined;

  const extractedText =
    outputContent?.find(
      (item) => item.type === "output_text" && typeof item.text === "string",
    )?.text ?? null;

  const legacyText = (() => {
    const candidate = (response as { output_text?: unknown }).output_text;
    return typeof candidate === "string" ? candidate : null;
  })();

  const jsonText = extractedText ?? legacyText ?? "";

  if (!jsonText) {
    throw new Error("Respuesta vacía o sin output_text.");
  }

  let parsed: IngredientsResultV2;

  try {
    parsed = JSON.parse(jsonText) as IngredientsResultV2;
  } catch {
    const cleaned = jsonText.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned) as IngredientsResultV2;
  }

  const usage = response.usage as
    | {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      }
    | undefined;

  const tokensUSD =
    usage !== undefined
      ? costFromUsage(pricingModel, {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
        })
      : undefined;

  return {
    data: parsed,
    tokensUSD,
    usage,
    raw: response,
  };
}
