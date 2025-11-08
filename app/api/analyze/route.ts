import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import {
  DEFAULT_TILE_RULES,
  estimateCost,
  type ModelKey,
} from "@/lib/openai/cost-estimator";
import { evaluateRisk } from "@/lib/risk/evaluate";
import { evaluateRiskV2 } from "@/lib/risk/evaluate-v2";
import type { ProfilePayload, RiskAssessment } from "@/lib/risk/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { extractIngredientsJSONViaSDK, extractIngredientsJSONV2ViaSDK } from "@/lib/openai/vision";
import { buildResultViewModel, type ResultViewModel } from "@/lib/risk/view-model";
import { calculateLabelHash } from "@/lib/hash/label-hash";
import {
  findCachedExtraction,
  insertExtraction,
  insertTokens,
  normalizeTokenText,
} from "@/lib/supabase/queries/extractions";

export const runtime = "nodejs";

function parseDimension(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function POST(request: Request) {
  try {
    // Check if V2 API is requested
    const url = new URL(request.url);
    const useV2 = url.searchParams.get("v") === "2";

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
        // Return cached result
        const cachedData = cached.raw_json as any;
        let profilePayload: ProfilePayload | null = null;
        let riskAssessment: RiskAssessment | null = null;

        try {
          const { data: payload, error: rpcError } = await supabase.rpc(
            "get_profile_payload",
            { p_user_id: user.id }
          );

          if (!rpcError && payload) {
            profilePayload = payload as unknown as ProfilePayload;
            riskAssessment = evaluateRisk(cachedData, profilePayload);
          }
        } catch (cause) {
          console.error("Error obteniendo perfil de Supabase:", cause);
        }

        return NextResponse.json({
          data: cachedData,
          tokensUSD: 0, // Cached, no cost
          usage: null,
          estimatedCost: null,
          model,
          profile: profilePayload,
          risk: riskAssessment,
          extraction_id: cached.id,
          from_cache: true,
        });
      }
    }

    // Not in cache, call OpenAI
    // V2 Path: Use structured mentions
    if (useV2) {
      const { data: dataV2, tokensUSD, usage } = await extractIngredientsJSONV2ViaSDK({
        apiKey,
        imageUrlOrBase64: dataUrl,
        model,
      });

      let profilePayload: ProfilePayload | null = null;
      let viewModel: ResultViewModel | null = null;

      // Get profile and evaluate risk
      try {
        if (!authError && user) {
          const { data: payload, error: rpcError } = await supabase.rpc("get_profile_payload", {
            p_user_id: user.id,
          });

          if (!rpcError && payload) {
            profilePayload = payload as unknown as ProfilePayload;

            // Extract E-numbers from mentions
            const uniqueENumbers = Array.from(
              new Set(dataV2.mentions.flatMap((m) => m.enumbers))
            );

            // Get E-number policies
            type ENumberPolicy = {
              code: string;
              policy: "allow" | "warn" | "block" | "unknown";
              name_es?: string;
              linked_allergens?: string[];
              matched_allergens?: string[];
              residual_protein_risk?: boolean;
              reason?: string;
              likely_origins?: string[];
              exists?: boolean;
            };

            const eNumberPolicies: ENumberPolicy[] = [];

            for (const code of uniqueENumbers) {
              try {
                const { data: policyData } = await supabase.rpc("decide_e_number", {
                  p_user_id: user.id,
                  p_code: code,
                });

                if (policyData && typeof policyData === 'object') {
                  eNumberPolicies.push(policyData as ENumberPolicy);
                }
              } catch (eNumError) {
                console.error(`Error checking E-number ${code}:`, eNumError);
              }
            }

            // Evaluate risk V2
            const riskV2 = evaluateRiskV2(dataV2, profilePayload, eNumberPolicies);

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
        v2: true,
      });
    }

    // V1 Path (Legacy)
    const { data, tokensUSD, usage } = await extractIngredientsJSONViaSDK({
      apiKey,
      imageUrlOrBase64: dataUrl,
      model,
    });

    let profilePayload: ProfilePayload | null = null;
    let riskAssessment: RiskAssessment | null = null;

    // Get profile and evaluate risk
    try {
      if (!authError && user) {
        const { data: payload, error: rpcError } = await supabase.rpc("get_profile_payload", {
          p_user_id: user.id,
        });

        if (!rpcError && payload) {
          profilePayload = payload as unknown as ProfilePayload;

          // Parse E-numbers from ingredients
          const eNumbers: string[] = [];
          const eNumberRegex = /E\d{3,4}/gi;

          for (const ingredient of data.ingredients) {
            const matches = ingredient.match(eNumberRegex);
            if (matches) {
              eNumbers.push(...matches.map(code => code.toUpperCase()));
            }
          }

          // Get unique E-numbers
          const uniqueENumbers = Array.from(new Set(eNumbers));

          // Type for decide_e_number RPC response
          type ENumberPolicy = {
            code: string;
            policy: "allow" | "warn" | "block" | "unknown";
            name_es?: string;
            linked_allergens?: string[];
            matched_allergens?: string[];
            residual_protein_risk?: boolean;
            reason?: string;
            likely_origins?: string[];
            exists?: boolean;
          };

          // Call decide_e_number for each E-code
          const eNumberPolicies: ENumberPolicy[] = [];

          for (const code of uniqueENumbers) {
            try {
              const { data: policyData } = await supabase.rpc("decide_e_number", {
                p_user_id: user.id,
                p_code: code,
              });

              if (policyData && typeof policyData === 'object') {
                eNumberPolicies.push(policyData as ENumberPolicy);
              }
            } catch (eNumError) {
              console.error(`Error checking E-number ${code}:`, eNumError);
            }
          }

          // Evaluate risk with E-number policies
          riskAssessment = evaluateRisk(data, profilePayload, eNumberPolicies);
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
          raw_text: data.ocr_text,
          raw_json: data as any,
          ocr_confidence: data.confidence,
          vision_confidence: data.confidence,
          model_confidence: data.confidence,
          final_confidence: riskAssessment?.confidence ?? data.confidence,
          label_hash: labelHash,
          source_ref: null, // TODO: Migrate to Supabase Storage bucket (label-images)
          image_base64: base64, // TEMPORARY: Store as base64 until Storage migration
        });

        extractionId = extraction.id;

        // Tokenize ingredients and allergens
        const tokens = [];

        // Tokenize ingredients
        for (const ingredient of data.ingredients) {
          tokens.push({
            extraction_id: extractionId,
            surface: ingredient,
            canonical: normalizeTokenText(ingredient),
            type: "ingredient" as const,
            confidence: data.confidence,
            span: null,
            allergen_id: null,
            e_code: null,
          });
        }

        // Tokenize detected allergens
        for (const allergen of data.detected_allergens) {
          // Try to match allergen to allergen_types
          const { data: allergenTypes } = await supabase
            .from("allergen_types")
            .select("id, key, name_es, synonyms")
            .or(`name_es.ilike.%${allergen}%,synonyms.cs.{${allergen}}`);

          const allergenId = allergenTypes?.[0]?.id || null;

          tokens.push({
            extraction_id: extractionId,
            surface: allergen,
            canonical: normalizeTokenText(allergen),
            type: "allergen" as const,
            confidence: data.confidence,
            span: null,
            allergen_id: allergenId,
            e_code: null,
          });
        }

        // Insert tokens in batch
        if (tokens.length > 0) {
          await insertTokens(supabase, tokens);
        }
      } catch (persistError) {
        console.error("Error persisting extraction:", persistError);
        // Non-blocking - continue even if persistence fails
      }
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
