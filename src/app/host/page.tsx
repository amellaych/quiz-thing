"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Question, Quiz, QuestionType } from "@/lib/types";
import { sampleQuiz } from "@/lib/sampleQuiz";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function blankOption(correct = false) {
  return { id: uid(), text: "", correct };
}

function blankQuestion(): Question {
  return {
    id: uid(),
    type: "single",
    prompt: "",
    timeLimit: 20,
    points: 1000,
    options: [blankOption(true), blankOption(false), blankOption(false), blankOption(false)],
  };
}

const STORAGE_KEY = "quiz-thing:draft";

export default function HostBuilderPage() {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz>(() => ({
    id: uid(),
    title: "",
    description: "",
    createdAt: Date.now(),
    questions: [blankQuestion()],
  }));
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Restore draft.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Quiz;
        if (parsed?.questions?.length) setQuiz(parsed);
      }
    } catch {}
  }, []);
  // Persist draft.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quiz));
    } catch {}
  }, [quiz]);

  const current = quiz.questions[activeIdx];

  function updateQuiz(patch: Partial<Quiz>) {
    setQuiz((q) => ({ ...q, ...patch }));
  }
  function updateQuestion(qid: string, patch: Partial<Question>) {
    setQuiz((q) => ({
      ...q,
      questions: q.questions.map((qq) => (qq.id === qid ? { ...qq, ...patch } : qq)),
    }));
  }
  function addQuestion() {
    setQuiz((q) => ({ ...q, questions: [...q.questions, blankQuestion()] }));
    setActiveIdx(quiz.questions.length);
  }
  function deleteQuestion(qid: string) {
    setQuiz((q) => {
      const filtered = q.questions.filter((qq) => qq.id !== qid);
      const next = filtered.length ? filtered : [blankQuestion()];
      return { ...q, questions: next };
    });
    setActiveIdx((i) => Math.max(0, i - 1));
  }
  function duplicateQuestion(qid: string) {
    setQuiz((q) => {
      const idx = q.questions.findIndex((qq) => qq.id === qid);
      if (idx < 0) return q;
      const copy: Question = JSON.parse(JSON.stringify(q.questions[idx]));
      copy.id = uid();
      copy.options = copy.options.map((o) => ({ ...o, id: uid() }));
      const newList = [...q.questions];
      newList.splice(idx + 1, 0, copy);
      return { ...q, questions: newList };
    });
  }
  function changeType(qid: string, type: QuestionType) {
    if (type === "truefalse") {
      updateQuestion(qid, {
        type,
        options: [
          { id: "t", text: "True", correct: true },
          { id: "f", text: "False", correct: false },
        ],
      });
    } else {
      const q = quiz.questions.find((qq) => qq.id === qid);
      if (!q) return;
      let opts = q.options;
      if (opts.length < 2) {
        opts = [blankOption(true), blankOption(false), blankOption(false), blankOption(false)];
      }
      if (type === "single") {
        // Ensure exactly one correct.
        const firstCorrectIdx = Math.max(0, opts.findIndex((o) => o.correct));
        opts = opts.map((o, i) => ({ ...o, correct: i === firstCorrectIdx }));
      }
      updateQuestion(qid, { type, options: opts });
    }
  }

  const validation = useMemo(() => {
    if (!quiz.title.trim()) return "Quiz needs a title.";
    for (const [i, q] of quiz.questions.entries()) {
      if (!q.prompt.trim()) return `Question ${i + 1} is missing a prompt.`;
      if (q.options.filter((o) => o.text.trim()).length < 2)
        return `Question ${i + 1} needs at least 2 options.`;
      if (!q.options.some((o) => o.correct))
        return `Question ${i + 1} needs at least one correct answer.`;
      if (q.type === "single" && q.options.filter((o) => o.correct).length !== 1)
        return `Question ${i + 1} (single) must have exactly one correct answer.`;
      if (q.timeLimit < 5 || q.timeLimit > 120)
        return `Question ${i + 1} timer must be 5–120 seconds.`;
    }
    return null;
  }, [quiz]);

  function loadSample() {
    setQuiz(JSON.parse(JSON.stringify(sampleQuiz)));
    setActiveIdx(0);
  }

  function startHosting() {
    if (validation) {
      setError(validation);
      return;
    }
    // Strip empty options before sending.
    const cleaned: Quiz = {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        options: q.options.filter((o) => o.text.trim()),
      })),
    };
    sessionStorage.setItem("quiz-thing:active-quiz", JSON.stringify(cleaned));
    router.push("/host/game");
  }

  return (
    <main className="min-h-screen px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white">
          ← Home
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Quiz Builder</h1>
        <div className="flex gap-2">
          <button onClick={loadSample} className="btn-ghost">
            Load sample
          </button>
          <button onClick={startHosting} className="btn-primary">
            Host this quiz →
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200">
          {error}
        </div>
      )}

      <section className="card p-5 mb-6 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="label">Quiz title</label>
          <input
            className="input text-lg font-semibold"
            placeholder="e.g. Chapter 3 — The Roman Empire"
            value={quiz.title}
            onChange={(e) => updateQuiz({ title: e.target.value })}
          />
          <label className="label mt-4">Description (optional)</label>
          <input
            className="input"
            placeholder="A short description for your class"
            value={quiz.description || ""}
            onChange={(e) => updateQuiz({ description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Cover image URL (optional)</label>
          <input
            className="input"
            placeholder="https://…"
            value={quiz.coverImageUrl || ""}
            onChange={(e) => updateQuiz({ coverImageUrl: e.target.value })}
          />
          {quiz.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={quiz.coverImageUrl}
              alt=""
              className="mt-2 rounded-lg max-h-32 object-cover w-full"
            />
          )}
        </div>
      </section>

      <div className="grid md:grid-cols-[260px,1fr] gap-6">
        <aside className="card p-3 h-fit md:sticky md:top-4">
          <div className="px-2 pb-3 text-xs uppercase tracking-wider text-slate-400">
            Questions ({quiz.questions.length})
          </div>
          <ul className="space-y-1 max-h-[60vh] overflow-auto">
            {quiz.questions.map((q, i) => (
              <li key={q.id}>
                <button
                  onClick={() => setActiveIdx(i)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm flex items-center gap-2 ${
                    i === activeIdx ? "bg-brand-600/30 border border-brand-500" : "hover:bg-white/5"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="truncate flex-1">{q.prompt || "Untitled question"}</span>
                  <span className="text-[10px] text-slate-400">{q.timeLimit}s</span>
                </button>
              </li>
            ))}
          </ul>
          <button onClick={addQuestion} className="btn-ghost w-full mt-3">
            + Add question
          </button>
        </aside>

        {current && (
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex gap-2">
                {(["single", "multi", "truefalse"] as QuestionType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => changeType(current.id, t)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                      current.type === t
                        ? "bg-brand-600 border-brand-500 text-white"
                        : "border-white/15 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    {t === "single" ? "Single choice" : t === "multi" ? "Multi-select" : "True / False"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => duplicateQuestion(current.id)} className="btn-ghost text-sm">
                  Duplicate
                </button>
                <button
                  onClick={() => deleteQuestion(current.id)}
                  className="btn-danger text-sm"
                  disabled={quiz.questions.length === 1}
                >
                  Delete
                </button>
              </div>
            </div>

            <label className="label">Question</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Type your question here…"
              value={current.prompt}
              onChange={(e) => updateQuestion(current.id, { prompt: e.target.value })}
            />

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="md:col-span-2">
                <label className="label">Image URL (optional)</label>
                <input
                  className="input"
                  placeholder="https://…"
                  value={current.imageUrl || ""}
                  onChange={(e) => updateQuestion(current.id, { imageUrl: e.target.value })}
                />
                {current.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.imageUrl}
                    alt=""
                    className="mt-2 rounded-lg max-h-44 object-cover w-full"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Time (s)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    className="input"
                    value={current.timeLimit}
                    onChange={(e) =>
                      updateQuestion(current.id, { timeLimit: Number(e.target.value) || 20 })
                    }
                  />
                </div>
                <div>
                  <label className="label">Points</label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    step={100}
                    className="input"
                    value={current.points}
                    onChange={(e) =>
                      updateQuestion(current.id, { points: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="label !mb-0">Answer options</label>
                {current.type !== "truefalse" && current.options.length < 6 && (
                  <button
                    onClick={() =>
                      updateQuestion(current.id, {
                        options: [...current.options, blankOption(false)],
                      })
                    }
                    className="text-sm text-brand-300 hover:text-brand-100"
                  >
                    + Add option
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {current.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (current.type === "single" || current.type === "truefalse") {
                          updateQuestion(current.id, {
                            options: current.options.map((o) => ({ ...o, correct: o.id === opt.id })),
                          });
                        } else {
                          updateQuestion(current.id, {
                            options: current.options.map((o) =>
                              o.id === opt.id ? { ...o, correct: !o.correct } : o
                            ),
                          });
                        }
                      }}
                      title="Toggle correct"
                      className={`w-9 h-9 rounded-lg border-2 grid place-items-center font-bold ${
                        opt.correct
                          ? "bg-emerald-500 border-emerald-300 text-white"
                          : "border-white/20 text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      {opt.correct ? "✓" : i + 1}
                    </button>
                    <input
                      className="input"
                      placeholder={`Option ${i + 1}`}
                      value={opt.text}
                      disabled={current.type === "truefalse"}
                      onChange={(e) =>
                        updateQuestion(current.id, {
                          options: current.options.map((o) =>
                            o.id === opt.id ? { ...o, text: e.target.value } : o
                          ),
                        })
                      }
                    />
                    {current.type !== "truefalse" && current.options.length > 2 && (
                      <button
                        onClick={() =>
                          updateQuestion(current.id, {
                            options: current.options.filter((o) => o.id !== opt.id),
                          })
                        }
                        className="text-slate-400 hover:text-rose-400 text-xl"
                        title="Remove"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {current.type === "multi"
                  ? "Players must select ALL correct options to score."
                  : "Click the box on the left to mark the correct answer."}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
