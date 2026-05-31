"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSocket, emitWithAck } from "@/lib/socket";
import type { GameSnapshot, Quiz } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Timer } from "@/components/Timer";
import { AnswerTile } from "@/components/AnswerTile";
import { Background } from "@/components/Background";

export default function HostGamePage() {
  const [pin, setPin] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [progress, setProgress] = useState<{ answered: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string>("");
  const [lanJoinUrl, setLanJoinUrl] = useState<string>("");
  const [theme, setTheme] = useState<string | undefined>(undefined);
  const [themeImage, setThemeImage] = useState<string | undefined>(undefined);

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
    setTheme(quiz.theme);
    setThemeImage(quiz.themeImage);
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

        const origin = window.location.origin;
        const isLocal = /localhost|127\.0\.0\.1|\[::1\]/.test(origin);
        let base = origin;
        let lanBase = "";
        try {
          const cfg = await fetch("/api/config").then((r) => r.json());
          const publicUrl = cfg?.publicUrl ? String(cfg.publicUrl).replace(/\/$/, "") : "";
          lanBase = cfg?.lanUrl ? String(cfg.lanUrl).replace(/\/$/, "") : "";
          // Choose the most reachable base for the primary join link.
          if (publicUrl) base = publicUrl;
          else if (isLocal && lanBase) base = lanBase;
        } catch {}

        setJoinUrl(`${base}/join?pin=${resp.pin}`);
        if (lanBase) {
          const lanFull = `${lanBase}/join?pin=${resp.pin}`;
          if (lanFull !== `${base}/join?pin=${resp.pin}`) setLanJoinUrl(lanFull);
        }
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

  const bgTheme = snapshot?.quizTheme ?? theme;
  const bgImage = snapshot?.quizThemeImage ?? themeImage;

  if (error) {
    return (
      <>
        <Background themeId={bgTheme} imageUrl={bgImage} />
        <main className="min-h-screen grid place-items-center px-6">
          <div className="card p-8 max-w-md text-center animate-pop-in">
            <div className="text-3xl mb-2">😬</div>
            <p className="text-rose-300 mb-4">{error}</p>
            <Link href="/host" className="btn-primary">
              Back to builder
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!pin || !snapshot) {
    return (
      <>
        <Background themeId={bgTheme} imageUrl={bgImage} />
        <main className="min-h-screen grid place-items-center">
          <div className="text-slate-300 animate-pulse text-lg">Connecting…</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Background themeId={bgTheme} imageUrl={bgImage} />
      <main className="min-h-screen px-4 md:px-8 py-6 max-w-7xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-xl font-black">
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
          <LobbyView
            pin={pin}
            joinUrl={joinUrl}
            lanJoinUrl={lanJoinUrl}
            snapshot={snapshot}
            onStart={start}
          />
        )}

        {phase === "question" && q && (
          <section className="animate-fade-in-up">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl md:text-4xl font-bold flex-1">{q.prompt}</h2>
              <Timer startsAt={snapshot.questionStartedAt} endsAt={snapshot.questionEndsAt} />
            </div>
            {q.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={q.imageUrl}
                alt=""
                className="rounded-2xl max-h-72 mx-auto mb-5 object-cover shadow-2xl"
              />
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {q.options.map((o, i) => (
                <AnswerTile key={o.id} index={i} text={o.text} disabled />
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="card px-4 py-2 text-slate-200">
                Answers in:{" "}
                <span className="font-bold text-white tabular-nums">
                  {progress?.answered ?? 0}/{progress?.total ?? snapshot.players.length}
                </span>
              </div>
              <button onClick={next} className="btn-ghost">
                Skip / Reveal →
              </button>
            </div>
          </section>
        )}

        {phase === "reveal" && q && <RevealView snapshot={snapshot} onNext={next} />}

        {phase === "leaderboard" && <LeaderboardView snapshot={snapshot} onNext={next} />}

        {phase === "finished" && <FinalView snapshot={snapshot} />}
      </main>
    </>
  );
}

function QR({ url, size = 200 }: { url: string; size?: number }) {
  const src = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(
        url
      )}`,
    [url, size]
  );
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="QR code" className="rounded-xl bg-white p-2" />;
}

function CopyField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="text-sm bg-black/40 px-3 py-2 rounded-lg flex-1 truncate">{url}</code>
      <button
        className="btn-ghost text-sm shrink-0"
        onClick={() => {
          navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

function LobbyView({
  pin,
  joinUrl,
  lanJoinUrl,
  snapshot,
  onStart,
}: {
  pin: string;
  joinUrl: string;
  lanJoinUrl: string;
  snapshot: GameSnapshot;
  onStart: () => void;
}) {
  return (
    <section className="grid lg:grid-cols-[440px,1fr] gap-6">
      <div className="space-y-4">
        <div className="card p-6 shadow-glow">
          <div className="text-sm uppercase tracking-wider text-slate-400">Game PIN</div>
          <div className="text-6xl font-black tracking-[0.18em] mt-1 mb-4 tabular-nums gradient-text">
            {pin}
          </div>
          <div className="text-sm text-slate-300 mb-1">Scan or open to join</div>
          <div className="flex gap-4 items-center">
            <QR url={joinUrl} size={180} />
            <div className="flex-1 min-w-0">
              <CopyField url={joinUrl} />
              <p className="mt-2 text-xs text-slate-400">
                Anyone with this link (and internet access to your server) can join.
              </p>
            </div>
          </div>
          <button
            onClick={onStart}
            disabled={snapshot.players.length === 0}
            className="btn-primary w-full mt-6 text-lg"
          >
            Start game ({snapshot.players.length} player
            {snapshot.players.length === 1 ? "" : "s"})
          </button>
        </div>

        {lanJoinUrl && (
          <div className="card p-5 border-emerald-400/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📶</span>
              <h3 className="font-bold">On the same Wi-Fi?</h3>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              Phones &amp; PCs on your network can join directly — even though you
              opened this on <code className="text-slate-400">localhost</code>.
              Scan this or type the address:
            </p>
            <div className="flex gap-4 items-center">
              <QR url={lanJoinUrl} size={150} />
              <div className="flex-1 min-w-0">
                <CopyField url={lanJoinUrl} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Players in lobby</h2>
          <span className="pill">{snapshot.players.length} joined</span>
        </div>
        {snapshot.players.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <div className="text-5xl mb-3 animate-bounce">👀</div>
            <div className="text-slate-300">
              Waiting for players… share the PIN or QR code.
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {snapshot.players.map((p) => (
              <li
                key={p.id}
                className="card card-hover !rounded-xl flex flex-col items-center p-3 animate-pop-in"
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

function RevealView({ snapshot, onNext }: { snapshot: GameSnapshot; onNext: () => void }) {
  const q = snapshot.currentQuestion!;
  const stats = snapshot.answerStats;
  const correctSet = new Set(stats?.correctOptionIds || []);
  const max = Math.max(1, ...Object.values(stats?.counts || { _: 1 }));
  return (
    <section className="animate-fade-in-up">
      <div className="flex items-center justify-between gap-4 mb-4">
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
            <div key={o.id}>
              <AnswerTile
                index={i}
                text={o.text}
                disabled
                state={correctSet.has(o.id) ? "correct" : "wrong"}
                count={c}
              />
              <div className="h-2 mt-1 rounded bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white/70 transition-all duration-700"
                  style={{ width: w }}
                />
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

function LeaderboardView({ snapshot, onNext }: { snapshot: GameSnapshot; onNext: () => void }) {
  const top = snapshot.players.slice(0, 10);
  const isLast = snapshot.questionIndex + 1 >= snapshot.totalQuestions;
  return (
    <section className="animate-fade-in-up">
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
            className="card flex items-center gap-4 p-4 animate-pop-in"
            style={{
              animationDelay: `${i * 40}ms`,
              background:
                i === 0
                  ? "linear-gradient(90deg, rgba(234,179,8,0.22), rgba(255,255,255,0.04))"
                  : undefined,
            }}
          >
            <div className="w-10 text-2xl font-black text-slate-400 tabular-nums">{i + 1}</div>
            <Avatar avatar={p.avatar} size="md" />
            <div className="flex-1 font-semibold truncate">{p.nickname}</div>
            {p.streak >= 2 && (
              <div className="pill !bg-orange-500/20 !text-orange-200">🔥 {p.streak}</div>
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
    <section className="animate-fade-in-up">
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
            "from-slate-300 to-slate-500",
            "from-yellow-300 to-amber-500",
            "from-orange-400 to-orange-600",
          ];
          return (
            <div key={p.id} className="flex flex-col items-center animate-pop-in">
              <Avatar avatar={p.avatar} size="xl" ring />
              <div className="mt-2 font-bold text-lg truncate max-w-full">{p.nickname}</div>
              <div className="text-2xl font-black tabular-nums">{p.score}</div>
              <div
                className={`w-full mt-3 rounded-t-xl bg-gradient-to-b ${colors[idx]} ${heights[idx]} grid place-items-center text-slate-900 text-3xl font-black`}
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
                <div className="w-8 text-slate-400 font-bold tabular-nums">{i + 4}</div>
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
