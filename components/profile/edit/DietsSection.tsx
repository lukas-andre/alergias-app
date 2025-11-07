/**
 * DietsSection - Edit user's dietary restrictions
 *
 * Uses SearchableMultiSelect to choose multiple diets
 */

"use client";

import { useState, useEffect } from "react";
import { Control } from "react-hook-form";
import { Loader2, Utensils } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableMultiSelect, type SelectableItem } from "@/components/onboarding";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ProfileEditFormData } from "@/lib/schemas/profile-edit.schema";

export interface DietsSectionProps {
  control: Control<ProfileEditFormData>;
}

export function DietsSection({ control }: DietsSectionProps) {
  const [dietItems, setDietItems] = useState<SelectableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-primary" />
          Dietas y Restricciones Alimentarias
        </CardTitle>
        <CardDescription>
          Selecciona las dietas o restricciones que sigues
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <FormField
            control={control}
            name="diets.diets"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base">
                  <Utensils className="w-4 h-4" />
                  Selecciona tus dietas
                </FormLabel>
                <FormControl>
                  <SearchableMultiSelect
                    items={dietItems}
                    selected={field.value || []}
                    onSelect={field.onChange}
                    placeholder="Busca dietas (ej: vegetariano, celíaco...)"
                    emptyMessage="No se encontraron dietas que coincidan con tu búsqueda"
                  />
                </FormControl>
                <FormDescription>
                  Esto nos ayuda a filtrar productos que no son adecuados para ti.
                  Puedes seleccionar varias dietas simultáneamente.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Info box */}
        {!isLoading && !error && (
          <div className="mt-6 rounded-lg border border-info-light bg-info-light/30 p-4">
            <p className="text-sm text-neutral-700">
              💡 <strong>Tip:</strong> Si no sigues ninguna dieta específica,
              puedes dejar esta sección vacía. Siempre podrás agregar dietas
              más adelante.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
