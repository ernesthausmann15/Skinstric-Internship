import Image from "next/image";

/**
 * Phase 2, Layer 2 is Figma node 12:15850, the camera-setup state.
 * The artboard is 1920×960 and both diamonds share the center (960, 480).
 * The 604 diamond is the faint outer ring, turned 15.1° counter-clockwise.
 * The 407 diamond is the solid inner ring, turned 14.8° clockwise.
 * A parent holds that starting angle so the first paint matches the frame.
 * The child uses the same spin as the rest of the intro, so the rings keep
 * turning after the screen appears. The dashed circle around the shutter is
 * visible here because the camera is already the active choice.
 */
const INK = "#1A1B1C";

const DIAMONDS = [
  {
    src: "/layers/diamond-dotted.svg",
    size: 604,
    left: 658,
    top: 178,
    angle: -15.1,
    speed: "sk-spin-outer sk-spin-reverse",
    opacity: "opacity-30",
  },
  {
    src: "/layers/phase2/diamond-407.svg",
    size: 407.18164,
    left: 756.40918,
    top: 276.40918,
    angle: 14.8,
    speed: "sk-spin-inner",
    opacity: "",
  },
] as const;

const TIPS = [
  { bullet: 688.5, text: 705.5, label: "Neutral Expression" },
  { bullet: 882.5, text: 900, label: "Frontal Pose" },
  { bullet: 1030, text: 1048.5, label: "Adequate Lighting" },
] as const;

export function Layer2() {
  return (
    <section
      className="phase2-setup relative h-[960px] w-[1920px] overflow-hidden bg-[#FCFCFC] text-[#1A1B1C]"
      aria-label="Setting up camera"
    >
      {DIAMONDS.map((diamond) => (
        <span
          key={diamond.src}
          className="pointer-events-none absolute block"
          style={{
            left: diamond.left,
            top: diamond.top,
            width: diamond.size,
            height: diamond.size,
            transform: `rotate(${diamond.angle}deg)`,
          }}
        >
          <span className={`sk-spin ${diamond.speed} ${diamond.opacity} block h-full w-full`}>
            <Image
              src={diamond.src}
              alt=""
              width={diamond.size}
              height={diamond.size}
              unoptimized
            />
          </span>
        </span>
      ))}

      <Image
        className="phase2-dash absolute top-[412px] left-[892px]"
        src="/layers/phase2/dash-ring.svg"
        alt=""
        width={136}
        height={136}
        unoptimized
      />
      <Image
        className="absolute top-[421.5px] left-[901.5px]"
        src="/layers/phase2/12-15768.svg"
        alt=""
        width={117}
        height={117}
        unoptimized
      />

      <p className="absolute top-[570px] left-1/2 w-max -translate-x-1/2 text-[14px] leading-[16px] font-semibold tracking-[0.4px] uppercase">
        Setting up camera ...
      </p>

      <p className="absolute top-[731px] left-1/2 w-max -translate-x-1/2 text-[12px] leading-[16px] font-normal tracking-[0.6px] uppercase">
        To get better results make sure to have
      </p>

      {TIPS.map((tip) => (
        <p
          key={tip.label}
          className="absolute top-[770px] flex items-center gap-[6px] text-[12px] leading-[16px] font-normal tracking-[0.4px] uppercase"
          style={{ left: tip.bullet }}
        >
          <Bullet />
          {tip.label}
        </p>
      ))}
    </section>
  );
}

function Bullet() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M5.5 0.7L10.3 5.5L5.5 10.3L0.7 5.5L5.5 0.7Z" stroke={INK} />
    </svg>
  );
}
