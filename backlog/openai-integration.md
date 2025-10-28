¡Hecho! Te dejo un setup **completo en TypeScript** con:

1. **SDK** de OpenAI que **obliga JSON** usando `response_format: "json_schema"` (estricto).
2. **Calculadora de costos dinámica** (parámetros para tamaño de tile, tokens base, escalado, etc.).
3. **Ejemplo de uso** que imprime el JSON y el costo real según `usage`.

---

### `cost-estimator.ts` — calculadora de costos (dinámica)

```ts
// cost-estimator.ts
export type ModelKey = "gpt-4o" | "gpt-4o-mini";

export interface PricesPerMTok {
  input: number;   // USD por 1M tokens de entrada
  output: number;  // USD por 1M tokens de salida
}

/** Precios por defecto: ajusta cuando cambien las tarifas */
export const PRICES_USD_PER_MTOK: Record<ModelKey, PricesPerMTok> = {
  "gpt-4o":      { input: 2.50, output: 10.00 },
  "gpt-4o-mini": { input: 0.15, output: 0.60  },
};

export interface ImageSpec { width: number; height: number; }

export interface TileRules {
  tileSizePx: number;     // normalmente 512
  baseTokens: number;     // normalmente 70
  perTileTokens: number;  // normalmente 140
  shortSideTargetPx: number; // ~768
  longSideMaxPx: number;     // ~2048
  noUpscale?: boolean;       // no escalar hacia arriba
}

/** Reglas por defecto (dinámicas, no “hardcoded”): */
export const DEFAULT_TILE_RULES: TileRules = {
  tileSizePx: 512,
  baseTokens: 70,
  perTileTokens: 140,
  shortSideTargetPx: 768,
  longSideMaxPx: 2048,
  noUpscale: true,
};

export interface TileCalcResult {
  scaledWidth: number;
  scaledHeight: number;
  tilesX: number;
  tilesY: number;
  tiles: number;
  imageTokens: number;
}

/**
 * Escala dinámica:
 * 1) si lado largo > longSideMaxPx -> reduce a longSideMaxPx
 * 2) si lado corto > shortSideTargetPx -> reduce a shortSideTargetPx
 * 3) opcional: no hacer upscale (si la imagen ya es chica, se queda así)
 */
export function normalizeAndCountTiles(
  img: ImageSpec,
  rules: TileRules = DEFAULT_TILE_RULES
): TileCalcResult {
  let { width: w, height: h } = img;

  const longSide = Math.max(w, h);
  if (longSide > rules.longSideMaxPx) {
    const scale = rules.longSideMaxPx / longSide;
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  }

  const shortSide = Math.min(w, h);
  if (shortSide > rules.shortSideTargetPx) {
    const scale = rules.shortSideTargetPx / shortSide;
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  } else if (!rules.noUpscale && shortSide < rules.shortSideTargetPx) {
    // Opcional: permitir upscale si lo deseas (normalmente no recomendado)
    const scale = rules.shortSideTargetPx / shortSide;
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  }

  const tilesX = Math.ceil(w / rules.tileSizePx);
  const tilesY = Math.ceil(h / rules.tileSizePx);
  const tiles = tilesX * tilesY;

  const imageTokens = rules.baseTokens + rules.perTileTokens * tiles;

  return { scaledWidth: w, scaledHeight: h, tilesX, tilesY, tiles, imageTokens };
}

export interface CostEstimateInput {
  model: ModelKey;
  images: ImageSpec[];
  promptTextTokens?: number;     // tokens de prompt (system/user)
  expectedOutputTokens?: number; // tokens de completion esperados
  pricesOverride?: Partial<Record<ModelKey, PricesPerMTok>>;
  rules?: TileRules;
}

export interface CostEstimateResult {
  totalImageTokens: number;
  promptTextTokens: number;
  outputTokens: number;
  inputTokens: number;
  costUSD: number;
  perImageUSD: number;
  details: Array<{ idx: number; tiles: number; imageTokens: number }>;
}

export function estimateCost({
  model,
  images,
  promptTextTokens = 0,
  expectedOutputTokens = 120,
  pricesOverride,
  rules = DEFAULT_TILE_RULES,
}: CostEstimateInput): CostEstimateResult {
  const pricesMap = { ...PRICES_USD_PER_MTOK, ...pricesOverride };
  const prices = pricesMap[model];

  const details = images.map((im, i) => {
    const t = normalizeAndCountTiles(im, rules);
    return { idx: i, tiles: t.tiles, imageTokens: t.imageTokens };
  });

  const totalImageTokens = details.reduce((s, d) => s + d.imageTokens, 0);
  const inputTokens = totalImageTokens + promptTextTokens;
  const outputTokens = expectedOutputTokens;

  const costUSD =
    (inputTokens / 1_000_000) * prices.input +
    (outputTokens / 1_000_000) * prices.output;

  return {
    totalImageTokens,
    promptTextTokens,
    outputTokens,
    inputTokens,
    costUSD,
    perImageUSD: costUSD / Math.max(1, images.length),
    details,
  };
}

/** Costo desde usage real de la API */
export function costFromUsage(
  model: ModelKey,
  usage: { prompt_tokens: number; completion_tokens: number },
  pricesOverride?: Partial<Record<ModelKey, PricesPerMTok>>
): number {
  const pricesMap = { ...PRICES_USD_PER_MTOK, ...pricesOverride };
  const prices = pricesMap[model];
  const inputCost = (usage.prompt_tokens / 1_000_000) * prices.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * prices.output;
  return inputCost + outputCost;
}
```

---

### `openai-sdk-structured.ts` — llamada con SDK + JSON **estricto**

````ts
// openai-sdk-structured.ts
// npm i openai
import OpenAI from "openai";
import { costFromUsage, ModelKey } from "./cost-estimator";

export interface IngredientsResult {
  ingredients: string[];          // lista limpia
  detected_allergens: string[];   // p. ej. "gluten", "leche", "soya"
  confidence: number;             // 0..1
  source_language: string;        // "es" normalmente
  ocr_text?: string;              // opcional: texto crudo detectado
  warnings?: string[];            // opcional: ambigüedades, dudas
}

export interface VisionJSONResponse {
  data: IngredientsResult;
  tokensUSD?: number;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  raw?: any;
}

/**
 * Fuerza salida JSON con schema estricto usando Responses API.
 * - Devuelve siempre un JSON que cumple el schema.
 * - Si el modelo no puede, lanza error.
 */
export async function extractIngredientsJSONViaSDK({
  apiKey,
  model,
  imageUrlOrBase64,
  locale = "es-CL",
  pricingModel = model, // para calcular costo según tus tarifas por modelo
}: {
  apiKey: string;
  model: ModelKey;              // "gpt-4o" | "gpt-4o-mini"
  imageUrlOrBase64: string;     // "https://..." o "data:image/jpeg;base64,..."
  locale?: string;
  pricingModel?: ModelKey;      // por si quieres mapear a otro precio
}): Promise<VisionJSONResponse> {
  const client = new OpenAI({ apiKey });

  // Definimos un schema JSON estricto
  const schema = {
    type: "object",
    properties: {
      ingredients: {
        type: "array",
        items: { type: "string" },
        description: "Lista de ingredientes en español (Chile), limpios."
      },
      detected_allergens: {
        type: "array",
        items: { type: "string" },
        description: "Alergenos detectados explícita o implícitamente en la etiqueta."
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confianza global del resultado (0..1)."
      },
      source_language: {
        type: "string",
        description: "Idioma detectado del texto de la etiqueta, ej: 'es'."
      },
      ocr_text: {
        type: "string",
        description: "Texto crudo de la sección de ingredientes (si corresponde)."
      },
      warnings: {
        type: "array",
        items: { type: "string" },
        description: "Notas o advertencias (ambigüedades, texto borroso, etc.)."
      },
    },
    required: ["ingredients", "detected_allergens", "confidence", "source_language"],
    additionalProperties: false,
  } as const;

  const system = [
    "Eres un asistente experto en leer etiquetas de alimentos en español (Chile).",
    "Devuelve SOLAMENTE JSON que cumpla EXACTAMENTE el schema indicado.",
    "Extrae la lista de ingredientes; no incluyas cantidades ni texto decorativo.",
    "Si no encuentras ingredientes, devuelve ingredients: [].",
    "Incluye detected_allergens con posibles alérgenos si aparecen o se infieren del texto.",
    "Estima confidence entre 0 y 1.",
  ].join(" ");

  const userPrompt = [
    "Tarea: Devuelve un JSON válido según el schema.",
    "Si hay múltiples secciones, prioriza la que esté rotulada como 'Ingredientes'.",
    `Locale de referencia: ${locale}.`,
  ].join(" ");

  const res = await client.responses.create({
    model,
    input: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "input_text", text: userPrompt },
          { type: "input_image", image_url: imageUrlOrBase64 },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ingredients_schema",
        schema,
        strict: true, // obliga a cumplir el schema
      },
    },
  });

  // La salida en Responses API suele estar como texto JSON en el primer bloque de output
  const jsonText =
    res.output?.[0]?.content?.find((c: any) => c.type === "output_text")?.text ??
    (res as any).output_text ?? // fallback de conveniencia en algunos SDKs
    "";

  if (!jsonText) {
    throw new Error("Respuesta vacía o sin output_text.");
  }

  let parsed: IngredientsResult;
  try {
    parsed = JSON.parse(jsonText) as IngredientsResult;
  } catch (e) {
    // En caso raro de envolver en backticks, intenta limpiar
    const cleaned = jsonText.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned) as IngredientsResult;
  }

  const usage = res.usage as
    | { prompt_tokens: number; completion_tokens: number; total_tokens: number }
    | undefined;

  const tokensUSD = usage
    ? costFromUsage(pricingModel, {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
      })
    : undefined;

  return { data: parsed, tokensUSD, usage, raw: res };
}
````

---

### `example.ts` — uso end-to-end

```ts
// example.ts
import { extractIngredientsJSONViaSDK } from "./openai-sdk-structured";
import { estimateCost, DEFAULT_TILE_RULES } from "./cost-estimator";

async function main() {
  const API_KEY = process.env.OPENAI_API_KEY!;
  if (!API_KEY) throw new Error("OPENAI_API_KEY no está definido");

  // Imagen de prueba (elige UNA opción):
  // 1) URL pública accesible por OpenAI
  // const image = "https://tu-cdn.com/etiqueta.jpg";
  // 2) Base64 embebido
  const image = "data:image/jpeg;base64,AAA...";

  // 1) Llamada real al modelo con salida JSON estricta
  const { data, tokensUSD, usage } = await extractIngredientsJSONViaSDK({
    apiKey: API_KEY,
    model: "gpt-4o-mini", // o "gpt-4o"
    imageUrlOrBase64: image,
    locale: "es-CL",
  });

  console.log("JSON estructurado:\n", JSON.stringify(data, null, 2));
  if (usage) {
    console.log("usage:", usage);
  }
  if (tokensUSD !== undefined) {
    console.log("Costo real (calculado desde usage): USD", tokensUSD.toFixed(6));
  }

  // 2) Estimación previa (opcional) según dimensiones conocidas de la foto
  //    Esto te sirve para presupuestar por delante del request real.
  const dims = { width: 3000, height: 4000 }; // típico celular
  const estimate = estimateCost({
    model: "gpt-4o-mini",
    images: [dims],
    expectedOutputTokens: 140,          // ajuste según tu prompt/longitud deseada
    promptTextTokens: 80,               // p.ej. instrucciones system+user
    rules: { ...DEFAULT_TILE_RULES },   // puedes ajustar tileSizePx, etc.
  });

  console.log("Estimación previa:", {
    inputTokens: estimate.inputTokens,
    outputTokens: estimate.outputTokens,
    totalImageTokens: estimate.totalImageTokens,
    perImageUSD: estimate.perImageUSD,
    costUSD: estimate.costUSD,
    details: estimate.details,
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

---

## Notas rápidas

* **JSON garantizado:** usamos `response_format: { type: "json_schema", strict: true }` para obligar al modelo a devolver **sólo** JSON que cumpla el **schema**.
* **Costos:** el **costo real** lo calculas con `usage` de la respuesta → `costFromUsage(...)`.
* **Estimación previa:** `estimateCost(...)` calcula tokens y costo **antes** de llamar a la API. Es **dinámico**: puedes cambiar `tileSizePx`, `baseTokens`, `perTileTokens`, `shortSideTargetPx`, `longSideMaxPx` según evolucione la política de tokenización.
* **Backend only:** no expongas `OPENAI_API_KEY` en el front. Haz las llamadas desde tu servidor.

¿Quieres que lo empaquete como un mini repo con `tsconfig`, scripts (`dev`, `build`, `start`) y un test rápido?
