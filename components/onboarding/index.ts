/**
 * AlergiasCL - Onboarding Components
 *
 * Barrel export for all onboarding-related components.
 * Import shared components from here for consistency.
 */

// Layout components
export { OnboardingLayout, OnboardingLayoutCompact } from "./OnboardingLayout";
export type { OnboardingLayoutProps } from "./OnboardingLayout";

// Progress tracking
export { ProgressIndicator, ONBOARDING_STEPS } from "./ProgressIndicator";
export type { ProgressStep, ProgressIndicatorProps } from "./ProgressIndicator";

// Form components
export { SearchableMultiSelect } from "./SearchableMultiSelect";
export type {
  SelectableItem,
  SearchableMultiSelectProps,
} from "./SearchableMultiSelect";

export {
  SeveritySelector,
  SeveritySelectorCompact,
  SeverityBadge,
  ALLERGEN_SEVERITY_LEVELS,
  INTOLERANCE_SEVERITY_LEVELS,
} from "./SeveritySelector";
export type { SeverityLevel, SeveritySelectorProps } from "./SeveritySelector";

export { StrictnessToggles } from "./StrictnessToggles";
export type { StrictnessTogglesProps } from "./StrictnessToggles";
