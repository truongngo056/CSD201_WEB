"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Home,
  Moon,
  Sun,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/lib/store/progress-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";

const links = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/progress", label: "Tiến độ", icon: Trophy },
  { href: "/quiz", label: "Kiểm tra", icon: BookOpen },
];

/** Always 0 on server + first hydration paint; real values after mount. */
function useClientXp() {
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

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const totalXp = useClientXp();
  const overall = useClientOverall();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/30 transition group-hover:scale-105">
            <Zap className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold tracking-tight">CSD201 Lab</p>
            <p className="text-[10px] text-muted-foreground">
              Trực quan · Học · Thành thạo
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-full bg-muted/60 p-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-card shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div
            className="hidden items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs md:flex"
            suppressHydrationWarning
          >
            <span className="font-semibold text-amber-500" suppressHydrationWarning>
              {totalXp} XP
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground" suppressHydrationWarning>
              {overall}% xong
            </span>
          </div>
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition hover:scale-105"
          >
            {hydrated && theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
