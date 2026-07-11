import { useState } from "react";

import {
  Alert,
  EmptyState,
  PageHeader,
  Pagination,
  Spinner,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { CourseCard } from "@/modules/courses/components/CourseCard";
import { useMyEnrollments } from "../hooks/useEnrollments";

const PAGE_SIZE = 12;

export function MyCoursesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useMyEnrollments(page, PAGE_SIZE);

  const enrollments = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis cursos"
        description="Continúa aprendiendo desde donde lo dejaste."
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Alert tone="error">{getApiErrorMessage(error)}</Alert>
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="Todavía no te has inscrito en ningún curso"
          description="Explora el catálogo y comienza tu primer curso."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <CourseCard key={enrollment.id} course={enrollment.course} />
            ))}
          </div>
          {data && (
            <Pagination
              page={page}
              pages={data.pages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
