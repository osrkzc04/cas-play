import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Alert,
  Button,
  Card,
  PageHeader,
  PageLoader,
  Pagination,
  Select,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { formatDate } from "@/shared/lib/format";
import { courseService } from "@/modules/courses/services/courseService";
import {
  useAdminCertificates,
  useDownloadAdminCertificate,
} from "../hooks/useCertificates";

const PAGE_SIZE = 20;

export function AdminCertificatesListPage() {
  const [courseId, setCourseId] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useAdminCertificates(
    page,
    PAGE_SIZE,
    courseId || undefined,
  );

  const download = useDownloadAdminCertificate();

  // El admin gestiona cursos, así que reutilizamos el listado de gestión para
  // ofrecer el filtro por curso sin un endpoint adicional.
  const coursesQuery = useQuery({
    queryKey: ["courses", "manage", "certificate-filter"],
    queryFn: () => courseService.getManaged({ page: 1, size: 100 }),
  });

  const courseOptions = useMemo(
    () =>
      (coursesQuery.data?.items ?? []).map((course) => ({
        value: course.id,
        label: course.title,
      })),
    [coursesQuery.data],
  );

  const handleCourseChange = (value: string) => {
    setCourseId(value);
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Certificados emitidos"
        description="Consulta y descarga los certificados emitidos en la plataforma."
        actions={
          <div className="w-56">
            <Select
              aria-label="Filtrar por curso"
              placeholder="Todos los cursos"
              options={courseOptions}
              value={courseId}
              onChange={(event) => handleCourseChange(event.target.value)}
            />
          </div>
        }
      />

      {download.isError && (
        <Alert tone="error">{getApiErrorMessage(download.error)}</Alert>
      )}

      {isError ? (
        <Alert tone="error">{getApiErrorMessage(error)}</Alert>
      ) : isLoading ? (
        <PageLoader />
      ) : !data || data.items.length === 0 ? (
        <Card>
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            No hay certificados para los filtros seleccionados.
          </p>
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Estudiante</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Curso</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Código</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Nota final</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Emitido</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((certificate) => (
                  <tr key={certificate.id}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {certificate.student_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {certificate.course_title}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {certificate.code}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {certificate.final_score.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatDate(certificate.issued_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!certificate.pdf_available || download.isPending}
                        onClick={() => download.mutate(certificate)}
                      >
                        Descargar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className={isFetching ? "opacity-60" : undefined}>
            <Pagination
              page={data.page}
              pages={data.pages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </section>
  );
}
