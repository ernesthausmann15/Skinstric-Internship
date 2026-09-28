import Image from "next/image";

/**
 * Layer 2 is Figma frame "001" (node 12:15677).
 * Offsets are measured from the frame origin on a 1920×960 artboard.
 * The headline is left-aligned, and the three diamonds share a center
 * on the right edge at (1920, 480), so overflow hidden clips their right half.
 * The header's first Enter code instance is visible:false, so only the
 * 92×32 button at (1810, 15) is drawn.
 */
const INK = "#1A1B1C";

export function Layer2() {
  return (
    <section
      className="relative h-[960px] w-[1920px] overflow-hidden bg-[#FCFCFC] text-[#1A1B1C]"
      aria-label="Skinstric introduction, test ready"
    >
      <DiamondOutline
        src="/layers/diamond-dotted-764.svg"
        width={764}
        height={764}
        className="sk-spin-outer top-[98px] left-[1538px] opacity-30"
      />
      <DiamondOutline
        src="/layers/diamond-dotted-684.svg"
        width={684}
        height={684}
        className="sk-spin-middle top-[138px] left-[1578px] opacity-60"
      />
      <DiamondOutline
        src="/layers/diamond-dotted.svg"
        width={604}
        height={604}
        className="sk-spin-inner top-[178px] left-[1618px]"
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
        <button
          type="button"
          className="absolute top-[15px] left-[1810px] flex h-[32px] w-[92px] items-center justify-center bg-[#1A1B1C] text-[10px] leading-[16px] font-semibold tracking-[-0.2px] text-[#FCFCFC] uppercase"
        >
          Enter code
        </button>
      </header>

      <h1 className="absolute top-[361px] left-[32px] w-[680px] text-left text-[128px] leading-[120px] font-light tracking-[-8.96px]">
        Sophisticated
        <br />
        skincare
      </h1>

      <button
        type="button"
        className="absolute top-[441px] left-[1719px] flex h-[78px] items-center gap-[24px]"
      >
        <span className="w-[67px] text-right text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase">
          Take Test
        </span>
        <ExpandedDiamond />
      </button>

      <p className="absolute top-[862px] left-[32px] w-[316px] text-[14px] leading-[24px] font-normal tracking-[0px] uppercase">
        Skinstric developed an A.I. that creates
        <br />
        a highly-personalised routine tailored to
        <br />
        what your skin needs.
      </p>
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

/** 78×78 expanded diamond: solid outer stroke, 60px dashed inner diamond, right-pointing triangle. */
function ExpandedDiamond() {
  return (
    <svg width="78" height="78" viewBox="0 0 78 78" fill="none" aria-hidden="true">
      <path d="M39 0L78 39L39 78L0 39L39 0Z" stroke={INK} />
      <path
        d="M39 8.81L69.2 39L39 69.2L8.81 39L39 8.81Z"
        stroke={INK}
        strokeDasharray="1 3"
      />
      <path d="M43.52 39L35.97 43.36V34.64L43.52 39Z" fill={INK} />
    </svg>
  );
}
