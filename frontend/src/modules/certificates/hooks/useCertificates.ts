import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { Role } from "@/shared/auth/types";
import { certificateService } from "../services/certificateService";
import type { Certificate } from "../types";

export const certificateKeys = {
  all: ["certificates"] as const,
  mine: (page: number, size: number) =>
    [...certificateKeys.all, "mine", page, size] as const,
  eligibility: (courseId: string) =>
    [...certificateKeys.all, "eligibility", courseId] as const,
  admin: (page: number, size: number, courseId?: string) =>
    [...certificateKeys.all, "admin", page, size, courseId ?? null] as const,
};

// La elegibilidad solo aplica a estudiantes matriculados.
export function useCertificateEligibility(
  courseId: string | undefined,
  role: Role | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: certificateKeys.eligibility(courseId ?? ""),
    queryFn: () => certificateService.getEligibility(courseId as string),
    enabled: Boolean(courseId) && role === "STUDENT" && enabled,
  });
}

export function useMyCertificates(page: number, size: number) {
  return useQuery({
    queryKey: certificateKeys.mine(page, size),
    queryFn: () => certificateService.getMine({ page, size }),
  });
}

export function useIssueCertificate(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => certificateService.issue(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}

export function useDownloadCertificate() {
  return useMutation({
    mutationFn: (certificate: Certificate) =>
      certificateService.download(certificate),
  });
}

export function useAdminCertificates(
  page: number,
  size: number,
  courseId?: string,
) {
  return useQuery({
    queryKey: certificateKeys.admin(page, size, courseId),
    queryFn: () =>
      certificateService.listAll({ page, size, course_id: courseId }),
    placeholderData: keepPreviousData,
  });
}

export function useDownloadAdminCertificate() {
  return useMutation({
    mutationFn: (certificate: Certificate) =>
      certificateService.downloadAsAdmin(certificate),
  });
}
