import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import {
  DEFAULT_TILE_RULES,
  estimateCost,
  type ModelKey,
} from "@/lib/openai/cost-estimator";
import { extractIngredientsJSONViaSDK } from "@/lib/openai/vision";

export const runtime = "nodejs";

function parseDimension(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Imagen no proporcionada." },
        { status: 400 },
      );
    }

    const width = parseDimension(formData.get("width"));
    const height = parseDimension(formData.get("height"));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY no está configurado." },
        { status: 500 },
      );
    }

    const modelEnv = process.env.OPENAI_MODEL as ModelKey | undefined;
    const model: ModelKey = modelEnv ?? "gpt-4o-mini";

    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = image.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const { data, tokensUSD, usage } = await extractIngredientsJSONViaSDK({
      apiKey,
      imageUrlOrBase64: dataUrl,
      model,
    });

    const estimatedCost =
      width && height
        ? estimateCost({
            model,
            images: [{ width, height }],
            expectedOutputTokens: 140,
            promptTextTokens: 80,
            rules: DEFAULT_TILE_RULES,
          })
        : null;

    return NextResponse.json({
      data,
      tokensUSD,
      usage,
      estimatedCost: estimatedCost
        ? {
            costUSD: estimatedCost.costUSD,
            perImageUSD: estimatedCost.perImageUSD,
            totalImageTokens: estimatedCost.totalImageTokens,
            inputTokens: estimatedCost.inputTokens,
            outputTokens: estimatedCost.outputTokens,
          }
        : null,
      model,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error inesperado al procesar la imagen.",
      },
      { status: 500 },
    );
  }
}
