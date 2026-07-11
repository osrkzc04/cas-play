import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { auditService, type AuditLogParams } from "../services/auditService";

export const auditKeys = {
  all: ["audit"] as const,
  logs: (params: AuditLogParams) =>
    [...auditKeys.all, "logs", params] as const,
};

export function useAuditLogs(params: AuditLogParams) {
  return useQuery({
    queryKey: auditKeys.logs(params),
    queryFn: () => auditService.listLogs(params),
    placeholderData: keepPreviousData,
  });
}
