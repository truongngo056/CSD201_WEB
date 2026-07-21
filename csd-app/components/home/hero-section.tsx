"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Play, Sparkles } from "lucide-react";
import Link from "next/link";

const FLOATING_NODES = [
  { x: 12, y: 20, size: 18, color: "bg-sky-400", delay: 0 },
  { x: 78, y: 18, size: 14, color: "bg-violet-400", delay: 0.3 },
  { x: 22, y: 70, size: 16, color: "bg-pink-400", delay: 0.6 },
  { x: 85, y: 65, size: 20, color: "bg-emerald-400", delay: 0.2 },
  { x: 48, y: 12, size: 12, color: "bg-amber-400", delay: 0.5 },
  { x: 60, y: 78, size: 15, color: "bg-rose-400", delay: 0.8 },
  { x: 8, y: 48, size: 11, color: "bg-cyan-400", delay: 0.4 },
  { x: 90, y: 40, size: 13, color: "bg-orange-400", delay: 0.7 },
];

const CONNECTIONS = [
  [0, 4],
  [4, 1],
  [1, 7],
  [0, 2],
  [2, 5],
  [5, 3],
  [3, 7],
  [6, 0],
];

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; s: number; d: number }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: 1 + Math.random() * 2.5,
        d: Math.random() * 4,
      }))
    );
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setMouse({
        x: ((e.clientX - r.left) / r.width - 0.5) * 2,
        y: ((e.clientY - r.top) / r.height - 0.5) * 2,
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden rounded-3xl border border-border/50 px-6 py-16 sm:px-12 sm:py-24"
    >
      <div className="aurora-bg">
        <div className="aurora-blob" />
      </div>

      {/* Particles */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-foreground/20"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.s,
              height: p.s,
              animation: `pulse-glow ${3 + p.d}s ease-in-out infinite`,
              animationDelay: `${p.d}s`,
            }}
          />
        ))}
      </div>

      {/* Floating nodes + connections */}
      <svg
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-40"
        preserveAspectRatio="none"
      >
        {CONNECTIONS.map(([a, b], i) => {
          const na = FLOATING_NODES[a];
          const nb = FLOATING_NODES[b];
          const ox = mouse.x * 8;
          const oy = mouse.y * 8;
          return (
            <line
              key={i}
              x1={`${na.x + ox * 0.3}%`}
              y1={`${na.y + oy * 0.3}%`}
              x2={`${nb.x + ox * 0.2}%`}
              y2={`${nb.y + oy * 0.2}%`}
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground/30"
              strokeDasharray="4 4"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;16"
                dur="2s"
                repeatCount="indefinite"
              />
            </line>
          );
        })}
      </svg>

      {FLOATING_NODES.map((n, i) => (
        <div
          key={i}
          className={`float-node pointer-events-none absolute z-[2] rounded-full ${n.color} opacity-70 shadow-lg`}
          style={{
            left: `calc(${n.x}% + ${mouse.x * (6 + i)}px)`,
            top: `calc(${n.y}% + ${mouse.y * (6 + i)}px)`,
            width: n.size,
            height: n.size,
            animationDelay: `${n.delay}s`,
            boxShadow: `0 0 20px currentColor`,
          }}
        />
      ))}

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          Học cấu trúc dữ liệu qua trực quan · CSD201
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        >
          <span className="bg-gradient-to-r from-sky-400 via-violet-500 to-pink-500 bg-clip-text text-transparent">
            Trực quan. Học. Thành thạo
          </span>
          <br />
          <span className="text-foreground">Cấu trúc dữ liệu.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          Xem từng node di chuyển, từng con trỏ được nối lại, và thuật toán chạy
          theo thời gian thực. Tám module tương tác giúp hiểu sâu.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#modules"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:scale-105 hover:opacity-90"
          >
            <Play className="h-4 w-4" />
            Bắt đầu học
          </a>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-3 text-sm font-semibold transition hover:scale-105"
          >
            Làm kiểm tra
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 flex justify-center"
        >
          <a
            href="#modules"
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <span>Khám phá module</span>
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
