import type {
  AnimationStep,
  BiText,
  VariableState,
  VisualizationState,
} from "@/types";

let stepCounter = 0;

export function resetStepCounter() {
  stepCounter = 0;
}

export interface StepInput {
  type: string;
  en: string;
  vi: string;
  data?: VisualizationState;
  highlightIds?: string[];
  duration?: number;
  /** 0-based Java source lines to highlight */
  codeLines?: number[];
  /** 0-based pseudocode lines to highlight */
  pseudoLines?: number[];
  variables?: VariableState[];
  codeSnippet?: string;
}

export function bi(en: string, vi: string): BiText {
  return { en, vi };
}

export function v(
  name: string,
  value: string | number | boolean | null,
  changed = false,
  note?: BiText
): VariableState {
  return { name, value, changed, note };
}

/** Merge variable lists by name (later entries win; OR changed flags). */
export function mergeVars(
  ...lists: VariableState[][]
): VariableState[] {
  const map = new Map<string, VariableState>();
  for (const list of lists) {
    for (const item of list) {
      const prev = map.get(item.name);
      if (prev) {
        map.set(item.name, {
          ...item,
          changed: Boolean(prev.changed || item.changed),
        });
      } else {
        map.set(item.name, item);
      }
    }
  }
  return Array.from(map.values());
}

export function step(input: StepInput): AnimationStep {
  stepCounter += 1;
  return {
    id: `step-${stepCounter}`,
    type: input.type,
    message: `${input.en} · ${input.vi}`,
    messageEn: input.en,
    messageVi: input.vi,
    data: input.data,
    highlightIds: input.highlightIds,
    duration: input.duration ?? 900,
    codeLines: input.codeLines,
    pseudoLines: input.pseudoLines,
    variables: input.variables,
    codeSnippet: input.codeSnippet,
  };
}

export function cloneViz(state: VisualizationState): VisualizationState {
  return {
    nodes: state.nodes.map((n) => ({ ...n })),
    edges: state.edges.map((e) => ({ ...e })),
    pointers: state.pointers?.map((p) => ({ ...p })),
    annotations: state.annotations?.map((a) => ({ ...a })),
    action: state.action ? { ...state.action } : undefined,
    meta: state.meta ? { ...state.meta } : undefined,
    message: state.message,
  };
}

export function highlightNodes(
  state: VisualizationState,
  ids: string[],
  activeId?: string
): VisualizationState {
  const set = new Set(ids);
  return {
    ...cloneViz(state),
    nodes: state.nodes.map((n) => ({
      ...n,
      highlighted: set.has(n.id),
      active: activeId ? n.id === activeId : n.active,
    })),
  };
}

export function highlightEdges(
  state: VisualizationState,
  ids: string[]
): VisualizationState {
  const set = new Set(ids);
  return {
    ...cloneViz(state),
    edges: state.edges.map((e) => ({
      ...e,
      highlighted: set.has(e.id),
    })),
  };
}

/** Format array for variable display */
export function fmtArr(arr: number[]): string {
  return arr.length ? `[${arr.join(", ")}]` : "[]";
}
