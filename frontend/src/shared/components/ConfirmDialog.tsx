import type { ReactNode } from "react";

import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Mensaje o contenido del cuerpo (puede incluir el nombre del recurso). */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` para acciones destructivas (rojo institucional). */
  tone?: "danger" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// Diálogo de confirmación reutilizable para acciones irreversibles. Centraliza
// el patrón Modal + pie con Cancelar/Confirmar usado en toda la app.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </Modal>
  );
}
