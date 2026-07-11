import { Award, BookOpen, FileEdit, Layers, Star } from "lucide-react";

import {
  Alert,
  Card,
  PageLoader,
  StarRating,
  StatCard,
  StatusBadge,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useInstructorMetrics } from "../hooks/useMetrics";

export function InstructorDashboard() {
  const { data, isLoading, isError, error } = useInstructorMetrics();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !data) {
    return <Alert tone="error">{getApiErrorMessage(error)}</Alert>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Cursos publicados"
          value={data.courses.published}
          icon={BookOpen}
          hint={`${data.courses.total} en total`}
        />
        <StatCard
          label="Borradores"
          value={data.courses.draft}
          icon={FileEdit}
        />
        <StatCard
          label="Matrículas"
          value={data.enrollments_total}
          icon={Layers}
        />
        <StatCard
          label="Certificados"
          value={data.certificates_total}
          icon={Award}
          accent="gold"
        />
        <StatCard
          label="Valoraciones"
          value={data.ratings_total}
          icon={Star}
        />
        <StatCard
          label="Promedio"
          value={data.average_rating === null ? "—" : data.average_rating.toFixed(1)}
          icon={Star}
          accent="gold"
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold tracking-tightish text-gray-900">
          Mis cursos
        </h2>
        <Card className="overflow-x-auto p-0">
          {data.courses_breakdown.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              Aún no has creado cursos.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Curso</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Matrículas</th>
                  <th className="px-4 py-3 font-semibold">Certificados</th>
                  <th className="px-4 py-3 font-semibold">Valoración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.courses_breakdown.map((course) => (
                  <tr
                    key={course.course_id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {course.title}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {course.enrollments}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {course.certificates}
                    </td>
                    <td className="px-4 py-3">
                      {course.average_rating === null ? (
                        <span className="text-gray-400">
                          Sin valoraciones
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <StarRating value={course.average_rating} size="sm" />
                          <span className="text-gray-600">
                            {course.average_rating.toFixed(1)} ·{" "}
                            {course.ratings_count}
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </div>
  );
}
