/**
 * Step 5: Intolerances
 *
 * Select intolerances with severity (0-3) and optional notes.
 * Similar to AllergensStep but for food intolerances (lactose, fructose, etc.)
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertOctagon, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingLayout, SearchableMultiSelect, SeveritySelector, type SelectableItem } from "@/components/onboarding";
import { intolerancesSchema, type IntolerancesFormData } from "@/lib/schemas/onboarding.schema";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export interface IntolerancesStepProps {
  initialData?: Partial<IntolerancesFormData>;
  onNext: (data: IntolerancesFormData) => void;
  onBack: () => void;
  onSkip?: () => void;
}

export function IntolerancesStep({ initialData, onNext, onBack, onSkip }: IntolerancesStepProps) {
  const [intoleranceItems, setIntoleranceItems] = useState<SelectableItem[]>([]);
  const [intoleranceMap, setIntoleranceMap] = useState<Map<string, SelectableItem>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<IntolerancesFormData>({
    resolver: zodResolver(intolerancesSchema),
    defaultValues: {
      intolerances: initialData?.intolerances ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "intolerances",
  });

  // Fetch intolerance types from Supabase
  useEffect(() => {
    async function fetchIntoleranceTypes() {
      try {
        setIsLoading(true);
        const supabase = createSupabaseBrowserClient();

        const { data, error: fetchError } = await supabase
          .from("intolerance_types")
          .select("id, key, name_es, synonyms, notes")
          .order("name_es");

        if (fetchError) throw fetchError;

        const items: SelectableItem[] = (data || []).map((intolerance) => ({
          id: intolerance.id,
          key: intolerance.key,
          label: intolerance.name_es,
          description: intolerance.notes || undefined,
          synonyms: intolerance.synonyms || undefined,
        }));

        setIntoleranceItems(items);

        // Create map for quick lookup
        const map = new Map<string, SelectableItem>();
        items.forEach((item) => map.set(item.key, item));
        setIntoleranceMap(map);
      } catch (err) {
        console.error("Error fetching intolerance types:", err);
        setError("No se pudieron cargar las intolerancias. Por favor, intenta nuevamente.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchIntoleranceTypes();
  }, []);

  const handleSubmit = (data: IntolerancesFormData) => {
    onNext(data);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onNext({ intolerances: [] });
    }
  };

  // Get selected intolerance keys
  const selectedKeys = fields.map((field) => field.key);

  // Handle intolerance selection
  const handleIntoleranceSelect = (keys: string[]) => {
    const currentKeys = new Set(selectedKeys);
    const newKeys = new Set(keys);

    // Add new intolerances
    keys.forEach((key) => {
      if (!currentKeys.has(key)) {
        append({
          key,
          severity: 1, // Default to mild for intolerances
          notes: "",
        });
      }
    });

    // Remove deselected intolerances
    fields.forEach((field, index) => {
      if (!newKeys.has(field.key)) {
        remove(index);
      }
    });
  };

  return (
    <OnboardingLayout
      currentStep={5}
      title="Intolerancias Alimentarias"
      description="Selecciona tus intolerancias alimentarias y especifica su severidad. Las intolerancias no son alérgicas pero pueden causar malestar digestivo."
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
              <p className="text-sm text-neutral-600">Cargando intolerancias disponibles...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-danger-light bg-danger-light/30 p-4">
              <p className="text-sm text-danger-dark">{error}</p>
            </div>
          )}

          {/* Intolerance selection */}
          {!isLoading && !error && (
            <>
              {/* Search and select */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-base font-medium">
                  <AlertOctagon className="w-5 h-5 text-warning" />
                  Busca y selecciona tus intolerancias
                </label>
                <SearchableMultiSelect
                  items={intoleranceItems}
                  selected={selectedKeys}
                  onSelect={handleIntoleranceSelect}
                  placeholder="Buscar intolerancias (ej: lactosa, fructosa, histamina...)"
                  emptyMessage="No se encontraron intolerancias con ese criterio"
                />
                <p className="text-sm text-neutral-600">
                  Las intolerancias son diferentes a las alergias: causan
                  malestar digestivo pero no son reacciones inmunológicas.
                </p>
              </div>

              {/* Selected intolerances with severity */}
              {fields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-neutral-900">
                    Configura la severidad de cada intolerancia ({fields.length})
                  </h3>

                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const intoleranceInfo = intoleranceMap.get(field.key);

                      return (
                        <Card key={field.id} className="border-2 border-neutral-200">
                          <CardContent className="pt-6 space-y-4">
                            {/* Intolerance header */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-neutral-900">
                                  {intoleranceInfo?.label || field.key}
                                </h4>
                                {intoleranceInfo?.description && (
                                  <p className="text-xs text-neutral-600 mt-1">
                                    {intoleranceInfo.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-danger hover:text-danger hover:bg-danger-light/30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Severity selector */}
                            <FormField
                              control={form.control}
                              name={`intolerances.${index}.severity`}
                              render={({ field: severityField }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Severidad</FormLabel>
                                  <FormControl>
                                    <SeveritySelector
                                      value={severityField.value}
                                      onChange={severityField.onChange}
                                      variant="intolerance"
                                      layout="grid"
                                      size="md"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Optional notes */}
                            <FormField
                              control={form.control}
                              name={`intolerances.${index}.notes`}
                              render={({ field: notesField }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">
                                    Notas (opcional)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="ej: Puedo tolerar pequeñas cantidades"
                                      {...notesField}
                                      className="text-sm"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {fields.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center space-y-3">
                  <AlertOctagon className="w-12 h-12 mx-auto text-neutral-400" />
                  <div>
                    <p className="font-medium text-neutral-900">
                      No has seleccionado ninguna intolerancia
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">
                      Usa el buscador arriba para agregar tus intolerancias o
                      haz clic en "Omitir" si no tienes ninguna.
                    </p>
                  </div>
                </div>
              )}

              {/* Info box */}
              <div className="rounded-lg border border-info-light bg-info-light/30 p-4">
                <p className="text-sm text-neutral-700">
                  💡 <strong>Diferencia clave:</strong> Las <strong>alergias</strong>{" "}
                  son respuestas inmunológicas (pueden ser graves), mientras que
                  las <strong>intolerancias</strong> son problemas digestivos
                  (lactosa, fructosa, histamina). Ambas son importantes para tu
                  perfil.
                </p>
              </div>
            </>
          )}
        </form>
      </Form>
    </OnboardingLayout>
  );
}
