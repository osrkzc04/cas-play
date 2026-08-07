import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { instructorProfileService } from "../services/instructorProfileService";
import type { UpdateInstructorProfilePayload } from "../types";

export const instructorProfileKeys = {
  own: ["instructor", "profile"] as const,
};

export function useOwnInstructorProfile() {
  return useQuery({
    queryKey: instructorProfileKeys.own,
    queryFn: () => instructorProfileService.getOwn(),
  });
}

export function useUpdateInstructorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateInstructorProfilePayload) =>
      instructorProfileService.update(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(instructorProfileKeys.own, data);
    },
  });
}

export function useUploadInstructorPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => instructorProfileService.uploadPhoto(file),
    onSuccess: (data) => {
      queryClient.setQueryData(instructorProfileKeys.own, data);
    },
  });
}

export function useRemoveInstructorPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => instructorProfileService.removePhoto(),
    onSuccess: (data) => {
      queryClient.setQueryData(instructorProfileKeys.own, data);
    },
  });
}
