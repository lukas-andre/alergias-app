/**
 * Step 7: Review & Confirmation
 *
 * Final review of all onboarding data before submission.
 * Shows summary cards for each section with edit buttons.
 */

"use client";

import { CheckCircle2, Edit2, User, Salad, AlertCircle, AlertOctagon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OnboardingLayout, SeverityBadge } from "@/components/onboarding";
import type {
  BasicDataFormData,
  DietsFormData,
  AllergensFormData,
  IntolerancesFormData,
  StrictnessFormData,
} from "@/lib/schemas/onboarding.schema";

export interface ReviewStepData {
  basicData: BasicDataFormData;
  diets: DietsFormData;
  allergens: AllergensFormData;
  intolerances: IntolerancesFormData;
  strictness: StrictnessFormData;
}

export interface ReviewStepProps {
  data: ReviewStepData;
  onBack: () => void;
  onFinish: () => void;
  onEdit: (step: number) => void;
  isLoading?: boolean;
  // For display, we need the actual item names, not just keys
  dietNames?: Map<string, string>;
  allergenNames?: Map<string, string>;
  intoleranceNames?: Map<string, string>;
}

export function ReviewStep({
  data,
  onBack,
  onFinish,
  onEdit,
  isLoading = false,
  dietNames = new Map(),
  allergenNames = new Map(),
  intoleranceNames = new Map(),
}: ReviewStepProps) {
  return (
    <OnboardingLayout
      currentStep={7}
      title="Revisión Final"
      description="Revisa la información antes de finalizar. Puedes editar cualquier sección haciendo clic en el botón 'Editar'."
      onNext={onFinish}
      onBack={onBack}
      nextLabel="Finalizar Onboarding"
      isLastStep={true}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Basic Data Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Datos Básicos
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(2)}
              className="text-primary hover:text-primary"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.basicData.display_name ? (
              <div className="flex items-center gap-2">
                <span className="text-neutral-600">Nombre:</span>
                <span className="font-medium">{data.basicData.display_name}</span>
              </div>
            ) : (
              <p className="text-neutral-500 italic">Sin nombre configurado</p>
            )}

            {data.basicData.pregnant && (
              <Badge className="bg-warning-light text-warning-dark">
                👶 Embarazada o en lactancia
              </Badge>
            )}

            {data.basicData.notes && (
              <div className="pt-2">
                <span className="text-neutral-600 block mb-1">Notas:</span>
                <p className="text-neutral-700 text-xs bg-neutral-50 p-2 rounded">
                  {data.basicData.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diets Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Salad className="w-5 h-5 text-accent-fresh" />
              Dietas ({data.diets.diets.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(3)}
              className="text-primary hover:text-primary"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </CardHeader>
          <CardContent>
            {data.diets.diets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.diets.diets.map((key) => (
                  <Badge key={key} variant="secondary" className="bg-accent-fresh-50 text-accent-fresh-700">
                    {dietNames.get(key) || key}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 italic text-sm">
                Sin dietas seleccionadas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Allergens Section */}
        <Card className="border-danger-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-danger" />
              Alergias ({data.allergens.allergens.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(4)}
              className="text-primary hover:text-primary"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </CardHeader>
          <CardContent>
            {data.allergens.allergens.length > 0 ? (
              <div className="space-y-3">
                {data.allergens.allergens.map((allergen, index) => (
                  <div
                    key={`${allergen.key}-${index}`}
                    className="flex items-start justify-between gap-3 p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900">
                          {allergenNames.get(allergen.key) || allergen.key}
                        </span>
                        <SeverityBadge
                          value={allergen.severity}
                          variant="allergen"
                          showIcon={true}
                          showLabel={true}
                        />
                      </div>
                      {allergen.notes && (
                        <p className="text-xs text-neutral-600">
                          {allergen.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 italic text-sm">
                Sin alergias registradas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Intolerances Section */}
        <Card className="border-warning-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-warning" />
              Intolerancias ({data.intolerances.intolerances.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(5)}
              className="text-primary hover:text-primary"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </CardHeader>
          <CardContent>
            {data.intolerances.intolerances.length > 0 ? (
              <div className="space-y-3">
                {data.intolerances.intolerances.map((intolerance, index) => (
                  <div
                    key={`${intolerance.key}-${index}`}
                    className="flex items-start justify-between gap-3 p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900">
                          {intoleranceNames.get(intolerance.key) || intolerance.key}
                        </span>
                        <SeverityBadge
                          value={intolerance.severity}
                          variant="intolerance"
                          showIcon={true}
                          showLabel={true}
                        />
                      </div>
                      {intolerance.notes && (
                        <p className="text-xs text-neutral-600">
                          {intolerance.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 italic text-sm">
                Sin intolerancias registradas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Strictness Section */}
        <Card className="border-primary-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Nivel de Estrictitud
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(6)}
              className="text-primary hover:text-primary"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-neutral-600">Perfil:</span>
              <Badge className="bg-primary text-white">
                {data.strictness.profile_name}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={data.strictness.block_traces ? "text-danger" : "text-neutral-500"}>
                  {data.strictness.block_traces ? "✓" : "○"} Bloquear trazas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={data.strictness.block_same_line ? "text-danger" : "text-neutral-500"}>
                  {data.strictness.block_same_line ? "✓" : "○"} Bloquear misma línea
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={data.strictness.pediatric_mode ? "text-warning" : "text-neutral-500"}>
                  {data.strictness.pediatric_mode ? "✓" : "○"} Modo pediátrico
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={data.strictness.anaphylaxis_mode ? "text-danger" : "text-neutral-500"}>
                  {data.strictness.anaphylaxis_mode ? "✓" : "○"} Modo anafilaxis
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">E-numbers inciertos:</span>
                <Badge variant="outline" className="uppercase">
                  {data.strictness.e_numbers_uncertain}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Confianza mínima:</span>
                <Badge variant="outline">
                  {Math.round(data.strictness.min_model_confidence * 100)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final confirmation message */}
        <div className="rounded-lg border border-accent-fresh-light bg-accent-fresh-light/30 p-4 space-y-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-accent-fresh flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-accent-fresh-dark">
                ¡Todo listo para comenzar!
              </h3>
              <p className="text-sm text-neutral-700">
                Una vez finalices el onboarding, podrás comenzar a escanear
                productos y recibir evaluaciones de riesgo personalizadas. Podrás
                editar tu perfil en cualquier momento desde la configuración.
              </p>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
