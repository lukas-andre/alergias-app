"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AnalysisResult,
  type AnalysisPayload,
  type AnalysisStatus,
} from "@/components/AnalysisResult";
import { ImagePicker } from "@/components/ImagePicker";
import { Stepper } from "@/components/scan/Stepper";
import { CropperDialog } from "@/components/scan/CropperDialog";
import { ProfileSummary } from "@/components/scan/ProfileSummary";
import { ScanTips } from "@/components/scan/ScanTips";
import { RecentScans } from "@/components/scan/RecentScans";
import { ResultViewModelRenderer } from "@/components/scan/ResultViewModelRenderer";
import { useSupabase } from "@/components/SupabaseProvider";
import type { ProfilePayload } from "@/lib/risk/types";
import type { ResultViewModel } from "@/lib/risk/view-model";

type ScanStep = "upload" | "adjust" | "analyze";

type RequestJob = {
  abortController: AbortController;
};

export default function ScanPage() {
  const router = useRouter();
  const supabase = useSupabase();

  // Flow state
  const [step, setStep] = useState<ScanStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [legibility, setLegibility] = useState<"low" | "medium" | "high">("medium");

  // Analysis state
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // V2 result state
  const [viewModelResult, setViewModelResult] = useState<ResultViewModel | null>(null);
  const [extractionId, setExtractionId] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState<ProfilePayload | null>(null);

  const jobId = useRef(0);
  const lastObjectUrl = useRef<string | null>(null);
  const currentJob = useRef<RequestJob | null>(null);

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.rpc("get_profile_payload", {
          p_user_id: user.id,
        });

        if (!error && data) {
          setProfile(data as unknown as ProfilePayload);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    }

    loadProfile();
  }, [supabase]);

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
    setViewModelResult(null);
    setExtractionId(null);
  }, []);

  const revokePreview = useCallback(() => {
    if (lastObjectUrl.current) {
      URL.revokeObjectURL(lastObjectUrl.current);
      lastObjectUrl.current = null;
    }
  }, []);

  const loadImageDimensions = useCallback(
    (blob: Blob) =>
      new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new window.Image();
        const objectUrl = URL.createObjectURL(blob);
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
    []
  );

  // Step 1: User selects file
  const handleFileSelect = useCallback(
    (file: File) => {
      setSelectedFile(file);
      setStep("adjust");
    },
    []
  );

  // Step 2: User confirms crop
  const handleCropConfirm = useCallback(
    (croppedBlob: Blob, legibilityScore: "low" | "medium" | "high") => {
      setCroppedBlob(croppedBlob);
      setLegibility(legibilityScore);
      setStep("analyze");

      // Auto-start analysis
      handleAnalyze(croppedBlob);
    },
    []
  );

  // Step 2: User cancels crop
  const handleCropCancel = useCallback(() => {
    setSelectedFile(null);
    setStep("upload");
  }, []);

  // Step 3: Analyze cropped image
  const handleAnalyze = useCallback(
    async (blob: Blob) => {
      jobId.current += 1;
      const runId = jobId.current;

      abortCurrentJob();
      resetState();
      setStatus("uploading");
      setStatusLabel("Preparando escaneo...");

      revokePreview();
      const objectUrl = URL.createObjectURL(blob);
      lastObjectUrl.current = objectUrl;
      setPreviewUrl(objectUrl);

      try {
        const { width, height } = await loadImageDimensions(blob);
        if (jobId.current !== runId) return;

        abortCurrentJob();
        const controller = new AbortController();
        currentJob.current = { abortController: controller };

        setStatus("processing");
        setStatusLabel("Leyendo ingredientes...");

        // Create File from Blob
        const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });

        const formData = new FormData();
        formData.append("image", file);
        formData.append("width", String(width));
        formData.append("height", String(height));

        const response = await fetch("/api/analyze?v=2", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (jobId.current !== runId) return;

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Error al analizar la imagen.");
        }

        const payload = (await response.json()) as any;
        if (jobId.current !== runId) return;

        // Check if V2 response with viewModel
        if ("v2" in payload && payload.v2 && "viewModel" in payload && payload.viewModel) {
          // V2 path: show result inline with ResultViewModelRenderer
          setViewModelResult(payload.viewModel as ResultViewModel);
          setExtractionId(payload.extraction_id || null);
          setStatus("succeeded");
          setStatusLabel("Resultado listo");
          abortCurrentJob();
          return;
        }

        // V1 fallback (for non-authenticated users or legacy responses)
        setResult(payload as AnalysisPayload);
        setStatus("succeeded");
        setStatusLabel("Resultado listo");
        abortCurrentJob();
      } catch (cause) {
        if (jobId.current !== runId) return;
        console.error(cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Hubo un problema procesando la imagen."
        );
        setStatus("failed");
        setStatusLabel(null);
        abortCurrentJob();
      }
    },
    [abortCurrentJob, loadImageDimensions, resetState, revokePreview, router]
  );

  const handleScanAgain = useCallback(() => {
    setStep("upload");
    setSelectedFile(null);
    setCroppedBlob(null);
    resetState();
    revokePreview();
  }, [resetState, revokePreview]);

  useEffect(() => {
    return () => {
      abortCurrentJob();
      revokePreview();
    };
  }, [abortCurrentJob, revokePreview]);

  const currentStepNumber: 1 | 2 | 3 =
    step === "upload" ? 1 : step === "adjust" ? 2 : 3;

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50"
      style={{ width: "100%", maxWidth: "100%", margin: 0 }}
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Inicio
            </Button>
          </Link>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-8 max-w-3xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
            Escanea Etiquetas
          </h1>
          <p className="text-base md:text-lg text-neutral-600 leading-relaxed">
            Captura la etiqueta de cualquier producto. Verificamos cada
            ingrediente contra tu perfil de alergias y te mostramos si es seguro
            para ti.
          </p>
        </div>

        {/* Stepper */}
        <Stepper current={currentStepNumber} />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Upload */}
            {step === "upload" && (
              <ImagePicker
                disabled={status === "processing" || status === "uploading"}
                onClear={handleScanAgain}
                onSelect={handleFileSelect}
                previewUrl={null}
              />
            )}

            {/* Step 2: Adjust (Cropper) */}
            {step === "adjust" && selectedFile && (
              <CropperDialog
                imageFile={selectedFile}
                onConfirm={handleCropConfirm}
                onCancel={handleCropCancel}
              />
            )}

            {/* Step 3: Analyze (Results) */}
            {step === "analyze" && (
              <>
                {/* V2: ResultViewModelRenderer */}
                {viewModelResult ? (
                  <>
                    <ResultViewModelRenderer viewModel={viewModelResult} />

                    {/* Optional: Link to view in history */}
                    {extractionId && (
                      <div className="flex justify-center pt-4">
                        <Link href={`/scan/result/${extractionId}`}>
                          <Button variant="outline" size="sm">
                            Ver en Historial
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  /* V1 Fallback: AnalysisResult (non-authenticated or legacy) */
                  <AnalysisResult
                    error={error}
                    result={result}
                    status={status}
                    statusLabel={statusLabel}
                    previewUrl={previewUrl}
                  />
                )}

                {/* Scan Again Button */}
                {status === "succeeded" || status === "failed" ? (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleScanAgain}
                      size="lg"
                      className="bg-primary hover:bg-primary-600"
                    >
                      Escanear Otra Etiqueta
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Sidebar (4 cols on desktop, hidden on mobile during adjust/analyze) */}
          <aside className="lg:col-span-4 space-y-6 hidden lg:block">
            <ProfileSummary profile={profile} />
            <ScanTips />
            <RecentScans />
          </aside>
        </div>

        {/* Mobile: Show sidebar components at bottom when in upload step */}
        {step === "upload" && (
          <div className="lg:hidden mt-8 space-y-6">
            <ProfileSummary profile={profile} />
            <ScanTips />
            <RecentScans />
          </div>
        )}
      </div>
    </main>
  );
}
