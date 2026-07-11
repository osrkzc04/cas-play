import { useState } from "react";

import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader } from "@/shared/components/PageLoader";
import { Pagination } from "@/shared/components/Pagination";
import { Alert } from "@/shared/components/Alert";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { CourseCard } from "../components/CourseCard";
import { useCoursesCatalog } from "../hooks/useCourses";

const PAGE_SIZE = 12;

export function CatalogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useCoursesCatalog(
    page,
    PAGE_SIZE,
  );

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Explora nuestros cursos
        </h1>
        <p className="text-gray-500">
          Aprende gastronomía a tu ritmo con clases en video impartidas por
          nuestros instructores.
        </p>
      </header>

      {isLoading && <PageLoader />}

      {isError && <Alert tone="error">{getApiErrorMessage(error)}</Alert>}

      {data && data.items.length === 0 && (
        <EmptyState
          title="Aún no hay cursos publicados"
          description="Vuelve pronto para descubrir nuevos cursos."
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <Pagination
            page={data.page}
            pages={data.pages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
