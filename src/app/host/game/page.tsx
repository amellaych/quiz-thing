"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSocket, emitWithAck } from "@/lib/socket";
import type { GameSnapshot, Quiz } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Timer } from "@/components/Timer";
import { AnswerTile } from "@/components/AnswerTile";

export default function HostGamePage() {
  const [pin, setPin] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [progress, setProgress] = useState<{ answered: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string>("");

  useEffect(() => {
    const raw = sessionStorage.getItem("quiz-thing:active-quiz");
    if (!raw) {
      setError("No quiz to host. Build one first.");
      return;
    }
    let quiz: Quiz;
    try {
      quiz = JSON.parse(raw);
    } catch {
      setError("Saved quiz is corrupted.");
      return;
    }
    const socket = getSocket();

    const onSnap = (s: GameSnapshot) => setSnapshot(s);
    const onProgress = (p: { answered: number; total: number }) => setProgress(p);
    socket.on("game:snapshot", onSnap);
    socket.on("host:answer-progress", onProgress);

    (async () => {
      try {
        const resp = await emitWithAck<{ ok: boolean; pin?: string; error?: string }>(
          "host:create",
          { quiz }
        );
        if (!resp.ok || !resp.pin) {
          setError(resp.error || "Failed to create game");
          return;
        }
        setPin(resp.pin);
        const url = `${window.location.origin}/join?pin=${resp.pin}`;
        setJoinUrl(url);
      } catch (e: any) {
        setError(e?.message || "Connection failed");
      }
    })();

    return () => {
      socket.off("game:snapshot", onSnap);
      socket.off("host:answer-progress", onProgress);
    };
  }, []);

  const phase = snapshot?.phase;
  const q = snapshot?.currentQuestion;

  async function start() {
    if (!pin) return;
    const r = await emitWithAck<{ ok: boolean; error?: string }>("host:start", { pin });
    if (!r.ok) setError(r.error || "Could not start");
  }
  async function next() {
    if (!pin) return;
    setProgress(null);
    await emitWithAck("host:next", { pin });
  }

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center px-6">
        <div className="card p-8 max-w-md text-center">
          <div className="text-3xl mb-2">😬</div>
          <p className="text-rose-300 mb-4">{error}</p>
          <Link href="/host" className="btn-primary">
            Back to builder
          </Link>
        </div>
      </main>
    );
  }

  if (!pin || !snapshot) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="text-slate-400 animate-pulse">Connecting…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-xl font-black">
            Q
          </div>
          <div>
            <div className="text-sm text-slate-400">Hosting</div>
            <div className="font-bold">{snapshot.quizTitle}</div>
          </div>
        </div>
        <div className="pill">
          {snapshot.phase.toUpperCase()} • Question{" "}
          {Math.min(snapshot.questionIndex + 1, snapshot.totalQuestions)} /{" "}
          {snapshot.totalQuestions}
        </div>
      </header>

      {phase === "lobby" && (
        <LobbyView pin={pin} joinUrl={joinUrl} snapshot={snapshot} onStart={start} />
      )}

      {phase === "question" && q && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl md:text-4xl font-bold flex-1">{q.prompt}</h2>
            <Timer endsAt={snapshot.questionEndsAt} />
          </div>
          {q.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={q.imageUrl}
              alt=""
              className="rounded-xl max-h-64 mx-auto mb-4 object-cover"
            />
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {q.options.map((o, i) => (
              <AnswerTile key={o.id} index={i} text={o.text} disabled />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="text-slate-300">
              Answers in:{" "}
              <span className="font-bold text-white">
                {progress?.answered ?? 0}/{progress?.total ?? snapshot.players.length}
              </span>
            </div>
            <button onClick={next} className="btn-ghost">
              Skip / Reveal →
            </button>
          </div>
        </section>
      )}

      {phase === "reveal" && q && (
        <RevealView
          snapshot={snapshot}
          onNext={next}
        />
      )}

      {phase === "leaderboard" && (
        <LeaderboardView snapshot={snapshot} onNext={next} />
      )}

      {phase === "finished" && <FinalView snapshot={snapshot} />}
    </main>
  );
}

function LobbyView({
  pin,
  joinUrl,
  snapshot,
  onStart,
}: {
  pin: string;
  joinUrl: string;
  snapshot: GameSnapshot;
  onStart: () => void;
}) {
  const qrSrc = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`,
    [joinUrl]
  );
  const [copied, setCopied] = useState(false);
  return (
    <section className="grid lg:grid-cols-[420px,1fr] gap-6">
      <div className="card p-6 shadow-glow">
        <div className="text-sm uppercase tracking-wider text-slate-400">Game PIN</div>
        <div className="text-6xl font-black tracking-[0.2em] mt-2 mb-4 tabular-nums">
          {pin}
        </div>
        <div className="text-sm text-slate-300 mb-2">Join at</div>
        <div className="flex items-center gap-2 mb-4">
          <code className="text-sm bg-black/40 px-3 py-2 rounded flex-1 truncate">
            {joinUrl}
          </code>
          <button
            className="btn-ghost text-sm"
            onClick={() => {
              navigator.clipboard.writeText(joinUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt="QR code" className="rounded-lg bg-white p-2 mx-auto" />
        <button
          onClick={onStart}
          disabled={snapshot.players.length === 0}
          className="btn-primary w-full mt-6 text-lg disabled:opacity-50"
        >
          Start game ({snapshot.players.length} player
          {snapshot.players.length === 1 ? "" : "s"})
        </button>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Players in lobby</h2>
          <span className="pill">{snapshot.players.length} joined</span>
        </div>
        {snapshot.players.length === 0 ? (
          <div className="text-slate-400 italic">
            Waiting for players to join… Share the PIN with your class.
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {snapshot.players.map((p) => (
              <li
                key={p.id}
                className="card !rounded-xl flex flex-col items-center p-3 animate-[fadeIn_0.3s_ease]"
              >
                <Avatar avatar={p.avatar} size="lg" />
                <div className="mt-2 font-semibold truncate w-full text-center">
                  {p.nickname}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function RevealView({
  snapshot,
  onNext,
}: {
  snapshot: GameSnapshot;
  onNext: () => void;
}) {
  const q = snapshot.currentQuestion!;
  const stats = snapshot.answerStats;
  const correctSet = new Set(stats?.correctOptionIds || []);
  const max = Math.max(1, ...Object.values(stats?.counts || { _: 1 }));
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl md:text-4xl font-bold flex-1">{q.prompt}</h2>
        <button onClick={onNext} className="btn-primary">
          Show leaderboard →
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {q.options.map((o, i) => {
          const c = stats?.counts[o.id] ?? 0;
          const w = `${(c / max) * 100}%`;
          return (
            <div key={o.id} className="relative">
              <AnswerTile
                index={i}
                text={o.text}
                disabled
                state={correctSet.has(o.id) ? "correct" : "wrong"}
                count={c}
              />
              <div className="h-2 mt-1 rounded bg-white/10 overflow-hidden">
                <div className="h-full bg-white/60" style={{ width: w }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-slate-300">
        {stats?.totalAnswered ?? 0} of {snapshot.players.length} answered.
      </div>
    </section>
  );
}

function LeaderboardView({
  snapshot,
  onNext,
}: {
  snapshot: GameSnapshot;
  onNext: () => void;
}) {
  const top = snapshot.players.slice(0, 10);
  const isLast = snapshot.questionIndex + 1 >= snapshot.totalQuestions;
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold">Leaderboard</h2>
        <button onClick={onNext} className="btn-primary">
          {isLast ? "Show final results →" : "Next question →"}
        </button>
      </div>
      <ol className="space-y-2">
        {top.map((p, i) => (
          <li
            key={p.id}
            className="card flex items-center gap-4 p-4"
            style={{
              background:
                i === 0
                  ? "linear-gradient(90deg, rgba(234,179,8,0.18), transparent)"
                  : undefined,
            }}
          >
            <div className="w-10 text-2xl font-black text-slate-400">{i + 1}</div>
            <Avatar avatar={p.avatar} size="md" />
            <div className="flex-1 font-semibold">{p.nickname}</div>
            {p.streak >= 2 && (
              <div className="pill !bg-orange-500/20 !text-orange-200">
                🔥 {p.streak}
              </div>
            )}
            <div className="text-xl font-black tabular-nums">{p.score}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FinalView({ snapshot }: { snapshot: GameSnapshot }) {
  const players = snapshot.finalLeaderboard || snapshot.players;
  const podium = players.slice(0, 3);
  const rest = players.slice(3);
  return (
    <section>
      <h2 className="text-4xl font-black text-center mb-2">🏆 Final results</h2>
      <p className="text-center text-slate-300 mb-8">
        {snapshot.quizTitle} — {snapshot.totalQuestions} questions
      </p>
      <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto items-end mb-10">
        {[1, 0, 2].map((idx) => {
          const p = podium[idx];
          if (!p) return <div key={idx} />;
          const heights = ["h-44", "h-56", "h-36"];
          const colors = [
            "from-slate-400 to-slate-600",
            "from-yellow-300 to-yellow-600",
            "from-orange-400 to-orange-700",
          ];
          const order = [1, 0, 2].indexOf(idx); // 0,1,2 visual position
          return (
            <div key={p.id} className="flex flex-col items-center">
              <Avatar avatar={p.avatar} size="xl" ring />
              <div className="mt-2 font-bold text-lg truncate max-w-full">
                {p.nickname}
              </div>
              <div className="text-2xl font-black tabular-nums">{p.score}</div>
              <div
                className={`w-full mt-3 rounded-t-xl bg-gradient-to-b ${colors[idx]} ${heights[idx]} grid place-items-center text-white text-3xl font-black`}
              >
                {idx + 1}
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="card p-4 max-w-2xl mx-auto">
          <h3 className="font-semibold mb-2 text-slate-300">Rest of the field</h3>
          <ol className="space-y-1">
            {rest.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-2 border-t border-white/5">
                <div className="w-8 text-slate-400 font-bold">{i + 4}</div>
                <Avatar avatar={p.avatar} size="sm" />
                <div className="flex-1 truncate">{p.nickname}</div>
                <div className="font-bold tabular-nums">{p.score}</div>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="text-center mt-10">
        <Link href="/host" className="btn-ghost">
          Build another quiz
        </Link>
      </div>
    </section>
  );
}
