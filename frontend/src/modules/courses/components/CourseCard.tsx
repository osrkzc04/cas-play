import { Link } from "react-router-dom";

import { Badge } from "@/shared/components/Badge";
import { Card } from "@/shared/components/Card";
import { courseLevelLabels } from "../courseLevel";
import type { Course } from "../types";

export function CourseCard({ course }: { course: Course }) {
  const preview = course.summary ?? course.description;

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
          <p className="line-clamp-3 flex-1 text-sm text-gray-500">
            {preview ?? "Sin descripción disponible."}
          </p>
          {course.duration_hours != null && (
            <span className="text-xs font-medium text-gray-400">
              {course.duration_hours} h de contenido
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
