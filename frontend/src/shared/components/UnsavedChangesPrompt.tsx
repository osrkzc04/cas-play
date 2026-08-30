import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

import { useUnsavedChangesGuard } from "@/shared/lib/useUnsavedChangesGuard";
import { ConfirmDialog } from "./ConfirmDialog";

interface UnsavedChangesPromptProps {
  /** Activa la protección (típicamente `formState.isDirty && !isSubmitting`). */
  when: boolean;
  message?: string;
}

// Protege contra la pérdida de datos por navegación cuando hay cambios sin
// guardar: bloquea la navegación interna (SPA) con un diálogo y, además, avisa
// ante recarga/cierre de pestaña. Requiere un data router (createBrowserRouter).
export function UnsavedChangesPrompt({
  when,
  message = "Tienes cambios sin guardar. Si sales de esta página, se perderán.",
}: UnsavedChangesPromptProps) {
  useUnsavedChangesGuard(when);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  );

  // Si la protección se desactiva mientras hay una navegación bloqueada, se
  // libera para no dejar al usuario atrapado.
  useEffect(() => {
    if (!when && blocker.state === "blocked") {
      blocker.reset();
    }
  }, [when, blocker]);

  return (
    <ConfirmDialog
      open={blocker.state === "blocked"}
      title="Cambios sin guardar"
      message={message}
      confirmLabel="Salir sin guardar"
      cancelLabel="Seguir editando"
      onConfirm={() => blocker.proceed?.()}
      onClose={() => blocker.reset?.()}
    />
  );
}
