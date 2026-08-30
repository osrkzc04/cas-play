import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ChevronRight, PanelLeft } from "lucide-react";

import { useAuth } from "@/shared/auth/useAuth";
import { cn } from "@/shared/lib/cn";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { Brand } from "./Brand";
import { UserMenu } from "./UserMenu";
import { dashboardNav, findActiveNavItem, navSectionOrder } from "./navigation";

export function DashboardLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const activeItem = findActiveNavItem(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const items = dashboardNav.filter(
    (item) => user && item.roles.includes(user.role),
  );

  // Group visible items by section, preserving the canonical section order and
  // dropping sections that have no items for the current role.
  const sections = navSectionOrder
    .map((section) => ({
      section,
      items: items.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-screen bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>
      <aside
        className={cn(
          "hidden w-64 shrink-0 flex-col border-r border-white/10 bg-sidebar text-white/80",
          sidebarOpen && "lg:flex",
        )}
      >
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Brand to="/dashboard" />
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {sections.map((group) => (
            <div key={group.section} className="px-3 pb-1">
              <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                {group.section}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-brand-600 text-white shadow-soft"
                          : "text-white/60 hover:bg-white/5 hover:text-white",
                      )
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-card px-4 shadow-soft sm:px-6">
          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={
                sidebarOpen
                  ? "Ocultar barra de navegación"
                  : "Mostrar barra de navegación"
              }
              aria-pressed={sidebarOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <PanelLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {activeItem && (
              <nav
                aria-label="Ruta de navegación"
                className="flex items-center gap-1.5 text-sm"
              >
                <span className="font-medium text-gray-400">
                  {activeItem.section}
                </span>
                <ChevronRight
                  className="h-4 w-4 text-gray-300"
                  aria-hidden="true"
                />
                <span className="font-semibold text-gray-900">
                  {activeItem.label}
                </span>
              </nav>
            )}
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:hidden">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-600 hover:bg-gray-100",
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
