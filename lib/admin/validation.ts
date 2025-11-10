/**
 * Admin Form Validation Schemas
 *
 * Zod schemas for validating admin forms and API requests.
 */

import { z } from "zod";

// ============================================================================
// E-numbers
// ============================================================================

export const eNumberCodeSchema = z
  .string()
  .min(2, "Code must be at least 2 characters")
  .regex(/^E[0-9]+[a-z]*$/i, "Code must match format: E123 or E123a")
  .transform((val) => val.toUpperCase());

export const eNumberSchema = z.object({
  code: eNumberCodeSchema,
  name_es: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be less than 200 characters"),
  likely_origins: z
    .array(z.string())
    .min(1, "At least one origin is required")
    .default([]),
  linked_allergen_keys: z.array(z.string()).default([]),
  residual_protein_risk: z.boolean().default(false),
  notes: z.string().nullable().default(null),
});

export const eNumberUpdateSchema = eNumberSchema.partial().omit({ code: true });

export type ENumberFormData = z.infer<typeof eNumberSchema>;
export type ENumberUpdateData = z.infer<typeof eNumberUpdateSchema>;

// ============================================================================
// Allergen Types
// ============================================================================

export const allergenTypeSchema = z.object({
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(50, "Key must be less than 50 characters")
    .regex(/^[a-z0-9_-]+$/, "Key must be lowercase alphanumeric with dashes/underscores"),
  name_es: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  notes: z.string().nullable().default(null),
  synonyms: z.array(z.string()).nullable().default(null),
});

export const allergenTypeUpdateSchema = allergenTypeSchema.partial().omit({ key: true });

export type AllergenTypeFormData = z.infer<typeof allergenTypeSchema>;
export type AllergenTypeUpdateData = z.infer<typeof allergenTypeUpdateSchema>;

// ============================================================================
// Diet Types
// ============================================================================

export const dietTypeSchema = z.object({
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(50, "Key must be less than 50 characters")
    .regex(/^[a-z0-9_-]+$/, "Key must be lowercase alphanumeric with dashes/underscores"),
  name_es: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().nullable().default(null),
});

export const dietTypeUpdateSchema = dietTypeSchema.partial().omit({ key: true });

export type DietTypeFormData = z.infer<typeof dietTypeSchema>;
export type DietTypeUpdateData = z.infer<typeof dietTypeUpdateSchema>;

// ============================================================================
// Intolerance Types
// ============================================================================

export const intoleranceTypeSchema = z.object({
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(50, "Key must be less than 50 characters")
    .regex(/^[a-z0-9_-]+$/, "Key must be lowercase alphanumeric with dashes/underscores"),
  name_es: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  notes: z.string().nullable().default(null),
  synonyms: z.array(z.string()).nullable().default(null),
});

export const intoleranceTypeUpdateSchema = intoleranceTypeSchema.partial().omit({ key: true });

export type IntoleranceTypeFormData = z.infer<typeof intoleranceTypeSchema>;
export type IntoleranceTypeUpdateData = z.infer<typeof intoleranceTypeUpdateSchema>;

// ============================================================================
// Allergen Synonyms
// ============================================================================

export const allergenSynonymSchema = z.object({
  allergen_id: z.string().uuid("Invalid allergen ID"),
  surface: z
    .string()
    .min(1, "Surface must be at least 1 character")
    .max(100, "Surface must be less than 100 characters"),
  locale: z
    .string()
    .regex(/^[a-z]{2}-[A-Z]{2}$/, "Locale must match format: es-CL")
    .default("es-CL"),
  weight: z
    .number()
    .int()
    .min(1, "Weight must be at least 1")
    .max(3, "Weight must be at most 3")
    .default(1),
});

export const allergenSynonymUpdateSchema = allergenSynonymSchema.partial();

export type AllergenSynonymFormData = z.infer<typeof allergenSynonymSchema>;
export type AllergenSynonymUpdateData = z.infer<typeof allergenSynonymUpdateSchema>;

// ============================================================================
// App Settings
// ============================================================================

export const appSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.any(), // JSON value - validate per setting type
  description: z.string().nullable().default(null),
});

export const appSettingUpdateSchema = appSettingSchema.partial().omit({ key: true });

export type AppSettingFormData = z.infer<typeof appSettingSchema>;
export type AppSettingUpdateData = z.infer<typeof appSettingUpdateSchema>;

// ============================================================================
// Helper: Validate and parse with Zod
// ============================================================================

export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}
