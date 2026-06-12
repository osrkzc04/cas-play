import { Link } from "react-router-dom";

import { Card } from "@/shared/components/Card";
import type { Course } from "../types";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link to={`/courses/${course.id}`} className="group">
      <Card className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="flex h-32 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300 text-4xl font-bold text-brand-700">
          {course.title.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">
            {course.title}
          </h3>
          <p className="line-clamp-3 flex-1 text-sm text-slate-500">
            {course.description ?? "Sin descripción disponible."}
          </p>
        </div>
      </Card>
    </Link>
  );
}
