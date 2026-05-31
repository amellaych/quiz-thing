"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AVATAR_COLORS, AVATAR_EMOJIS, type PlayerAvatar } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Background } from "@/components/Background";
import { emitWithAck, getSocket } from "@/lib/socket";

function JoinPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [pin, setPin] = useState(params.get("pin") || "");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<PlayerAvatar>({
    emoji: AVATAR_EMOJIS[0],
    color: AVATAR_COLORS[0],
  });
  const [step, setStep] = useState<"pin" | "avatar">("pin");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (params.get("pin")) setStep("pin");
  }, [params]);

  async function handleSubmitPin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError("Enter the game PIN (digits)");
      return;
    }
    setError(null);
    setStep("avatar");
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nickname.trim()) {
      setError("Pick a nickname");
      return;
    }
    setJoining(true);
    // Eagerly connect.
    getSocket();
    const resp = await emitWithAck<{ ok: boolean; error?: string }>("player:join", {
      pin,
      nickname: nickname.trim(),
      avatar,
    });
    setJoining(false);
    if (!resp.ok) {
      setError(resp.error || "Could not join");
      return;
    }
    sessionStorage.setItem(
      "quiz-thing:player",
      JSON.stringify({ pin, nickname: nickname.trim(), avatar })
    );
    router.push("/play");
  }

  return (
    <>
      <Background themeId="grape" />
      <main className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <Link href="/" className="text-slate-300 hover:text-white text-sm">
        ← Home
      </Link>

      {step === "pin" && (
        <form onSubmit={handleSubmitPin} className="card p-6 mt-6 shadow-glow animate-pop-in">
          <h1 className="text-3xl font-black text-center mb-1">Join a game</h1>
          <p className="text-slate-300 text-center mb-6">
            Ask the host for the 6-digit PIN
          </p>
          <input
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            placeholder="123456"
            className="input text-center text-3xl tracking-[0.5em] font-black"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
          {error && <p className="text-rose-300 text-sm mt-3">{error}</p>}
          <button className="btn-primary w-full mt-5 text-lg">Continue →</button>
        </form>
      )}

      {step === "avatar" && (
        <form onSubmit={handleJoin} className="card p-6 mt-6 shadow-glow animate-pop-in">
          <h1 className="text-2xl font-bold mb-1">Make your character</h1>
          <p className="text-slate-300 text-sm mb-5">PIN: {pin}</p>

          <div className="flex justify-center mb-4">
            <Avatar avatar={avatar} size="xl" ring />
          </div>

          <label className="label">Pick an emoji</label>
          <div className="grid grid-cols-10 gap-1 mb-4">
            {AVATAR_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setAvatar((a) => ({ ...a, emoji: e }))}
                className={`aspect-square rounded-md text-2xl transition ${
                  avatar.emoji === e ? "bg-white/20 ring-2 ring-white scale-110" : "hover:bg-white/10"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <label className="label">Pick a color</label>
          <div className="grid grid-cols-10 gap-2 mb-4">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAvatar((a) => ({ ...a, color: c }))}
                className={`aspect-square rounded-full transition ${
                  avatar.color === c ? "ring-2 ring-white scale-110" : "hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <label className="label">Nickname</label>
          <input
            className="input"
            maxLength={18}
            placeholder="Your name"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoFocus
          />

          {error && <p className="text-rose-300 text-sm mt-3">{error}</p>}
          <button className="btn-primary w-full mt-5 text-lg" disabled={joining}>
            {joining ? "Joining…" : "Enter game →"}
          </button>
          <button
            type="button"
            className="btn-ghost w-full mt-2"
            onClick={() => setStep("pin")}
          >
            ← Back
          </button>
        </form>
      )}
      </main>
    </>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading…</div>}>
      <JoinPageInner />
    </Suspense>
  );
}
