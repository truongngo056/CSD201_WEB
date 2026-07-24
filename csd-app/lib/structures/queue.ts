import type {
  AnimationStep,
  VisualizationState,
  VizNode,
  VizPointer,
  VizAnnotation,
  VizAction,
  VizEdge,
} from "@/types";
import {
  fmtArr,
  mergeVars,
  resetStepCounter,
  step,
  v,
} from "./animation-helpers";

export class QueueEngine {
  items: number[] = [];

  constructor(initial: number[] = []) {
    this.items = [...initial];
  }

  private vars(extra: ReturnType<typeof v>[] = [], changed: string[] = []) {
    return mergeVars(
      [
        v("front", this.items.length ? 0 : -1, changed.includes("front")),
        v(
          "rear",
          this.items.length ? this.items.length - 1 : -1,
          changed.includes("rear")
        ),
        v("size", this.items.length, changed.includes("size")),
        v("queue", fmtArr(this.items), changed.includes("queue")),
      ],
      extra
    );
  }

  private frame(opts: {
    highlight?: "front" | "rear" | "both" | "none";
    floating?: { value: number };
    action?: VizAction;
    annotations?: VizAnnotation[];
    dequeuing?: boolean;
  } = {}): VisualizationState {
    const hl = opts.highlight ?? "none";
    const nodes: VizNode[] = this.items.map((val, i) => {
      const isFront = i === 0;
      const isRear = i === this.items.length - 1;
      const active =
        hl === "both" ||
        (hl === "front" && isFront) ||
        (hl === "rear" && isRear);
      return {
        id: `q${i}`,
        value: val,
        x: 140 + i * 180,
        y: 220,
        highlighted: active || (opts.dequeuing && isFront),
        active: active || (opts.dequeuing && isFront),
        // FRONT/REAR via pointer chips only — avoid badge overlap
        label: undefined,
        sublabel: isFront
          ? "dequeue"
          : isRear
            ? "enqueue"
            : undefined,
        role: opts.dequeuing && isFront ? "removed" : "normal",
      };
    });

    const edges: VizEdge[] = [];
    for (let i = 0; i < this.items.length - 1; i++) {
      edges.push({
        id: `qe-${i}`,
        from: `q${i}`,
        to: `q${i + 1}`,
        type: "next",
        label: "→",
        dashed: true,
      });
    }

    const pointers: VizPointer[] = [];
    const annotations = [...(opts.annotations ?? [])];

    if (this.items.length === 0) {
      nodes.push({
        id: "q-empty",
        value: "∅",
        x: 200,
        y: 180,
        role: "null",
        label: "EMPTY",
        sublabel: "front=rear=null",
        highlighted: true,
      });
      pointers.push(
        {
          id: "ptr-front",
          name: "front",
          targetId: null,
          x: 120,
          y: 100,
          highlighted: true,
        },
        {
          id: "ptr-rear",
          name: "rear",
          targetId: null,
          x: 280,
          y: 100,
          highlighted: true,
        }
      );
    } else {
      // Name only — chips fly to front/rear nodes on update
      pointers.push({
        id: "ptr-front",
        name: "front",
        targetId: "q0",
        highlighted: hl === "front" || hl === "both",
      });
      pointers.push({
        id: "ptr-rear",
        name: "rear",
        targetId: `q${this.items.length - 1}`,
        highlighted: hl === "rear" || hl === "both",
      });
    }

    if (opts.floating) {
      const fx = 120 + this.items.length * 120;
      nodes.push({
        id: "q-new",
        value: opts.floating.value,
        x: fx,
        y: 90,
        role: "new",
        label: "NEW",
        active: true,
        highlighted: true,
        sublabel: "to REAR",
      });
      pointers.push({
        id: "ptr-new",
        name: "value",
        targetId: "q-new",
        highlighted: true,
      });
      if (this.items.length > 0) {
        edges.push({
          id: "e-to-new",
          from: `q${this.items.length - 1}`,
          to: "q-new",
          type: "next",
          label: "next ★",
          highlighted: true,
          animated: true,
          dashed: true,
        });
      }
    }

    return {
      nodes,
      edges,
      pointers,
      annotations,
      action: opts.action,
      meta: {
        size: this.items.length,
        front: this.items[0] ?? null,
        rear: this.items[this.items.length - 1] ?? null,
      },
    };
  }

  snapshot(
    highlight: "front" | "rear" | "both" | "none" = "none"
  ): VisualizationState {
    return this.frame({ highlight });
  }

  run(op: string, value?: number): AnimationStep[] {
    resetStepCounter();
    switch (op) {
      case "enqueue":
        return this.enqueue(value ?? 0);
      case "dequeue":
        return this.dequeue();
      case "front":
        return this.frontOp();
      case "rear":
        return this.rearOp();
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

  private enqueue(value: number): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: `Call enqueue(${value})`,
        vi: `Gọi enqueue(${value})`,
        data: this.frame({
          highlight: "rear",
          action: {
            en: `Enter enqueue(${value})`,
            vi: `Vào hàm enqueue(${value})`,
            code: `enqueue(${value})`,
          },
        }),
        codeLines: [0],
        variables: this.vars([v("value", value, true)]),
      })
    );

    steps.push(
      step({
        type: "create",
        en: `New element ${value} arrives at REAR side`,
        vi: `Phần tử ${value} đến phía REAR`,
        data: this.frame({
          floating: { value },
          highlight: "rear",
          action: {
            en: `Allocate then attach at rear`,
            vi: `Cấp phát rồi gắn vào rear`,
            code: `rear = rear + 1; data[rear] = value;`,
          },
          annotations: [
            {
              id: "nq",
              text: `value=${value} → REAR`,
              x: 100 + this.items.length * 110,
              y: 40,
              kind: "assign",
              highlighted: true,
            },
          ],
        }),
        codeLines: [2, 3],
        variables: this.vars([v("value", value, true)]),
      })
    );

    this.items.push(value);
    steps.push(
      step({
        type: "assign",
        en: `rear → ${value}; size++`,
        vi: `rear → ${value}; size++`,
        data: this.frame({
          highlight: "both",
          action: {
            en: `REAR updated · FRONT unchanged`,
            vi: `REAR cập nhật · FRONT giữ nguyên`,
            code: `data[rear] = ${value}; size++;`,
          },
          annotations: [
            {
              id: "rear",
              text: `rear = ${value}`,
              x: 100 + (this.items.length - 1) * 110,
              y: 260,
              kind: "link",
              highlighted: true,
            },
          ],
        }),
        codeLines: [2, 3, 4],
        variables: this.vars(
          [v("data[rear]", value, true)],
          ["rear", "size", "queue"]
        ),
        duration: 1200,
      })
    );

    steps.push(
      step({
        type: "done",
        en: `enqueue done. front=${this.items[0]}, rear=${value}`,
        vi: `enqueue xong. front=${this.items[0]}, rear=${value}`,
        data: this.frame({
          highlight: "both",
          action: {
            en: `Queue updated`,
            vi: `Hàng đợi đã cập nhật`,
            code: `// size=${this.items.length}`,
          },
        }),
        codeLines: [5],
        variables: this.vars(),
      })
    );
    return steps;
  }

  private dequeue(): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: "Call dequeue()",
        vi: "Gọi dequeue()",
        data: this.frame({
          highlight: "front",
          action: {
            en: `Enter dequeue()`,
            vi: `Vào hàm dequeue()`,
            code: `dequeue()`,
          },
        }),
        codeLines: [0],
        variables: this.vars(),
      })
    );

    if (this.items.length === 0) {
      steps.push(
        step({
          type: "error",
          en: "Empty — cannot dequeue",
          vi: "Rỗng — không dequeue được",
          data: this.frame({
            action: {
              en: `Queue empty`,
              vi: `Hàng đợi rỗng`,
              code: `if (isEmpty()) throw ...`,
            },
          }),
          codeLines: [1],
          variables: this.vars([v("isEmpty", true, true)]),
        })
      );
      return steps;
    }

    const val = this.items[0];
    steps.push(
      step({
        type: "read",
        en: `val = data[front] = ${val}`,
        vi: `val = data[front] = ${val}`,
        data: this.frame({
          highlight: "front",
          dequeuing: true,
          action: {
            en: `Read FRONT before removal`,
            vi: `Đọc FRONT trước khi gỡ`,
            code: `int val = data[front]; // ${val}`,
          },
          annotations: [
            {
              id: "dq",
              text: `remove FRONT=${val}`,
              x: 100,
              y: 100,
              kind: "warn",
              highlighted: true,
            },
          ],
        }),
        codeLines: [2],
        variables: this.vars([v("val", val, true)]),
      })
    );

    this.items.shift();
    steps.push(
      step({
        type: "assign",
        en: `front advances; removed ${val}`,
        vi: `front tiến lên; đã gỡ ${val}`,
        data: this.frame({
          highlight: "both",
          action: {
            en: `FRONT moves to next element`,
            vi: `FRONT dời sang phần tử kế`,
            code: `front = front + 1; size--;`,
          },
        }),
        codeLines: [3, 4],
        variables: this.vars(
          [v("removed", val, true)],
          ["front", "rear", "size", "queue"]
        ),
        duration: 1200,
      })
    );

    steps.push(
      step({
        type: "done",
        en: `dequeue() → ${val}`,
        vi: `dequeue() → ${val}`,
        data: this.frame({
          highlight: "both",
          action: {
            en: `Returned ${val}`,
            vi: `Trả về ${val}`,
            code: `return ${val};`,
          },
        }),
        codeLines: [5],
        variables: this.vars([v("return", val, true)]),
      })
    );
    return steps;
  }

  private frontOp(): AnimationStep[] {
    if (!this.items.length) {
      return [
        step({
          type: "error",
          en: "Empty — no front",
          vi: "Rỗng — không có front",
          data: this.frame({
            action: {
              en: `Empty queue`,
              vi: `Hàng đợi rỗng`,
              code: `if (isEmpty()) throw ...`,
            },
          }),
          codeLines: [1],
          variables: this.vars([v("isEmpty", true, true)]),
        }),
      ];
    }
    const f = this.items[0];
    return [
      step({
        type: "read",
        en: `front() → ${f} (no removal)`,
        vi: `front() → ${f} (không xóa)`,
        data: this.frame({
          highlight: "front",
          action: {
            en: `Peek FRONT only`,
            vi: `Chỉ xem FRONT`,
            code: `return data[front]; // ${f}`,
          },
          annotations: [
            {
              id: "f",
              text: `FRONT = ${f}`,
              x: 100,
              y: 100,
              kind: "info",
              highlighted: true,
            },
          ],
        }),
        codeLines: [0, 2],
        variables: this.vars([v("return", f, true)]),
      }),
    ];
  }

  private rearOp(): AnimationStep[] {
    if (!this.items.length) {
      return [
        step({
          type: "error",
          en: "Empty — no rear",
          vi: "Rỗng — không có rear",
          data: this.frame({
            action: {
              en: `Empty queue`,
              vi: `Hàng đợi rỗng`,
              code: `if (isEmpty()) throw ...`,
            },
          }),
          codeLines: [1],
          variables: this.vars([v("isEmpty", true, true)]),
        }),
      ];
    }
    const r = this.items[this.items.length - 1];
    return [
      step({
        type: "read",
        en: `rear() → ${r} (no removal)`,
        vi: `rear() → ${r} (không xóa)`,
        data: this.frame({
          highlight: "rear",
          action: {
            en: `Peek REAR only`,
            vi: `Chỉ xem REAR`,
            code: `return data[rear]; // ${r}`,
          },
          annotations: [
            {
              id: "r",
              text: `REAR = ${r}`,
              x: 100 + (this.items.length - 1) * 110,
              y: 100,
              kind: "info",
              highlighted: true,
            },
          ],
        }),
        codeLines: [0, 2],
        variables: this.vars([v("return", r, true)]),
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
          highlight: "both",
          action: {
            en: `Clear queue`,
            vi: `Xóa hàng đợi`,
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
        en: "front=0; rear=-1; size=0",
        vi: "front=0; rear=-1; size=0",
        data: this.frame({
          action: {
            en: `front & rear → null`,
            vi: `front & rear → null`,
            code: `front=0; rear=-1; size=0;`,
          },
        }),
        codeLines: [1, 2, 3],
        variables: this.vars([], ["front", "rear", "size", "queue"]),
      })
    );
    return steps;
  }

  currentState(): VisualizationState {
    return this.frame({
      highlight: "both",
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
