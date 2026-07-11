import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { materialService } from "../services/materialService";
import { lessonKeys } from "./useLessons";

export const materialKeys = {
  all: ["materials"] as const,
  list: (lessonId: string) => [...materialKeys.all, "list", lessonId] as const,
};

export function useMaterials(lessonId: string, enabled = true) {
  return useQuery({
    queryKey: materialKeys.list(lessonId),
    queryFn: () => materialService.list(lessonId),
    enabled: enabled && Boolean(lessonId),
  });
}

// moduleId permite refrescar el conteo de materiales del listado de clases.
export function useUploadMaterial(lessonId: string, moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => materialService.upload(lessonId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.list(lessonId) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.list(moduleId) });
    },
  });
}

export function useDeleteMaterial(lessonId: string, moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (materialId: string) => materialService.remove(materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.list(lessonId) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.list(moduleId) });
    },
  });
}
