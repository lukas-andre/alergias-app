/**
 * Profile Page - User profile view with read-only display
 *
 * Shows user's personal info, diets, allergens, intolerances, and strictness settings
 * Clean card-based layout matching onboarding design system
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSupabase } from "@/components/SupabaseProvider";
import {
  BasicInfoCard,
  DietsCard,
  AllergensCard,
  IntolerancesCard,
  StrictnessCard,
} from "@/components/profile/ProfileSections";

interface ProfileData {
  display_name: string | null;
  pregnant: boolean;
  notes: string | null;
  diets: string[];
  allergens: Array<{
    allergen_key: string;
    severity: number;
    notes: string | null;
  }>;
  intolerances: Array<{
    intolerance_key: string;
    severity: number;
    notes: string | null;
  }>;
  strictnessName: string;
  strictnessSettings?: {
    block_traces: boolean;
    block_same_line: boolean;
    e_numbers_uncertain: string;
    pediatric_mode: boolean;
    anaphylaxis_mode: boolean;
  };
  overridesCount?: number;
}

export default function ProfilePage() {
  const supabase = useSupabase();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dictionary maps for display names
  const [dietNames, setDietNames] = useState<Map<string, string>>(new Map());
  const [allergenNames, setAllergenNames] = useState<Map<string, string>>(new Map());
  const [intoleranceNames, setIntoleranceNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        // Check auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login?redirect=/profile");
          return;
        }

        // Load dictionaries
        const [dietsRes, allergensRes, intolerancesRes] = await Promise.all([
          supabase.from("diet_types").select("key, name_es"),
          supabase.from("allergen_types").select("key, name_es"),
          supabase.from("intolerance_types").select("key, name_es"),
        ]);

        if (dietsRes.data) {
          setDietNames(new Map(dietsRes.data.map((d) => [d.key, d.name_es])));
        }
        if (allergensRes.data) {
          setAllergenNames(new Map(allergensRes.data.map((a) => [a.key, a.name_es])));
        }
        if (intolerancesRes.data) {
          setIntoleranceNames(
            new Map(intolerancesRes.data.map((i) => [i.key, i.name_es]))
          );
        }

        // Load profile data
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("display_name, pregnant, notes, active_strictness_id")
          .eq("user_id", session.user.id)
          .single();

        if (profileError) throw profileError;

        // Load diets (join with diet_types to get key)
        const { data: userDiets } = await supabase
          .from("user_profile_diets")
          .select("diet_types!inner(key)")
          .eq("user_id", session.user.id);

        // Load allergens (join with allergen_types to get key)
        const { data: userAllergens } = await supabase
          .from("user_profile_allergens")
          .select("allergen_types!inner(key), severity, notes")
          .eq("user_id", session.user.id)
          .order("allergen_types(key)");

        // Load intolerances (join with intolerance_types to get key)
        const { data: userIntolerances } = await supabase
          .from("user_profile_intolerances")
          .select("intolerance_types!inner(key), severity, notes")
          .eq("user_id", session.user.id)
          .order("intolerance_types(key)");

        // Load strictness profile with full settings
        let strictnessName = "Diario";
        let strictnessSettings;
        let overridesCount = 0;

        if (profile?.active_strictness_id) {
          const { data: strictnessData } = await supabase
            .from("strictness_profiles")
            .select("*")
            .eq("id", profile.active_strictness_id)
            .single();

          if (strictnessData) {
            strictnessName = strictnessData.name;
            strictnessSettings = {
              block_traces: strictnessData.block_traces,
              block_same_line: strictnessData.block_same_line,
              e_numbers_uncertain: strictnessData.e_numbers_uncertain,
              pediatric_mode: strictnessData.pediatric_mode,
              anaphylaxis_mode: strictnessData.anaphylaxis_mode,
            };
          }

          // Count overrides
          const { count } = await supabase
            .from("strictness_overrides")
            .select("*", { count: "exact", head: true })
            .eq("strictness_id", profile.active_strictness_id);

          overridesCount = count || 0;
        }

        setProfileData({
          display_name: profile?.display_name || null,
          pregnant: profile?.pregnant || false,
          notes: profile?.notes || null,
          diets: userDiets?.map((d: any) => d.diet_types.key) || [],
          allergens: userAllergens?.map((a: any) => ({
            allergen_key: a.allergen_types.key,
            severity: a.severity,
            notes: a.notes,
          })) || [],
          intolerances: userIntolerances?.map((i: any) => ({
            intolerance_key: i.intolerance_types.key,
            severity: i.severity,
            notes: i.notes,
          })) || [],
          strictnessName,
          strictnessSettings,
          overridesCount,
        });
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Error al cargar tu perfil. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleEditStrictness = () => {
    router.push("/profile/strictness");
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-32 bg-neutral-200 rounded"></div>
          <div className="h-32 bg-neutral-200 rounded"></div>
          <div className="h-32 bg-neutral-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (error || !profileData) {
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
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
              Tu Perfil Alérgico
            </h1>
            <p className="text-neutral-600">
              Administra tu información personal y configuración
            </p>
          </div>
          <Link href="/scan">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al Escáner
            </Button>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href="/profile/edit" className="flex-1 sm:flex-none">
            <Button className="w-full gap-2">
              <Edit className="w-4 h-4" />
              Editar Perfil
            </Button>
          </Link>
        </div>
      </header>

      <Separator className="mb-8" />

      {/* Section Cards */}
      <div className="space-y-6">
        <BasicInfoCard
          displayName={profileData.display_name}
          pregnant={profileData.pregnant}
          notes={profileData.notes}
        />

        <DietsCard diets={profileData.diets} dietNames={dietNames} />

        <AllergensCard
          allergens={profileData.allergens}
          allergenNames={allergenNames}
        />

        <IntolerancesCard
          intolerances={profileData.intolerances}
          intoleranceNames={intoleranceNames}
        />

        <StrictnessCard
          strictnessName={profileData.strictnessName}
          onEditClick={handleEditStrictness}
          blockTraces={profileData.strictnessSettings?.block_traces}
          blockSameLine={profileData.strictnessSettings?.block_same_line}
          eNumbersUncertain={profileData.strictnessSettings?.e_numbers_uncertain}
          pediatricMode={profileData.strictnessSettings?.pediatric_mode}
          anaphylaxisMode={profileData.strictnessSettings?.anaphylaxis_mode}
          overridesCount={profileData.overridesCount}
        />
      </div>

      {/* Footer Actions */}
      <Separator className="my-8" />
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button variant="outline" onClick={handleSignOut} className="gap-2">
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
        <Link href="/scan">
          <Button className="w-full sm:w-auto">Ir al Escáner</Button>
        </Link>
      </div>
    </main>
  );
}
