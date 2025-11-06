/**
 * ProgressIndicator - 7-step visual tracker for onboarding wizard
 *
 * Shows visual progress through the onboarding steps with:
 * - Completed steps (checkmark, green)
 * - Current step (highlighted, purple)
 * - Pending steps (gray)
 *
 * Responsive: Horizontal on desktop, vertical on mobile
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgressStep {
  number: number;
  label: string;
  shortLabel?: string; // For mobile/compact view
}

export interface ProgressIndicatorProps {
  currentStep: number;
  steps: ProgressStep[];
  className?: string;
}

export function ProgressIndicator({
  currentStep,
  steps,
  className,
}: ProgressIndicatorProps) {
  return (
    <nav aria-label="Progreso del onboarding" className={cn("w-full", className)}>
      {/* Desktop: Horizontal layout */}
      <ol className="hidden md:flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.number}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    isCompleted &&
                      "bg-accent-fresh border-accent-fresh text-white",
                    isCurrent &&
                      "bg-primary border-primary text-white scale-110 shadow-lg",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-white border-neutral-300 text-neutral-500"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    <span className="font-semibold text-sm">{step.number}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[100px]",
                    isCurrent && "text-primary",
                    isCompleted && "text-neutral-700",
                    !isCompleted && !isCurrent && "text-neutral-500"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all duration-200",
                    isCompleted ? "bg-accent-fresh" : "bg-neutral-300"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: Vertical compact layout */}
      <ol className="md:hidden space-y-2">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <li
              key={step.number}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-all",
                isCurrent && "bg-primary-soft"
              )}
            >
              {/* Step circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all flex-shrink-0",
                  isCompleted &&
                    "bg-accent-fresh border-accent-fresh text-white",
                  isCurrent && "bg-primary border-primary text-white",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-white border-neutral-300 text-neutral-500"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <span className="font-semibold text-xs">{step.number}</span>
                )}
              </div>

              {/* Step label */}
              <span
                className={cn(
                  "text-sm font-medium",
                  isCurrent && "text-primary",
                  isCompleted && "text-neutral-700",
                  !isCompleted && !isCurrent && "text-neutral-500"
                )}
              >
                {step.shortLabel || step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Default 7-step configuration for AlergiasCL onboarding
 */
export const ONBOARDING_STEPS: ProgressStep[] = [
  { number: 1, label: "Bienvenida", shortLabel: "Bienvenida" },
  { number: 2, label: "Datos Básicos", shortLabel: "Datos" },
  { number: 3, label: "Dietas", shortLabel: "Dietas" },
  { number: 4, label: "Alergias", shortLabel: "Alergias" },
  { number: 5, label: "Intolerancias", shortLabel: "Intolerancias" },
  { number: 6, label: "Estrictitud", shortLabel: "Estrictitud" },
  { number: 7, label: "Revisión", shortLabel: "Revisión" },
];
