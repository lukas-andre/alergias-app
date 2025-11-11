/**
 * RecentScans Component
 *
 * Shows last 3 scans with:
 * - Thumbnail
 * - Timestamp
 * - Verdict badge
 * - Click to view
 *
 * Design: Compact, interactive, useful for quick access
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { humanizeTimestamp } from "@/lib/utils/humanize-copy";

interface RecentScan {
  id: string;
  created_at: string;
  imageUrl: string | null;
  final_confidence: number | null;
}

const verdictFromConfidence = (confidence: number | null): "safe" | "warning" | "high" => {
  if (!confidence) return "warning";
  if (confidence >= 0.9) return "safe";
  if (confidence >= 0.7) return "warning";
  return "high";
};

export function RecentScans({ className }: { className?: string }) {
  const [scans, setScans] = useState<RecentScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecentScans() {
      try {
        const response = await fetch("/api/recent-scans");

        if (!response.ok) {
          console.error("Error loading recent scans:", response.statusText);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setScans(data.scans || []);
      } catch (err) {
        console.error("Error loading recent scans:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRecentScans();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Escaneos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (scans.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Escaneos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 text-center py-2">
            Aún no has escaneado ninguna etiqueta
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Escaneos Recientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scans.map((scan) => {
          const verdict = verdictFromConfidence(scan.final_confidence);
          const verdictColor =
            verdict === "safe"
              ? "bg-accent-fresh-100 text-accent-fresh-dark border-accent-fresh"
              : verdict === "warning"
              ? "bg-warning-100 text-warning-dark border-warning"
              : "bg-danger-100 text-danger-dark border-danger";

          const verdictLabel =
            verdict === "safe"
              ? "Seguro"
              : verdict === "warning"
              ? "Precaución"
              : "Alto Riesgo";

          return (
            <Link
              key={scan.id}
              href={`/scan/result/${scan.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-12 h-12 rounded-md border border-neutral-200 bg-neutral-50 overflow-hidden">
                {scan.imageUrl ? (
                  <img
                    src={scan.imageUrl}
                    alt="Scan thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Clock className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900 font-medium truncate">
                  {humanizeTimestamp(scan.created_at)}
                </p>
                <Badge
                  variant="outline"
                  className={`px-2 py-0.5 text-xs font-semibold mt-1 ${verdictColor}`}
                >
                  {verdictLabel}
                </Badge>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary transition-colors" />
            </Link>
          );
        })}

        {/* Link to full history */}
        <Link href="/scan/history" className="block">
          <Button variant="ghost" size="sm" className="w-full mt-2">
            Ver Todo el Historial
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
