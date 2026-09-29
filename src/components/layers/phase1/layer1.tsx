import Image from "next/image";

/**
 * Layer 1 is Figma frame "000" (node 12:15668) from the Skinstric file.
 * The frame origin in the file is (2923, 1001). Every offset below is that
 * node's position minus the frame origin, so the numbers match the 1920×960
 * artboard exactly: header at y 0, diamonds centered on the side edges at
 * y 480, and the headline box at (620, 361).
 */
const INK = "#1A1B1C";

export function Layer1() {
  return (
    <section
      className="relative h-[960px] w-[1920px] overflow-hidden bg-[#FCFCFC] text-[#1A1B1C]"
      aria-label="Skinstric introduction"
    >
      {/* Side diamonds turn in opposite directions, the same way the landing screen does. */}
      <DiamondOutline className="sk-spin-outer top-[178px] left-[-302px]" />
      <DiamondOutline className="sk-spin-outer sk-spin-reverse top-[178px] left-[1618px]" />

      <header className="absolute top-0 left-0 h-[64px] w-[1920px]">
        <p className="absolute top-[23px] left-[32px] text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase">
          Skinstric
        </p>

        {/* 16px after the wordmark (32 + 69). Brackets are 4×17 with a 6px gap, at 60% ink. */}
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

      <h1 className="absolute top-[361px] left-[620px] w-[680px] text-center text-[128px] leading-[120px] font-light tracking-[-8.96px]">
        Sophisticated
        <br />
        skincare
      </h1>

      <button
        type="button"
        className="sk-nav absolute top-[458px] left-[32px] flex h-[44px] items-center gap-[16px]"
      >
        <DiamondButton direction="left" />
        <span className="sk-nav-label text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          Discover A.I.
        </span>
      </button>

      <button
        type="button"
        className="sk-nav absolute top-[458px] right-[32px] flex h-[44px] items-center gap-[16px]"
      >
        <span className="sk-nav-label text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          Take test
        </span>
        <DiamondButton direction="right" />
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

/** Dotted diamond exported from nodes 12:15674 / 12:15675. Root size stays 604×604. The wrapper spins so the image box stays on the Figma coordinate. */
function DiamondOutline({ className }: { className: string }) {
  return (
    <span className={`sk-spin absolute block h-[604px] w-[604px] ${className}`}>
      <Image
        src="/layers/diamond-dotted.svg"
        alt=""
        width={604}
        height={604}
        unoptimized
      />
    </span>
  );
}

/** Open bracket from the header location group. Stroke box is 4×17. */
function Bracket({ side }: { side: "left" | "right" }) {
  const d =
    side === "left"
      ? "M4 17H2C0.895 17 0 16.1046 0 15V2C0 0.8954 0.895 0 2 0H4"
      : "M0 17H2C3.105 17 4 16.1046 4 15V2C4 0.8954 3.105 0 2 0H0";

  return (
    <svg
      width="4"
      height="17"
      viewBox="0 0 4 17"
      fill="none"
      aria-hidden="true"
    >
      <path d={d} stroke={INK} />
    </svg>
  );
}

/**
 * 44×44 diamond button. The outer stroke and triangle are always visible.
 * The inner dash matches the opacity-0 vector (34.57 box inset 4.71, dash 1 4)
 * and only appears while the button is hovered.
 */
function DiamondButton({ direction }: { direction: "left" | "right" }) {
  const triangle =
    direction === "left"
      ? "M15.7144 22L25.1429 27.4436V16.5564L15.7144 22Z"
      : "M27.436 22L18.007 27.4436V16.5564L27.436 22Z";

  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
    >
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
