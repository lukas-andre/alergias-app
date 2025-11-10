/**
 * Post-Processor for OpenAI Vision Results
 *
 * Validates and enhances the hierarchical structure of sub-ingredients
 * that may not be fully processed by OpenAI.
 *
 * Key responsibilities:
 * - Split compound ingredients preserving E-numbers
 * - Create explicit parent-child relationships
 * - Validate allergen implications on sub-ingredients
 */

import type { IngredientsResult, Mention, MentionType, MentionSection } from "./vision-types";

interface SubIngredient {
  text: string;
  enumbers: string[];
}

/**
 * Split items by delimiter, respecting parentheses depth
 * Adapted from lib/parse.ts:splitItems
 */
function splitItems(input: string): string[] {
  const items: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of input) {
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    }

    if (depth === 0 && /[,;•·]/.test(char)) {
      const candidate = current.replace(/\s+/g, " ").trim();
      if (candidate) items.push(cleanItem(candidate));
      current = "";
      continue;
    }

    current += char;
  }

  const finalCandidate = current.replace(/\s+/g, " ").trim();
  if (finalCandidate) items.push(cleanItem(finalCandidate));

  return items.length > 0 ? items : [input.replace(/\s+/g, " ").trim()];
}

function cleanItem(value: string): string {
  return value
    .replace(/^[·•\-:]+/, "")
    .replace(/\.$/, "")
    .replace(/^\s*y\s+/i, "")
    .trim();
}

/**
 * Extract E-numbers from text
 */
function extractENumbers(text: string): string[] {
  const regex = /\bE\d{3,4}\b/gi;
  const matches = text.match(regex);
  return matches ? Array.from(new Set(matches.map(m => m.toUpperCase()))) : [];
}

/**
 * Normalize to canonical form
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Parse sub-ingredients from parentheses
 * Example: "Chocolate (leche, cacao, E322)" → ["leche", "cacao", "E322"]
 */
function parseSubIngredients(text: string): SubIngredient[] {
  const parenMatch = text.match(/\(([^)]+)\)/);
  if (!parenMatch) return [];

  const subText = parenMatch[1];
  const items = splitItems(subText);

  return items.map(item => ({
    text: item,
    enumbers: extractENumbers(item),
  }));
}

/**
 * Process mentions to expand compound ingredients into hierarchy
 */
export function postProcessIngredients(result: IngredientsResult): IngredientsResult {
  const newMentions: Mention[] = [];
  const processedIndices = new Set<number>();

  result.mentions.forEach((mention, idx) => {
    // Skip if already processed
    if (processedIndices.has(idx)) return;

    // Check if this mention has sub-ingredients in surface text
    const hasParens = mention.surface.includes("(") && mention.surface.includes(")");

    if (hasParens && mention.type === "ingredient") {
      // Parse sub-ingredients
      const subIngredients = parseSubIngredients(mention.surface);

      if (subIngredients.length > 0) {
        // Extract parent name (text before parentheses)
        const parentName = mention.surface.split("(")[0].trim();
        const parentCanonical = normalize(parentName);

        // Add parent mention (without sub-ingredients in surface)
        newMentions.push({
          ...mention,
          surface: parentName,
          canonical: parentCanonical,
          sub_ingredients: subIngredients.map(s => s.text),
          // Parent doesn't inherit E-numbers from children unless explicitly in parent text
          enumbers: extractENumbers(parentName),
        });

        // Add child mentions
        subIngredients.forEach(sub => {
          // Estimate offset (rough approximation)
          const subOffset = {
            start: mention.offset.start,
            end: mention.offset.end,
          };

          // Inherit allergen implications if not specified
          const subImpliesAllergens = mention.implies_allergens.length > 0
            ? mention.implies_allergens
            : [];

          newMentions.push({
            surface: sub.text,
            canonical: normalize(sub.text),
            type: mention.type,
            section: mention.section,
            offset: subOffset,
            enumbers: sub.enumbers,
            implies_allergens: subImpliesAllergens,
            evidence: sub.text,
            parent_canonical: parentCanonical,
            sub_ingredients: [],
          });
        });

        processedIndices.add(idx);
        return;
      }
    }

    // No sub-ingredients or not processable - keep as-is
    newMentions.push({ ...mention });
  });

  return {
    ...result,
    mentions: newMentions,
  };
}

/**
 * Validate that OpenAI correctly split sub-ingredients
 * Returns warnings if structure looks incorrect
 */
export function validateHierarchy(result: IngredientsResult): string[] {
  const warnings: string[] = [];
  const parentCanonicals = new Set<string>();

  // Collect all parent canonicals
  result.mentions.forEach(m => {
    if (m.sub_ingredients && m.sub_ingredients.length > 0) {
      parentCanonicals.add(m.canonical);
    }
  });

  // Check for orphaned children
  result.mentions.forEach(m => {
    if (m.parent_canonical && !parentCanonicals.has(m.parent_canonical)) {
      warnings.push(`Sub-ingredient "${m.surface}" references missing parent "${m.parent_canonical}"`);
    }
  });

  // Check for unclosed parentheses in surface text
  result.mentions.forEach(m => {
    const openParens = (m.surface.match(/\(/g) || []).length;
    const closeParens = (m.surface.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      warnings.push(`Unbalanced parentheses in "${m.surface}"`);
    }
  });

  return warnings;
}
