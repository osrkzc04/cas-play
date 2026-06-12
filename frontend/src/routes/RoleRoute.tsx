import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/shared/auth/useAuth";
import type { Role } from "@/shared/auth/types";

interface RoleRouteProps {
  roles: Role[];
}

export function RoleRoute({ roles }: RoleRouteProps) {
  const { user } = useAuth();

  if (user && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
