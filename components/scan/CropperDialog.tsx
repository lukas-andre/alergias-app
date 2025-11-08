/**
 * CropperDialog Component
 *
 * Image cropping interface with:
 * - Crop area (via react-easy-crop)
 * - Rotate buttons (90°, -90°)
 * - Legibility bar (estimates image quality)
 * - Confirm/Cancel actions
 *
 * Design: Professional, mobile-friendly, accessible
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { RotateCw, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CropperDialogProps {
  imageFile: File;
  onConfirm: (croppedBlob: Blob, legibility: "low" | "medium" | "high") => void;
  onCancel: () => void;
  className?: string;
}

type Legibility = "low" | "medium" | "high";

/**
 * Simple legibility estimation based on image size
 * In production, could use canvas sampling for contrast analysis
 */
function estimateLegibility(area: Area, imageFile: File): Legibility {
  // Heuristic: larger crop areas tend to have better text legibility
  const areaSize = area.width * area.height;
  const fileSizeMB = imageFile.size / (1024 * 1024);

  // Simple scoring based on crop size and file size
  if (areaSize > 500000 && fileSizeMB > 0.5) {
    return "high";
  } else if (areaSize > 200000 && fileSizeMB > 0.2) {
    return "medium";
  }
  return "low";
}

/**
 * Creates a cropped image blob from the original image and crop area
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0
): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      }
    }, "image/jpeg");
  });
}

export function CropperDialog({
  imageFile,
  onConfirm,
  onCancel,
  className,
}: CropperDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [legibility, setLegibility] = useState<Legibility>("medium");
  const [processing, setProcessing] = useState(false);

  // Load image from file
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
      // Estimate legibility based on crop area
      const estimated = estimateLegibility(croppedAreaPixels, imageFile);
      setLegibility(estimated);
    },
    [imageFile]
  );

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setProcessing(true);
      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onConfirm(croppedBlob, legibility);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Error al procesar la imagen. Intenta nuevamente.");
    } finally {
      setProcessing(false);
    }
  };

  if (!imageSrc) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <p className="text-center text-neutral-600">Cargando imagen...</p>
        </CardContent>
      </Card>
    );
  }

  const legibilityColors = {
    high: "text-accent-fresh-dark",
    medium: "text-warning-dark",
    low: "text-danger-dark",
  };

  const legibilityEmoji = {
    high: "🟢",
    medium: "🟡",
    low: "🔴",
  };

  const legibilityLabel = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
  };

  return (
    <Card className={cn("border-primary-200", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-900">
          Ajusta la Imagen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cropper Area */}
        <div className="relative w-full h-96 bg-neutral-900 rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Legibility Bar */}
        <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">
              Legibilidad estimada:
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                legibilityColors[legibility]
              )}
            >
              {legibilityEmoji[legibility]} {legibilityLabel[legibility]}
            </span>
          </div>
          {legibility === "low" && (
            <p className="text-xs text-neutral-600 mt-2">
              💡 Tip: Acerca el zoom para incluir solo la tabla de ingredientes
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Rotate buttons */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRotateLeft}
            disabled={processing}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Girar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRotateRight}
            disabled={processing}
            className="flex-1"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Girar
          </Button>
        </div>

        {/* Zoom control */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 bg-primary hover:bg-primary-600"
          >
            <Check className="w-4 h-4 mr-2" />
            {processing ? "Procesando..." : "Confirmar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
