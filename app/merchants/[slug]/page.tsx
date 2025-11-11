"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Globe, Clock, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MerchantMap } from "@/components/merchants/MerchantMap";
import type { MerchantWithRelations } from "@/lib/merchants/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function MerchantDetailPage(props: PageProps) {
  const params = use(props.params);
  const [merchant, setMerchant] = React.useState<MerchantWithRelations | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const response = await fetch(`/api/public/merchants/${params.slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Local no encontrado");
          }
          throw new Error("Error al cargar el local");
        }

        const result = await response.json();
        setMerchant(result.data);
      } catch (err: any) {
        console.error("Error fetching merchant:", err);
        setError(err.message || "Error al cargar el local");
      } finally {
        setLoading(false);
      }
    };

    fetchMerchant();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-neutral-200 rounded" />
            <div className="h-12 w-64 bg-neutral-200 rounded" />
            <div className="h-96 bg-neutral-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/merchants">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Locales
            </Button>
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">{error || "Local no encontrado"}</h1>
            <Link href="/merchants">
              <Button>Ver Todos los Locales</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryLocation = merchant.merchant_locations.find((loc) => loc.is_primary);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/merchants">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Locales
          </Button>
        </Link>

        {/* Hero Section */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.display_name}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Store className="h-12 w-12 text-neutral-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold mb-2">
                {merchant.display_name}
              </h1>

              {merchant.short_desc && (
                <p className="text-muted-foreground mb-4">{merchant.short_desc}</p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {merchant.diet_tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                {merchant.categories?.map((cat) => (
                  <Badge key={cat} variant="outline">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            {primaryLocation && (
              <Card>
                <CardContent className="p-0">
                  <MerchantMap
                    merchants={[
                      {
                        id: merchant.id,
                        slug: merchant.slug,
                        display_name: merchant.display_name,
                        short_desc: merchant.short_desc,
                        logo_url: merchant.logo_url,
                        diet_tags: merchant.diet_tags,
                        categories: merchant.categories,
                        priority_score: merchant.priority_score,
                        primary_location: {
                          lat: primaryLocation.lat,
                          lng: primaryLocation.lng,
                          address: primaryLocation.address,
                          region_code: primaryLocation.region_code,
                        },
                      },
                    ]}
                    center={{
                      lat: primaryLocation.lat,
                      lng: primaryLocation.lng,
                    }}
                    zoom={15}
                    className="h-[400px] w-full rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Media Gallery */}
            {merchant.merchant_media && merchant.merchant_media.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Galería</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {merchant.merchant_media.map((media) => (
                      <img
                        key={media.id}
                        src={media.url}
                        alt={media.alt || merchant.display_name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Información</h2>

                  {/* Locations */}
                  <div className="space-y-4">
                    {merchant.merchant_locations.map((location) => (
                      <div key={location.id}>
                        {location.is_primary && (
                          <Badge variant="secondary" className="mb-2">
                            Principal
                          </Badge>
                        )}

                        {location.address && (
                          <div className="flex items-start gap-2 mb-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{location.address}</span>
                          </div>
                        )}

                        {location.phone && (
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`tel:${location.phone}`}
                              className="text-sm hover:underline"
                            >
                              {location.phone}
                            </a>
                          </div>
                        )}

                        {location.website && (
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={location.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                            >
                              Visitar sitio web
                            </a>
                          </div>
                        )}

                        {location.hours && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div className="text-sm">
                              <p className="font-medium mb-1">Horarios:</p>
                              {/* TODO: Parse and display hours from JSON */}
                              <p className="text-muted-foreground text-xs">
                                Ver horarios en el local
                              </p>
                            </div>
                          </div>
                        )}

                        {!location.is_primary &&
                          location !==
                            merchant.merchant_locations[
                              merchant.merchant_locations.length - 1
                            ] && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {primaryLocation && (
                    <Button className="w-full" asChild>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${primaryLocation.lat},${primaryLocation.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Cómo llegar
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
