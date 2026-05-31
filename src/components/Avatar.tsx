import clsx from "clsx";
import type { PlayerAvatar } from "@/lib/types";

export function Avatar({
  avatar,
  size = "md",
  ring = false,
}: {
  avatar: PlayerAvatar;
  size?: "sm" | "md" | "lg" | "xl";
  ring?: boolean;
}) {
  const sizeMap = {
    sm: "w-8 h-8 text-base",
    md: "w-12 h-12 text-2xl",
    lg: "w-20 h-20 text-4xl",
    xl: "w-32 h-32 text-6xl",
  } as const;
  return (
    <div
      className={clsx(
        "rounded-full flex items-center justify-center select-none",
        sizeMap[size],
        ring && "ring-4 ring-white/30"
      )}
      style={{ backgroundColor: avatar.color }}
    >
      <span>{avatar.emoji}</span>
    </div>
  );
}
