import { Link } from "react-router-dom";

import { Card } from "@/shared/components/Card";
import { useAuth } from "@/shared/auth/useAuth";
import { roleLabels } from "@/shared/auth/roles";
import type { Role } from "@/shared/auth/types";

interface ShortcutCard {
  to: string;
  title: string;
  description: string;
  roles: Role[];
}

const shortcuts: ShortcutCard[] = [
  {
    to: "/dashboard/courses",
    title: "Gestión de cursos",
    description: "Crea, edita y publica tus cursos.",
    roles: ["ADMIN", "INSTRUCTOR"],
  },
  {
    to: "/dashboard/users",
    title: "Usuarios",
    description: "Administra cuentas y asigna roles.",
    roles: ["ADMIN"],
  },
  {
    to: "/courses",
    title: "Catálogo",
    description: "Explora los cursos disponibles.",
    roles: ["ADMIN", "INSTRUCTOR", "STUDENT"],
  },
];

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  const visibleShortcuts = shortcuts.filter((shortcut) =>
    shortcut.roles.includes(user.role),
  );

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {user.first_name}
        </h1>
        <p className="text-sm text-slate-500">
          Has iniciado sesión como {roleLabels[user.role]}.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleShortcuts.map((shortcut) => (
          <Link key={shortcut.to} to={shortcut.to}>
            <Card className="h-full p-6 transition-shadow hover:shadow-md">
              <h2 className="font-semibold text-slate-900">{shortcut.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {shortcut.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {user.role === "STUDENT" && (
        <Card className="p-6">
          <h2 className="font-semibold text-slate-900">Mis cursos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Las inscripciones y el seguimiento de progreso estarán disponibles
            próximamente.
          </p>
        </Card>
      )}
    </section>
  );
}
