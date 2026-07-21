"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Achievement, DSSlug, ProgressEntry } from "@/types";
import { ACHIEVEMENTS } from "@/lib/data/quizzes";
import { DATA_STRUCTURES } from "@/lib/data/structures";

function emptyProgress(): Record<DSSlug, ProgressEntry> {
  const map = {} as Record<DSSlug, ProgressEntry>;
  for (const ds of DATA_STRUCTURES) {
    map[ds.slug] = {
      slug: ds.slug,
      percent: 0,
      operationsRun: 0,
      quizScore: 0,
      quizTotal: 0,
      completed: false,
    };
  }
  return map;
}

/** Stable empty snapshot for SSR / useSyncExternalStore getServerSnapshot */
export function emptyProgressSnapshot(): Record<DSSlug, ProgressEntry> {
  return emptyProgress();
}

interface ProgressState {
  progress: Record<DSSlug, ProgressEntry>;
  unlockedAchievements: string[];
  totalXp: number;
  visit: (slug: DSSlug) => void;
  recordOperation: (slug: DSSlug) => void;
  recordQuiz: (slug: DSSlug, score: number, total: number) => void;
  getOverallPercent: () => number;
  getAchievements: () => (Achievement & { unlocked: boolean })[];
  checkAchievements: () => void;
}

function recomputePercent(entry: ProgressEntry): number {
  const opPart = Math.min(70, entry.operationsRun * 7);
  const quizPart =
    entry.quizTotal > 0
      ? Math.round((entry.quizScore / entry.quizTotal) * 30)
      : 0;
  return Math.min(100, opPart + quizPart);
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: emptyProgress(),
      unlockedAchievements: [],
      totalXp: 0,

      visit: (slug) => {
        set((state) => {
          const entry = { ...state.progress[slug], lastVisited: new Date().toISOString() };
          if (entry.percent === 0 && entry.operationsRun === 0) {
            entry.percent = 5;
          }
          return {
            progress: { ...state.progress, [slug]: entry },
            totalXp: state.totalXp + 2,
          };
        });
        get().checkAchievements();
      },

      recordOperation: (slug) => {
        set((state) => {
          const prev = state.progress[slug];
          const entry: ProgressEntry = {
            ...prev,
            operationsRun: prev.operationsRun + 1,
            lastVisited: new Date().toISOString(),
          };
          entry.percent = recomputePercent(entry);
          entry.completed = entry.percent >= 100;
          return {
            progress: { ...state.progress, [slug]: entry },
            totalXp: state.totalXp + 10,
          };
        });
        get().checkAchievements();
      },

      recordQuiz: (slug, score, total) => {
        set((state) => {
          const prev = state.progress[slug];
          const entry: ProgressEntry = {
            ...prev,
            quizScore: Math.max(prev.quizScore, score),
            quizTotal: total,
            lastVisited: new Date().toISOString(),
          };
          entry.percent = recomputePercent(entry);
          entry.completed = entry.percent >= 100;
          return {
            progress: { ...state.progress, [slug]: entry },
            totalXp: state.totalXp + score * 15,
          };
        });
        get().checkAchievements();
      },

      getOverallPercent: () => {
        const { progress } = get();
        const values = Object.values(progress);
        if (!values.length) return 0;
        return Math.round(
          values.reduce((s, p) => s + p.percent, 0) / values.length
        );
      },

      getAchievements: () => {
        const unlocked = new Set(get().unlockedAchievements);
        return ACHIEVEMENTS.map((a) => ({
          ...a,
          unlocked: unlocked.has(a.id),
        }));
      },

      checkAchievements: () => {
        const { progress, unlockedAchievements } = get();
        const unlocked = new Set(unlockedAchievements);
        const p = (s: DSSlug) => progress[s]?.percent ?? 0;
        const quizOk = Object.values(progress).some(
          (e) => e.quizTotal > 0 && e.quizScore / e.quizTotal >= 0.8
        );

        const checks: Record<string, boolean> = {
          first_step: Object.values(progress).some((e) => e.lastVisited),
          "ll-explorer":
            p("singly-linked-lists") >= 100 &&
            p("doubly-linked-lists") >= 100 &&
            p("circularly-linked-lists") >= 100,
          "stack-specialist": p("stacks") >= 100,
          "queue-master": p("queues") >= 100,
          "tree-architect":
            p("binary-trees") >= 100 && p("balanced-search-trees") >= 100,
          "heap-champion": p("heaps") >= 100,
          "quiz-whiz": quizOk,
          "csd-legend": Object.values(progress).every((e) => e.percent >= 100),
        };

        // Map condition strings used in ACHIEVEMENTS
        const condMap: Record<string, boolean> = {
          visit_any: checks.first_step,
          sll_dll_cll_100: checks["ll-explorer"],
          stacks_100: checks["stack-specialist"],
          queues_100: checks["queue-master"],
          trees_100: checks["tree-architect"],
          heaps_100: checks["heap-champion"],
          quiz_80: checks["quiz-whiz"],
          all_100: checks["csd-legend"],
        };

        const newly: string[] = [];
        for (const a of ACHIEVEMENTS) {
          if (!unlocked.has(a.id) && condMap[a.condition]) {
            newly.push(a.id);
          }
        }
        if (newly.length) {
          set({
            unlockedAchievements: [...unlockedAchievements, ...newly],
            totalXp: get().totalXp + newly.length * 50,
          });
        }
      },
    }),
    {
      name: "csd201-progress",
      // Avoid SSR/client mismatch: rehydrate only after mount (see ThemeProvider).
      skipHydration: true,
    }
  )
);
