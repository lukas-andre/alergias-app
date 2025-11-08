/**
 * Risk Evaluation - Explainable & Evidence-Based
 *
 * Enhanced risk assessment that:
 * - Uses structured mentions from Vision API
 * - Provides detailed evidence for each decision
 * - Crosses with diets (celiac → gluten, vegan → milk/eggs)
 * - Crosses with intolerances (FODMAP, lactose)
 * - Applies strictness policies per-allergen
 * - Returns structured matches with confidence
 */

import type { IngredientsResult, Mention, DetectedAllergen } from "@/lib/openai/vision-types";
import type {
  ProfilePayload,
  RiskAssessment,
  RiskReason,
  RiskLevel,
  RiskDecision,
  MatchedAllergen,
  MatchedDiet,
  MatchedIntolerance,
  MatchedENumber,
  AllergenVia,
} from "./types";
import type { ENumberPolicy } from "./evaluate";
import { DIET_BLOCKS, INTOLERANCE_TRIGGERS } from "@/lib/constants/dietary-rules";

const RISK_ORDER: RiskLevel[] = ["low", "medium", "high"];

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function compareRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_ORDER[Math.max(RISK_ORDER.indexOf(a), RISK_ORDER.indexOf(b))] ?? "low";
}

function decisionToRisk(decision: RiskDecision): RiskLevel {
  switch (decision) {
    case "block":
      return "high";
    case "warn":
      return "medium";
    case "allow":
    default:
      return "low";
  }
}


/**
 * Compute effective strictness for a specific allergen
 *
 * Applies per-allergen overrides on top of base strictness profile
 */
function computeEffectiveStrictness(
  profile: ProfilePayload,
  allergenKey: string,
): {
  block_traces: boolean;
  block_same_line: boolean;
  e_numbers_uncertain: "allow" | "warn" | "block";
  residual_protein_ppm: number;
  pediatric_mode: boolean;
  anaphylaxis_mode: boolean;
  min_model_confidence: number;
} | null {
  const base = profile.strictness;
  if (!base) return null;

  const override = profile.overrides?.[allergenKey];
  return {
    block_traces:
      typeof override?.block_traces === "boolean" ? override.block_traces : base.block_traces,
    block_same_line:
      typeof override?.block_same_line === "boolean" ? override.block_same_line : base.block_same_line,
    e_numbers_uncertain: override?.e_numbers_uncertain ?? base.e_numbers_uncertain,
    residual_protein_ppm:
      typeof override?.residual_protein_ppm === "number"
        ? override.residual_protein_ppm
        : base.residual_protein_ppm_default,
    pediatric_mode: base.pediatric_mode,
    anaphylaxis_mode: base.anaphylaxis_mode,
    min_model_confidence: base.min_model_confidence,
  };
}

/**
 * Main risk evaluation function
 *
 * Uses structured mentions from Vision API to provide explainable,
 * evidence-based risk assessment.
 */
export function evaluateRisk(
  analysis: IngredientsResult,
  profile: ProfilePayload | null,
  eNumberPolicies: ENumberPolicy[] = [],
): RiskAssessment {
  const reasons: RiskReason[] = [];
  let level: RiskLevel = "low";

  // No profile case
  if (!profile || !profile.strictness) {
    return {
      level: "low",
      decision: "allow",
      confidence: analysis.confidence,
      reasons: [
        {
          kind: "low_confidence",
          mentionIds: [],
          rule: "no_profile",
          confidence: 0,
          evidence: "Perfil no disponible. Se asumió riesgo bajo.",
        },
      ],
      matched: {
        allergens: [],
        diets: [],
        intolerances: [],
        enumbers: [],
      },
      actions: ["guardar"],
    };
  }

  // Build normalized allergen map
  const allergenSeverity = new Map<string, number>();
  const allergenKeyMap = new Map<string, string>(); // normalized -> original
  profile.allergens.forEach((item) => {
    const normalized = normalizeKey(item.key);
    allergenSeverity.set(normalized, item.severity ?? 0);
    allergenKeyMap.set(normalized, item.key);
  });

  // Build diet set
  const dietKeys = new Set<string>(profile.diets.map(normalizeKey));

  // Build intolerance set
  const intoleranceKeys = new Set<string>(profile.intolerances.map((i) => normalizeKey(i.key)));

  // Matched results
  const matchedAllergens: MatchedAllergen[] = [];
  const matchedDiets: MatchedDiet[] = [];
  const matchedIntolerances: MatchedIntolerance[] = [];
  const matchedENumbers: MatchedENumber[] = [];

  // ============================================================================
  // 1. ALLERGEN MATCHES
  // ============================================================================

  const allergenMatches = new Map<string, {
    severity: number;
    vias: AllergenVia[];
    mentionIds: number[];
    confidences: number[];
  }>();

  analysis.mentions.forEach((mention, idx) => {
    mention.implies_allergens.forEach((allergenRaw) => {
      const allergenNorm = normalizeKey(allergenRaw);
      const originalKey = allergenKeyMap.get(allergenNorm);

      if (!originalKey) return; // Not in user profile

      const severity = allergenSeverity.get(allergenNorm) ?? 0;
      const effective = computeEffectiveStrictness(profile, originalKey);

      // Determine via
      let via: AllergenVia = "explicit";
      if (mention.section === "may_contain") {
        via = "may_contain";
      } else if (mention.type === "icon" && mention.section === "front_label") {
        via = "icon";
      }

      // Track match
      if (!allergenMatches.has(allergenNorm)) {
        allergenMatches.set(allergenNorm, {
          severity,
          vias: [],
          mentionIds: [],
          confidences: [],
        });
      }

      const match = allergenMatches.get(allergenNorm)!;
      if (!match.vias.includes(via)) {
        match.vias.push(via);
      }
      match.mentionIds.push(idx);
      match.confidences.push(mention.implies_allergens.length > 0 ? 0.9 : 0.7);

      // Determine decision
      let decision: RiskDecision = "warn";
      let rule = "allergen.inline.warn";

      if (via === "may_contain") {
        if (effective?.block_traces || effective?.anaphylaxis_mode) {
          decision = "block";
          rule = "allergen.traces.block";
        } else {
          decision = "warn";
          rule = "allergen.traces.warn";
        }
      } else if (via === "icon") {
        decision = "block";
        rule = "allergen.icon.block";
      } else {
        // explicit
        if (severity >= 3 || effective?.anaphylaxis_mode) {
          decision = "block";
          rule = "allergen.inline.block";
        } else if (severity >= 2) {
          decision = "block";
          rule = "allergen.inline.block";
        } else if (effective?.block_same_line && mention.section === "ingredients") {
          decision = "block";
          rule = "allergen.same_line.block";
        } else {
          decision = "warn";
          rule = "allergen.inline.warn";
        }
      }

      const confidence = analysis.detected_allergens.find(
        (da) => normalizeKey(da.key) === allergenNorm
      )?.confidence ?? 0.8;

      reasons.push({
        kind: "allergen",
        via,
        mentionIds: [idx],
        allergenKey: originalKey,
        rule,
        confidence,
        evidence: `"${mention.surface}" (${mention.section})`,
      });

      level = compareRisk(level, decisionToRisk(decision));
    });
  });

  // Build matched allergens
  allergenMatches.forEach((match, allergenNorm) => {
    const originalKey = allergenKeyMap.get(allergenNorm)!;
    const avgConfidence = match.confidences.reduce((a, b) => a + b, 0) / match.confidences.length;

    // Determine overall decision
    let overallDecision: RiskDecision = "allow";
    if (match.vias.includes("icon") || match.vias.includes("explicit")) {
      overallDecision = match.severity >= 2 ? "block" : "warn";
    } else if (match.vias.includes("may_contain")) {
      const effective = computeEffectiveStrictness(profile, originalKey);
      overallDecision = effective?.block_traces ? "block" : "warn";
    }

    matchedAllergens.push({
      key: originalKey,
      decision: overallDecision,
      confidence: avgConfidence,
      severity: match.severity,
      via: match.vias,
      mentionIds: match.mentionIds,
    });
  });

  // ============================================================================
  // 2. DIET RESTRICTIONS
  // ============================================================================

  dietKeys.forEach((dietKey) => {
    const blockedIngredients = DIET_BLOCKS[dietKey] || [];
    const triggeredMentions: number[] = [];

    analysis.mentions.forEach((mention, idx) => {
      mention.implies_allergens.forEach((allergenRaw) => {
        const allergenNorm = normalizeKey(allergenRaw);
        if (blockedIngredients.includes(allergenNorm)) {
          triggeredMentions.push(idx);

          reasons.push({
            kind: "diet",
            mentionIds: [idx],
            rule: `diet.${dietKey}.block`,
            confidence: 0.9,
            evidence: `"${mention.surface}" bloqueado por dieta ${dietKey}`,
            dietKey,
            allergenKey: allergenRaw,
          });

          level = compareRisk(level, "high");
        }
      });
    });

    if (triggeredMentions.length > 0) {
      matchedDiets.push({
        key: dietKey,
        decision: "block",
        blockedIngredients: [...new Set(
          analysis.mentions
            .filter((_, idx) => triggeredMentions.includes(idx))
            .flatMap((m) => m.implies_allergens)
        )],
        mentionIds: triggeredMentions,
      });
    }
  });

  // ============================================================================
  // 3. INTOLERANCES
  // ============================================================================

  intoleranceKeys.forEach((intoleranceKey) => {
    const triggers = INTOLERANCE_TRIGGERS[intoleranceKey] || [];
    const triggeredMentions: number[] = [];

    analysis.mentions.forEach((mention, idx) => {
      mention.implies_allergens.forEach((allergenRaw) => {
        const allergenNorm = normalizeKey(allergenRaw);
        if (triggers.includes(allergenNorm)) {
          triggeredMentions.push(idx);

          reasons.push({
            kind: "intolerance",
            mentionIds: [idx],
            rule: `intolerance.${intoleranceKey}.warn`,
            confidence: 0.85,
            evidence: `"${mention.surface}" puede desencadenar ${intoleranceKey}`,
            intoleranceKey,
            allergenKey: allergenRaw,
          });

          level = compareRisk(level, "medium");
        }
      });
    });

    if (triggeredMentions.length > 0) {
      matchedIntolerances.push({
        key: intoleranceKey,
        decision: "warn",
        triggeredBy: [...new Set(
          analysis.mentions
            .filter((_, idx) => triggeredMentions.includes(idx))
            .flatMap((m) => m.implies_allergens)
        )],
        mentionIds: triggeredMentions,
      });
    }
  });

  // ============================================================================
  // 4. E-NUMBERS
  // ============================================================================

  eNumberPolicies.forEach((ePolicy) => {
    const mentionIds: number[] = [];

    // Find mentions containing this E-number
    analysis.mentions.forEach((mention, idx) => {
      if (mention.enumbers.includes(ePolicy.code)) {
        mentionIds.push(idx);
      }
    });

    let decision: RiskDecision = "allow";
    if (ePolicy.policy === "block") {
      decision = "block";
      level = compareRisk(level, "high");
    } else if (ePolicy.policy === "warn") {
      decision = "warn";
      level = compareRisk(level, "medium");
    } else if (ePolicy.policy === "unknown") {
      const uncertainPolicy = profile.strictness?.e_numbers_uncertain ?? "warn";
      if (uncertainPolicy === "block") {
        decision = "block";
        level = compareRisk(level, "high");
      } else if (uncertainPolicy === "warn") {
        decision = "warn";
        level = compareRisk(level, "medium");
      }
    }

    if (decision !== "allow") {
      reasons.push({
        kind: "enumber",
        mentionIds,
        rule: `enumber.${ePolicy.policy}`,
        confidence: 0.8,
        evidence: `${ePolicy.code} (${ePolicy.name_es || "E-number"})`,
        eNumberCode: ePolicy.code,
        linkedAllergens: ePolicy.linked_allergens,
      });

      matchedENumbers.push({
        code: ePolicy.code,
        decision,
        policy: ePolicy.policy,
        nameEs: ePolicy.name_es,
        linkedAllergens: ePolicy.linked_allergens,
        reason: ePolicy.reason,
        mentionIds,
      });
    }
  });

  // ============================================================================
  // 5. LOW CONFIDENCE CHECK
  // ============================================================================

  const minConfidence = profile.strictness?.min_model_confidence ?? 0.7;
  if (analysis.quality.confidence < minConfidence) {
    reasons.push({
      kind: "low_confidence",
      mentionIds: [],
      rule: "confidence.below_threshold",
      confidence: analysis.quality.confidence,
      evidence: `Confianza ${(analysis.quality.confidence * 100).toFixed(0)}% < ${(minConfidence * 100).toFixed(0)}%`,
    });
    level = compareRisk(level, "medium");
  }

  // ============================================================================
  // 6. DETERMINE OVERALL DECISION
  // ============================================================================

  let overallDecision: RiskDecision = "allow";
  if (level === "high") {
    overallDecision = "block";
  } else if (level === "medium") {
    overallDecision = "warn";
  }

  // ============================================================================
  // 7. DETERMINE ACTIONS
  // ============================================================================

  const actions: RiskAssessment["actions"] = ["guardar"];
  if (level === "high") {
    actions.push("ver alternativas", "pedir verificación");
  } else if (level === "medium") {
    actions.push("pedir verificación");
  }

  return {
    level,
    decision: overallDecision,
    confidence: analysis.quality.confidence,
    reasons,
    matched: {
      allergens: matchedAllergens,
      diets: matchedDiets,
      intolerances: matchedIntolerances,
      enumbers: matchedENumbers,
    },
    actions,
  };
}
