// Realtime server logic for the Quiz Thing platform.
// Pure JS (CommonJS) so the custom Next server can require it directly.
//
// Game lifecycle:
//   host:create        -> creates a game, returns pin
//   player:join        -> joins lobby (validates pin, unique nickname)
//   host:start         -> starts game, advances to first question
//   host:next          -> advances after reveal/leaderboard
//   player:answer      -> submits an answer for the active question
//   (timer)            -> auto-advances to reveal when time is up or all answered

const { customAlphabet } = require("nanoid");
const newPin = customAlphabet("0123456789", 6);

/** @type {Map<string, Game>} */
const games = new Map();

/**
 * @typedef {Object} Game
 * @property {string} pin
 * @property {string} hostSocketId
 * @property {any} quiz
 * @property {"lobby"|"question"|"reveal"|"leaderboard"|"finished"} phase
 * @property {number} questionIndex
 * @property {Map<string, Player>} players  // socketId -> Player
 * @property {Map<string, Set<string>>} answersByQuestion  // qid -> set of playerIds who answered
 * @property {number=} questionStartedAt
 * @property {number=} questionEndsAt
 * @property {NodeJS.Timeout=} timer
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} nickname
 * @property {{emoji: string, color: string}} avatar
 * @property {number} score
 * @property {number} streak
 * @property {Array<{questionId:string,selected:string[],correct:boolean,pointsAwarded:number,msToAnswer:number}>} history
 */

function getGame(pin) {
  return games.get(pin);
}

function publicPlayer(p) {
  return {
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    score: p.score,
    streak: p.streak,
  };
}

function publicQuestion(q, index) {
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    imageUrl: q.imageUrl,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    timeLimit: q.timeLimit,
    points: q.points,
    index,
  };
}

function snapshot(game, includeStats = false) {
  const q = game.quiz.questions[game.questionIndex];
  const snap = {
    pin: game.pin,
    phase: game.phase,
    quizTitle: game.quiz.title,
    quizTheme: game.quiz.theme,
    quizThemeImage: game.quiz.themeImage,
    totalQuestions: game.quiz.questions.length,
    questionIndex: game.questionIndex,
    players: [...game.players.values()]
      .map(publicPlayer)
      .sort((a, b) => b.score - a.score),
    currentQuestion: q ? publicQuestion(q, game.questionIndex) : undefined,
    questionStartedAt: game.questionStartedAt,
    questionEndsAt: game.questionEndsAt,
  };
  if (includeStats && q) {
    snap.answerStats = computeStats(game, q);
  }
  if (game.phase === "finished") {
    snap.finalLeaderboard = snap.players.map((p, i) => ({ ...p, rank: i + 1 }));
  }
  return snap;
}

function computeStats(game, question) {
  const counts = {};
  for (const opt of question.options) counts[opt.id] = 0;
  let totalAnswered = 0;
  for (const player of game.players.values()) {
    const result = player.history.find((h) => h.questionId === question.id);
    if (!result) continue;
    totalAnswered++;
    for (const sel of result.selected) {
      if (counts[sel] !== undefined) counts[sel]++;
    }
  }
  const correctOptionIds = question.options.filter((o) => o.correct).map((o) => o.id);
  return { counts, totalAnswered, correctOptionIds };
}

function emitSnapshot(io, game, includeStats = false) {
  const snap = snapshot(game, includeStats);
  io.to(roomFor(game.pin)).emit("game:snapshot", snap);
  io.to(hostRoomFor(game.pin)).emit("game:snapshot", snap);
}

function roomFor(pin) {
  return `game:${pin}`;
}
function hostRoomFor(pin) {
  return `host:${pin}`;
}

function clearTimer(game) {
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = undefined;
  }
}

function startQuestion(io, game) {
  const q = game.quiz.questions[game.questionIndex];
  if (!q) return endGame(io, game);
  game.phase = "question";
  game.questionStartedAt = Date.now();
  game.questionEndsAt = game.questionStartedAt + q.timeLimit * 1000;
  // Reset streak for any player who didn't answer last round? Kept simple: streak only updates on answer.
  emitSnapshot(io, game, false);
  clearTimer(game);
  game.timer = setTimeout(() => revealQuestion(io, game), q.timeLimit * 1000);
}

function revealQuestion(io, game) {
  clearTimer(game);
  game.phase = "reveal";
  emitSnapshot(io, game, true);
}

function showLeaderboard(io, game) {
  game.phase = "leaderboard";
  emitSnapshot(io, game, false);
}

function nextQuestion(io, game) {
  game.questionIndex += 1;
  if (game.questionIndex >= game.quiz.questions.length) {
    endGame(io, game);
    return;
  }
  startQuestion(io, game);
}

function endGame(io, game) {
  clearTimer(game);
  game.phase = "finished";
  emitSnapshot(io, game, false);
}

function scoreAnswer(question, selected, msToAnswer) {
  const correctIds = new Set(question.options.filter((o) => o.correct).map((o) => o.id));
  const selectedSet = new Set(selected);
  let isCorrect = false;
  if (question.type === "multi") {
    // Must match exactly the correct set.
    isCorrect =
      selectedSet.size === correctIds.size &&
      [...selectedSet].every((id) => correctIds.has(id));
  } else {
    // single / truefalse: exactly one selection that is correct.
    isCorrect = selected.length === 1 && correctIds.has(selected[0]);
  }
  if (!isCorrect) return { isCorrect: false, points: 0 };
  // Speed bonus: full points if answered instantly, half points if at the very end.
  const totalMs = question.timeLimit * 1000;
  const fraction = Math.max(0, Math.min(1, 1 - msToAnswer / totalMs));
  const points = Math.round(question.points * (0.5 + 0.5 * fraction));
  return { isCorrect: true, points };
}

function maybeRevealEarly(io, game) {
  const q = game.quiz.questions[game.questionIndex];
  if (!q) return;
  const total = game.players.size;
  if (total === 0) return;
  let answered = 0;
  for (const p of game.players.values()) {
    if (p.history.find((h) => h.questionId === q.id)) answered++;
  }
  if (answered >= total) revealQuestion(io, game);
}

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.data = { role: null, pin: null, playerId: null };

    socket.on("host:create", ({ quiz }, cb) => {
      try {
        if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
          return cb && cb({ ok: false, error: "Quiz has no questions" });
        }
        let pin;
        do {
          pin = newPin();
        } while (games.has(pin));
        /** @type {Game} */
        const game = {
          pin,
          hostSocketId: socket.id,
          quiz,
          phase: "lobby",
          questionIndex: -1,
          players: new Map(),
          answersByQuestion: new Map(),
        };
        games.set(pin, game);
        socket.join(hostRoomFor(pin));
        socket.data.role = "host";
        socket.data.pin = pin;
        cb && cb({ ok: true, pin });
        emitSnapshot(io, game);
      } catch (e) {
        cb && cb({ ok: false, error: String(e) });
      }
    });

    socket.on("host:rejoin", ({ pin }, cb) => {
      const game = getGame(pin);
      if (!game) return cb && cb({ ok: false, error: "Game not found" });
      game.hostSocketId = socket.id;
      socket.join(hostRoomFor(pin));
      socket.data.role = "host";
      socket.data.pin = pin;
      cb && cb({ ok: true });
      emitSnapshot(io, game, game.phase === "reveal");
    });

    socket.on("player:join", ({ pin, nickname, avatar }, cb) => {
      const game = getGame(pin);
      if (!game) return cb && cb({ ok: false, error: "Game not found" });
      if (game.phase !== "lobby")
        return cb && cb({ ok: false, error: "Game already started" });
      const trimmed = String(nickname || "").trim().slice(0, 18);
      if (!trimmed) return cb && cb({ ok: false, error: "Nickname required" });
      const taken = [...game.players.values()].some(
        (p) => p.nickname.toLowerCase() === trimmed.toLowerCase()
      );
      if (taken) return cb && cb({ ok: false, error: "Nickname taken" });
      const player = {
        id: socket.id,
        nickname: trimmed,
        avatar: avatar || { emoji: "🙂", color: "#6366f1" },
        score: 0,
        streak: 0,
        history: [],
      };
      game.players.set(socket.id, player);
      socket.join(roomFor(pin));
      socket.data.role = "player";
      socket.data.pin = pin;
      socket.data.playerId = socket.id;
      cb && cb({ ok: true, playerId: socket.id });
      emitSnapshot(io, game);
    });

    socket.on("host:start", ({ pin }, cb) => {
      const game = getGame(pin);
      if (!game) return cb && cb({ ok: false, error: "Game not found" });
      if (socket.data.role !== "host" || game.hostSocketId !== socket.id)
        return cb && cb({ ok: false, error: "Not host" });
      if (game.phase !== "lobby")
        return cb && cb({ ok: false, error: "Already started" });
      if (game.players.size === 0)
        return cb && cb({ ok: false, error: "No players yet" });
      game.questionIndex = 0;
      startQuestion(io, game);
      cb && cb({ ok: true });
    });

    socket.on("host:next", ({ pin }, cb) => {
      const game = getGame(pin);
      if (!game) return cb && cb({ ok: false, error: "Game not found" });
      if (socket.data.role !== "host" || game.hostSocketId !== socket.id)
        return cb && cb({ ok: false, error: "Not host" });
      if (game.phase === "question") {
        // host can force reveal
        revealQuestion(io, game);
      } else if (game.phase === "reveal") {
        showLeaderboard(io, game);
      } else if (game.phase === "leaderboard") {
        nextQuestion(io, game);
      } else if (game.phase === "lobby") {
        return cb && cb({ ok: false, error: "Use host:start" });
      }
      cb && cb({ ok: true });
    });

    socket.on("host:end", ({ pin }, cb) => {
      const game = getGame(pin);
      if (!game) return cb && cb({ ok: false, error: "Game not found" });
      if (socket.data.role !== "host" || game.hostSocketId !== socket.id)
        return cb && cb({ ok: false, error: "Not host" });
      endGame(io, game);
      cb && cb({ ok: true });
    });

    socket.on("player:answer", ({ pin, questionId, selected }, cb) => {
      const game = getGame(pin);
      if (!game) return cb && cb({ ok: false, error: "Game not found" });
      const player = game.players.get(socket.id);
      if (!player) return cb && cb({ ok: false, error: "Not a player" });
      if (game.phase !== "question")
        return cb && cb({ ok: false, error: "Not accepting answers" });
      const q = game.quiz.questions[game.questionIndex];
      if (!q || q.id !== questionId)
        return cb && cb({ ok: false, error: "Wrong question" });
      // No double-answer
      if (player.history.find((h) => h.questionId === q.id))
        return cb && cb({ ok: false, error: "Already answered" });
      const msToAnswer = Math.max(0, Date.now() - (game.questionStartedAt || Date.now()));
      const { isCorrect, points } = scoreAnswer(q, selected || [], msToAnswer);
      let awarded = points;
      if (isCorrect) {
        player.streak += 1;
        // Streak bonus: +50 per consecutive correct (capped).
        if (player.streak >= 2) awarded += Math.min(player.streak - 1, 5) * 50;
      } else {
        player.streak = 0;
      }
      player.score += awarded;
      player.history.push({
        questionId: q.id,
        selected: selected || [],
        correct: isCorrect,
        pointsAwarded: awarded,
        msToAnswer,
      });
      cb &&
        cb({
          ok: true,
          correct: isCorrect,
          points: awarded,
          streak: player.streak,
          score: player.score,
        });
      // Tell host live progress (counts only) without revealing yet.
      io.to(hostRoomFor(game.pin)).emit("host:answer-progress", {
        answered: [...game.players.values()].filter((p) =>
          p.history.find((h) => h.questionId === q.id)
        ).length,
        total: game.players.size,
      });
      maybeRevealEarly(io, game);
    });

    socket.on("disconnect", () => {
      const { role, pin } = socket.data || {};
      if (!pin) return;
      const game = getGame(pin);
      if (!game) return;
      if (role === "player") {
        game.players.delete(socket.id);
        emitSnapshot(io, game);
      } else if (role === "host") {
        // Keep game running 60s in case the host refreshes.
        setTimeout(() => {
          if (game.hostSocketId === socket.id) {
            clearTimer(game);
            io.to(roomFor(pin)).emit("game:host-left");
            games.delete(pin);
          }
        }, 60_000);
      }
    });
  });
}

module.exports = { registerSocketHandlers };
