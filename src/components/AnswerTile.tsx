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
        "relative w-full min-h-[100px] rounded-2xl px-5 py-4 text-left text-white text-lg md:text-xl font-bold shadow-lg transition border-2",
        "active:scale-[0.99]",
        selected ? "border-white" : "border-transparent",
        state === "correct" && "ring-4 ring-emerald-300",
        state === "wrong" && "opacity-60",
        disabled && "cursor-not-allowed"
      )}
      style={{ backgroundColor: color }}
    >
      <div className="flex items-center gap-4">
        {showShape && <span className="text-3xl drop-shadow">{shape}</span>}
        <span className="flex-1">{text}</span>
        {typeof count === "number" && (
          <span className="ml-auto rounded-full bg-black/30 px-3 py-1 text-sm">
            {count}
          </span>
        )}
      </div>
    </button>
  );
}
