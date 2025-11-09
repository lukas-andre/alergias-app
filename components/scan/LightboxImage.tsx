/**
 * LightboxImage Component
 *
 * Image display with lightbox functionality:
 * - Thumbnail view (h-48 max)
 * - Click to expand to full size in modal
 * - Close on backdrop click or ESC key
 *
 * Design: Clean, accessible, mobile-friendly
 */

"use client";

import { useState, useEffect } from "react";
import { X, ZoomIn } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface LightboxImageProps {
  thumbUrl: string | null;
  fullUrl: string | null;
  quality?: "low" | "medium" | "high";
  qualityLabel?: string;
  alt?: string;
  className?: string;
}

export function LightboxImage({
  thumbUrl,
  fullUrl,
  quality,
  qualityLabel,
  alt = "Etiqueta escaneada",
  className,
}: LightboxImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!thumbUrl) return null;

  const qualityEmoji =
    quality === "high" ? "🟢" : quality === "medium" ? "🟡" : "🔴";

  return (
    <>
      <Card className={cn("border-neutral-200 bg-white shadow-sm", className)}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neutral-900 flex items-center justify-between">
            <span>Etiqueta Escaneada</span>
            {qualityLabel && (
              <span className="text-sm font-normal text-neutral-600">
                {qualityEmoji} {qualityLabel}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative min-h-48 max-h-80 w-full overflow-hidden rounded-lg border-2 border-neutral-200 bg-neutral-50 cursor-pointer group"
            onClick={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(true);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Ver imagen en tamaño completo"
          >
            <img
              src={thumbUrl}
              alt={alt}
              loading="eager"
              className="w-full h-full object-contain transition-transform group-hover:scale-105"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3 shadow-lg">
                <ZoomIn className="w-6 h-6 text-neutral-700" />
              </div>
            </div>
          </div>
          <p className="text-xs text-neutral-500 text-center mt-2">
            Clic para ampliar
          </p>
        </CardContent>
      </Card>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-neutral-100 transition-colors shadow-lg"
            aria-label="Cerrar lightbox"
          >
            <X className="w-6 h-6 text-neutral-700" />
          </button>

          {/* Full-size image */}
          <div
            className="relative max-w-7xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fullUrl || thumbUrl}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
