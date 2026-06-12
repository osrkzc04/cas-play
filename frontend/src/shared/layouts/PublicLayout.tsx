import { Link, Outlet } from "react-router-dom";

import { Button } from "@/shared/components/Button";
import { useAuth } from "@/shared/auth/useAuth";
import { Brand } from "./Brand";
import { UserMenu } from "./UserMenu";

export function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  Panel
                </Button>
              </Link>
              <UserMenu />
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm">Iniciar sesión</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Culinary Arts School
        </div>
      </footer>
    </div>
  );
}
