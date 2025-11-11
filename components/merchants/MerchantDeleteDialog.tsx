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

interface MerchantDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  merchantName: string;
}

export function MerchantDeleteDialog({
  open,
  onClose,
  onConfirm,
  merchantName,
}: MerchantDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar local?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar el local{" "}
            <strong className="text-foreground">{merchantName}</strong>. Esta
            acción también eliminará:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Todas sus ubicaciones</li>
              <li>Todas sus imágenes/media</li>
            </ul>
            <div className="mt-3 text-destructive font-medium">
              Esta acción no se puede deshacer.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
