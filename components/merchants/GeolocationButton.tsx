"use client";

import * as React from "react";
import { Navigation, Loader2, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import type { Coordinates } from "@/lib/merchants/types";

interface GeolocationButtonProps {
  onLocationUpdate?: (coords: Coordinates) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function GeolocationButton({
  onLocationUpdate,
  variant = "outline",
  size = "default",
  showLabel = true,
}: GeolocationButtonProps) {
  const { coords, loading, error, permission, requestLocation } =
    useGeolocation();

  const handleClick = () => {
    requestLocation();
  };

  // Notify parent when coordinates change
  React.useEffect(() => {
    if (coords && onLocationUpdate) {
      onLocationUpdate(coords);
    }
  }, [coords, onLocationUpdate]);

  // Icon based on state
  const Icon = loading
    ? Loader2
    : error
    ? AlertCircle
    : coords
    ? MapPin
    : Navigation;

  const buttonVariant =
    error ? "destructive" : coords ? "default" : variant;

  const label = loading
    ? "Obteniendo ubicación..."
    : error
    ? "Error de ubicación"
    : coords
    ? "Ubicación obtenida"
    : "Usar mi ubicación";

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={buttonVariant}
      size={size}
      className={loading ? "animate-pulse" : ""}
      title={
        permission === "denied"
          ? "Permiso de ubicación denegado. Habilítalo en la configuración de tu navegador."
          : label
      }
    >
      <Icon className={`h-4 w-4 ${loading ? "animate-spin" : ""} ${showLabel ? "mr-2" : ""}`} />
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
