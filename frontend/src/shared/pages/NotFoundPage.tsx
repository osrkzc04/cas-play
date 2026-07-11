import { Link } from "react-router-dom";

import { Button } from "@/shared/components/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <h1 className="text-xl font-semibold text-gray-800">
        La página que buscas no existe
      </h1>
      <Link to="/">
        <Button>Ir al inicio</Button>
      </Link>
    </div>
  );
}
