import { useEffect } from "react";

// Advierte con el diálogo nativo del navegador antes de recargar o cerrar la
// pestaña cuando hay cambios sin guardar.
//
// Limitación: NO intercepta la navegación interna (SPA). La app usa
// <BrowserRouter> y `useBlocker` de React Router requiere un data router
// (createBrowserRouter); bloquear enlaces internos exigiría migrar el router.
export function useUnsavedChangesGuard(when: boolean) {
  useEffect(() => {
    if (!when) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Requerido por navegadores antiguos para disparar el aviso.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [when]);
}
