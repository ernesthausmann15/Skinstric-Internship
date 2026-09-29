"use client";

import { useEffect, useRef } from "react";
import { paintBlurredFrame, scanFaceLive, type FaceContour } from "@/lib/focus-face";

/**
 * The first painted frame is the whole photo, sharp. The face walk then
 * starts, and the background blur advances with that walk. The clear area
 * is the silhouette found so far. onReady fires after a correction walk,
 * when one is required, and only stores that silhouette.
 */
export function LiveFaceBlur({
  image,
  onOpen,
  onReady,
}: {
  image: string;
  onOpen?: () => void;
  onReady: (face: FaceContour | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);
  const onOpenRef = useRef(onOpen);
  onReadyRef.current = onReady;
  onOpenRef.current = onOpen;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let openFrame = 0;
    let cancelScan = () => undefined as void;
    const picture = new Image();
    picture.onload = () => {
      if (cancelled) return;
      canvas.width = picture.naturalWidth;
      canvas.height = picture.naturalHeight;
      paintBlurredFrame(canvas, picture, picture.naturalWidth, picture.naturalHeight, null, 0);
      // The photo is on screen. Proceed can be used now, even if the face
      // walk later finds no contour.
      onOpenRef.current?.();
      openFrame = window.requestAnimationFrame(() => {
        if (cancelled) return;
        const scan = scanFaceLive(picture, picture.naturalWidth, picture.naturalHeight, (progress, face) => {
          if (cancelled) return;
          paintBlurredFrame(canvas, picture, picture.naturalWidth, picture.naturalHeight, face, progress);
        });
        cancelScan = scan.cancel;
        void scan.finished.then((face) => {
          if (!cancelled) onReadyRef.current(face);
        });
      });
    };
    picture.src = image;
    return () => {
      cancelled = true;
      cancelScan();
      window.cancelAnimationFrame(openFrame);
    };
  }, [image]);

  return (
    <canvas
      ref={canvasRef}
      className="scan-canvas pointer-events-none absolute top-0 left-0 h-[960px] w-[1920px]"
    />
  );
}
