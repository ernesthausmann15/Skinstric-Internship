"use client";

import { useState } from "react";
import { formatScore, type ConfidenceScore } from "@/lib/analyze-portrait";
import { ConfidenceCircle } from "@/components/layers/phase2/confidence-circle";

/**
 * Phase 2, Layer 5 is the age page of the demographics review.
 * The supplied frame is the same 1024×512 artboard as the race page, scaled
 * by 1920/1024. Age is the ink card, and 20-29 is the ink row at 96%.
 * The gray row under it is only the pointer, so it rests clear and darkens
 * on hover. The two diamonds beside the title page between demographic
 * groups: the left one returns to race, and the right one is the forward
 * control. A row click rewrites the large age, the circle, and the card.
 * Reset restores 20-29. Back and Confirm return to the analysis diamond.
 */
const INK = "#1A1B1C";

export function Layer5({
  ages,
  raceName,
  sexName,
  onBack,
  onConfirm,
  onPrevious,
  onNext,
  onRace,
}: {
  ages: ConfidenceScore[];
  raceName: string;
  sexName: string;
  onBack?: () => void;
  onConfirm?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onRace?: () => void;
}) {
  const [picked, setPicked] = useState(0);
  const selected = ages[picked] ?? ages[0] ?? { name: "—", display: "—", value: 0 };

  return (
    <section
      className="relative h-[960px] w-[1920px] overflow-hidden bg-[#FCFCFC] text-[#1A1B1C]"
      aria-label="Demographics age"
    >
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

      <p className="absolute top-[86px] left-[32px] text-[16px] leading-[24px] font-semibold tracking-[-0.32px] uppercase">
        A. I. Analysis
      </p>
      <h1 className="absolute top-[120px] left-[32px] text-[60px] leading-[64px] font-normal tracking-[-1.8px] uppercase">
        Demographics
      </h1>
      <button
        type="button"
        aria-label="Previous demographic"
        onClick={onPrevious}
        className="sk-nav absolute top-[91px] left-[542px] cursor-pointer border-0 bg-transparent p-0"
      >
        <PagerDiamond direction="left" />
      </button>
      <button
        type="button"
        aria-label="Next demographic"
        onClick={onNext}
        className="sk-nav absolute top-[91px] left-[592px] cursor-pointer border-0 bg-transparent p-0"
      >
        <PagerDiamond direction="right" />
      </button>
      <p className="absolute top-[196px] left-[32px] text-[12px] leading-[16px] font-semibold tracking-[0.6px] uppercase">
        Predicted race &amp; age
      </p>

      <button
        type="button"
        onClick={onRace}
        className="absolute top-[304px] left-[32px] flex h-[101px] w-[208px] cursor-pointer flex-col items-start justify-between border-0 bg-[#F3F3F3] px-[17px] py-[17px] text-left text-[#1A1B1C] transition-colors duration-300 hover:bg-[#E1E1E1]"
      >
        <span className="text-[12px] leading-[16px] font-semibold tracking-[-0.24px] uppercase">
          {raceName}
        </span>
        <span className="text-[12px] leading-[16px] font-semibold tracking-[0.4px] uppercase">
          Race
        </span>
      </button>
      <div className="absolute top-[418px] left-[32px] flex h-[101px] w-[208px] flex-col items-start justify-between bg-[#1A1B1C] px-[17px] py-[17px] text-[#FCFCFC]">
        <span className="text-[12px] leading-[16px] font-semibold tracking-[-0.24px] uppercase">
          {selected.name}
        </span>
        <span className="text-[12px] leading-[16px] font-semibold tracking-[0.4px] uppercase">
          Age
        </span>
      </div>
      <div className="absolute top-[529px] left-[32px] flex h-[101px] w-[208px] flex-col items-start justify-between bg-[#F3F3F3] px-[17px] py-[17px] text-[#1A1B1C]">
        <span className="text-[12px] leading-[16px] font-semibold tracking-[-0.24px] uppercase">
          {sexName}
        </span>
        <span className="text-[12px] leading-[16px] font-semibold tracking-[0.4px] uppercase">
          Sex
        </span>
      </div>

      <div className="absolute top-[306px] left-[255px] h-[540px] w-[1170px] bg-[#F3F3F3]">
        <p className="absolute top-[26px] left-[19px] text-[32px] leading-[40px] font-normal">
          {selected.name} y.o.
        </p>
        <ConfidenceCircle value={selected?.value ?? 0} />
      </div>

      <div className="absolute top-[306px] left-[1440px] h-[540px] w-[448px] bg-[#F3F3F3]">
        <div className="flex h-[45px] items-center justify-between px-[16px] text-[10px] leading-[16px] font-semibold tracking-[0.8px] uppercase">
          <span>Age</span>
          <span>A. I. Confidence</span>
        </div>
        <ul className="m-0 list-none p-0">
          {ages.map((option, index) => {
            const active = index === picked;
            return (
              <li key={option.name}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPicked(index)}
                  className={`flex h-[49px] w-full cursor-pointer items-center gap-[12px] border-0 px-[16px] text-left text-[14px] leading-[16px] font-semibold tracking-[-0.28px] transition-colors duration-300 ${
                    active
                      ? "bg-[#1A1B1C] text-[#FCFCFC]"
                      : "bg-transparent text-[#1A1B1C] hover:bg-[#E1E1E1]"
                  }`}
                >
                  <DiamondMark filled={active} />
                  <span className="flex-1">{option.name}</span>
                  <span>{formatScore(option.value)} %</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="sk-nav absolute top-[880px] left-[32px] flex h-[44px] items-center gap-[16px] border-0 bg-transparent p-0 font-[inherit] text-inherit"
      >
        <PagerDiamond direction="left" />
        <span className="sk-nav-label text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          back
        </span>
      </button>

      <p className="absolute top-[896px] left-1/2 w-max -translate-x-1/2 text-[12px] leading-[16px] font-normal tracking-[0.4px] text-[#1A1B1C]/50 uppercase">
        If A.I. estimate is wrong, select the correct one.
      </p>

      <button
        type="button"
        onClick={() => setPicked(0)}
        className="absolute top-[889px] left-[1703px] h-[36px] w-[75px] cursor-pointer border border-[#1A1B1C] bg-transparent text-[12px] leading-[16px] font-semibold tracking-[0.6px] uppercase transition-colors duration-300 hover:bg-[#E1E1E1]"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="absolute top-[889px] left-[1793px] h-[36px] w-[96px] cursor-pointer border border-[#1A1B1C] bg-[#1A1B1C] text-[12px] leading-[16px] font-semibold tracking-[0.6px] text-[#FCFCFC] uppercase"
      >
        Confirm
      </button>
    </section>
  );
}

function DiamondMark({ filled }: { filled: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path
        d="M5.5 0.7L10.3 5.5L5.5 10.3L0.7 5.5L5.5 0.7Z"
        fill={filled ? "#FCFCFC" : "none"}
        stroke={filled ? "#FCFCFC" : INK}
      />
    </svg>
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

function PagerDiamond({ direction }: { direction: "left" | "right" }) {
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
