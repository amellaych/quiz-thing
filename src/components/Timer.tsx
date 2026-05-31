"use client";
import { useEffect, useState } from "react";

/**
 * Circular countdown ring. If `startsAt` is provided, the ring depletes
 * smoothly over the question's duration; otherwise it just shows seconds.
 */
export function Timer({ startsAt, endsAt }: { startsAt?: number; endsAt?: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(i);
  }, []);
  if (!endsAt) return null;

  const remainingMs = Math.max(0, endsAt - now);
  const remaining = Math.ceil(remainingMs / 1000);
  const total = startsAt ? Math.max(1, endsAt - startsAt) : remainingMs || 1;
  const frac = Math.max(0, Math.min(1, remainingMs / total));
  const danger = remaining <= 5;

  const R = 26;
  const C = 2 * Math.PI * R;
  const dash = C * frac;

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke={danger ? "#f43f5e" : "#a5b4fc"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          style={{ transition: "stroke-dasharray 0.2s linear, stroke 0.3s" }}
        />
      </svg>
      <div
        className={`absolute inset-0 grid place-items-center text-xl font-black tabular-nums ${
          danger ? "text-rose-400 animate-pulse" : "text-white"
        }`}
      >
        {remaining}
      </div>
    </div>
  );
}
