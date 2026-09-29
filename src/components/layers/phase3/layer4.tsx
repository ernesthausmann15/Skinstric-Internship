"use client";

import { LiveFaceBlur } from "@/components/flow/live-face-blur";
import { Checklist, Diamond } from "@/components/layers/phase3/layer3";
import type { FaceContour } from "@/lib/focus-face";

/**
 * Phase 3, Layer 4 is the processing frame.
 * The upload or camera still is drawn here sharp, then the face scan and the
 * background blur run together. Proceed stays quiet until that fade ends,
 * including a second walk when the first silhouette clips the face.
 * This screen is the only place that picture is shown. Demographics never
 * receives it. Great Shot is the white line measured on the forehead.
 * Back returns to the live preview so the picture can be taken again.
 * The header gains the Analysis bracket that this frame prints and the preview does not.
 */
export function Layer4({
  image,
  ready = false,
  scanning = false,
  onScanReady,
  onBack,
  onProceed,
}: {
  image: string | null;
  ready?: boolean;
  scanning?: boolean;
  onScanReady?: (region: FaceContour | null) => void;
  onBack?: () => void;
  onProceed?: () => void;
}) {
  const canProceed = ready && !scanning;
  return (
    <section
      className="scan-frame relative h-[960px] w-[1920px] overflow-hidden bg-[#CDCDCB] text-[#FCFCFC]"
      aria-label="Great shot"
    >
      {image ? <LiveFaceBlur image={image} onReady={(region) => onScanReady?.(region)} /> : null}

      <header className="absolute top-0 left-0 h-[64px] w-[1920px]">
        <p className="absolute top-[23px] left-[32px] text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase">
          Skinstric
        </p>
        <p className="absolute top-[23px] left-[117px] flex h-[17px] items-center gap-[6px] text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-60">
          <Bracket side="left" />
          Analysis
          <Bracket side="right" />
        </p>
      </header>

      <p className="scan-title absolute top-[262px] left-1/2 w-max -translate-x-1/2 text-[12px] leading-[16px] font-semibold tracking-[1.2px] uppercase">
        {scanning ? "Scanning face..." : "Great shot!"}
      </p>

      <button
        type="button"
        onClick={onBack}
        className="sk-nav absolute top-[880px] left-[32px] flex h-[44px] items-center gap-[16px] border-0 bg-transparent p-0 font-[inherit] text-inherit"
      >
        <Diamond direction="left" />
        <span className="sk-nav-label text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          back
        </span>
      </button>

      <button
        type="button"
        onClick={onProceed}
        disabled={!canProceed}
        aria-disabled={!canProceed}
        className={`sk-nav absolute top-[880px] right-[34px] flex h-[44px] items-center gap-[16px] border-0 bg-transparent p-0 font-[inherit] text-inherit ${canProceed ? "" : "pointer-events-none opacity-40"}`}
      >
        <span className="sk-nav-label text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          proceed
        </span>
        <Diamond direction="right" />
      </button>

      <Checklist />
    </section>
  );
}

function Bracket({ side }: { side: "left" | "right" }) {
  const d =
    side === "left"
      ? "M4 17H2C0.895 17 0 16.1046 0 15V2C0 0.8954 0.895 0 2 0H4"
      : "M0 17H2C3.105 17 4 16.1046 4 15V2C4 0.8954 3.105 0 2 0H0";

  return (
    <svg width="4" height="17" viewBox="0 0 4 17" fill="none" aria-hidden="true">
      <path d={d} stroke="#FCFCFC" />
    </svg>
  );
}
