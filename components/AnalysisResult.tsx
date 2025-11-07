"use client";

import type { IngredientsResult } from "@/lib/openai/vision";
import type { ProfilePayload, RiskAssessment, RiskReason } from "@/lib/risk/types";
import { TrafficLightDisplay } from "@/components/scan/TrafficLightDisplay";
import {
  humanizeRiskReason,
  confidenceToQuality,
} from "@/lib/utils/humanize-copy";

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
}

export function AnalysisResult({
  error,
  result,
  status,
  statusLabel,
}: AnalysisResultProps) {
  return (
    <section className="ocr-result">
      <header>
        <h2>Resultado del Análisis</h2>
        <p>Revisamos cada ingrediente y te mostramos lo que encontramos.</p>
      </header>

      <div className="ocr-body">
        {renderBody({ error, result, status, statusLabel })}
      </div>
    </section>
  );
}

function renderBody({
  error,
  result,
  status,
  statusLabel,
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
        <p className="placeholder">
          Selecciona una foto clara de la tabla de ingredientes. Aquí verás los
          resultados del análisis.
        </p>
      );
    case "uploading":
    case "processing":
      return (
        <div className="progress">
          <div className="spinner" aria-hidden />
          <p>{statusLabel ?? "Analizando etiqueta..."}</p>
        </div>
      );
    case "failed":
      return (
        <div className="error">
          <strong>No pudimos analizar la imagen.</strong>
          <p>{error ?? "Intenta nuevamente con una foto más nítida."}</p>
        </div>
      );
    case "succeeded":
      if (!result) return null;

      const { data, usage, tokensUSD, estimatedCost, model, risk } = result;

      return (
        <div className="success">
          <section>
            <h3>Ingredientes</h3>
            {data.ingredients.length ? (
              <ul className="chips">
                {data.ingredients.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="placeholder">No encontramos ingredientes en la imagen.</p>
            )}
          </section>

          <section>
            <h3>⚠️ Alérgenos Detectados</h3>
            {data.detected_allergens.length ? (
              <ul className="chips chips--alert">
                {data.detected_allergens.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="placeholder">✅ No detectamos alérgenos conocidos</p>
            )}
          </section>

          {risk ? (
            <TrafficLightDisplay
              risk={risk.risk}
              reasons={risk.reasons.map((reason) =>
                humanizeRiskReason(formatReason(reason), reason.allergen)
              )}
              allergens={data.detected_allergens}
              className="mt-6"
            />
          ) : null}

          <section className="metrics">
            <div>
              <span>Calidad del escaneo</span>
              <strong>
                {confidenceToQuality(data.confidence).emoji}{" "}
                {confidenceToQuality(data.confidence).label}
              </strong>
            </div>
          </section>

          {data.warnings.length ? (
            <section className="traces">
              <h4>Advertencias</h4>
              <ul>
                {data.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      );
    default:
      return null;
  }
}
