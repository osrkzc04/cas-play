import { Download, FileText } from "lucide-react";

import { Button } from "@/shared/components";
import { useDownloadMaterial, useLessonMaterials } from "../hooks/useLessonMaterials";

interface LessonMaterialsProps {
  lessonId: string;
}

export function LessonMaterials({ lessonId }: LessonMaterialsProps) {
  const { data: materials, isLoading } = useLessonMaterials(lessonId);
  const download = useDownloadMaterial();

  if (isLoading || !materials || materials.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-800">
        Material complementario
      </h2>
      <ul className="space-y-2">
        {materials.map((material) => (
          <li
            key={material.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2"
          >
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <FileText className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {material.original_name}
            </span>
            <Button
              variant="outline"
              size="sm"
              isLoading={download.isPending && download.variables?.id === material.id}
              onClick={() => download.mutate(material)}
            >
              <Download className="mr-1 h-4 w-4" aria-hidden="true" />
              Descargar
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
