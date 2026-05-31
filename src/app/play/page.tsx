"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSocket, emitWithAck } from "@/lib/socket";
import type { GameSnapshot, PlayerAvatar } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { Timer } from "@/components/Timer";
import { AnswerTile } from "@/components/AnswerTile";
import { Background } from "@/components/Background";

interface StoredPlayer {
  pin: string;
  nickname: string;
  avatar: PlayerAvatar;
}

export default function PlayPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [me, setMe] = useState<StoredPlayer | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    points: number;
    streak: number;
    score: number;
  } | null>(null);
  const lastQid = useRef<string | null>(null);
  const [hostLeft, setHostLeft] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("quiz-thing:player");
    if (!raw) {
      router.replace("/join");
      return;
    }
    const stored: StoredPlayer = JSON.parse(raw);
    setMe(stored);

    const socket = getSocket();
    const onSnap = (s: GameSnapshot) => setSnapshot(s);
    const onHostLeft = () => setHostLeft(true);
    socket.on("game:snapshot", onSnap);
    socket.on("game:host-left", onHostLeft);
    return () => {
      socket.off("game:snapshot", onSnap);
      socket.off("game:host-left", onHostLeft);
    };
  }, [router]);

  // Reset per-question state when question changes.
  useEffect(() => {
    const qid = snapshot?.currentQuestion?.id || null;
    if (qid !== lastQid.current) {
      lastQid.current = qid;
      setSelected([]);
      setSubmitted(false);
      setFeedback(null);
    }
  }, [snapshot?.currentQuestion?.id]);

  if (hostLeft) {
    return (
      <>
        <Background themeId="midnight" />
        <main className="min-h-screen grid place-items-center px-6">
          <div className="card p-8 max-w-md text-center animate-pop-in">
            <div className="text-3xl mb-2">📴</div>
            <p className="mb-4">The host left the game.</p>
            <Link href="/" className="btn-primary">
              Back home
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!me || !snapshot) {
    return (
      <>
        <Background themeId="aurora" />
        <main className="min-h-screen grid place-items-center text-slate-300 animate-pulse text-lg">
          Connecting…
        </main>
      </>
    );
  }

  const myPlayer = snapshot.players.find((p) => p.nickname === me.nickname);

  async function submitAnswer() {
    if (!snapshot?.currentQuestion || !me) return;
    if (selected.length === 0) return;
    setSubmitted(true);
    const resp = await emitWithAck<{
      ok: boolean;
      correct?: boolean;
      points?: number;
      streak?: number;
      score?: number;
      error?: string;
    }>("player:answer", {
      pin: me.pin,
      questionId: snapshot.currentQuestion.id,
      selected,
    });
    if (resp.ok) {
      setFeedback({
        correct: !!resp.correct,
        points: resp.points || 0,
        streak: resp.streak || 0,
        score: resp.score || 0,
      });
    } else {
      setSubmitted(false);
    }
  }

  function toggle(optId: string) {
    if (submitted) return;
    const q = snapshot!.currentQuestion!;
    if (q.type === "multi") {
      setSelected((s) => (s.includes(optId) ? s.filter((x) => x !== optId) : [...s, optId]));
    } else {
      setSelected([optId]);
    }
  }

  return (
    <>
      <Background themeId={snapshot.quizTheme} imageUrl={snapshot.quizThemeImage} />
      <main className="min-h-screen px-4 py-4 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar avatar={me.avatar} size="md" />
          <div>
            <div className="font-bold">{me.nickname}</div>
            <div className="text-xs text-slate-400">PIN {me.pin}</div>
          </div>
        </div>
        <div className="card px-4 py-2 text-right">
          <div className="text-xs text-slate-400">Your score</div>
          <div className="text-2xl font-black tabular-nums">
            {myPlayer?.score ?? 0}
          </div>
        </div>
      </header>

      {snapshot.phase === "lobby" && (
        <section className="card p-8 text-center">
          <div className="text-2xl font-bold mb-2">You're in!</div>
          <p className="text-slate-300 mb-6">
            Hold tight — the host will start the game soon.
          </p>
          <div className="flex justify-center">
            <Avatar avatar={me.avatar} size="xl" ring />
          </div>
          <div className="mt-3 font-bold text-xl">{me.nickname}</div>
          <div className="mt-6 pill">{snapshot.players.length} players in lobby</div>
        </section>
      )}

      {snapshot.phase === "question" && snapshot.currentQuestion && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="pill">
              Q{snapshot.questionIndex + 1} / {snapshot.totalQuestions}
            </div>
            <Timer startsAt={snapshot.questionStartedAt} endsAt={snapshot.questionEndsAt} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-3">
            {snapshot.currentQuestion.prompt}
          </h2>
          {snapshot.currentQuestion.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={snapshot.currentQuestion.imageUrl}
              alt=""
              className="rounded-xl max-h-56 mx-auto mb-4 object-cover"
            />
          )}

          {feedback ? (
            <div
              className={`card p-6 text-center animate-pop-in ${
                feedback.correct ? "border-emerald-400/50" : "border-rose-400/50"
              }`}
            >
              <div className="text-4xl mb-2">
                {feedback.correct ? "✅ Correct!" : "❌ Not this time"}
              </div>
              {feedback.correct && (
                <div className="text-2xl font-bold">+{feedback.points} pts</div>
              )}
              {feedback.streak >= 2 && (
                <div className="mt-2 pill !bg-orange-500/20 !text-orange-200">
                  🔥 Streak {feedback.streak}
                </div>
              )}
              <div className="mt-4 text-slate-300">
                Total: <b className="text-white">{feedback.score}</b>
              </div>
              <div className="mt-4 text-slate-400 text-sm">
                Waiting for other players…
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {snapshot.currentQuestion.options.map((o, i) => (
                  <AnswerTile
                    key={o.id}
                    index={i}
                    text={o.text}
                    selected={selected.includes(o.id)}
                    onClick={() => toggle(o.id)}
                    disabled={submitted}
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={submitAnswer}
                  disabled={selected.length === 0 || submitted}
                  className="btn-primary text-lg disabled:opacity-50"
                >
                  {submitted ? "Submitting…" : "Submit answer"}
                </button>
              </div>
              {snapshot.currentQuestion.type === "multi" && (
                <p className="mt-2 text-xs text-slate-400 text-right">
                  Select all that apply.
                </p>
              )}
            </>
          )}
        </section>
      )}

      {snapshot.phase === "reveal" && (
        <section className="card p-6 text-center">
          <div className="text-2xl font-bold mb-2">Time's up!</div>
          {feedback ? (
            <p className="text-slate-300">
              You got{" "}
              {feedback.correct ? (
                <b className="text-emerald-300">+{feedback.points} pts</b>
              ) : (
                <b className="text-rose-300">no points</b>
              )}
              .
            </p>
          ) : (
            <p className="text-slate-300">No answer recorded.</p>
          )}
        </section>
      )}

      {snapshot.phase === "leaderboard" && (
        <section className="card p-6">
          <h3 className="text-xl font-bold mb-3">Standings</h3>
          <ol className="space-y-2">
            {snapshot.players.slice(0, 5).map((p, i) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  p.nickname === me.nickname ? "bg-brand-600/20 border border-brand-500" : ""
                }`}
              >
                <div className="w-6 font-bold text-slate-400">{i + 1}</div>
                <Avatar avatar={p.avatar} size="sm" />
                <div className="flex-1 truncate">{p.nickname}</div>
                <div className="font-bold tabular-nums">{p.score}</div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {snapshot.phase === "finished" && (
        <FinalForPlayer snapshot={snapshot} myNick={me.nickname} />
      )}
      </main>
    </>
  );
}

function FinalForPlayer({
  snapshot,
  myNick,
}: {
  snapshot: GameSnapshot;
  myNick: string;
}) {
  const players = snapshot.finalLeaderboard || snapshot.players;
  const myIdx = players.findIndex((p) => p.nickname === myNick);
  const me = players[myIdx];
  return (
    <section className="card p-6 text-center">
      <h2 className="text-3xl font-black mb-2">🏆 Game over</h2>
      {me && (
        <>
          <div className="text-slate-300">You finished</div>
          <div className="text-6xl font-black my-2">#{myIdx + 1}</div>
          <div className="text-xl font-bold">{me.score} points</div>
        </>
      )}
      <ol className="text-left mt-6 space-y-1 max-w-md mx-auto">
        {players.slice(0, 10).map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center gap-3 p-2 rounded-lg ${
              p.nickname === myNick ? "bg-brand-600/20 border border-brand-500" : ""
            }`}
          >
            <div className="w-6 font-bold text-slate-400">{i + 1}</div>
            <Avatar avatar={p.avatar} size="sm" />
            <div className="flex-1 truncate">{p.nickname}</div>
            <div className="font-bold tabular-nums">{p.score}</div>
          </li>
        ))}
      </ol>
      <div className="mt-6">
        <Link href="/" className="btn-primary">
          Back home
        </Link>
      </div>
    </section>
  );
}
