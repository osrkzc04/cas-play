import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageLoader } from "@/shared/components/PageLoader";
import { Pagination } from "@/shared/components/Pagination";
import { ProgressBar } from "@/shared/components/ProgressBar";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { formatDate } from "@/shared/lib/format";
import { useCourseStudents, useManagedCourse } from "../hooks/useCourses";

const PAGE_SIZE = 10;

export function CourseStudentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ?? "";
  const [page, setPage] = useState(1);

  const courseQuery = useManagedCourse(id);
  const { data, isLoading, isError, error } = useCourseStudents(
    id,
    page,
    PAGE_SIZE,
  );

  const items = data?.items ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Estudiantes inscritos"
        title={courseQuery.data?.title ?? "Curso"}
        description="Revisa quiénes están inscritos y su avance en el curso."
        actions={
          <Link to="/dashboard/courses">
            <Button variant="secondary">Volver</Button>
          </Link>
        }
      />

      {isLoading && <PageLoader />}

      {isError && <Alert tone="error">{getApiErrorMessage(error)}</Alert>}

      {data && items.length === 0 && (
        <EmptyState
          title="Aún no hay estudiantes inscritos"
          description="Cuando se inscriban estudiantes, aparecerán aquí con su avance."
        />
      )}

      {items.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Estudiante</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Inscrito el</th>
                <th className="px-4 py-3 font-semibold">Clases</th>
                <th className="w-56 px-4 py-3 font-semibold">Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((student) => (
                <tr
                  key={student.user_id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{student.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(student.enrolled_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">
                    {student.completed_lessons}/{student.total_lessons}
                  </td>
                  <td className="px-4 py-3">
                    <ProgressBar value={student.progress_percentage} showValue />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {data && (
        <Pagination page={data.page} pages={data.pages} onPageChange={setPage} />
      )}
    </section>
  );
}
