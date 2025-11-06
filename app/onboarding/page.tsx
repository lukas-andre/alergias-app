/**
 * Onboarding Orchestrator Page
 *
 * Main page that manages the 7-step onboarding wizard flow.
 * Handles:
 * - Step navigation with query params (?step=1-7)
 * - Data persistence (localStorage + Supabase)
 * - Auth checks
 * - Final submission
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  WelcomeStep,
  BasicDataStep,
  DietsStep,
  AllergensStep,
  IntolerancesStep,
  StrictnessStep,
  ReviewStep,
  type ReviewStepData,
} from "./steps";
import {
  saveOnboardingProgress,
  loadOnboardingProgress,
  clearOnboardingProgress,
  hasOnboardingProgress,
  isProgressStale,
} from "@/lib/onboarding/persistence";
import type { CompleteOnboardingData } from "@/lib/schemas/onboarding.schema";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingData, setOnboardingData] = useState<Partial<CompleteOnboardingData>>({});

  // Dictionary data for display names
  const [dietNames, setDietNames] = useState<Map<string, string>>(new Map());
  const [allergenNames, setAllergenNames] = useState<Map<string, string>>(new Map());
  const [intoleranceNames, setIntoleranceNames] = useState<Map<string, string>>(new Map());

  // Load saved progress and dictionaries on mount
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);

        // Check auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login?redirect=/onboarding");
          return;
        }

        // Load dictionaries for display

        const [dietsRes, allergensRes, intolerancesRes] = await Promise.all([
          supabase.from("diet_types").select("key, name_es"),
          supabase.from("allergen_types").select("key, name_es"),
          supabase.from("intolerance_types").select("key, name_es"),
        ]);

        // Build name maps
        const dietsMap = new Map<string, string>();
        (dietsRes.data || []).forEach((d) => dietsMap.set(d.key, d.name_es));
        setDietNames(dietsMap);

        const allergensMap = new Map<string, string>();
        (allergensRes.data || []).forEach((a) => allergensMap.set(a.key, a.name_es));
        setAllergenNames(allergensMap);

        const intolerancesMap = new Map<string, string>();
        (intolerancesRes.data || []).forEach((i) => intolerancesMap.set(i.key, i.name_es));
        setIntoleranceNames(intolerancesMap);

        // Load saved progress
        if (hasOnboardingProgress() && !isProgressStale(24)) {
          const saved = loadOnboardingProgress();
          if (saved) {
            setOnboardingData(saved.data);
            setCurrentStep(saved.currentStep);
          }
        }

        // Check query param for step
        const stepParam = searchParams.get("step");
        if (stepParam) {
          const step = parseInt(stepParam, 10);
          if (step >= 1 && step <= 7) {
            setCurrentStep(step);
          }
        }
      } catch (error) {
        console.error("Error initializing onboarding:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when step changes
  useEffect(() => {
    if (!isLoading) {
      router.replace(`/onboarding?step=${currentStep}`, { scroll: false });
    }
  }, [currentStep, router, isLoading]);

  // Save progress when data changes
  useEffect(() => {
    if (!isLoading && currentStep > 1) {
      saveOnboardingProgress(currentStep, onboardingData);
    }
  }, [onboardingData, currentStep, isLoading]);

  // Navigation handlers
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 7) {
      setCurrentStep(step);
    }
  };

  const handleNext = (stepData: any, step: number) => {
    // Update data for current step
    const stepKey = getStepDataKey(step);
    setOnboardingData((prev) => ({
      ...prev,
      [stepKey]: stepData,
    }));

    // Move to next step
    if (step < 7) {
      goToStep(step + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const handleSkip = (step: number) => {
    // Skip means proceed with empty data
    const stepKey = getStepDataKey(step);
    const emptyData = getEmptyDataForStep(step);

    setOnboardingData((prev) => ({
      ...prev,
      [stepKey]: emptyData,
    }));

    goToStep(step + 1);
  };

  // Final submission
  const handleFinish = async () => {
    try {
      setIsSaving(true);

      const supabase = createSupabaseBrowserClient();

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("No user session");
      }

      const userId = session.user.id;

      // 1. Update user_profiles with basic data
      if (onboardingData.basicData) {
        await supabase
          .from("user_profiles")
          .update({
            display_name: onboardingData.basicData.display_name || null,
            notes: onboardingData.basicData.notes || null,
            pregnant: onboardingData.basicData.pregnant || false,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }

      // 2. Insert diets
      if (onboardingData.diets?.diets.length) {
        const dietRecords = await Promise.all(
          onboardingData.diets.diets.map(async (key) => {
            const { data: diet } = await supabase
              .from("diet_types")
              .select("id")
              .eq("key", key)
              .single();
            return diet ? { user_id: userId, diet_id: diet.id } : null;
          })
        );

        const validDiets = dietRecords.filter((r) => r !== null);
        if (validDiets.length) {
          await supabase.from("user_profile_diets").insert(validDiets);
        }
      }

      // 3. Insert allergens
      if (onboardingData.allergens?.allergens.length) {
        const allergenRecords = await Promise.all(
          onboardingData.allergens.allergens.map(async (allergen) => {
            const { data: allergenType } = await supabase
              .from("allergen_types")
              .select("id")
              .eq("key", allergen.key)
              .single();

            return allergenType
              ? {
                  user_id: userId,
                  allergen_id: allergenType.id,
                  severity: allergen.severity,
                  notes: allergen.notes || null,
                }
              : null;
          })
        );

        const validAllergens = allergenRecords.filter((r) => r !== null);
        if (validAllergens.length) {
          await supabase.from("user_profile_allergens").insert(validAllergens);
        }
      }

      // 4. Insert intolerances
      if (onboardingData.intolerances?.intolerances.length) {
        const intoleranceRecords = await Promise.all(
          onboardingData.intolerances.intolerances.map(async (intolerance) => {
            const { data: intoleranceType } = await supabase
              .from("intolerance_types")
              .select("id")
              .eq("key", intolerance.key)
              .single();

            return intoleranceType
              ? {
                  user_id: userId,
                  intolerance_id: intoleranceType.id,
                  severity: intolerance.severity,
                  notes: intolerance.notes || null,
                }
              : null;
          })
        );

        const validIntolerances = intoleranceRecords.filter((r) => r !== null);
        if (validIntolerances.length) {
          await supabase.from("user_profile_intolerances").insert(validIntolerances);
        }
      }

      // 5. Create or update strictness profile
      if (onboardingData.strictness) {
        const { data: existingProfile } = await supabase
          .from("strictness_profiles")
          .select("id")
          .eq("user_id", userId)
          .eq("name", onboardingData.strictness.profile_name)
          .single();

        if (existingProfile) {
          // Update existing
          await supabase
            .from("strictness_profiles")
            .update({
              description: onboardingData.strictness.notes || null,
              block_traces: onboardingData.strictness.block_traces,
              block_same_line: onboardingData.strictness.block_same_line,
              e_numbers_uncertain: onboardingData.strictness.e_numbers_uncertain,
              min_model_confidence: onboardingData.strictness.min_model_confidence,
              pediatric_mode: onboardingData.strictness.pediatric_mode,
              anaphylaxis_mode: onboardingData.strictness.anaphylaxis_mode,
              residual_protein_ppm_default: onboardingData.strictness.residual_protein_ppm,
            })
            .eq("id", existingProfile.id);

          // Set as active
          await supabase
            .from("user_profiles")
            .update({ active_strictness_id: existingProfile.id })
            .eq("user_id", userId);
        } else {
          // Create new
          const { data: newProfile } = await supabase
            .from("strictness_profiles")
            .insert({
              user_id: userId,
              name: onboardingData.strictness.profile_name,
              description: onboardingData.strictness.notes || null,
              block_traces: onboardingData.strictness.block_traces,
              block_same_line: onboardingData.strictness.block_same_line,
              e_numbers_uncertain: onboardingData.strictness.e_numbers_uncertain,
              min_model_confidence: onboardingData.strictness.min_model_confidence,
              pediatric_mode: onboardingData.strictness.pediatric_mode,
              anaphylaxis_mode: onboardingData.strictness.anaphylaxis_mode,
              residual_protein_ppm_default: onboardingData.strictness.residual_protein_ppm,
            })
            .select()
            .single();

          if (newProfile) {
            // Set as active
            await supabase
              .from("user_profiles")
              .update({ active_strictness_id: newProfile.id })
              .eq("user_id", userId);
          }
        }
      }

      // Clear localStorage progress
      clearOnboardingProgress();

      // Redirect to dashboard/scan page
      router.push("/scan");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      alert("Hubo un error al guardar tu perfil. Por favor, intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // Review step data
  const reviewData: ReviewStepData | null = useMemo(() => {
    if (
      onboardingData.basicData &&
      onboardingData.diets &&
      onboardingData.allergens &&
      onboardingData.intolerances &&
      onboardingData.strictness
    ) {
      return {
        basicData: onboardingData.basicData,
        diets: onboardingData.diets,
        allergens: onboardingData.allergens,
        intolerances: onboardingData.intolerances,
        strictness: onboardingData.strictness,
      };
    }
    return null;
  }, [onboardingData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-neutral-600">Cargando onboarding...</p>
        </div>
      </div>
    );
  }

  // Render current step
  return (
    <>
      {currentStep === 1 && (
        <WelcomeStep
          initialData={onboardingData.welcome}
          onNext={(data) => handleNext(data, 1)}
        />
      )}

      {currentStep === 2 && (
        <BasicDataStep
          initialData={onboardingData.basicData}
          onNext={(data) => handleNext(data, 2)}
          onBack={handleBack}
        />
      )}

      {currentStep === 3 && (
        <DietsStep
          initialData={onboardingData.diets}
          onNext={(data) => handleNext(data, 3)}
          onBack={handleBack}
          onSkip={() => handleSkip(3)}
        />
      )}

      {currentStep === 4 && (
        <AllergensStep
          initialData={onboardingData.allergens}
          onNext={(data) => handleNext(data, 4)}
          onBack={handleBack}
          onSkip={() => handleSkip(4)}
        />
      )}

      {currentStep === 5 && (
        <IntolerancesStep
          initialData={onboardingData.intolerances}
          onNext={(data) => handleNext(data, 5)}
          onBack={handleBack}
          onSkip={() => handleSkip(5)}
        />
      )}

      {currentStep === 6 && (
        <StrictnessStep
          initialData={onboardingData.strictness}
          onNext={(data) => handleNext(data, 6)}
          onBack={handleBack}
        />
      )}

      {currentStep === 7 && reviewData && (
        <ReviewStep
          data={reviewData}
          onBack={handleBack}
          onFinish={handleFinish}
          onEdit={goToStep}
          isLoading={isSaving}
          dietNames={dietNames}
          allergenNames={allergenNames}
          intoleranceNames={intoleranceNames}
        />
      )}
    </>
  );
}

// Helper functions

function getStepDataKey(step: number): keyof CompleteOnboardingData {
  switch (step) {
    case 1:
      return "welcome";
    case 2:
      return "basicData";
    case 3:
      return "diets";
    case 4:
      return "allergens";
    case 5:
      return "intolerances";
    case 6:
      return "strictness";
    default:
      return "welcome";
  }
}

function getEmptyDataForStep(step: number): any {
  switch (step) {
    case 3:
      return { diets: [] };
    case 4:
      return { allergens: [] };
    case 5:
      return { intolerances: [] };
    default:
      return {};
  }
}
