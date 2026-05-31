import type { Quiz } from "./types";

export const sampleQuiz: Quiz = {
  id: "sample-general-knowledge",
  title: "General Knowledge Warm-Up",
  description: "A quick 5-question demo quiz to try the platform out.",
  theme: "ocean",
  createdAt: Date.now(),
  questions: [
    {
      id: "q1",
      type: "single",
      prompt: "Which planet is known as the Red Planet?",
      imageUrl:
        "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=900&q=60",
      timeLimit: 20,
      points: 1000,
      options: [
        { id: "a", text: "Venus", correct: false },
        { id: "b", text: "Mars", correct: true },
        { id: "c", text: "Jupiter", correct: false },
        { id: "d", text: "Saturn", correct: false },
      ],
    },
    {
      id: "q2",
      type: "truefalse",
      prompt: "The Great Wall of China is visible from space with the naked eye.",
      timeLimit: 15,
      points: 800,
      options: [
        { id: "t", text: "True", correct: false },
        { id: "f", text: "False", correct: true },
      ],
    },
    {
      id: "q3",
      type: "multi",
      prompt: "Which of these are programming languages? (select all)",
      timeLimit: 25,
      points: 1200,
      options: [
        { id: "a", text: "Python", correct: true },
        { id: "b", text: "HTML", correct: false },
        { id: "c", text: "Rust", correct: true },
        { id: "d", text: "Photoshop", correct: false },
      ],
    },
    {
      id: "q4",
      type: "single",
      prompt: "What is the capital of Australia?",
      timeLimit: 20,
      points: 1000,
      options: [
        { id: "a", text: "Sydney", correct: false },
        { id: "b", text: "Melbourne", correct: false },
        { id: "c", text: "Canberra", correct: true },
        { id: "d", text: "Perth", correct: false },
      ],
    },
    {
      id: "q5",
      type: "single",
      prompt: "Which element has the chemical symbol 'Au'?",
      imageUrl:
        "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=900&q=60",
      timeLimit: 20,
      points: 1000,
      options: [
        { id: "a", text: "Silver", correct: false },
        { id: "b", text: "Gold", correct: true },
        { id: "c", text: "Aluminum", correct: false },
        { id: "d", text: "Argon", correct: false },
      ],
    },
  ],
};
