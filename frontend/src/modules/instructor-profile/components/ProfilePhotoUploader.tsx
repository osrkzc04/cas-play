import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { Avatar } from "@/shared/components/Avatar";
import { Button } from "@/shared/components/Button";
import { FieldError } from "@/shared/components/FieldError";

const MAX_PHOTO_MB = 2;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProfilePhotoUploaderProps {
  photoUrl: string | null;
  initials: string;
  isUploading?: boolean;
  isRemoving?: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}

export function ProfilePhotoUploader({
  photoUrl,
  initials,
  isUploading = false,
  isRemoving = false,
  onSelectFile,
  onRemove,
}: ProfilePhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato no permitido. Usa JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setError(`La imagen supera ${MAX_PHOTO_MB} MB.`);
      return;
    }
    onSelectFile(file);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar
        initials={initials}
        imageUrl={photoUrl ?? undefined}
        size="lg"
        className="h-24 w-24 text-2xl"
      />
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0] ?? null);
            // Permite volver a elegir el mismo archivo tras un error.
            event.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            isLoading={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
            {photoUrl ? "Cambiar foto" : "Subir foto"}
          </Button>
          {photoUrl && (
            <Button
              type="button"
              variant="ghost"
              isLoading={isRemoving}
              onClick={onRemove}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Quitar
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-400">
          JPG, PNG o WEBP · máx. {MAX_PHOTO_MB} MB
        </p>
        <FieldError message={error ?? undefined} />
      </div>
    </div>
  );
}
