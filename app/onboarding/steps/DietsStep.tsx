/**
 * Step 3: Diets
 *
 * Multi-select diet types with search functionality.
 * Fetches diet types from Supabase and allows user to select multiple.
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Salad } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { OnboardingLayout, SearchableMultiSelect, type SelectableItem } from "@/components/onboarding";
import { dietsSchema, type DietsFormData } from "@/lib/schemas/onboarding.schema";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export interface DietsStepProps {
  initialData?: Partial<DietsFormData>;
  onNext: (data: DietsFormData) => void;
  onBack: () => void;
  onSkip?: () => void;
}

export function DietsStep({ initialData, onNext, onBack, onSkip }: DietsStepProps) {
  const [dietItems, setDietItems] = useState<SelectableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DietsFormData>({
    resolver: zodResolver(dietsSchema) as Resolver<DietsFormData>,
    defaultValues: {
      diets: initialData?.diets || [],
    },
    mode: "onChange",
  });

  // Fetch diet types from Supabase
  useEffect(() => {
    async function fetchDietTypes() {
      try {
        setIsLoading(true);
        const supabase = createSupabaseBrowserClient();

        const { data, error: fetchError } = await supabase
          .from("diet_types")
          .select("id, key, name_es, description")
          .order("name_es");

        if (fetchError) throw fetchError;

        const items: SelectableItem[] = (data || []).map((diet) => ({
          id: diet.id,
          key: diet.key,
          label: diet.name_es,
          description: diet.description || undefined,
        }));

        setDietItems(items);
      } catch (err) {
        console.error("Error fetching diet types:", err);
        setError("No se pudieron cargar las dietas. Por favor, intenta nuevamente.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDietTypes();
  }, []);

  const handleSubmit = (data: DietsFormData) => {
    onNext(data);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      // If no skip handler, submit with empty array
      onNext({ diets: [] });
    }
  };

  return (
    <OnboardingLayout
      currentStep={3}
      title="Dietas y Restricciones Alimentarias"
      description="Selecciona las dietas o restricciones alimentarias que sigues. Esto nos ayuda a filtrar productos que no son adecuados para ti."
      onNext={form.handleSubmit(handleSubmit)}
      onBack={onBack}
      onSkip={handleSkip}
      nextDisabled={form.formState.isSubmitting}
      isLoading={form.formState.isSubmitting}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-neutral-600">Cargando dietas disponibles...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-danger-light bg-danger-light/30 p-4">
              <p className="text-sm text-danger-dark">{error}</p>
            </div>
          )}

          {/* Diet selection */}
          {!isLoading && !error && (
            <>
              <FormField
                control={form.control}
                name="diets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base">
                      <Salad className="w-5 h-5" />
                      Selecciona tus dietas
                    </FormLabel>
                    <FormControl>
                      <SearchableMultiSelect
                        items={dietItems}
                        selected={field.value}
                        onSelect={field.onChange}
                        placeholder="Buscar dietas (ej: vegano, celiaco, kosher...)"
                        emptyMessage="No se encontraron dietas con ese criterio"
                      />
                    </FormControl>
                    <FormDescription>
                      Puedes seleccionar múltiples opciones. Usa el buscador
                      para encontrar rápidamente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Common examples */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-neutral-900">
                  Ejemplos de dietas comunes:
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-white rounded-full border border-neutral-200">
                    🌱 Vegetariano
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-neutral-200">
                    🥬 Vegano
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-neutral-200">
                    🌾 Celíaco (Sin Gluten)
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-neutral-200">
                    🥛 Sin Lactosa
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-neutral-200">
                    🥗 Paleo
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full border border-neutral-200">
                    🍖 Keto
                  </span>
                </div>
              </div>

              {/* Info box */}
              <div className="rounded-lg border border-info-light bg-info-light/30 p-4">
                <p className="text-sm text-neutral-700">
                  💡 <strong>Nota:</strong> Si no sigues ninguna dieta
                  especial, puedes omitir este paso haciendo clic en "Omitir".
                  Las dietas seleccionadas te ayudan a identificar productos
                  compatibles con tu estilo de alimentación.
                </p>
              </div>
            </>
          )}
        </form>
      </Form>
    </OnboardingLayout>
  );
}
