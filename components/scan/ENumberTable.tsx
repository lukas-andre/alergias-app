/**
 * ENumberTable Component
 *
 * Displays E-numbers with:
 * - Code + Spanish name
 * - Policy (allow/warn/block/unknown)
 * - Linked allergens
 * - Reason/explanation
 *
 * Design: Expandable, informative, professional
 */

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ENumberVM {
  code: string;
  nameEs?: string;
  policy: "allow" | "warn" | "block" | "unknown";
  linkedAllergens?: string[];
  reason?: string;
}

export interface ENumberTableProps {
  enumbers: ENumberVM[];
  className?: string;
}

const policyStyles = {
  allow: {
    bg: "bg-accent-fresh-100",
    text: "text-accent-fresh-dark",
    border: "border-accent-fresh",
    label: "Permitido",
  },
  warn: {
    bg: "bg-warning-100",
    text: "text-warning-dark",
    border: "border-warning",
    label: "Precaución",
  },
  block: {
    bg: "bg-danger-100",
    text: "text-danger-dark",
    border: "border-danger",
    label: "Bloqueado",
  },
  unknown: {
    bg: "bg-neutral-100",
    text: "text-neutral-700",
    border: "border-neutral-300",
    label: "Desconocido",
  },
};

export function ENumberTable({ enumbers, className }: ENumberTableProps) {
  const [expanded, setExpanded] = useState(false);

  if (enumbers.length === 0) return null;

  const hasBlocked = enumbers.some((e) => e.policy === "block");
  const hasWarned = enumbers.some((e) => e.policy === "warn");
  const hasUnknown = enumbers.some((e) => e.policy === "unknown");

  return (
    <Card className={cn("border-neutral-200 bg-white shadow-sm", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning-dark" />
              E-numbers Detectados
            </CardTitle>
            <CardDescription>
              {enumbers.length} aditivo{enumbers.length > 1 ? "s" : ""} encontrado
              {enumbers.length > 1 ? "s" : ""}
              {hasBlocked && " • Algunos bloqueados"}
              {hasWarned && !hasBlocked && " • Requieren precaución"}
              {hasUnknown && !hasBlocked && !hasWarned && " • Algunos sin información"}
            </CardDescription>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-600 transition-colors"
          >
            {expanded ? (
              <>
                Ocultar <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Ver detalles <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <div className="space-y-4">
            {enumbers.map((eNum, idx) => {
              const policyStyle = policyStyles[eNum.policy];

              return (
                <div
                  key={`${eNum.code}-${idx}`}
                  className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 space-y-3"
                >
                  {/* Header: Code + Name + Policy */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900">
                      {eNum.code}
                    </h3>
                    {eNum.nameEs && (
                      <span className="text-sm text-neutral-600">
                        ({eNum.nameEs})
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-2 py-1 text-xs font-semibold border",
                        policyStyle.bg,
                        policyStyle.text,
                        policyStyle.border
                      )}
                    >
                      {policyStyle.label}
                    </Badge>
                  </div>

                  {/* Linked Allergens */}
                  {eNum.linkedAllergens && eNum.linkedAllergens.length > 0 && (
                    <div>
                      <p className="text-xs text-neutral-600 font-medium mb-1">
                        Puede derivarse de:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {eNum.linkedAllergens.map((allergen, aIdx) => (
                          <Badge
                            key={`${allergen}-${aIdx}`}
                            variant="outline"
                            className="px-2 py-0.5 text-xs bg-warning-50 border-warning-200 text-warning-dark"
                          >
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  {eNum.reason && (
                    <p className="text-sm text-neutral-700 leading-relaxed">
                      {eNum.reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
