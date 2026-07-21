import type { DSSlug, VisualizationState, AnimationStep } from "@/types";
import { LinkedListEngine } from "./linked-list";
import { StackEngine } from "./stack";
import { QueueEngine } from "./queue";
import { BinaryTreeEngine } from "./binary-tree";
import { HeapEngine } from "./heap";

export type DSEngine = {
  run: (op: string, value?: number) => AnimationStep[];
  currentState: () => VisualizationState;
  getValues: () => number[];
  setValues: (v: number[]) => void;
};

export function createEngine(slug: DSSlug, sample: number[]): DSEngine {
  switch (slug) {
    case "singly-linked-lists":
      return new LinkedListEngine("singly", sample);
    case "doubly-linked-lists":
      return new LinkedListEngine("doubly", sample);
    case "circularly-linked-lists":
      return new LinkedListEngine("circular", sample);
    case "stacks":
      return new StackEngine(sample);
    case "queues":
      return new QueueEngine(sample);
    case "binary-trees":
      return new BinaryTreeEngine(sample, false);
    case "balanced-search-trees":
      return new BinaryTreeEngine(sample, true);
    case "heaps":
      return new HeapEngine(sample, "max");
    default:
      return new StackEngine(sample);
  }
}

export {
  LinkedListEngine,
  StackEngine,
  QueueEngine,
  BinaryTreeEngine,
  HeapEngine,
};
