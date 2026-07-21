"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface HighlightedCodeProps {
  code: string;
  highlightLines?: number[];
  className?: string;
  languageLabel?: string;
}

/** Renders multiline code with 0-based line highlighting */
export function HighlightedCode({
  code,
  highlightLines = [],
  className,
  languageLabel,
}: HighlightedCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const hl = new Set(highlightLines);
  const activeFirst =
    highlightLines.length > 0 ? Math.min(...highlightLines) : -1;

  useEffect(() => {
    if (activeFirst < 0 || !containerRef.current) return;
    const el = containerRef.current.querySelector(
      `[data-line="${activeFirst}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeFirst, highlightLines]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "max-h-72 overflow-auto bg-[#0d1117] font-mono text-[12px] leading-6 text-[#e6edf3] sm:max-h-80 sm:text-[13px]",
        className
      )}
    >
      {languageLabel && (
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-amber-500/30 bg-[#161b22]/95 px-3 py-1.5 text-[11px] font-medium text-amber-300/90 backdrop-blur">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-[10px] font-black text-black">
            ▶
          </span>
          {languageLabel}
        </div>
      )}
      <div className="py-1.5">
        {lines.map((line, i) => {
          const active = hl.has(i);
          const isPrimary = i === activeFirst;
          return (
            <div
              key={i}
              data-line={i}
              className={cn(
                "group relative flex border-l-[3px] px-0 transition-all duration-300",
                active
                  ? "border-l-amber-400 bg-amber-400/20 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.15)]"
                  : "border-l-transparent hover:bg-white/[0.04]"
              )}
            >
              {isPrimary && (
                <span
                  className="absolute left-0 top-1/2 z-10 -translate-x-0.5 -translate-y-1/2 text-[10px] text-amber-400"
                  aria-hidden
                >
                  ▸
                </span>
              )}
              <span
                className={cn(
                  "w-9 shrink-0 select-none pr-2 text-right text-[11px] tabular-nums",
                  active
                    ? "font-bold text-amber-400"
                    : "text-white/30 group-hover:text-white/45"
                )}
              >
                {i + 1}
              </span>
              <pre
                className={cn(
                  "min-w-0 flex-1 overflow-x-auto whitespace-pre pr-3 pl-0.5",
                  active && "font-semibold text-amber-50"
                )}
              >
                {line.length ? line : " "}
              </pre>
              {active && (
                <span className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-amber-400/80" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
