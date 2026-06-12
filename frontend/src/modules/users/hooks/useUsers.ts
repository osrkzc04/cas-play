import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { userService } from "../services/userService";
import type { CreateUserPayload, UpdateUserPayload } from "../types";

export const userKeys = {
  all: ["users"] as const,
  list: (skip: number, limit: number) =>
    [...userKeys.all, "list", skip, limit] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
  roles: ["users", "roles"] as const,
};

export function useUsers(skip: number, limit: number) {
  return useQuery({
    queryKey: userKeys.list(skip, limit),
    queryFn: () => userService.list({ skip, limit }),
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: () => userService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: userKeys.roles,
    queryFn: () => userService.getRoles(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => userService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

// Row-level mutation used by the list to toggle status without binding a hook
// per user row.
export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      userService.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
