import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Alert,
  Avatar,
  Button,
  Card,
  Modal,
  PageHeader,
  PageLoader,
  Pagination,
  Select,
  StarRating,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { formatDate, getInitialsFromName } from "@/shared/lib/format";
import { courseService } from "@/modules/courses/services/courseService";
import { useAdminRatings, useDeleteRating } from "../hooks/useRatings";
import type { AdminRating } from "../types";

const PAGE_SIZE = 20;

export function AdminRatingsListPage() {
  const [courseId, setCourseId] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminRating | null>(null);

  const { data, isLoading, isError, error, isFetching } = useAdminRatings(
    page,
    PAGE_SIZE,
    courseId || undefined,
  );

  const deleteRating = useDeleteRating();

  // El admin gestiona cursos, así que reutilizamos el listado de gestión para
  // ofrecer el filtro por curso sin un endpoint adicional.
  const coursesQuery = useQuery({
    queryKey: ["courses", "manage", "rating-filter"],
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

  const handleConfirmDelete = () => {
    if (!target) {
      return;
    }
    deleteRating.mutate(target.id, {
      onSuccess: () => setTarget(null),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Moderación de reseñas"
        description="Revisa y elimina valoraciones inapropiadas de los cursos."
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

      {deleteRating.isError && (
        <Alert tone="error">{getApiErrorMessage(deleteRating.error)}</Alert>
      )}

      {isError ? (
        <Alert tone="error">{getApiErrorMessage(error)}</Alert>
      ) : isLoading ? (
        <PageLoader />
      ) : !data || data.items.length === 0 ? (
        <Card>
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            No hay reseñas para los filtros seleccionados.
          </p>
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Curso</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estudiante</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Calificación</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Comentario</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((rating) => (
                  <tr key={rating.id}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {rating.course_title}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          initials={getInitialsFromName(rating.student_name)}
                          size="sm"
                        />
                        <span className="text-gray-800">
                          {rating.student_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StarRating value={rating.score} size="sm" />
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      {rating.comment ? (
                        <span className="text-gray-700">{rating.comment}</span>
                      ) : (
                        <span className="italic text-gray-400">Sin comentario</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatDate(rating.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setTarget(rating)}
                      >
                        Eliminar
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

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title="Eliminar reseña"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setTarget(null)}
              disabled={deleteRating.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={deleteRating.isPending}
            >
              Eliminar
            </Button>
          </>
        }
      >
        Esta acción eliminará de forma permanente la reseña de{" "}
        <span className="font-semibold">{target?.student_name}</span> en el curso{" "}
        <span className="font-semibold">{target?.course_title}</span>. ¿Deseas
        continuar?
      </Modal>
    </section>
  );
}
