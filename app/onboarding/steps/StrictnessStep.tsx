/**
 * Step 6: Strictness Profile
 *
 * Configure active strictness profile with preset options
 * (Diario, Pediátrico, Máximo) or custom configuration.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield } from "lucide-react";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { OnboardingLayout, StrictnessToggles } from "@/components/onboarding";
import { strictnessSchema, type StrictnessFormData } from "@/lib/schemas/onboarding.schema";

export interface StrictnessStepProps {
  initialData?: Partial<StrictnessFormData>;
  onNext: (data: StrictnessFormData) => void;
  onBack: () => void;
}

export function StrictnessStep({ initialData, onNext, onBack }: StrictnessStepProps) {
  const form = useForm<StrictnessFormData>({
    resolver: zodResolver(strictnessSchema),
    defaultValues: {
      profile_name: initialData?.profile_name ?? "Diario",
      block_traces: initialData?.block_traces ?? false,
      block_same_line: initialData?.block_same_line ?? false,
      e_numbers_uncertain: initialData?.e_numbers_uncertain ?? "warn",
      min_model_confidence: initialData?.min_model_confidence ?? 0.85,
      residual_protein_ppm: initialData?.residual_protein_ppm ?? null,
      pediatric_mode: initialData?.pediatric_mode ?? false,
      anaphylaxis_mode: initialData?.anaphylaxis_mode ?? false,
      notes: initialData?.notes ?? "",
    },
  });

  const handleSubmit = (data: StrictnessFormData) => {
    onNext(data);
  };

  return (
    <OnboardingLayout
      currentStep={6}
      title="Nivel de Estrictitud"
      description="Define qué tan estrictas serán las reglas al evaluar productos. Puedes elegir un perfil predefinido o personalizar cada opción."
      onNext={form.handleSubmit(handleSubmit)}
      onBack={onBack}
      nextDisabled={form.formState.isSubmitting}
      isLoading={form.formState.isSubmitting}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3 p-4 bg-primary-soft rounded-lg">
            <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div className="space-y-1">
              <h3 className="font-semibold text-primary-900">
                ¿Qué es el nivel de estrictitud?
              </h3>
              <p className="text-sm text-neutral-700">
                El nivel de estrictitud controla cómo AlergiasCL evalúa los
                productos. Por ejemplo, si activas "Bloquear trazas", cualquier
                producto con advertencias de "Puede contener..." será marcado
                como ALTO riesgo.
              </p>
            </div>
          </div>

          {/* Strictness configuration */}
          <FormField
            control={form.control}
            name="profile_name"
            render={({ field }) => (
              <FormItem>
                <StrictnessToggles
                  value={form.watch()}
                  onChange={(data) => {
                    // Update all fields at once
                    Object.keys(data).forEach((key) => {
                      form.setValue(
                        key as keyof StrictnessFormData,
                        data[key as keyof StrictnessFormData] as any
                      );
                    });
                  }}
                  showPresets={true}
                />
              </FormItem>
            )}
          />

          {/* Recommendations */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-neutral-900">
              Recomendaciones por situación:
            </h4>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="p-3 bg-info-light/30 rounded-lg border border-info-light">
                <p className="font-semibold text-info-dark">👤 Adultos</p>
                <p className="text-neutral-700 mt-1">
                  <strong>Diario:</strong> Balance entre seguridad y flexibilidad
                </p>
              </div>
              <div className="p-3 bg-warning-light/30 rounded-lg border border-warning-light">
                <p className="font-semibold text-warning-dark">👶 Niños</p>
                <p className="text-neutral-700 mt-1">
                  <strong>Pediátrico:</strong> Reglas más estrictas para menores
                </p>
              </div>
              <div className="p-3 bg-danger-light/30 rounded-lg border border-danger-light">
                <p className="font-semibold text-danger-dark">🚨 Anafilaxis</p>
                <p className="text-neutral-700 mt-1">
                  <strong>Máximo:</strong> Precaución extrema, sin riesgos
                </p>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-lg border border-primary-soft bg-primary-soft/30 p-4">
            <p className="text-sm text-neutral-700">
              💡 <strong>Consejo:</strong> Si tienes dudas, comienza con el
              perfil <strong>"Diario"</strong>. Podrás ajustar la estrictitud en
              cualquier momento desde tu perfil, e incluso crear reglas
              específicas por alérgeno.
            </p>
          </div>
        </form>
      </Form>
    </OnboardingLayout>
  );
}
