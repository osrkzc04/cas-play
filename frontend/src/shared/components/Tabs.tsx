import { cn } from "@/shared/lib/cn";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Navegación por pestañas con indicador rojo activo (identidad CAS, estilo
// editorial: subrayado de acento en vez de relleno).
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-6 border-b border-gray-200", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "-mb-px border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
              active
                ? "border-brand-600 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
