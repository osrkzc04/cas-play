import { Link } from "react-router-dom";
import { Users } from "lucide-react";

import { Badge } from "@/shared/components/Badge";
import { Card } from "@/shared/components/Card";
import { StarRating } from "@/shared/components";
import { courseLevelLabels } from "../courseLevel";
import type { CourseCatalogItem } from "../types";

export function CourseCard({ course }: { course: CourseCatalogItem }) {
  const preview = course.summary ?? course.description;
  const hasRatings = course.rating_count > 0;

  return (
    <Link to={`/courses/${course.id}`} className="group">
      <Card className="flex h-full flex-col overflow-hidden transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-elevated">
        {course.cover_image_url ? (
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="h-32 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-32 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300 text-4xl font-bold text-brand-700">
            {course.title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {course.level && (
            <Badge tone="gold" className="self-start">
              {courseLevelLabels[course.level]}
            </Badge>
          )}
          <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-brand-700">
            {course.title}
          </h3>
          {course.instructor_name && (
            <p className="text-xs text-gray-500">Por {course.instructor_name}</p>
          )}
          <p className="line-clamp-2 flex-1 text-sm text-gray-500">
            {preview ?? "Sin descripción disponible."}
          </p>

          {/* Resumen de valoraciones: estrellas + promedio + número de reseñas. */}
          <div className="flex items-center gap-1.5">
            {hasRatings ? (
              <>
                <span className="text-sm font-semibold text-gray-800">
                  {course.rating_average?.toFixed(1)}
                </span>
                <StarRating value={course.rating_average ?? 0} size="sm" />
                <span className="text-xs text-gray-400">
                  ({course.rating_count})
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">Sin valoraciones aún</span>
            )}
          </div>

          <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {course.enrolled_count}{" "}
              {course.enrolled_count === 1 ? "inscrito" : "inscritos"}
            </span>
            {course.duration_hours != null && (
              <span className="font-medium">
                {course.duration_hours} h de contenido
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
