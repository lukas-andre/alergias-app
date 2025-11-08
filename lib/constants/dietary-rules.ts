/**
 * Dietary Rules and Restrictions
 *
 * Centralized constants for diet-based blocking and intolerance triggers.
 * Used by risk evaluation engine to cross-check ingredients against user's
 * dietary restrictions and intolerances.
 */

/**
 * Diet restrictions mapped to allergen keys
 *
 * When a user has a diet, these ingredients are automatically blocked.
 *
 * Examples:
 * - celiaco → blocks gluten-containing grains
 * - vegano → blocks all animal products
 * - vegetariano → blocks animal-derived gelatin only
 * - halal/kosher → handled separately (not allergen-based)
 */
export const DIET_BLOCKS: Record<string, string[]> = {
  celiaco: ["gluten", "trigo", "cebada", "centeno", "avena"],
  vegano: ["leche", "huevo", "miel", "gelatina", "lactosa", "suero"],
  vegetariano: ["gelatina"], // Only animal-derived gelatin
  halal: [], // Handled separately (pork, alcohol detection)
  kosher: [], // Handled separately (dairy/meat separation)
};

/**
 * Intolerance triggers mapped to ingredient keys
 *
 * When a user has an intolerance, these ingredients trigger warnings.
 *
 * Intolerance types:
 * - FODMAP: high-fermentable carbohydrates that cause digestive issues
 * - Lactosa: dairy products containing lactose
 * - Fructosa: fruits, honey, high-fructose corn syrup
 */
export const INTOLERANCE_TRIGGERS: Record<string, string[]> = {
  fodmap: ["trigo", "cebolla", "ajo", "lactosa", "miel", "manzana", "pera"],
  lactosa: ["leche", "lactosa", "suero", "crema"],
  fructosa: ["miel", "fructosa", "jarabe_de_maiz"],
};

/**
 * Helper: Check if an ingredient is blocked by a specific diet
 */
export function isBlockedByDiet(diet: string, ingredientKey: string): boolean {
  const blockedIngredients = DIET_BLOCKS[diet] || [];
  return blockedIngredients.includes(ingredientKey);
}

/**
 * Helper: Check if an ingredient triggers an intolerance
 */
export function triggersIntolerance(
  intolerance: string,
  ingredientKey: string
): boolean {
  const triggers = INTOLERANCE_TRIGGERS[intolerance] || [];
  return triggers.includes(ingredientKey);
}

/**
 * Helper: Get all blocked ingredients for multiple diets
 */
export function getBlockedIngredientsForDiets(diets: string[]): string[] {
  const allBlocked = diets.flatMap((diet) => DIET_BLOCKS[diet] || []);
  return Array.from(new Set(allBlocked)); // Remove duplicates
}

/**
 * Helper: Get all intolerance triggers for multiple intolerances
 */
export function getTriggersForIntolerances(intolerances: string[]): string[] {
  const allTriggers = intolerances.flatMap(
    (intolerance) => INTOLERANCE_TRIGGERS[intolerance] || []
  );
  return Array.from(new Set(allTriggers)); // Remove duplicates
}
