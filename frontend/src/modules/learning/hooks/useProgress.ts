import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { progressService } from "../services/progressService";

export const progressKeys = {
  all: ["progress"] as const,
  course: (courseId: string) => [...progressKeys.all, "course", courseId] as const,
};

export function useCourseProgress(courseId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: progressKeys.course(courseId ?? ""),
    queryFn: () => progressService.getCourseProgress(courseId as string),
    enabled: Boolean(courseId) && enabled,
  });
}

export function useSaveLastSecond() {
  return useMutation({
    mutationFn: ({
      lessonId,
      lastSecond,
    }: {
      lessonId: string;
      lastSecond: number;
    }) => progressService.saveLastSecond(lessonId, lastSecond),
  });
}

export function useCompleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => progressService.completeLesson(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.course(courseId) });
    },
  });
}
