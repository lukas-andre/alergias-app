/**
 * Step 2: Basic Data
 *
 * Collects basic user information:
 * - Display name (optional)
 * - Personal notes (optional)
 * - Pregnancy status (important for risk evaluation)
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, FileText, Baby } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingLayout } from "@/components/onboarding";
import { basicDataSchema, type BasicDataFormData } from "@/lib/schemas/onboarding.schema";

export interface BasicDataStepProps {
  initialData?: Partial<BasicDataFormData>;
  onNext: (data: BasicDataFormData) => void;
  onBack: () => void;
}

export function BasicDataStep({ initialData, onNext, onBack }: BasicDataStepProps) {
  const form = useForm<BasicDataFormData>({
    resolver: zodResolver(basicDataSchema),
    defaultValues: {
      display_name: initialData?.display_name ?? "",
      notes: initialData?.notes ?? "",
      pregnant: initialData?.pregnant ?? false,
    },
  });

  const handleSubmit = (data: BasicDataFormData) => {
    onNext(data);
  };

  return (
    <OnboardingLayout
      currentStep={2}
      title="Datos Básicos"
      description="Ayúdanos a personalizar tu experiencia. Todos los campos son opcionales."
      onNext={form.handleSubmit(handleSubmit)}
      onBack={onBack}
      nextDisabled={form.formState.isSubmitting}
      isLoading={form.formState.isSubmitting}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Display Name */}
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nombre de visualización
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="ej: María, Juan, etc."
                    {...field}
                    className="text-base"
                  />
                </FormControl>
                <FormDescription>
                  ¿Cómo te gustaría que te llamemos? Este nombre aparecerá en
                  tu perfil y saludos personalizados.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Personal Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notas personales
                </FormLabel>
                <FormControl>
                  <textarea
                    placeholder="ej: Historial familiar de alergias, restricciones dietéticas adicionales, medicamentos que tomo..."
                    {...field}
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </FormControl>
                <FormDescription>
                  Espacio libre para información adicional que consideres
                  relevante para tu perfil de alergias e intolerancias.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pregnancy Status */}
          <FormField
            control={form.control}
            name="pregnant"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-neutral-200 p-4 bg-neutral-50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <Baby className="w-4 h-4 text-primary" />
                    Estoy embarazada o en periodo de lactancia
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Esta información nos permite aplicar reglas de evaluación
                    más estrictas, considerando alimentos que pueden afectar al
                    bebé o la lactancia.
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Info box */}
          <div className="rounded-lg border border-info-light bg-info-light/30 p-4">
            <p className="text-sm text-neutral-700">
              💡 <strong>Tip:</strong> Puedes omitir estos campos y llenarlos
              más tarde desde tu perfil. Sin embargo, agregar esta información
              ahora nos ayuda a ofrecerte una experiencia más personalizada.
            </p>
          </div>
        </form>
      </Form>
    </OnboardingLayout>
  );
}
