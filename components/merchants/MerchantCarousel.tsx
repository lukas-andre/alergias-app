"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MerchantCard, MerchantCardSkeleton } from "./MerchantCard";
import type { MerchantCardData } from "@/lib/merchants/types";

interface MerchantCarouselProps {
  merchants: MerchantCardData[];
  title?: string;
  loading?: boolean;
  showDistance?: boolean;
}

export function MerchantCarousel({
  merchants,
  title = "Locales Cerca de Ti",
  loading = false,
  showDistance = true,
}: MerchantCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 768px)": { slidesToScroll: 2 },
      "(min-width: 1024px)": { slidesToScroll: 3 },
    },
  });

  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (loading) {
    return (
      <div className="space-y-4">
        {title && <h2 className="text-2xl font-bold">{title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <MerchantCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!merchants || merchants.length === 0) {
    return (
      <div className="space-y-4">
        {title && <h2 className="text-2xl font-bold">{title}</h2>}
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
          <p className="text-muted-foreground">
            No se encontraron locales en esta área.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        {title && <h2 className="text-2xl font-bold">{title}</h2>}
        {merchants.length > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {merchants.map((merchant) => (
            <div
              key={merchant.id}
              className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33.333%-0.667rem)]"
            >
              <MerchantCard merchant={merchant} showDistance={showDistance} />
            </div>
          ))}
        </div>
      </div>

      {/* Optional: Pagination Dots for mobile */}
      {merchants.length > 1 && (
        <div className="flex justify-center gap-2 md:hidden">
          {merchants.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === 0
                  ? "bg-primary"
                  : "bg-neutral-300 dark:bg-neutral-700"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
