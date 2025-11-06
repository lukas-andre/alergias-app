/**
 * Onboarding Persistence Utilities
 *
 * Handles saving and loading onboarding progress to/from localStorage.
 * Allows users to resume onboarding if they leave and come back.
 */

import type { OnboardingProgress, CompleteOnboardingData } from "@/lib/schemas/onboarding.schema";

const STORAGE_KEY = "alergias_onboarding_progress";
const STORAGE_VERSION = "v1";

export interface StoredProgress {
  version: string;
  progress: OnboardingProgress;
}

/**
 * Save onboarding progress to localStorage
 */
export function saveOnboardingProgress(
  currentStep: number,
  data: Partial<CompleteOnboardingData>
): void {
  try {
    const progress: OnboardingProgress = {
      currentStep,
      lastSaved: new Date().toISOString(),
      data,
    };

    const stored: StoredProgress = {
      version: STORAGE_VERSION,
      progress,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error("Error saving onboarding progress:", error);
    // Fail silently - localStorage might be disabled/full
  }
}

/**
 * Load onboarding progress from localStorage
 */
export function loadOnboardingProgress(): OnboardingProgress | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: StoredProgress = JSON.parse(stored);

    // Check version compatibility
    if (parsed.version !== STORAGE_VERSION) {
      console.warn("Onboarding progress version mismatch, clearing...");
      clearOnboardingProgress();
      return null;
    }

    return parsed.progress;
  } catch (error) {
    console.error("Error loading onboarding progress:", error);
    return null;
  }
}

/**
 * Clear onboarding progress from localStorage
 */
export function clearOnboardingProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing onboarding progress:", error);
  }
}

/**
 * Check if user has saved onboarding progress
 */
export function hasOnboardingProgress(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get time since last save (in minutes)
 */
export function getTimeSinceLastSave(): number | null {
  try {
    const progress = loadOnboardingProgress();
    if (!progress) return null;

    const lastSaved = new Date(progress.lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    return Math.floor(diffMs / 1000 / 60); // Convert to minutes
  } catch (error) {
    return null;
  }
}

/**
 * Check if saved progress is stale (older than X hours)
 */
export function isProgressStale(hoursThreshold: number = 24): boolean {
  const minutesSinceLastSave = getTimeSinceLastSave();
  if (minutesSinceLastSave === null) return false;

  return minutesSinceLastSave > hoursThreshold * 60;
}
