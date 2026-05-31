import Link from "next/link";
import { Background } from "@/components/Background";

export default function HomePage() {
  return (
    <>
      <Background themeId="aurora" />
      <main className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 grid place-items-center text-2xl font-black shadow-glow">
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

        <section className="mt-16 md:mt-24 grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-in-up">
            <p className="pill mb-5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live • Multiplayer • Realtime
            </p>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.04] tracking-tight">
              Quizzes your class
              <span className="block gradient-text">actually want to play.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-prose">
              Build a quiz in minutes — add images, timers, points, and multiple
              correct answers. Pick a vibrant background theme, share a 6-digit
              code, and everyone joins from any device with their own avatar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/host" className="btn-primary text-lg">
                Create a quiz →
              </Link>
              <Link href="/join" className="btn-ghost text-lg">
                I have a game PIN
              </Link>
            </div>

            <ul className="mt-10 grid grid-cols-2 gap-3 text-sm text-slate-200">
              {[
                ["🖼️", "Images on questions"],
                ["⏱️", "Per-question timer"],
                ["✅", "Multi-correct answers"],
                ["🎨", "Custom backgrounds"],
                ["⚡", "Speed-based scoring"],
                ["🏆", "Final podium & ranks"],
              ].map(([icon, label]) => (
                <li key={label} className="card card-hover p-4 flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6 shadow-glow animate-fade-in-up">
            <div className="text-sm uppercase tracking-wider text-slate-400">
              How it works
            </div>
            <ol className="mt-4 space-y-4">
              {[
                ["Build your quiz", "Add questions, options, images, timers, and a theme."],
                ["Host the game", "Share the 6-digit PIN — or a Wi-Fi/QR link."],
                ["Players join", "They pick an avatar and a nickname."],
                ["Play live", "Answer faster for more points. Watch the board climb."],
                ["See results", "Final podium and per-player breakdown."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-sm font-bold">
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
    </>
  );
}
