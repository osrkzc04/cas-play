import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Alert } from "@/shared/components/Alert";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader } from "@/shared/components/PageLoader";
import { getApiErrorMessage } from "@/shared/lib/errors";
import {
  useRoles,
  useSetUserActive,
  useUsers,
} from "../hooks/useUsers";

const PAGE_SIZE = 10;

export function UsersListPage() {
  const [page, setPage] = useState(1);
  const skip = (page - 1) * PAGE_SIZE;

  const { data: users, isLoading, isError, error } = useUsers(skip, PAGE_SIZE);
  const { data: roles } = useRoles();
  const setActive = useSetUserActive();

  const roleNameById = useMemo(() => {
    const map = new Map<string, string>();
    roles?.forEach((role) => map.set(role.id, role.name));
    return map;
  }, [roles]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500">
            Administra las cuentas y roles de la plataforma.
          </p>
        </div>
        <Link to="/dashboard/users/new">
          <Button>Nuevo usuario</Button>
        </Link>
      </header>

      {setActive.isError && (
        <Alert tone="error">{getApiErrorMessage(setActive.error)}</Alert>
      )}

      {isLoading && <PageLoader />}

      {isError && <Alert tone="error">{getApiErrorMessage(error)}</Alert>}

      {users && users.length === 0 && (
        <EmptyState title="No hay usuarios para mostrar" />
      )}

      {users && users.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {roleNameById.get(user.role_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={user.is_active ? "success" : "danger"}>
                      {user.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`/dashboard/users/${user.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant={user.is_active ? "danger" : "secondary"}
                        size="sm"
                        isLoading={
                          setActive.isPending &&
                          setActive.variables?.id === user.id
                        }
                        onClick={() =>
                          setActive.mutate({
                            id: user.id,
                            is_active: !user.is_active,
                          })
                        }
                      >
                        {user.is_active ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <nav className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Anterior
        </Button>
        <span className="text-sm text-slate-600">Página {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!users || users.length < PAGE_SIZE}
          onClick={() => setPage((current) => current + 1)}
        >
          Siguiente
        </Button>
      </nav>
    </section>
  );
}
