/**
 * Profile Edit Validation Schemas
 *
 * Reuses onboarding schemas for consistency.
 * Used in /profile/edit page for editing user profile data.
 */

import { z } from "zod";
import {
  basicDataSchema,
  dietsSchema,
  allergensSchema,
  intolerancesSchema,
} from "./onboarding.schema";

// =============================================================================
// PROFILE EDIT SCHEMA
// =============================================================================

/**
 * Combined schema for profile editing
 * Merges all editable sections into single validation schema
 */
export const profileEditSchema = z.object({
  basicData: basicDataSchema,
  diets: dietsSchema,
  allergens: allergensSchema,
  intolerances: intolerancesSchema,
});

export type ProfileEditFormData = z.infer<typeof profileEditSchema>;

// =============================================================================
// INDIVIDUAL SECTION SCHEMAS (for granular validation)
// =============================================================================

/**
 * Re-export individual schemas for section-specific validation
 */
export { basicDataSchema, dietsSchema, allergensSchema, intolerancesSchema };

export type BasicDataFormData = z.infer<typeof basicDataSchema>;
export type DietsFormData = z.infer<typeof dietsSchema>;
export type AllergensFormData = z.infer<typeof allergensSchema>;
export type IntolerancesFormData = z.infer<typeof intolerancesSchema>;
