// Background themes for quizzes. A theme is applied live on the host's big
// screen AND on every player's device during the game, plus the lobby.

export interface BackgroundTheme {
  id: string;
  name: string;
  /** Full CSS `background` value used behind everything. */
  background: string;
  /** Colors for the soft animated floating blobs. */
  blobs: string[];
  /** A small CSS background used for the picker swatch. */
  swatch: string;
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: "aurora",
    name: "Aurora",
    background:
      "radial-gradient(1200px 700px at 8% -10%, #4338ca55, transparent), radial-gradient(1000px 600px at 110% 10%, #ec489955, transparent), radial-gradient(900px 600px at 50% 120%, #0ea5e955, transparent), linear-gradient(180deg, #0b1020 0%, #0a0f1f 100%)",
    blobs: ["#6366f1", "#ec4899", "#22d3ee"],
    swatch: "linear-gradient(135deg, #6366f1, #ec4899, #22d3ee)",
  },
  {
    id: "sunset",
    name: "Sunset",
    background:
      "radial-gradient(1100px 700px at 10% 0%, #f9731688, transparent), radial-gradient(1000px 600px at 100% 20%, #db277788, transparent), linear-gradient(180deg, #1a0b14 0%, #140a18 100%)",
    blobs: ["#fb923c", "#f43f5e", "#a855f7"],
    swatch: "linear-gradient(135deg, #fb923c, #f43f5e, #a855f7)",
  },
  {
    id: "ocean",
    name: "Ocean",
    background:
      "radial-gradient(1100px 700px at 12% -10%, #0ea5e988, transparent), radial-gradient(1000px 600px at 105% 15%, #14b8a688, transparent), linear-gradient(180deg, #07151f 0%, #06121b 100%)",
    blobs: ["#38bdf8", "#2dd4bf", "#3b82f6"],
    swatch: "linear-gradient(135deg, #38bdf8, #2dd4bf, #3b82f6)",
  },
  {
    id: "forest",
    name: "Forest",
    background:
      "radial-gradient(1100px 700px at 10% 0%, #16a34a77, transparent), radial-gradient(1000px 600px at 100% 10%, #65a30d77, transparent), linear-gradient(180deg, #0a160e 0%, #08130c 100%)",
    blobs: ["#4ade80", "#a3e635", "#10b981"],
    swatch: "linear-gradient(135deg, #4ade80, #a3e635, #10b981)",
  },
  {
    id: "grape",
    name: "Grape",
    background:
      "radial-gradient(1100px 700px at 8% -10%, #7c3aed88, transparent), radial-gradient(1000px 600px at 105% 12%, #c026d388, transparent), linear-gradient(180deg, #120a1f 0%, #0e0818 100%)",
    blobs: ["#a78bfa", "#e879f9", "#8b5cf6"],
    swatch: "linear-gradient(135deg, #a78bfa, #e879f9, #8b5cf6)",
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    background:
      "radial-gradient(1100px 700px at 12% 0%, #ec489977, transparent), radial-gradient(1000px 600px at 100% 18%, #f59e0b66, transparent), linear-gradient(180deg, #1a0d16 0%, #160a13 100%)",
    blobs: ["#f472b6", "#fbbf24", "#fb7185"],
    swatch: "linear-gradient(135deg, #f472b6, #fbbf24, #fb7185)",
  },
  {
    id: "midnight",
    name: "Midnight",
    background:
      "radial-gradient(900px 600px at 50% -10%, #1e293b, transparent), radial-gradient(700px 500px at 100% 100%, #1e3a8a55, transparent), linear-gradient(180deg, #020617 0%, #000000 100%)",
    blobs: ["#1d4ed8", "#334155", "#0f766e"],
    swatch: "linear-gradient(135deg, #0f172a, #1e3a8a, #000000)",
  },
  {
    id: "slate",
    name: "Clean Slate",
    background:
      "radial-gradient(900px 600px at 10% -10%, #33415555, transparent), linear-gradient(180deg, #0f172a 0%, #111827 100%)",
    blobs: ["#475569", "#64748b", "#334155"],
    swatch: "linear-gradient(135deg, #334155, #64748b, #94a3b8)",
  },
];

export const DEFAULT_THEME_ID = "aurora";

export function getTheme(id?: string): BackgroundTheme {
  return (
    BACKGROUND_THEMES.find((t) => t.id === id) ||
    BACKGROUND_THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
  );
}
