/**
 * Humanize Copy Utilities
 *
 * Transforms technical terms and ML outputs into user-friendly,
 * empathetic language suitable for parents managing food allergies.
 */

/**
 * Humanize risk assessment reasons from technical to user-friendly
 *
 * @param reason - Technical reason string from risk engine
 * @param allergenName - Optional allergen name for context
 * @returns User-friendly explanation
 */
export function humanizeRiskReason(
  reason: string,
  allergenName?: string
): string {
  const lower = reason.toLowerCase();

  // Ingredient detected
  if (lower.includes("ingrediente identificado") || lower.includes("contains")) {
    return allergenName
      ? `Contiene ${allergenName}`
      : "Contiene ingredientes que debes evitar";
  }

  // Trace warnings
  if (lower.includes("traza") || lower.includes("trace")) {
    return allergenName
      ? `Puede contener trazas de ${allergenName}`
      : "Puede contener trazas de alérgenos";
  }

  // Same line / cross-contamination
  if (
    lower.includes("misma línea") ||
    lower.includes("same line") ||
    lower.includes("instalación")
  ) {
    return "Procesado en instalaciones que manejan alérgenos";
  }

  // E-number uncertainty
  if (lower.includes("e-number") || lower.includes("e_number") || lower.includes("aditivo")) {
    return "Contiene aditivos de origen incierto";
  }

  // Low confidence
  if (lower.includes("confianza") || lower.includes("confidence")) {
    return "Recomendamos verificar la etiqueta manualmente";
  }

  // Incomplete profile
  if (lower.includes("perfil incompleto") || lower.includes("incomplete profile")) {
    return "Completa tu perfil para un análisis más preciso";
  }

  // Fallback: return original if no match
  return reason;
}

/**
 * Convert model confidence (0.0-1.0) to star rating and quality label
 *
 * @param confidence - Model confidence score (0.0 to 1.0)
 * @returns Object with stars (visual) and label (text)
 */
export function confidenceToQuality(confidence: number): {
  stars: number;
  label: string;
  emoji: string;
} {
  if (confidence >= 0.95) {
    return { stars: 5, label: "Excelente", emoji: "⭐⭐⭐⭐⭐" };
  }
  if (confidence >= 0.85) {
    return { stars: 4, label: "Muy buena", emoji: "⭐⭐⭐⭐" };
  }
  if (confidence >= 0.7) {
    return { stars: 3, label: "Buena", emoji: "⭐⭐⭐" };
  }
  if (confidence >= 0.5) {
    return { stars: 2, label: "Regular", emoji: "⭐⭐" };
  }
  return { stars: 1, label: "Baja - Verifica manualmente", emoji: "⭐" };
}

/**
 * Humanize timestamp to relative time in Spanish
 *
 * @param dateString - ISO date string
 * @returns Relative time string (e.g., "Hace 2 días", "Hoy a las 10:04 AM")
 */
export function humanizeTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Less than 1 minute
  if (diffSec < 60) {
    return "Recién escaneado";
  }

  // Less than 1 hour
  if (diffMin < 60) {
    return `Hace ${diffMin} minuto${diffMin !== 1 ? "s" : ""}`;
  }

  // Less than 24 hours (today)
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    const timeStr = date.toLocaleTimeString("es-CL", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Hoy a las ${timeStr}`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    diffDays === 1 ||
    (date.getDate() === yesterday.getDate() && diffHours < 48)
  ) {
    const timeStr = date.toLocaleTimeString("es-CL", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Ayer a las ${timeStr}`;
  }

  // Less than 7 days
  if (diffDays < 7) {
    return `Hace ${diffDays} día${diffDays !== 1 ? "s" : ""}`;
  }

  // Less than 30 days
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} semana${weeks !== 1 ? "s" : ""}`;
  }

  // Older: show full date
  return date.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Humanize risk level to user-friendly label
 *
 * @param risk - Risk level ('low' | 'medium' | 'high')
 * @returns User-friendly label with emoji
 */
export function humanizeRiskLevel(risk: "low" | "medium" | "high"): {
  label: string;
  emoji: string;
  description: string;
} {
  switch (risk) {
    case "high":
      return {
        label: "Alto Riesgo",
        emoji: "🔴",
        description: "Detectamos ingredientes que debes evitar según tu perfil",
      };
    case "medium":
      return {
        label: "Precaución",
        emoji: "🟡",
        description:
          "Puede contener ingredientes que requieren atención. Revisa los detalles antes de consumir",
      };
    case "low":
      return {
        label: "Seguro",
        emoji: "🟢",
        description: "No detectamos ingredientes problemáticos para tu perfil",
      };
  }
}

/**
 * Shorten allergen list for compact display
 *
 * @param allergens - Array of allergen names
 * @param maxDisplay - Maximum allergens to show before "y más..."
 * @returns Formatted string
 */
export function formatAllergenList(
  allergens: string[],
  maxDisplay: number = 3
): string {
  if (allergens.length === 0) return "";
  if (allergens.length <= maxDisplay) {
    return allergens.join(", ");
  }
  const shown = allergens.slice(0, maxDisplay).join(", ");
  const remaining = allergens.length - maxDisplay;
  return `${shown} y ${remaining} más`;
}
