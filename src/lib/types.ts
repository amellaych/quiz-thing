// Shared types for the quiz platform.
// Used by both the React UI and (informally) the realtime server.

export type QuestionType = "single" | "multi" | "truefalse";

export interface AnswerOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  imageUrl?: string;
  options: AnswerOption[];
  /** Seconds allowed to answer. */
  timeLimit: number;
  /** Base points awarded for a correct answer. */
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  questions: Question[];
  createdAt: number;
}

export interface PlayerAvatar {
  emoji: string;
  color: string;
}

export interface Player {
  id: string;
  nickname: string;
  avatar: PlayerAvatar;
  score: number;
  streak: number;
  /** Per-question results in order. */
  history: PlayerAnswerResult[];
}

export interface PlayerAnswerResult {
  questionId: string;
  selected: string[];
  correct: boolean;
  pointsAwarded: number;
  msToAnswer: number;
}

export type GamePhase =
  | "lobby"
  | "question"
  | "reveal"
  | "leaderboard"
  | "finished";

export interface GameSnapshot {
  pin: string;
  phase: GamePhase;
  quizTitle: string;
  totalQuestions: number;
  questionIndex: number;
  players: PublicPlayer[];
  currentQuestion?: PublicQuestion;
  questionStartedAt?: number;
  questionEndsAt?: number;
  answerStats?: AnswerStats;
  finalLeaderboard?: PublicPlayer[];
}

export interface PublicPlayer {
  id: string;
  nickname: string;
  avatar: PlayerAvatar;
  score: number;
  streak: number;
  rank?: number;
}

/** A question as sent to players (no `correct` flags). */
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  imageUrl?: string;
  options: { id: string; text: string }[];
  timeLimit: number;
  points: number;
  index: number;
}

export interface AnswerStats {
  /** option id -> count */
  counts: Record<string, number>;
  totalAnswered: number;
  correctOptionIds: string[];
}

// ----- Socket event payloads -----

export interface HostCreatePayload {
  quiz: Quiz;
}

export interface HostCreatedPayload {
  pin: string;
  joinUrl: string;
}

export interface PlayerJoinPayload {
  pin: string;
  nickname: string;
  avatar: PlayerAvatar;
}

export interface PlayerAnswerPayload {
  pin: string;
  questionId: string;
  selected: string[];
}

export const AVATAR_EMOJIS = [
  "🦊", "🐼", "🦁", "🐯", "🐶", "🐱", "🐸", "🐵", "🦄", "🐧",
  "🦉", "🐙", "🦋", "🐢", "🐝", "🐳", "🦖", "🐉", "🦅", "🦩",
];

export const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
];

export const ANSWER_COLORS = ["#e21b3c", "#1368ce", "#d89e00", "#26890c", "#7b2cbf", "#0ea5e9"];
export const ANSWER_SHAPES = ["▲", "◆", "●", "■", "★", "✚"];
