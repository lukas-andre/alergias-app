/**
 * Per-Allergen Override Editor - Create/edit/delete custom rules for specific allergen
 *
 * Shows comparison between global settings and allergen-specific overrides
 * Allows creating, editing, or removing overrides
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save, X, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/components/SupabaseProvider";
import { toast } from "sonner";

interface GlobalStrictness {
  block_traces: boolean;
  block_same_line: boolean;
  e_numbers_uncertain: "allow" | "warn" | "block";
  residual_protein_ppm_default: number | null;
}

interface OverrideFormData {
  block_traces: boolean | null;
  block_same_line: boolean | null;
  e_numbers_uncertain: "allow" | "warn" | "block" | null;
  residual_protein_ppm: number | null;
  notes: string;
}

export default function AllergenOverrideEditorPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const params = useParams();
  const allergenKey = params.allergenKey as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allergenName, setAllergenName] = useState<string>("");
  const [allergenId, setAllergenId] = useState<string | null>(null);
  const [strictnessId, setStrictnessId] = useState<string | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalStrictness | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for overrides (null = use global)
  const [overrideBlockTraces, setOverrideBlockTraces] = useState<boolean | null>(null);
  const [overrideBlockSameLine, setOverrideBlockSameLine] = useState<boolean | null>(null);
  const [overrideENumbers, setOverrideENumbers] = useState<"allow" | "warn" | "block" | null>(null);
  const [overridePpm, setOverridePpm] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Check auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login?redirect=/profile/strictness");
          return;
        }

        // Get allergen details
        const { data: allergen, error: allergenError } = await supabase
          .from("allergen_types")
          .select("id, key, name_es")
          .eq("key", allergenKey)
          .single();

        if (allergenError) throw new Error("Alérgeno no encontrado");

        setAllergenName(allergen.name_es);
        setAllergenId(allergen.id);

        // Get user profile to get active strictness ID
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("active_strictness_id")
          .eq("user_id", session.user.id)
          .single();

        if (!profile?.active_strictness_id) {
          throw new Error("No active strictness profile found");
        }

        setStrictnessId(profile.active_strictness_id);

        // Get global strictness settings
        const { data: strictness } = await supabase
          .from("strictness_profiles")
          .select("*")
          .eq("id", profile.active_strictness_id)
          .single();

        if (strictness) {
          setGlobalSettings({
            block_traces: strictness.block_traces,
            block_same_line: strictness.block_same_line,
            e_numbers_uncertain: strictness.e_numbers_uncertain,
            residual_protein_ppm_default: strictness.residual_protein_ppm_default,
          });
        }

        // Check if override exists
        const { data: override } = await supabase
          .from("strictness_overrides")
          .select("*")
          .eq("strictness_id", profile.active_strictness_id)
          .eq("allergen_id", allergen.id)
          .maybeSingle();

        if (override) {
          setOverrideBlockTraces(override.block_traces);
          setOverrideBlockSameLine(override.block_same_line);
          setOverrideENumbers(override.e_numbers_uncertain);
          setOverridePpm(override.residual_protein_ppm);
          setNotes(override.notes || "");
        }
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(err.message || "Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, router, allergenKey]);

  const handleSave = async () => {
    if (!allergenId || !strictnessId) return;

    try {
      setSaving(true);

      // Upsert override
      const { error: upsertError } = await supabase
        .from("strictness_overrides")
        .upsert({
          strictness_id: strictnessId,
          allergen_id: allergenId,
          block_traces: overrideBlockTraces,
          block_same_line: overrideBlockSameLine,
          e_numbers_uncertain: overrideENumbers,
          residual_protein_ppm: overridePpm,
          notes: notes || null,
        }, {
          onConflict: "strictness_id,allergen_id",
        });

      if (upsertError) throw upsertError;

      toast.success("✓ Regla guardada", {
        description: `La regla personalizada para ${allergenName} ha sido guardada`,
      });

      router.push("/profile/strictness");
    } catch (err) {
      console.error("Error saving override:", err);
      toast.error("Error al guardar", {
        description: "No se pudo guardar la regla personalizada",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!allergenId || !strictnessId) return;

    if (!confirm(`¿Eliminar la regla personalizada para ${allergenName}? Se aplicarán las reglas globales.`)) {
      return;
    }

    try {
      setSaving(true);

      const { error: deleteError } = await supabase
        .from("strictness_overrides")
        .delete()
        .eq("strictness_id", strictnessId)
        .eq("allergen_id", allergenId);

      if (deleteError) throw deleteError;

      toast.success("✓ Regla eliminada", {
        description: `Se aplicarán las reglas globales a ${allergenName}`,
      });

      router.push("/profile/strictness");
    } catch (err) {
      console.error("Error deleting override:", err);
      toast.error("Error al eliminar", {
        description: "No se pudo eliminar la regla personalizada",
      });
    } finally {
      setSaving(false);
    }
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
          <Link href="/profile/strictness">
            <Button variant="outline">Volver</Button>
          </Link>
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
            Regla para "{allergenName}"
          </h1>
          <p className="text-neutral-600">
            Personaliza cómo evaluar productos con {allergenName.toLowerCase()}
          </p>
        </div>
        <Link href="/profile/strictness">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
      </header>

      <Separator className="mb-8" />

      <div className="space-y-6">
        {/* Bloquear Trazas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bloquear Trazas</CardTitle>
            <CardDescription>
              ¿Bloquear productos con advertencias de "Puede contener..." o "Trazas de..."?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-neutral-700">Regla Global</p>
                <p className="text-sm text-neutral-600">
                  {globalSettings?.block_traces ? "Bloqueadas" : "Permitidas"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="override-traces">Usar regla personalizada</Label>
              <Switch
                id="override-traces"
                checked={overrideBlockTraces !== null}
                onCheckedChange={(checked) => {
                  setOverrideBlockTraces(checked ? !globalSettings?.block_traces : null);
                }}
              />
            </div>

            {overrideBlockTraces !== null && (
              <div className="p-4 border border-primary rounded-lg bg-primary-soft/20">
                <div className="flex items-center justify-between">
                  <Label htmlFor="block-traces-value">Bloquear trazas</Label>
                  <Switch
                    id="block-traces-value"
                    checked={overrideBlockTraces}
                    onCheckedChange={setOverrideBlockTraces}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloquear Misma Línea */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bloquear Misma Línea</CardTitle>
            <CardDescription>
              ¿Bloquear productos fabricados en líneas compartidas?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-neutral-700">Regla Global</p>
                <p className="text-sm text-neutral-600">
                  {globalSettings?.block_same_line ? "Bloqueadas" : "Permitidas"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="override-same-line">Usar regla personalizada</Label>
              <Switch
                id="override-same-line"
                checked={overrideBlockSameLine !== null}
                onCheckedChange={(checked) => {
                  setOverrideBlockSameLine(checked ? !globalSettings?.block_same_line : null);
                }}
              />
            </div>

            {overrideBlockSameLine !== null && (
              <div className="p-4 border border-primary rounded-lg bg-primary-soft/20">
                <div className="flex items-center justify-between">
                  <Label htmlFor="block-same-line-value">Bloquear misma línea</Label>
                  <Switch
                    id="block-same-line-value"
                    checked={overrideBlockSameLine}
                    onCheckedChange={setOverrideBlockSameLine}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* E-numbers Inciertos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">E-numbers Inciertos</CardTitle>
            <CardDescription>
              ¿Cómo tratar E-numbers de origen incierto relacionados con este alérgeno?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-neutral-700">Regla Global</p>
                <p className="text-sm text-neutral-600 capitalize">
                  {globalSettings?.e_numbers_uncertain === "allow" ? "Permitir" :
                   globalSettings?.e_numbers_uncertain === "warn" ? "Advertir" : "Bloquear"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="override-enumbers">Usar regla personalizada</Label>
              <Switch
                id="override-enumbers"
                checked={overrideENumbers !== null}
                onCheckedChange={(checked) => {
                  setOverrideENumbers(checked ? "warn" : null);
                }}
              />
            </div>

            {overrideENumbers !== null && (
              <RadioGroup value={overrideENumbers} onValueChange={(v) => setOverrideENumbers(v as any)}>
                <div className="p-4 border border-primary rounded-lg bg-primary-soft/20 space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="allow" id="allow" />
                    <Label htmlFor="allow">Permitir</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="warn" id="warn" />
                    <Label htmlFor="warn">Advertir</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="block" id="block" />
                    <Label htmlFor="block">Bloquear</Label>
                  </div>
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* PPM Residual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PPM Residual</CardTitle>
            <CardDescription>
              Umbral de partes por millón para proteína residual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-neutral-700">Regla Global</p>
                <p className="text-sm text-neutral-600">
                  {globalSettings?.residual_protein_ppm_default || 10} ppm
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="override-ppm">Usar regla personalizada</Label>
              <Switch
                id="override-ppm"
                checked={overridePpm !== null}
                onCheckedChange={(checked) => {
                  setOverridePpm(checked ? (globalSettings?.residual_protein_ppm_default || 10) : null);
                }}
              />
            </div>

            {overridePpm !== null && (
              <div className="p-4 border border-primary rounded-lg bg-primary-soft/20">
                <Label htmlFor="ppm-value">Umbral PPM</Label>
                <Input
                  id="ppm-value"
                  type="number"
                  min="0"
                  value={overridePpm}
                  onChange={(e) => setOverridePpm(parseInt(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
            <CardDescription>
              Información adicional sobre esta regla personalizada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ej: Anafilaxis confirmada, evitar completamente..."
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/profile/strictness")}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>

            {(overrideBlockTraces !== null || overrideBlockSameLine !== null ||
              overrideENumbers !== null || overridePpm !== null) && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Regla
              </Button>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
