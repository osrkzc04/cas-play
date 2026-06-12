import type { Role } from "@/shared/auth/types";

export interface NavItem {
  to: string;
  label: string;
  roles: Role[];
  end?: boolean;
}

// Single source of truth for the dashboard sidebar; each item declares which
// roles may see it and the layout filters against the current user's role.
export const dashboardNav: NavItem[] = [
  {
    to: "/dashboard",
    label: "Inicio",
    roles: ["ADMIN", "INSTRUCTOR", "STUDENT"],
    end: true,
  },
  {
    to: "/dashboard/courses",
    label: "Gestión de cursos",
    roles: ["ADMIN", "INSTRUCTOR"],
  },
  {
    to: "/dashboard/users",
    label: "Usuarios",
    roles: ["ADMIN"],
  },
  {
    to: "/courses",
    label: "Catálogo",
    roles: ["ADMIN", "INSTRUCTOR", "STUDENT"],
  },
];
