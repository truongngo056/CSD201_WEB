"use client";

import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import type { DataStructureMeta } from "@/types";
import { StructureCanvas } from "@/components/visualization/structure-canvas";
import { AnimationControls } from "./animation-controls";
import { usePlaygroundStore } from "@/lib/store/playground-store";
import { COLOR_MAP } from "@/lib/data/structures";
import { cn } from "@/lib/utils";

interface VisualizationPanelProps {
  ds: DataStructureMeta;
  onResetStructure: () => void;
}

export function VisualizationPanel({
  ds,
  onResetStructure,
}: VisualizationPanelProps) {
  const {
    vizState,
    messageVi,
    isFullscreen,
    setFullscreen,
    currentStep,
    steps,
    variables,
    codeSnippet,
  } = usePlaygroundStore();
  const colors = COLOR_MAP[ds.color];
  const hasStep = steps.length > 0 && currentStep >= 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
        isFullscreen && "fixed inset-2 z-50 shadow-2xl"
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Trực quan hóa · 50%
          </p>
          <p className={cn("text-sm font-semibold", colors.text)}>
            Playground trực tiếp
            {hasStep && (
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                Bước {currentStep + 1}/{steps.length}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn title="Đặt lại cấu trúc" onClick={onResetStructure}>
            <RotateCcw className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn
            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            onClick={() => setFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </IconBtn>
        </div>
      </div>

      {/* Step message — Vietnamese only */}
      <div className="space-y-1 border-b border-border bg-muted/30 px-4 py-2">
        <p className="text-[12px] leading-snug text-foreground">
          {messageVi || vizState.message || "Sẵn sàng"}
        </p>
        {codeSnippet && hasStep && (
          <p className="truncate font-mono text-[11px] text-amber-600 dark:text-amber-400">
            ↳ {codeSnippet}
          </p>
        )}
      </div>

      {/* Mini variable strip */}
      {hasStep && variables.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-1.5">
          {variables.slice(0, 8).map((vr, i) => (
            <span
              key={`${vr.name}-${i}`}
              className={cn(
                "rounded-md px-1.5 py-0.5 font-mono text-[10px]",
                vr.changed
                  ? "bg-amber-500/20 text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300"
                  : cn(colors.soft, colors.text)
              )}
              title={vr.changed ? "Đổi ở bước này" : undefined}
            >
              {vr.name}={String(vr.value)}
              {vr.changed ? " ★" : ""}
            </span>
          ))}
        </div>
      )}

      <div
        className={cn(
          "relative min-h-[250px] flex-1 w-full overflow-hidden",
          isFullscreen ? "h-[70vh]" : "min-h-[250px] sm:min-h-[300px]"
        )}
      >
        <StructureCanvas state={vizState} color={ds.color} kind={ds.slug} />
      </div>

      {vizState.meta && (
        <div className="flex flex-wrap gap-2 border-t border-border px-3 py-2">
          {Object.entries(vizState.meta)
            .filter(([k, v]) => k !== "array" && typeof v !== "object")
            .map(([k, v]) => (
              <span
                key={k}
                className={cn(
                  "rounded-md px-2 py-0.5 font-mono text-[10px]",
                  colors.soft,
                  colors.text
                )}
              >
                {k}: {String(v)}
              </span>
            ))}
        </div>
      )}

      <div className="border-t border-border p-2">
        <AnimationControls />
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition hover:bg-muted"
    >
      {children}
    </button>
  );
}
