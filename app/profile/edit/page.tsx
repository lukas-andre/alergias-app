/**
 * Profile Edit Page - Edit user profile information
 *
 * Allows users to edit:
 * - Basic info (name, notes, pregnancy status)
 * - Diets
 * - Allergens with severity
 * - Intolerances with severity
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSupabase } from "@/components/SupabaseProvider";
import { toast } from "sonner";
import { ProfileEditForm } from "@/components/profile/edit/ProfileEditForm";
import type { ProfileEditFormData } from "@/lib/schemas/profile-edit.schema";
import { trackEvent } from "@/lib/telemetry/client";

export default function ProfileEditPage() {
  const supabase = useSupabase();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState<Partial<ProfileEditFormData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);
        setError(null);

        // Check auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login?redirect=/profile/edit");
          return;
        }

        // Load profile data
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("display_name, pregnant, notes")
          .eq("user_id", session.user.id)
          .single();

        if (profileError) throw profileError;

        // Load diets
        const { data: userDiets } = await supabase
          .from("user_profile_diets")
          .select("diet_types!inner(key)")
          .eq("user_id", session.user.id);

        // Load allergens
        const { data: userAllergens } = await supabase
          .from("user_profile_allergens")
          .select("allergen_types!inner(key), severity, notes")
          .eq("user_id", session.user.id);

        // Load intolerances
        const { data: userIntolerances } = await supabase
          .from("user_profile_intolerances")
          .select("intolerance_types!inner(key), severity, notes")
          .eq("user_id", session.user.id);

        // Transform data to form format
        const formData = {
          basicData: {
            display_name: profile?.display_name || "",
            notes: profile?.notes || "",
            pregnant: profile?.pregnant || false,
          },
          diets: {
            diets: userDiets?.map((d: any) => d.diet_types.key) || [],
          },
          allergens: {
            allergens: userAllergens?.map((a: any) => ({
              key: a.allergen_types.key,
              severity: a.severity,
              notes: a.notes || "",
            })) || [],
          },
          intolerances: {
            intolerances: userIntolerances?.map((i: any) => ({
              key: i.intolerance_types.key,
              severity: i.severity,
              notes: i.notes || "",
            })) || [],
          },
        };

        setInitialData(formData);

        // Track profile edit started
        trackEvent("profile_edit_started", {
          has_display_name: !!profile?.display_name,
          diet_count: formData.diets.diets.length,
          allergen_count: formData.allergens.allergens.length,
          intolerance_count: formData.intolerances.intolerances.length,
        });
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Error al cargar tu perfil. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [supabase, router]);

  const handleSave = async (data: ProfileEditFormData) => {
    try {
      setSaving(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesión expirada. Por favor, inicia sesión nuevamente");
        router.push("/login?redirect=/profile/edit");
        return;
      }

      // 1. Update basic profile data
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          display_name: data.basicData.display_name || null,
          notes: data.basicData.notes || null,
          pregnant: data.basicData.pregnant,
        })
        .eq("user_id", session.user.id);

      if (profileError) throw profileError;

      // 2. Update diets (delete all + re-insert)
      // First delete existing
      await supabase
        .from("user_profile_diets")
        .delete()
        .eq("user_id", session.user.id);

      // Insert new diets
      if (data.diets.diets.length > 0) {
        // Get diet IDs from keys
        const { data: dietTypes } = await supabase
          .from("diet_types")
          .select("id, key")
          .in("key", data.diets.diets);

        if (dietTypes) {
          const dietInserts = dietTypes.map((d) => ({
            user_id: session.user.id,
            diet_id: d.id,
          }));

          const { error: dietsError } = await supabase
            .from("user_profile_diets")
            .insert(dietInserts);

          if (dietsError) throw dietsError;
        }
      }

      // 3. Update allergens (delete all + re-insert)
      await supabase
        .from("user_profile_allergens")
        .delete()
        .eq("user_id", session.user.id);

      if (data.allergens.allergens.length > 0) {
        // Get allergen IDs from keys
        const { data: allergenTypes } = await supabase
          .from("allergen_types")
          .select("id, key")
          .in("key", data.allergens.allergens.map((a) => a.key));

        if (allergenTypes) {
          const allergenInserts = data.allergens.allergens.map((a) => {
            const allergenType = allergenTypes.find((t) => t.key === a.key);
            return {
              user_id: session.user.id,
              allergen_id: allergenType!.id,
              severity: a.severity,
              notes: a.notes || null,
            };
          });

          const { error: allergensError } = await supabase
            .from("user_profile_allergens")
            .insert(allergenInserts);

          if (allergensError) throw allergensError;
        }
      }

      // 4. Update intolerances (delete all + re-insert)
      await supabase
        .from("user_profile_intolerances")
        .delete()
        .eq("user_id", session.user.id);

      if (data.intolerances.intolerances.length > 0) {
        // Get intolerance IDs from keys
        const { data: intoleranceTypes } = await supabase
          .from("intolerance_types")
          .select("id, key")
          .in("key", data.intolerances.intolerances.map((i) => i.key));

        if (intoleranceTypes) {
          const intoleranceInserts = data.intolerances.intolerances.map((i) => {
            const intoleranceType = intoleranceTypes.find((t) => t.key === i.key);
            return {
              user_id: session.user.id,
              intolerance_id: intoleranceType!.id,
              severity: i.severity,
              notes: i.notes || null,
            };
          });

          const { error: intolerancesError } = await supabase
            .from("user_profile_intolerances")
            .insert(intoleranceInserts);

          if (intolerancesError) throw intolerancesError;
        }
      }

      // Track profile edit completed
      trackEvent("profile_edit_completed", {
        diet_count: data.diets.diets.length,
        allergen_count: data.allergens.allergens.length,
        intolerance_count: data.intolerances.intolerances.length,
        has_display_name: !!data.basicData.display_name,
        is_pregnant: data.basicData.pregnant,
      });

      toast.success("✓ Cambios guardados", {
        description: "Tu perfil ha sido actualizado correctamente",
      });

      // Redirect back to profile
      router.push("/profile");
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Error al guardar", {
        description: "No se pudieron guardar los cambios. Intenta nuevamente.",
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
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (error || !initialData) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-danger text-lg mb-4">{error || "No se pudo cargar el perfil"}</p>
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
            Editar Perfil
          </h1>
          <p className="text-neutral-600">
            Actualiza tu información personal y preferencias
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

      {/* Edit Form */}
      <ProfileEditForm
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={saving}
      />
    </main>
  );
}
