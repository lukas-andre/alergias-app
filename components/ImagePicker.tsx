"use client";

/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent } from "react";
import { useId, useRef } from "react";

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
    <section className="image-picker">
      <header>
        <h2>1. Captura o sube una foto</h2>
        <p>Necesitamos una imagen clara de la tabla de ingredientes.</p>
      </header>

      <div className="picker-body">
        {previewUrl ? (
          <figure className="picker-preview">
            <img
              alt="Vista previa de la etiqueta seleccionada"
              src={previewUrl}
              loading="lazy"
            />
          </figure>
        ) : (
          <div className="picker-placeholder">
            <p>
              Toma una foto con luz adecuada y procura que el texto esté
              enfocado y plano.
            </p>
          </div>
        )}

        <div className="picker-actions">
          <button
            className="primary"
            onClick={handlePick}
            type="button"
            disabled={disabled}
          >
            {previewUrl ? "Escanear otra etiqueta" : "Abrir cámara o galería"}
          </button>
          {previewUrl ? (
            <button className="ghost" onClick={handleClear} type="button">
              Limpiar selección
            </button>
          ) : null}
        </div>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
        type="file"
      />
    </section>
  );
}
