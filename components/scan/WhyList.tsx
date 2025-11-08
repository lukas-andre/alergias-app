/**
 * WhyList Component
 *
 * Displays evidence-based reasons for risk assessment.
 * Each reason includes:
 * - Human-readable explanation
 * - Highlighted evidence token
 * - Technical rule (for debug/transparency)
 * - Confidence badge
 *
 * Design: Clear hierarchy, scannable bullets, professional tone
 */

import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface WhyItem {
  text: string;
  highlight: string;
  rule: string;
  via: string;
  section: string;
  confidence: number;
}

export interface WhyListProps {
  items: WhyItem[];
  className?: string;
}

const viaColors: Record<string, string> = {
  explicit: "bg-danger-100 text-danger-dark border-danger",
  may_contain: "bg-warning-100 text-warning-dark border-warning",
  icon: "bg-danger-100 text-danger-dark border-danger",
  enumber: "bg-warning-100 text-warning-dark border-warning",
  unknown: "bg-neutral-100 text-neutral-700 border-neutral-300",
};

const viaLabels: Record<string, string> = {
  explicit: "Ingrediente",
  may_contain: "Traza",
  icon: "Etiqueta",
  enumber: "E-number",
  unknown: "Otro",
};

export function WhyList({ items, className }: WhyListProps) {
  if (items.length === 0) return null;

  return (
    <Card className={cn("border-neutral-200 bg-white shadow-sm", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          ¿Por qué vemos esto?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              {/* Bullet */}
              <span className="text-primary mt-1 flex-shrink-0">•</span>

              {/* Content */}
              <div className="flex-1 space-y-2">
                {/* Main text */}
                <p className="text-base text-neutral-800 leading-relaxed">
                  {item.text}
                </p>

                {/* Evidence + Meta */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Evidence badge */}
                  {item.highlight && (
                    <Badge
                      variant="outline"
                      className="px-2 py-1 text-xs font-mono bg-neutral-50 border-neutral-300 text-neutral-700"
                    >
                      "{item.highlight}"
                    </Badge>
                  )}

                  {/* Via badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-2 py-1 text-xs font-semibold border",
                      viaColors[item.via] || viaColors.unknown
                    )}
                  >
                    {viaLabels[item.via] || item.via}
                  </Badge>

                  {/* Confidence */}
                  {item.confidence > 0 && (
                    <span className="text-xs text-neutral-500">
                      {(item.confidence * 100).toFixed(0)}% confianza
                    </span>
                  )}

                  {/* Rule (native tooltip) */}
                  {item.rule && (
                    <span
                      title={item.rule}
                      className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors cursor-help"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
