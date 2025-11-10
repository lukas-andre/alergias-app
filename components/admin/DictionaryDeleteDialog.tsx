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
    allergen: "allergen",
    diet: "diet",
    intolerance: "intolerance",
  };

  const typeLabel = typeLabels[itemType];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {typeLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the{" "}
            {typeLabel}{" "}
            <span className="font-semibold">
              {itemName} ({itemKey})
            </span>{" "}
            from the database.
            <span className="block mt-2 text-amber-600 dark:text-amber-500">
              Warning: This may affect user profiles that reference this{" "}
              {typeLabel}.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
