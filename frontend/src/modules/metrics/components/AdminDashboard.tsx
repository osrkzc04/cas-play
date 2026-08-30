import { Award, BookOpen, GraduationCap, Layers, UserCog, Users } from "lucide-react";

import {
  Alert,
  Card,
  PageLoader,
  StarRating,
  StatCard,
  StatusBadge,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useAdminMetrics } from "../hooks/useMetrics";

export function AdminDashboard() {
  const { data, isLoading, isError, error } = useAdminMetrics();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !data) {
    return <Alert tone="error">{getApiErrorMessage(error)}</Alert>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Usuarios" value={data.users.total} icon={Users} />
        <StatCard
          label="Instructores"
          value={data.users.instructors}
          icon={UserCog}
        />
        <StatCard
          label="Estudiantes"
          value={data.users.students}
          icon={GraduationCap}
        />
        <StatCard
          label="Cursos publicados"
          value={data.courses.published}
          icon={BookOpen}
          hint={`${data.courses.total} en total`}
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
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold tracking-tightish text-gray-900">
          Top cursos por matrículas
        </h2>
        <Card className="overflow-x-auto p-0">
          {data.top_courses.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              Aún no hay cursos con matrículas.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Curso</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Matrículas</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Certificados</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Valoración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.top_courses.map((course) => (
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
                        <span className="text-gray-400">Sin valoraciones</span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <StarRating value={course.average_rating} size="sm" />
                          <span className="text-gray-600">
                            {course.average_rating.toFixed(1)}
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
