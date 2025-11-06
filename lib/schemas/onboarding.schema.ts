/**
 * AlergiasCL - Onboarding Wizard Validation Schemas
 *
 * Zod schemas for 7-step onboarding wizard flow.
 * Each schema corresponds to a wizard step and validates user input.
 *
 * Steps:
 * 1. Welcome (privacy acceptance)
 * 2. Basic Data (display_name, notes, pregnant)
 * 3. Diets (multi-select diet types)
 * 4. Allergens (allergen keys + severity + notes)
 * 5. Intolerances (intolerance keys + severity + notes)
 * 6. Strictness (global rules + toggles)
 * 7. Review (read-only, no validation)
 */

import { z } from "zod";

// =============================================================================
// STEP 1: WELCOME & PRIVACY
// =============================================================================

export const welcomeSchema = z.object({
  /**
   * User must accept privacy policy to continue
   */
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar la política de privacidad para continuar",
  }),

  /**
   * Optional: User acknowledges medical disclaimer
   */
  acknowledgeMedicalDisclaimer: z.boolean().optional(),
});

export type WelcomeFormData = z.infer<typeof welcomeSchema>;

// =============================================================================
// STEP 2: BASIC DATA
// =============================================================================

export const basicDataSchema = z.object({
  /**
   * Display name (shown in profile and greetings)
   * Optional but recommended for personalization
   */
  display_name: z
    .string()
    .min(1, "El nombre debe tener al menos 1 carácter")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),

  /**
   * Personal notes about dietary preferences or medical history
   * Free-form text, optional
   */
  notes: z
    .string()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .optional()
    .or(z.literal("")),

  /**
   * Pregnancy status (affects risk evaluation)
   */
  pregnant: z.boolean().default(false),
});

export type BasicDataFormData = z.infer<typeof basicDataSchema>;

// =============================================================================
// STEP 3: DIETS
// =============================================================================

export const dietsSchema = z.object({
  /**
   * Array of selected diet keys (e.g., "vegetarian", "vegan", "celiac")
   * Keys must match `diet_types.key` in database
   */
  diets: z
    .array(z.string().min(1, "La clave de dieta no puede estar vacía"))
    .min(0, "Selecciona al menos una dieta o continúa sin seleccionar")
    .default([]),
});

export type DietsFormData = z.infer<typeof dietsSchema>;

// =============================================================================
// STEP 4: ALLERGENS
// =============================================================================

/**
 * Allergen severity scale (0-3):
 * 0 = Sensitivity (minor discomfort)
 * 1 = Mild (noticeable symptoms)
 * 2 = Moderate (significant reaction)
 * 3 = Severe/Anaphylaxis (life-threatening)
 */
export const allergenSeveritySchema = z
  .number()
  .int()
  .min(0, "La severidad mínima es 0")
  .max(3, "La severidad máxima es 3");

export const allergenItemSchema = z.object({
  /**
   * Allergen key (e.g., "milk", "eggs", "peanuts")
   * Must match `allergen_types.key` in database
   */
  key: z.string().min(1, "La clave de alergeno no puede estar vacía"),

  /**
   * Severity level (0-3)
   */
  severity: allergenSeveritySchema,

  /**
   * Optional notes about this specific allergen
   * E.g., "Solo reacciona a leche cruda, no procesada"
   */
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export const allergensSchema = z.object({
  /**
   * Array of allergens with severity and notes
   */
  allergens: z
    .array(allergenItemSchema)
    .min(0, "Selecciona al menos un alérgeno o continúa sin seleccionar")
    .default([]),
});

export type AllergenItem = z.infer<typeof allergenItemSchema>;
export type AllergensFormData = z.infer<typeof allergensSchema>;

// =============================================================================
// STEP 5: INTOLERANCES
// =============================================================================

/**
 * Intolerance severity scale (0-3):
 * Similar to allergens but typically not life-threatening
 * 0 = Mild discomfort
 * 1 = Moderate symptoms
 * 2 = Significant digestive issues
 * 3 = Severe intolerance (extreme avoidance needed)
 */
export const intoleranceSeveritySchema = z
  .number()
  .int()
  .min(0, "La severidad mínima es 0")
  .max(3, "La severidad máxima es 3");

export const intoleranceItemSchema = z.object({
  /**
   * Intolerance key (e.g., "lactose", "fructose", "gluten")
   * Must match `intolerance_types.key` in database
   */
  key: z.string().min(1, "La clave de intolerancia no puede estar vacía"),

  /**
   * Severity level (0-3)
   */
  severity: intoleranceSeveritySchema,

  /**
   * Optional notes about this specific intolerance
   */
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export const intolerancesSchema = z.object({
  /**
   * Array of intolerances with severity and notes
   */
  intolerances: z
    .array(intoleranceItemSchema)
    .min(0, "Selecciona al menos una intolerancia o continúa sin seleccionar")
    .default([]),
});

export type IntoleranceItem = z.infer<typeof intoleranceItemSchema>;
export type IntolerancesFormData = z.infer<typeof intolerancesSchema>;

// =============================================================================
// STEP 6: STRICTNESS (ACTIVE PROFILE)
// =============================================================================

export const strictnessSchema = z.object({
  /**
   * Profile name (e.g., "Diario", "Pediátrico", "Máximo")
   */
  profile_name: z
    .string()
    .min(1, "El nombre del perfil no puede estar vacío")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .default("Diario"),

  /**
   * Block products with trace warnings ("Puede contener...")
   */
  block_traces: z.boolean().default(false),

  /**
   * Block products processed on same production line
   */
  block_same_line: z.boolean().default(false),

  /**
   * Block E-numbers with uncertain allergen origin
   * (e.g., E322 Lecithin - could be soy or egg)
   */
  e_numbers_uncertain: z
    .enum(["allow", "warn", "block"])
    .default("warn"),

  /**
   * Minimum confidence threshold for OpenAI extraction (0.0 - 1.0)
   * Products below this threshold are flagged as uncertain
   */
  min_model_confidence: z
    .number()
    .min(0, "La confianza mínima es 0")
    .max(1, "La confianza máxima es 1")
    .default(0.85),

  /**
   * Residual protein PPM threshold (parts per million)
   * Used for trace analysis (null = no threshold)
   */
  residual_protein_ppm: z
    .number()
    .int()
    .min(0, "El PPM no puede ser negativo")
    .nullable()
    .optional(),

  /**
   * Enable pediatric mode (stricter rules for children)
   */
  pediatric_mode: z.boolean().default(false),

  /**
   * Enable anaphylaxis mode (maximum strictness)
   * All allergen matches become HIGH risk
   */
  anaphylaxis_mode: z.boolean().default(false),

  /**
   * Optional notes about this strictness profile
   */
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type StrictnessFormData = z.infer<typeof strictnessSchema>;

// =============================================================================
// STEP 7: REVIEW (NO VALIDATION - READ-ONLY)
// =============================================================================

/**
 * Combined review data (all previous steps)
 * This is a union type for display purposes only
 */
export const reviewSchema = z.object({
  basicData: basicDataSchema,
  diets: dietsSchema,
  allergens: allergensSchema,
  intolerances: intolerancesSchema,
  strictness: strictnessSchema,
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// =============================================================================
// COMPLETE ONBOARDING DATA (ALL STEPS COMBINED)
// =============================================================================

export const completeOnboardingSchema = z.object({
  welcome: welcomeSchema,
  basicData: basicDataSchema,
  diets: dietsSchema,
  allergens: allergensSchema,
  intolerances: intolerancesSchema,
  strictness: strictnessSchema,
});

export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>;

// =============================================================================
// SEARCH & AUTOCOMPLETE SCHEMAS
// =============================================================================

/**
 * Schema for diet search query
 */
export const dietSearchSchema = z.object({
  query: z.string().min(0).max(100),
  limit: z.number().int().min(1).max(50).default(10),
});

export type DietSearchQuery = z.infer<typeof dietSearchSchema>;

/**
 * Schema for allergen search query (supports synonym matching)
 */
export const allergenSearchSchema = z.object({
  query: z.string().min(0).max(100),
  limit: z.number().int().min(1).max(50).default(10),
  /**
   * Include synonyms in search results
   */
  includeSynonyms: z.boolean().default(true),
});

export type AllergenSearchQuery = z.infer<typeof allergenSearchSchema>;

/**
 * Schema for intolerance search query
 */
export const intoleranceSearchSchema = z.object({
  query: z.string().min(0).max(100),
  limit: z.number().int().min(1).max(50).default(10),
  includeSynonyms: z.boolean().default(true),
});

export type IntoleranceSearchQuery = z.infer<typeof intoleranceSearchSchema>;

// =============================================================================
// STEP NAVIGATION SCHEMA
// =============================================================================

/**
 * Valid step numbers (1-7)
 */
export const stepNumberSchema = z
  .number()
  .int()
  .min(1, "El paso mínimo es 1")
  .max(7, "El paso máximo es 7");

export type StepNumber = z.infer<typeof stepNumberSchema>;

// =============================================================================
// PERSISTENCE SCHEMA (LOCALSTORAGE)
// =============================================================================

/**
 * Schema for persisting onboarding progress to localStorage
 * Includes current step and all collected data
 */
export const onboardingProgressSchema = z.object({
  /**
   * Current step (1-7)
   */
  currentStep: stepNumberSchema,

  /**
   * Timestamp of last save
   */
  lastSaved: z.string().datetime(),

  /**
   * Partial data collected so far
   */
  data: z.object({
    welcome: welcomeSchema.partial().optional(),
    basicData: basicDataSchema.partial().optional(),
    diets: dietsSchema.partial().optional(),
    allergens: allergensSchema.partial().optional(),
    intolerances: intolerancesSchema.partial().optional(),
    strictness: strictnessSchema.partial().optional(),
  }),
});

export type OnboardingProgress = z.infer<typeof onboardingProgressSchema>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validates a specific step's data
 * Returns { success: boolean, errors?: ZodError }
 */
export function validateStep(
  step: number,
  data: unknown
): { success: boolean; errors?: z.ZodError } {
  try {
    switch (step) {
      case 1:
        welcomeSchema.parse(data);
        break;
      case 2:
        basicDataSchema.parse(data);
        break;
      case 3:
        dietsSchema.parse(data);
        break;
      case 4:
        allergensSchema.parse(data);
        break;
      case 5:
        intolerancesSchema.parse(data);
        break;
      case 6:
        strictnessSchema.parse(data);
        break;
      case 7:
        // Step 7 (review) has no validation
        return { success: true };
      default:
        throw new Error(`Invalid step number: ${step}`);
    }
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Checks if all required steps have been completed
 * (Steps 1-6 must have valid data, step 7 is review-only)
 */
export function isOnboardingComplete(
  progress: Partial<CompleteOnboardingData>
): boolean {
  try {
    welcomeSchema.parse(progress.welcome);
    basicDataSchema.parse(progress.basicData);
    dietsSchema.parse(progress.diets);
    allergensSchema.parse(progress.allergens);
    intolerancesSchema.parse(progress.intolerances);
    strictnessSchema.parse(progress.strictness);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get default values for a specific step
 */
export function getStepDefaults(step: number): unknown {
  switch (step) {
    case 1:
      return { acceptPrivacy: false };
    case 2:
      return { display_name: "", notes: "", pregnant: false };
    case 3:
      return { diets: [] };
    case 4:
      return { allergens: [] };
    case 5:
      return { intolerances: [] };
    case 6:
      return {
        profile_name: "Diario",
        block_traces: false,
        block_same_line: false,
        e_numbers_uncertain: "warn",
        min_model_confidence: 0.85,
        residual_protein_ppm: null,
        pediatric_mode: false,
        anaphylaxis_mode: false,
        notes: "",
      };
    case 7:
      return {}; // Review step has no defaults
    default:
      return {};
  }
}
