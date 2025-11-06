import OpenAI from "openai";

import {
  costFromUsage,
  type ModelKey,
} from "@/lib/openai/cost-estimator";

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
