import { useState } from "react";
import { Link } from "react-router-dom";
import {
  EyeOff,
  Flag,
  Layers,
  Pencil,
  Send,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { DropdownMenu } from "@/shared/components/DropdownMenu";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader } from "@/shared/components/PageLoader";
import { Pagination } from "@/shared/components/Pagination";
import { Select } from "@/shared/components/Select";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { formatDate } from "@/shared/lib/format";
import { CourseStatusBadge } from "../components/CourseStatusBadge";
import { courseStatusOptions } from "../courseStatus";
import {
  useCourseStatusMutation,
  useManagedCourses,
} from "../hooks/useCourses";
import type { CourseStatus, CourseStatusAction } from "../types";

const PAGE_SIZE = 10;

const statusActionIcons: Record<CourseStatusAction, LucideIcon> = {
  publish: Send,
  hide: EyeOff,
  finish: Flag,
};

const actionsByStatus: Record<
  CourseStatus,
  { action: CourseStatusAction; label: string }[]
> = {
  DRAFT: [{ action: "publish", label: "Publicar" }],
  PUBLISHED: [
    { action: "hide", label: "Ocultar" },
    { action: "finish", label: "Finalizar" },
  ],
  HIDDEN: [
    { action: "publish", label: "Publicar" },
    { action: "finish", label: "Finalizar" },
  ],
  FINISHED: [],
};

export function ManageCoursesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CourseStatus | "">("");

  const { data, isLoading, isError, error } = useManagedCourses(
    page,
    PAGE_SIZE,
    status || undefined,
  );
  const statusMutation = useCourseStatusMutation();

  const handleStatusChange = (value: string) => {
    setStatus(value as CourseStatus | "");
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de cursos
          </h1>
          <p className="text-sm text-gray-500">
            Crea, edita y administra el estado de tus cursos.
          </p>
        </div>
        <Link to="/dashboard/courses/new">
          <Button>Nuevo curso</Button>
        </Link>
      </header>

      <div className="max-w-xs">
        <Select
          label="Filtrar por estado"
          placeholder="Todos los estados"
          options={courseStatusOptions}
          value={status}
          onChange={(event) => handleStatusChange(event.target.value)}
        />
      </div>

      {statusMutation.isError && (
        <Alert tone="error">{getApiErrorMessage(statusMutation.error)}</Alert>
      )}

      {isLoading && <PageLoader />}

      {isError && <Alert tone="error">{getApiErrorMessage(error)}</Alert>}

      {data && data.items.length === 0 && (
        <EmptyState
          title="No hay cursos para mostrar"
          description="Crea tu primer curso para comenzar."
        />
      )}

      {data && data.items.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Actualizado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((course) => (
                <tr
                  key={course.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {course.title}
                  </td>
                  <td className="px-4 py-3">
                    <CourseStatusBadge status={course.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(course.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <DropdownMenu
                        items={[
                          {
                            key: "content",
                            label: "Contenido",
                            icon: Layers,
                            to: `/dashboard/courses/${course.id}/content`,
                          },
                          {
                            key: "students",
                            label: "Estudiantes",
                            icon: Users,
                            to: `/dashboard/courses/${course.id}/students`,
                          },
                          {
                            key: "edit",
                            label: "Editar",
                            icon: Pencil,
                            to: `/dashboard/courses/${course.id}/edit`,
                          },
                          ...actionsByStatus[course.status].map(
                            ({ action, label }) => ({
                              key: action,
                              label,
                              icon: statusActionIcons[action],
                              loading:
                                statusMutation.isPending &&
                                statusMutation.variables?.id === course.id &&
                                statusMutation.variables?.action === action,
                              onSelect: () =>
                                statusMutation.mutate({ id: course.id, action }),
                            }),
                          ),
                        ]}
                      />
                    </div>
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
