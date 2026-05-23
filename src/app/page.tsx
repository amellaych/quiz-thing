import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-xl font-black">
            Q
          </div>
          <span className="text-xl font-bold tracking-tight">Quiz Thing</span>
        </div>
        <nav className="flex gap-2 text-sm">
          <Link href="/host" className="btn-ghost">
            Host a game
          </Link>
          <Link href="/join" className="btn-primary">
            Join
          </Link>
        </nav>
      </header>

      <section className="mt-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="pill mb-4">Live • Multiplayer • Realtime</p>
          <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight">
            Quizzes your students
            <span className="block bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">
              actually want to play.
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-prose">
            Build a quiz in minutes — add images, timers, points, and multiple
            correct answers. Share a 6-digit code, and your class joins from any
            device with their own avatar. See live answers, podium, and per-player
            results when the game ends.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/host" className="btn-primary text-lg">
              Create a quiz →
            </Link>
            <Link href="/join" className="btn-ghost text-lg">
              I have a game PIN
            </Link>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-3 text-sm text-slate-300">
            <li className="card p-4">🖼️ Images on questions</li>
            <li className="card p-4">⏱️ Per-question timer</li>
            <li className="card p-4">✅ Multi-correct answers</li>
            <li className="card p-4">⚡ Speed-based scoring</li>
            <li className="card p-4">🔥 Streak bonuses</li>
            <li className="card p-4">🏆 Final podium & ranks</li>
          </ul>
        </div>

        <div className="card p-6 shadow-glow">
          <div className="text-sm uppercase tracking-wider text-slate-400">
            How it works
          </div>
          <ol className="mt-4 space-y-4">
            {[
              ["Build your quiz", "Add questions, options, images, and timers."],
              ["Host the game", "Share the 6-digit PIN with your class."],
              ["Players join", "They pick an avatar and a nickname."],
              ["Play live", "Answer faster for more points. Watch the leaderboard climb."],
              ["See results", "Final podium and per-player breakdown."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500 grid place-items-center text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold">{title}</div>
                  <div className="text-slate-300 text-sm">{body}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="mt-24 pb-8 text-center text-slate-500 text-sm">
        Built for live classroom learning. No signup required.
      </footer>
    </main>
  );
}
