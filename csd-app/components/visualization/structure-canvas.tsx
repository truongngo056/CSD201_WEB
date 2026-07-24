"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import type {
  ColorTheme,
  VisualizationState,
  VizEdge,
  VizNode,
  VizPointer,
  VizAnnotation,
} from "@/types";

const THEME_COLORS: Record<
  ColorTheme,
  { fill: string; stroke: string; glow: string; muted: string }
> = {
  sky: { fill: "#0ea5e9", stroke: "#38bdf8", glow: "#7dd3fc", muted: "#0c4a6e" },
  purple: { fill: "#a855f7", stroke: "#c084fc", glow: "#e9d5ff", muted: "#581c87" },
  orange: { fill: "#f97316", stroke: "#fb923c", glow: "#fed7aa", muted: "#7c2d12" },
  pink: { fill: "#ec4899", stroke: "#f472b6", glow: "#fbcfe8", muted: "#831843" },
  mint: { fill: "#14b8a6", stroke: "#2dd4bf", glow: "#99f6e4", muted: "#115e59" },
  green: { fill: "#22c55e", stroke: "#4ade80", glow: "#bbf7d0", muted: "#14532d" },
  yellow: { fill: "#f59e0b", stroke: "#fbbf24", glow: "#fde68a", muted: "#78350f" },
  coral: { fill: "#f43f5e", stroke: "#fb7185", glow: "#fecdd3", muted: "#881337" },
};

/** Smooth “fly” between positions when HEAD/curr/nodes update */
const FLY: Transition = {
  type: "spring",
  stiffness: 160,
  damping: 22,
  mass: 0.9,
};

const FLY_FAST: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 26,
  mass: 0.75,
};

interface StructureCanvasProps {
  state: VisualizationState;
  color: ColorTheme;
  kind?: string;
}

function isNullNode(n: VizNode) {
  return n.role === "null" || n.id.startsWith("null");
}

/** Labels that duplicate external pointer chips — hide on node */
const REDUNDANT_NODE_LABELS = new Set([
  "HEAD",
  "TAIL",
  "HEAD/TAIL",
  "TOP",
  "FRONT",
  "REAR",
  "FRONT/REAR",
  "F/R",
  "curr",
  "prev",
  "HEAD+curr",
  "HEAD+prev",
  "TAIL+curr",
  "TAIL+prev",
]);

/** Preferred offset of pointer chip relative to target node center */
const POINTER_OFFSET: Record<string, { dx: number; dy: number }> = {
  head: { dx: 0, dy: -90 },
  tail: { dx: 0, dy: -90 },
  "head/tail": { dx: 0, dy: -90 },
  curr: { dx: -54, dy: -90 },
  prev: { dx: 54, dy: -120 },
  newnode: { dx: 0, dy: -90 },
  // Stack: chip sits to the RIGHT of the top drawer; arrow points left into it
  top: { dx: 118, dy: 0 },
  front: { dx: 0, dy: -90 },
  rear: { dx: 0, dy: -90 },
  "front/rear": { dx: 0, dy: -90 },
  value: { dx: 0, dy: -70 },
};

/** Structural endpoint pairs — merge into one chip when they share a target */
const STRUCTURAL_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["head", "tail"],
  ["front", "rear"],
];

/**
 * Prepare pointer chips for display:
 * - Never show node values on the chip (name only; arrow points at the node)
 * - head+tail (or front+rear) on the same target → one combined label
 * - Stable ids so chips fly to the new node on update
 */
function preparePointers(pointers: VizPointer[]): VizPointer[] {
  const byName = new Map<string, VizPointer>();
  for (const p of pointers) {
    byName.set(p.name.toLowerCase().replace(/\s+/g, ""), p);
  }

  const used = new Set<string>();
  const result: VizPointer[] = [];

  for (const [a, b] of STRUCTURAL_PAIRS) {
    const pa = byName.get(a);
    const pb = byName.get(b);
    if (!pa || !pb) continue;

    used.add(pa.id);
    used.add(pb.id);

    const sameTarget = pa.targetId === pb.targetId;
    if (sameTarget) {
      // One chip only: "head/tail" or "front/rear"
      // Keep `pa.id` (head/front) stable so the chip flies on later updates
      const midX =
        pa.x !== undefined && pb.x !== undefined
          ? (pa.x + pb.x) / 2
          : pa.x ?? pb.x;
      const midY =
        pa.y !== undefined && pb.y !== undefined
          ? Math.min(pa.y, pb.y)
          : pa.y ?? pb.y;
      result.push({
        id: pa.id,
        name: `${a}/${b}`,
        targetId: pa.targetId,
        x: midX,
        y: midY,
        highlighted: Boolean(pa.highlighted || pb.highlighted),
      });
    } else {
      // Separate chips — name only, no value; each flies to its target
      result.push({
        id: pa.id,
        name: a,
        targetId: pa.targetId,
        x: pa.x,
        y: pa.y,
        highlighted: pa.highlighted,
      });
      result.push({
        id: pb.id,
        name: b,
        targetId: pb.targetId,
        x: pb.x,
        y: pb.y,
        highlighted: pb.highlighted,
      });
    }
  }

  for (const p of pointers) {
    if (used.has(p.id)) continue;
    // Name only — arrow points at the node; no "=value" on the chip
    result.push({
      id: p.id,
      name: p.name,
      targetId: p.targetId,
      x: p.x,
      y: p.y,
      highlighted: p.highlighted,
    });
  }

  return result;
}

function shouldShowNodeLabel(label: string | undefined, pointers: VizPointer[]) {
  if (!label) return false;
  if (REDUNDANT_NODE_LABELS.has(label)) return false;
  const lower = label.toLowerCase();
  if (pointers.some((p) => lower.includes(p.name.toLowerCase()))) return false;
  return true;
}

function computePointerPositions(
  pointers: VizPointer[],
  nodeMap: Map<string, VizNode>
) {
  const pointerPos = new Map<string, { x: number; y: number }>();
  const byTarget = new Map<string, VizPointer[]>();

  for (const p of pointers) {
    const key =
      p.targetId && nodeMap.has(p.targetId)
        ? `n:${p.targetId}`
        : p.targetId === null
          ? `null:${p.id}`
          : `abs:${p.id}`;
    const list = byTarget.get(key) ?? [];
    list.push(p);
    byTarget.set(key, list);
  }

  for (const [, group] of byTarget) {
    group.forEach((p, idx) => {
      const nameKey = p.name.toLowerCase().replace(/\s+/g, "");
      const pref = POINTER_OFFSET[nameKey] ?? { dx: 0, dy: -96 };

      if (p.targetId && nodeMap.has(p.targetId)) {
        const n = nodeMap.get(p.targetId)!;
        const nx = n.x ?? 0;
        const ny = n.y ?? 0;
        const fan = (idx - (group.length - 1) / 2) * 70;
        pointerPos.set(p.id, {
          x: nx + pref.dx + fan,
          y: ny + pref.dy - idx * 4,
        });
      } else if (p.x !== undefined && p.y !== undefined) {
        pointerPos.set(p.id, { x: p.x, y: p.y });
      } else {
        pointerPos.set(p.id, {
          x: (p.x ?? 80) + idx * 80,
          y: p.y ?? 80,
        });
      }
    });
  }

  return pointerPos;
}

/* ── Animated subcomponents ─────────────────────────────────────── */

function getMemAddr(id: string, value: string | number): string {
  let hash = 0;
  const str = `${id}:${value}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash % 65535)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return `0x${hex}`;
}

function AnimatedNode({
  n,
  index,
  theme,
  pointers,
  isHovered,
  onHover,
}: {
  n: VizNode;
  index: number;
  theme: (typeof THEME_COLORS)[ColorTheme];
  pointers: VizPointer[];
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
}) {
  const x = n.x ?? 0;
  const y = n.y ?? 0;
  const r = isNullNode(n) ? 0 : n.role === "slot" ? 22 : 28;
  const active = n.active || n.highlighted;
  const isNew = n.role === "new";
  const isGhost = n.role === "ghost" || n.fading;
  const isRemoved = n.role === "removed";
  const memAddr = getMemAddr(n.id, n.value);

  // ── Stack wardrobe drawer (tủ quần áo) ──
  if (n.role === "slot" || (isNew && n.sublabel === "↓ push")) {
    const w = 118;
    const h = 42;
    const fill = isRemoved
      ? "#64748b"
      : isNew
        ? "#f59e0b"
        : active
          ? theme.fill
          : `${theme.fill}dd`;
    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.6, x, y }}
        animate={{
          opacity: isGhost || isRemoved ? 0.35 : 1,
          scale: isHovered ? 1.04 : 1,
          x,
          y,
        }}
        exit={{ opacity: 0, scale: 0.5, y: y - 20 }}
        transition={FLY}
        style={{ originX: "0px", originY: "0px", cursor: "pointer" }}
        onMouseEnter={() => onHover?.(n.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        {/* Drawer body */}
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={7}
          fill={fill}
          stroke={active || isNew || isHovered ? "#fbbf24" : theme.stroke}
          strokeWidth={active || isNew || isHovered ? 2.5 : 1.75}
          filter={active || isHovered ? "url(#glow)" : undefined}
        />
        {/* 3D top lip */}
        <rect
          x={-w / 2 + 3}
          y={-h / 2 + 3}
          width={w - 6}
          height={8}
          rx={3}
          fill="white"
          opacity={0.12}
        />
        {/* Drawer handle */}
        <rect
          x={-18}
          y={-h / 2 + 5}
          width={36}
          height={5}
          rx={2.5}
          fill={active || isNew ? "#fde68a" : theme.glow}
          opacity={0.85}
        />
        {/* Value */}
        <text
          x={0}
          y={8}
          textAnchor="middle"
          fill="white"
          fontSize={15}
          fontWeight={800}
          fontFamily="var(--font-geist-sans), system-ui"
        >
          {n.value}
        </text>
        {/* Index badge on left */}
        {n.sublabel && n.sublabel !== "↓ push" && (
          <text
            x={-w / 2 - 6}
            y={4}
            textAnchor="end"
            fill={active ? "#fbbf24" : theme.stroke}
            fontSize={10}
            fontWeight={700}
            fontFamily="ui-monospace, monospace"
          >
            {n.sublabel}
          </text>
        )}
        {n.sublabel === "↓ push" && (
          <text
            x={0}
            y={h / 2 + 14}
            textAnchor="middle"
            fill="#fbbf24"
            fontSize={10}
            fontWeight={700}
          >
            ↓ push
          </text>
        )}
        {shouldShowNodeLabel(n.label, pointers) && (
          <text
            x={0}
            y={-h / 2 - 10}
            textAnchor="middle"
            fill="#fbbf24"
            fontSize={10}
            fontWeight={800}
          >
            {n.label}
          </text>
        )}
      </motion.g>
    );
  }

  if (isNullNode(n)) {
    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.6, x, y }}
        animate={{
          opacity: active ? 1 : 0.85,
          scale: 1,
          x,
          y,
        }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={FLY}
        style={{ originX: "0px", originY: "0px" }}
      >
        <rect
          x={-32}
          y={-18}
          width={64}
          height={36}
          rx={8}
          fill="none"
          stroke={active ? "#fbbf24" : theme.stroke}
          strokeWidth={active ? 2.5 : 1.5}
          strokeDasharray="5 3"
          opacity={0.9}
        />
        {active && (
          <rect
            x={-36}
            y={-22}
            width={72}
            height={44}
            rx={10}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={1}
            opacity={0.5}
          >
            <animate
              attributeName="opacity"
              values="0.2;0.7;0.2"
              dur="1.2s"
              repeatCount="indefinite"
            />
          </rect>
        )}
        <text
          x={0}
          y={5}
          textAnchor="middle"
          fill={active ? "#fbbf24" : theme.stroke}
          fontSize={12}
          fontWeight={700}
          fontFamily="ui-monospace, monospace"
        >
          NULL
        </text>
        {n.label && (
          <text
            x={0}
            y={-28}
            textAnchor="middle"
            fill={theme.stroke}
            fontSize={10}
            fontWeight={600}
          >
            {n.label}
          </text>
        )}
        {n.sublabel && (
          <text
            x={0}
            y={32}
            textAnchor="middle"
            fill={theme.glow}
            fontSize={9}
            fontFamily="ui-monospace, monospace"
          >
            {n.sublabel}
          </text>
        )}
      </motion.g>
    );
  }

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.45, x, y }}
      animate={{
        opacity: isGhost || isRemoved ? 0.35 : 1,
        scale: isHovered ? 1.12 : 1,
        x,
        y,
      }}
      exit={{ opacity: 0, scale: 0.35 }}
      transition={FLY}
      style={{ originX: "0px", originY: "0px", cursor: "pointer" }}
      onMouseEnter={() => onHover?.(n.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {(active || isHovered) && (
        <circle
          cx={0}
          cy={0}
          r={r + 8}
          fill="none"
          stroke={isNew ? "#fbbf24" : isHovered ? "#38bdf8" : theme.glow}
          strokeWidth={2}
          opacity={0.7}
          filter="url(#glow)"
        >
          <animate
            attributeName="r"
            values={`${r + 6};${r + 14};${r + 6}`}
            dur="1.2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {isNew && (
        <circle
          cx={0}
          cy={0}
          r={r + 4}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      )}

      <circle
        cx={0}
        cy={0}
        r={r}
        fill={
          isRemoved
            ? "#64748b"
            : isNew
              ? "#f59e0b"
              : active
                ? theme.fill
                : `${theme.fill}cc`
        }
        stroke={active || isNew || isHovered ? "#fbbf24" : theme.stroke}
        strokeWidth={active || isNew || isHovered ? 3 : 2}
        filter={active || isHovered ? "url(#glow)" : undefined}
        opacity={isGhost ? 0.45 : 1}
      />
      <text
        x={0}
        y={4}
        textAnchor="middle"
        fill="white"
        fontSize={14}
        fontWeight={700}
        fontFamily="var(--font-geist-sans), system-ui"
      >
        {n.value}
      </text>

      {/* Memory Address Tag */}
      <rect
        x={-22}
        y={r - 4}
        width={44}
        height={13}
        rx={3}
        fill="#090d16"
        stroke={theme.stroke}
        strokeWidth={0.75}
        opacity={0.9}
      />
      <text
        x={0}
        y={r + 5}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={8}
        fontWeight={600}
        fontFamily="ui-monospace, monospace"
      >
        {memAddr}
      </text>

      {shouldShowNodeLabel(n.label, pointers) && (
        <g>
          <rect
            x={-Math.max(22, (n.label?.length ?? 0) * 4)}
            y={-r - 24}
            width={Math.max(44, (n.label?.length ?? 0) * 8)}
            height={15}
            rx={4}
            fill={
              n.label === "NEW" || n.label === "newNode"
                ? "#f59e0b"
                : theme.fill
            }
            opacity={0.95}
          />
          <text
            x={0}
            y={-r - 13}
            textAnchor="middle"
            fill="white"
            fontSize={9}
            fontWeight={700}
          >
            {n.label}
          </text>
        </g>
      )}

      {n.sublabel && (
        <text
          x={0}
          y={r + 22}
          textAnchor="middle"
          fill={active ? "#fbbf24" : theme.stroke}
          fontSize={9}
          fontWeight={600}
          fontFamily="ui-monospace, monospace"
        >
          {n.sublabel}
        </text>
      )}

      {n.balanceFactor !== undefined && (
        <text
          x={r + 4}
          y={-r + 4}
          fill={Math.abs(n.balanceFactor) > 1 ? "#ef4444" : theme.stroke}
          fontSize={10}
          fontWeight={700}
        >
          {n.balanceFactor > 0 ? `+${n.balanceFactor}` : n.balanceFactor}
        </text>
      )}
    </motion.g>
  );
}

/** Wardrobe frame for stack — open top, side walls, floor (tủ quần áo) */
function StackWardrobe({
  cabinet,
  theme,
  size,
}: {
  cabinet: {
    cx: number;
    baseY: number;
    slotH: number;
    slotW: number;
    slots: number;
    left: number;
    right: number;
    bottom: number;
    top: number;
  };
  theme: (typeof THEME_COLORS)[ColorTheme];
  size: number;
}) {
  const { left, right, top, bottom, slotH, baseY, slots, cx, slotW } = cabinet;
  const wall = 14;
  const innerL = left + wall;
  const innerR = right - wall;

  return (
    <g opacity={0.95}>
      {/* Outer body */}
      <rect
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        rx={10}
        fill="#0f172a"
        stroke={theme.stroke}
        strokeWidth={2.5}
        opacity={0.92}
      />
      {/* Inner cavity */}
      <rect
        x={innerL}
        y={top + 10}
        width={innerR - innerL}
        height={bottom - top - 28}
        rx={4}
        fill="#020617"
        stroke={theme.muted}
        strokeWidth={1}
        opacity={0.85}
      />
      {/* Open top lip (mouth of wardrobe) */}
      <path
        d={`M ${left + 4} ${top + 8}
            L ${left + 18} ${top - 14}
            L ${right - 18} ${top - 14}
            L ${right - 4} ${top + 8} Z`}
        fill={theme.fill}
        opacity={0.35}
        stroke={theme.stroke}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={top - 22}
        textAnchor="middle"
        fill={theme.glow}
        fontSize={10}
        fontWeight={700}
        fontFamily="ui-monospace, monospace"
      >
        OPEN TOP · push / pop
      </text>
      {/* Empty shelf guides */}
      {Array.from({ length: slots }).map((_, i) => {
        const y = baseY - i * slotH;
        const filled = i < size;
        if (filled) return null;
        return (
          <line
            key={`shelf-${i}`}
            x1={cx - slotW / 2 + 6}
            y1={y + slotH / 2 - 4}
            x2={cx + slotW / 2 - 6}
            y2={y + slotH / 2 - 4}
            stroke={theme.stroke}
            strokeWidth={1}
            strokeDasharray="4 5"
            opacity={0.25}
          />
        );
      })}
      {/* Floor plank */}
      <rect
        x={left + 6}
        y={bottom - 18}
        width={right - left - 12}
        height={12}
        rx={3}
        fill={theme.fill}
        opacity={0.45}
      />
      <text
        x={cx}
        y={bottom + 16}
        textAnchor="middle"
        fill={theme.stroke}
        fontSize={10}
        fontWeight={700}
        opacity={0.8}
      >
        👕 tủ · LIFO
      </text>
      {/* Left door hinge decoration */}
      <circle cx={left + 7} cy={(top + bottom) / 2 - 40} r={3} fill={theme.glow} opacity={0.5} />
      <circle cx={left + 7} cy={(top + bottom) / 2 + 40} r={3} fill={theme.glow} opacity={0.5} />
      {/* Right door hinge */}
      <circle cx={right - 7} cy={(top + bottom) / 2 - 40} r={3} fill={theme.glow} opacity={0.5} />
      <circle cx={right - 7} cy={(top + bottom) / 2 + 40} r={3} fill={theme.glow} opacity={0.5} />
    </g>
  );
}

/**
 * Soft quadratic arc.
 * - bowMode "perp": offset along edge perpendicular (signed by `bow`)
 * - bowMode "outward": push control point away from polygon center
 */
function curvedEdgePath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  bow: number,
  center?: { x: number; y: number } | null
): { d: string; cx: number; cy: number } {
  const mx = (fromX + toX) / 2;
  const my = (fromY + toY) / 2;

  if (center) {
    let ox = mx - center.x;
    let oy = my - center.y;
    let olen = Math.hypot(ox, oy);
    // 2-node case: midpoint sits on center → fall back to vertical bow
    if (olen < 4) {
      ox = 0;
      oy = bow >= 0 ? 1 : -1;
      olen = 1;
    }
    const amt = Math.abs(bow);
    const cx = mx + (ox / olen) * amt;
    const cy = my + (oy / olen) * amt;
    return {
      d: `M ${fromX} ${fromY} Q ${cx} ${cy} ${toX} ${toY}`,
      cx,
      cy,
    };
  }

  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const cx = mx + px * bow;
  const cy = my + py * bow;
  return {
    d: `M ${fromX} ${fromY} Q ${cx} ${cy} ${toX} ${toY}`,
    cx,
    cy,
  };
}

function EdgeLabelPill({
  x,
  y,
  text,
  stroke,
  themeStroke,
  hl,
}: {
  x: number;
  y: number;
  text: string;
  stroke: string;
  themeStroke: string;
  hl: boolean;
}) {
  const w = Math.max(32, text.length * 6.5 + 8);
  return (
    <g>
      <motion.rect
        initial={false}
        animate={{ x: x - w / 2, y: y - 7 }}
        transition={FLY_FAST}
        width={w}
        height={14}
        rx={4}
        fill="#0f172a"
        opacity={0.9}
        stroke={hl ? "#fbbf24" : themeStroke}
        strokeWidth={0.75}
      />
      <motion.text
        initial={false}
        animate={{ x, y: y + 1 }}
        transition={FLY_FAST}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={hl ? "#fbbf24" : stroke}
        fontSize={9}
        fontWeight={hl ? 700 : 600}
        fontFamily="ui-monospace, monospace"
      >
        {text}
      </motion.text>
    </g>
  );
}

function AnimatedEdge({
  e,
  from,
  to,
  theme,
  curved = false,
  center = null,
}: {
  e: VizEdge;
  from: VizNode;
  to: VizNode;
  theme: (typeof THEME_COLORS)[ColorTheme];
  /** Circular list: soft arcs so edges don't overlap */
  curved?: boolean;
  /** Polygon center — bow edges outward */
  center?: { x: number; y: number } | null;
}) {
  const x1 = from.x ?? 0;
  const y1 = from.y ?? 0;
  const x2 = to.x ?? 0;
  const y2 = to.y ?? 0;
  const isLoop = e.type === "loop";
  const isPrev = e.type === "prev";
  const isPtr = e.type === "pointer";
  const hl = e.highlighted || e.animated;
  const stroke = hl
    ? "#fbbf24"
    : isPtr
      ? "#a78bfa"
      : isPrev
        ? `${theme.stroke}99`
        : theme.stroke;

  const rFrom = isNullNode(from) ? 20 : from.role === "slot" ? 22 : 28;
  const rTo = isNullNode(to) ? 20 : to.role === "slot" ? 22 : 28;
  const marker = hl
    ? "url(#arrow-amber)"
    : isPtr
      ? "url(#arrow-ptr)"
      : "url(#arrow)";

  // ── 1-node circular self-loop: below node (head/tail chip sits above) ──
  if (isLoop && Math.hypot(x2 - x1, y2 - y1) < 8) {
    const drop = 58;
    const sx = x1 + rFrom * 0.55;
    const sy = y1 + rFrom * 0.75;
    const ex = x1 - rFrom * 0.55;
    const ey = y1 + rFrom * 0.75;
    const d = `M ${sx} ${sy} C ${x1 + 54} ${y1 + drop + 28}, ${x1 - 54} ${y1 + drop + 28}, ${ex} ${ey}`;
    const loopLabel = e.label ?? "next → self";
    return (
      <g>
        <motion.path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={hl ? 3 : 2}
          strokeDasharray={e.dashed || !hl ? "6 4" : "0"}
          markerEnd={marker}
          opacity={0.9}
          initial={false}
          animate={{ d }}
          transition={FLY_FAST}
        />
        <EdgeLabelPill
          x={x1}
          y={y1 + drop + 36}
          text={loopLabel}
          stroke={stroke}
          themeStroke={theme.stroke}
          hl={!!hl}
        />
      </g>
    );
  }

  const isHorizontal = Math.abs(y1 - y2) < 15;
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const angle = Math.atan2(deltaY, deltaX);

  let fromX = x1 + rFrom * Math.cos(angle);
  let fromY = y1 + rFrom * Math.sin(angle);
  let toX = x2 - (rTo + 6) * Math.cos(angle);
  let toY = y2 - (rTo + 6) * Math.sin(angle);

  if (isPrev && isHorizontal) {
    fromY += 16;
    toY += 16;
    fromX -= 6;
    toX += 6;
  } else if (isPrev) {
    const perpX = -Math.sin(angle) * 16;
    const perpY = Math.cos(angle) * 16;
    fromX += perpX;
    fromY += perpY;
    toX += perpX;
    toY += perpY;
  }

  // Decide curve
  let curve: { d: string; cx: number; cy: number } | null = null;

  if (curved || isLoop) {
    const span = Math.hypot(x2 - x1, y2 - y1);
    const bowAmt = Math.max(22, Math.min(48, 16 + span * 0.08));

    if (isHorizontal && isLoop) {
      // 2-node: return edge bows DOWN so it doesn't stack on next
      curve = {
        d: `M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${(fromY + toY) / 2 + bowAmt + 10} ${toX} ${toY}`,
        cx: (fromX + toX) / 2,
        cy: (fromY + toY) / 2 + bowAmt + 10,
      };
    } else if (isHorizontal && curved && !isLoop) {
      // 2-node: forward next bows UP
      curve = {
        d: `M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${(fromY + toY) / 2 - bowAmt} ${toX} ${toY}`,
        cx: (fromX + toX) / 2,
        cy: (fromY + toY) / 2 - bowAmt,
      };
    } else {
      // Triangle / diamond / pentagon… — bow outward from polygon center
      curve = curvedEdgePath(fromX, fromY, toX, toY, bowAmt, center);
    }
  } else if (isPrev && isHorizontal) {
    const cx = (fromX + toX) / 2;
    const cy = (fromY + toY) / 2 + 22;
    curve = {
      d: `M ${fromX} ${fromY} Q ${cx} ${cy} ${toX} ${toY}`,
      cx,
      cy,
    };
  } else if (isPrev) {
    curve = curvedEdgePath(fromX, fromY, toX, toY, 18);
  }

  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const labelText = e.label;
  const labelX = curve ? (midX + curve.cx) / 2 : midX;
  const labelY = curve
    ? (midY + curve.cy) / 2
    : isHorizontal
      ? isPrev
        ? fromY + 24
        : fromY - 14
      : midY - 12;

  return (
    <g>
      {curve ? (
        <motion.path
          initial={false}
          animate={{ d: curve.d }}
          transition={FLY_FAST}
          fill="none"
          stroke={stroke}
          strokeWidth={hl ? 3 : isPrev ? 1.5 : 2}
          strokeDasharray={e.dashed || isPrev ? "5 3" : isLoop && !hl ? "6 4" : undefined}
          markerEnd={marker}
          opacity={isPrev ? 0.75 : 0.95}
        >
          {(e.animated || hl) && isLoop && (
            <animate
              attributeName="stroke-opacity"
              values="0.4;1;0.4"
              dur="1s"
              repeatCount="indefinite"
            />
          )}
          {e.animated && !isLoop && (
            <animate
              attributeName="stroke-opacity"
              values="0.35;1;0.35"
              dur="0.8s"
              repeatCount="indefinite"
            />
          )}
        </motion.path>
      ) : (
        <motion.line
          initial={false}
          animate={{ x1: fromX, y1: fromY, x2: toX, y2: toY }}
          transition={FLY_FAST}
          stroke={stroke}
          strokeWidth={hl ? 3 : isPrev ? 1.5 : 2}
          strokeDasharray={e.dashed || isPrev ? "5 3" : undefined}
          markerEnd={marker}
          opacity={isPrev ? 0.75 : 0.95}
        >
          {e.animated && (
            <animate
              attributeName="stroke-opacity"
              values="0.35;1;0.35"
              dur="0.8s"
              repeatCount="indefinite"
            />
          )}
        </motion.line>
      )}
      {labelText && (
        <EdgeLabelPill
          x={labelX}
          y={labelY}
          text={labelText}
          stroke={stroke}
          themeStroke={theme.stroke}
          hl={!!hl}
        />
      )}
    </g>
  );
}

function AnimatedPointerLine({
  p,
  node,
  pos,
}: {
  p: VizPointer;
  node: VizNode;
  pos: { x: number; y: number };
}) {
  const nx = node.x ?? 0;
  const ny = node.y ?? 0;
  const name = p.name.toLowerCase().replace(/\s+/g, "");
  // top: horizontal from RIGHT → into the drawer’s right edge
  const isTopSide = name === "top";
  const x1 = isTopSide ? pos.x - 28 : pos.x;
  const y1 = isTopSide ? pos.y : pos.y + 14;
  // slot drawers ~118 wide → hit right side; circles hit top
  const x2 = isTopSide
    ? nx + (node.role === "slot" || node.role === "new" ? 62 : 30)
    : nx;
  const y2 = isTopSide ? ny : ny - 30;

  return (
    <motion.line
      initial={false}
      animate={{ x1, y1, x2, y2 }}
      transition={FLY}
      stroke={p.highlighted ? "#fbbf24" : "#a78bfa"}
      strokeWidth={p.highlighted ? 2.5 : 1.5}
      strokeDasharray={p.highlighted ? "0" : "4 3"}
      markerEnd={p.highlighted ? "url(#arrow-amber)" : "url(#arrow-ptr)"}
      opacity={0.85}
    />
  );
}

function AnimatedPointerChip({
  p,
  pos,
}: {
  p: VizPointer;
  pos: { x: number; y: number };
}) {
  // Label is name only (head / tail / front / rear) — no node value
  const label = p.name;
  const w = Math.max(52, label.length * 7.4 + 16);
  const h = 26;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.7, x: pos.x, y: pos.y }}
      animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={FLY}
      style={{ originX: "0px", originY: "0px" }}
    >
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={6}
        fill={p.highlighted ? "#f59e0b" : "#1e1b4b"}
        stroke={p.highlighted ? "#fde68a" : "#a78bfa"}
        strokeWidth={p.highlighted ? 2.5 : 1.5}
      />
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={p.highlighted ? "#111" : "#e9d5ff"}
        fontSize={10}
        fontWeight={700}
        fontFamily="ui-monospace, monospace"
      >
        {label}
      </text>
      {p.targetId === null && (
        <text
          x={0}
          y={h / 2 + 12}
          textAnchor="middle"
          fill="#fbbf24"
          fontSize={9}
          fontFamily="ui-monospace, monospace"
        >
          → null
        </text>
      )}
    </motion.g>
  );
}

function AnimatedAnnotation({ a }: { a: VizAnnotation }) {
  const colors =
    a.kind === "assign"
      ? { bg: "#422006", stroke: "#fbbf24", fg: "#fde68a" }
      : a.kind === "link"
        ? { bg: "#052e16", stroke: "#4ade80", fg: "#bbf7d0" }
        : a.kind === "null"
          ? { bg: "#1c1917", stroke: "#a8a29e", fg: "#e7e5e4" }
          : a.kind === "warn"
            ? { bg: "#450a0a", stroke: "#f87171", fg: "#fecaca" }
            : { bg: "#0f172a", stroke: "#94a3b8", fg: "#e2e8f0" };
  const tw = Math.min(220, Math.max(80, a.text.length * 6.2));

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.85, x: a.x, y: a.y }}
      animate={{ opacity: 0.95, scale: 1, x: a.x, y: a.y }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={FLY_FAST}
      style={{ originX: "0px", originY: "0px" }}
    >
      <rect
        x={-tw / 2}
        y={-12}
        width={tw}
        height={24}
        rx={6}
        fill={colors.bg}
        stroke={a.highlighted ? "#fbbf24" : colors.stroke}
        strokeWidth={a.highlighted ? 2 : 1}
      />
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={colors.fg}
        fontSize={10}
        fontWeight={600}
        fontFamily="ui-monospace, monospace"
      >
        {a.text}
      </text>
    </motion.g>
  );
}

/* ── Main canvas ────────────────────────────────────────────────── */

function NodeInspectorTooltip({
  node,
  index,
  theme,
  edges,
  nodeMap,
}: {
  node: VizNode;
  index: number;
  theme: (typeof THEME_COLORS)[ColorTheme];
  edges: VizEdge[];
  nodeMap: Map<string, VizNode>;
}) {
  const x = node.x ?? 0;
  const y = (node.y ?? 0) - 75;
  const addr = getMemAddr(node.id, node.value);
  const nextEdge = edges.find((e) => e.from === node.id && e.type !== "prev");
  const prevEdge =
    edges.find((e) => e.to === node.id && e.type === "prev") ||
    edges.find((e) => e.to === node.id && e.type === "next");
  const nextNode = nextEdge ? nodeMap.get(nextEdge.to) : null;
  const prevNode = prevEdge ? nodeMap.get(prevEdge.from) : null;

  const nextAddr = nextNode ? getMemAddr(nextNode.id, nextNode.value) : "null";
  const prevAddr = prevNode ? getMemAddr(prevNode.id, prevNode.value) : "null";

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.85, y: y + 10 }}
      animate={{ opacity: 1, scale: 1, y }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none z-50"
    >
      <rect
        x={x - 90}
        y={-76}
        width={180}
        height={72}
        rx={8}
        fill="#090d16"
        stroke="#38bdf8"
        strokeWidth={1.5}
        filter="url(#glow)"
      />
      <text
        x={x - 78}
        y={-58}
        fill="#38bdf8"
        fontSize={10}
        fontWeight={700}
        fontFamily="ui-monospace, monospace"
      >
        Node #{index >= 0 ? index : "?"} ({addr})
      </text>
      <line
        x1={x - 80}
        y1={-50}
        x2={x + 80}
        y2={-50}
        stroke="#1e293b"
        strokeWidth={1}
      />
      <text
        x={x - 78}
        y={-36}
        fill="#94a3b8"
        fontSize={9}
        fontFamily="ui-monospace, monospace"
      >
        value: <tspan fill="#fbbf24" fontWeight={700}>{String(node.value)}</tspan>
      </text>
      <text
        x={x - 78}
        y={-23}
        fill="#94a3b8"
        fontSize={9}
        fontFamily="ui-monospace, monospace"
      >
        prev : <tspan fill="#a78bfa">{prevAddr}</tspan> {prevNode ? `(${prevNode.value})` : ""}
      </text>
      <text
        x={x - 78}
        y={-10}
        fill="#94a3b8"
        fontSize={9}
        fontFamily="ui-monospace, monospace"
      >
        next : <tspan fill="#38bdf8">{nextAddr}</tspan> {nextNode ? `(${nextNode.value})` : ""}
      </text>
    </motion.g>
  );
}

export function StructureCanvas({ state, color, kind }: StructureCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null
  );
  const theme = THEME_COLORS[color];

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setTransform((t) => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const k = Math.min(2.5, Math.max(0.4, t.k * delta));
      return { ...t, k };
    });
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    svgRef.current?.setPointerCapture?.(e.pointerId);
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      tx: transform.x,
      ty: transform.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    setTransform((t) => ({
      ...t,
      x: d.tx + dx,
      y: d.ty + dy,
    }));
  };

  const endDrag = (e?: React.PointerEvent) => {
    if (e && svgRef.current?.hasPointerCapture?.(e.pointerId)) {
      svgRef.current.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
  };

  const meta = state.meta as
    | {
        kind?: string;
        centerX?: number;
        centerY?: number;
        size?: number;
        cabinet?: {
          cx: number;
          baseY: number;
          slotH: number;
          slotW: number;
          slots: number;
          left: number;
          right: number;
          bottom: number;
          top: number;
        };
      }
    | undefined;

  const isStack =
    kind === "stacks" ||
    meta?.kind === "stack" ||
    (!state.edges.length && state.meta && "top" in (state.meta as object) && meta?.cabinet);

  const isCircular =
    kind === "circularly-linked-lists" || meta?.kind === "circular";
  const polyCenter =
    isCircular && meta?.centerX != null && meta?.centerY != null
      ? { x: meta.centerX, y: meta.centerY }
      : isCircular
        ? { x: 360, y: 130 + 160 } // fallback near head-anchored layout
        : null;

  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));
  // Structural chips: name-only, merge head/tail or front/rear when same target
  const pointers = preparePointers(state.pointers ?? []);
  const pointerPos = computePointerPositions(pointers, nodeMap);

  const resolvedPtr = pointers.map((p) => pointerPos.get(p.id)!).filter(Boolean);
  const xs = state.nodes.map((n) => n.x ?? 0);
  const ys = state.nodes.map((n) => n.y ?? 0);
  const ptrXs = resolvedPtr.map((p) => p.x);
  const ptrYs = resolvedPtr.map((p) => p.y);
  const annXs = (state.annotations ?? []).map((a) => a.x);
  const annYs = (state.annotations ?? []).map((a) => a.y);

  // Include wardrobe bounds so the cabinet is fully visible
  const cabXs = meta?.cabinet
    ? [meta.cabinet.left, meta.cabinet.right]
    : [];
  const cabYs = meta?.cabinet
    ? [meta.cabinet.top - 30, meta.cabinet.bottom + 24]
    : [];

  const allX = [...xs, ...ptrXs, ...annXs, ...cabXs];
  const allY = [...ys, ...ptrYs, ...annYs, ...cabYs];
  const minX = allX.length ? Math.min(...allX) - 120 : 0;
  const maxX = allX.length ? Math.max(...allX) + 140 : 600;
  const minY = allY.length ? Math.min(...allY) - 80 : 0;
  const maxY = allY.length ? Math.max(...allY) + 110 : 320;
  const vbW = Math.max(480, maxX - minX);
  const vbH = Math.max(340, maxY - minY);
  const hasAction = Boolean(state.action);
  const viewMinY = minY - (hasAction ? 10 : 0);

  const empty =
    state.nodes.length === 0 &&
    !(state.pointers?.length) &&
    !(state.annotations?.length);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-muted/30">
      {state.action && (
        <div className="z-20 shrink-0 border-b border-amber-500/40 bg-card/95 px-3 py-2 backdrop-blur">
          <div className="flex flex-wrap items-start gap-2">
            <span className="mt-0.5 shrink-0 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-black">
              Hành động
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold leading-snug text-foreground">
                {state.action.vi}
              </p>
              {state.action.code && (
                <pre className="mt-1 overflow-x-auto rounded-md bg-[#0d1117] px-2 py-1 font-mono text-[11px] text-amber-300">
                  {state.action.code}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {empty && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground">
            Rỗng — chạy một thao tác để bắt đầu
          </div>
        )}

        {state.meta && Array.isArray((state.meta as { array?: number[] }).array) && (
          <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-wrap gap-1 rounded-lg border border-border/50 bg-card/80 p-2 text-[10px] backdrop-blur">
            <span className="mr-1 font-semibold text-muted-foreground">Array:</span>
            {((state.meta as { array: number[] }).array).map((v, i) => (
              <span
                key={i}
                className="rounded px-1.5 py-0.5 font-mono"
                style={{ background: `${theme.fill}22`, color: theme.fill }}
              >
                [{i}]={v}
              </span>
            ))}
          </div>
        )}

        <svg
          ref={svgRef}
          className="viz-canvas h-full w-full"
          viewBox={`${minX} ${viewMinY} ${vbW} ${vbH}`}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.stroke} />
            </marker>
            <marker
              id="arrow-hl"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.glow} />
            </marker>
            <marker
              id="arrow-amber"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
            </marker>
            <marker
              id="arrow-ptr"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#a78bfa" />
            </marker>
          </defs>

          <g
            transform={`translate(${transform.x / transform.k}, ${transform.y / transform.k}) scale(${transform.k})`}
          >
            {/* Stack wardrobe shell (behind drawers) */}
            {isStack && meta?.cabinet && (
              <StackWardrobe
                cabinet={meta.cabinet}
                theme={theme}
                size={typeof meta.size === "number" ? meta.size : 0}
              />
            )}

            {/* Pointer → node connectors (fly with chip + node) */}
            {pointers.map((p) => {
              if (!p.targetId || !nodeMap.has(p.targetId)) return null;
              const n = nodeMap.get(p.targetId)!;
              const pos = pointerPos.get(p.id);
              if (!pos) return null;
              return (
                <AnimatedPointerLine
                  key={`ptr-line-${p.id}`}
                  p={p}
                  node={n}
                  pos={pos}
                />
              );
            })}

            {/* Edges — circular polygon uses soft outward arcs */}
            {state.edges.map((e) => {
              const from = nodeMap.get(e.from);
              const to = nodeMap.get(e.to);
              if (!from || !to) return null;
              return (
                <AnimatedEdge
                  key={e.id}
                  e={e}
                  from={from}
                  to={to}
                  theme={theme}
                  curved={isCircular && e.type !== "pointer"}
                  center={polyCenter}
                />
              );
            })}

            {/* Nodes — same id slides to new (x,y) */}
            <AnimatePresence initial={false}>
              {state.nodes.map((n, i) => (
                <AnimatedNode
                  key={n.id}
                  n={n}
                  index={i}
                  theme={theme}
                  pointers={pointers}
                  isHovered={hoveredNodeId === n.id}
                  onHover={setHoveredNodeId}
                />
              ))}
            </AnimatePresence>

            {/* Hover Node Inspection Tooltip */}
            <AnimatePresence>
              {hoveredNodeId && nodeMap.has(hoveredNodeId) && (
                <NodeInspectorTooltip
                  node={nodeMap.get(hoveredNodeId)!}
                  index={state.nodes.findIndex((n) => n.id === hoveredNodeId)}
                  theme={theme}
                  edges={state.edges}
                  nodeMap={nodeMap}
                />
              )}
            </AnimatePresence>

            {/* External pointer chips — HEAD / curr / … fly between targets */}
            <AnimatePresence initial={false}>
              {pointers.map((p) => {
                const pos = pointerPos.get(p.id);
                if (!pos) return null;
                return (
                  <AnimatedPointerChip key={p.id} p={p} pos={pos} />
                );
              })}
            </AnimatePresence>

            {/* Annotations */}
            <AnimatePresence>
              {(state.annotations ?? []).map((a) => (
                <AnimatedAnnotation key={a.id} a={a} />
              ))}
            </AnimatePresence>
          </g>
        </svg>

        <div className="absolute bottom-2 right-2 rounded-md border border-border/50 bg-card/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
          {Math.round(transform.k * 100)}% · pan · zoom
        </div>
      </div>
    </div>
  );
}
