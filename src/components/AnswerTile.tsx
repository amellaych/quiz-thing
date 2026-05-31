"use client";
import clsx from "clsx";
import { ANSWER_COLORS, ANSWER_SHAPES } from "@/lib/types";

export function AnswerTile({
  index,
  text,
  selected,
  disabled,
  onClick,
  state, // 'correct' | 'wrong' | 'neutral'
  showShape = true,
  count,
}: {
  index: number;
  text?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  state?: "correct" | "wrong" | "neutral";
  showShape?: boolean;
  count?: number;
}) {
  const color = ANSWER_COLORS[index % ANSWER_COLORS.length];
  const shape = ANSWER_SHAPES[index % ANSWER_SHAPES.length];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "group relative w-full min-h-[92px] overflow-hidden rounded-2xl px-5 py-4 text-left text-white text-lg md:text-xl font-bold shadow-lg transition-all duration-150 border-2",
        !disabled && "hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.98] cursor-pointer",
        selected ? "border-white ring-4 ring-white/40" : "border-transparent",
        state === "correct" && "ring-4 ring-emerald-300 scale-[1.02]",
        state === "wrong" && "opacity-50 saturate-50",
        disabled && !state && "cursor-default"
      )}
      style={{ backgroundColor: color }}
    >
      {/* glossy top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
      <div className="relative flex items-center gap-4">
        {showShape && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-black/20 text-2xl drop-shadow">
            {shape}
          </span>
        )}
        <span className="flex-1 leading-tight">{text}</span>
        {state === "correct" && <span className="text-2xl">✓</span>}
        {typeof count === "number" && (
          <span className="ml-auto rounded-full bg-black/35 px-3 py-1 text-sm tabular-nums">
            {count}
          </span>
        )}
      </div>
    </button>
  );
}
