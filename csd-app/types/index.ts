export type DSSlug =
  | "singly-linked-lists"
  | "doubly-linked-lists"
  | "circularly-linked-lists"
  | "stacks"
  | "queues"
  | "binary-trees"
  | "balanced-search-trees"
  | "heaps";

export type ColorTheme =
  | "sky"
  | "purple"
  | "orange"
  | "pink"
  | "mint"
  | "green"
  | "yellow"
  | "coral";

/** Bilingual text block */
export interface BiText {
  en: string;
  vi: string;
}

export interface Complexity {
  search: string;
  insert: string;
  delete: string;
  access?: string;
  space: string;
}

export interface OperationDef {
  id: string;
  name: string;
  signature: string;
  description: BiText;
  javaCode: string;
  pseudocode: string;
  complexity: string;
  example: string;
  needsValue?: boolean;
  valueLabel?: BiText;
}

export interface DataStructureMeta {
  slug: DSSlug;
  name: string;
  nameVi: string;
  shortName: string;
  tagline: BiText;
  description: BiText;
  color: ColorTheme;
  gradient: string;
  icon: string;
  definition: BiText;
  characteristics: BiText[];
  advantages: BiText[];
  disadvantages: BiText[];
  applications: BiText[];
  howItWorks: BiText;
  keyTerms: { term: string; en: string; vi: string }[];
  complexity: Complexity;
  operations: OperationDef[];
  sampleData: number[];
}

/** Runtime variable snapshot for a step */
export interface VariableState {
  name: string;
  value: string | number | boolean | null;
  /** Highlight if this variable changed in this step */
  changed?: boolean;
  note?: BiText;
}

export interface AnimationStep {
  id: string;
  type: string;
  /** Combined display message */
  message: string;
  messageEn: string;
  messageVi: string;
  highlightIds?: string[];
  data?: unknown;
  duration?: number;
  /** 0-based line indices in javaCode */
  codeLines?: number[];
  /** 0-based line indices in pseudocode */
  pseudoLines?: number[];
  /** Variable table for this step */
  variables?: VariableState[];
  /** Exact code being executed (shown under highlight) */
  codeSnippet?: string;
}

export type VizNodeRole =
  | "normal"
  | "new"
  | "null"
  | "ghost"
  | "removed"
  | "slot";

export interface VizNode {
  id: string;
  /** numeric payload; null-role nodes may use 0 */
  value: number | string;
  x?: number;
  y?: number;
  highlighted?: boolean;
  active?: boolean;
  /** Badge above node: HEAD, TOP, NEW, … */
  label?: string;
  /** Secondary line under node: next→10, prev→null */
  sublabel?: string;
  balanceFactor?: number;
  role?: VizNodeRole;
  /** Fade out (deleted node) */
  fading?: boolean;
}

export interface VizEdge {
  id: string;
  from: string;
  to: string;
  type?: "next" | "prev" | "left" | "right" | "parent" | "loop" | "pointer";
  highlighted?: boolean;
  label?: string;
  /** Dashed = pending / being rewritten */
  dashed?: boolean;
  /** Glow animation */
  animated?: boolean;
}

/** External reference box: head, tail, curr, prev, newNode, top… */
export interface VizPointer {
  id: string;
  name: string;
  /** Points to node id, or null terminator */
  targetId?: string | null;
  /** Absolute position when not linked (e.g. floating newNode ref) */
  x?: number;
  y?: number;
  highlighted?: boolean;
  /** Display value inside pointer chip */
  display?: string;
}

/** Free-form text/callout inside the canvas */
export interface VizAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  kind?: "info" | "assign" | "link" | "null" | "warn";
  highlighted?: boolean;
}

/** Current micro-action shown as banner inside the viz frame */
export interface VizAction {
  en: string;
  vi: string;
  code?: string;
}

export interface VisualizationState {
  nodes: VizNode[];
  edges: VizEdge[];
  pointers?: VizPointer[];
  annotations?: VizAnnotation[];
  action?: VizAction;
  meta?: Record<string, unknown>;
  message?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  dsSlug?: DSSlug;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
  unlockedAt?: string;
}

export interface ProgressEntry {
  slug: DSSlug;
  percent: number;
  operationsRun: number;
  quizScore: number;
  quizTotal: number;
  completed: boolean;
  lastVisited?: string;
}
