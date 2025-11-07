/**
 * BasicInfoSection - Edit basic profile information
 *
 * Fields:
 * - Display name
 * - Personal notes
 * - Pregnancy status
 */

"use client";

import { Control } from "react-hook-form";
import { User, FileText, Baby } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileEditFormData } from "@/lib/schemas/profile-edit.schema";

export interface BasicInfoSectionProps {
  control: Control<ProfileEditFormData>;
}

export function BasicInfoSection({ control }: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Información Básica
        </CardTitle>
        <CardDescription>
          Datos personales que aparecerán en tu perfil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display Name */}
        <FormField
          control={control}
          name="basicData.display_name"
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
          control={control}
          name="basicData.notes"
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
          control={control}
          name="basicData.pregnant"
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
            💡 <strong>Tip:</strong> Todos los campos son opcionales, pero
            completar esta información nos ayuda a ofrecerte una experiencia
            más personalizada y evaluaciones más precisas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
