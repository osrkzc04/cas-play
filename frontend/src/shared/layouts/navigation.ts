import {
  Award,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  ScrollText,
  Star,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/shared/auth/types";

export type NavSection = "PRINCIPAL" | "GESTIÓN" | "MI APRENDIZAJE";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  section: NavSection;
  roles: Role[];
  end?: boolean;
}

// Single source of truth for the dashboard sidebar; each item declares which
// roles may see it and the layout filters against the current user's role.
// `section` groups items into labeled blocks within the sidebar.
export const dashboardNav: NavItem[] = [
  {
    to: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    section: "PRINCIPAL",
    roles: ["ADMIN", "INSTRUCTOR", "STUDENT"],
    end: true,
  },
  {
    to: "/courses",
    label: "Catálogo",
    icon: LibraryBig,
    section: "PRINCIPAL",
    roles: ["ADMIN", "INSTRUCTOR", "STUDENT"],
  },
  {
    to: "/dashboard/courses",
    label: "Gestión de cursos",
    icon: BookOpen,
    section: "GESTIÓN",
    roles: ["ADMIN", "INSTRUCTOR"],
  },
  {
    to: "/dashboard/profile",
    label: "Mi perfil",
    icon: UserCircle,
    section: "GESTIÓN",
    roles: ["INSTRUCTOR"],
  },
  {
    to: "/dashboard/enrollments",
    label: "Matrículas",
    icon: ClipboardList,
    section: "GESTIÓN",
    roles: ["ADMIN"],
  },
  {
    to: "/dashboard/users",
    label: "Usuarios",
    icon: Users,
    section: "GESTIÓN",
    roles: ["ADMIN"],
  },
  {
    to: "/dashboard/issued-certificates",
    label: "Certificados",
    icon: Award,
    section: "GESTIÓN",
    roles: ["ADMIN"],
  },
  {
    to: "/dashboard/ratings",
    label: "Reseñas",
    icon: Star,
    section: "GESTIÓN",
    roles: ["ADMIN"],
  },
  {
    to: "/dashboard/audit",
    label: "Auditoría",
    icon: ScrollText,
    section: "GESTIÓN",
    roles: ["ADMIN"],
  },
  {
    to: "/dashboard/my-courses",
    label: "Mis cursos",
    icon: GraduationCap,
    section: "MI APRENDIZAJE",
    roles: ["STUDENT"],
  },
  {
    to: "/dashboard/certificates",
    label: "Certificados",
    icon: Award,
    section: "MI APRENDIZAJE",
    roles: ["STUDENT"],
  },
];

// Section render order. Items are grouped under these headers in the sidebar.
export const navSectionOrder: NavSection[] = [
  "PRINCIPAL",
  "GESTIÓN",
  "MI APRENDIZAJE",
];

// Resolves which nav item a pathname belongs to (for breadcrumbs). Picks the
// longest matching `to` so nested routes (e.g. /dashboard/courses/new) resolve
// to their parent ("Gestión de cursos").
export function findActiveNavItem(pathname: string): NavItem | undefined {
  return dashboardNav
    .filter((item) =>
      item.end
        ? pathname === item.to
        : pathname === item.to || pathname.startsWith(`${item.to}/`),
    )
    .sort((a, b) => b.to.length - a.to.length)[0];
}
