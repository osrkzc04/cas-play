import { axiosClient } from "@/shared/api/axiosClient";
import { endpoints } from "@/shared/api/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type { AuditAction, AuditLog } from "../types";

export interface AuditLogParams {
  action?: AuditAction;
  actor_id?: string;
  page: number;
  size: number;
}

export const auditService = {
  async listLogs(params: AuditLogParams): Promise<Paginated<AuditLog>> {
    const { data } = await axiosClient.get<Paginated<AuditLog>>(
      endpoints.audit.logs,
      { params },
    );
    return data;
  },
};
