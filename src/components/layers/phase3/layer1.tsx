"use client";

import Image from "next/image";

/**
 * Phase 3, Layer 1 is Figma node 12:15803.
 * It is the camera-permission state of the analysis choice. The gallery group
 * is dropped to 25% opacity, the camera diamonds keep turning, and the dashed
 * icon ring stays visible because that choice is active. The permission card
 * is the black box measured at (592, 442), 352×136: a 100px title band, a 1px
 * rule, and a 35px footer with Deny and Allow.
 */
const INK = "#1A1B1C";

const RINGS = [
  {
    src: "/layers/phase2/diamond-484.svg",
    width: 484,
    height: 484,
    speed: "phase2-spin-outer",
    opacity: "opacity-30",
  },
  {
    src: "/layers/phase2/diamond-446.svg",
    width: 446.34375,
    height: 446.34375,
    speed: "phase2-spin-middle",
    opacity: "opacity-60",
  },
  {
    src: "/layers/phase2/diamond-407.svg",
    width: 407.18164,
    height: 407.18164,
    speed: "phase2-spin-inner",
    opacity: "",
  },
] as const;

export function Layer1({
  onBack,
  onDeny,
  onAllow,
  granted = false,
}: {
  onBack?: () => void;
  onDeny?: () => void;
  onAllow?: () => void;
  granted?: boolean;
}) {
  return (
    <section
      className="relative h-[960px] w-[1920px] overflow-hidden bg-[#FCFCFC] text-[#1A1B1C]"
      aria-label="Allow camera access"
    >
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

      <Choice
        label="Allow A.I. to scan your face"
        className="phase3-camera top-[240px] left-[239px] h-[482px] w-[520px]"
        rings={[
          { left: -1, top: -1 },
          { left: 17.828125, top: 17.828125 },
          { left: 37.40918, top: 37.40918 },
        ]}
        dash={{ left: 173, top: 173 }}
        icon={{ src: "/layers/phase2/12-15768.svg", left: 182.495, top: 182.495 }}
        connector={{ src: "/layers/phase2/12-15776.svg", left: 281, top: 143 }}
        title={{
          left: 353,
          top: 126,
          width: 167,
          align: "left",
          lines: ["Allow A.I.", "to Scan Your Face"],
        }}
      />

      <Choice
        label="Allow A.I. access gallery"
        className="pointer-events-none top-[240px] left-[1193px] h-[482px] w-[488px] opacity-25"
        rings={[
          { left: 5, top: -1 },
          { left: 23.828125, top: 17.828125 },
          { left: 43.40918, top: 37.40918 },
        ]}
        dash={{ left: 179, top: 173 }}
        icon={{ src: "/layers/phase2/12-15786.svg", left: 188.495, top: 182.495 }}
        connector={{ src: "/layers/phase2/12-15793.svg", left: 143.67, top: 281 }}
        title={{
          left: 0,
          top: 326,
          width: 136,
          align: "right",
          lines: ["Allow A.I.", "access Gallery"],
        }}
      />

      {granted ? null : (
        <div
          role="dialog"
          aria-labelledby="camera-permission-title"
          className="absolute top-[442px] left-[592px] z-10 flex h-[136px] w-[352px] flex-col bg-[#1A1B1C] text-[#FCFCFC]"
        >
          <div className="h-[100px] px-[16px] pt-[16px]">
            <p
              id="camera-permission-title"
              className="text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase"
            >
              Allow A.I. to access your camera
            </p>
          </div>
          <div className="h-px bg-[#FCFCFC]" />
          <div className="flex h-[35px] items-center justify-end gap-[46px] pr-[16px]">
            <button
              type="button"
              onClick={onDeny}
              className="border-0 bg-transparent p-0 text-[12px] leading-[16px] font-semibold tracking-[-0.24px] text-white/70 uppercase"
            >
              Deny
            </button>
            <button
              type="button"
              onClick={onAllow}
              className="border-0 bg-transparent p-0 text-[12px] leading-[16px] font-semibold tracking-[-0.24px] text-white uppercase"
            >
              Allow
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="phase2-back absolute top-[880px] left-[32px] flex h-[44px] items-center gap-[16px] border-0 bg-transparent p-0 font-[inherit] text-inherit"
      >
        <DiamondButton />
        <span className="phase2-back-label w-[37px] text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          back
        </span>
      </button>
    </section>
  );
}

function Choice({
  label,
  className,
  rings,
  dash,
  icon,
  connector,
  title,
}: {
  label: string;
  className: string;
  rings: { left: number; top: number }[];
  dash: { left: number; top: number };
  icon: { src: string; left: number; top: number };
  connector: { src: string; left: number; top: number };
  title: {
    left: number;
    top: number;
    width: number;
    align: "left" | "right";
    lines: [string, string];
  };
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`phase2-choice absolute border-0 bg-transparent p-0 font-[inherit] text-inherit ${className}`}
    >
      {RINGS.map((ring, index) => (
        <span
          key={ring.src}
          className={`phase2-spin ${ring.speed} ${ring.opacity} absolute block`}
          style={{
            left: rings[index].left,
            top: rings[index].top,
            width: ring.width,
            height: ring.height,
          }}
        >
          <Image src={ring.src} alt="" width={ring.width} height={ring.height} unoptimized />
        </span>
      ))}
      <Image
        className="phase2-dash absolute"
        style={{ left: dash.left, top: dash.top }}
        src="/layers/phase2/dash-ring.svg"
        alt=""
        width={136}
        height={136}
        unoptimized
      />
      <Image
        className="absolute"
        style={{ left: icon.left, top: icon.top }}
        src={icon.src}
        alt=""
        width={117}
        height={117}
        unoptimized
      />
      <Image
        className="absolute"
        style={{ left: connector.left, top: connector.top }}
        src={connector.src}
        alt=""
        width={67}
        height={60}
        unoptimized
      />
      <p
        className={`absolute text-[14px] leading-[24px] font-normal tracking-[0px] uppercase ${
          title.align === "right" ? "text-right" : "text-left"
        }`}
        style={{ left: title.left, top: title.top, width: title.width }}
      >
        {title.lines[0]}
        <br />
        {title.lines[1]}
      </p>
    </button>
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

function DiamondButton() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M43.293 22L22 43.293L0.707031 22L22 0.707031L43.293 22Z" stroke={INK} />
      <path
        className="phase2-back-dash"
        d="M22 5.21L38.781 22L22 38.781L5.21 22L22 5.21Z"
        stroke={INK}
        strokeDasharray="1 4"
      />
      <path d="M15.7144 22L25.1429 27.4436V16.5564L15.7144 22Z" fill={INK} />
    </svg>
  );
}
