import type {
  AnimationStep,
  VisualizationState,
  VizNode,
  VizEdge,
  VizPointer,
  VizAnnotation,
  VizAction,
} from "@/types";
import {
  fmtArr,
  mergeVars,
  resetStepCounter,
  step,
  v,
} from "./animation-helpers";

/** Wardrobe (tủ quần áo) geometry — open top, stack grows upward from the floor */
const STACK_CX = 300;
const STACK_SLOT_W = 128;
/** Center-to-center spacing — large enough that next arrows between 2 nodes stay clear */
const STACK_SLOT_H = 88;
const STACK_BASE_Y = 400; // center Y of bottom drawer (index 0)
/** Visual drawer half-height (matches canvas drawer h≈42) */
const DRAWER_HALF = 22;

function slotY(index: number) {
  return STACK_BASE_Y - index * STACK_SLOT_H;
}

/**
 * Cabinet height tracks node count:
 * - empty → short wardrobe (2 shelf guides)
 * - n nodes → n slots + 1 headroom for push + room for next→null
 */
function cabinetSlots(size: number) {
  if (size <= 0) return 2;
  return size + 1;
}

function cabinetMeta(size: number) {
  const slots = cabinetSlots(size);
  // Top of cabinet sits above the highest shelf / open mouth
  const topCenter = STACK_BASE_Y - (slots - 1) * STACK_SLOT_H;
  return {
    kind: "stack" as const,
    size,
    top: null as number | null,
    topIndex: size - 1,
    cabinet: {
      cx: STACK_CX,
      baseY: STACK_BASE_Y,
      slotH: STACK_SLOT_H,
      slotW: STACK_SLOT_W,
      slots,
      left: STACK_CX - STACK_SLOT_W / 2 - 24,
      right: STACK_CX + STACK_SLOT_W / 2 + 24,
      // Floor + space for next→null under bottom drawer
      bottom: STACK_BASE_Y + DRAWER_HALF + 56,
      // Open mouth above topmost shelf
      top: topCenter - DRAWER_HALF - 40,
    },
  };
}

export class StackEngine {
  items: number[] = [];
  capacity = 32;

  constructor(initial: number[] = []) {
    this.items = [...initial];
  }

  private topIndex() {
    return this.items.length - 1;
  }

  private vars(extra: ReturnType<typeof v>[] = [], changed: string[] = []) {
    const top = this.topIndex();
    return mergeVars(
      [
        v("top", top < 0 ? -1 : top, changed.includes("top")),
        v("size", this.items.length, changed.includes("size")),
        v("stack", fmtArr(this.items), changed.includes("stack")),
        v("capacity", this.capacity),
      ],
      extra
    );
  }

  private frame(
    opts: {
      highlightTop?: boolean;
      floating?: { value: number; label?: string };
      action?: VizAction;
      annotations?: VizAnnotation[];
      popping?: number;
    } = {}
  ): VisualizationState {
    const nodes: VizNode[] = this.items.map((val, i) => {
      const isTop = i === this.items.length - 1;
      return {
        id: `s${i}`,
        value: val,
        x: STACK_CX,
        y: slotY(i),
        highlighted: (opts.highlightTop && isTop) || opts.popping === val,
        active: (opts.highlightTop && isTop) || opts.popping === val,
        label: undefined,
        sublabel: `[${i}]`,
        role:
          opts.popping === val && isTop
            ? "removed"
            : ("slot" as const),
      };
    });

    // Linked-stack next chain: top → … → bottom → null
    // Array index i points “down” to i-1 (toward floor of wardrobe)
    const edges: VizEdge[] = [];
    for (let i = this.items.length - 1; i > 0; i--) {
      edges.push({
        id: `e-next-${i}`,
        from: `s${i}`,
        to: `s${i - 1}`,
        type: "next",
        label: "next",
        highlighted: opts.highlightTop && i === this.items.length - 1,
      });
    }

    const pointers: VizPointer[] = [];
    const annotations = [...(opts.annotations ?? [])];
    const meta = cabinetMeta(this.items.length);
    meta.top = this.items[this.items.length - 1] ?? null;
    meta.topIndex = this.topIndex() < 0 ? -1 : this.topIndex();

    if (this.items.length === 0) {
      // Empty wardrobe — open space, top = -1
      pointers.push({
        id: "ptr-top",
        name: "top",
        targetId: null,
        x: STACK_CX + STACK_SLOT_W / 2 + 90,
        y: STACK_BASE_Y - 40,
        highlighted: true,
      });
    } else {
      const topId = `s${this.items.length - 1}`;
      // top chip on the RIGHT of the top drawer (arrow points left →)
      pointers.push({
        id: "ptr-top",
        name: "top",
        targetId: topId,
        highlighted: !!opts.highlightTop,
      });

      // Bottom terminator: next → null (below bottom drawer, still inside cabinet floor)
      const nullY = slotY(0) + DRAWER_HALF + 36;
      nodes.push({
        id: "stack-null",
        value: "∅",
        x: STACK_CX,
        y: nullY,
        role: "null",
        label: undefined,
        sublabel: "null",
        highlighted: false,
      });
      edges.push({
        id: "e-next-null",
        from: "s0",
        to: "stack-null",
        type: "next",
        label: "next",
        dashed: true,
      });
    }

    if (opts.floating) {
      // Hover in the open mouth above the future top slot
      const floatY = slotY(this.items.length) - 8;
      nodes.push({
        id: "float-new",
        value: opts.floating.value,
        x: STACK_CX,
        y: Math.min(floatY, meta.cabinet.top + 18),
        role: "new",
        label: opts.floating.label ?? "NEW",
        active: true,
        highlighted: true,
        sublabel: "↓ push",
      });
      pointers.push({
        id: "ptr-new",
        name: "value",
        targetId: "float-new",
        highlighted: true,
      });
    }

    return {
      nodes,
      edges,
      pointers,
      annotations,
      action: opts.action,
      meta,
    };
  }

  snapshot(highlightTop = false): VisualizationState {
    return this.frame({ highlightTop });
  }

  run(op: string, value?: number): AnimationStep[] {
    resetStepCounter();
    switch (op) {
      case "push":
        return this.push(value ?? 0);
      case "pop":
        return this.pop();
      case "peek":
        return this.peek();
      case "isEmpty":
        return this.isEmpty();
      case "size":
        return this.size();
      case "clear":
        return this.clear();
      default:
        return [
          step({
            type: "info",
            en: `Unknown: ${op}`,
            vi: `Không xác định: ${op}`,
            data: this.frame({}),
          }),
        ];
    }
  }

  private push(value: number): AnimationStep[] {
    const steps: AnimationStep[] = [];
    const topBefore = this.topIndex();

    steps.push(
      step({
        type: "call",
        en: `Call push(${value})`,
        vi: `Gọi push(${value})`,
        data: this.frame({
          action: {
            en: `Enter push(${value}) — put clothes on top of the wardrobe`,
            vi: `Vào push(${value}) — xếp thêm ngăn lên đỉnh tủ`,
            code: `push(${value})`,
          },
        }),
        codeLines: [0],
        variables: this.vars([v("value", value, true)]),
      })
    );

    steps.push(
      step({
        type: "check",
        en: `Overflow? top(${topBefore}) == capacity-1(${this.capacity - 1}) → false`,
        vi: `Tràn? top(${topBefore}) == capacity-1 → false`,
        data: this.frame({
          action: {
            en: `Check capacity before write`,
            vi: `Kiểm tra dung lượng trước khi ghi`,
            code: `if (top == capacity - 1)`,
          },
        }),
        codeLines: [1],
        variables: this.vars([
          v("value", value),
          v("overflow?", false, true),
        ]),
      })
    );

    steps.push(
      step({
        type: "create",
        en: `Prepare value ${value} above open top`,
        vi: `Chuẩn bị giá trị ${value} phía trên miệng tủ`,
        data: this.frame({
          floating: { value, label: "NEW" },
          action: {
            en: `New drawer ready to drop into wardrobe`,
            vi: `Ngăn mới sẵn sàng thả vào tủ`,
            code: `// stack[++top] = value pending`,
          },
        }),
        codeLines: [3],
        variables: this.vars([v("value", value, true)]),
      })
    );

    this.items.push(value);
    const topAfter = this.topIndex();

    steps.push(
      step({
        type: "assign",
        en: `top = ${topAfter}; stack[${topAfter}] = ${value}`,
        vi: `top = ${topAfter}; stack[${topAfter}] = ${value}`,
        data: this.frame({
          highlightTop: true,
          action: {
            en: `Drop into top drawer · TOP moves up`,
            vi: `Thả vào ngăn đỉnh · TOP đi lên`,
            code: `stack[++top] = ${value}; // top=${topAfter}`,
          },
        }),
        codeLines: [3],
        variables: this.vars(
          [v("value", value), v("stack[top]", value, true)],
          ["top", "size", "stack"]
        ),
        duration: 1200,
      })
    );

    steps.push(
      step({
        type: "done",
        en: `push done. TOP = ${value}`,
        vi: `push xong. TOP = ${value}`,
        data: this.frame({
          highlightTop: true,
          action: {
            en: `TOP points to uppermost drawer`,
            vi: `TOP trỏ ngăn trên cùng`,
            code: `// size=${this.items.length}`,
          },
        }),
        codeLines: [4],
        variables: this.vars(),
      })
    );
    return steps;
  }

  private pop(): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: "Call pop()",
        vi: "Gọi pop()",
        data: this.frame({
          highlightTop: true,
          action: {
            en: `Enter pop() — take clothes from the top only`,
            vi: `Vào pop() — chỉ lấy ngăn trên cùng`,
            code: `pop()`,
          },
        }),
        codeLines: [0],
        variables: this.vars(),
      })
    );

    steps.push(
      step({
        type: "check",
        en: `isEmpty()? → ${this.items.length === 0}`,
        vi: `isEmpty()? → ${this.items.length === 0}`,
        data: this.frame({
          action: {
            en: `Guard against empty wardrobe`,
            vi: `Chặn tủ rỗng`,
            code: `if (isEmpty()) throw ...`,
          },
        }),
        codeLines: [1],
        variables: this.vars([v("isEmpty", this.items.length === 0, true)]),
      })
    );

    if (this.items.length === 0) {
      steps.push(
        step({
          type: "error",
          en: "Empty — cannot pop",
          vi: "Rỗng — không pop được",
          data: this.frame({
            action: {
              en: `Throw EmptyStackException`,
              vi: `Ném EmptyStackException`,
              code: `throw new EmptyStackException();`,
            },
          }),
          codeLines: [2],
          variables: this.vars(),
        })
      );
      return steps;
    }

    const val = this.items[this.items.length - 1];
    const topBefore = this.topIndex();
    steps.push(
      step({
        type: "read",
        en: `Read stack[top]=stack[${topBefore}]=${val}`,
        vi: `Đọc stack[top]=stack[${topBefore}]=${val}`,
        data: this.frame({
          highlightTop: true,
          action: {
            en: `Capture top drawer before removal`,
            vi: `Lấy ngăn đỉnh trước khi gỡ`,
            code: `return stack[top--]; // ${val}`,
          },
        }),
        codeLines: [3],
        variables: this.vars([v("returnValue", val, true)]),
      })
    );

    this.items.pop();
    steps.push(
      step({
        type: "assign",
        en: `top = top - 1 → ${this.topIndex() < 0 ? -1 : this.topIndex()}`,
        vi: `top = top - 1 → ${this.topIndex() < 0 ? -1 : this.topIndex()}`,
        data: this.frame({
          action: {
            en: `Remove top drawer · TOP moves down`,
            vi: `Gỡ ngăn đỉnh · TOP đi xuống`,
            code: `top--; // removed ${val}`,
          },
        }),
        codeLines: [3],
        variables: this.vars(
          [v("removed", val, true)],
          ["top", "size", "stack"]
        ),
        duration: 1200,
      })
    );

    steps.push(
      step({
        type: "done",
        en: `pop() → ${val}`,
        vi: `pop() → ${val}`,
        data: this.frame({
          highlightTop: this.items.length > 0,
          action: {
            en: `Returned ${val}`,
            vi: `Trả về ${val}`,
            code: `return ${val};`,
          },
        }),
        codeLines: [4],
        variables: this.vars([v("return", val, true)]),
      })
    );
    return steps;
  }

  private peek(): AnimationStep[] {
    if (this.items.length === 0) {
      return [
        step({
          type: "error",
          en: "Empty — cannot peek",
          vi: "Rỗng — không peek được",
          data: this.frame({
            action: {
              en: `Empty wardrobe`,
              vi: `Tủ rỗng`,
              code: `if (isEmpty()) throw ...`,
            },
          }),
          codeLines: [1, 2],
          variables: this.vars([v("isEmpty", true, true)]),
        }),
      ];
    }
    const val = this.items[this.items.length - 1];
    return [
      step({
        type: "call",
        en: "Call peek()",
        vi: "Gọi peek()",
        data: this.frame({
          highlightTop: true,
          action: {
            en: `Peek top drawer without removing`,
            vi: `Xem ngăn đỉnh không gỡ`,
            code: `peek()`,
          },
        }),
        codeLines: [0],
        variables: this.vars(),
      }),
      step({
        type: "read",
        en: `return stack[top] = ${val}`,
        vi: `return stack[top] = ${val}`,
        data: this.frame({
          highlightTop: true,
          action: {
            en: `TOP stays ${val}`,
            vi: `TOP vẫn là ${val}`,
            code: `return stack[top]; // ${val}`,
          },
        }),
        codeLines: [3],
        variables: this.vars([v("return", val, true)]),
      }),
    ];
  }

  private isEmpty(): AnimationStep[] {
    const empty = this.items.length === 0;
    return [
      step({
        type: "check",
        en: `isEmpty() → ${empty} (top ${empty ? "= -1" : `= ${this.topIndex()}`})`,
        vi: `isEmpty() → ${empty}`,
        data: this.frame({
          action: {
            en: `Compare top with -1`,
            vi: `So sánh top với -1`,
            code: `return top == -1; // ${empty}`,
          },
        }),
        codeLines: [0, 1],
        variables: this.vars([v("return", empty, true)]),
      }),
    ];
  }

  private size(): AnimationStep[] {
    return [
      step({
        type: "read",
        en: `size() → ${this.items.length}`,
        vi: `size() → ${this.items.length}`,
        data: this.frame({
          action: {
            en: `size = top + 1`,
            vi: `size = top + 1`,
            code: `return top + 1; // ${this.items.length}`,
          },
        }),
        codeLines: [0, 1],
        variables: this.vars([v("return", this.items.length, true)]),
      }),
    ];
  }

  private clear(): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: "Call clear()",
        vi: "Gọi clear()",
        data: this.frame({
          action: {
            en: `Empty the wardrobe`,
            vi: `Dọn sạch tủ`,
            code: `clear()`,
          },
        }),
        codeLines: [0],
        variables: this.vars(),
      })
    );
    this.items = [];
    steps.push(
      step({
        type: "assign",
        en: "top = -1",
        vi: "top = -1",
        data: this.frame({
          action: {
            en: `All drawers removed · top → -1`,
            vi: `Mọi ngăn bị gỡ · top → -1`,
            code: `top = -1;`,
          },
        }),
        codeLines: [1],
        variables: this.vars([], ["top", "size", "stack"]),
      })
    );
    return steps;
  }

  currentState(): VisualizationState {
    return this.frame({
      action: {
        en: "Ready — push/pop like a wardrobe (LIFO)",
        vi: "Sẵn sàng — push/pop như tủ quần áo (LIFO)",
      },
    });
  }

  getValues(): number[] {
    return [...this.items];
  }

  setValues(values: number[]) {
    this.items = [...values];
  }
}
