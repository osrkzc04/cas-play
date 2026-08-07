import { Alert } from "@/shared/components/Alert";
import { Card } from "@/shared/components/Card";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageLoader } from "@/shared/components/PageLoader";
import { useAuth } from "@/shared/auth/useAuth";
import { getInitials } from "@/shared/auth/roles";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { ProfileForm } from "../components/ProfileForm";
import { ProfilePhotoUploader } from "../components/ProfilePhotoUploader";
import {
  useOwnInstructorProfile,
  useRemoveInstructorPhoto,
  useUpdateInstructorProfile,
  useUploadInstructorPhoto,
} from "../hooks/useInstructorProfile";
import type { InstructorProfileFormValues } from "../schemas/profileSchemas";

// Convierte cadenas vacías del formulario en null para no persistir campos vacíos.
function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function InstructorProfilePage() {
  const { user } = useAuth();
  const profileQuery = useOwnInstructorProfile();
  const updateProfile = useUpdateInstructorProfile();
  const uploadPhoto = useUploadInstructorPhoto();
  const removePhoto = useRemoveInstructorPhoto();

  if (profileQuery.isLoading) {
    return <PageLoader />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <Alert tone="error">{getApiErrorMessage(profileQuery.error)}</Alert>;
  }

  const profile = profileQuery.data;
  const initials = user ? getInitials(user.first_name, user.last_name) : "";

  const handleSubmit = (values: InstructorProfileFormValues) => {
    updateProfile.mutate({
      headline: emptyToNull(values.headline),
      specialty: emptyToNull(values.specialty),
      about_me: emptyToNull(values.about_me),
      social_links: {
        linkedin: emptyToNull(values.linkedin),
        instagram: emptyToNull(values.instagram),
        youtube: emptyToNull(values.youtube),
      },
    });
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Mi perfil"
        title="Perfil de instructor"
        description="Esta información se muestra a los estudiantes en la página de tus cursos."
      />

      {updateProfile.isError && (
        <Alert tone="error">{getApiErrorMessage(updateProfile.error)}</Alert>
      )}
      {updateProfile.isSuccess && (
        <Alert tone="success">Perfil actualizado correctamente.</Alert>
      )}
      {(uploadPhoto.isError || removePhoto.isError) && (
        <Alert tone="error">
          {getApiErrorMessage(uploadPhoto.error ?? removePhoto.error)}
        </Alert>
      )}

      <Card className="space-y-6 p-6">
        <ProfilePhotoUploader
          photoUrl={profile.photo_url}
          initials={initials}
          isUploading={uploadPhoto.isPending}
          isRemoving={removePhoto.isPending}
          onSelectFile={(file) => uploadPhoto.mutate(file)}
          onRemove={() => removePhoto.mutate()}
        />

        <div className="border-t border-gray-100 pt-6">
          <ProfileForm
            defaultValues={{
              headline: profile.headline ?? "",
              specialty: profile.specialty ?? "",
              about_me: profile.about_me ?? "",
              linkedin: profile.social_links?.linkedin ?? "",
              instagram: profile.social_links?.instagram ?? "",
              youtube: profile.social_links?.youtube ?? "",
            }}
            isSubmitting={updateProfile.isPending}
            onSubmit={handleSubmit}
          />
        </div>
      </Card>
    </section>
  );
}
