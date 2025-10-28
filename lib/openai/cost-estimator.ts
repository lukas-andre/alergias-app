export type ModelKey = "gpt-4o" | "gpt-4o-mini";

export interface PricesPerMTok {
  input: number;
  output: number;
}

export const PRICES_USD_PER_MTOK: Record<ModelKey, PricesPerMTok> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

export interface ImageSpec {
  width: number;
  height: number;
}

export interface TileRules {
  tileSizePx: number;
  baseTokens: number;
  perTileTokens: number;
  shortSideTargetPx: number;
  longSideMaxPx: number;
  noUpscale?: boolean;
}

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

export function normalizeAndCountTiles(
  img: ImageSpec,
  rules: TileRules = DEFAULT_TILE_RULES,
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
    const scale = rules.shortSideTargetPx / shortSide;
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  }

  const tilesX = Math.ceil(w / rules.tileSizePx);
  const tilesY = Math.ceil(h / rules.tileSizePx);
  const tiles = tilesX * tilesY;
  const imageTokens = rules.baseTokens + rules.perTileTokens * tiles;

  return {
    scaledWidth: w,
    scaledHeight: h,
    tilesX,
    tilesY,
    tiles,
    imageTokens,
  };
}

export interface CostEstimateInput {
  model: ModelKey;
  images: ImageSpec[];
  promptTextTokens?: number;
  expectedOutputTokens?: number;
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

  if (!prices) {
    throw new Error(`Missing pricing information for model ${model}`);
  }

  const details = images.map((image, idx) => {
    const tileResult = normalizeAndCountTiles(image, rules);
    return { idx, tiles: tileResult.tiles, imageTokens: tileResult.imageTokens };
  });

  const totalImageTokens = details.reduce(
    (accumulator, { imageTokens }) => accumulator + imageTokens,
    0,
  );

  const promptTokensValue = Math.max(0, Math.floor(promptTextTokens));
  const outputTokens = Math.max(0, Math.floor(expectedOutputTokens));
  const inputTokens = promptTokensValue + totalImageTokens;

  const costUSD =
    ((inputTokens / 1_000_000) * prices.input) +
    ((outputTokens / 1_000_000) * prices.output);

  const perImageUSD = details.length > 0 ? costUSD / details.length : 0;

  return {
    totalImageTokens,
    promptTextTokens: promptTokensValue,
    outputTokens,
    inputTokens,
    costUSD,
    perImageUSD,
    details,
  };
}

export function costFromUsage(
  model: ModelKey,
  usage: { prompt_tokens: number; completion_tokens: number },
  pricesOverride?: Partial<Record<ModelKey, PricesPerMTok>>,
): number {
  const pricesMap = { ...PRICES_USD_PER_MTOK, ...pricesOverride };
  const prices = pricesMap[model];

  if (!prices) {
    throw new Error(`Missing pricing information for model ${model}`);
  }

  const inputCost = (usage.prompt_tokens / 1_000_000) * prices.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * prices.output;

  return inputCost + outputCost;
}
