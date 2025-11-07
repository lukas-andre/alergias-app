"use client";

/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent } from "react";
import { useId, useRef } from "react";
import { Camera, ImageIcon, X } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface ImagePickerProps {
  disabled?: boolean;
  onClear?: () => void;
  onSelect: (file: File) => void;
  previewUrl?: string | null;
}

export function ImagePicker({
  disabled,
  onClear,
  onSelect,
  previewUrl,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onSelect(file);
    event.target.value = "";
  };

  const handlePick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleClear = () => {
    onClear?.();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <Card className="border-2 border-primary-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="font-display text-2xl text-neutral-900 flex items-center gap-2">
          <Camera className="w-6 h-6 text-primary" />
          Selecciona una Foto
        </CardTitle>
        <CardDescription className="text-base text-neutral-600">
          Necesitamos una imagen clara de la tabla de ingredientes.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image Preview or Placeholder */}
        <div className="relative w-full">
          {previewUrl ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-neutral-200 bg-neutral-50">
              <img
                alt="Vista previa de la etiqueta seleccionada"
                src={previewUrl}
                loading="lazy"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] w-full rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 flex flex-col items-center justify-center p-8 text-center">
              <ImageIcon className="w-16 h-16 text-neutral-400 mb-4" />
              <p className="text-sm text-neutral-600 max-w-xs">
                Toma una foto con luz adecuada y procura que el texto esté
                enfocado y plano.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handlePick}
            type="button"
            disabled={disabled}
            className="w-full bg-primary hover:bg-primary-600 text-primary-foreground font-semibold"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            {previewUrl ? "Escanear otra etiqueta" : "Abrir cámara o galería"}
          </Button>
          {previewUrl && (
            <Button
              onClick={handleClear}
              type="button"
              variant="outline"
              className="w-full border-neutral-300"
              size="lg"
            >
              <X className="w-5 h-5 mr-2" />
              Limpiar selección
            </Button>
          )}
        </div>
      </CardContent>

      <input
        id={inputId}
        ref={inputRef}
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
        type="file"
      />
    </Card>
  );
}
