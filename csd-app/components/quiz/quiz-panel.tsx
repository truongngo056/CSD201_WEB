"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
} from "lucide-react";
import type { DSSlug } from "@/types";
import { QUIZ_QUESTIONS } from "@/lib/data/quizzes";
import { getStructure } from "@/lib/data/structures";
import { useProgressStore } from "@/lib/store/progress-store";
import { cn } from "@/lib/utils";

interface QuizPanelProps {
  slug?: DSSlug;
}

export function QuizPanel({ slug }: QuizPanelProps) {
  const questions = useMemo(() => {
    const filtered = slug
      ? QUIZ_QUESTIONS.filter((q) => q.dsSlug === slug || !q.dsSlug)
      : QUIZ_QUESTIONS;
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, 5);
  }, [slug]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answered, setAnswered] = useState(false);

  const recordQuiz = useProgressStore((s) => s.recordQuiz);
  const ds = slug ? getStructure(slug) : null;
  const q = questions[index];

  const handleSelect = (i: number) => {
    if (answered || !q) return;
    setSelected(i);
    setAnswered(true);
    if (i === q.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const finishAndRecord = () => {
    setDone(true);
    if (slug) recordQuiz(slug, score, questions.length);
  };

  const onNextClick = () => {
    if (index + 1 >= questions.length) {
      finishAndRecord();
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setAnswered(false);
  };

  if (!questions.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Chưa có câu hỏi.</p>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Hoàn thành kiểm tra!</h2>
        <p className="mt-2 text-muted-foreground">
          Bạn đạt{" "}
          <span className="font-bold text-foreground">
            {score}/{questions.length}
          </span>{" "}
          ({pct}%)
        </p>
        <div className="mx-auto mt-4 h-3 w-48 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
            Làm lại
          </button>
          {slug && (
            <Link
              href={`/learn/${slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
            >
              Về Playground
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {ds ? `Kiểm tra ${ds.nameVi}` : "Kiểm tra hỗn hợp"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Câu {index + 1} / {questions.length}
          </p>
        </div>
        <div className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">
          Điểm: {score}
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-pink-500 transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <p className="text-lg font-semibold leading-snug">{q.question}</p>

          <div className="mt-5 space-y-2.5">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correctIndex;
              const isSel = selected === i;
              let style =
                "border-border hover:border-foreground/30 hover:bg-muted/50";
              if (answered) {
                if (isCorrect)
                  style =
                    "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                else if (isSel)
                  style =
                    "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400";
                else style = "border-border opacity-50";
              } else if (isSel) {
                style = "border-violet-500 bg-violet-500/10";
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={answered}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                    style
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {answered && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                  {answered && isSel && !isCorrect && (
                    <XCircle className="h-5 w-5 text-rose-500" />
                  )}
                </button>
              );
            })}
          </div>

          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground"
            >
              <strong className="text-foreground">Giải thích: </strong>
              {q.explanation}
            </motion.div>
          )}

          {answered && (
            <button
              type="button"
              onClick={onNextClick}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-bold text-background transition hover:opacity-90"
            >
              {index + 1 >= questions.length ? "Xem kết quả" : "Câu tiếp theo"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
