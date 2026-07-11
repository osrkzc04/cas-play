import { useQuery } from "@tanstack/react-query";

import { curriculumService } from "../services/curriculumService";

export const curriculumKeys = {
  all: ["curriculum"] as const,
  byCourse: (courseId: string) =>
    [...curriculumKeys.all, courseId] as const,
};

// El temario solo es accesible para gestores o estudiantes matriculados (BR-016);
// por eso se habilita explícitamente con `enabled`.
export function useCurriculum(courseId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: curriculumKeys.byCourse(courseId ?? ""),
    queryFn: () => curriculumService.getByCourse(courseId as string),
    enabled: Boolean(courseId) && enabled,
  });
}
