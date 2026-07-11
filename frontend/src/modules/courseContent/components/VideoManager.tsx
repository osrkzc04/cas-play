import { useRef, useState } from "react";
import { CheckCircle2, RefreshCw, Trash2, Upload, Video } from "lucide-react";

import { Alert, Button, Spinner } from "@/shared/components";
import { VideoPlayer } from "@/shared/components/VideoPlayer";
import { getApiErrorMessage } from "@/shared/lib/errors";
import { useVideoMutation } from "../hooks/useLessons";
import type { Lesson } from "../types";

const MAX_MB = 500;

interface VideoManagerProps {
  lesson: Lesson;
  moduleId: string;
}

export function VideoManager({ lesson, moduleId }: VideoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useVideoMutation(moduleId);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setSizeError(`El video supera el límite de ${MAX_MB} MB.`);
      return;
    }
    setSizeError(null);
    mutation.mutate({ lessonId: lesson.id, file });
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="flex flex-col gap-3">
      {lesson.has_video ? (
        <div className="flex flex-col gap-3">
          {/* `key` fuerza recrear el reproductor al reemplazar el video. */}
          <div className="max-w-xl">
            <VideoPlayer key={lesson.updated_at} lessonId={lesson.id} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Video cargado
              {mutation.isPending && (
                <Spinner size="sm" className="text-brand-600" />
              )}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={mutation.isPending}
              onClick={openPicker}
            >
              <RefreshCw className="h-4 w-4" />
              Reemplazar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ lessonId: lesson.id, file: null })}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={mutation.isPending}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50/40 disabled:cursor-not-allowed"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-gray-400 shadow-soft">
            {mutation.isPending ? (
              <Spinner size="sm" className="text-brand-600" />
            ) : (
              <Video className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Subir video
          </span>
          <span className="text-xs text-gray-400">
            Formatos de video · máximo {MAX_MB} MB · no será descargable
          </span>
        </button>
      )}

      {sizeError && <Alert tone="error">{sizeError}</Alert>}
      {mutation.isError && (
        <Alert tone="error">{getApiErrorMessage(mutation.error)}</Alert>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
