"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Coordinates } from "@/lib/merchants/types";

// Default fallback: Santiago city center
const DEFAULT_COORDS: Coordinates = {
  lat: -33.4489,
  lng: -70.6693,
};

export type PermissionState = "prompt" | "granted" | "denied" | "unsupported";

interface GeolocationState {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
  permission: PermissionState;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean; // Future: use IP geolocation if browser blocked
  autoRequest?: boolean; // Automatically request location on mount
}

const DEFAULT_OPTIONS: UseGeolocationOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 300000, // 5 minutes cache
  fallbackToIP: false,
  autoRequest: false,
};

/**
 * Hook for managing browser geolocation with fallbacks
 *
 * @example
 * ```tsx
 * const { coords, loading, error, requestLocation } = useGeolocation();
 *
 * // Request location on button click
 * <button onClick={requestLocation}>Get My Location</button>
 * ```
 */
export function useGeolocation(
  options: UseGeolocationOptions = {}
): GeolocationState & {
  requestLocation: () => void;
  resetToDefault: () => void;
} {
  // Memoize options to prevent recreation on every render
  const opts = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [
      options.enableHighAccuracy,
      options.timeout,
      options.maximumAge,
      options.fallbackToIP,
      options.autoRequest,
    ]
  );

  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: false,
    error: null,
    permission: "prompt",
  });

  // Track if we've already requested location to prevent infinite loops
  const hasRequestedRef = useRef(false);

  // Check if geolocation is supported
  const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

  /**
   * Fallback to IP geolocation (ipapi.co)
   * Free tier: 1,000 requests/day, no API key required
   */
  const fallbackToIPGeolocation = useCallback(async () => {
    if (!opts.fallbackToIP) return false;

    try {
      const response = await fetch("https://ipapi.co/json/");
      if (!response.ok) throw new Error("IP geolocation failed");

      const data = await response.json();
      if (data.latitude && data.longitude) {
        setState((prev) => ({
          ...prev,
          coords: { lat: data.latitude, lng: data.longitude },
          loading: false,
          error: null,
        }));
        return true;
      }
    } catch (err) {
      console.error("IP geolocation fallback failed:", err);
    }

    return false;
  }, [opts.fallbackToIP]);

  /**
   * Request browser geolocation
   */
  const requestLocation = useCallback(() => {
    if (!isSupported) {
      setState({
        coords: DEFAULT_COORDS,
        loading: false,
        error: "La geolocalización no es compatible con tu navegador",
        permission: "unsupported",
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          loading: false,
          error: null,
          permission: "granted",
        });
      },
      async (error) => {
        let errorMessage = "No se pudo obtener tu ubicación";
        let permissionState: PermissionState = "denied";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado";
            permissionState = "denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado";
            break;
        }

        // Try IP fallback if enabled
        const ipSuccess = await fallbackToIPGeolocation();

        if (!ipSuccess) {
          // Ultimate fallback to Santiago
          setState({
            coords: DEFAULT_COORDS,
            loading: false,
            error: errorMessage,
            permission: permissionState,
          });
        }
      },
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge,
      }
    );
  }, [isSupported, opts, fallbackToIPGeolocation]);

  /**
   * Reset to default Santiago coordinates
   */
  const resetToDefault = useCallback(() => {
    setState({
      coords: DEFAULT_COORDS,
      loading: false,
      error: null,
      permission: "prompt",
    });
  }, []);

  // Auto-request on mount if enabled
  // Use ref to prevent multiple requests when requestLocation changes
  useEffect(() => {
    if (opts.autoRequest && !hasRequestedRef.current) {
      hasRequestedRef.current = true;
      requestLocation();
    }
  }, [opts.autoRequest, requestLocation]);

  // Memoize coords to prevent infinite loops in dependency arrays
  // Only recreate the coords object if lat/lng values actually change
  const memoizedCoords = useMemo(
    () => state.coords,
    [state.coords?.lat, state.coords?.lng]
  );

  return {
    ...state,
    coords: memoizedCoords,
    requestLocation,
    resetToDefault,
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  from: Coordinates,
  to: Coordinates
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
