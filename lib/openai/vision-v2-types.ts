/**
 * Vision API v2 - Structured Mentions & Evidence
 *
 * Enhanced JSON schema that provides:
 * - Detailed mentions with type, section, offset for highlighting
 * - Explicit allergen implications (via synonyms/E-numbers)
 * - Evidence strings for explainability
 * - Quality assessment with legibility score
 */

export type MentionType =
  | "ingredient"        // Regular ingredient from ingredients list
  | "allergen"         // Explicit allergen mention
  | "claim"            // "Sin gluten", "Libre de lactosa"
  | "warning"          // "Puede contener", "Trazas de"
  | "icon";            // Badge/icon on front label

export type MentionSection =
  | "ingredients"      // Main ingredients list
  | "may_contain"      // "Puede contener" / "Trazas de" warnings
  | "front_label"      // Front-of-pack badges/icons
  | "nutrition"        // Nutrition facts table
  | "other";           // Other text on label

export interface MentionOffset {
  start: number;       // Character index in ocr_text
  end: number;         // Character index in ocr_text
}

export interface Mention {
  surface: string;                    // Original text as it appears
  canonical: string;                  // Normalized form (lowercase, no accents)
  type: MentionType;
  section: MentionSection;
  offset: MentionOffset;             // For highlighting in UI
  enumbers: string[];                 // E-codes found in this mention
  implies_allergens: string[];        // Allergen keys this mention implies
  evidence: string;                   // Exact text snippet for display
}

export interface DetectedAllergen {
  key: string;                        // Normalized allergen key
  source_mentions: number[];          // Indices to mentions array
  confidence: number;                 // 0.0 - 1.0
}

export interface Quality {
  legibility: "low" | "medium" | "high";
  confidence: number;                 // 0.0 - 1.0
}

export interface IngredientsResultV2 {
  ocr_text: string;
  language: string;
  quality: Quality;
  mentions: Mention[];
  detected_allergens: DetectedAllergen[];
  warnings: string[];
  confidence: number;                 // Overall confidence 0.0 - 1.0
}

export interface VisionJSONResponseV2 {
  data: IngredientsResultV2;
  tokensUSD?: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  raw: unknown;
}
