import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Quiz Thing — Live classroom quizzes",
  description:
    "Host live, multiplayer quizzes for your class or team. Build quizzes with images, timers, and multi-answer questions. Players join from any device.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
