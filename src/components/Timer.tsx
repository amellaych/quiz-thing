"use client";
import { useEffect, useState } from "react";

export function Timer({ endsAt }: { endsAt?: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(i);
  }, []);
  if (!endsAt) return null;
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const danger = remaining <= 5;
  return (
    <div
      className={`tabular-nums font-bold rounded-full px-5 py-2 text-2xl ${
        danger ? "bg-rose-600 animate-pulse" : "bg-white/15"
      }`}
    >
      {remaining}s
    </div>
  );
}
