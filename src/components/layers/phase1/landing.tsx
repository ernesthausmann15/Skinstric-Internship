"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * The landing screen is frames 000 and 001 as one moving state.
 * At rest the headline sits centered at left 620 and one diamond turns on
 * each edge. Hovering a side slides the headline to that frame's position
 * (left 32, or the mirror at left 1208), fades in the two outer rings, and
 * swaps the small diamond button for the 78px expanded one.
 */
const INK = "#1A1B1C";

type Side = "left" | "right" | null;

export function Landing({ onTakeTest }: { onTakeTest?: () => void }) {
  const [side, setSide] = useState<Side>(null);

  return (
    <section
      className="relative h-[960px] w-[1920px] overflow-hidden bg-[#FCFCFC] text-[#1A1B1C]"
      aria-label="Skinstric introduction"
      onMouseLeave={() => setSide(null)}
    >
      <div
        data-side="left"
        className="absolute top-[64px] bottom-0 left-0 w-1/2"
        onMouseEnter={() => setSide("left")}
      />
      <div
        data-side="right"
        className="absolute top-[64px] right-0 bottom-0 w-1/2"
        onMouseEnter={() => setSide("right")}
      />

      <Diamond
        src="/layers/diamond-dotted-764.svg"
        width={764}
        height={764}
        speed="sk-spin-outer"
        className="top-[98px] left-[-382px]"
        opacity={side === "left" ? "opacity-30" : "opacity-0"}
      />
      <Diamond
        src="/layers/diamond-dotted-684.svg"
        width={684}
        height={684}
        speed="sk-spin-middle"
        className="top-[138px] left-[-342px]"
        opacity={side === "left" ? "opacity-60" : "opacity-0"}
      />
      <Diamond
        src="/layers/diamond-dotted.svg"
        width={604}
        height={604}
        speed={side === "left" ? "sk-spin-inner" : "sk-spin-outer"}
        className="top-[178px] left-[-302px]"
        opacity={side === "right" ? "opacity-0" : "opacity-100"}
      />

      <Diamond
        src="/layers/diamond-dotted-764.svg"
        width={764}
        height={764}
        speed="sk-spin-outer"
        className="top-[98px] left-[1538px]"
        opacity={side === "right" ? "opacity-30" : "opacity-0"}
      />
      <Diamond
        src="/layers/diamond-dotted-684.svg"
        width={684}
        height={684}
        speed="sk-spin-middle"
        className="top-[138px] left-[1578px]"
        opacity={side === "right" ? "opacity-60" : "opacity-0"}
      />
      <Diamond
        src="/layers/diamond-dotted.svg"
        width={604}
        height={604}
        speed={side === "right" ? "sk-spin-inner" : "sk-spin-outer sk-spin-reverse"}
        className="top-[178px] left-[1618px]"
        opacity={side === "left" ? "opacity-0" : "opacity-100"}
      />

      <header className="absolute top-0 left-0 z-10 h-[64px] w-[1920px]">
        <p className="absolute top-[23px] left-[32px] text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase">
          Skinstric
        </p>
        <p className="absolute top-[23px] left-[117px] flex h-[17px] items-center gap-[6px] text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-60">
          <Bracket side="left" />
          Intro
          <Bracket side="right" />
        </p>
        <button
          type="button"
          className="absolute top-[15px] right-[32px] flex h-[32px] items-center bg-[#1A1B1C] px-[16px] text-[10px] leading-[16px] font-semibold tracking-[-0.2px] text-[#FCFCFC] uppercase"
        >
          Enter code
        </button>
      </header>

      <h1
        className={`sk-move pointer-events-none absolute top-[361px] w-[680px] text-[128px] leading-[120px] font-light tracking-[-8.96px] ${
          side === "right"
            ? "left-[32px] text-left"
            : side === "left"
              ? "left-[1208px] text-right"
              : "left-[620px] text-center"
        }`}
      >
        Sophisticated
        <br />
        skincare
      </h1>

      <button
        type="button"
        onMouseEnter={() => setSide("left")}
        aria-hidden={side === "left" || side === "right"}
        tabIndex={side === null ? 0 : -1}
        className={`sk-nav absolute top-[458px] left-[32px] z-10 flex h-[44px] items-center gap-[16px] border-0 bg-transparent p-0 font-[inherit] text-inherit transition-opacity duration-300 ${
          side === "right" || side === "left" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <DiamondButton direction="left" />
        <span className="sk-nav-label text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          Discover A.I.
        </span>
      </button>

      <button
        type="button"
        onMouseEnter={() => setSide("left")}
        aria-hidden={side !== "left"}
        tabIndex={side === "left" ? 0 : -1}
        className={`absolute top-[441px] left-[32px] z-10 flex h-[78px] items-center gap-[24px] border-0 bg-transparent p-0 font-[inherit] text-inherit transition-opacity duration-300 ${
          side === "left" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ExpandedDiamond direction="left" />
        <span className="text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase">
          Discover A.I.
        </span>
      </button>

      <button
        type="button"
        onMouseEnter={() => setSide("right")}
        onClick={onTakeTest}
        aria-hidden={side !== null}
        tabIndex={side === null ? 0 : -1}
        className={`sk-nav absolute top-[458px] right-[32px] z-10 flex h-[44px] items-center gap-[16px] border-0 bg-transparent p-0 font-[inherit] text-inherit transition-opacity duration-300 ${
          side === null ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="sk-nav-label text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          Take test
        </span>
        <DiamondButton direction="right" />
      </button>

      <button
        type="button"
        onMouseEnter={() => setSide("right")}
        onClick={onTakeTest}
        aria-hidden={side !== "right"}
        tabIndex={side === "right" ? 0 : -1}
        className={`absolute top-[441px] left-[1719px] z-10 flex h-[78px] items-center gap-[24px] border-0 bg-transparent p-0 font-[inherit] text-inherit transition-opacity duration-300 ${
          side === "right" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="w-[67px] text-right text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase">
          Take Test
        </span>
        <ExpandedDiamond direction="right" />
      </button>

      <p className="pointer-events-none absolute top-[862px] left-[32px] z-10 w-[316px] text-[14px] leading-[24px] font-normal tracking-[0px] uppercase">
        Skinstric developed an A.I. that creates
        <br />
        a highly-personalised routine tailored to
        <br />
        what your skin needs.
      </p>
    </section>
  );
}

function Diamond({
  src,
  width,
  height,
  speed,
  className,
  opacity,
}: {
  src: string;
  width: number;
  height: number;
  speed: string;
  className: string;
  opacity: string;
}) {
  return (
    <span
      className={`sk-spin sk-move pointer-events-none absolute block ${speed} ${opacity} ${className}`}
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
      <path d="M43.293 22L22 43.293L0.707031 22L22 0.707031L43.293 22Z" stroke={INK} />
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

function ExpandedDiamond({ direction }: { direction: "left" | "right" }) {
  const triangle =
    direction === "right"
      ? "M43.52 39L35.97 43.36V34.64L43.52 39Z"
      : "M34.48 39L42.03 43.36V34.64L34.48 39Z";

  return (
    <svg width="78" height="78" viewBox="0 0 78 78" fill="none" aria-hidden="true">
      <path d="M39 0L78 39L39 78L0 39L39 0Z" stroke={INK} />
      <path d="M39 8.81L69.2 39L39 69.2L8.81 39L39 8.81Z" stroke={INK} strokeDasharray="1 3" />
      <path d={triangle} fill={INK} />
    </svg>
  );
}
