import { Download, FileText, FolderOpen } from "lucide-react";

import { Button, Spinner } from "@/shared/components";
import type { Material } from "@/modules/courseContent/types";
import {
  useDownloadMaterial,
  useLessonMaterials,
  useMaterialPreviewUrl,
} from "../hooks/useLessonMaterials";

interface NoVideoPlaceholderProps {
  lessonId: string;
  materialsAnchorId: string;
}

const emptyBox =
  "flex aspect-video w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500";

export function NoVideoPlaceholder({
  lessonId,
  materialsAnchorId,
}: NoVideoPlaceholderProps) {
  const { data: materials, isLoading } = useLessonMaterials(lessonId);

  if (isLoading) {
    return (
      <div className={emptyBox}>
        <Spinner />
      </div>
    );
  }

  const count = materials?.length ?? 0;

  if (count === 0) {
    return <div className={emptyBox}>Esta clase no tiene video.</div>;
  }

  const pdf = materials?.find((material) => material.material_type === "PDF");

  if (pdf) {
    return <PdfPreview material={pdf} materialsAnchorId={materialsAnchorId} />;
  }

  return (
    <DocumentCard count={count} materialsAnchorId={materialsAnchorId} />
  );
}

function scrollToMaterials(anchorId: string) {
  document
    .getElementById(anchorId)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

interface PdfPreviewProps {
  material: Material;
  materialsAnchorId: string;
}

function PdfPreview({ material, materialsAnchorId }: PdfPreviewProps) {
  const { url, isLoading, isError } = useMaterialPreviewUrl(material);
  const download = useDownloadMaterial();

  if (isError) {
    return (
      <DocumentCard
        count={1}
        materialsAnchorId={materialsAnchorId}
        message="No se pudo cargar la vista previa del documento."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
      {isLoading || !url ? (
        <div className="flex aspect-video w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <iframe
          title={material.original_name}
          src={url}
          className="aspect-video w-full bg-white"
        />
      )}
      <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-card px-4 py-2">
        <span className="flex items-center gap-2 truncate text-sm text-gray-700">
          <FileText className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          <span className="truncate">{material.original_name}</span>
        </span>
        <Button
          variant="outline"
          size="sm"
          isLoading={download.isPending}
          onClick={() => download.mutate(material)}
        >
          <Download className="mr-1 h-4 w-4" aria-hidden="true" />
          Descargar
        </Button>
      </div>
    </div>
  );
}

interface DocumentCardProps {
  count: number;
  materialsAnchorId: string;
  message?: string;
}

function DocumentCard({ count, materialsAnchorId, message }: DocumentCardProps) {
  const subtitle =
    message ??
    (count === 1
      ? "Esta clase incluye 1 documento complementario."
      : `Esta clase incluye ${count} documentos complementarios.`);

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-xl bg-gradient-to-br from-brand-50 to-gray-100 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        <FileText className="h-8 w-8" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="text-base font-semibold text-gray-800">
          Clase basada en material de lectura
        </p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => scrollToMaterials(materialsAnchorId)}
      >
        <FolderOpen className="mr-1 h-4 w-4" aria-hidden="true" />
        Ver material
      </Button>
    </div>
  );
}
