/**
 * Scan Result Detail Page
 *
 * Displays full analysis for a saved extraction with:
 * - Semáforo (traffic light) risk assessment
 * - Evidence (highlighted tokens)
 * - E-number policies
 * - Actions (Guardar, Ver alternativas, Pedir verificación)
 * - Metadata (date, hash, model, confidence)
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisResult } from "@/components/AnalysisResult";
import { useSupabase } from "@/components/SupabaseProvider";
import { getExtractionById } from "@/lib/supabase/queries/extractions";
import { evaluateRisk } from "@/lib/risk/evaluate";
import {
  humanizeTimestamp,
  confidenceToQuality,
} from "@/lib/utils/humanize-copy";
import type { IngredientsResult } from "@/lib/openai/vision";
import type { ProfilePayload, RiskAssessment } from "@/lib/risk/types";

export default function ScanResultPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const extractionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<IngredientsResult | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    created_at: string;
    label_hash: string | null;
    model_confidence: number | null;
  } | null>(null);

  useEffect(() => {
    async function loadExtraction() {
      try {
        setLoading(true);
        setError(null);

        // Check auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login?redirect=/scan/result/" + extractionId);
          return;
        }

        // Fetch extraction + tokens
        const result = await getExtractionById(
          supabase,
          extractionId,
          session.user.id
        );

        if (!result) {
          setError("Análisis no encontrado o no tienes permiso para verlo.");
          return;
        }

        // Reconstruct IngredientsResult from raw_json
        const rawJson = result.extraction.raw_json as any;
        if (!rawJson) {
          setError("Datos de análisis corruptos.");
          return;
        }

        const ingredientsResult: IngredientsResult = {
          ingredients: rawJson.ingredients || [],
          detected_allergens: rawJson.detected_allergens || [],
          confidence: rawJson.confidence || 0,
          source_language: rawJson.source_language || "es-CL",
          ocr_text: rawJson.ocr_text || "",
          warnings: rawJson.warnings || [],
        };

        setAnalysis(ingredientsResult);

        // Set image base64 (if available)
        setImageBase64(result.extraction.image_base64 || null);

        // Set metadata
        setMetadata({
          created_at: result.extraction.created_at,
          label_hash: result.extraction.label_hash,
          model_confidence: result.extraction.model_confidence,
        });

        // Fetch user profile for risk assessment
        try {
          const { data: payload, error: rpcError } = await supabase.rpc(
            "get_profile_payload",
            { p_user_id: session.user.id }
          );

          if (!rpcError && payload) {
            const profilePayload = payload as unknown as ProfilePayload;
            setProfile(profilePayload);
            setRisk(evaluateRisk(ingredientsResult, profilePayload));
          }
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);
          // Continue without risk assessment
        }
      } catch (err) {
        console.error("Error loading extraction:", err);
        setError("Error al cargar el análisis. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    loadExtraction();
  }, [supabase, router, extractionId]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-neutral-600">Cargando análisis...</p>
        </div>
      </main>
    );
  }

  if (error || !analysis) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
          <p className="text-danger text-lg mb-4">{error || "Análisis no encontrado"}</p>
          <Link href="/scan">
            <Button variant="outline">Volver al escáner</Button>
          </Link>
        </div>
      </main>
    );
  }

  // Reconstruct data URL from base64 (if available)
  // TODO: Migrate to Supabase Storage - use source_ref for storage URL instead
  const previewUrl = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-teal-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between pb-4 border-b border-neutral-200">
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
              Análisis de Etiqueta
            </h1>
            {metadata && (
              <p className="text-sm text-neutral-600">
                {humanizeTimestamp(metadata.created_at)}
              </p>
            )}
          </div>
          <Link href="/scan">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </Link>
        </header>

        {/* Analysis Result */}
        <AnalysisResult
          status="succeeded"
          result={{
            data: analysis,
            tokensUSD: undefined,
            usage: undefined,
            estimatedCost: null,
            model: undefined,
            profile: profile,
            risk: risk,
          }}
          error={null}
          previewUrl={previewUrl}
        />

        {/* Metadata Section */}
        {metadata && (
          <section className="mt-8 p-6 bg-white rounded-lg border border-neutral-200 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Información del Análisis
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-neutral-600">Escaneado</dt>
                <dd className="text-sm text-neutral-900">
                  {humanizeTimestamp(metadata.created_at)}
                </dd>
              </div>
              {metadata.model_confidence !== null && (
                <div>
                  <dt className="text-sm font-medium text-neutral-600">
                    Calidad del escaneo
                  </dt>
                  <dd className="text-sm text-neutral-900">
                    {confidenceToQuality(metadata.model_confidence).emoji}{" "}
                    {confidenceToQuality(metadata.model_confidence).label}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}
      </div>
    </main>
  );
}
