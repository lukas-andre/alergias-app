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
          <AlertDialogTitle>Delete E-number {eNumber.code}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-semibold">{eNumber.code} ({eNumber.name_es})</span>{" "}
            from the database.
            {eNumber.linked_allergen_keys.length > 0 && (
              <span className="block mt-2 text-destructive">
                Warning: This E-number is linked to {eNumber.linked_allergen_keys.length} allergen(s).
              </span>
            )}
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
