import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/shared/auth/useAuth";
import { PageLoader } from "@/shared/components/PageLoader";

export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
