/**
 * Step 1: Welcome & Privacy Acceptance
 *
 * User must accept privacy policy and acknowledge medical disclaimer
 * to proceed with onboarding.
 */

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Heart, Scan } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingLayoutCompact } from "@/components/onboarding";
import { welcomeSchema, type WelcomeFormData } from "@/lib/schemas/onboarding.schema";

export interface WelcomeStepProps {
  initialData?: Partial<WelcomeFormData>;
  onNext: (data: WelcomeFormData) => void;
}

export function WelcomeStep({ initialData, onNext }: WelcomeStepProps) {
  const form = useForm<WelcomeFormData>({
    resolver: zodResolver(welcomeSchema),
    defaultValues: {
      acceptPrivacy: initialData?.acceptPrivacy ?? false,
      acknowledgeMedicalDisclaimer: initialData?.acknowledgeMedicalDisclaimer ?? false,
    },
  });

  const handleSubmit = (data: WelcomeFormData) => {
    onNext(data);
  };

  return (
    <OnboardingLayoutCompact
      currentStep={1}
      onNext={form.handleSubmit(handleSubmit)}
      nextLabel="Comenzar"
      nextDisabled={!form.formState.isValid || form.formState.isSubmitting}
      isLoading={form.formState.isSubmitting}
    >
      <div className="space-y-8">
        {/* Hero section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <Heart className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-neutral-900">
            Bienvenido a AlergiasCL
          </h1>
          <p className="text-lg text-neutral-600 max-w-xl mx-auto">
            Tu asistente personal para identificar alérgenos en productos
            alimenticios chilenos de forma rápida y segura.
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-center space-y-2 p-4 bg-neutral-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-scan/10">
              <Scan className="w-6 h-6 text-accent-scan" />
            </div>
            <h3 className="font-semibold text-sm">Escanea Etiquetas</h3>
            <p className="text-xs text-neutral-600">
              Analiza ingredientes con IA
            </p>
          </div>

          <div className="text-center space-y-2 p-4 bg-neutral-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Perfil Personalizado</h3>
            <p className="text-xs text-neutral-600">
              Configura tus alergias e intolerancias
            </p>
          </div>

          <div className="text-center space-y-2 p-4 bg-neutral-50 rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-fresh/10">
              <ShieldCheck className="w-6 h-6 text-accent-fresh" />
            </div>
            <h3 className="font-semibold text-sm">Evaluación de Riesgo</h3>
            <p className="text-xs text-neutral-600">
              Semáforo de seguridad instantáneo
            </p>
          </div>
        </div>

        {/* Privacy & Disclaimers */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Privacy acceptance (required) */}
            <FormField
              control={form.control}
              name="acceptPrivacy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-neutral-200 p-4 bg-white">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Acepto la{" "}
                      <a
                        href="/privacy"
                        target="_blank"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        política de privacidad
                      </a>{" "}
                      y{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        términos de uso
                      </a>
                    </FormLabel>
                    <p className="text-xs text-neutral-600">
                      Tus datos personales y de salud son privados y están
                      protegidos. No compartimos tu información con terceros.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Medical disclaimer (optional acknowledgment) */}
            <FormField
              control={form.control}
              name="acknowledgeMedicalDisclaimer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-warning-light bg-warning-light/30 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      He leído el aviso médico
                    </FormLabel>
                    <p className="text-xs text-neutral-700">
                      ⚠️ <strong>Aviso importante:</strong> AlergiasCL es una
                      herramienta de apoyo, no un sustituto del consejo médico
                      profesional. Siempre consulta con tu médico o alergólogo
                      antes de consumir productos desconocidos. En caso de duda,
                      evita el producto.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </form>
        </Form>

        {/* Additional info */}
        <div className="text-center text-xs text-neutral-500 space-y-1">
          <p>
            Completar el onboarding toma aproximadamente <strong>5 minutos</strong>
          </p>
          <p>Podrás modificar tu perfil en cualquier momento</p>
        </div>
      </div>
    </OnboardingLayoutCompact>
  );
}
