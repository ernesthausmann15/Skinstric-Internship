/**
 * The ring is the confidence score, not a fixed outline.
 * A full faint circle stays in place so the frame still reads as a circle.
 * The ink arc starts at the top and eases to the selected percentage, using
 * the same 700ms ease as the rest of the intro's movement.
 */
export function ConfidenceCircle({ value }: { value: number | null }) {
  const size = 383;
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = value ?? 0;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="absolute top-[135px] left-[769px] h-[383px] w-[383px]">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A1B1C"
          strokeOpacity={0.15}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A1B1C"
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 700ms ease",
          }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[32px] leading-[40px] font-normal">
        {value === null ? "" : `${value.toFixed(2)}%`}
      </span>
    </div>
  );
}
