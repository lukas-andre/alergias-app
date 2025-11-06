"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AnalysisResult,
  type AnalysisPayload,
  type AnalysisStatus,
} from "@/components/AnalysisResult";
import { ImagePicker } from "@/components/ImagePicker";

type RequestJob = {
  abortController: AbortController;
};

export default function ScanPage() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [result, setResult] = useState<AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobId = useRef(0);
  const lastObjectUrl = useRef<string | null>(null);
  const currentJob = useRef<RequestJob | null>(null);

  const abortCurrentJob = useCallback(() => {
    const job = currentJob.current;
    if (job) {
      job.abortController.abort();
      currentJob.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setStatus("idle");
    setStatusLabel(null);
    setResult(null);
    setError(null);
  }, []);

  const revokePreview = useCallback(() => {
    if (lastObjectUrl.current) {
      URL.revokeObjectURL(lastObjectUrl.current);
      lastObjectUrl.current = null;
    }
  }, []);

  const loadImageDimensions = useCallback(
    (file: File) =>
      new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new window.Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
          resolve({
            width: image.naturalWidth,
            height: image.naturalHeight,
          });
          URL.revokeObjectURL(objectUrl);
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("No pudimos leer la imagen."));
        };
        image.src = objectUrl;
      }),
    [],
  );

  const handleSelect = useCallback(
    async (file: File) => {
      jobId.current += 1;
      const runId = jobId.current;

      abortCurrentJob();

      resetState();
      setStatus("uploading");
      setStatusLabel("Cargando imagen…");

      revokePreview();
      const objectUrl = URL.createObjectURL(file);
      lastObjectUrl.current = objectUrl;
      setPreviewUrl(objectUrl);

      try {
        const { width, height } = await loadImageDimensions(file);
        if (jobId.current !== runId) return;

        abortCurrentJob();
        const controller = new AbortController();
        currentJob.current = { abortController: controller };

        setStatus("processing");
        setStatusLabel("Consultando OpenAI…");

        const formData = new FormData();
        formData.append("image", file);
        formData.append("width", String(width));
        formData.append("height", String(height));

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (jobId.current !== runId) return;

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Error desconocido al llamar a OpenAI.");
        }

        const payload = (await response.json()) as AnalysisPayload;
        if (jobId.current !== runId) return;

        setResult(payload);
        setStatus("succeeded");
        setStatusLabel("Resultado listo");
        abortCurrentJob();
      } catch (cause) {
        if (jobId.current !== runId) return;
        console.error(cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Hubo un problema procesando la imagen.",
        );
        setStatus("failed");
        setStatusLabel(null);
        abortCurrentJob();
      }
    },
    [abortCurrentJob, loadImageDimensions, resetState, revokePreview],
  );

  const handleClear = useCallback(() => {
    jobId.current += 1;
    abortCurrentJob();
    revokePreview();
    setPreviewUrl(null);
    resetState();
  }, [abortCurrentJob, resetState, revokePreview]);

  useEffect(() => {
    return () => {
      abortCurrentJob();
      revokePreview();
    };
  }, [abortCurrentJob, revokePreview]);

  return (
    <main className="scan-page">
      {/* Header with Navigation */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Inicio
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="outline" size="sm" className="gap-2">
            <UserCircle2 className="w-4 h-4" />
            Editar Perfil
          </Button>
        </Link>
      </header>

      <div className="scan-intro">
        <h1>Escanea ingredientes</h1>
        <p>
          Captura la etiqueta del producto y obtén la lista estructurada de
          ingredientes mediante la API de OpenAI. Nada se guarda en servidores propios.
        </p>
      </div>

      <div className="scan-grid">
        <ImagePicker
          disabled={status === "processing" || status === "uploading"}
          onClear={handleClear}
          onSelect={handleSelect}
          previewUrl={previewUrl}
        />
        <AnalysisResult
          error={error}
          result={result}
          status={status}
          statusLabel={statusLabel}
        />
      </div>
    </main>
  );
}
