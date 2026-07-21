"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import type { DataStructureMeta, DSSlug } from "@/types";
import type { OperationDef } from "@/types";
import { createEngine, type DSEngine } from "@/lib/structures";
import { TheoryPanel } from "./theory-panel";
import { VisualizationPanel } from "./visualization-panel";
import { OperationsPanel } from "./operations-panel";
import { usePlaygroundStore } from "@/lib/store/playground-store";
import { useProgressStore } from "@/lib/store/progress-store";
import { COLOR_MAP } from "@/lib/data/structures";
import { cn } from "@/lib/utils";

function useClientPercent(slug: DSSlug) {
  return useSyncExternalStore(
    useProgressStore.subscribe,
    () => useProgressStore.getState().progress[slug]?.percent ?? 0,
    () => 0
  );
}

export function LearningPlayground({ ds }: { ds: DataStructureMeta }) {
  const engineRef = useRef<DSEngine | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    selectedOpId,
    inputValue,
    steps,
    currentStep,
    isPlaying,
    speed,
    autoPlay,
    setSelectedOp,
    setInputValue,
    setSteps,
    setVizState,
    setMessage,
    play,
    next,
    applyStep,
  } = usePlaygroundStore();

  const visit = useProgressStore((s) => s.visit);
  const recordOperation = useProgressStore((s) => s.recordOperation);
  const percent = useClientPercent(ds.slug);
  const colors = COLOR_MAP[ds.color];

  // Init engine
  useEffect(() => {
    engineRef.current = createEngine(ds.slug, ds.sampleData);
    setVizState(engineRef.current.currentState());
    setSelectedOp(ds.operations[0]?.id ?? null);
    setSteps([]);
    setMessage(
      `Chào mừng tới ${ds.nameVi}. Chọn thao tác → Chạy → Next từng bước.`
    );
    setInputValue("10");
    visit(ds.slug);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ds.slug]);

  // Auto-play loop
  useEffect(() => {
    if (!isPlaying || !autoPlay) return;
    if (currentStep >= steps.length - 1) return;

    const step = steps[currentStep + 1] ?? steps[0];
    const duration = (step?.duration ?? 700) / speed;

    timerRef.current = setTimeout(() => {
      next();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, autoPlay, currentStep, steps, speed, next]);

  const handleSelectOp = useCallback(
    (op: OperationDef) => {
      setSelectedOp(op.id);
      setMessage(`Đã chọn ${op.name}() — ${op.complexity}`);
    },
    [setSelectedOp, setMessage]
  );

  const handleRun = useCallback(() => {
    if (!engineRef.current) return;
    const opId = selectedOpId ?? ds.operations[0]?.id;
    if (!opId) return;

    const op = ds.operations.find((o) => o.id === opId);
    const value =
      op?.needsValue && inputValue !== ""
        ? Number(inputValue)
        : undefined;

    if (op?.needsValue && (value === undefined || Number.isNaN(value))) {
      setMessage("Vui lòng nhập một số hợp lệ.");
      return;
    }

    const animSteps = engineRef.current.run(opId, value);
    setSteps(animSteps);

    // Apply first step immediately so code + variables match step 1
    if (animSteps.length > 0) {
      usePlaygroundStore.setState({ currentStep: 0 });
      applyStep(animSteps[0]);
      if (autoPlay) {
        play();
      }
    } else {
      setVizState(engineRef.current.currentState());
    }

    recordOperation(ds.slug);
  }, [
    selectedOpId,
    ds,
    inputValue,
    setSteps,
    setVizState,
    setMessage,
    autoPlay,
    play,
    applyStep,
    recordOperation,
  ]);

  const handleResetStructure = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.setValues([]);
    setVizState(engineRef.current.currentState());
    setSteps([]);
    setMessage("Đã đặt lại — cấu trúc rỗng.");
    usePlaygroundStore.setState({ currentStep: -1, isPlaying: false });
  }, [setVizState, setSteps, setMessage]);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {ds.nameVi}
              </h1>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  colors.soft,
                  colors.text
                )}
              >
                {ds.shortName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{ds.tagline.vi}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r", ds.gradient)}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs font-semibold">{percent}%</span>
          </div>
          <Link
            href={`/quiz/${ds.slug}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white transition hover:scale-105",
              "bg-gradient-to-r",
              ds.gradient
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Kiểm tra
          </Link>
        </div>
      </div>

      {/* 25 / 50 / 25 layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-3">
        <div className="lg:col-span-3 lg:h-[calc(100vh-11rem)]">
          <TheoryPanel ds={ds} />
        </div>
        <div className="lg:col-span-6 lg:h-[calc(100vh-11rem)]">
          <VisualizationPanel ds={ds} onResetStructure={handleResetStructure} />
        </div>
        <div className="lg:col-span-3 lg:h-[calc(100vh-11rem)]">
          <OperationsPanel
            ds={ds}
            selectedOpId={selectedOpId}
            inputValue={inputValue}
            onSelectOp={handleSelectOp}
            onInputChange={setInputValue}
            onRun={handleRun}
          />
        </div>
      </div>
    </div>
  );
}
