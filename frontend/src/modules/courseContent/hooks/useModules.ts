import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { moduleService } from "../services/moduleService";
import type { ModulePayload } from "../types";

export const moduleKeys = {
  all: ["modules"] as const,
  list: (courseId: string) => [...moduleKeys.all, "list", courseId] as const,
};

export function useModules(courseId: string) {
  return useQuery({
    queryKey: moduleKeys.list(courseId),
    queryFn: () => moduleService.list(courseId),
    enabled: Boolean(courseId),
  });
}

export function useCreateModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ModulePayload) =>
      moduleService.create(courseId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) }),
  });
}

export function useUpdateModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModulePayload }) =>
      moduleService.update(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) }),
  });
}

export function useDeleteModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moduleService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) }),
  });
}

export function useReorderModules(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleIds: string[]) =>
      moduleService.reorder(courseId, moduleIds),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: moduleKeys.list(courseId) }),
  });
}
