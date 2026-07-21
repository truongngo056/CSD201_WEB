import type {
  AnimationStep,
  VisualizationState,
  VizNode,
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

  private frame(opts: {
    highlightTop?: boolean;
    floating?: { value: number; label?: string };
    action?: VizAction;
    annotations?: VizAnnotation[];
    popping?: number;
  } = {}): VisualizationState {
    const nodes: VizNode[] = this.items.map((val, i) => {
      const isTop = i === this.items.length - 1;
      return {
        id: `s${i}`,
        value: val,
        x: 240,
        y: 320 - i * 62,
        highlighted: (opts.highlightTop && isTop) || opts.popping === val,
        active: (opts.highlightTop && isTop) || opts.popping === val,
        // TOP shown via pointer chip only — avoid badge overlap
        label: undefined,
        sublabel: isTop ? `stack[${i}]` : `stack[${i}]`,
        role: opts.popping === val && isTop ? "removed" : "normal",
      };
    });

    const pointers: VizPointer[] = [];
    const annotations = [...(opts.annotations ?? [])];

    if (this.items.length === 0) {
      nodes.push({
        id: "empty",
        value: "∅",
        x: 220,
        y: 300,
        role: "null",
        label: "EMPTY",
        sublabel: "top = -1",
        highlighted: true,
      });
      pointers.push({
        id: "ptr-top",
        name: "top",
        targetId: null,
        x: 220,
        y: 230,
        highlighted: true,
        display: "-1",
      });
      annotations.push({
        id: "ann-empty",
        text: "top → -1 (null stack)",
        x: 220,
        y: 360,
        kind: "null",
        highlighted: true,
      });
    } else {
      const topId = `s${this.items.length - 1}`;
      pointers.push({
        id: "ptr-top",
        name: "top",
        targetId: topId,
        highlighted: !!opts.highlightTop,
        display: String(this.topIndex()),
      });
    }

    if (opts.floating) {
      nodes.push({
        id: "float-new",
        value: opts.floating.value,
        x: 220,
        y: 40,
        role: "new",
        label: opts.floating.label ?? "NEW",
        active: true,
        highlighted: true,
        sublabel: "pending push",
      });
      pointers.push({
        id: "ptr-new",
        name: "value",
        targetId: "float-new",
        highlighted: true,
        display: String(opts.floating.value),
      });
    }

    return {
      nodes,
      edges: [],
      pointers,
      annotations,
      action: opts.action,
      meta: {
        size: this.items.length,
        top: this.items[this.items.length - 1] ?? null,
        topIndex: this.topIndex() < 0 ? -1 : this.topIndex(),
      },
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
            en: `Enter push(${value})`,
            vi: `Vào hàm push(${value})`,
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
          annotations: [
            {
              id: "cap",
              text: `top=${topBefore} < ${this.capacity - 1}`,
              x: 220,
              y: 360,
              kind: "info",
              highlighted: true,
            },
          ],
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
        en: `Prepare value ${value} above stack`,
        vi: `Chuẩn bị giá trị ${value} phía trên stack`,
        data: this.frame({
          floating: { value, label: "NEW" },
          action: {
            en: `New element ready to push`,
            vi: `Phần tử mới sẵn sàng push`,
            code: `// stack[++top] = value pending`,
          },
          annotations: [
            {
              id: "new",
              text: `value = ${value}`,
              x: 320,
              y: 40,
              kind: "assign",
              highlighted: true,
            },
          ],
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
            en: `Write to stack[top] and advance top`,
            vi: `Ghi vào stack[top] và tăng top`,
            code: `stack[++top] = ${value}; // top=${topAfter}`,
          },
          annotations: [
            {
              id: "w",
              text: `stack[${topAfter}] ← ${value}`,
              x: 340,
              y: 300 - topAfter * 58,
              kind: "assign",
              highlighted: true,
            },
            {
              id: "t",
              text: `top: ${topBefore} → ${topAfter}`,
              x: 100,
              y: 300 - topAfter * 58,
              kind: "link",
              highlighted: true,
            },
          ],
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
            en: `TOP points to ${value}`,
            vi: `TOP trỏ tới ${value}`,
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
            en: `Enter pop()`,
            vi: `Vào hàm pop()`,
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
            en: `Guard against empty stack`,
            vi: `Chặn stack rỗng`,
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
            en: `Capture top value before decrement`,
            vi: `Lấy giá trị top trước khi giảm`,
            code: `return stack[top--]; // ${val}`,
          },
          annotations: [
            {
              id: "rd",
              text: `returnValue = ${val}`,
              x: 340,
              y: 300 - topBefore * 58,
              kind: "assign",
              highlighted: true,
            },
          ],
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
            en: `Remove ${val}; TOP moves down`,
            vi: `Gỡ ${val}; TOP đi xuống`,
            code: `top--; // removed ${val}`,
          },
          annotations: [
            {
              id: "rm",
              text: `removed ${val}`,
              x: 340,
              y: 80,
              kind: "warn",
              highlighted: true,
            },
          ],
          floating: undefined,
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
              en: `Empty stack`,
              vi: `Stack rỗng`,
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
            en: `Peek TOP without removal`,
            vi: `Xem TOP không xóa`,
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
          annotations: [
            {
              id: "pk",
              text: `TOP = ${val} (unchanged)`,
              x: 340,
              y: 300 - this.topIndex() * 58,
              kind: "info",
              highlighted: true,
            },
          ],
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
          annotations: [
            {
              id: "ie",
              text: `top == -1 → ${empty}`,
              x: 220,
              y: 100,
              kind: empty ? "null" : "info",
              highlighted: true,
            },
          ],
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
            en: `Clear stack`,
            vi: `Xóa stack`,
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
            en: `All slots discarded · top → -1`,
            vi: `Mọi phần tử bị hủy · top → -1`,
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
        en: "Ready — run an operation",
        vi: "Sẵn sàng — chạy một thao tác",
      },
    });
  }

  getValues(): number[] {
    return [...this.items];
  }

  setValues(vals: number[]) {
    this.items = [...vals];
  }
}
