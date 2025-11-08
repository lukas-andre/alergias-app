/**
 * Stepper Component
 *
 * Visual progress indicator for multi-step flow:
 * 1. Subir → 2. Ajustar → 3. Analizar
 *
 * Design:
 * - Horizontal on desktop
 * - Responsive on mobile (compact)
 * - Current step highlighted
 * - Completed steps with checkmark
 * - Future steps grayed out
 */

import { Check, Upload, Crop, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperProps {
  current: 1 | 2 | 3;
  className?: string;
}

const steps = [
  { number: 1, label: "Subir", icon: Upload },
  { number: 2, label: "Ajustar", icon: Crop },
  { number: 3, label: "Analizar", icon: Sparkles },
];

export function Stepper({ current, className }: StepperProps) {
  return (
    <nav
      aria-label="Progress"
      className={cn("w-full py-6", className)}
    >
      <ol className="flex items-center w-full">
        {steps.map((step, idx) => {
          const isComplete = step.number < current;
          const isCurrent = step.number === current;
          const isFuture = step.number > current;

          const Icon = step.icon;

          return (
            <li
              key={step.number}
              className={cn(
                "flex items-center",
                idx < steps.length - 1 && "flex-1"
              )}
            >
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                    isComplete &&
                      "bg-primary border-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary border-primary text-primary-foreground animate-pulse",
                    isFuture &&
                      "bg-white border-neutral-300 text-neutral-400"
                  )}
                >
                  {isComplete ? (
                    <Check className="w-6 h-6" strokeWidth={3} />
                  ) : (
                    <Icon className="w-6 h-6" strokeWidth={2.5} />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={cn(
                    "mt-2 text-sm font-medium transition-colors",
                    (isCurrent || isComplete) &&
                      "text-neutral-900",
                    isFuture && "text-neutral-400"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors",
                    isComplete ? "bg-primary" : "bg-neutral-300"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
