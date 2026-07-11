import { useMutation, useQuery } from "@tanstack/react-query";

import type { Material } from "@/modules/courseContent/types";
import { lessonMaterialService } from "../services/lessonMaterialService";

export const lessonMaterialKeys = {
  all: ["lesson-materials"] as const,
  byLesson: (lessonId: string) =>
    [...lessonMaterialKeys.all, lessonId] as const,
};

export function useLessonMaterials(lessonId: string | undefined) {
  return useQuery({
    queryKey: lessonMaterialKeys.byLesson(lessonId ?? ""),
    queryFn: () => lessonMaterialService.list(lessonId as string),
    enabled: Boolean(lessonId),
  });
}

export function useDownloadMaterial() {
  return useMutation({
    mutationFn: (material: Material) =>
      lessonMaterialService.download(material),
  });
}
