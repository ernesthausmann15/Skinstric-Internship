"use client";

import Image from "next/image";

/**
 * Phase 2, Layer 3 is Figma node 12:16030, the analysis result.
 * The artboard is 1920×960. Three dotted diamonds share the center (960, 480)
 * and keep the same spin as the intro. Inside them, four equal diamonds sit
 * on that center: Demographics above, Skin Type to the left, Cosmetic Concerns
 * to the right, and Weather below. Each rests at #F3F3F4. The frame shows
 * Demographics under the pointer, which darkens that diamond to #E1E1E2.
 * Hover repeats that fill on whichever diamond is active. Clip paths keep the
 * hit area on the diamond, so the overlapping corner boxes do not steal the hover.
 */
const INK = "#1A1B1C";

const FACETS = [
  {
    label: "Demographics",
    slot: "demographics",
    lines: ["Demographics"],
    left: 851.5,
    top: 258,
    size: 217,
  },
  {
    label: "Skin type details",
    slot: "skin",
    lines: ["Skin Type", "Details"],
    left: 738.5,
    top: 371.75,
    size: 216.5,
  },
  {
    label: "Cosmetic concerns",
    slot: "cosmetic",
    lines: ["Cosmetic", "Concerns"],
    left: 963.5,
    top: 371.75,
    size: 216.5,
  },
  {
    label: "Weather",
    slot: "weather",
    lines: ["Weather"],
    left: 851.5,
    top: 484,
    size: 217,
  },
] as const;

export function Layer3({
  onBack,
  onSummary,
  onDemographics,
}: {
  onBack?: () => void;
  onSummary?: () => void;
  onDemographics?: () => void;
}) {
  return (
    <section
      className="relative h-[960px] w-[1920px] overflow-hidden bg-[#FCFCFC] text-[#1A1B1C]"
      aria-label="A.I. analysis"
    >
      {/* `contents` keeps every diamond on the 1920 artboard. On a phone the
          compact frame turns this into one square, and each ring is a
          percentage of that square so the cluster scales without flattening. */}
      <div className="analysis-stage contents">
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

      {FACETS.map((facet) => (
        <button
          key={facet.label}
          type="button"
          aria-label={facet.label}
          onClick={facet.label === "Demographics" ? onDemographics : undefined}
          className={`analysis-facet analysis-facet-${facet.slot} absolute flex items-center justify-center border-0 p-0 text-center text-[14px] leading-[24px] font-semibold tracking-[-0.28px] text-[#1A1B1C] uppercase`}
          style={{
            left: facet.left,
            top: facet.top,
            width: facet.size,
            height: facet.size,
            clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
          }}
        >
          <span>
            {facet.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        </button>
      ))}
      </div>

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

      <p className="analysis-copy absolute top-[86px] left-[32px] text-[16px] leading-[24px] font-semibold tracking-[-0.32px] uppercase">
        A. I. Analysis
      </p>
      <p className="analysis-copy absolute top-[122px] left-[32px] text-[14px] leading-[24px] font-normal tracking-[0px] uppercase">
        A. I. has estimated the following.
        <br />
        Fix estimated information if needed.
      </p>

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
        onClick={onSummary}
        className="sk-nav absolute top-[880px] right-[32px] flex h-[44px] items-center gap-[16px] border-0 bg-transparent p-0 font-[inherit] text-inherit"
      >
        <span className="sk-nav-label text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          get summary
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
    <span className={`sk-spin pointer-events-none absolute block ${className}`} style={{ width, height }}>
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
