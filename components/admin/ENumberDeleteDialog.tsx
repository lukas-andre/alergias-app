"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type ENumber } from "@/lib/admin/api-client";
import { t } from "@/lib/admin/translations";

interface ENumberDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eNumber: ENumber;
  onConfirm: () => void;
}

export function ENumberDeleteDialog({
  open,
  onOpenChange,
  eNumber,
  onConfirm,
}: ENumberDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("eNumbers.deleteTitle", { code: eNumber.code })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("eNumbers.deleteDesc")}{" "}
            <span className="font-semibold">{eNumber.code} ({eNumber.name_es})</span>{" "}
            {t("eNumbers.deleteDescSuffix")}
            {eNumber.linked_allergen_keys.length > 0 && (
              <span className="block mt-2 text-destructive">
                {t("eNumbers.deleteWarning", { count: eNumber.linked_allergen_keys.length })}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
