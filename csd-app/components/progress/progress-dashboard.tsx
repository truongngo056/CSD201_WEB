"use client";

import Link from "next/link";
import { useSyncExternalStore, useMemo } from "react";
import { motion } from "framer-motion";
import { DATA_STRUCTURES, COLOR_MAP } from "@/lib/data/structures";
import { ACHIEVEMENTS } from "@/lib/data/quizzes";
import {
  emptyProgressSnapshot,
  useProgressStore,
} from "@/lib/store/progress-store";
import { cn } from "@/lib/utils";
import { Lock, Unlock } from "lucide-react";
import { useHydrated } from "@/lib/hooks/use-hydrated";

function useClientTotalXp() {
  return useSyncExternalStore(
    useProgressStore.subscribe,
    () => useProgressStore.getState().totalXp,
    () => 0
  );
}

function useClientOverall() {
  return useSyncExternalStore(
    useProgressStore.subscribe,
    () => useProgressStore.getState().getOverallPercent(),
    () => 0
  );
}

export function ProgressDashboard() {
  const hydrated = useHydrated();
  const totalXp = useClientTotalXp();
  const overall = useClientOverall();
  // After skipHydration, progress stays at defaults until rehydrate() — safe for SSR.
  const progress = useProgressStore((s) => s.progress);
  const unlockedAchievements = useProgressStore((s) => s.unlockedAchievements);
  const achievements = useMemo(() => {
    const unlocked = new Set(unlockedAchievements);
    return ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: unlocked.has(a.id),
    }));
  }, [unlockedAchievements]);
  const displayProgress = hydrated ? progress : emptyProgressSnapshot();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tiến độ của bạn</h1>
        <p className="mt-1 text-muted-foreground">
          Theo dõi mức độ thành thạo 8 cấu trúc dữ liệu
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tổng quan" value={`${overall}%`} sub="Hoàn thành trung bình" gradient="from-sky-400 to-violet-500" />
        <StatCard label="Tổng XP" value={`${totalXp}`} sub="Điểm kinh nghiệm" gradient="from-amber-400 to-orange-500" />
        <StatCard
          label="Thành tựu"
          value={`${
            hydrated
              ? achievements.filter((a) => a.unlocked).length
              : 0
          }/${achievements.length}`}
          sub="Huy hiệu đã mở"
          gradient="from-pink-400 to-rose-500"
        />
      </div>

      {/* Module progress */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Module</h2>
        <div className="space-y-3">
          {DATA_STRUCTURES.map((ds, i) => {
            const p = displayProgress[ds.slug];
            const colors = COLOR_MAP[ds.color];
            return (
              <motion.div
                key={ds.slug}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/learn/${ds.slug}`}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/20 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white",
                      ds.gradient
                    )}
                  >
                    {ds.shortName.slice(0, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{ds.nameVi}</p>
                      <span className={cn("text-sm font-bold", colors.text)}>
                        {p?.percent ?? 0}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r", ds.gradient)}
                        style={{ width: `${p?.percent ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {p?.operationsRun ?? 0} ops · quiz{" "}
                      {p?.quizTotal
                        ? `${p.quizScore}/${p.quizTotal}`
                        : "—"}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Thành tựu</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map((a, i) => {
            const unlocked = hydrated ? a.unlocked : false;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className={cn(
                  "rounded-2xl border p-4 transition",
                  unlocked
                    ? "border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/10"
                    : "border-border bg-card opacity-60"
                )}
              >
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-3xl">{a.icon}</span>
                  {unlocked ? (
                    <Unlock className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="font-bold">{a.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  gradient,
}: {
  label: string;
  value: string;
  sub: string;
  gradient: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent",
          gradient
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
