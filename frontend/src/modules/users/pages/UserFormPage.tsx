import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "@/shared/components/Alert";
import { Card } from "@/shared/components/Card";
import { PageLoader } from "@/shared/components/PageLoader";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { UserForm, type UserFormValues } from "../components/UserForm";
import {
  useCreateUser,
  useRoles,
  useUpdateUser,
  useUser,
} from "../hooks/useUsers";

export function UserFormPage() {
  const { userId } = useParams<{ userId: string }>();
  const isEdit = Boolean(userId);
  const navigate = useNavigate();

  const rolesQuery = useRoles();
  const userQuery = useUser(userId);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(userId ?? "");

  const mutation = isEdit ? updateUser : createUser;

  const handleSubmit = (values: UserFormValues) => {
    const onSuccess = () => navigate("/dashboard/users");

    if (isEdit) {
      updateUser.mutate(
        {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role_id: values.role_id,
          is_active: values.is_active,
        },
        { onSuccess },
      );
      return;
    }

    createUser.mutate(
      {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role_id: values.role_id,
      },
      { onSuccess },
    );
  };

  const isLoading =
    rolesQuery.isLoading || (isEdit && userQuery.isLoading);

  if (isLoading) {
    return <PageLoader />;
  }

  if (rolesQuery.isError) {
    return <Alert tone="error">{getApiErrorMessage(rolesQuery.error)}</Alert>;
  }

  if (isEdit && (userQuery.isError || !userQuery.data)) {
    return <Alert tone="error">{getApiErrorMessage(userQuery.error)}</Alert>;
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Editar usuario" : "Nuevo usuario"}
        </h1>
      </header>

      {mutation.isError && (
        <Alert tone="error">{getApiErrorMessage(mutation.error)}</Alert>
      )}

      <Card className="p-6">
        <UserForm
          mode={isEdit ? "edit" : "create"}
          roles={rolesQuery.data ?? []}
          defaultValues={
            userQuery.data
              ? {
                  first_name: userQuery.data.first_name,
                  last_name: userQuery.data.last_name,
                  email: userQuery.data.email,
                  role_id: userQuery.data.role_id,
                  is_active: userQuery.data.is_active,
                }
              : undefined
          }
          isSubmitting={mutation.isPending}
          onSubmit={handleSubmit}
        />
      </Card>
    </section>
  );
}
