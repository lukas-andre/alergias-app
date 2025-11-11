/**
 * History Page
 *
 * Displays all user scans with pagination.
 *
 * Features:
 * - Grid layout (responsive: 1/2/3/4 columns)
 * - Server-side pagination (20 items/page)
 * - Auth gate (redirect to login if unauthenticated)
 * - Loading/Error/Empty states
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/SupabaseProvider";
import { HistoryCard } from "@/components/history/HistoryCard";

export default function HistoryPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?redirect=/scan/history");
          return;
        }

        // Fetch paginated extractions via API (server-side with signed URLs)
        const response = await fetch(`/api/history?page=${page}&pageSize=20`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result.data);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error("Error loading history:", err);
        setError("Error al cargar el historial. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [supabase, router, page]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link href="/scan">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al escáner
            </Button>
          </Link>
        </header>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-3 flex items-center justify-center gap-3">
            <History className="w-8 h-8 text-primary" />
            Historial de Escaneos
          </h1>
          <p className="text-base md:text-lg text-neutral-600">
            Revisa todos tus escaneos anteriores
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-danger text-lg">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-600 mb-4">
              Aún no has escaneado ninguna etiqueta
            </p>
            <Link href="/scan">
              <Button variant="default">Escanear Ahora</Button>
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && data.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.map((item) => (
                <HistoryCard
                  key={item.id}
                  id={item.id}
                  created_at={item.created_at}
                  verdict_level={item.verdict_level}
                  allergen_count={item.allergen_count}
                  imageUrl={item.imageUrl}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm text-neutral-600">
                  Página {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
