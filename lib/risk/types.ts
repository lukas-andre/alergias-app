export type RiskLevel = "low" | "medium" | "high";

export type RiskReasonType =
  | "contains"
  | "trace"
  | "same_line"
  | "e_number_uncertain"
  | "low_confidence"
  | "no_profile";

export interface RiskReason {
  type: RiskReasonType;
  token: string;
  allergen?: string;
}

export interface RiskAssessment {
  risk: RiskLevel;
  confidence: number;
  reasons: RiskReason[];
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
