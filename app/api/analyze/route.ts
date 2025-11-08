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
import { extractIngredientsViaSDK } from "@/lib/openai/vision";
import { fetchUserProfile } from "@/lib/supabase/queries/profile";
import { fetchENumberPolicies } from "@/lib/supabase/queries/enumbers";
import { buildResultViewModel, type ResultViewModel } from "@/lib/risk/view-model";
import { calculateLabelHash } from "@/lib/hash/label-hash";
import {
  findCachedExtraction,
  insertExtraction,
  insertTokens,
} from "@/lib/supabase/queries/extractions";

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

    // Calculate hash for caching/deduplication
    const labelHash = calculateLabelHash(buffer);

    // Get user session and check cache
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let extractionId: string | null = null;
    let fromCache = false;

    // Check cache if user is authenticated
    if (!authError && user) {
      const cached = await findCachedExtraction(supabase, user.id, labelHash);
      if (cached && cached.raw_json) {
        // Return cached result - regenerate view model with current profile
        const cachedData = cached.raw_json as any;
        let profilePayload: ProfilePayload | null = null;
        let viewModel: ResultViewModel | null = null;

        try {
          profilePayload = await fetchUserProfile(supabase, user.id);

          if (profilePayload && Array.isArray(cachedData.mentions)) {
            // Regenerate with current profile
            const uniqueENumbers: string[] = Array.from(
              new Set(
                cachedData.mentions.flatMap((m: any) => {
                  const enumbers = m.enumbers;
                  return Array.isArray(enumbers) ? enumbers.filter((e): e is string => typeof e === 'string') : [];
                })
              )
            );

            const eNumberPolicies = await fetchENumberPolicies(
              supabase,
              user.id,
              uniqueENumbers
            );

            const riskV2 = evaluateRisk(cachedData, profilePayload, eNumberPolicies);

            viewModel = buildResultViewModel({
              analysis: cachedData,
              risk: riskV2,
              profile: profilePayload,
              imageBase64: cached.image_base64 || undefined,
              model,
              costUSD: 0,
              scannedAt: cached.created_at,
            });
          }
        } catch (cause) {
          console.error("Error regenerating cached result:", cause);
        }

        return NextResponse.json({
          data: cachedData,
          tokensUSD: 0, // Cached, no cost
          usage: null,
          estimatedCost: null,
          model,
          profile: profilePayload,
          viewModel,
          extraction_id: cached.id,
          from_cache: true,
        });
      }
    }

    // Not in cache, call OpenAI
    const response = await extractIngredientsViaSDK({
      apiKey,
      imageUrlOrBase64: dataUrl,
      model,
    });

    const { data: dataV2, tokensUSD, usage } = response;

    let profilePayload: ProfilePayload | null = null;
    let viewModel: ResultViewModel | null = null;

    // Get profile and evaluate risk
    try {
      if (!authError && user) {
        profilePayload = await fetchUserProfile(supabase, user.id);

        if (profilePayload) {
          // Extract E-numbers from mentions
          const uniqueENumbers: string[] = Array.from(
            new Set(dataV2.mentions.flatMap((m) => m.enumbers))
          );

          // Get E-number policies using helper
          const eNumberPolicies = await fetchENumberPolicies(
            supabase,
            user.id,
            uniqueENumbers
          );

          // Evaluate risk V2
          const riskV2 = evaluateRisk(dataV2, profilePayload, eNumberPolicies);

          // Build ViewModel
          viewModel = buildResultViewModel({
            analysis: dataV2,
            risk: riskV2,
            profile: profilePayload,
            imageBase64: base64,
            model,
            costUSD: tokensUSD,
          });
        }
      }
    } catch (cause) {
      console.error("Error obteniendo perfil de Supabase:", cause);
    }

    // Persist extraction if user is authenticated
    if (!authError && user) {
      try {
        const extraction = await insertExtraction(supabase, {
          user_id: user.id,
          origin: "label",
          raw_text: dataV2.ocr_text,
          raw_json: dataV2 as any,
          ocr_confidence: dataV2.quality.confidence,
          vision_confidence: dataV2.quality.confidence,
          model_confidence: dataV2.quality.confidence,
          final_confidence: viewModel?.verdict.confidence ?? dataV2.quality.confidence,
          label_hash: labelHash,
          source_ref: null,
          image_base64: base64,
        });

        extractionId = extraction.id;

        // Tokenize mentions
        const tokens = [];
        for (const mention of dataV2.mentions) {
          tokens.push({
            extraction_id: extractionId,
            surface: mention.surface,
            canonical: mention.canonical,
            type: mention.type as any,
            confidence: dataV2.quality.confidence,
            span: `[${mention.offset.start},${mention.offset.end})`,
            allergen_id: null, // TODO: Map to allergen_types
            e_code: mention.enumbers[0] || null,
          });
        }

        if (tokens.length > 0) {
          await insertTokens(supabase, tokens);
        }
      } catch (persistError) {
        console.error("Error persisting extraction:", persistError);
      }
    }

    const estimatedCost =
      width && height
        ? estimateCost({
            model,
            images: [{ width, height }],
            expectedOutputTokens: 200,
            promptTextTokens: 120,
            rules: DEFAULT_TILE_RULES,
          })
        : null;

    return NextResponse.json({
      data: dataV2,
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
      viewModel,
      extraction_id: extractionId,
      from_cache: false,
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
