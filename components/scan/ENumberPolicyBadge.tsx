/**
 * E-Number Policy Badge
 *
 * Displays E-number code with policy-based color coding
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ENumberPolicyType = "allow" | "warn" | "block" | "unknown";

export interface ENumberPolicyBadgeProps {
  code: string;
  name_es?: string;
  policy: ENumberPolicyType;
  matched_allergens?: string[];
  className?: string;
}

const policyStyles: Record<ENumberPolicyType, string> = {
  allow: "bg-accent-fresh-soft text-accent-fresh-dark border-accent-fresh-light",
  warn: "bg-warning-soft text-warning-dark border-warning-light",
  block: "bg-danger-soft text-danger-dark border-danger-light",
  unknown: "bg-neutral-200 text-neutral-700 border-neutral-300",
};

const policyLabels: Record<ENumberPolicyType, string> = {
  allow: "Permitido",
  warn: "Advertencia",
  block: "Bloqueado",
  unknown: "Desconocido",
};

export function ENumberPolicyBadge({
  code,
  name_es,
  policy,
  matched_allergens,
  className,
}: ENumberPolicyBadgeProps) {
  return (
    <Badge className={cn(policyStyles[policy], "gap-1", className)}>
      <span className="font-mono font-semibold">{code}</span>
      {name_es && <span className="text-xs">({name_es})</span>}
      <span className="text-xs">• {policyLabels[policy]}</span>
      {matched_allergens && matched_allergens.length > 0 && (
        <span className="text-xs">→ {matched_allergens.join(", ")}</span>
      )}
    </Badge>
  );
}
