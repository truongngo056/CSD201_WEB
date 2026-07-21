"use client";

import { useState } from "react";
import type { BiText, DataStructureMeta } from "@/types";
import { COLOR_MAP } from "@/lib/data/structures";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Timer,
  XCircle,
  ChevronDown,
  Workflow,
  BookMarked,
} from "lucide-react";

type SectionId =
  | "def"
  | "how"
  | "terms"
  | "char"
  | "adv"
  | "dis"
  | "app"
  | "cpx";

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: typeof BookOpen;
}[] = [
  { id: "def", label: "Định nghĩa", icon: BookOpen },
  { id: "how", label: "Cách hoạt động", icon: Workflow },
  { id: "terms", label: "Thuật ngữ", icon: BookMarked },
  { id: "char", label: "Đặc điểm", icon: Lightbulb },
  { id: "adv", label: "Ưu điểm", icon: CheckCircle2 },
  { id: "dis", label: "Nhược điểm", icon: XCircle },
  { id: "app", label: "Ứng dụng", icon: Lightbulb },
  { id: "cpx", label: "Độ phức tạp", icon: Timer },
];

export function TheoryPanel({ ds }: { ds: DataStructureMeta }) {
  const [open, setOpen] = useState<SectionId | "">("def");
  const colors = COLOR_MAP[ds.color];

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className={cn("border-b border-border px-4 py-3", colors.soft)}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Lý thuyết
        </p>
        <h2 className={cn("text-base font-bold leading-tight", colors.text)}>
          {ds.nameVi}
        </h2>
        <p className="text-[11px] text-muted-foreground">{ds.shortName}</p>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const isOpen = open === id;
          return (
            <div
              key={id}
              className="overflow-hidden rounded-xl border border-border/60"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? "" : id)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium transition hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", colors.text)} />
                  <span className="text-[13px]">{label}</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                <div className="border-t border-border/50 px-3 py-2.5 text-xs leading-relaxed">
                  {id === "def" && <ViBlock text={ds.definition} />}
                  {id === "how" && <ViBlock text={ds.howItWorks} />}
                  {id === "terms" && (
                    <ul className="space-y-2">
                      {ds.keyTerms.map((t) => (
                        <li
                          key={t.term}
                          className="rounded-lg bg-muted/40 px-2 py-1.5"
                        >
                          <span className={cn("font-bold", colors.text)}>
                            {t.term}
                          </span>
                          <p className="mt-0.5 text-muted-foreground">{t.vi}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {id === "char" && <ViList items={ds.characteristics} />}
                  {id === "adv" && (
                    <ViList items={ds.advantages} prefix="+" tone="good" />
                  )}
                  {id === "dis" && (
                    <ViList items={ds.disadvantages} prefix="−" tone="bad" />
                  )}
                  {id === "app" && <ViList items={ds.applications} />}
                  {id === "cpx" && (
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <Row label="Tìm kiếm" value={ds.complexity.search} />
                      <Row label="Thêm" value={ds.complexity.insert} />
                      <Row label="Xóa" value={ds.complexity.delete} />
                      {ds.complexity.access && (
                        <Row label="Truy cập" value={ds.complexity.access} />
                      )}
                      <Row label="Không gian" value={ds.complexity.space} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function ViBlock({ text }: { text: BiText }) {
  return <p className="text-foreground/90">{text.vi}</p>;
}

function ViList({
  items,
  prefix,
  tone,
}: {
  items: BiText[];
  prefix?: string;
  tone?: "good" | "bad";
}) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="rounded-lg bg-muted/30 px-2 py-1.5">
          {prefix && (
            <span
              className={cn(
                "mr-1 font-bold",
                tone === "good" && "text-emerald-500",
                tone === "bad" && "text-rose-500"
              )}
            >
              {prefix}
            </span>
          )}
          <span className="text-foreground/90">{item.vi}</span>
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
