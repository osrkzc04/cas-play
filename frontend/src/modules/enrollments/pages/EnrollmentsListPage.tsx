import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader } from "@/shared/components/PageLoader";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useAdminEnrollments } from "../hooks/useEnrollments";

const PAGE_SIZE = 10;

export function EnrollmentsListPage() {
  const [page, setPage] = useState(1);
  const location = useLocation();
  const navigate = useNavigate();

  // Aviso de éxito enviado por el formulario de matrícula al volver al listado.
  // Se guarda en estado local y se limpia del historial para que no reaparezca
  // al recargar o al navegar hacia atrás.
  const [flash] = useState<string | null>(
    (location.state as { flash?: string } | null)?.flash ?? null,
  );

  useEffect(() => {
    if ((location.state as { flash?: string } | null)?.flash) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const { data, isLoading, isError, error } = useAdminEnrollments(
    page,
    PAGE_SIZE,
  );

  const items = data?.items ?? [];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matrículas</h1>
          <p className="text-sm text-gray-500">
            Inscribe estudiantes en cursos y revisa las matrículas registradas.
          </p>
        </div>
        <Link to="/dashboard/enrollments/new">
          <Button>Nueva matrícula</Button>
        </Link>
      </header>

      {flash && <Alert tone="success">{flash}</Alert>}

      {isLoading && <PageLoader />}

      {isError && <Alert tone="error">{getApiErrorMessage(error)}</Alert>}

      {data && items.length === 0 && (
        <EmptyState title="Aún no hay matrículas registradas" />
      )}

      {items.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">Estudiante</th>
                <th scope="col" className="px-4 py-3">Correo</th>
                <th scope="col" className="px-4 py-3">Curso</th>
                <th scope="col" className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {item.student.first_name} {item.student.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.student.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.course.title}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(item.created_at).toLocaleDateString("es-EC")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {data && data.pages > 1 && (
        <nav className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {data.page} de {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pages}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </nav>
      )}
    </section>
  );
}
