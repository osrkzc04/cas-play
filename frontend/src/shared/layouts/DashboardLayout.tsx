import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/shared/auth/useAuth";
import { cn } from "@/shared/lib/cn";
import { Brand } from "./Brand";
import { UserMenu } from "./UserMenu";
import { dashboardNav } from "./navigation";

export function DashboardLayout() {
  const { user } = useAuth();

  const items = dashboardNav.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Brand to="/dashboard" />
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto lg:hidden">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
