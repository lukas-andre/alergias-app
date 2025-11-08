/**
 * Result ViewModel Builder
 *
 * Transforms complex analysis + risk assessment into UI-ready format.
 * This is the bridge between backend logic and frontend rendering.
 *
 * Goal: Frontend components become "dumb" - they just render the ViewModel
 * without any business logic.
 */

import type { IngredientsResultV2 } from "@/lib/openai/vision-v2-types";
import type { RiskAssessmentV2, RiskLevel, ProfilePayload } from "./types";
import { humanizeRiskLevel, confidenceToQuality, humanizeTimestamp } from "@/lib/utils/humanize-copy";

export interface WhyItem {
  text: string;            // Human-readable explanation
  highlight: string;       // Token/evidence to highlight
  rule: string;            // Technical rule name
  via: string;             // "explicit" | "may_contain" | "icon" | "enumber"
  section: string;         // "ingredients" | "may_contain" | "front_label"
  confidence: number;      // 0-1
}

export interface MatchedAllergenVM {
  name: string;
  severity: number;
  via: string[];           // ["explicit", "icon"]
  rule: string;
  confidence: number;
}

export interface InformationalAllergenVM {
  name: string;
  confidence: number;
}

export interface DietVM {
  key: string;
  blockedIngredients: string[];
  rule: string;
}

export interface IntoleranceVM {
  key: string;
  triggeredBy: string[];
}

export interface ENumberVM {
  code: string;
  nameEs?: string;
  policy: "allow" | "warn" | "block" | "unknown";
  linkedAllergens?: string[];
  reason?: string;
}

export interface IngredientChip {
  text: string;
  isMatch: boolean;        // Matches user allergen/diet/intolerance
  confidence?: number;
}

export interface ResultViewModel {
  verdict: {
    level: "safe" | "warning" | "high";
    text: string;
    pills: string[];       // Short tags like ["Leche", "Huevo"]
    confidence: number;
    emoji: string;
  };
  why: WhyItem[];
  allergens: {
    matched: MatchedAllergenVM[];
    informational: InformationalAllergenVM[];
  };
  diets: DietVM[];
  intolerances: IntoleranceVM[];
  enumbers: ENumberVM[];
  ingredients: {
    chips: IngredientChip[];
    asText: string;
    highlighted: string;   // HTML with <mark> tags
  };
  image: {
    thumbUrl: string | null;
    fullUrl: string | null;
    quality: "low" | "medium" | "high";
    qualityLabel: string;
  };
  meta: {
    scannedAt: string;
    qualityLabel: string;
    model?: string;
    costUSD?: number;
    legibility: "low" | "medium" | "high";
  };
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Build UI-ready ViewModel from analysis + risk assessment
 */
export function buildResultViewModel({
  analysis,
  risk,
  profile,
  imageBase64,
  model,
  costUSD,
  scannedAt,
}: {
  analysis: IngredientsResultV2;
  risk: RiskAssessmentV2;
  profile: ProfilePayload | null;
  imageBase64?: string | null;
  model?: string;
  costUSD?: number;
  scannedAt?: string;
}): ResultViewModel {
  // ============================================================================
  // 1. VERDICT
  // ============================================================================

  const riskHumanized = humanizeRiskLevel(risk.level);
  const matchedAllergenKeys = risk.matched.allergens.map((a) => a.key);
  const verdictLevel: "safe" | "warning" | "high" =
    risk.level === "low" ? "safe" : risk.level === "medium" ? "warning" : "high";

  const verdict = {
    level: verdictLevel,
    text: riskHumanized.description,
    pills: matchedAllergenKeys.slice(0, 3), // Show max 3
    confidence: risk.confidence,
    emoji: riskHumanized.emoji,
  };

  // ============================================================================
  // 2. WHY (Evidence & Rules)
  // ============================================================================

  const why: WhyItem[] = risk.reasons.map((reason) => {
    let text = "";
    let highlight = reason.evidence;
    const rule = reason.rule;
    const via = reason.via ?? "unknown";
    const section = "unknown"; // TODO: Extract from mentions if needed
    const confidence = reason.confidence;

    switch (reason.kind) {
      case "allergen":
        if (via === "explicit") {
          text = `Contiene ${reason.allergenKey}: ${reason.evidence}`;
        } else if (via === "may_contain") {
          text = `Puede contener trazas de ${reason.allergenKey}: ${reason.evidence}`;
        } else if (via === "icon") {
          text = `Etiqueta indica ${reason.allergenKey}: ${reason.evidence}`;
        }
        break;
      case "diet":
        text = `Bloqueado por dieta ${reason.dietKey}: ${reason.evidence}`;
        break;
      case "intolerance":
        text = `Puede desencadenar ${reason.intoleranceKey}: ${reason.evidence}`;
        break;
      case "enumber":
        text = `E-number incierto: ${reason.evidence}`;
        if (reason.linkedAllergens && reason.linkedAllergens.length > 0) {
          text += ` (puede contener ${reason.linkedAllergens.join(", ")})`;
        }
        break;
      case "low_confidence":
        text = `Recomendamos verificar manualmente: ${reason.evidence}`;
        break;
      default:
        text = reason.evidence;
    }

    return {
      text,
      highlight,
      rule,
      via,
      section,
      confidence,
    };
  });

  // ============================================================================
  // 3. ALLERGENS (Matched vs Informational)
  // ============================================================================

  const userAllergenKeys = new Set(
    profile?.allergens.map((a) => normalizeKey(a.key)) || []
  );

  const matched: MatchedAllergenVM[] = risk.matched.allergens.map((a) => ({
    name: a.key,
    severity: a.severity,
    via: a.via,
    rule: a.via.includes("explicit") ? "allergen.inline" : "allergen.traces",
    confidence: a.confidence,
  }));

  const informational: InformationalAllergenVM[] = analysis.detected_allergens
    .filter((da) => !userAllergenKeys.has(normalizeKey(da.key)))
    .map((da) => ({
      name: da.key,
      confidence: da.confidence,
    }));

  // ============================================================================
  // 4. DIETS
  // ============================================================================

  const diets: DietVM[] = risk.matched.diets.map((d) => ({
    key: d.key,
    blockedIngredients: d.blockedIngredients,
    rule: `diet.${d.key}.block`,
  }));

  // ============================================================================
  // 5. INTOLERANCES
  // ============================================================================

  const intolerances: IntoleranceVM[] = risk.matched.intolerances.map((i) => ({
    key: i.key,
    triggeredBy: i.triggeredBy,
  }));

  // ============================================================================
  // 6. E-NUMBERS
  // ============================================================================

  const enumbers: ENumberVM[] = risk.matched.enumbers.map((e) => ({
    code: e.code,
    nameEs: e.nameEs,
    policy: e.policy,
    linkedAllergens: e.linkedAllergens,
    reason: e.reason,
  }));

  // ============================================================================
  // 7. INGREDIENTS
  // ============================================================================

  // Build set of matched mentions for highlighting
  const matchedMentionIds = new Set<number>();
  risk.reasons.forEach((r) => {
    r.mentionIds.forEach((id) => matchedMentionIds.add(id));
  });

  const chips: IngredientChip[] = analysis.mentions
    .filter((m) => m.type === "ingredient")
    .map((m, idx) => ({
      text: m.surface,
      isMatch: matchedMentionIds.has(idx),
      confidence: m.implies_allergens.length > 0 ? 0.9 : 0.8,
    }));

  // Text view: join all ingredient mentions
  const asText = analysis.mentions
    .filter((m) => m.type === "ingredient")
    .map((m) => m.surface)
    .join(", ");

  // Highlighted HTML: wrap matched mentions in <mark>
  let highlighted = analysis.ocr_text;
  const sortedMentions = [...analysis.mentions]
    .filter((m) => matchedMentionIds.has(analysis.mentions.indexOf(m)))
    .sort((a, b) => b.offset.start - a.offset.start); // Reverse order to avoid offset shift

  sortedMentions.forEach((mention) => {
    const before = highlighted.slice(0, mention.offset.start);
    const match = highlighted.slice(mention.offset.start, mention.offset.end);
    const after = highlighted.slice(mention.offset.end);
    highlighted = `${before}<mark>${match}</mark>${after}`;
  });

  // ============================================================================
  // 8. IMAGE
  // ============================================================================

  const thumbUrl = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null;
  const fullUrl = thumbUrl; // Same for now, could be storage URL in future

  const qualityInfo = confidenceToQuality(analysis.quality.confidence);

  const image = {
    thumbUrl,
    fullUrl,
    quality: analysis.quality.legibility,
    qualityLabel: qualityInfo.label,
  };

  // ============================================================================
  // 9. META
  // ============================================================================

  const meta = {
    scannedAt: scannedAt ? humanizeTimestamp(scannedAt) : "Recién escaneado",
    qualityLabel: qualityInfo.label,
    model,
    costUSD,
    legibility: analysis.quality.legibility,
  };

  return {
    verdict,
    why,
    allergens: {
      matched,
      informational,
    },
    diets,
    intolerances,
    enumbers,
    ingredients: {
      chips,
      asText,
      highlighted,
    },
    image,
    meta,
  };
}
