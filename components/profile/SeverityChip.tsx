/**
 * SeverityChip - Display allergen/intolerance with severity badge
 *
 * Used in profile view to show items with color-coded severity levels
 * Severity: 0 (low) → 1 (medium) → 2 (high) → 3 (anaphylaxis)
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SeverityChipProps {
  name: string;
  severity: number;
  notes?: string;
  className?: string;
}

const SEVERITY_CONFIG = {
  0: {
    label: "Baja",
    className: "bg-neutral-300 text-neutral-700 hover:bg-neutral-300",
  },
  1: {
    label: "Media",
    className: "bg-warning-soft text-warning-dark hover:bg-warning-soft border-warning-light",
  },
  2: {
    label: "Alta",
    className: "bg-warning text-white hover:bg-warning",
  },
  3: {
    label: "Anafilaxia",
    className: "bg-danger text-white hover:bg-danger",
  },
} as const;

export function SeverityChip({
  name,
  severity,
  notes,
  className,
}: SeverityChipProps) {
  const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG[2];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-neutral-200 shadow-sm",
        className
      )}
      title={notes || undefined}
    >
      <span className="font-medium text-neutral-900 text-sm">{name}</span>
      <Badge
        variant="secondary"
        className={cn("text-xs font-semibold", config.className)}
      >
        {config.label}
      </Badge>
    </div>
  );
}
