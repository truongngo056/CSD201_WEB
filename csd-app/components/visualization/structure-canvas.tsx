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
  tail: { dx: 54, dy: -90 },
  curr: { dx: -54, dy: -90 },
  prev: { dx: 54, dy: -120 },
  newnode: { dx: 0, dy: -90 },
  top: { dx: -80, dy: 0 },
  front: { dx: -15, dy: -90 },
  rear: { dx: 15, dy: -90 },
  value: { dx: 0, dy: -70 },
};

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

function AnimatedEdge({
  e,
  from,
  to,
  theme,
}: {
  e: VizEdge;
  from: VizNode;
  to: VizNode;
  theme: (typeof THEME_COLORS)[ColorTheme];
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

  if (isLoop) {
    const mx = (x1 + x2) / 2;
    const my = Math.max(y1, y2) + 70;
    const d = `M ${x1 + 28} ${y1 + 10} Q ${mx} ${my} ${x2 - 28} ${y2 + 10}`;
    const loopLabel = e.label ?? "next → HEAD";
    const loopPillW = Math.max(50, loopLabel.length * 6.5 + 8);
    return (
      <g>
        <motion.path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={hl ? 3 : 2}
          strokeDasharray={e.dashed || !hl ? "6 4" : "0"}
          markerEnd={hl ? "url(#arrow-hl)" : "url(#arrow)"}
          opacity={0.9}
          initial={false}
          animate={{ d }}
          transition={FLY_FAST}
        >
          {hl && (
            <animate
              attributeName="stroke-opacity"
              values="0.4;1;0.4"
              dur="1s"
              repeatCount="indefinite"
            />
          )}
        </motion.path>
        <g>
          <motion.rect
            initial={false}
            animate={{
              x: mx - loopPillW / 2,
              y: my - 15,
            }}
            transition={FLY_FAST}
            width={loopPillW}
            height={15}
            rx={4}
            fill="#0f172a"
            opacity={0.9}
            stroke={hl ? "#fbbf24" : theme.stroke}
            strokeWidth={0.75}
          />
          <motion.text
            initial={false}
            animate={{ x: mx, y: my - 7 }}
            transition={FLY_FAST}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={stroke}
            fontSize={9}
            fontWeight={600}
            fontFamily="ui-monospace, monospace"
          >
            {loopLabel}
          </motion.text>
        </g>
      </g>
    );
  }

  const isHorizontal = Math.abs(y1 - y2) < 15;

  const rFrom = isNullNode(from) ? 20 : from.role === "slot" ? 22 : 28;
  const rTo = isNullNode(to) ? 20 : to.role === "slot" ? 22 : 28;

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

  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const labelY = isHorizontal
    ? isPrev
      ? fromY + 16
      : fromY - 14
    : midY - 12;

  const labelText = e.label;
  const pillWidth = labelText ? Math.max(32, labelText.length * 6.5 + 8) : 0;

  return (
    <g>
      <motion.line
        initial={false}
        animate={{ x1: fromX, y1: fromY, x2: toX, y2: toY }}
        transition={FLY_FAST}
        stroke={stroke}
        strokeWidth={hl ? 3 : isPrev ? 1.5 : 2}
        strokeDasharray={e.dashed || isPrev ? "5 3" : undefined}
        markerEnd={
          hl
            ? "url(#arrow-amber)"
            : isPtr
              ? "url(#arrow-ptr)"
              : "url(#arrow)"
        }
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
      {labelText && (
        <g>
          <motion.rect
            initial={false}
            animate={{
              x: midX - pillWidth / 2,
              y: labelY - 7,
            }}
            transition={FLY_FAST}
            width={pillWidth}
            height={14}
            rx={4}
            fill="#0f172a"
            opacity={0.9}
            stroke={hl ? "#fbbf24" : theme.stroke}
            strokeWidth={0.75}
          />
          <motion.text
            initial={false}
            animate={{ x: midX, y: labelY + 1 }}
            transition={FLY_FAST}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={hl ? "#fbbf24" : theme.stroke}
            fontSize={9}
            fontWeight={hl ? 700 : 600}
            fontFamily="ui-monospace, monospace"
          >
            {labelText}
          </motion.text>
        </g>
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
  const ny = (node.y ?? 0) - 30;
  return (
    <motion.line
      initial={false}
      animate={{
        x1: pos.x,
        y1: pos.y + 14,
        x2: nx,
        y2: ny,
      }}
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
  const label =
    p.display !== undefined ? `${p.name}=${p.display}` : p.name;
  const w = Math.max(58, label.length * 7.2 + 14);
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

  const isStack =
    kind === "stacks" ||
    (!state.edges.length && state.meta && "top" in (state.meta as object));

  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));
  const pointers = state.pointers ?? [];
  const pointerPos = computePointerPositions(pointers, nodeMap);

  const resolvedPtr = pointers.map((p) => pointerPos.get(p.id)!).filter(Boolean);
  const xs = state.nodes.map((n) => n.x ?? 0);
  const ys = state.nodes.map((n) => n.y ?? 0);
  const ptrXs = resolvedPtr.map((p) => p.x);
  const ptrYs = resolvedPtr.map((p) => p.y);
  const annXs = (state.annotations ?? []).map((a) => a.x);
  const annYs = (state.annotations ?? []).map((a) => a.y);

  const allX = [...xs, ...ptrXs, ...annXs];
  const allY = [...ys, ...ptrYs, ...annYs];
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

            {/* Edges */}
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

            {/* Stack base */}
            {(isStack || kind === "stacks") &&
              state.nodes.filter((n) => n.role !== "null" && n.role !== "new")
                .length > 0 && (
                <motion.line
                  initial={false}
                  animate={{
                    x1: 160,
                    y1:
                      Math.max(
                        ...state.nodes
                          .filter((n) => n.role !== "null")
                          .map((n) => n.y ?? 0)
                      ) + 40,
                    x2: 240,
                    y2:
                      Math.max(
                        ...state.nodes
                          .filter((n) => n.role !== "null")
                          .map((n) => n.y ?? 0)
                      ) + 40,
                  }}
                  transition={FLY_FAST}
                  stroke={theme.stroke}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={0.5}
                />
              )}
          </g>
        </svg>

        <div className="absolute bottom-2 right-2 rounded-md border border-border/50 bg-card/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
          {Math.round(transform.k * 100)}% · pan · zoom
        </div>
      </div>
    </div>
  );
}
