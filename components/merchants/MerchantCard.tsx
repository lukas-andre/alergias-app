"use client";

import Link from "next/link";
import { Store, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MerchantCardData } from "@/lib/merchants/types";

interface MerchantCardProps {
  merchant: MerchantCardData;
  onClick?: (merchant: MerchantCardData) => void;
  showDistance?: boolean;
}

export function MerchantCard({
  merchant,
  onClick,
  showDistance = true,
}: MerchantCardProps) {
  const {
    slug,
    display_name,
    logo_url,
    short_desc,
    diet_tags,
    distance_km,
    primary_location,
  } = merchant;

  const cardContent = (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
      <CardContent className="p-4">
        {/* Logo and Name */}
        <div className="flex items-start gap-3 mb-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logo_url ? (
              <img
                src={logo_url}
                alt={display_name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Store className="h-6 w-6 text-neutral-400" />
              </div>
            )}
          </div>

          {/* Name and Location */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-1">
              {display_name}
            </h3>
            {primary_location?.region_code && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                <span>{primary_location.region_code}</span>
              </div>
            )}
          </div>

          {/* Distance Badge */}
          {showDistance && distance_km !== undefined && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {distance_km < 1
                ? `${Math.round(distance_km * 1000)}m`
                : `${distance_km.toFixed(1)}km`}
            </Badge>
          )}
        </div>

        {/* Description */}
        {short_desc && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {short_desc}
          </p>
        )}

        {/* Diet Tags */}
        {diet_tags && diet_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {diet_tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {diet_tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{diet_tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // If onClick provided, handle click; otherwise use Link
  if (onClick) {
    return <div onClick={() => onClick(merchant)}>{cardContent}</div>;
  }

  return (
    <Link href={`/merchants/${slug}`} className="block">
      {cardContent}
    </Link>
  );
}

/**
 * Skeleton loader for MerchantCard
 */
export function MerchantCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-12 w-12 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-5/6" />
        </div>
        <div className="flex gap-1">
          <div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
