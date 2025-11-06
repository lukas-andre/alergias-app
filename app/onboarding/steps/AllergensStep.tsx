/**
 * Step 4: Allergens
 *
 * Select allergens with severity (0-3) and optional notes.
 * Features:
 * - Searchable multi-select with synonym support
 * - Severity selector for each allergen
 * - Optional notes field per allergen
 * - Visual cards for each selected allergen
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingLayout, SearchableMultiSelect, SeveritySelector, type SelectableItem } from "@/components/onboarding";
import { allergensSchema, type AllergensFormData, type AllergenItem } from "@/lib/schemas/onboarding.schema";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export interface AllergensStepProps {
  initialData?: Partial<AllergensFormData>;
  onNext: (data: AllergensFormData) => void;
  onBack: () => void;
  onSkip?: () => void;
}

export function AllergensStep({ initialData, onNext, onBack, onSkip }: AllergensStepProps) {
  const [allergenItems, setAllergenItems] = useState<SelectableItem[]>([]);
  const [allergenMap, setAllergenMap] = useState<Map<string, SelectableItem>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AllergensFormData>({
    resolver: zodResolver(allergensSchema),
    defaultValues: {
      allergens: initialData?.allergens ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "allergens",
  });

  // Fetch allergen types from Supabase
  useEffect(() => {
    async function fetchAllergenTypes() {
      try {
        setIsLoading(true);
        const supabase = createSupabaseBrowserClient();

        const { data, error: fetchError } = await supabase
          .from("allergen_types")
          .select("id, key, name_es, synonyms, notes")
          .order("name_es");

        if (fetchError) throw fetchError;

        const items: SelectableItem[] = (data || []).map((allergen) => ({
          id: allergen.id,
          key: allergen.key,
          label: allergen.name_es,
          description: allergen.notes || undefined,
          synonyms: allergen.synonyms || undefined,
        }));

        setAllergenItems(items);

        // Create map for quick lookup
        const map = new Map<string, SelectableItem>();
        items.forEach((item) => map.set(item.key, item));
        setAllergenMap(map);
      } catch (err) {
        console.error("Error fetching allergen types:", err);
        setError("No se pudieron cargar los alérgenos. Por favor, intenta nuevamente.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllergenTypes();
  }, []);

  const handleSubmit = (data: AllergensFormData) => {
    onNext(data);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onNext({ allergens: [] });
    }
  };

  // Get selected allergen keys
  const selectedKeys = fields.map((field) => field.key);

  // Handle allergen selection from SearchableMultiSelect
  const handleAllergenSelect = (keys: string[]) => {
    const currentKeys = new Set(selectedKeys);
    const newKeys = new Set(keys);

    // Add new allergens
    keys.forEach((key) => {
      if (!currentKeys.has(key)) {
        append({
          key,
          severity: 2, // Default to moderate
          notes: "",
        });
      }
    });

    // Remove deselected allergens
    fields.forEach((field, index) => {
      if (!newKeys.has(field.key)) {
        remove(index);
      }
    });
  };

  return (
    <OnboardingLayout
      currentStep={4}
      title="Alergias"
      description="Selecciona tus alergias alimentarias y especifica su severidad. Esta información es crítica para evaluar el riesgo de los productos."
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
              <p className="text-sm text-neutral-600">Cargando alérgenos disponibles...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-lg border border-danger-light bg-danger-light/30 p-4">
              <p className="text-sm text-danger-dark">{error}</p>
            </div>
          )}

          {/* Allergen selection */}
          {!isLoading && !error && (
            <>
              {/* Search and select */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-base font-medium">
                  <AlertCircle className="w-5 h-5 text-danger" />
                  Busca y selecciona tus alergias
                </label>
                <SearchableMultiSelect
                  items={allergenItems}
                  selected={selectedKeys}
                  onSelect={handleAllergenSelect}
                  placeholder="Buscar alérgenos (ej: leche, huevo, maní, soja...)"
                  emptyMessage="No se encontraron alérgenos con ese criterio"
                />
                <p className="text-sm text-neutral-600">
                  Busca por nombre o sinónimos. Por ejemplo: "lácteos", "milk", "leche"
                </p>
              </div>

              {/* Selected allergens with severity */}
              {fields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-neutral-900">
                    Configura la severidad de cada alergia ({fields.length})
                  </h3>

                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const allergenInfo = allergenMap.get(field.key);

                      return (
                        <Card key={field.id} className="border-2 border-neutral-200">
                          <CardContent className="pt-6 space-y-4">
                            {/* Allergen header */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-neutral-900">
                                  {allergenInfo?.label || field.key}
                                </h4>
                                {allergenInfo?.description && (
                                  <p className="text-xs text-neutral-600 mt-1">
                                    {allergenInfo.description}
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
                              name={`allergens.${index}.severity`}
                              render={({ field: severityField }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Severidad</FormLabel>
                                  <FormControl>
                                    <SeveritySelector
                                      value={severityField.value}
                                      onChange={severityField.onChange}
                                      variant="allergen"
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
                              name={`allergens.${index}.notes`}
                              render={({ field: notesField }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">
                                    Notas (opcional)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="ej: Solo alergia a leche cruda, procesada es OK"
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
                  <AlertCircle className="w-12 h-12 mx-auto text-neutral-400" />
                  <div>
                    <p className="font-medium text-neutral-900">
                      No has seleccionado ninguna alergia
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">
                      Usa el buscador arriba para agregar tus alergias o haz
                      clic en "Omitir" si no tienes ninguna.
                    </p>
                  </div>
                </div>
              )}

              {/* Info box */}
              <div className="rounded-lg border border-danger-light bg-danger-light/30 p-4">
                <p className="text-sm text-neutral-700">
                  ⚠️ <strong>Importante:</strong> Seleccionar correctamente tus
                  alergias y su severidad es crítico para que AlergiasCL pueda
                  evaluar el riesgo de los productos. En caso de anafilaxis
                  (severidad 3), se aplicarán las reglas más estrictas.
                </p>
              </div>
            </>
          )}
        </form>
      </Form>
    </OnboardingLayout>
  );
}
