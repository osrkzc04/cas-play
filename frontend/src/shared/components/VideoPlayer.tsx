import { useEffect, useMemo, useRef } from "react";

import { config } from "@/app/config";
import { endpoints } from "@/shared/api/endpoints";
import { tokenStorage } from "@/shared/auth/tokenStorage";

interface VideoPlayerProps {
  lessonId: string;
  /** Segundo donde reanudar la reproducción. */
  initialSecond?: number;
  /** Persistencia del último segundo (se invoca con debounce). */
  onSaveProgress?: (second: number) => void;
  /** Se dispara una sola vez al terminar el video. */
  onEnded?: () => void;
}

const SAVE_INTERVAL_MS = 5000;

// El elemento <video> nativo no envía el header Authorization, por lo que el
// token de acceso viaja como query param al endpoint de streaming.
export function VideoPlayer({
  lessonId,
  initialSecond = 0,
  onSaveProgress,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedAt = useRef(0);

  const src = useMemo(() => {
    const token = tokenStorage.getAccess();
    const url = `${config.apiUrl}${endpoints.lessons.video(lessonId)}`;
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  }, [lessonId]);

  useEffect(() => {
    lastSavedAt.current = 0;
  }, [lessonId]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && initialSecond > 0 && initialSecond < video.duration) {
      video.currentTime = initialSecond;
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !onSaveProgress) {
      return;
    }
    const now = Date.now();
    if (now - lastSavedAt.current >= SAVE_INTERVAL_MS) {
      lastSavedAt.current = now;
      onSaveProgress(video.currentTime);
    }
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (video && onSaveProgress) {
      onSaveProgress(video.currentTime);
    }
    onEnded?.();
  };

  return (
    <video
      key={lessonId}
      ref={videoRef}
      src={src}
      controls
      controlsList="nodownload"
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      className="aspect-video w-full rounded-xl bg-black"
    >
      Tu navegador no soporta la reproducción de video.
    </video>
  );
}
