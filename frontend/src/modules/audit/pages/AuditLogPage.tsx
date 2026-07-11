import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Alert,
  Badge,
  Card,
  PageHeader,
  PageLoader,
  Pagination,
  Select,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { formatDate } from "@/shared/lib/format";
import { userService } from "@/modules/users/services/userService";
import { useAuditLogs } from "../hooks/useAudit";
import {
  auditActionLabels,
  auditActionOptions,
  auditActionTone,
} from "../constants";
import type { AuditAction } from "../types";

const PAGE_SIZE = 20;

export function AuditLogPage() {
  const [action, setAction] = useState<AuditAction | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useAuditLogs({
    action: action || undefined,
    page,
    size: PAGE_SIZE,
  });

  // El log solo guarda actor_id; resolvemos el nombre con la lista de usuarios
  // (el admin ya tiene acceso) para mostrar algo legible en vez del UUID.
  const usersQuery = useQuery({
    queryKey: ["users", "audit-actors"],
    queryFn: () => userService.list({ skip: 0, limit: 100 }),
  });

  const actorNames = useMemo(() => {
    const map = new Map<string, string>();
    usersQuery.data?.forEach((user) => {
      map.set(user.id, `${user.first_name} ${user.last_name}`);
    });
    return map;
  }, [usersQuery.data]);

  const handleActionChange = (value: string) => {
    setAction(value as AuditAction | "");
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Bitácora de auditoría"
        description="Registro de eventos relevantes del sistema."
        actions={
          <div className="w-56">
            <Select
              aria-label="Filtrar por acción"
              placeholder="Todas las acciones"
              options={auditActionOptions}
              value={action}
              onChange={(event) => handleActionChange(event.target.value)}
            />
          </div>
        }
      />

      {isError ? (
        <Alert tone="error">{getApiErrorMessage(error)}</Alert>
      ) : isLoading ? (
        <PageLoader />
      ) : !data || data.items.length === 0 ? (
        <Card>
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            No hay eventos para los filtros seleccionados.
          </p>
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Acción</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Entidad</th>
                  <th className="px-4 py-3 font-semibold">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={auditActionTone[log.action]}>
                        {auditActionLabels[log.action]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.actor_id
                        ? (actorNames.get(log.actor_id) ??
                          `${log.actor_id.slice(0, 8)}…`)
                        : "Sistema"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {log.entity_type ?? "—"}
                    </td>
                    <td
                      className="max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-500"
                      title={log.details ? JSON.stringify(log.details) : undefined}
                    >
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className={isFetching ? "opacity-60" : undefined}>
            <Pagination
              page={data.page}
              pages={data.pages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </section>
  );
}
