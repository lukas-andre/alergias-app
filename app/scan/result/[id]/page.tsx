/**
 * Scan Result Detail Page
 *
 * Displays full analysis for a saved extraction.
 *
 * Fetches from /api/result/[id] endpoint which regenerates
 * the complete ResultViewModel from stored extraction data.
 *
 * Features:
 * - ResultViewModelRenderer UI
 * - Real-time profile integration
 * - Legacy format detection (410 error)
 * - Shareable URLs
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultViewModelRenderer } from "@/components/scan/ResultViewModelRenderer";
import { useSupabase } from "@/components/SupabaseProvider";
import type { ResultViewModel } from "@/lib/risk/view-model";

export default function ScanResultPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const extractionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewModel, setViewModel] = useState<ResultViewModel | null>(null);
  const [meta, setMeta] = useState<{
    created_at: string;
    model: string;
    costUSD?: number;
    confidence: number | null;
  } | null>(null);
  const [isLegacy, setIsLegacy] = useState(false);

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);
        setError(null);

        // Check auth
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login?redirect=/scan/result/" + extractionId);
          return;
        }

        // Fetch result from API
        const response = await fetch(`/api/result/${extractionId}`);

        if (!response.ok) {
          if (response.status === 410) {
            // Legacy V1 extraction
            const data = await response.json();
            setError(
              data.error ||
              "Este escaneo usa formato legacy. Por favor re-escanea la etiqueta."
            );
            setIsLegacy(true);
          } else if (response.status === 404) {
            setError("Análisis no encontrado.");
          } else if (response.status === 401) {
            router.push("/login?redirect=/scan/result/" + extractionId);
            return;
          } else {
            const data = await response.json().catch(() => ({}));
            setError(
              data.error || "Error al cargar el análisis. Intenta nuevamente."
            );
          }
          return;
        }

        // Parse response
        const payload = await response.json();

        if (!payload.viewModel) {
          setError("Respuesta inválida del servidor.");
          return;
        }

        setViewModel(payload.viewModel as ResultViewModel);
        setMeta(payload.meta || null);
      } catch (err) {
        console.error("Error loading result:", err);
        setError("Error al cargar el análisis. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [supabase, router, extractionId]);

  // Loading state
  if (loading) {
    return (
      <main
        className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50"
        style={{ width: "100%", maxWidth: "100%", margin: 0 }}
      >
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-neutral-600">Cargando análisis...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !viewModel) {
    return (
      <main
        className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50"
        style={{ width: "100%", maxWidth: "100%", margin: 0 }}
      >
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <header className="mb-6">
            <Link href="/scan">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al escáner
              </Button>
            </Link>
          </header>

          {/* Error Display */}
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
            <p className="text-danger text-lg mb-4">
              {error || "Análisis no encontrado"}
            </p>

            {isLegacy && (
              <p className="text-sm text-neutral-600 mb-4">
                Este escaneo fue guardado con un formato antiguo. Necesitas
                re-escanear la etiqueta para ver el análisis completo.
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <Link href="/scan">
                <Button variant="default">Escanear Ahora</Button>
              </Link>
              <Link href="/history">
                <Button variant="outline">Ver Historial</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Success state: Render ViewModel
  return (
    <main
      className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50"
      style={{ width: "100%", maxWidth: "100%", margin: 0 }}
    >
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="mb-6">
          <Link href="/scan">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al escáner
            </Button>
          </Link>
        </header>

        {/* Result Display */}
        <ResultViewModelRenderer
          viewModel={viewModel}
          extractionId={extractionId}
        />

        {/* Metadata Footer */}
        {meta && (
          <div className="mt-6 text-center text-xs text-neutral-500">
            <p>
              Escaneado el {new Date(meta.created_at).toLocaleString("es-CL")}
            </p>
            {meta.model && <p>Modelo: {meta.model}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mt-6">
          <Link href="/scan">
            <Button variant="default" size="lg">
              Escanear Otra Etiqueta
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline" size="lg">
              Ver Historial
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
