/**
 * Strictness Editor Page - Edit global strictness profile
 *
 * Allows users to edit:
 * - Profile name
 * - Global strictness settings (traces, same-line, E-numbers, confidence, modes)
 * - View and manage per-allergen overrides
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, X, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/components/SupabaseProvider";
import { toast } from "sonner";
import { StrictnessToggles } from "@/components/onboarding";
import { strictnessSchema, type StrictnessFormData } from "@/lib/schemas/onboarding.schema";

interface StrictnessOverride {
  allergen_key: string;
  allergen_name: string;
  block_traces: boolean | null;
  block_same_line: boolean | null;
  e_numbers_uncertain: "allow" | "warn" | "block" | null;
  residual_protein_ppm: number | null;
  notes: string | null;
}

export default function StrictnessEditorPage() {
  const supabase = useSupabase();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [strictnessId, setStrictnessId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<StrictnessOverride[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<StrictnessFormData>({
    resolver: zodResolver(strictnessSchema) as Resolver<StrictnessFormData>,
    defaultValues: {
      profile_name: "Diario",
      block_traces: false,
      block_same_line: false,
      e_numbers_uncertain: "warn",
      min_model_confidence: 0.85,
      residual_protein_ppm: null,
      pediatric_mode: false,
      anaphylaxis_mode: false,
      notes: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    async function loadStrictnessData() {
      try {
        setLoading(true);
        setError(null);

        // Check auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login?redirect=/profile/strictness");
          return;
        }

        // Load user profile to get active strictness ID
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("active_strictness_id")
          .eq("user_id", session.user.id)
          .single();

        if (profileError) throw profileError;

        if (!profile?.active_strictness_id) {
          throw new Error("No active strictness profile found");
        }

        setStrictnessId(profile.active_strictness_id);

        // Load strictness profile
        const { data: strictness, error: strictnessError } = await supabase
          .from("strictness_profiles")
          .select("*")
          .eq("id", profile.active_strictness_id)
          .single();

        if (strictnessError) throw strictnessError;

        // Set form values
        form.reset({
          profile_name: strictness.name || "Diario",
          block_traces: strictness.block_traces,
          block_same_line: strictness.block_same_line,
          e_numbers_uncertain: strictness.e_numbers_uncertain,
          min_model_confidence: strictness.min_model_confidence,
          residual_protein_ppm: strictness.residual_protein_ppm_default,
          pediatric_mode: strictness.pediatric_mode,
          anaphylaxis_mode: strictness.anaphylaxis_mode,
          notes: strictness.description || "",
        });

        // Load overrides with allergen names
        const { data: overridesData, error: overridesError } = await supabase
          .from("strictness_overrides")
          .select(`
            allergen_types!inner(key, name_es),
            block_traces,
            block_same_line,
            e_numbers_uncertain,
            residual_protein_ppm,
            notes
          `)
          .eq("strictness_id", profile.active_strictness_id);

        if (overridesError) throw overridesError;

        // Transform overrides data
        const transformedOverrides: StrictnessOverride[] = (overridesData || []).map((o: any) => ({
          allergen_key: o.allergen_types.key,
          allergen_name: o.allergen_types.name_es,
          block_traces: o.block_traces,
          block_same_line: o.block_same_line,
          e_numbers_uncertain: o.e_numbers_uncertain,
          residual_protein_ppm: o.residual_protein_ppm,
          notes: o.notes,
        }));

        setOverrides(transformedOverrides);
      } catch (err) {
        console.error("Error loading strictness:", err);
        setError("Error al cargar la configuración de estrictitud. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    loadStrictnessData();
  }, [supabase, router, form]);

  const handleSave = async (data: StrictnessFormData) => {
    if (!strictnessId) return;

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from("strictness_profiles")
        .update({
          name: data.profile_name,
          block_traces: data.block_traces,
          block_same_line: data.block_same_line,
          e_numbers_uncertain: data.e_numbers_uncertain,
          min_model_confidence: data.min_model_confidence,
          residual_protein_ppm_default: data.residual_protein_ppm ?? undefined,
          pediatric_mode: data.pediatric_mode,
          anaphylaxis_mode: data.anaphylaxis_mode,
          description: data.notes || null,
        })
        .eq("id", strictnessId);

      if (updateError) throw updateError;

      toast.success("✓ Configuración guardada", {
        description: "Tu perfil de estrictitud ha sido actualizado",
      });

      router.push("/profile");
    } catch (err) {
      console.error("Error saving strictness:", err);
      toast.error("Error al guardar", {
        description: "No se pudo guardar la configuración. Intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/profile");
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-danger text-lg mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reintentar
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
            Configuración de Estrictitud
          </h1>
          <p className="text-neutral-600">
            Define cómo se evalúan las trazas, ingredientes inciertos y E-numbers
          </p>
        </div>
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
      </header>

      <Separator className="mb-8" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-8">
          {/* Global Strictness Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Reglas Globales
              </CardTitle>
              <CardDescription>
                Estas reglas se aplican a todos los alérgenos, a menos que crees una excepción específica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="profile_name"
                render={({ field }) => (
                  <FormItem>
                    <StrictnessToggles
                      value={form.watch()}
                      onChange={(data) => {
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
            </CardContent>
          </Card>

          {/* Per-Allergen Overrides */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Reglas por Alérgeno
              </CardTitle>
              <CardDescription>
                Crea reglas personalizadas para alérgenos específicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overrides.length > 0 ? (
                <div className="space-y-3">
                  {overrides.map((override) => (
                    <div
                      key={override.allergen_key}
                      className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                    >
                      <div>
                        <h4 className="font-medium text-neutral-900">
                          {override.allergen_name}
                        </h4>
                        <p className="text-sm text-neutral-600 mt-1">
                          {override.block_traces && "Trazas bloqueadas"}
                          {override.block_same_line && " • Misma línea bloqueada"}
                          {override.e_numbers_uncertain && ` • E-numbers: ${override.e_numbers_uncertain}`}
                          {override.residual_protein_ppm && ` • PPM: ${override.residual_protein_ppm}`}
                        </p>
                      </div>
                      <Link href={`/profile/strictness/${override.allergen_key}`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-neutral-300 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">
                    No tienes reglas personalizadas por alérgeno
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Las reglas globales se aplicarán a todos tus alérgenos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>

            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
