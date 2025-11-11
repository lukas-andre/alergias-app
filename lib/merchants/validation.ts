/**
 * Merchant Validation Schemas
 *
 * Zod schemas for validating merchant forms and API requests.
 */

import { z } from "zod";

// ============================================================================
// Enums
// ============================================================================

export const billingStatusEnum = z.enum(["trial", "active", "past_due", "inactive"]);
export const mediaTypeEnum = z.enum(["cover", "gallery"]);

export type BillingStatus = z.infer<typeof billingStatusEnum>;
export type MediaType = z.infer<typeof mediaTypeEnum>;

// ============================================================================
// Merchants
// ============================================================================

export const merchantSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(200, "Display name must be less than 200 characters"),
  short_desc: z
    .string()
    .max(500, "Short description must be less than 500 characters")
    .nullable()
    .default(null),
  logo_url: z.string().url("Logo URL must be a valid URL").nullable().default(null),
  diet_tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  is_approved: z.boolean().default(false),
  billing_status: billingStatusEnum.default("trial"),
  priority_score: z.number().int().min(0).max(100).default(0),
});

export const merchantUpdateSchema = merchantSchema
  .partial()
  .omit({ slug: true, is_approved: true });

export const merchantApprovalSchema = z.object({
  is_approved: z.boolean(),
  billing_status: billingStatusEnum,
});

export type MerchantFormData = z.input<typeof merchantSchema>;
export type MerchantUpdateData = z.input<typeof merchantUpdateSchema>;
export type MerchantApprovalData = z.input<typeof merchantApprovalSchema>;

// ============================================================================
// Merchant Locations
// ============================================================================

export const merchantLocationSchema = z.object({
  merchant_id: z.string().uuid("Merchant ID must be a valid UUID"),
  lat: z
    .number()
    .min(-90, "Latitude must be >= -90")
    .max(90, "Latitude must be <= 90"),
  lng: z
    .number()
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180"),
  address: z
    .string()
    .max(500, "Address must be less than 500 characters")
    .nullable()
    .default(null),
  region_code: z
    .string()
    .max(10, "Region code must be less than 10 characters")
    .nullable()
    .default(null),
  hours: z.record(z.string(), z.unknown()).nullable().default(null),
  phone: z
    .string()
    .max(50, "Phone must be less than 50 characters")
    .nullable()
    .default(null),
  website: z.string().url("Website must be a valid URL").nullable().default(null),
  is_primary: z.boolean().default(false),
});

export const merchantLocationUpdateSchema = merchantLocationSchema
  .partial()
  .omit({ merchant_id: true });

export type MerchantLocationFormData = z.input<typeof merchantLocationSchema>;
export type MerchantLocationUpdateData = z.input<typeof merchantLocationUpdateSchema>;

// ============================================================================
// Merchant Media
// ============================================================================

export const merchantMediaSchema = z.object({
  merchant_id: z.string().uuid("Merchant ID must be a valid UUID"),
  type: mediaTypeEnum,
  url: z.string().url("Media URL must be a valid URL"),
  alt: z
    .string()
    .max(200, "Alt text must be less than 200 characters")
    .nullable()
    .default(null),
  order: z.number().int().min(0).default(0),
});

export const merchantMediaUpdateSchema = merchantMediaSchema
  .partial()
  .omit({ merchant_id: true });

export type MerchantMediaFormData = z.input<typeof merchantMediaSchema>;
export type MerchantMediaUpdateData = z.input<typeof merchantMediaUpdateSchema>;
