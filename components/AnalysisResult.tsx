"use client";

/* eslint-disable @next/next/no-img-element */

import type { IngredientsResult } from "@/lib/openai/vision";
import type { ProfilePayload, RiskAssessment, RiskReason } from "@/lib/risk/types";
import { TrafficLightDisplay } from "@/components/scan/TrafficLightDisplay";
import {
  humanizeRiskReason,
  confidenceToQuality,
} from "@/lib/utils/humanize-copy";
import { Loader2, AlertTriangle, Sparkles, ImageIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type AnalysisStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "succeeded"
  | "failed";

interface TokensUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface EstimatedCost {
  costUSD: number;
  perImageUSD: number;
  totalImageTokens: number;
  inputTokens: number;
  outputTokens: number;
}

export interface AnalysisPayload {
  data: IngredientsResult;
  tokensUSD?: number;
  usage?: TokensUsage;
  estimatedCost?: EstimatedCost | null;
  model?: string;
  profile?: ProfilePayload | null;
  risk?: RiskAssessment | null;
}

interface AnalysisResultProps {
  error?: string | null;
  result: AnalysisPayload | null;
  status: AnalysisStatus;
  statusLabel?: string | null;
  previewUrl?: string | null;
}

export function AnalysisResult({
  error,
  result,
  status,
  statusLabel,
  previewUrl,
}: AnalysisResultProps) {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-2 justify-center md:justify-start">
          <Sparkles className="w-7 h-7 text-primary" />
          Resultado del Análisis
        </h2>
        <p className="text-base text-neutral-600">
          Revisamos cada ingrediente y te mostramos lo que encontramos.
        </p>
      </div>

      {renderBody({ error, result, status, statusLabel, previewUrl })}
    </div>
  );
}

/**
 * Normalize allergen key for matching
 * Same logic as lib/risk/evaluate.ts to ensure consistency
 */
function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function renderBody({
  error,
  result,
  status,
  statusLabel,
  previewUrl,
}: AnalysisResultProps) {
  const formatRiskLabel = (level: RiskAssessment["risk"]) => {
    switch (level) {
      case "high":
        return "Alto";
      case "medium":
        return "Medio";
      case "low":
      default:
        return "Bajo";
    }
  };

  const formatReason = (reason: RiskReason) => {
    switch (reason.type) {
      case "contains":
        return `Ingrediente identificado${reason.allergen ? ` (${reason.allergen})` : ""}`;
      case "trace":
        return `Posible traza${reason.allergen ? ` (${reason.allergen})` : ""}`;
      case "same_line":
        return "Misma línea de producción";
      case "e_number_uncertain":
        return "E-number incierto";
      case "low_confidence":
        return "Confianza del modelo baja";
      case "no_profile":
      default:
        return "Perfil incompleto";
    }
  };

  switch (status) {
    case "idle":
      return (
        <Card className="border-2 border-dashed border-neutral-300 bg-neutral-50">
          <CardContent className="py-12">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <p className="text-base text-neutral-600 max-w-md mx-auto">
                Selecciona una foto clara de la tabla de ingredientes. Aquí verás los
                resultados del análisis.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    case "uploading":
    case "processing":
      return (
        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-base text-neutral-700 font-medium">
                {statusLabel ?? "Analizando etiqueta..."}
              </p>
            </div>
          </CardContent>
        </Card>
      );
    case "failed":
      return (
        <Card className="border-2 border-danger bg-danger-soft">
          <CardContent className="py-8">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-danger-dark mb-2">
                No pudimos analizar la imagen
              </h3>
              <p className="text-base text-neutral-700">
                {error ?? "Intenta nuevamente con una foto más nítida."}
              </p>
            </div>
          </CardContent>
        </Card>
      );
    case "succeeded":
      if (!result) return null;

      const { data, usage, tokensUSD, estimatedCost, model, risk, profile } = result;
      const quality = confidenceToQuality(data.confidence);

      // Create set of normalized user allergen keys for matching
      const userAllergenKeys = new Set<string>();
      if (profile?.allergens) {
        profile.allergens.forEach((allergen) => {
          userAllergenKeys.add(normalizeKey(allergen.key));
        });
      }

      return (
        <div className="space-y-6">
          {/* Photo Display Section */}
          {previewUrl && (
            <Card className="border-neutral-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-neutral-900">
                  Etiqueta Escaneada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-neutral-200 bg-neutral-50">
                  <img
                    src={previewUrl}
                    alt="Etiqueta escaneada"
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Traffic Light Risk Assessment - MOST PROMINENT */}
          {risk && (
            <TrafficLightDisplay
              risk={risk.risk}
              reasons={risk.reasons.map((reason) =>
                humanizeRiskReason(formatReason(reason), reason.allergen)
              )}
              allergens={data.detected_allergens}
            />
          )}

          {/* Allergens Section */}
          <Card className="border-2 border-danger-200 bg-danger-soft shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-danger-dark flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alérgenos Detectados
              </CardTitle>
              <CardDescription className="text-danger-dark/80">
                {profile
                  ? "🔴 Rojo = Match con tu perfil | 🟡 Amarillo = Informativo (no afecta tu perfil)"
                  : "Alérgenos encontrados en el análisis"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.detected_allergens.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.detected_allergens.map((item, index) => {
                    // Check if this allergen matches user profile
                    const isUserAllergen = userAllergenKeys.has(normalizeKey(item));

                    return (
                      <Badge
                        key={`${item}-${index}`}
                        variant={isUserAllergen ? "destructive" : "default"}
                        className={
                          isUserAllergen
                            ? "bg-danger text-white px-3 py-1.5 text-sm font-semibold"
                            : "bg-warning text-warning-dark px-3 py-1.5 text-sm font-semibold border-warning"
                        }
                      >
                        {item}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-accent-fresh-dark font-medium">
                  ✅ No detectamos alérgenos conocidos
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ingredients Section */}
          <Card className="border-neutral-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-neutral-900">
                Ingredientes
              </CardTitle>
              <CardDescription>
                Ingredientes detectados en la etiqueta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.ingredients.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.ingredients.map((item, index) => (
                    <Badge
                      key={`${item}-${index}`}
                      variant="outline"
                      className="bg-neutral-50 text-neutral-700 border-neutral-300 px-3 py-1 text-sm"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-600">
                  No encontramos ingredientes en la imagen.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Warnings Section */}
          {data.warnings.length > 0 && (
            <Card className="border-warning-200 bg-warning-soft shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-warning-dark">
                  Advertencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.warnings.map((warning, index) => (
                    <li
                      key={`${warning}-${index}`}
                      className="flex items-start gap-2 text-sm text-neutral-800"
                    >
                      <span className="text-warning mt-0.5">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      );
    default:
      return null;
  }
}
