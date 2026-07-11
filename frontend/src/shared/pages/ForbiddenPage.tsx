import { Link } from "react-router-dom";

import { Button } from "@/shared/components/Button";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-brand-600">403</p>
      <h1 className="text-xl font-semibold text-gray-800">
        No tienes permiso para acceder a esta página
      </h1>
      <Link to="/dashboard">
        <Button>Volver al panel</Button>
      </Link>
    </div>
  );
}
