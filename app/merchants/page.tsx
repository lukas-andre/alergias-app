"use client";

import * as React from "react";
import { Search, SlidersHorizontal, MapIcon, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MerchantMap, MerchantMapSkeleton } from "@/components/merchants/MerchantMap";
import { MerchantCard, MerchantCardSkeleton } from "@/components/merchants/MerchantCard";
import { GeolocationButton } from "@/components/merchants/GeolocationButton";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { filterMerchantsByName } from "@/lib/merchants/queries";
import type { Coordinates, MerchantCardData } from "@/lib/merchants/types";
import type { NearbyMerchant } from "@/lib/merchants/types";

export default function MerchantsPage() {
  const [merchants, setMerchants] = React.useState<NearbyMerchant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDietTags, setSelectedDietTags] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [view, setView] = React.useState<"map" | "list">("map");
  const [radiusKm, setRadiusKm] = React.useState(10);

  const {
    coords: userCoords,
    loading: locationLoading,
    requestLocation,
  } = useGeolocation({ autoRequest: true });

  // Fetch merchants when location changes
  React.useEffect(() => {
    if (!userCoords) return;

    const fetchMerchants = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          lat: userCoords.lat.toString(),
          lng: userCoords.lng.toString(),
          radius_km: radiusKm.toString(),
        });

        if (selectedDietTags.length > 0) {
          params.append("diet_tags", selectedDietTags.join(","));
        }

        if (selectedCategories.length > 0) {
          params.append("categories", selectedCategories.join(","));
        }

        const response = await fetch(`/api/public/merchants?${params}`);

        if (!response.ok) {
          throw new Error("Error al cargar locales");
        }

        const result = await response.json();
        setMerchants(result.data || []);
      } catch (err: any) {
        console.error("Error fetching merchants:", err);
        setError(err.message || "Error al cargar locales");
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, [userCoords, radiusKm, selectedDietTags, selectedCategories]);

  // Filter merchants by search query (client-side)
  const filteredMerchants = React.useMemo(() => {
    return filterMerchantsByName(merchants, searchQuery);
  }, [merchants, searchQuery]);

  // Convert to MerchantCardData format
  const merchantCards: MerchantCardData[] = React.useMemo(() => {
    return filteredMerchants.map((m) => ({
      id: m.id,
      slug: m.slug,
      display_name: m.display_name,
      short_desc: m.short_desc,
      logo_url: m.logo_url,
      diet_tags: m.diet_tags,
      categories: m.categories,
      priority_score: m.priority_score,
      distance_km: m.distance_km,
      primary_location: {
        lat: m.lat,
        lng: m.lng,
        address: m.address,
        region_code: null,
      },
    }));
  }, [filteredMerchants]);

  // Extract unique diet tags and categories for filters
  const availableDietTags = React.useMemo(() => {
    const tags = new Set<string>();
    merchants.forEach((m) => m.diet_tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [merchants]);

  const availableCategories = React.useMemo(() => {
    const cats = new Set<string>();
    merchants.forEach((m) => m.categories?.forEach((cat) => cats.add(cat)));
    return Array.from(cats).sort();
  }, [merchants]);

  const toggleDietTag = (tag: string) => {
    setSelectedDietTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedDietTags([]);
    setSelectedCategories([]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedDietTags.length > 0 ||
    selectedCategories.length > 0 ||
    searchQuery.trim() !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold mb-2">
            Locales Verificados
          </h1>
          <p className="text-muted-foreground">
            Descubre locales con opciones para tus necesidades dietarias
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          {/* Search and Location */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <GeolocationButton />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtros
                  {hasActiveFilters && (
                    <Badge
                      variant="default"
                      className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
                    >
                      {selectedDietTags.length + selectedCategories.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>
                    Filtra locales por tus preferencias
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  {/* Diet Tags */}
                  {availableDietTags.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Tags Dietarios</h3>
                      <div className="space-y-2">
                        {availableDietTags.map((tag) => (
                          <div key={tag} className="flex items-center space-x-2">
                            <Checkbox
                              id={`diet-${tag}`}
                              checked={selectedDietTags.includes(tag)}
                              onCheckedChange={() => toggleDietTag(tag)}
                            />
                            <Label htmlFor={`diet-${tag}`} className="flex-1 cursor-pointer">
                              {tag}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {availableCategories.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Categorías</h3>
                      <div className="space-y-2">
                        {availableCategories.map((cat) => (
                          <div key={cat} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${cat}`}
                              checked={selectedCategories.includes(cat)}
                              onCheckedChange={() => toggleCategory(cat)}
                            />
                            <Label htmlFor={`cat-${cat}`} className="flex-1 cursor-pointer">
                              {cat}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline" className="w-full">
                      Limpiar Filtros
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* View Toggle */}
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={view === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("map")}
              >
                <MapIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {selectedDietTags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button
                    onClick={() => toggleDietTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {selectedCategories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {locationLoading || !userCoords ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Obteniendo tu ubicación...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button onClick={requestLocation} variant="outline" className="mt-4">
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map/List View */}
            <div className="lg:col-span-2">
              {view === "map" ? (
                loading ? (
                  <MerchantMapSkeleton />
                ) : (
                  <MerchantMap
                    merchants={merchantCards}
                    center={userCoords}
                    zoom={13}
                  />
                )
              ) : loading ? (
                <div className="grid grid-cols-1 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <MerchantCardSkeleton key={i} />
                  ))}
                </div>
              ) : merchantCards.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border">
                  <p className="text-muted-foreground">
                    No se encontraron locales en esta área.
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Limpiar Filtros
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {merchantCards.map((merchant) => (
                    <MerchantCard key={merchant.id} merchant={merchant} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar - Merchant List */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">
                    {merchantCards.length}{" "}
                    {merchantCards.length === 1 ? "Local" : "Locales"}
                  </h2>
                  <Badge variant="outline">{radiusKm}km</Badge>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <MerchantCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {merchantCards.map((merchant) => (
                      <MerchantCard key={merchant.id} merchant={merchant} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
