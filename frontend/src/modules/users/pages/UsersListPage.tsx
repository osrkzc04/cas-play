import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Pencil, Power, PowerOff } from "lucide-react";

import { Alert } from "@/shared/components/Alert";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DropdownMenu } from "@/shared/components/DropdownMenu";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader } from "@/shared/components/PageLoader";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { getRoleLabel } from "@/shared/auth/roles";
import {
  useResetUserPassword,
  useRoles,
  useSetUserActive,
  useUsers,
} from "../hooks/useUsers";

const PAGE_SIZE = 10;

export function UsersListPage() {
  const [page, setPage] = useState(1);
  // Desactivar una cuenta es irreversible desde la UI del estudiante, así que
  // se confirma; activar no necesita confirmación.
  const [toDeactivate, setToDeactivate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [toReset, setToReset] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const skip = (page - 1) * PAGE_SIZE;

  const { data: users, isLoading, isError, error } = useUsers(skip, PAGE_SIZE);
  const { data: roles } = useRoles();
  const setActive = useSetUserActive();
  const resetPassword = useResetUserPassword();

  const roleNameById = useMemo(() => {
    const map = new Map<string, string>();
    roles?.forEach((role) => map.set(role.id, getRoleLabel(role.name)));
    return map;
  }, [roles]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500">
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

      {resetPassword.isError && (
        <Alert tone="error">{getApiErrorMessage(resetPassword.error)}</Alert>
      )}

      {resetMessage && <Alert tone="success">{resetMessage}</Alert>}

      {isLoading && <PageLoader />}

      {isError && <Alert tone="error">{getApiErrorMessage(error)}</Alert>}

      {users && users.length === 0 && (
        <EmptyState title="No hay usuarios para mostrar" />
      )}

      {users && users.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Nombre</th>
                <th scope="col" className="px-4 py-3 font-semibold">Correo</th>
                <th scope="col" className="px-4 py-3 font-semibold">Rol</th>
                <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {roleNameById.get(user.role_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={user.is_active ? "success" : "danger"}>
                      {user.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <DropdownMenu
                        items={[
                          {
                            key: "edit",
                            label: "Editar",
                            icon: Pencil,
                            to: `/dashboard/users/${user.id}/edit`,
                          },
                          {
                            key: "reset-password",
                            label: "Restablecer contraseña",
                            icon: KeyRound,
                            loading:
                              resetPassword.isPending &&
                              resetPassword.variables === user.id,
                            onSelect: () =>
                              setToReset({
                                id: user.id,
                                name: `${user.first_name} ${user.last_name}`,
                              }),
                          },
                          {
                            key: "toggle",
                            label: user.is_active ? "Desactivar" : "Activar",
                            icon: user.is_active ? PowerOff : Power,
                            tone: user.is_active ? "danger" : "default",
                            loading:
                              setActive.isPending &&
                              setActive.variables?.id === user.id,
                            onSelect: () =>
                              user.is_active
                                ? setToDeactivate({
                                    id: user.id,
                                    name: `${user.first_name} ${user.last_name}`,
                                  })
                                : setActive.mutate({
                                    id: user.id,
                                    is_active: true,
                                  }),
                          },
                        ]}
                      />
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
        <span className="text-sm text-gray-600">Página {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!users || users.length < PAGE_SIZE}
          onClick={() => setPage((current) => current + 1)}
        >
          Siguiente
        </Button>
      </nav>

      <ConfirmDialog
        open={toDeactivate !== null}
        title="Desactivar usuario"
        message={`¿Desactivar la cuenta de ${toDeactivate?.name}? No podrá iniciar sesión hasta que se reactive.`}
        confirmLabel="Desactivar"
        isLoading={setActive.isPending}
        onConfirm={() => {
          if (toDeactivate) {
            setActive.mutate(
              { id: toDeactivate.id, is_active: false },
              { onSuccess: () => setToDeactivate(null) },
            );
          }
        }}
        onClose={() => setToDeactivate(null)}
      />

      <ConfirmDialog
        open={toReset !== null}
        title="Restablecer contraseña"
        message={`Se generará una contraseña temporal para ${toReset?.name}, se enviará a su correo y deberá cambiarla en el próximo ingreso. Sus sesiones activas se cerrarán. ¿Continuar?`}
        confirmLabel="Restablecer"
        isLoading={resetPassword.isPending}
        onConfirm={() => {
          if (toReset) {
            const name = toReset.name;
            resetPassword.mutate(toReset.id, {
              onSuccess: () => {
                setResetMessage(
                  `Contraseña de ${name} restablecida. Se envió un correo con las credenciales temporales.`,
                );
                setToReset(null);
              },
            });
          }
        }}
        onClose={() => setToReset(null)}
      />
    </section>
  );
}
