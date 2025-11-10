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
import { t } from "@/lib/admin/translations";

interface DictionaryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: "allergen" | "diet" | "intolerance";
  itemName: string;
  itemKey: string;
  onConfirm: () => void;
}

export function DictionaryDeleteDialog({
  open,
  onOpenChange,
  itemType,
  itemName,
  itemKey,
  onConfirm,
}: DictionaryDeleteDialogProps) {
  const typeLabels = {
    allergen: t("dictionaries.allergen"),
    diet: t("dictionaries.diet"),
    intolerance: t("dictionaries.intolerance"),
  };

  const typeLabel = typeLabels[itemType];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dictionaries.deleteItemTitle", { type: typeLabel })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("dictionaries.deleteItemDesc")}{" "}
            {typeLabel}{" "}
            <span className="font-semibold">
              {itemName} ({itemKey})
            </span>{" "}
            {t("dictionaries.deleteItemDescSuffix")}
            <span className="block mt-2 text-amber-600 dark:text-amber-500">
              {t("dictionaries.deleteItemWarning", { type: typeLabel })}
            </span>
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
