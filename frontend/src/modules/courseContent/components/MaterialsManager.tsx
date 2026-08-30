import { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  FileText,
  FileType,
  Image as ImageIcon,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Spinner,
} from "@/shared/components";
import { getApiErrorMessage } from "@/shared/lib/errors";
import {
  useDeleteMaterial,
  useMaterials,
  useUploadMaterial,
} from "../hooks/useMaterials";
import { materialService } from "../services/materialService";
import type { Material, MaterialType } from "../types";

const MAX_MB = 25;
const ACCEPT = ".pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

interface TypeStyle {
  icon: LucideIcon;
  iconClass: string;
  badge: "danger" | "success" | "info";
}

const TYPE_STYLES: Record<MaterialType, TypeStyle> = {
  PDF: { icon: FileText, iconClass: "text-brand-600", badge: "danger" },
  IMAGE: { icon: ImageIcon, iconClass: "text-green-600", badge: "success" },
  OFFICE: { icon: FileType, iconClass: "text-blue-600", badge: "info" },
};

interface MaterialsManagerProps {
  lessonId: string;
  moduleId: string;
}

function MaterialThumb({ material }: { material: Material }) {
  const style = TYPE_STYLES[material.material_type];
  const [thumb, setThumb] = useState<string | null>(null);

  // Solo las imágenes muestran miniatura; se descarga con auth como blob.
  useEffect(() => {
    if (material.material_type !== "IMAGE") {
      return;
    }
    let url: string | null = null;
    let active = true;
    materialService
      .getObjectUrl(material.id)
      .then((objectUrl) => {
        url = objectUrl;
        if (active) {
          setThumb(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [material.id, material.material_type]);

  if (thumb) {
    return (
      <img
        src={thumb}
        alt={material.original_name}
        className="h-10 w-10 shrink-0 rounded-md object-cover"
      />
    );
  }

  const Icon = style.icon;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-50">
      <Icon className={`h-5 w-5 ${style.iconClass}`} aria-hidden="true" />
    </span>
  );
}

export function MaterialsManager({ lessonId, moduleId }: MaterialsManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError, error } = useMaterials(lessonId);
  const upload = useUploadMaterial(lessonId, moduleId);
  const remove = useDeleteMaterial(lessonId, moduleId);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Material | null>(null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setSizeError(`El material supera el límite de ${MAX_MB} MB.`);
      return;
    }
    setSizeError(null);
    upload.mutate(file);
  };

  const handleOpen = async (material: Material) => {
    setOpeningId(material.id);
    try {
      await materialService.openInNewTab(material.id);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          PDF, imágenes u Office. Máximo {MAX_MB} MB. No se permiten ZIP/RAR.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Subir material
        </Button>
      </div>

      {sizeError && <Alert tone="error">{sizeError}</Alert>}
      {upload.isError && (
        <Alert tone="error">{getApiErrorMessage(upload.error)}</Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : isError ? (
        <Alert tone="error">{getApiErrorMessage(error)}</Alert>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin materiales"
          description="Sube material complementario para esta clase."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((material) => (
            <li
              key={material.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-card p-2 pr-3"
            >
              <MaterialThumb material={material} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-gray-800">
                  {material.original_name}
                </span>
                <Badge
                  tone={TYPE_STYLES[material.material_type].badge}
                  className="mt-0.5 self-start"
                >
                  {material.material_type}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={openingId === material.id}
                onClick={() => handleOpen(material)}
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                Abrir
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                aria-label={`Eliminar ${material.original_name}`}
                isLoading={remove.isPending && remove.variables === material.id}
                onClick={() => setToDelete(material)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFile}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar material"
        message={`¿Eliminar "${toDelete?.original_name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isLoading={remove.isPending}
        onConfirm={() => {
          if (toDelete) {
            remove.mutate(toDelete.id, {
              onSettled: () => setToDelete(null),
            });
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
