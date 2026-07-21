"use client";

import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Gauge,
  Turtle,
} from "lucide-react";
import { usePlaygroundStore, type AnimSpeed } from "@/lib/store/playground-store";
import { cn } from "@/lib/utils";

export function AnimationControls() {
  const {
    steps,
    currentStep,
    isPlaying,
    speed,
    autoPlay,
    play,
    pause,
    next,
    prev,
    resetAnim,
    goToStep,
    setSpeed,
    setAutoPlay,
  } = usePlaygroundStore();

  const total = steps.length;
  const progress = total > 0 ? ((currentStep + 1) / total) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-card/80 p-3 backdrop-blur">
      {/* Timeline */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            Bước {Math.max(0, currentStep + 1)} / {total || 0}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          className="relative h-2 cursor-pointer overflow-hidden rounded-full bg-muted"
          onClick={(e) => {
            if (!total) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            goToStep(Math.round(ratio * (total - 1)));
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-pink-500 transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="progress-shimmer absolute inset-0" />
          </div>
        </div>
        {/* Step ticks */}
        {total > 0 && total <= 20 && (
          <div className="mt-1.5 flex gap-0.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToStep(i)}
                className={cn(
                  "h-1 flex-1 rounded-full transition",
                  i <= currentStep ? "bg-violet-500" : "bg-muted"
                )}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-between">
        <div className="flex items-center gap-1">
          <CtrlBtn onClick={prev} disabled={currentStep < 0} title="Trước">
            <SkipBack className="h-4 w-4" />
          </CtrlBtn>
          {isPlaying ? (
            <CtrlBtn onClick={pause} title="Tạm dừng" primary>
              <Pause className="h-4 w-4" />
            </CtrlBtn>
          ) : (
            <CtrlBtn
              onClick={play}
              disabled={total === 0 || currentStep >= total - 1}
              title="Phát"
              primary
            >
              <Play className="h-4 w-4" />
            </CtrlBtn>
          )}
          <CtrlBtn
            onClick={next}
            disabled={currentStep >= total - 1 || total === 0}
            title="Tiếp"
          >
            <SkipForward className="h-4 w-4" />
          </CtrlBtn>
          <CtrlBtn onClick={resetAnim} title="Reset">
            <RotateCcw className="h-4 w-4" />
          </CtrlBtn>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSpeed(speed === 0.5 ? 1 : 0.5)}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition",
              speed === 0.5
                ? "bg-amber-500/15 text-amber-500"
                : "text-muted-foreground hover:bg-muted"
            )}
            title="Chậm"
          >
            <Turtle className="h-3.5 w-3.5" />
            Chậm
          </button>
          {([1, 1.5, 2] as AnimSpeed[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition",
                speed === s
                  ? "bg-violet-500/15 text-violet-500"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Gauge className="h-3 w-3" />×{s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAutoPlay(!autoPlay)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-[10px] font-medium transition",
              autoPlay
                ? "bg-emerald-500/15 text-emerald-500"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            Tự động {autoPlay ? "Bật" : "Tắt"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CtrlBtn({
  children,
  onClick,
  disabled,
  title,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-30",
        primary
          ? "bg-foreground text-background hover:opacity-90"
          : "border border-border bg-card hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
