"use client";

import { useState } from "react";
import type { DataStructureMeta, OperationDef } from "@/types";
import { COLOR_MAP } from "@/lib/data/structures";
import { cn } from "@/lib/utils";
import {
  Code2,
  Play,
  FileCode2,
  Timer,
  Sparkles,
  Variable,
} from "lucide-react";
import { HighlightedCode } from "./highlighted-code";
import { usePlaygroundStore } from "@/lib/store/playground-store";

interface OperationsPanelProps {
  ds: DataStructureMeta;
  selectedOpId: string | null;
  inputValue: string;
  onSelectOp: (op: OperationDef) => void;
  onInputChange: (v: string) => void;
  onRun: () => void;
  isRunning?: boolean;
}

export function OperationsPanel({
  ds,
  selectedOpId,
  inputValue,
  onSelectOp,
  onInputChange,
  onRun,
  isRunning,
}: OperationsPanelProps) {
  const colors = COLOR_MAP[ds.color];
  const op =
    ds.operations.find((o) => o.id === selectedOpId) ?? ds.operations[0];
  const [tab, setTab] = useState<"java" | "pseudo">("java");

  const {
    codeLines,
    pseudoLines,
    variables,
    codeSnippet,
    currentStep,
    steps,
    messageVi,
  } = usePlaygroundStore();

  const activeLines = tab === "java" ? codeLines : pseudoLines;
  const hasSteps = steps.length > 0 && currentStep >= 0;
  const lineLabel =
    activeLines.length > 0
      ? activeLines.map((n) => n + 1).join(", ")
      : "—";

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className={cn("border-b border-border px-4 py-3", colors.soft)}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Thao tác · Theo dõi code
        </p>
        <h2 className="text-base font-bold">Hàm / Methods</h2>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border p-2">
        {ds.operations.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelectOp(o)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition",
              (selectedOpId ?? ds.operations[0].id) === o.id
                ? cn("bg-gradient-to-r text-white", ds.gradient)
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {o.name}()
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {op && (
          <>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Mô tả
              </p>
              <p className="text-xs leading-relaxed text-foreground/90">
                {op.description.vi}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Timer className={cn("h-3.5 w-3.5", colors.text)} />
              <span className="font-mono font-semibold">{op.complexity}</span>
              <span className="text-muted-foreground">·</span>
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span className="text-muted-foreground">{op.example}</span>
            </div>

            {/* Live step info */}
            {hasSteps && (
              <div className="space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Bước {currentStep + 1}/{steps.length} · Đang chạy
                </p>
                <p className="text-[12px] leading-snug text-foreground">
                  {messageVi}
                </p>
                {codeSnippet && (
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-[#0d1117] px-2 py-1.5 font-mono text-[11px] text-amber-300">
                    {codeSnippet}
                  </pre>
                )}
              </div>
            )}

            {/* Variables */}
            {hasSteps && variables.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Variable className="h-3 w-3" />
                  Biến
                </div>
                <div className="max-h-36 overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <tbody>
                      {variables.map((vr, i) => (
                        <tr
                          key={`${vr.name}-${i}`}
                          className={cn(
                            "border-b border-border/50 last:border-0",
                            vr.changed && "bg-amber-500/10"
                          )}
                        >
                          <td className="px-2.5 py-1 font-mono font-semibold text-sky-500">
                            {vr.name}
                            {vr.changed && (
                              <span className="ml-1 text-[9px] text-amber-500">
                                ★
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-1 text-right font-mono text-foreground">
                            {String(vr.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Code with highlight — prominent */}
            <div className="overflow-hidden rounded-xl border-2 border-violet-500/30 shadow-lg shadow-violet-500/5">
              <div className="flex items-center justify-between border-b border-border bg-[#161b22] px-1">
                <div className="flex flex-1">
                  <TabBtn
                    active={tab === "java"}
                    onClick={() => setTab("java")}
                    icon={<Code2 className="h-3 w-3" />}
                    label="Java"
                  />
                  <TabBtn
                    active={tab === "pseudo"}
                    onClick={() => setTab("pseudo")}
                    icon={<FileCode2 className="h-3 w-3" />}
                    label="Giả mã"
                  />
                </div>
              </div>
              <HighlightedCode
                code={tab === "java" ? op.javaCode : op.pseudocode}
                highlightLines={activeLines}
                languageLabel={
                  hasSteps
                    ? `Dòng đang chạy: ${lineLabel}`
                    : "Chạy thao tác để highlight dòng code"
                }
              />
            </div>

            <div className="rounded-lg bg-muted/50 px-2.5 py-1.5 font-mono text-[11px] text-foreground">
              {op.signature}
            </div>

            <div className="space-y-2 rounded-xl border border-border p-3">
              {op.needsValue && (
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {op.valueLabel?.vi ?? "Giá trị"}
                  </span>
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                    placeholder="vd. 42"
                  />
                </label>
              )}
              <button
                type="button"
                onClick={onRun}
                disabled={isRunning || (op.needsValue && inputValue === "")}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100",
                  "bg-gradient-to-r",
                  ds.gradient
                )}
              >
                <Play className="h-4 w-4" />
                Chạy từng bước
              </button>
              <p className="text-center text-[10px] text-muted-foreground">
                Sau khi chạy: bấm Next ⏭ để xem từng bước
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-medium transition",
        active
          ? "border-b-2 border-amber-400 text-amber-300"
          : "text-white/45 hover:text-white/80"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
