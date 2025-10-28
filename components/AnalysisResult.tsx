"use client";

import type { IngredientsResult } from "@/lib/openai/vision";

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
        <h2>2. Resultado del análisis</h2>
        <p>La imagen se envía a OpenAI y devuelve un JSON estructurado.</p>
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
  switch (status) {
    case "idle":
      return (
        <p className="placeholder">
          Selecciona una etiqueta clara del bloque “INGREDIENTES”. Aquí verás la
          respuesta JSON procesada por OpenAI con ingredientes, alérgenos y confianza.
        </p>
      );
    case "uploading":
    case "processing":
      return (
        <div className="progress">
          <div className="spinner" aria-hidden />
          <p>{statusLabel ?? "Procesando imagen…"}</p>
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

      const { data, usage, tokensUSD, estimatedCost, model } = result;

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
              <p className="placeholder">No se detectaron ingredientes.</p>
            )}
          </section>

          <section>
            <h3>Posibles alérgenos</h3>
            {data.detected_allergens.length ? (
              <ul className="chips chips--alert">
                {data.detected_allergens.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="placeholder">Sin alérgenos detectados.</p>
            )}
          </section>

          <section className="metrics">
            <div>
              <span>Confianza</span>
              <strong>{Math.round(data.confidence * 100)}%</strong>
            </div>
            <div>
              <span>Idioma</span>
              <strong>{data.source_language}</strong>
            </div>
            {tokensUSD !== undefined ? (
              <div>
                <span>Costo estimado</span>
                <strong>
                  {tokensUSD < 0.0001
                    ? "< $0.0001"
                    : `$${tokensUSD.toFixed(4)} USD`}
                </strong>
              </div>
            ) : null}
            {model ? (
              <div>
                <span>Modelo</span>
                <strong>{model}</strong>
              </div>
            ) : null}
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

          <details className="raw-text">
            <summary>Texto crudo detectado</summary>
            <pre>{data.ocr_text || "Sin texto disponible."}</pre>
          </details>

          {usage ? (
            <details className="raw-text">
              <summary>Uso de tokens</summary>
              <pre>{JSON.stringify(usage, null, 2)}</pre>
            </details>
          ) : null}

          {estimatedCost ? (
            <details className="raw-text">
              <summary>Estimación previa</summary>
              <pre>{JSON.stringify(estimatedCost, null, 2)}</pre>
            </details>
          ) : null}
        </div>
      );
    default:
      return null;
  }
}
