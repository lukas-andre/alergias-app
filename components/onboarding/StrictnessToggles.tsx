/**
 * StrictnessToggles - Strictness profile configuration form
 *
 * Allows users to configure their active strictness profile:
 * - Block traces toggle
 * - Block same line toggle
 * - E-numbers policy (allow/warn/block)
 * - Minimum model confidence slider
 * - Pediatric mode toggle
 * - Anaphylaxis mode toggle
 * - Residual protein PPM threshold
 *
 * Includes preset profiles (Diario, Pediátrico, Máximo)
 *
 * Usage:
 * <StrictnessToggles
 *   value={strictnessData}
 *   onChange={(data) => setStrictnessData(data)}
 * />
 */

"use client";

import { useState } from "react";
import { Info, ShieldCheck, Baby, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StrictnessFormData } from "@/lib/schemas/onboarding.schema";

export interface StrictnessTogglesProps {
  value: StrictnessFormData;
  onChange: (value: StrictnessFormData) => void;
  showPresets?: boolean;
  className?: string;
}

// Preset strictness profiles
const STRICTNESS_PRESETS = [
  {
    name: "Diario",
    description: "Balance entre seguridad y flexibilidad para uso cotidiano",
    icon: ShieldCheck,
    color: "text-info",
    data: {
      profile_name: "Diario",
      block_traces: false,
      block_same_line: false,
      e_numbers_uncertain: "warn" as const,
      min_model_confidence: 0.85,
      residual_protein_ppm: null,
      pediatric_mode: false,
      anaphylaxis_mode: false,
      notes: "",
    },
  },
  {
    name: "Pediátrico",
    description: "Reglas más estrictas para niños y personas sensibles",
    icon: Baby,
    color: "text-warning",
    data: {
      profile_name: "Pediátrico",
      block_traces: true,
      block_same_line: true,
      e_numbers_uncertain: "block" as const,
      min_model_confidence: 0.90,
      residual_protein_ppm: 10,
      pediatric_mode: true,
      anaphylaxis_mode: false,
      notes: "",
    },
  },
  {
    name: "Máximo (Anafilaxis)",
    description: "Máxima precaución para riesgo de anafilaxis",
    icon: AlertTriangle,
    color: "text-danger",
    data: {
      profile_name: "Máximo",
      block_traces: true,
      block_same_line: true,
      e_numbers_uncertain: "block" as const,
      min_model_confidence: 0.95,
      residual_protein_ppm: 5,
      pediatric_mode: false,
      anaphylaxis_mode: true,
      notes: "",
    },
  },
];

export function StrictnessToggles({
  value,
  onChange,
  showPresets = true,
  className,
}: StrictnessTogglesProps) {
  const [customMode, setCustomMode] = useState(true);

  // Handle preset selection
  const applyPreset = (presetData: StrictnessFormData) => {
    onChange(presetData);
    setCustomMode(false);
  };

  // Handle field changes (automatically switch to custom mode)
  const updateField = <K extends keyof StrictnessFormData>(
    field: K,
    fieldValue: StrictnessFormData[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
    setCustomMode(true);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Presets */}
      {showPresets && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Perfiles Predefinidos</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {STRICTNESS_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isActive =
                !customMode && value.profile_name === preset.name;

              return (
                <Card
                  key={preset.name}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isActive &&
                      "border-primary border-2 bg-primary-soft shadow-md"
                  )}
                  onClick={() => applyPreset(preset.data)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-5 h-5", preset.color)} />
                      <CardTitle className="text-base">{preset.name}</CardTitle>
                      {isActive && (
                        <Badge className="ml-auto bg-primary">Activo</Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {preset.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Configuración Personalizada</Label>
          {customMode && (
            <Badge variant="outline" className="text-primary border-primary">
              Modo Personalizado
            </Badge>
          )}
        </div>

        {/* Block traces */}
        <div className="flex items-start space-x-3 p-4 bg-neutral-50 rounded-lg">
          <Checkbox
            id="block_traces"
            checked={value.block_traces}
            onCheckedChange={(checked) =>
              updateField("block_traces", checked as boolean)
            }
          />
          <div className="flex-1 space-y-1">
            <Label
              htmlFor="block_traces"
              className="text-sm font-medium cursor-pointer"
            >
              Bloquear productos con trazas
            </Label>
            <p className="text-xs text-neutral-600">
              Productos con advertencias "Puede contener..." o "Trazas de..."
              serán marcados como ALTO riesgo
            </p>
          </div>
        </div>

        {/* Block same line */}
        <div className="flex items-start space-x-3 p-4 bg-neutral-50 rounded-lg">
          <Checkbox
            id="block_same_line"
            checked={value.block_same_line}
            onCheckedChange={(checked) =>
              updateField("block_same_line", checked as boolean)
            }
          />
          <div className="flex-1 space-y-1">
            <Label
              htmlFor="block_same_line"
              className="text-sm font-medium cursor-pointer"
            >
              Bloquear productos de misma línea de producción
            </Label>
            <p className="text-xs text-neutral-600">
              Productos procesados en instalaciones compartidas serán marcados
              como ALTO riesgo
            </p>
          </div>
        </div>

        {/* E-numbers policy */}
        <div className="p-4 bg-neutral-50 rounded-lg space-y-3">
          <div className="flex items-start gap-2">
            <Label className="text-sm font-medium">
              Política de E-numbers inciertos
            </Label>
            <div className="group relative">
              <Info className="w-4 h-4 text-neutral-400 cursor-help" />
              <div className="hidden group-hover:block absolute z-10 w-64 p-2 bg-neutral-900 text-white text-xs rounded shadow-lg -top-1 left-6">
                Algunos aditivos (ej: E322 Lecitina) pueden derivar de
                múltiples orígenes. Esta opción controla cómo manejarlos.
              </div>
            </div>
          </div>

          <RadioGroup
            value={value.e_numbers_uncertain}
            onValueChange={(val) =>
              updateField(
                "e_numbers_uncertain",
                val as "allow" | "warn" | "block"
              )
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="allow" id="e_allow" />
              <Label htmlFor="e_allow" className="text-sm cursor-pointer">
                <span className="font-medium">Permitir</span> - No alertar
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="warn" id="e_warn" />
              <Label htmlFor="e_warn" className="text-sm cursor-pointer">
                <span className="font-medium">Advertir</span> - Marcar como
                riesgo MEDIO
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="block" id="e_block" />
              <Label htmlFor="e_block" className="text-sm cursor-pointer">
                <span className="font-medium">Bloquear</span> - Marcar como
                riesgo ALTO
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Confidence threshold */}
        <div className="p-4 bg-neutral-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Confianza mínima del modelo
            </Label>
            <Badge variant="outline" className="font-mono">
              {Math.round(value.min_model_confidence * 100)}%
            </Badge>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={value.min_model_confidence}
            onChange={(e) =>
              updateField("min_model_confidence", parseFloat(e.target.value))
            }
            className="w-full accent-primary"
          />
          <p className="text-xs text-neutral-600">
            Productos con confianza menor serán marcados como "Incierto"
          </p>
        </div>

        {/* Special modes */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Modos Especiales</Label>

          {/* Pediatric mode */}
          <div className="flex items-start space-x-3 p-4 bg-warning-light/30 rounded-lg border border-warning-light">
            <Checkbox
              id="pediatric_mode"
              checked={value.pediatric_mode}
              onCheckedChange={(checked) =>
                updateField("pediatric_mode", checked as boolean)
              }
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-warning" />
                <Label
                  htmlFor="pediatric_mode"
                  className="text-sm font-medium cursor-pointer"
                >
                  Modo Pediátrico
                </Label>
              </div>
              <p className="text-xs text-neutral-600">
                Aplica reglas más estrictas para niños pequeños
              </p>
            </div>
          </div>

          {/* Anaphylaxis mode */}
          <div className="flex items-start space-x-3 p-4 bg-danger-light/30 rounded-lg border border-danger-light">
            <Checkbox
              id="anaphylaxis_mode"
              checked={value.anaphylaxis_mode}
              onCheckedChange={(checked) =>
                updateField("anaphylaxis_mode", checked as boolean)
              }
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger" />
                <Label
                  htmlFor="anaphylaxis_mode"
                  className="text-sm font-medium cursor-pointer"
                >
                  Modo Anafilaxis
                </Label>
              </div>
              <p className="text-xs text-neutral-600">
                Máxima precaución: cualquier coincidencia con alérgenos será
                ALTO riesgo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
