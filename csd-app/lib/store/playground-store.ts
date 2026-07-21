"use client";

import { create } from "zustand";
import type {
  AnimationStep,
  VariableState,
  VisualizationState,
} from "@/types";

export type AnimSpeed = 0.5 | 1 | 1.5 | 2;

interface PlaygroundState {
  selectedOpId: string | null;
  inputValue: string;
  steps: AnimationStep[];
  currentStep: number;
  isPlaying: boolean;
  speed: AnimSpeed;
  autoPlay: boolean;
  vizState: VisualizationState;
  message: string;
  messageEn: string;
  messageVi: string;
  codeLines: number[];
  pseudoLines: number[];
  variables: VariableState[];
  codeSnippet: string;
  isFullscreen: boolean;

  setSelectedOp: (id: string | null) => void;
  setInputValue: (v: string) => void;
  setSteps: (steps: AnimationStep[]) => void;
  setVizState: (state: VisualizationState) => void;
  setMessage: (msg: string) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  resetAnim: () => void;
  goToStep: (i: number) => void;
  setSpeed: (s: AnimSpeed) => void;
  setAutoPlay: (v: boolean) => void;
  setFullscreen: (v: boolean) => void;
  applyStep: (step: AnimationStep) => void;
  clearStepMeta: () => void;
}

const emptyMeta = {
  message: "Chọn thao tác và chạy từng bước.",
  messageEn: "Chọn thao tác và chạy từng bước.",
  messageVi: "Chọn thao tác và chạy từng bước.",
  codeLines: [] as number[],
  pseudoLines: [] as number[],
  variables: [] as VariableState[],
  codeSnippet: "",
};

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  selectedOpId: null,
  inputValue: "",
  steps: [],
  currentStep: -1,
  isPlaying: false,
  speed: 1,
  autoPlay: false, // step-by-step by default
  vizState: { nodes: [], edges: [], message: "Ready" },
  isFullscreen: false,
  ...emptyMeta,

  setSelectedOp: (id) => set({ selectedOpId: id }),
  setInputValue: (v) => set({ inputValue: v }),
  setSteps: (steps) =>
    set({
      steps,
      currentStep: -1,
      isPlaying: false,
      ...emptyMeta,
      message: steps[0]
        ? "Bấm Next / Play để bắt đầu các bước."
        : emptyMeta.message,
      messageEn: steps[0]
        ? "Bấm Next / Play để bắt đầu các bước."
        : emptyMeta.messageEn,
      messageVi: steps[0]
        ? "Bấm Next / Play để bắt đầu các bước."
        : emptyMeta.messageVi,
    }),
  setVizState: (vizState) => set({ vizState }),
  setMessage: (message) =>
    set({ message, messageEn: message, messageVi: message }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  next: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      const s = steps[next];
      set({ currentStep: next });
      get().applyStep(s);
      if (next >= steps.length - 1) set({ isPlaying: false });
    } else {
      set({ isPlaying: false });
    }
  },

  prev: () => {
    const { currentStep, steps } = get();
    if (currentStep > 0) {
      const prev = currentStep - 1;
      const s = steps[prev];
      set({ currentStep: prev, isPlaying: false });
      get().applyStep(s);
    } else if (currentStep === 0) {
      set({
        currentStep: -1,
        isPlaying: false,
        ...emptyMeta,
        message: "Sẵn sàng — bấm Next cho bước 1.",
        messageEn: "Sẵn sàng — bấm Next cho bước 1.",
        messageVi: "Sẵn sàng — bấm Next cho bước 1.",
      });
    }
  },

  resetAnim: () =>
    set({
      currentStep: -1,
      isPlaying: false,
      ...emptyMeta,
      message: "Đã reset animation. Chạy lại hoặc bấm Next.",
      messageEn: "Đã reset animation. Chạy lại hoặc bấm Next.",
      messageVi: "Đã reset animation. Chạy lại hoặc bấm Next.",
    }),

  goToStep: (i) => {
    const { steps } = get();
    if (i >= 0 && i < steps.length) {
      set({ currentStep: i, isPlaying: false });
      get().applyStep(steps[i]);
    }
  },

  setSpeed: (speed) => set({ speed }),
  setAutoPlay: (autoPlay) => set({ autoPlay }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),

  clearStepMeta: () => set({ ...emptyMeta }),

  applyStep: (s) => {
    const patch: Partial<PlaygroundState> = {
      message: s.message,
      messageEn: s.messageEn,
      messageVi: s.messageVi,
      codeLines: s.codeLines ?? [],
      pseudoLines: s.pseudoLines ?? [],
      variables: s.variables ?? [],
      codeSnippet: s.codeSnippet ?? "",
    };
    if (s.data && typeof s.data === "object") {
      const data = s.data as VisualizationState;
      if (data.nodes) {
        patch.vizState = {
          nodes: data.nodes,
          edges: data.edges ?? [],
          pointers: data.pointers,
          annotations: data.annotations,
          action: data.action,
          meta: data.meta,
          message: s.message,
        };
      }
    }
    set(patch);
  },
}));
