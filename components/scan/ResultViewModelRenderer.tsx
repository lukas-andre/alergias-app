/**
 * ResultViewModelRenderer Component
 *
 * Master component that renders complete analysis result using ViewModel.
 * This component orchestrates all components in the correct hierarchy:
 *
 * 1. VerdictPill (top, prominent)
 * 2. WhyList (evidence-based explanations)
 * 3. Matched Allergens (red chips)
 * 4. Informational Allergens (amber chips)
 * 5. Diets (if applicable)
 * 6. Intolerances (if applicable)
 * 7. E-numbers (expandable)
 * 8. Ingredients (interactive panel)
 * 9. Image (lightbox)
 *
 * Design: Clean hierarchy, mobile-first, professional
 */

import { VerdictPill } from "./VerdictPill";
import { WhyList } from "./WhyList";
import { IngredientPanel } from "./IngredientPanel";
import { ENumberTable } from "./ENumberTable";
import { LightboxImage } from "./LightboxImage";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AlertTriangle, Info, Utensils, Heart } from "lucide-react";
import type { ResultViewModel } from "@/lib/risk/view-model";

export interface ResultViewModelRendererProps {
  viewModel: ResultViewModel;
  className?: string;
}

export function ResultViewModelRenderer({
  viewModel,
  className,
}: ResultViewModelRendererProps) {
  const {
    verdict,
    why,
    allergens,
    diets,
    intolerances,
    enumbers,
    ingredients,
    image,
    meta,
  } = viewModel;

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* 1. VERDICT (Top, most prominent) */}
        <VerdictPill
          level={verdict.level}
          text={verdict.text}
          pills={verdict.pills}
          confidence={verdict.confidence}
          emoji={verdict.emoji}
          scannedAt={meta.scannedAt}
          quality={meta.qualityLabel}
        />

        {/* 2. WHY (Evidence & Explainability) */}
        {why.length > 0 && <WhyList items={why} />}

        {/* 3. MATCHED ALLERGENS (Red - Matches profile) */}
        {allergens.matched.length > 0 && (
          <Card className="border-2 border-danger-200 bg-danger-soft shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-danger-dark flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alérgenos Detectados (Coinciden con Tu Perfil)
              </CardTitle>
              <CardDescription className="text-danger-dark/80">
                Estos alérgenos están en tu perfil y fueron detectados en el
                producto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allergens.matched.map((allergen, idx) => (
                  <Badge
                    key={`${allergen.name}-${idx}`}
                    variant="destructive"
                    className="px-3 py-1.5 text-sm font-semibold bg-danger text-white hover:bg-danger-600"
                  >
                    {allergen.name} (sev: {allergen.severity})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. INFORMATIONAL ALLERGENS (Amber - Not in profile) */}
        {allergens.informational.length > 0 && (
          <Card className="border-warning-200 bg-warning-soft shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-warning-dark flex items-center gap-2">
                <Info className="w-5 h-5" />
                Otros Alérgenos Detectados (Informativos)
              </CardTitle>
              <CardDescription className="text-warning-dark/80">
                Estos alérgenos no están en tu perfil pero fueron detectados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allergens.informational.map((allergen, idx) => (
                  <Badge
                    key={`${allergen.name}-${idx}`}
                    variant="outline"
                    className="px-3 py-1.5 text-sm font-semibold bg-warning-100 border-warning text-warning-dark"
                  >
                    {allergen.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5. DIETS (If restrictions found) */}
        {diets.length > 0 && (
          <Card className="border-warning-200 bg-warning-soft shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-warning-dark flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Restricciones Dietarias
              </CardTitle>
              <CardDescription className="text-warning-dark/80">
                Ingredientes que no cumplen con tus dietas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diets.map((diet, idx) => (
                  <div key={`${diet.key}-${idx}`} className="space-y-1">
                    <p className="text-sm font-semibold text-neutral-900">
                      Dieta: {diet.key}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {diet.blockedIngredients.map((ingredient, iIdx) => (
                        <Badge
                          key={`${ingredient}-${iIdx}`}
                          variant="outline"
                          className="px-2 py-0.5 text-xs bg-white border-warning-300 text-warning-dark"
                        >
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 6. INTOLERANCES (If triggers found) */}
        {intolerances.length > 0 && (
          <Card className="border-warning-200 bg-warning-soft shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-warning-dark flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Intolerancias
              </CardTitle>
              <CardDescription className="text-warning-dark/80">
                Ingredientes que pueden desencadenar tus intolerancias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {intolerances.map((intolerance, idx) => (
                  <div key={`${intolerance.key}-${idx}`} className="space-y-1">
                    <p className="text-sm font-semibold text-neutral-900">
                      {intolerance.key}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {intolerance.triggeredBy.map((trigger, tIdx) => (
                        <Badge
                          key={`${trigger}-${tIdx}`}
                          variant="outline"
                          className="px-2 py-0.5 text-xs bg-white border-warning-300 text-warning-dark"
                        >
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 7. E-NUMBERS (Expandable) */}
        {enumbers.length > 0 && <ENumberTable enumbers={enumbers} />}

        {/* 8. INGREDIENTS (Interactive panel) */}
        <IngredientPanel chips={ingredients.chips} asText={ingredients.asText} />

        {/* 9. IMAGE (Lightbox) */}
        {image.thumbUrl && (
          <LightboxImage
            thumbUrl={image.thumbUrl}
            fullUrl={image.fullUrl}
            quality={image.quality}
            qualityLabel={image.qualityLabel}
          />
        )}
      </div>
    </div>
  );
}
