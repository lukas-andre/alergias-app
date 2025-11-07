/**
 * Traffic Light Display Component
 *
 * Prominent visual semaphore (traffic light) showing risk level
 * with large colored circle, clear messaging, and action buttons.
 *
 * Design: Professional-friendly tone, visual prominence over text.
 */

import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { humanizeRiskLevel } from "@/lib/utils/humanize-copy";
import { cn } from "@/lib/utils";

export interface TrafficLightDisplayProps {
  risk: "low" | "medium" | "high";
  reasons?: string[];
  allergens?: string[];
  onViewAlternatives?: () => void;
  onRequestVerification?: () => void;
  onSave?: () => void;
  className?: string;
}

const riskStyles = {
  high: {
    bgColor: "bg-danger-soft",
    borderColor: "border-danger",
    textColor: "text-danger-dark",
    circleColor: "#EF4444", // Red
    Icon: XCircle,
  },
  medium: {
    bgColor: "bg-warning-soft",
    borderColor: "border-warning",
    textColor: "text-warning-dark",
    circleColor: "#F59E0B", // Yellow/Orange
    Icon: AlertTriangle,
  },
  low: {
    bgColor: "bg-accent-fresh-soft",
    borderColor: "border-accent-fresh",
    textColor: "text-accent-fresh-dark",
    circleColor: "#22C55E", // Green
    Icon: ShieldCheck,
  },
};

export function TrafficLightDisplay({
  risk,
  reasons = [],
  allergens = [],
  onViewAlternatives,
  onRequestVerification,
  onSave,
  className,
}: TrafficLightDisplayProps) {
  const style = riskStyles[risk];
  const { label, description } = humanizeRiskLevel(risk);
  const Icon = style.Icon;

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-8",
        style.bgColor,
        style.borderColor,
        className
      )}
    >
      {/* Traffic Light Circle */}
      <div className="flex flex-col items-center text-center mb-6">
        {/* Large SVG Circle */}
        <div className="relative mb-4">
          <svg width="150" height="150" viewBox="0 0 150 150">
            {/* Outer circle */}
            <circle
              cx="75"
              cy="75"
              r="70"
              fill={style.circleColor}
              className={cn(
                risk === "high" && "animate-pulse" // Pulse animation for high risk
              )}
            />
            {/* Icon in center */}
            <foreignObject x="0" y="0" width="150" height="150">
              <div className="flex items-center justify-center h-full">
                <Icon className="w-20 h-20 text-white" strokeWidth={2.5} />
              </div>
            </foreignObject>
          </svg>
        </div>

        {/* Risk Label */}
        <h2 className={cn("text-3xl font-bold mb-2", style.textColor)}>
          {label}
        </h2>

        {/* Description */}
        <p className="text-base text-neutral-700 max-w-md">{description}</p>
      </div>

      {/* Reasons Section */}
      {reasons.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">
            ¿Por qué vemos esto?
          </h3>
          <ul className="space-y-2">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className={cn("mt-0.5", style.textColor)}>•</span>
                <span className="text-neutral-800">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {risk === "high" && onViewAlternatives && (
          <Button
            onClick={onViewAlternatives}
            className="bg-primary text-primary-foreground hover:bg-primary-600"
          >
            Ver Alternativas Seguras
          </Button>
        )}

        {(risk === "high" || risk === "medium") && onRequestVerification && (
          <Button
            onClick={onRequestVerification}
            variant="outline"
            className="border-neutral-300"
          >
            Pedir Verificación
          </Button>
        )}

        {risk === "low" && onSave && (
          <Button
            onClick={onSave}
            className="bg-accent-fresh text-accent-fresh-foreground hover:bg-accent-fresh-600"
          >
            Guardar Producto
          </Button>
        )}
      </div>
    </div>
  );
}
