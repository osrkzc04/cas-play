import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { lessonService } from "../services/lessonService";
import type { LessonPayload } from "../types";

export const lessonKeys = {
  all: ["lessons"] as const,
  list: (moduleId: string) => [...lessonKeys.all, "list", moduleId] as const,
};

export function useLessons(moduleId: string) {
  return useQuery({
    queryKey: lessonKeys.list(moduleId),
    queryFn: () => lessonService.list(moduleId),
    enabled: Boolean(moduleId),
  });
}

export function useCreateLesson(moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LessonPayload) =>
      lessonService.create(moduleId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: lessonKeys.list(moduleId) }),
  });
}

export function useUpdateLesson(moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LessonPayload }) =>
      lessonService.update(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: lessonKeys.list(moduleId) }),
  });
}

export function useDeleteLesson(moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lessonService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: lessonKeys.list(moduleId) }),
  });
}

export function useReorderLessons(moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonIds: string[]) =>
      lessonService.reorder(moduleId, lessonIds),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: lessonKeys.list(moduleId) }),
  });
}

export function useVideoMutation(moduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      file,
      onProgress,
    }: {
      lessonId: string;
      file: File | null;
      onProgress?: (percent: number) => void;
    }) =>
      file
        ? lessonService.uploadVideo(lessonId, file, onProgress)
        : lessonService.deleteVideo(lessonId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: lessonKeys.list(moduleId) }),
  });
}
