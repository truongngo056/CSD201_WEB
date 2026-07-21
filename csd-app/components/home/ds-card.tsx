"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  GitBranch,
  Layers,
  Link as LinkIcon,
  ListOrdered,
  RefreshCw,
  Scale,
  Triangle,
  type LucideIcon,
} from "lucide-react";
import type { DataStructureMeta, DSSlug } from "@/types";
import { COLOR_MAP } from "@/lib/data/structures";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/lib/store/progress-store";

function useClientPercent(slug: DSSlug) {
  return useSyncExternalStore(
    useProgressStore.subscribe,
    () => useProgressStore.getState().progress[slug]?.percent ?? 0,
    () => 0
  );
}

const ICONS: Record<string, LucideIcon> = {
  Link: LinkIcon,
  ArrowLeftRight,
  RefreshCw,
  Layers,
  ListOrdered,
  GitBranch,
  Scale,
  Triangle,
};

interface DSCardProps {
  ds: DataStructureMeta;
  index: number;
  large?: boolean;
}

export function DSCard({ ds, index, large }: DSCardProps) {
  const Icon = ICONS[ds.icon] ?? Layers;
  const colors = COLOR_MAP[ds.color];
  const percent = useClientPercent(ds.slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className={cn(large ? "md:col-span-2 md:row-span-1" : "")}
    >
      <Link href={`/learn/${ds.slug}`} className="group block h-full">
        <div
          className={cn(
            "relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300",
            "hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1",
            colors.border,
            `hover:${colors.glow}`
          )}
          style={{
            boxShadow: "0 0 0 transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 20px 50px -12px color-mix(in srgb, currentColor 35%, transparent)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 0 0 transparent";
          }}
        >
          {/* Gradient wash */}
          <div
            className={cn(
              "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-30 blur-2xl transition group-hover:opacity-60",
              ds.gradient
            )}
          />
          <div
            className={cn(
              "pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-gradient-to-tr opacity-20 blur-2xl transition group-hover:opacity-50",
              ds.gradient
            )}
          />

          <div className="relative flex h-full flex-col">
            <div className="mb-4 flex items-start justify-between">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition group-hover:scale-110 group-hover:rotate-3",
                  ds.gradient
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  colors.soft,
                  colors.text
                )}
              >
                {ds.shortName}
              </span>
            </div>

            <h3 className="text-lg font-bold tracking-tight sm:text-xl">
              {ds.nameVi}
            </h3>
            <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
              {ds.tagline.vi}
            </p>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tiến độ</span>
                <span className={cn("font-semibold", colors.text)}>
                  {percent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn("h-full rounded-full bg-gradient-to-r", ds.gradient)}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percent}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center text-xs font-medium text-muted-foreground transition group-hover:text-foreground">
              Vào playground
              <span className="ml-1 transition group-hover:translate-x-1">→</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
