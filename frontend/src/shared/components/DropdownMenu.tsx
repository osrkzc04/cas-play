import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { MoreVertical, type LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Spinner } from "./Spinner";

export interface DropdownItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  /** Si se define, el ítem se renderiza como enlace de navegación. */
  to?: string;
  /** Acción a ejecutar al seleccionar (alternativa a `to`). */
  onSelect?: () => void;
  /** `danger` resalta acciones destructivas con el rojo institucional. */
  tone?: "default" | "danger";
  disabled?: boolean;
  loading?: boolean;
}

interface DropdownMenuProps {
  items: DropdownItem[];
  /** Contenido del botón disparador. Por defecto, un menú de tres puntos. */
  trigger?: ReactNode;
  /** Etiqueta accesible del disparador. */
  label?: string;
  /** Alineación del panel respecto al disparador. */
  align?: "start" | "end";
  className?: string;
}

const ITEM_CLASS =
  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export function DropdownMenu({
  items,
  trigger,
  label = "Abrir menú de acciones",
  align = "end",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);

  // Posiciona el panel mediante coordenadas fijas calculadas desde el
  // disparador; así no lo recorta el `overflow` de una Card con scroll.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const PANEL_WIDTH = 192;
    const left =
      align === "end" ? rect.right - PANEL_WIDTH : rect.left;
    setCoords({
      top: rect.bottom + 6,
      left: Math.max(8, left),
    });
  }, [open, align]);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        close();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    const handleViewportChange = () => close();

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [open, close]);

  // Al abrir, enfoca el primer ítem habilitado para navegación por teclado.
  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>(
      "[role='menuitem']:not([aria-disabled='true'])",
    );
    first?.focus();
  }, [open]);

  const moveFocus = (direction: 1 | -1) => {
    const nodes = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        "[role='menuitem']:not([aria-disabled='true'])",
      ) ?? [],
    );
    if (nodes.length === 0) return;
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    const next = (index + direction + nodes.length) % nodes.length;
    nodes[next]?.focus();
  };

  const handlePanelKey = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(-1);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={trigger ? undefined : label}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-2 rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
          trigger ? "px-3" : "w-9",
          className,
        )}
      >
        {trigger ?? <MoreVertical className="h-5 w-5" aria-hidden="true" />}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            onKeyDown={handlePanelKey}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-50 w-48 overflow-hidden rounded-lg border border-gray-200 bg-card py-1 shadow-dropdown"
          >
            {items.map((item) => {
              const Icon = item.icon;
              const disabled = item.disabled || item.loading;
              const toneClass =
                item.tone === "danger"
                  ? "text-brand-600 hover:bg-brand-50"
                  : "text-gray-700 hover:bg-gray-50";
              const content = (
                <>
                  {item.loading ? (
                    <Spinner size="sm" />
                  ) : (
                    Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate">{item.label}</span>
                </>
              );

              if (item.to && !disabled) {
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    role="menuitem"
                    onClick={close}
                    className={cn(ITEM_CLASS, toneClass)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  aria-disabled={disabled || undefined}
                  disabled={disabled}
                  onClick={() => {
                    close();
                    item.onSelect?.();
                  }}
                  className={cn(ITEM_CLASS, toneClass)}
                >
                  {content}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
