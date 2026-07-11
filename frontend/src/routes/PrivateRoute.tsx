import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/shared/auth/useAuth";
import { PageLoader } from "@/shared/components/PageLoader";

export function PrivateRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Onboarding administrativo: hasta no cambiar la contraseña temporal, el
  // usuario queda confinado a la pantalla de cambio de contraseña.
  if (user?.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}
