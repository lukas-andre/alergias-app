/**
 * SeveritySelector - Visual 0-3 scale selector for allergens/intolerances
 *
 * Severity Scale:
 * 0 = Sensitivity (minor discomfort) - Blue
 * 1 = Mild (noticeable symptoms) - Green/Yellow
 * 2 = Moderate (significant reaction) - Amber
 * 3 = Severe/Anaphylaxis (life-threatening) - Red
 *
 * Features:
 * - Visual color-coded buttons
 * - Descriptive labels
 * - Keyboard accessible
 * - Mobile-friendly (stacks on small screens)
 *
 * Usage:
 * <SeveritySelector
 *   value={severity}
 *   onChange={(val) => setSeverity(val)}
 *   variant="allergen" // or "intolerance"
 * />
 */

"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface SeverityLevel {
  value: number;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  icon?: string;
}

// Allergen severity levels
export const ALLERGEN_SEVERITY_LEVELS: SeverityLevel[] = [
  {
    value: 0,
    label: "Sensibilidad",
    shortLabel: "Leve",
    description: "Molestia menor, síntomas leves",
    color: "text-info",
    bgColor: "bg-info-light",
    hoverColor: "hover:bg-info-light",
    icon: "😐",
  },
  {
    value: 1,
    label: "Leve",
    shortLabel: "Leve",
    description: "Síntomas notorios pero manejables",
    color: "text-success-dark",
    bgColor: "bg-success-light",
    hoverColor: "hover:bg-success-light",
    icon: "😕",
  },
  {
    value: 2,
    label: "Moderado",
    shortLabel: "Moderado",
    description: "Reacción significativa, requiere medicación",
    color: "text-warning-dark",
    bgColor: "bg-warning-light",
    hoverColor: "hover:bg-warning-light",
    icon: "😰",
  },
  {
    value: 3,
    label: "Severo / Anafilaxis",
    shortLabel: "Severo",
    description: "Riesgo vital, requiere epinefrina",
    color: "text-danger-dark",
    bgColor: "bg-danger-light",
    hoverColor: "hover:bg-danger-light",
    icon: "🚨",
  },
];

// Intolerance severity levels (similar but not life-threatening)
export const INTOLERANCE_SEVERITY_LEVELS: SeverityLevel[] = [
  {
    value: 0,
    label: "Leve",
    shortLabel: "Leve",
    description: "Malestar digestivo menor",
    color: "text-info",
    bgColor: "bg-info-light",
    hoverColor: "hover:bg-info-light",
    icon: "😐",
  },
  {
    value: 1,
    label: "Moderado",
    shortLabel: "Moderado",
    description: "Síntomas digestivos notables",
    color: "text-success-dark",
    bgColor: "bg-success-light",
    hoverColor: "hover:bg-success-light",
    icon: "😕",
  },
  {
    value: 2,
    label: "Significativo",
    shortLabel: "Significativo",
    description: "Problemas digestivos importantes",
    color: "text-warning-dark",
    bgColor: "bg-warning-light",
    hoverColor: "hover:bg-warning-light",
    icon: "😰",
  },
  {
    value: 3,
    label: "Severo",
    shortLabel: "Severo",
    description: "Intolerancia extrema, evitar estrictamente",
    color: "text-danger-dark",
    bgColor: "bg-danger-light",
    hoverColor: "hover:bg-danger-light",
    icon: "⚠️",
  },
];

export interface SeveritySelectorProps {
  value: number;
  onChange: (value: number) => void;
  variant?: "allergen" | "intolerance";
  layout?: "horizontal" | "vertical" | "grid";
  size?: "sm" | "md" | "lg";
  showDescriptions?: boolean;
  showIcons?: boolean;
  className?: string;
  disabled?: boolean;
}

export function SeveritySelector({
  value,
  onChange,
  variant = "allergen",
  layout = "grid",
  size = "md",
  showDescriptions = true,
  showIcons = true,
  className,
  disabled = false,
}: SeveritySelectorProps) {
  const levels =
    variant === "allergen"
      ? ALLERGEN_SEVERITY_LEVELS
      : INTOLERANCE_SEVERITY_LEVELS;

  const sizeClasses = {
    sm: "text-xs p-2",
    md: "text-sm p-3",
    lg: "text-base p-4",
  };

  const layoutClasses = {
    horizontal: "flex flex-wrap gap-2",
    vertical: "flex flex-col gap-2",
    grid: "grid grid-cols-2 sm:grid-cols-4 gap-3",
  };

  return (
    <div className={cn("space-y-2", className)} role="radiogroup">
      <div className={layoutClasses[layout]}>
        {levels.map((level) => {
          const isSelected = value === level.value;

          return (
            <button
              key={level.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => !disabled && onChange(level.value)}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-start text-left rounded-lg border-2 transition-all",
                sizeClasses[size],
                isSelected
                  ? `border-${variant === "allergen" ? "primary" : "accent-fresh"} ${level.bgColor} shadow-md`
                  : "border-neutral-300 bg-white hover:border-neutral-400",
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && "cursor-pointer"
              )}
            >
              {/* Icon and label */}
              <div className="flex items-center gap-2 w-full">
                {showIcons && level.icon && (
                  <span className="text-lg" aria-hidden="true">
                    {level.icon}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-semibold",
                        isSelected && level.color
                      )}
                    >
                      {level.shortLabel}
                    </span>
                    {isSelected && (
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          variant === "allergen"
                            ? "bg-primary"
                            : "bg-accent-fresh"
                        )}
                        aria-label="Seleccionado"
                      />
                    )}
                  </div>

                  {/* Description (optional) */}
                  {showDescriptions && (
                    <p
                      className={cn(
                        "text-xs mt-1 leading-tight",
                        isSelected ? "text-neutral-700" : "text-neutral-500"
                      )}
                    >
                      {level.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Accessibility label */}
      <p className="sr-only">
        Selecciona el nivel de severidad: {levels.find((l) => l.value === value)?.label}
      </p>
    </div>
  );
}

/**
 * Compact variant for use in lists/tables
 */
export function SeveritySelectorCompact({
  value,
  onChange,
  variant = "allergen",
  disabled = false,
  className,
}: Pick<
  SeveritySelectorProps,
  "value" | "onChange" | "variant" | "disabled" | "className"
>) {
  const levels =
    variant === "allergen"
      ? ALLERGEN_SEVERITY_LEVELS
      : INTOLERANCE_SEVERITY_LEVELS;

  return (
    <div className={cn("flex gap-1", className)} role="radiogroup">
      {levels.map((level) => {
        const isSelected = value === level.value;

        return (
          <Button
            key={level.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${level.label}: ${level.description}`}
            onClick={() => !disabled && onChange(level.value)}
            disabled={disabled}
            size="sm"
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "w-10 h-10 p-0 text-lg",
              isSelected && level.bgColor,
              !disabled && level.hoverColor
            )}
          >
            {level.icon || level.value}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Read-only badge showing severity level
 */
export function SeverityBadge({
  value,
  variant = "allergen",
  showIcon = true,
  showLabel = true,
  className,
}: {
  value: number;
  variant?: "allergen" | "intolerance";
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  const levels =
    variant === "allergen"
      ? ALLERGEN_SEVERITY_LEVELS
      : INTOLERANCE_SEVERITY_LEVELS;

  const level = levels.find((l) => l.value === value);

  if (!level) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium",
        level.bgColor,
        level.color,
        className
      )}
    >
      {showIcon && level.icon && (
        <span aria-hidden="true">{level.icon}</span>
      )}
      {showLabel && <span>{level.shortLabel}</span>}
    </span>
  );
}
