/**
 * AllergensSection - Edit user's allergens with severity
 *
 * Features:
 * - Searchable multi-select
 * - Severity selector (0-3) per allergen
 * - Optional notes per allergen
 */

"use client";

import { useState, useEffect } from "react";
import { Control, useFieldArray, useFormContext } from "react-hook-form";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
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

export interface AllergensSectionProps {
  control: Control<ProfileEditFormData>;
}

export function AllergensSection({ control }: AllergensSectionProps) {
  const [allergenItems, setAllergenItems] = useState<SelectableItem[]>([]);
  const [allergenMap, setAllergenMap] = useState<Map<string, SelectableItem>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useFormContext<ProfileEditFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "allergens.allergens",
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

  // Get selected allergen keys
  const selectedKeys = fields.map((field) => field.key);

  // Handle allergen selection
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
          <AlertTriangle className="w-5 h-5 text-danger" />
          Alergias
        </CardTitle>
        <CardDescription>
          Selecciona tus alergias y especifica su severidad
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-base font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                Selecciona tus alergias
              </label>
              <SearchableMultiSelect
                items={allergenItems}
                selected={selectedKeys}
                onSelect={handleAllergenSelect}
                placeholder="Busca alergias (ej: leche, huevo, maní...)"
                emptyMessage="No se encontraron alérgenos que coincidan con tu búsqueda"
              />
              <p className="text-sm text-neutral-600 mt-2">
                Selecciona todos los alimentos que te causen reacciones alérgicas
              </p>
            </div>

            {/* Selected allergens with severity */}
            {fields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-700">
                  Alergias seleccionadas ({fields.length})
                </h3>

                {fields.map((field, index) => {
                  const allergenInfo = allergenMap.get(field.key);
                  return (
                    <Card key={field.id} className="border-neutral-200">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-neutral-900">
                              {allergenInfo?.label || field.key}
                            </h4>
                            {allergenInfo?.description && (
                              <p className="text-sm text-neutral-600 mt-1">
                                {allergenInfo.description}
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
                          name={`allergens.allergens.${index}.severity`}
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
                          name={`allergens.allergens.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notas (opcional)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="ej: Confirmada por médico, reacción en 2023..."
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
                <AlertTriangle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">
                  No has seleccionado ninguna alergia
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Usa el buscador arriba para agregar alergias
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
