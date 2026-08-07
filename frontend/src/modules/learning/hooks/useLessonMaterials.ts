import { useEffect, useState } from "react";
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

interface MaterialPreview {
  url: string | null;
  isLoading: boolean;
  isError: boolean;
}

// Genera un object URL para previsualizar el material inline y lo revoca al
// cambiar de material o desmontar, evitando fugas de memoria.
export function useMaterialPreviewUrl(
  material: Material | undefined,
): MaterialPreview {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(material));
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!material) {
      setUrl(null);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);

    lessonMaterialService
      .fetchBlob(material)
      .then((blob) => {
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setIsError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [material]);

  return { url, isLoading, isError };
}
