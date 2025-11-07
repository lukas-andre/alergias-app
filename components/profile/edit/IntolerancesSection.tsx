/**
 * IntolerancesSection - Edit user's intolerances with severity
 *
 * Features:
 * - Searchable multi-select
 * - Severity selector (0-3) per intolerance
 * - Optional notes per intolerance
 */

"use client";

import { useState, useEffect } from "react";
import { Control, useFieldArray, useFormContext } from "react-hook-form";
import { Loader2, AlertOctagon, Trash2 } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableMultiSelect, SeveritySelector, type SelectableItem } from "@/components/onboarding";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ProfileEditFormData } from "@/lib/schemas/profile-edit.schema";

export interface IntolerancesSectionProps {
  control: Control<ProfileEditFormData>;
}

export function IntolerancesSection({ control }: IntolerancesSectionProps) {
  const [intoleranceItems, setIntoleranceItems] = useState<SelectableItem[]>([]);
  const [intoleranceMap, setIntoleranceMap] = useState<Map<string, SelectableItem>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useFormContext<ProfileEditFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "intolerances.intolerances",
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
          severity: 1, // Default to mild
          notes: "",
        });
      }
    });

    // Remove deselected intolerances
    const indicesToRemove: number[] = [];
    fields.forEach((field, index) => {
      if (!newKeys.has(field.key)) {
        indicesToRemove.push(index);
      }
    });
    // Remove in reverse order to avoid index shifting
    indicesToRemove.reverse().forEach((index) => remove(index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-warning" />
          Intolerancias
        </CardTitle>
        <CardDescription>
          Selecciona tus intolerancias y especifica su severidad
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-base font-medium mb-2">
                <AlertOctagon className="w-4 h-4" />
                Selecciona tus intolerancias
              </label>
              <SearchableMultiSelect
                items={intoleranceItems}
                selected={selectedKeys}
                onSelect={handleIntoleranceSelect}
                placeholder="Busca intolerancias (ej: lactosa, gluten, FODMAP...)"
                emptyMessage="No se encontraron intolerancias que coincidan con tu búsqueda"
              />
              <p className="text-sm text-neutral-600 mt-2">
                Selecciona todos los alimentos o ingredientes que te causen molestias digestivas
              </p>
            </div>

            {/* Selected intolerances with severity */}
            {fields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-700">
                  Intolerancias seleccionadas ({fields.length})
                </h3>

                {fields.map((field, index) => {
                  const intoleranceInfo = intoleranceMap.get(field.key);
                  return (
                    <Card key={field.id} className="border-neutral-200">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-neutral-900">
                              {intoleranceInfo?.label || field.key}
                            </h4>
                            {intoleranceInfo?.description && (
                              <p className="text-sm text-neutral-600 mt-1">
                                {intoleranceInfo.description}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-danger hover:text-danger-dark"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Severity */}
                        <FormField
                          control={control}
                          name={`intolerances.intolerances.${index}.severity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Severidad</FormLabel>
                              <FormControl>
                                <SeveritySelector
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Notes */}
                        <FormField
                          control={control}
                          name={`intolerances.intolerances.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notas (opcional)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="ej: Molestias digestivas leves, evitar en grandes cantidades..."
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
            )}

            {/* Empty state */}
            {fields.length === 0 && (
              <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
                <AlertOctagon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">
                  No has seleccionado ninguna intolerancia
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Usa el buscador arriba para agregar intolerancias
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
