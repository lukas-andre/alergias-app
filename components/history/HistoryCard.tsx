/**
 * HistoryCard Component
 *
 * Individual card for displaying a single scan in the history grid.
 *
 * Features:
 * - Thumbnail with Storage image
 * - Verdict badge (safe/warning/high risk)
 * - Timestamp (humanized)
 * - Allergen count
 * - Click to view full result
 */

"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { humanizeTimestamp } from "@/lib/utils/humanize-copy";

interface HistoryCardProps {
  id: string;
  created_at: string;
  verdict_level: 'low' | 'medium' | 'high' | null;
  allergen_count: number;
  imageUrl?: string;
}

export function HistoryCard({
  id,
  created_at,
  verdict_level,
  allergen_count,
  imageUrl,
}: HistoryCardProps) {
  const verdictConfig = {
    low: {
      icon: CheckCircle,
      label: "Seguro",
      color: "bg-accent-fresh-100 text-accent-fresh-dark border-accent-fresh",
    },
    medium: {
      icon: AlertCircle,
      label: "Precaución",
      color: "bg-warning-100 text-warning-dark border-warning",
    },
    high: {
      icon: AlertTriangle,
      label: "Alto Riesgo",
      color: "bg-danger-100 text-danger-dark border-danger",
    },
  };

  const config = verdict_level ? verdictConfig[verdict_level] : null;
  const Icon = config?.icon || Clock;

  return (
    <Link href={`/scan/result/${id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary-300">
        <CardContent className="p-4 space-y-3">
          {/* Thumbnail */}
          <div className="relative w-full h-32 rounded-lg border-2 border-neutral-200 bg-neutral-50 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Scan thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <Clock className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {humanizeTimestamp(created_at)}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              {config && (
                <Badge
                  variant="outline"
                  className={`px-2 py-1 text-xs font-semibold ${config.color}`}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              )}

              {allergen_count > 0 && (
                <Badge variant="outline" className="px-2 py-1 text-xs">
                  {allergen_count} alérgeno{allergen_count !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
