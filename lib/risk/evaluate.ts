import type { IngredientsResult } from "@/lib/openai/vision";

import type { ProfilePayload, RiskAssessment, RiskLevel, RiskReason } from "./types";

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

function detectTraceTokens(textSources: string[]): string[] {
  const tokens: string[] = [];
  const patterns = [
    /puede\s+contener[^.]*\./gi,
    /puede\s+contener[^,\n]*/gi,
    /trazas\s+de[^.]*\./gi,
    /trazas\s+de[^,\n]*/gi,
  ];

  textSources.forEach((source) => {
    const lower = source.toLowerCase();
    patterns.forEach((pattern) => {
      const matches = lower.match(pattern);
      if (matches) {
        tokens.push(...matches);
      }
    });
  });

  return Array.from(new Set(tokens));
}

function detectSameLineTokens(textSources: string[]): string[] {
  const tokens: string[] = [];
  const patterns = [
    /misma\s+l[íi]nea/gi,
    /instalaci[oó]n\s+compartida/gi,
    /planta\s+compartida/gi,
    /compartid[ao]s?\s+con/gi,
  ];

  textSources.forEach((source) => {
    const lower = source.toLowerCase();
    patterns.forEach((pattern) => {
      const matches = lower.match(pattern);
      if (matches) {
        tokens.push(...matches);
      }
    });
  });

  return Array.from(new Set(tokens));
}

export type ENumberPolicy = {
  code: string;
  policy: "allow" | "warn" | "block" | "unknown";
  name_es?: string;
  linked_allergens?: string[];
  matched_allergens?: string[];
  residual_protein_risk?: boolean;
  reason?: string;
};

export function evaluateRisk(
  analysis: IngredientsResult,
  profile: ProfilePayload | null,
  eNumberPolicies: ENumberPolicy[] = [],
): RiskAssessment {
  const reasons: RiskReason[] = [];
  let risk: RiskLevel = "low";

  if (!profile || !profile.strictness) {
    return {
      risk: "low",
      confidence: analysis.confidence,
      reasons: [
        {
          type: "no_profile",
          token: "Perfil de Supabase no disponible; se asumió riesgo bajo.",
        },
      ],
      actions: ["guardar"],
    };
  }

  const allergenSeverity = new Map<string, number>();
  profile.allergens.forEach((item) => {
    allergenSeverity.set(item.key, item.severity ?? 0);
  });

  const normalizedKeys = new Map<string, string>();
  Array.from(allergenSeverity.keys()).forEach((key) => {
    normalizedKeys.set(normalizeKey(key), key);
  });

  const effectiveStrictnessCache = new Map<string, ReturnType<typeof computeEffectiveStrictness>>();
  const getEffective = (key: string) => {
    if (!effectiveStrictnessCache.has(key)) {
      effectiveStrictnessCache.set(key, computeEffectiveStrictness(profile, key));
    }
    return effectiveStrictnessCache.get(key);
  };

  // Handle V1 (string[]) and V2 (object[]) formats for detected_allergens
  const allergenStrings = Array.isArray(analysis.detected_allergens)
    ? analysis.detected_allergens.map(a =>
        typeof a === 'string' ? a : (a as any).key
      )
    : [];

  const textSources = [
    analysis.ocr_text ?? "",
    ...(analysis.warnings ?? []),
    ...allergenStrings,
  ];

  const traceTokens = detectTraceTokens(textSources);
  const sameLineTokens = detectSameLineTokens(textSources);

  allergenStrings.forEach((token) => {
    const normalized = normalizeKey(token);
    const matchedKey = normalizedKeys.get(normalized);
    if (!matchedKey) return;

    const severity = allergenSeverity.get(matchedKey) ?? 0;
    const effective = getEffective(matchedKey);

    reasons.push({
      type: "contains",
      token,
      allergen: matchedKey,
    });

    let level: RiskLevel = severity >= 2 ? "high" : "medium";
    if (severity >= 3) {
      level = "high";
    } else if (severity <= 1 && effective?.pediatric_mode) {
      level = compareRisk(level, "medium");
    }

    if (effective?.anaphylaxis_mode) {
      level = "high";
    }

    risk = compareRisk(risk, level);
  });

  traceTokens.forEach((token) => {
    let reasonAllergen: string | undefined;

    normalizedKeys.forEach((originalKey, keySlug) => {
      if (token.includes(keySlug.replace(/_/g, " "))) {
        reasonAllergen = originalKey;
      }
    });

    const effective = reasonAllergen ? getEffective(reasonAllergen) : null;
    const escalate =
      reasonAllergen != null
        ? Boolean(effective?.block_traces || effective?.anaphylaxis_mode)
        : profile.strictness?.block_traces ?? false;
    const level: RiskLevel = escalate ? "high" : "medium";

    reasons.push({
      type: "trace",
      token,
      allergen: reasonAllergen,
    });

    risk = compareRisk(risk, level);
  });

  sameLineTokens.forEach((token) => {
    const level: RiskLevel = profile.strictness?.block_same_line ? "high" : "medium";
    reasons.push({
      type: "same_line",
      token,
    });
    risk = compareRisk(risk, level);
  });

  if ((profile.strictness?.min_model_confidence ?? 0) > analysis.confidence) {
    reasons.push({
      type: "low_confidence",
      token: `confidence=${analysis.confidence.toFixed(2)}`,
    });
    risk = compareRisk(risk, "medium");
  }

  // Process E-number policies
  eNumberPolicies.forEach((ePolicy) => {
    if (ePolicy.policy === "block") {
      reasons.push({
        type: "e_number_uncertain",
        token: `${ePolicy.code} (${ePolicy.name_es || "E-number"})`,
        allergen: ePolicy.matched_allergens?.join(", "),
      });
      risk = compareRisk(risk, "high");
    } else if (ePolicy.policy === "warn") {
      reasons.push({
        type: "e_number_uncertain",
        token: `${ePolicy.code} (${ePolicy.name_es || "E-number"})`,
        allergen: ePolicy.matched_allergens?.join(", "),
      });
      risk = compareRisk(risk, "medium");
    } else if (ePolicy.policy === "unknown") {
      // Unknown E-numbers are treated as medium risk
      reasons.push({
        type: "e_number_uncertain",
        token: `${ePolicy.code} (desconocido)`,
      });
      risk = compareRisk(risk, "medium");
    }
    // "allow" policy doesn't add reasons
  });

  const uniqueReasons = reasons.filter(
    (reason, index, self) =>
      index === self.findIndex((other) => other.type === reason.type && other.token === reason.token),
  );

  const actions: RiskAssessment["actions"] = ["guardar"];
  if (risk === "high") {
    actions.push("ver alternativas", "pedir verificación");
  } else if (risk === "medium") {
    actions.push("pedir verificación");
  }

  return {
    risk,
    confidence: analysis.confidence,
    reasons: uniqueReasons,
    actions,
  };
}
