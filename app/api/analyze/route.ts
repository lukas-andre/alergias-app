import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import {
  DEFAULT_TILE_RULES,
  estimateCost,
  type ModelKey,
} from "@/lib/openai/cost-estimator";
import { evaluateRisk } from "@/lib/risk/evaluate";
import type { ProfilePayload, RiskAssessment } from "@/lib/risk/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

    let profilePayload: ProfilePayload | null = null;
    let riskAssessment: RiskAssessment | null = null;

    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!authError && user) {
        const { data: payload, error: rpcError } = await supabase.rpc("get_profile_payload", {
          p_user_id: user.id,
        });

        if (!rpcError && payload) {
          profilePayload = payload as unknown as ProfilePayload;
          riskAssessment = evaluateRisk(data, profilePayload);
        }
      }
    } catch (cause) {
      console.error("Error obteniendo perfil de Supabase:", cause);
    }

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
      profile: profilePayload,
      risk: riskAssessment,
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
