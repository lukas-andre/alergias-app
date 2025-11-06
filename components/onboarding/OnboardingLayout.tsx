/**
 * OnboardingLayout - Wrapper component for onboarding wizard steps
 *
 * Provides:
 * - Progress indicator at top
 * - Header with step title and description
 * - Content area for step-specific UI
 * - Navigation buttons (Back/Next/Skip/Finish)
 * - Responsive mobile layout
 *
 * Usage:
 * <OnboardingLayout
 *   currentStep={1}
 *   title="Bienvenida"
 *   description="..."
 *   onNext={() => ...}
 *   onBack={() => ...}
 * >
 *   <StepContent />
 * </OnboardingLayout>
 */

import { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressIndicator, ONBOARDING_STEPS } from "./ProgressIndicator";
import { cn } from "@/lib/utils";

export interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  title: string;
  description?: string;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  backLabel?: string;
  skipLabel?: string;
  nextDisabled?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function OnboardingLayout({
  children,
  currentStep,
  title,
  description,
  onNext,
  onBack,
  onSkip,
  nextLabel = "Continuar",
  backLabel = "Volver",
  skipLabel = "Omitir",
  nextDisabled = false,
  isLastStep = false,
  isLoading = false,
  className,
}: OnboardingLayoutProps) {
  const progressPercentage = (currentStep / ONBOARDING_STEPS.length) * 100;
  const showBackButton = currentStep > 1;

  return (
    <div className={cn("min-h-screen bg-white", className)}>
      {/* Header with logo and progress */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-xl font-bold text-primary">
              AlergiasCL
            </h1>
            <span className="text-sm text-neutral-600">
              Paso {currentStep} de {ONBOARDING_STEPS.length}
            </span>
          </div>

          {/* Linear progress bar (mobile-friendly) */}
          <Progress value={progressPercentage} className="h-2 mb-4" />

          {/* Step indicator (shows on larger screens) */}
          <div className="hidden lg:block">
            <ProgressIndicator
              currentStep={currentStep}
              steps={ONBOARDING_STEPS}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-display text-2xl md:text-3xl text-neutral-900">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-base md:text-lg mt-2">
                {description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="pt-6">
            {/* Step-specific content */}
            {children}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-neutral-200">
            {/* Left side: Back button or spacer */}
            <div className="flex gap-2 w-full sm:w-auto">
              {showBackButton ? (
                <Button
                  variant="outline"
                  onClick={onBack}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {backLabel}
                </Button>
              ) : (
                <div className="hidden sm:block" /> // Spacer for alignment
              )}

              {/* Skip button (optional) */}
              {onSkip && (
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  disabled={isLoading}
                  className="w-full sm:w-auto text-neutral-600"
                >
                  {skipLabel}
                </Button>
              )}
            </div>

            {/* Right side: Next/Finish button */}
            <Button
              onClick={onNext}
              disabled={nextDisabled || isLoading}
              className={cn(
                "w-full sm:w-auto",
                isLastStep && "bg-accent-fresh hover:bg-accent-fresh-600"
              )}
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse">Guardando...</span>
                </>
              ) : (
                <>
                  {isLastStep ? "Finalizar" : nextLabel}
                  {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Mobile: Compact step indicator at bottom */}
        <div className="lg:hidden mt-6 bg-white rounded-lg shadow p-4">
          <ProgressIndicator
            currentStep={currentStep}
            steps={ONBOARDING_STEPS}
          />
        </div>
      </main>

      {/* Footer with help text */}
      <footer className="container mx-auto px-4 py-6 text-center text-sm text-neutral-500">
        <p>
          ¿Necesitas ayuda? Contacta con{" "}
          <a
            href="mailto:soporte@alergiascl.com"
            className="text-primary hover:underline"
          >
            soporte@alergiascl.com
          </a>
        </p>
      </footer>
    </div>
  );
}

/**
 * Compact variant for simpler steps (e.g., welcome screen)
 */
export function OnboardingLayoutCompact({
  children,
  currentStep,
  onNext,
  nextLabel = "Comenzar",
  nextDisabled = false,
  isLoading = false,
}: {
  children: ReactNode;
  currentStep: number;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
}) {
  const progressPercentage = (currentStep / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-4">
          <Progress value={progressPercentage} className="h-2 bg-white/50" />
        </div>

        {/* Content card */}
        <Card className="shadow-2xl">
          <CardContent className="p-8 md:p-12">{children}</CardContent>
          {onNext && (
            <CardFooter className="flex justify-center pb-8">
              <Button
                onClick={onNext}
                disabled={nextDisabled || isLoading}
                size="lg"
                className="w-full md:w-auto px-12"
              >
                {isLoading ? "Guardando..." : nextLabel}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
