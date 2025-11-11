"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Coordinates, MerchantCardData } from "@/lib/merchants/types";

interface MerchantMapProps {
  merchants: MerchantCardData[];
  center: Coordinates;
  zoom?: number;
  onMarkerClick?: (merchant: MerchantCardData) => void;
  className?: string;
}

export function MerchantMap({
  merchants,
  center,
  zoom = 13,
  onMarkerClick,
  className = "h-[600px] w-full rounded-lg overflow-hidden",
}: MerchantMapProps) {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<maplibregl.Map | null>(null);
  const markers = React.useRef<maplibregl.Marker[]>([]);

  // Initialize map
  React.useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [center.lng, center.lat],
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Add user location marker
    const userMarker = new maplibregl.Marker({
      color: "#7C3AED", // Primary purple
      scale: 0.8,
    })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);

    markers.current.push(userMarker);

    return () => {
      // Cleanup markers
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      // Cleanup map
      map.current?.remove();
      map.current = null;
    };
  }, []); // Empty deps - only initialize once

  // Update center when it changes
  React.useEffect(() => {
    if (!map.current) return;
    map.current.flyTo({
      center: [center.lng, center.lat],
      zoom: zoom,
      duration: 1000,
    });
  }, [center.lat, center.lng, zoom]);

  // Update merchant markers when merchants change
  React.useEffect(() => {
    if (!map.current) return;

    // Remove existing merchant markers (keep user marker)
    markers.current.slice(1).forEach((marker) => marker.remove());
    markers.current = [markers.current[0]]; // Keep only user marker

    // Add new merchant markers
    merchants.forEach((merchant) => {
      if (!merchant.primary_location) return;

      const { lat, lng } = merchant.primary_location;

      // Create marker element with store icon
      const el = document.createElement("div");
      el.className = "merchant-marker";
      el.innerHTML = `
        <div class="flex items-center justify-center w-10 h-10 bg-primary rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <path d="M3 6h18"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
      `;

      // Create popup content
      const popupContent = `
        <div class="p-2 min-w-[200px]">
          <h3 class="font-semibold text-sm mb-1">${merchant.display_name}</h3>
          ${
            merchant.short_desc
              ? `<p class="text-xs text-gray-600 mb-2 line-clamp-2">${merchant.short_desc}</p>`
              : ""
          }
          ${
            merchant.distance_km !== undefined
              ? `<p class="text-xs text-gray-500">📍 ${
                  merchant.distance_km < 1
                    ? Math.round(merchant.distance_km * 1000) + "m"
                    : merchant.distance_km.toFixed(1) + "km"
                }</p>`
              : ""
          }
          ${
            merchant.diet_tags && merchant.diet_tags.length > 0
              ? `<div class="flex flex-wrap gap-1 mt-2">
                  ${merchant.diet_tags
                    .slice(0, 3)
                    .map(
                      (tag) =>
                        `<span class="text-xs px-2 py-0.5 bg-gray-100 rounded">${tag}</span>`
                    )
                    .join("")}
                </div>`
              : ""
          }
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
      }).setHTML(popupContent);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Click handler
      el.addEventListener("click", () => {
        if (onMarkerClick) {
          onMarkerClick(merchant);
        }
      });

      markers.current.push(marker);
    });

    // Fit map to show all markers if there are merchants
    if (merchants.length > 0 && map.current) {
      const bounds = new maplibregl.LngLatBounds();

      // Add user location to bounds
      bounds.extend([center.lng, center.lat]);

      // Add all merchant locations to bounds
      merchants.forEach((merchant) => {
        if (merchant.primary_location) {
          bounds.extend([
            merchant.primary_location.lng,
            merchant.primary_location.lat,
          ]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
        duration: 1000,
      });
    }
  }, [merchants, onMarkerClick, center]);

  return (
    <div
      ref={mapContainer}
      className={className}
      style={{
        borderRadius: "0.5rem",
        border: "1px solid rgb(229 231 235)",
      }}
    />
  );
}

/**
 * Skeleton loader for map
 */
export function MerchantMapSkeleton({
  className = "h-[600px] w-full rounded-lg overflow-hidden",
}: {
  className?: string;
}) {
  return (
    <div
      className={`${className} bg-neutral-200 dark:bg-neutral-800 animate-pulse flex items-center justify-center`}
    >
      <div className="text-muted-foreground text-sm">Cargando mapa...</div>
    </div>
  );
}
