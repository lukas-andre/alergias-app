export type RiskLevel = "low" | "medium" | "high";

// ============================================================================
// Enhanced Risk Assessment with Explainability
// ============================================================================

export type RiskDecision = "allow" | "warn" | "block";

export type RiskReasonKind =
  | "allergen"          // Allergen match from profile
  | "diet"              // Diet restriction (celiac, vegan, etc)
  | "intolerance"       // Intolerance trigger (FODMAP, lactose)
  | "enumber"           // E-number policy
  | "residual_protein"  // Residual protein concern
  | "low_confidence";   // Model confidence below threshold

export type AllergenVia =
  | "explicit"          // Direct ingredient match
  | "may_contain"       // "Puede contener" / trace warning
  | "icon"              // Front-of-pack badge/icon
  | "derived";          // Derived/implied (e.g., E-number origin)

export interface RiskReason {
  kind: RiskReasonKind;
  via?: AllergenVia;           // For allergen reasons
  mentionIds: number[];         // References to Mention indices
  allergenKey?: string;         // Which allergen triggered
  rule: string;                 // Which rule triggered (e.g., "allergen.inline.block")
  confidence: number;           // Confidence of this reason (0-1)
  evidence: string;             // Human-readable evidence
  // E-number specific
  eNumberCode?: string;
  linkedAllergens?: string[];
  // Diet/intolerance specific
  dietKey?: string;
  intoleranceKey?: string;
}

export interface MatchedAllergen {
  key: string;
  decision: RiskDecision;
  confidence: number;
  severity: number;             // From profile
  via: AllergenVia[];           // All ways this was matched
  mentionIds: number[];
}

export interface MatchedDiet {
  key: string;
  decision: RiskDecision;
  blockedIngredients: string[];
  mentionIds: number[];
}

export interface MatchedIntolerance {
  key: string;
  decision: RiskDecision;
  triggeredBy: string[];
  mentionIds: number[];
}

export interface MatchedENumber {
  code: string;
  decision: RiskDecision;
  policy: "allow" | "warn" | "block" | "unknown";
  nameEs?: string;
  linkedAllergens?: string[];
  reason?: string;
  mentionIds: number[];
}

export interface RiskAssessment {
  level: RiskLevel;
  decision: RiskDecision;
  confidence: number;
  reasons: RiskReason[];
  matched: {
    allergens: MatchedAllergen[];
    diets: MatchedDiet[];
    intolerances: MatchedIntolerance[];
    enumbers: MatchedENumber[];
  };
  actions: Array<"guardar" | "ver alternativas" | "ver mapa cercano" | "pedir verificación">;
}

export interface ProfilePayload {
  user_id: string;
  profile: {
    display_name: string | null;
    notes: string | null;
    pregnant: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  diets: string[];
  allergens: { key: string; severity: number }[];
  intolerances: { key: string; severity: number }[];
  strictness: {
    id: string;
    name: string;
    block_traces: boolean;
    block_same_line: boolean;
    e_numbers_uncertain: "allow" | "warn" | "block";
    min_model_confidence: number;
    pediatric_mode: boolean;
    anaphylaxis_mode: boolean;
    residual_protein_ppm_default: number;
  } | null;
  overrides: Record<
    string,
    {
      block_traces?: boolean;
      block_same_line?: boolean;
      e_numbers_uncertain?: "allow" | "warn" | "block";
      residual_protein_ppm?: number;
      notes?: string;
    }
  >;
}
