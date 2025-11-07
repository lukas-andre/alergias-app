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

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
            Resultado del Análisis
          </h1>
          {metadata && (
            <p className="text-sm text-neutral-600">
              Escaneado el{" "}
              {new Date(metadata.created_at).toLocaleString("es-CL", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
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
          tokensUSD: 0,
          usage: null,
          estimatedCost: null,
          model: "gpt-4o-mini",
          profile: profile,
          risk: risk,
        }}
        error={null}
      />

      {/* Metadata Section */}
      {metadata && (
        <section className="mt-8 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Información del Análisis
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-neutral-600">Fecha</dt>
              <dd className="text-sm text-neutral-900">
                {new Date(metadata.created_at).toLocaleDateString("es-CL", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </div>
            {metadata.model_confidence !== null && (
              <div>
                <dt className="text-sm font-medium text-neutral-600">
                  Confianza del Modelo
                </dt>
                <dd className="text-sm text-neutral-900">
                  {(metadata.model_confidence * 100).toFixed(1)}%
                </dd>
              </div>
            )}
            {metadata.label_hash && (
              <div>
                <dt className="text-sm font-medium text-neutral-600">Hash de Etiqueta</dt>
                <dd className="text-sm font-mono text-neutral-900">
                  {metadata.label_hash.substring(0, 12)}...
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </main>
  );
}
