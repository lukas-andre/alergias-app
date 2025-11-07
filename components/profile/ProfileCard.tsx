/**
 * ProfileCard - Consistent card wrapper for profile sections
 *
 * Provides consistent styling and empty state support
 */

import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ProfileCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  emptyState?: {
    message: string;
    action?: ReactNode;
  };
  isEmpty?: boolean;
  className?: string;
}

export function ProfileCard({
  title,
  description,
  icon,
  children,
  emptyState,
  isEmpty = false,
  className,
}: ProfileCardProps) {
  return (
    <Card className={cn("shadow-sm border-neutral-200", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl text-neutral-900">
          {icon}
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-neutral-600">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isEmpty && emptyState ? (
          <div className="text-center py-8">
            <p className="text-neutral-500 text-sm mb-4">{emptyState.message}</p>
            {emptyState.action}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
