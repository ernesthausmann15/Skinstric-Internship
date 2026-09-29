"use client";

import { useEffect, useState } from "react";
import { formatScore, type ConfidenceScore, type PortraitAnalysis } from "@/lib/analyze-portrait";
import { ConfidenceCircle } from "@/components/layers/phase2/confidence-circle";

/**
 * Phase 2 demographics review. Positions are the 1024×512 frame scaled by
 * 1920/1024. Race, age, and sex are the three lists from one portrait read.
 * A new scan resets every card to that read's top score. The open list is
 * the active card: race, then age, then sex. A row click moves the large
 * name, the card, and the ring. The ring eases to that percentage.
 * Reset restores the latest A.I. picks. Age adds the "y.o." label and the
 * pager diamonds from the age frame.
 */
const INK = "#1A1B1C";

type GroupId = "race" | "age" | "sex";

type Group = {
  id: GroupId;
  label: string;
  options: ConfidenceScore[];
};

const EMPTY: ConfidenceScore = { name: "—", display: "—", value: 0 };

const CARDS = [
  { id: "race" as const, top: 304 },
  { id: "age" as const, top: 418 },
  { id: "sex" as const, top: 529 },
];

const ORDER: GroupId[] = ["race", "age", "sex"];

export function Layer4({
  analysis,
  scanId,
  onBack,
  onConfirm,
}: {
  analysis: PortraitAnalysis;
  scanId: number;
  onBack?: () => void;
  onConfirm?: () => void;
}) {
  const groups: Group[] = [
    { id: "race", label: "Race", options: analysis.race },
    { id: "age", label: "Age", options: analysis.age },
    { id: "sex", label: "Sex", options: analysis.sex },
  ];
  const [groupId, setGroupId] = useState<GroupId>("race");
  const [picked, setPicked] = useState({ race: 0, age: 0, sex: 0 });

  // A new gallery file or camera frame replaces the whole read. The open
  // list and every card go back to that portrait's highest score.
  useEffect(() => {
    setGroupId("race");
    setPicked({ race: 0, age: 0, sex: 0 });
  }, [scanId]);

  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const selected = group.options[picked[group.id]] ?? group.options[0] ?? EMPTY;
  const title = group.id === "age" ? `${selected.name} y.o.` : selected.display;

  return (
    <section
      className="relative h-[960px] w-[1920px] overflow-hidden bg-[#FCFCFC] text-[#1A1B1C]"
      aria-label="Demographics"
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
      {groupId !== "race" ? (
        <>
          <button
            type="button"
            aria-label="Previous demographic"
            onClick={() => setGroupId(ORDER[(ORDER.indexOf(groupId) + ORDER.length - 1) % ORDER.length])}
            className="sk-nav absolute top-[91px] left-[542px] cursor-pointer border-0 bg-transparent p-0"
          >
            <PagerDiamond direction="left" />
          </button>
          <button
            type="button"
            aria-label="Next demographic"
            onClick={() => setGroupId(ORDER[(ORDER.indexOf(groupId) + 1) % ORDER.length])}
            className="sk-nav absolute top-[91px] left-[592px] cursor-pointer border-0 bg-transparent p-0"
          >
            <PagerDiamond direction="right" />
          </button>
        </>
      ) : null}
      <p className="absolute top-[196px] left-[32px] text-[12px] leading-[16px] font-semibold tracking-[0.6px] uppercase">
        Predicted race &amp; age
      </p>

      {CARDS.map((card) => {
        const item = groups.find((groupItem) => groupItem.id === card.id) ?? groups[0];
        const active = item.id === group.id;
        const value = (item.options[picked[item.id]] ?? item.options[0] ?? EMPTY).name;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => setGroupId(item.id)}
            className={`absolute left-[32px] flex h-[101px] w-[208px] cursor-pointer flex-col items-start justify-between border-0 px-[17px] py-[17px] text-left transition-colors duration-300 ${
              active
                ? "bg-[#1A1B1C] text-[#FCFCFC]"
                : "bg-[#F3F3F3] text-[#1A1B1C] hover:bg-[#E1E1E1]"
            }`}
            style={{ top: card.top }}
          >
            <span className="text-[12px] leading-[16px] font-semibold tracking-[-0.24px] uppercase">
              {value}
            </span>
            <span className="text-[12px] leading-[16px] font-semibold tracking-[0.4px] uppercase">
              {item.label}
            </span>
          </button>
        );
      })}

      <div className="absolute top-[306px] left-[255px] h-[540px] w-[1170px] bg-[#F3F3F3]">
        <p className="absolute top-[26px] left-[19px] text-[32px] leading-[40px] font-normal">
          {title}
        </p>
        <ConfidenceCircle value={selected.value} />
      </div>

      <div className="absolute top-[306px] left-[1440px] h-[540px] w-[448px] bg-[#F3F3F3]">
        <div className="flex h-[45px] items-center justify-between px-[16px] text-[10px] leading-[16px] font-semibold tracking-[0.8px] uppercase">
          <span>{group.label}</span>
          <span>A. I. Confidence</span>
        </div>
        <ul className="m-0 list-none p-0">
          {group.options.map((option, index) => {
            const active = index === picked[group.id];
            return (
              <li key={option.name}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    // The row is the visitor's correction. The matching card
                    // on the left reads this same index, so the sidebar name
                    // changes on this click.
                    setPicked((current) => ({ ...current, [group.id]: index }));
                  }}
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
        <DiamondButton />
        <span className="sk-nav-label text-[14px] leading-[16px] font-semibold tracking-[-0.28px] uppercase opacity-70 transition-opacity duration-300">
          back
        </span>
      </button>

      <p className="absolute top-[896px] left-1/2 w-max -translate-x-1/2 text-[12px] leading-[16px] font-normal tracking-[0.4px] text-[#1A1B1C]/50 uppercase">
        If A.I. estimate is wrong, select the correct one.
      </p>

      <button
        type="button"
            onClick={() => setPicked({ race: 0, age: 0, sex: 0 })}
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

function DiamondButton() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M43.293 22L22 43.293L0.707031 22L22 0.707031L43.293 22Z" stroke={INK} />
      <path
        className="sk-nav-dash"
        d="M22 5.21L38.781 22L22 38.781L5.21 22L22 5.21Z"
        stroke={INK}
        strokeDasharray="1 4"
      />
      <path d="M15.7144 22L25.1429 27.4436V16.5564L15.7144 22Z" fill={INK} />
    </svg>
  );
}
