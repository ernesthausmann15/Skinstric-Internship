"use client";

import Image from "next/image";

/**
 * Layer 5 is Figma frame "505" (node 12:15711).
 * Offsets are each node's position minus the frame origin, on a 1920×960
 * artboard. The three diamonds share a center at (960, 480). Their SVG files
 * include the 1px stroke that sits outside the path box, so each image is
 * placed 1px above and left of that box.
 */
const INK = "#1A1B1C";

export function Layer5({
  city,
  pending = false,
  error = "",
  onBack,
  onProceed,
}: {
  city: string;
  pending?: boolean;
  error?: string;
  onBack?: () => void;
  onProceed?: () => void;
}) {
  return (
    <section
      className="relative h-[960px] w-[1920px] overflow-hidden bg-[#FCFCFC] text-[#1A1B1C]"
      aria-label="Location confirmation"
    >
      <DiamondOutline
        src="/layers/diamond-dotted-764.svg"
        width={764}
        height={764}
        className="sk-spin-outer top-[98px] left-[578px] opacity-30"
      />
      <DiamondOutline
        src="/layers/diamond-dotted-684.svg"
        width={684}
        height={684}
        className="sk-spin-middle top-[138px] left-[618px] opacity-60"
      />
      <DiamondOutline
        src="/layers/diamond-dotted.svg"
        width={604}
        height={604}
        className="sk-spin-inner top-[178px] left-[658px]"
      />

      <header className="absolute top-0 left-0 h-[64px] w-[1920px]">
        <p className="absolute top-[23px] left-[32px] text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase">
          Skinstric
        </p>
        <p className="absolute top-[23px] left-[117px] flex h-[17px] items-center gap-[6px] text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-60">
          <Bracket side="left" />
          Intro
          <Bracket side="right" />
        </p>
      </header>

      <p className="absolute top-[86px] left-[32px] w-[227px] text-[16px] leading-[24px] font-semibold tracking-[-0.32px] uppercase">
        To start analysis
      </p>

      <p className="absolute top-[422px] left-[881px] w-[157px] text-[14px] leading-[24px] font-normal tracking-[0px] uppercase opacity-40">
        Where are you from?
      </p>

      <div className="absolute top-[448px] left-1/2 w-max -translate-x-1/2 text-center">
        <h1 className="text-[60px] leading-[64px] font-normal tracking-[-4.2px]">{city}</h1>
        <div className="h-px bg-[#1A1B1C]" />
      </div>
      {error ? (
        <p className="absolute top-[528px] left-1/2 w-max -translate-x-1/2 text-[12px] leading-[16px] font-semibold tracking-[0.4px] uppercase opacity-50">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onBack}
        className="sk-nav absolute top-[880px] left-[32px] flex h-[44px] items-center gap-[16px] border-0 bg-transparent p-0 font-[inherit] text-inherit"
      >
        <DiamondButton direction="left" />
        <span className="sk-nav-label text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          back
        </span>
      </button>

      <button
        type="button"
        onClick={onProceed}
        disabled={pending}
        className="sk-nav absolute top-[880px] left-[1765px] flex h-[44px] w-[123px] items-center justify-end gap-[16px] border-0 bg-transparent p-0 font-[inherit] text-inherit disabled:cursor-default disabled:opacity-30"
      >
        <span className="sk-nav-label w-[63px] text-right text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          proceed
        </span>
        <DiamondButton direction="right" />
      </button>
    </section>
  );
}

function DiamondOutline({
  src,
  width,
  height,
  className,
}: {
  src: string;
  width: number;
  height: number;
  className: string;
}) {
  return (
    <span
      className={`sk-spin absolute block ${className}`}
      style={{ width, height }}
    >
      <Image src={src} alt="" width={width} height={height} unoptimized />
    </span>
  );
}

function Bracket({ side }: { side: "left" | "right" }) {
  const d =
    side === "left"
      ? "M4 17H2C0.895 17 0 16.1046 0 15V2C0 0.8954 0.895 0 2 0H4"
      : "M0 17H2C3.105 17 4 16.1046 4 15V2C4 0.8954 3.105 0 2 0H0";

  return (
    <svg width="4" height="17" viewBox="0 0 4 17" fill="none" aria-hidden="true">
      <path d={d} stroke={INK} />
    </svg>
  );
}

function DiamondButton({ direction }: { direction: "left" | "right" }) {
  const triangle =
    direction === "left"
      ? "M15.7144 22L25.1429 27.4436V16.5564L15.7144 22Z"
      : "M27.436 22L18.007 27.4436V16.5564L27.436 22Z";

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path
        d="M43.293 22L22 43.293L0.707031 22L22 0.707031L43.293 22Z"
        stroke={INK}
      />
      <path
        className="sk-nav-dash"
        d="M22 5.21L38.781 22L22 38.781L5.21 22L22 5.21Z"
        stroke={INK}
        strokeDasharray="1 4"
      />
      <path d={triangle} fill={INK} />
    </svg>
  );
}
