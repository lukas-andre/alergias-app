/**
 * VerdictPill Component
 *
 * Compact, prominent verdict display that shows:
 * - Risk level with color coding
 * - Short description
 * - Matched allergens as pills
 * - Confidence score
 *
 * Design: Clean, scannable, mobile-first
 */

import { ShieldCheck, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface VerdictPillProps {
  level: "safe" | "warning" | "high";
  text: string;
  pills?: string[];
  confidence: number;
  emoji: string;
  className?: string;
  scannedAt?: string;
  quality?: string;
  minThreshold?: number;
}

const levelStyles = {
  high: {
    bgColor: "bg-danger-soft",
    borderColor: "border-danger",
    textColor: "text-danger-dark",
    Icon: XCircle,
    label: "Alto Riesgo",
  },
  warning: {
    bgColor: "bg-warning-soft",
    borderColor: "border-warning",
    textColor: "text-warning-dark",
    Icon: AlertTriangle,
    label: "Precaución",
  },
  safe: {
    bgColor: "bg-accent-fresh-soft",
    borderColor: "border-accent-fresh",
    textColor: "text-accent-fresh-dark",
    Icon: ShieldCheck,
    label: "Seguro",
  },
};

export function VerdictPill({
  level,
  text,
  pills = [],
  confidence,
  emoji,
  className,
  scannedAt,
  quality,
  minThreshold,
}: VerdictPillProps) {
  const style = levelStyles[level];
  const Icon = style.Icon;

  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-6",
        style.bgColor,
        style.borderColor,
        className
      )}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
               style={{ backgroundColor: style.textColor.replace('text-', 'var(--') + ')' }}>
            <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Level + Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn("text-2xl font-bold", style.textColor)}>
              {style.label}
            </h2>
            {pills.length > 0 && (
              <>
                <span className="text-neutral-400">•</span>
                {pills.map((pill, idx) => (
                  <Badge
                    key={`${pill}-${idx}`}
                    variant="outline"
                    className={cn(
                      "px-2 py-1 text-sm font-semibold border-2",
                      level === "high" && "bg-danger-100 border-danger text-danger-dark",
                      level === "warning" && "bg-warning-100 border-warning text-warning-dark",
                      level === "safe" && "bg-accent-fresh-100 border-accent-fresh text-accent-fresh-dark"
                    )}
                  >
                    {pill}
                  </Badge>
                ))}
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-base text-neutral-700 leading-relaxed">
            {text}
          </p>

          {/* Meta (Date + Quality + Confidence) */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            {scannedAt && (
              <>
                <span className="flex items-center gap-1">
                  {scannedAt}
                </span>
                <span className="text-neutral-300">•</span>
              </>
            )}
            {quality && (
              <>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {quality}
                </span>
                <span className="text-neutral-300">•</span>
              </>
            )}
            <span className="flex items-center gap-1">
              Confianza: {(confidence * 100).toFixed(0)}%
              {minThreshold !== undefined && (
                <span className="text-neutral-400">
                  (mín: {(minThreshold * 100).toFixed(0)}%)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
