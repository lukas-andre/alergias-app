/**
 * ScanTips Component
 *
 * Helpful tips for better scan quality.
 * Displays 3 bullet points with best practices.
 *
 * Design: Simple, informative, friendly tone
 */

import { Lightbulb, Sun, Focus, RotateCw } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const tips = [
  {
    icon: Sun,
    text: "Usa luz natural o buena iluminación artificial",
  },
  {
    icon: Focus,
    text: "Asegúrate que el texto esté enfocado y legible",
  },
  {
    icon: RotateCw,
    text: "Toma la foto en ángulo recto (no sesgado)",
  },
];

export function ScanTips({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          Tips para Mejor Escaneo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {tips.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <li key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed pt-1">
                  {tip.text}
                </p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
