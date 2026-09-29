"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  findFace,
  frameLiveCamera,
  holdFace,
  paintBlurredFrame,
  type FaceContour,
} from "@/lib/focus-face";

/**
 * Phase 3, Layer 3 is the live camera preview.
 * The frame is 1024×512, so positions are that image scaled by 1920/1024.
 * The feed is drawn sharp, then the gallery blur is painted on top: the face
 * stays clear and the background softens. Detection reads the sharp frame,
 * so the blur cannot pull the clear region off the face. Take Picture stores
 * the sharp frame. The reader runs from that still, after Proceed.
 */
const TIPS = [
  { bullet: 688.5, label: "Neutral Expression" },
  { bullet: 882.5, label: "Frontal Pose" },
  { bullet: 1030, label: "Adequate Lighting" },
] as const;

export function Layer3({
  stream,
  onBack,
  onCapture,
}: {
  stream: MediaStream | null;
  onBack?: () => void;
  onCapture?: (image: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef({
    target: null as FaceContour | null,
    strength: 0,
    stamp: 0,
  });

  const setVideo = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (!node) return;
    if (!stream) {
      node.srcObject = null;
      return;
    }
    if (node.srcObject !== stream) node.srcObject = stream;
    void node.play().catch(() => undefined);
  }, [stream]);

  useEffect(() => {
    let alive = true;
    let busy = false;
    let lastDetect = 0;
    let frame = 0;
    const track = trackRef.current;
    track.target = null;
    track.strength = 0;
    track.stamp = 0;

    const tick = (time: number) => {
      frame = window.requestAnimationFrame(tick);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !video.videoWidth) return;
      if (canvas.width !== 1920 || canvas.height !== 960) {
        canvas.width = 1920;
        canvas.height = 960;
      }
      // Sharp frame first. The visible paint keeps only the head, and blurs
      // the rest of the camera picture.
      const picture = frameLiveCamera(video, video.videoWidth, video.videoHeight);
      const dt = track.stamp ? Math.min(48, time - track.stamp) : 16;
      track.stamp = time;
      if (track.target) track.strength = Math.min(1, track.strength + dt / 800);
      paintBlurredFrame(canvas, picture, picture.width, picture.height, track.target, track.strength);
      if (busy || time - lastDetect < 220) return;
      busy = true;
      lastDetect = time;
      void findFace(picture, picture.width, picture.height)
        .then((found) => {
          if (!alive) return;
          track.target = holdFace(track.target, found);
        })
        .finally(() => {
          busy = false;
        });
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
    };
  }, [stream]);

  function takePicture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const shot = document.createElement("canvas");
    shot.width = video.videoWidth;
    shot.height = video.videoHeight;
    const context = shot.getContext("2d", { alpha: false });
    if (!context) return;
    context.save();
    context.translate(shot.width, 0);
    context.scale(-1, 1);
    context.imageSmoothingEnabled = false;
    context.drawImage(video, 0, 0, shot.width, shot.height);
    context.restore();
    onCapture?.(shot.toDataURL("image/png"));
  }

  return (
    <section
      className="scan-frame relative h-[960px] w-[1920px] overflow-hidden bg-[#CDCDCB] text-[#FCFCFC]"
      aria-label="Camera preview"
    >
      <video
        ref={setVideo}
        autoPlay
        muted
        playsInline
        className="pointer-events-none absolute h-px w-px opacity-0"
      />
      <canvas
        ref={canvasRef}
        className="scan-canvas pointer-events-none absolute top-0 left-0 h-[960px] w-[1920px]"
      />

      <p className="absolute top-[23px] left-[32px] text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase">
        Skinstric
      </p>

      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        className="sk-nav absolute top-[880px] left-[32px] border-0 bg-transparent p-0"
      >
        <Diamond direction="left" />
      </button>

      <button
        type="button"
        onClick={takePicture}
        className="scan-capture absolute top-[450px] right-[34px] flex items-center gap-[16px] border-0 bg-transparent p-0 text-[#FCFCFC]"
      >
        <span className="scan-capture-label text-[12px] leading-[16px] font-semibold tracking-[0.8px] uppercase">
          Take picture
        </span>
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#FCFCFC]">
          <CameraIcon />
        </span>
      </button>

      <Checklist />
    </section>
  );
}

function Checklist() {
  return (
    // `contents` keeps these absolutely placed on the 1920 artboard.
    // The compact frame turns this box into a wrapping row above the nav.
    <div className="camera-tips contents">
      <p className="absolute top-[858px] left-1/2 w-max -translate-x-1/2 text-[12px] leading-[16px] font-normal tracking-[0.6px] uppercase">
        To get better results make sure to have
      </p>
      {TIPS.map((tip) => (
        <p
          key={tip.label}
          className="absolute top-[898px] flex items-center gap-[6px] text-[12px] leading-[16px] font-normal tracking-[0.4px] uppercase"
          style={{ left: tip.bullet }}
        >
          <Bullet />
          {tip.label}
        </p>
      ))}
    </div>
  );
}

function Bullet() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M5.5 0.7L10.3 5.5L5.5 10.3L0.7 5.5L5.5 0.7Z" stroke="#FCFCFC" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 7.2L9.3 5.2H14.7L16 7.2H19.6V18.8H4.4V7.2H8Z"
        stroke="#1A1B1C"
        strokeWidth="1.4"
      />
      <circle cx="12" cy="13" r="3.1" stroke="#1A1B1C" strokeWidth="1.4" />
    </svg>
  );
}

function Diamond({ direction }: { direction: "left" | "right" }) {
  const triangle =
    direction === "left"
      ? "M15.7144 22L25.1429 27.4436V16.5564L15.7144 22Z"
      : "M27.436 22L18.007 27.4436V16.5564L27.436 22Z";

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M43.293 22L22 43.293L0.707031 22L22 0.707031L43.293 22Z" stroke="#FCFCFC" />
      <path
        className="sk-nav-dash"
        d="M22 5.21L38.781 22L22 38.781L5.21 22L22 5.21Z"
        stroke="#FCFCFC"
        strokeDasharray="1 4"
      />
      <path d={triangle} fill="#FCFCFC" />
    </svg>
  );
}

export { Checklist, Diamond };
