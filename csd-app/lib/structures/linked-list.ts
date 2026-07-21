import type {
  AnimationStep,
  VisualizationState,
  VizAction,
  VizAnnotation,
  VizEdge,
  VizNode,
  VizPointer,
} from "@/types";
import {
  fmtArr,
  mergeVars,
  resetStepCounter,
  step,
  v,
} from "./animation-helpers";

export type ListKind = "singly" | "doubly" | "circular";

interface LLNode {
  id: string;
  value: number;
}

let idSeq = 0;
function nid() {
  idSeq += 1;
  return `n${idSeq}`;
}

/** Node row Y — leave room above for pointer chips */
const Y = 220;
const GAP = 220;
const START_X = 140;

export class LinkedListEngine {
  kind: ListKind;
  nodes: LLNode[] = [];

  constructor(kind: ListKind, initial: number[] = []) {
    this.kind = kind;
    this.nodes = initial.map((val) => ({ id: nid(), value: val }));
  }

  private values() {
    return this.nodes.map((n) => n.value);
  }

  private vars(extra: ReturnType<typeof v>[] = [], changed: string[] = []) {
    const list = [
      v("head", this.nodes[0]?.value ?? "null", changed.includes("head")),
      v("size", this.nodes.length, changed.includes("size")),
      v("list", fmtArr(this.values()), changed.includes("list")),
    ];
    if (this.kind === "doubly" || this.kind === "circular") {
      list.splice(
        1,
        0,
        v(
          "tail",
          this.nodes[this.nodes.length - 1]?.value ?? "null",
          changed.includes("tail")
        )
      );
    }
    return mergeVars(list, extra);
  }

  /**
   * Build a full visualization frame for the list.
   * Every head/tail/null/next/prev/newNode is drawn in the canvas.
   */
  private frame(opts: {
    highlight?: string[];
    active?: string;
    /** floating new node not yet in list */
    newNode?: {
      id: string;
      value: number;
      nextTo?: string | null;
      prevTo?: string | null;
      /** place left of list (addFirst) or right (addLast) */
      side?: "left" | "right";
    };
    /** curr pointer on node id */
    curr?: string | null;
    prev?: string | null;
    /** highlight specific edges by index or id */
    edgeHl?: string[];
    /** pending dashed edges */
    pendingEdges?: VizEdge[];
    annotations?: VizAnnotation[];
    action?: VizAction;
    /** hide automatic null terminator */
    hideNull?: boolean;
    /** mark node as removed (ghost) */
    removedId?: string;
    /** custom node sublabels id -> text */
    sublabels?: Record<string, string>;
    /** override labels */
    extraLabels?: Record<string, string>;
  } = {}): VisualizationState {
    const hl = new Set(opts.highlight ?? []);
    const nodes: VizNode[] = [];
    const edges: VizEdge[] = [];
    const pointers: VizPointer[] = [];
    const annotations = [...(opts.annotations ?? [])];

    // Main list nodes
    // HEAD/TAIL/curr/prev are drawn as external pointer chips only (no node badge overlap)
    this.nodes.forEach((n, i) => {
      let label: string | undefined = opts.extraLabels?.[n.id];
      // Only allow transient role badges that are NOT also pointer chips
      if (label && /HEAD|TAIL|curr|prev/i.test(label) && !/newNode|NEW/i.test(label)) {
        label = undefined;
      }

      const nextVal =
        i < this.nodes.length - 1
          ? this.nodes[i + 1].value
          : this.kind === "circular" && this.nodes[0]
            ? this.nodes[0].value
            : "null";
      const prevVal =
        this.kind === "doubly"
          ? i > 0
            ? this.nodes[i - 1].value
            : "null"
          : undefined;

      let sublabel = opts.sublabels?.[n.id];
      if (!sublabel) {
        if (this.kind === "doubly") {
          sublabel = `prev→${prevVal}  next→${nextVal}`;
        } else {
          sublabel = `next→${nextVal}`;
        }
      }

      let nx = START_X + i * GAP;
      let ny = Y;

      if (this.kind === "circular") {
        const count = Math.max(1, this.nodes.length);
        const R = Math.max(140, count * 35);
        const CX = 350;
        const CY = 240;
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
        nx = Math.round(CX + R * Math.cos(angle));
        ny = Math.round(CY + R * Math.sin(angle));
      }

      nodes.push({
        id: n.id,
        value: n.value,
        x: nx,
        y: ny,
        highlighted: hl.has(n.id),
        active: opts.active === n.id,
        label,
        sublabel,
        role: opts.removedId === n.id ? "removed" : "normal",
        fading: opts.removedId === n.id,
      });
    });

    // next edges
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const id = `e-next-${i}`;
      edges.push({
        id,
        from: this.nodes[i].id,
        to: this.nodes[i + 1].id,
        type: "next",
        label: "next",
        highlighted: opts.edgeHl?.includes(id) || opts.edgeHl?.includes("next"),
        animated: opts.edgeHl?.includes(id),
      });
      if (this.kind === "doubly") {
        const pid = `e-prev-${i}`;
        edges.push({
          id: pid,
          from: this.nodes[i + 1].id,
          to: this.nodes[i].id,
          type: "prev",
          label: "prev",
          highlighted: opts.edgeHl?.includes(pid) || opts.edgeHl?.includes("prev"),
          animated: opts.edgeHl?.includes(pid),
          dashed: true,
        });
      }
    }

    // circular loop
    if (this.kind === "circular" && this.nodes.length > 0) {
      edges.push({
        id: "e-loop",
        from: this.nodes[this.nodes.length - 1].id,
        to: this.nodes[0].id,
        type: "loop",
        label: "next → HEAD",
        highlighted: opts.edgeHl?.includes("e-loop"),
        animated: opts.edgeHl?.includes("e-loop"),
      });
    }

    // NULL terminator as real node (singly / doubly)
    // Hide while a floating newNode is shown — it owns its own next/NULL visuals
    if (
      !opts.hideNull &&
      !opts.newNode &&
      this.kind !== "circular" &&
      this.nodes.length > 0
    ) {
      const nullX =
        START_X +
        (this.nodes.length > 0 ? this.nodes.length : 0) * GAP +
        (opts.newNode && this.nodes.length === 0 ? GAP : 0);
      const nullId = "null-end";
      nodes.push({
        id: nullId,
        value: "∅",
        x: nullX,
        y: Y,
        role: "null",
        label: "NULL",
        highlighted: hl.has(nullId) || opts.edgeHl?.includes("to-null"),
        active: opts.active === nullId,
        sublabel: "terminator",
      });
      if (this.nodes.length > 0) {
        edges.push({
          id: "e-to-null",
          from: this.nodes[this.nodes.length - 1].id,
          to: nullId,
          type: "next",
          label: "next",
          highlighted:
            opts.edgeHl?.includes("e-to-null") ||
            opts.edgeHl?.includes("to-null"),
          dashed: true,
        });
      }
    }

    // Empty list: show head → null explicitly
    if (this.nodes.length === 0 && !opts.newNode) {
      nodes.push({
        id: "null-empty",
        value: "∅",
        x: START_X + 80,
        y: Y,
        role: "null",
        label: "NULL",
        highlighted: true,
        sublabel: "empty list",
      });
      pointers.push({
        id: "ptr-head",
        name: "head",
        targetId: null,
        x: START_X,
        y: Y - 70,
        highlighted: true,
        display: "null",
      });
      annotations.push({
        id: "ann-empty",
        text: "head → null",
        x: START_X + 80,
        y: Y + 55,
        kind: "null",
        highlighted: true,
      });
    }

    // HEAD / TAIL external pointers
    if (this.nodes.length > 0) {
      pointers.push({
        id: "ptr-head",
        name: "head",
        targetId: this.nodes[0].id,
        highlighted: hl.has(this.nodes[0].id) || opts.edgeHl?.includes("head"),
        display: String(this.nodes[0].value),
      });
      if (this.kind === "doubly" || this.kind === "circular") {
        const t = this.nodes[this.nodes.length - 1];
        pointers.push({
          id: "ptr-tail",
          name: "tail",
          targetId: t.id,
          highlighted: opts.edgeHl?.includes("tail"),
          display: String(t.value),
        });
      }
    }

    // curr / prev pointers
    if (opts.curr) {
      if (opts.curr === "null") {
        pointers.push({
          id: "ptr-curr",
          name: "curr",
          targetId: null,
          x: START_X + this.nodes.length * GAP,
          y: Y - 70,
          highlighted: true,
          display: "null",
        });
      } else {
        pointers.push({
          id: "ptr-curr",
          name: "curr",
          targetId: opts.curr,
          highlighted: true,
          display: String(
            this.nodes.find((n) => n.id === opts.curr)?.value ?? "?"
          ),
        });
      }
    }
    if (opts.prev) {
      pointers.push({
        id: "ptr-prev",
        name: "prev",
        targetId: opts.prev,
        highlighted: true,
        display: String(
          this.nodes.find((n) => n.id === opts.prev)?.value ?? "?"
        ),
      });
    }

    // Floating newNode — same row as list, LEFT (addFirst) or RIGHT (addLast)
    // Never stacked above HEAD (that caused head chip to sit on newNode)
    // Layout addFirst:  [newNode] --next--> [HEAD] --next--> ...
    // Layout addLast:   ... --next--> [TAIL] --next--> [newNode]
    if (opts.newNode) {
      const side = opts.newNode.side ?? "left";
      let NEW_X: number;
      let NEW_Y: number;

      if (this.kind === "circular") {
        const count = Math.max(1, this.nodes.length);
        const R = Math.max(140, count * 35);
        const CX = 350;
        const CY = 240;
        NEW_X = CX - R - 140;
        NEW_Y = CY - 40;
      } else {
        NEW_Y = Y - 130;
        NEW_X =
          side === "right"
            ? START_X + this.nodes.length * GAP
            : START_X - 60;
      }

      nodes.push({
        id: opts.newNode.id,
        value: opts.newNode.value,
        x: NEW_X,
        y: NEW_Y,
        role: "new",
        label: undefined,
        active: true,
        highlighted: true,
        sublabel: undefined,
      });

      pointers.push({
        id: "ptr-new",
        name: "newNode",
        targetId: opts.newNode.id,
        highlighted: true,
        display: String(opts.newNode.value),
      });

      if (opts.newNode.nextTo === null) {
        // Place null-new to the LEFT of newNode when side === "left"
        // so it stays far away from the head node on the right!
        const nullX = side === "left" ? NEW_X - 160 : NEW_X + 160;
        nodes.push({
          id: "null-new",
          value: "∅",
          x: nullX,
          y: NEW_Y,
          role: "null",
          label: undefined,
          highlighted: true,
          sublabel: undefined,
        });
        edges.push({
          id: "e-new-null",
          from: opts.newNode.id,
          to: "null-new",
          type: "next",
          label: "next→null",
          highlighted: true,
          animated: true,
          dashed: true,
        });
      } else if (opts.newNode.nextTo) {
        edges.push({
          id: "e-new-next",
          from: opts.newNode.id,
          to: opts.newNode.nextTo,
          type: "next",
          label: "next",
          highlighted: true,
          animated: true,
          dashed: true,
        });
      }

      if (opts.newNode.prevTo) {
        edges.push({
          id: "e-new-prev",
          from: opts.newNode.id,
          to: opts.newNode.prevTo,
          type: "prev",
          label: "prev",
          highlighted: true,
          animated: true,
          dashed: true,
        });
      }
    }

    if (opts.pendingEdges) edges.push(...opts.pendingEdges);

    return {
      nodes,
      edges,
      pointers,
      annotations,
      action: opts.action,
      meta: {
        kind: this.kind,
        size: this.nodes.length,
        head: this.nodes[0]?.value ?? null,
        tail:
          this.kind !== "singly"
            ? this.nodes[this.nodes.length - 1]?.value ?? null
            : null,
      },
    };
  }

  // keep public API
  snapshot(
    highlight: string[] = [],
    active?: string,
    message?: string
  ): VisualizationState {
    return {
      ...this.frame({ highlight, active }),
      message,
    };
  }

  run(op: string, value?: number): AnimationStep[] {
    resetStepCounter();
    switch (op) {
      case "addFirst":
        return this.addFirst(value ?? 0);
      case "addLast":
        return this.addLast(value ?? 0);
      case "remove":
        return this.remove(value ?? 0);
      case "search":
        return this.search(value ?? 0);
      case "traverse":
        return this.traverse();
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

  private addFirst(value: number): AnimationStep[] {
    const steps: AnimationStep[] = [];
    const oldHead = this.nodes[0];
    const oldHeadVal = oldHead?.value ?? "null";

    steps.push(
      step({
        type: "call",
        en: `Call addFirst(${value})`,
        vi: `Gọi addFirst(${value})`,
        data: this.frame({
          action: {
            en: `Enter addFirst(${value})`,
            vi: `Vào hàm addFirst(${value})`,
            code: `addFirst(${value})`,
          },
        }),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public void addFirst(int value)  // value=${value}`,
        variables: this.vars([v("value", value, true)]),
      })
    );

    const node: LLNode = { id: nid(), value };

    // 1) Create newNode floating
    steps.push(
      step({
        type: "create",
        en: `Create newNode = new Node(${value}) — next is still null`,
        vi: `Tạo newNode = new Node(${value}) — next vẫn null`,
        data: this.frame({
          newNode: { id: node.id, value, nextTo: null },
          action: {
            en: `Allocate newNode on heap`,
            vi: `Cấp phát newNode trên heap`,
            code: `Node newNode = new Node(${value});`,
          },
          annotations: [
            {
              id: "a1",
              text: `newNode.data = ${value}`,
              x: START_X - GAP - 20,
              y: Y + 95,
              kind: "assign",
              highlighted: true,
            },
          ],
          edgeHl: ["e-new-null"],
        }),
        codeLines: [1],
        pseudoLines: [1],
        codeSnippet: `Node newNode = new Node(${value});`,
        variables: this.vars([
          v("value", value),
          v("newNode.data", value, true),
          v("newNode.next", "null", true),
        ]),
        duration: 1100,
      })
    );

    // 2) newNode.next = head
    steps.push(
      step({
        type: "link",
        en: `newNode.next = head  (head was ${oldHeadVal})`,
        vi: `newNode.next = head  (head cũ = ${oldHeadVal})`,
        data: this.frame({
          newNode: {
            id: node.id,
            value,
            nextTo: oldHead?.id ?? null,
          },
          edgeHl: oldHead ? ["e-new-next"] : ["e-new-null"],
          action: {
            en: `Wire newNode.next → old head`,
            vi: `Nối newNode.next → head cũ`,
            code: `newNode.next = head; // → ${oldHeadVal}`,
          },
          annotations: [
            {
              id: "a2",
              text: `newNode.next → ${oldHeadVal}`,
              // Midway between newNode (left) and head — below the edge
              x: START_X - GAP / 2 - 10,
              y: Y + 95,
              kind: "link",
              highlighted: true,
            },
          ],
          highlight: oldHead ? [oldHead.id] : ["null-empty", "null-end"],
        }),
        codeLines: [2],
        pseudoLines: [2],
        codeSnippet: `newNode.next = head;  // → ${oldHeadVal}`,
        variables: this.vars([
          v("newNode.data", value),
          v("newNode.next", oldHeadVal, true),
          v("head", oldHeadVal),
        ]),
        duration: 1100,
      })
    );

    // 3) doubly: head.prev = newNode
    if (this.kind === "doubly" && oldHead) {
      steps.push(
        step({
          type: "link",
          en: `head.prev = newNode  (bidirectional link)`,
          vi: `head.prev = newNode  (nối hai chiều)`,
          data: this.frame({
            newNode: {
              id: node.id,
              value,
              nextTo: oldHead.id,
            },
            pendingEdges: [
              {
                id: "e-old-prev-new",
                from: oldHead.id,
                to: node.id,
                type: "prev",
                label: "prev",
                highlighted: true,
                animated: true,
                dashed: true,
              },
            ],
            highlight: [oldHead.id],
            active: oldHead.id,
            action: {
              en: `Set old head's prev → newNode`,
              vi: `Gán prev của head cũ → newNode`,
              code: `if (head != null) head.prev = newNode;`,
            },
            annotations: [
              {
                id: "a3",
                text: `[${oldHeadVal}].prev → ${value}`,
                x: START_X + 80,
                y: Y + 70,
                kind: "link",
                highlighted: true,
              },
            ],
          }),
          codeLines: [3],
          pseudoLines: [3],
          codeSnippet: `if (head != null) head.prev = newNode;`,
          variables: this.vars([
            v("head.prev", value, true),
            v("newNode", value),
          ]),
          duration: 1100,
        })
      );
    }

    // 4) head = newNode
    this.nodes.unshift(node);
    steps.push(
      step({
        type: "assign",
        en: `head = newNode  → head now points to [${value}]`,
        vi: `head = newNode  → head trỏ tới [${value}]`,
        data: this.frame({
          highlight: [node.id],
          active: node.id,
          edgeHl: ["head", "e-next-0"],
          action: {
            en: `Update head reference`,
            vi: `Cập nhật con trỏ head`,
            code: `head = newNode; size++;`,
          },
          annotations: [
            {
              id: "a4",
              text: `head → [${value}]`,
              x: START_X,
              y: Y - 100,
              kind: "assign",
              highlighted: true,
            },
          ],
          extraLabels: { [node.id]: "newNode" },
        }),
        codeLines: this.kind === "doubly" ? [4, 5] : [3, 4],
        pseudoLines: [3, 4],
        codeSnippet: `head = newNode; size++;`,
        variables: this.vars(
          [v("head", value, true), v("newNode", value)],
          ["head", "size", "list", "tail"]
        ),
        duration: 1200,
      })
    );

    steps.push(
      step({
        type: "done",
        en: `addFirst done. HEAD → [${value}] → …`,
        vi: `addFirst xong. HEAD → [${value}] → …`,
        data: this.frame({
          action: {
            en: `List updated · size = ${this.nodes.length}`,
            vi: `Danh sách đã cập nhật · size = ${this.nodes.length}`,
            code: `// done`,
          },
        }),
        codeLines: [5],
        pseudoLines: [4],
        codeSnippet: `} // size = ${this.nodes.length}`,
        variables: this.vars(),
      })
    );
    return steps;
  }

  private addLast(value: number): AnimationStep[] {
    const steps: AnimationStep[] = [];

    steps.push(
      step({
        type: "call",
        en: `Call addLast(${value})`,
        vi: `Gọi addLast(${value})`,
        data: this.frame({
          action: {
            en: `Enter addLast(${value})`,
            vi: `Vào hàm addLast(${value})`,
            code: `addLast(${value})`,
          },
        }),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public void addLast(int value)`,
        variables: this.vars([v("value", value, true)]),
      })
    );

    const newId = nid();
    steps.push(
      step({
        type: "create",
        en: `newNode = new Node(${value})`,
        vi: `newNode = new Node(${value})`,
        data: this.frame({
          newNode: { id: newId, value, nextTo: null, side: "right" },
          action: {
            en: `Allocate newNode`,
            vi: `Cấp phát newNode`,
            code: `Node newNode = new Node(${value});`,
          },
          annotations: [
            {
              id: "c1",
              text: `newNode · next→null`,
              x: START_X + 40,
              y: Y - 140,
              kind: "assign",
              highlighted: true,
            },
          ],
        }),
        codeLines: [1],
        pseudoLines: [1],
        codeSnippet: `Node newNode = new Node(${value});`,
        variables: this.vars([
          v("newNode.data", value, true),
          v("newNode.next", "null", true),
        ]),
      })
    );

    if (this.nodes.length === 0) {
      steps.push(
        step({
          type: "check",
          en: "head == null → empty list",
          vi: "head == null → danh sách rỗng",
          data: this.frame({
            newNode: { id: newId, value, nextTo: null, side: "right" },
            action: {
              en: `Branch: empty list`,
              vi: `Nhánh: list rỗng`,
              code: `if (head == null)`,
            },
            annotations: [
              {
                id: "c2",
                text: "head == null → true",
                x: START_X + 80,
                y: Y + 60,
                kind: "null",
                highlighted: true,
              },
            ],
          }),
          codeLines: [2],
          pseudoLines: [2],
          codeSnippet: `if (head == null)`,
          variables: this.vars([v("head == null", true, true)]),
        })
      );
      this.nodes.push({ id: newId, value });
      steps.push(
        step({
          type: "assign",
          en: `head = newNode (= ${value})`,
          vi: `head = newNode (= ${value})`,
          data: this.frame({
            highlight: [newId],
            active: newId,
            edgeHl: ["head"],
            action: {
              en: `Set head to newNode`,
              vi: `Gán head = newNode`,
              code: `head = newNode;`,
            },
            annotations: [
              {
                id: "c3",
                text: `head → [${value}]`,
                x: START_X,
                y: Y - 100,
                kind: "assign",
                highlighted: true,
              },
            ],
          }),
          codeLines: [3],
          pseudoLines: [3],
          codeSnippet: `head = newNode;`,
          variables: this.vars([], ["head", "size", "list", "tail"]),
        })
      );
    } else if (this.kind === "circular") {
      const tail = this.nodes[this.nodes.length - 1];
      const head = this.nodes[0];
      steps.push(
        step({
          type: "read",
          en: `tail = [${tail.value}], head = tail.next = [${head.value}]`,
          vi: `tail = [${tail.value}], head = tail.next = [${head.value}]`,
          data: this.frame({
            highlight: [tail.id, head.id],
            active: tail.id,
            edgeHl: ["e-loop", "tail"],
            action: {
              en: `Use tail to find head in O(1)`,
              vi: `Dùng tail để lấy head O(1)`,
              code: `n.next = tail.next; // head`,
            },
          }),
          codeLines: [2, 3],
          variables: this.vars([
            v("tail", tail.value, true),
            v("head", head.value),
          ]),
        })
      );
      steps.push(
        step({
          type: "link",
          en: `newNode.next = HEAD; tail.next = newNode; tail = newNode`,
          vi: `newNode.next = HEAD; tail.next = newNode; tail = newNode`,
          data: this.frame({
            newNode: { id: newId, value, nextTo: head.id, side: "right" },
            edgeHl: ["e-new-next", "e-loop"],
            action: {
              en: `Insert into cycle after tail`,
              vi: `Chèn vào vòng sau tail`,
              code: `tail.next = n; tail = n;`,
            },
            annotations: [
              {
                id: "c4",
                text: `[${tail.value}].next → ${value} → HEAD`,
                x: START_X + (this.nodes.length - 1) * GAP,
                y: Y + 75,
                kind: "link",
                highlighted: true,
              },
            ],
          }),
          codeLines: [4, 5, 6],
          variables: this.vars([v("newNode.next", head.value, true)]),
        })
      );
      this.nodes.push({ id: newId, value });
      steps.push(
        step({
          type: "assign",
          en: `tail now → [${value}]`,
          vi: `tail hiện → [${value}]`,
          data: this.frame({
            highlight: [newId],
            active: newId,
            edgeHl: ["tail", "e-loop"],
            action: {
              en: `Update tail pointer`,
              vi: `Cập nhật con trỏ tail`,
              code: `tail = n; size++;`,
            },
          }),
          codeLines: [6, 7],
          variables: this.vars([], ["tail", "size", "list"]),
        })
      );
    } else if (this.kind === "doubly") {
      const tail = this.nodes[this.nodes.length - 1];
      steps.push(
        step({
          type: "read",
          en: `tail → [${tail.value}] (O(1) append)`,
          vi: `tail → [${tail.value}] (thêm cuối O(1))`,
          data: this.frame({
            highlight: [tail.id],
            active: tail.id,
            edgeHl: ["tail"],
            action: {
              en: `Locate tail`,
              vi: `Xác định tail`,
              code: `n.prev = tail;`,
            },
          }),
          codeLines: [2],
          variables: this.vars([v("tail", tail.value, true)]),
        })
      );
      steps.push(
        step({
          type: "link",
          en: `newNode.prev = tail; tail.next = newNode`,
          vi: `newNode.prev = tail; tail.next = newNode`,
          data: this.frame({
            newNode: { id: newId, value, nextTo: null, prevTo: tail.id, side: "right" },
            edgeHl: ["e-new-prev", "to-null"],
            action: {
              en: `Bidirectional link with old tail`,
              vi: `Nối hai chiều với tail cũ`,
              code: `tail.next = n; n.prev = tail;`,
            },
            annotations: [
              {
                id: "d1",
                text: `[${tail.value}] ⇄ newNode(${value})`,
                x: START_X + (this.nodes.length - 0.5) * GAP,
                y: Y - 100,
                kind: "link",
                highlighted: true,
              },
            ],
          }),
          codeLines: [3, 4],
          variables: this.vars([
            v("newNode.prev", tail.value, true),
            v("tail.next", value, true),
          ]),
        })
      );
      this.nodes.push({ id: newId, value });
      steps.push(
        step({
          type: "assign",
          en: `tail = newNode → [${value}]`,
          vi: `tail = newNode → [${value}]`,
          data: this.frame({
            highlight: [newId],
            active: newId,
            edgeHl: ["tail"],
            action: {
              en: `Move tail to newNode`,
              vi: `Dời tail sang newNode`,
              code: `tail = n; size++;`,
            },
          }),
          codeLines: [5, 6],
          variables: this.vars([], ["tail", "size", "list"]),
        })
      );
    } else {
      // SLL traverse
      steps.push(
        step({
          type: "assign",
          en: `curr = head (= ${this.nodes[0].value})`,
          vi: `curr = head (= ${this.nodes[0].value})`,
          data: this.frame({
            curr: this.nodes[0].id,
            highlight: [this.nodes[0].id],
            active: this.nodes[0].id,
            newNode: { id: newId, value, nextTo: null, side: "right" },
            action: {
              en: `Start traversal from head`,
              vi: `Bắt đầu duyệt từ head`,
              code: `Node curr = head;`,
            },
          }),
          codeLines: [4],
          pseudoLines: [5],
          codeSnippet: `Node curr = head;`,
          variables: this.vars([
            v("curr", this.nodes[0].value, true),
            v("newNode", value),
          ]),
        })
      );

      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        const isLast = i === this.nodes.length - 1;
        steps.push(
          step({
            type: "traverse",
            en: isLast
              ? `curr at [${n.value}], curr.next == null → stop`
              : `curr = [${n.value}]; curr.next ≠ null → advance`,
            vi: isLast
              ? `curr tại [${n.value}], curr.next == null → dừng`
              : `curr = [${n.value}]; curr.next ≠ null → tiếp`,
            data: this.frame({
              curr: n.id,
              highlight: [n.id],
              active: n.id,
              newNode: { id: newId, value, nextTo: null, side: "right" },
              edgeHl: isLast ? ["to-null", "e-to-null"] : [`e-next-${i}`],
              action: {
                en: isLast
                  ? `Found end: curr.next is NULL`
                  : `Follow next pointer`,
                vi: isLast
                  ? `Tới cuối: curr.next là NULL`
                  : `Đi theo con trỏ next`,
                code: isLast
                  ? `// curr.next == null`
                  : `curr = curr.next;`,
              },
              annotations: [
                {
                  id: `t-${i}`,
                  text: isLast
                    ? `curr.next → NULL`
                    : `curr.next → ${this.nodes[i + 1].value}`,
                  x: START_X + i * GAP,
                  y: Y + 75,
                  kind: isLast ? "null" : "info",
                  highlighted: true,
                },
              ],
            }),
            codeLines: [5, 6],
            pseudoLines: [6, 7],
            codeSnippet: isLast
              ? `// stop at last node`
              : `curr = curr.next;`,
            variables: this.vars([
              v("curr", n.value, true),
              v(
                "curr.next",
                isLast ? "null" : this.nodes[i + 1].value,
                true
              ),
            ]),
          })
        );
      }

      const last = this.nodes[this.nodes.length - 1];
      steps.push(
        step({
          type: "link",
          en: `curr.next = newNode  → [${last.value}].next = ${value}`,
          vi: `curr.next = newNode  → [${last.value}].next = ${value}`,
          data: this.frame({
            curr: last.id,
            newNode: { id: newId, value, nextTo: null, side: "right" },
            pendingEdges: [
              {
                id: "e-link-new",
                from: last.id,
                to: newId,
                type: "next",
                label: "next ★",
                highlighted: true,
                animated: true,
                dashed: true,
              },
            ],
            // position newNode at end for visual
            highlight: [last.id],
            active: last.id,
            action: {
              en: `Link last node to newNode`,
              vi: `Nối node cuối với newNode`,
              code: `curr.next = newNode;`,
            },
            annotations: [
              {
                id: "link",
                text: `[${last.value}].next → ${value}`,
                x: START_X + (this.nodes.length - 0.5) * GAP,
                y: Y - 100,
                kind: "link",
                highlighted: true,
              },
            ],
            hideNull: true,
          }),
          codeLines: [7],
          pseudoLines: [8],
          codeSnippet: `curr.next = newNode;`,
          variables: this.vars([
            v("curr", last.value),
            v("curr.next", value, true),
          ]),
          duration: 1200,
        })
      );
      this.nodes.push({ id: newId, value });
    }

    steps.push(
      step({
        type: "done",
        en: `addLast done. size = ${this.nodes.length}`,
        vi: `addLast xong. size = ${this.nodes.length}`,
        data: this.frame({
          highlight: [this.nodes[this.nodes.length - 1].id],
          active: this.nodes[this.nodes.length - 1].id,
          action: {
            en: `Append complete`,
            vi: `Thêm cuối hoàn tất`,
            code: `size++; // ${this.nodes.length}`,
          },
        }),
        codeLines: [9],
        variables: this.vars([], ["size", "list", "tail"]),
      })
    );
    return steps;
  }

  private remove(value: number): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: `Call remove(${value})`,
        vi: `Gọi remove(${value})`,
        data: this.frame({
          action: {
            en: `Enter remove(${value})`,
            vi: `Vào hàm remove(${value})`,
            code: `remove(${value})`,
          },
        }),
        codeLines: [0],
        variables: this.vars([v("value", value, true)]),
      })
    );

    if (this.nodes.length === 0) {
      steps.push(
        step({
          type: "check",
          en: "head == null → return false",
          vi: "head == null → return false",
          data: this.frame({
            action: {
              en: `Empty list — nothing to remove`,
              vi: `List rỗng — không xóa được`,
              code: `if (head == null) return false;`,
            },
          }),
          codeLines: [1],
          variables: this.vars([v("return", false, true)]),
        })
      );
      return steps;
    }

    steps.push(
      step({
        type: "check",
        en: `head.data (${this.nodes[0].value}) == ${value}? → ${this.nodes[0].value === value}`,
        vi: `head.data (${this.nodes[0].value}) == ${value}? → ${this.nodes[0].value === value}`,
        data: this.frame({
          highlight: [this.nodes[0].id],
          active: this.nodes[0].id,
          edgeHl: ["head"],
          action: {
            en: `Compare head with target`,
            vi: `So sánh head với giá trị cần xóa`,
            code: `if (head.data == value)`,
          },
          annotations: [
            {
              id: "r0",
              text: `head.data == ${value} ?`,
              x: START_X,
              y: Y + 75,
              kind: "info",
              highlighted: true,
            },
          ],
        }),
        codeLines: [2],
        variables: this.vars([
          v("head.data", this.nodes[0].value, true),
          v("match?", this.nodes[0].value === value, true),
        ]),
      })
    );

    if (this.nodes[0].value === value) {
      const removed = this.nodes[0];
      const nextVal = this.nodes[1]?.value ?? "null";
      steps.push(
        step({
          type: "unlink",
          en: `head = head.next → head becomes ${nextVal}`,
          vi: `head = head.next → head thành ${nextVal}`,
          data: this.frame({
            removedId: removed.id,
            highlight: [removed.id],
            edgeHl: this.nodes[1] ? ["e-next-0"] : ["to-null"],
            action: {
              en: `Rewire head past removed node`,
              vi: `Nối lại head bỏ qua node bị xóa`,
              code: `head = head.next; // → ${nextVal}`,
            },
            annotations: [
              {
                id: "r1",
                text: `unlink [${value}]`,
                x: START_X,
                y: Y - 100,
                kind: "warn",
                highlighted: true,
              },
              {
                id: "r2",
                text: `head → ${nextVal}`,
                x: START_X + GAP,
                y: Y - 100,
                kind: "assign",
                highlighted: true,
              },
            ],
          }),
          codeLines: [3, 4, 5],
          variables: this.vars([
            v("removed", value, true),
            v("new head", nextVal, true),
          ]),
        })
      );
      this.nodes.shift();
      steps.push(
        step({
          type: "done",
          en: `Removed ${value}. size = ${this.nodes.length}`,
          vi: `Đã xóa ${value}. size = ${this.nodes.length}`,
          data: this.frame({
            action: {
              en: `Remove complete`,
              vi: `Xóa xong`,
              code: `return true;`,
            },
          }),
          codeLines: [5],
          variables: this.vars([v("return", true, true)], ["head", "size", "list"]),
        })
      );
      return steps;
    }

    steps.push(
      step({
        type: "assign",
        en: `prev = head (= ${this.nodes[0].value})`,
        vi: `prev = head (= ${this.nodes[0].value})`,
        data: this.frame({
          prev: this.nodes[0].id,
          highlight: [this.nodes[0].id],
          action: {
            en: `Initialize prev at head`,
            vi: `Khởi tạo prev tại head`,
            code: `Node prev = head;`,
          },
        }),
        codeLines: [7],
        variables: this.vars([v("prev", this.nodes[0].value, true)]),
      })
    );

    let foundIdx = -1;
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const prevN = this.nodes[i];
      const nextN = this.nodes[i + 1];
      const match = nextN.value === value;
      steps.push(
        step({
          type: "traverse",
          en: `Check prev.next.data: [${nextN.value}] == ${value}? → ${match}`,
          vi: `Kiểm tra prev.next.data: [${nextN.value}] == ${value}? → ${match}`,
          data: this.frame({
            prev: prevN.id,
            curr: nextN.id,
            highlight: [prevN.id, nextN.id],
            active: nextN.id,
            edgeHl: [`e-next-${i}`],
            action: {
              en: `Inspect node after prev`,
              vi: `Xem node sau prev`,
              code: `if (prev.next.data == value)`,
            },
            annotations: [
              {
                id: `rm-${i}`,
                text: `prev.next → [${nextN.value}]`,
                x: START_X + (i + 0.5) * GAP,
                y: Y - 100,
                kind: match ? "warn" : "info",
                highlighted: true,
              },
            ],
          }),
          codeLines: [8, 9],
          variables: this.vars([
            v("prev", prevN.value, true),
            v("prev.next.data", nextN.value, true),
            v("match?", match, true),
          ]),
        })
      );
      if (match) {
        foundIdx = i + 1;
        break;
      }
      steps.push(
        step({
          type: "assign",
          en: `prev = prev.next → prev = ${nextN.value}`,
          vi: `prev = prev.next → prev = ${nextN.value}`,
          data: this.frame({
            prev: nextN.id,
            highlight: [nextN.id],
            active: nextN.id,
            action: {
              en: `Advance prev`,
              vi: `Tiến prev`,
              code: `prev = prev.next;`,
            },
          }),
          codeLines: [13],
          variables: this.vars([v("prev", nextN.value, true)]),
        })
      );
    }

    if (foundIdx === -1) {
      steps.push(
        step({
          type: "miss",
          en: `${value} not found → return false`,
          vi: `Không thấy ${value} → return false`,
          data: this.frame({
            action: {
              en: `Target missing`,
              vi: `Không có giá trị cần xóa`,
              code: `return false;`,
            },
          }),
          codeLines: [15],
          variables: this.vars([v("return", false, true)]),
        })
      );
      return steps;
    }

    const prevNode = this.nodes[foundIdx - 1];
    const target = this.nodes[foundIdx];
    const after = this.nodes[foundIdx + 1];
    const afterVal = after?.value ?? "null";

    steps.push(
      step({
        type: "unlink",
        en: `prev.next = prev.next.next  → [${prevNode.value}].next = ${afterVal}`,
        vi: `prev.next = prev.next.next  → [${prevNode.value}].next = ${afterVal}`,
        data: this.frame({
          prev: prevNode.id,
          removedId: target.id,
          highlight: [prevNode.id, target.id],
          active: target.id,
          edgeHl: after
            ? [`e-next-${foundIdx}`]
            : ["to-null"],
          pendingEdges: after
            ? [
                {
                  id: "e-skip",
                  from: prevNode.id,
                  to: after.id,
                  type: "next",
                  label: "next ★",
                  highlighted: true,
                  animated: true,
                  dashed: true,
                },
              ]
            : [
                {
                  id: "e-skip-null",
                  from: prevNode.id,
                  to: "null-end",
                  type: "next",
                  label: "next → NULL",
                  highlighted: true,
                  animated: true,
                  dashed: true,
                },
              ],
          action: {
            en: `Bypass removed node in the chain`,
            vi: `Bỏ qua node bị xóa trong chuỗi`,
            code: `prev.next = prev.next.next; // → ${afterVal}`,
          },
          annotations: [
            {
              id: "skip",
              text: `unlink [${value}]`,
              x: START_X + foundIdx * GAP,
              y: Y - 100,
              kind: "warn",
              highlighted: true,
            },
            {
              id: "rewire",
              text: `[${prevNode.value}].next → ${afterVal}`,
              x: START_X + (foundIdx - 0.5) * GAP,
              y: Y + 80,
              kind: "link",
              highlighted: true,
            },
          ],
        }),
        codeLines: [10, 11, 12],
        variables: this.vars([
          v("prev", prevNode.value),
          v("removed", value, true),
          v("prev.next", afterVal, true),
        ]),
        duration: 1300,
      })
    );

    this.nodes.splice(foundIdx, 1);
    steps.push(
      step({
        type: "done",
        en: `Removed ${value}. size = ${this.nodes.length}`,
        vi: `Đã xóa ${value}. size = ${this.nodes.length}`,
        data: this.frame({
          action: {
            en: `Remove complete · return true`,
            vi: `Xóa xong · return true`,
            code: `return true;`,
          },
        }),
        codeLines: [12],
        variables: this.vars([v("return", true, true)], ["size", "list", "tail"]),
      })
    );
    return steps;
  }

  private search(value: number): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: `Call search(${value})`,
        vi: `Gọi search(${value})`,
        data: this.frame({
          action: {
            en: `Enter search(${value})`,
            vi: `Vào hàm search(${value})`,
            code: `search(${value})`,
          },
        }),
        codeLines: [0],
        variables: this.vars([v("value", value, true)]),
      })
    );

    if (this.nodes.length === 0) {
      steps.push(
        step({
          type: "miss",
          en: "head is null → false",
          vi: "head null → false",
          data: this.frame({
            curr: "null",
            action: {
              en: `Empty — not found`,
              vi: `Rỗng — không thấy`,
              code: `return false;`,
            },
          }),
          codeLines: [7],
          variables: this.vars([v("return", false, true)]),
        })
      );
      return steps;
    }

    steps.push(
      step({
        type: "assign",
        en: `curr = head (= ${this.nodes[0].value})`,
        vi: `curr = head (= ${this.nodes[0].value})`,
        data: this.frame({
          curr: this.nodes[0].id,
          highlight: [this.nodes[0].id],
          edgeHl: ["head"],
          action: {
            en: `curr starts at head`,
            vi: `curr bắt đầu tại head`,
            code: `Node curr = head;`,
          },
        }),
        codeLines: [1],
        variables: this.vars([v("curr", this.nodes[0].value, true)]),
      })
    );

    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const match = n.value === value;
      steps.push(
        step({
          type: "check",
          en: `curr.data (${n.value}) == ${value}? → ${match}`,
          vi: `curr.data (${n.value}) == ${value}? → ${match}`,
          data: this.frame({
            curr: n.id,
            highlight: [n.id],
            active: n.id,
            action: {
              en: `Compare curr with target`,
              vi: `So sánh curr với giá trị cần tìm`,
              code: `if (curr.data == value)`,
            },
            annotations: [
              {
                id: `s-${i}`,
                text: `[${n.value}] == ${value} ? ${match}`,
                x: START_X + i * GAP,
                y: Y + 80,
                kind: match ? "link" : "info",
                highlighted: true,
              },
            ],
          }),
          codeLines: [2, 3],
          variables: this.vars([
            v("curr", n.value, true),
            v("match?", match, true),
          ]),
        })
      );
      if (match) {
        steps.push(
          step({
            type: "done",
            en: `Found! return true`,
            vi: `Tìm thấy! return true`,
            data: this.frame({
              curr: n.id,
              highlight: [n.id],
              active: n.id,
              action: {
                en: `Match at node [${value}]`,
                vi: `Khớp tại node [${value}]`,
                code: `return true;`,
              },
            }),
            codeLines: [4],
            variables: this.vars([v("return", true, true)]),
          })
        );
        return steps;
      }
      const nextId = this.nodes[i + 1]?.id;
      steps.push(
        step({
          type: "assign",
          en: `curr = curr.next → ${this.nodes[i + 1]?.value ?? "null"}`,
          vi: `curr = curr.next → ${this.nodes[i + 1]?.value ?? "null"}`,
          data: this.frame({
            curr: nextId ?? "null",
            highlight: nextId ? [nextId] : ["null-end"],
            edgeHl: nextId ? [`e-next-${i}`] : ["to-null"],
            action: {
              en: nextId ? `Advance curr along next` : `curr becomes null`,
              vi: nextId ? `Tiến curr theo next` : `curr thành null`,
              code: `curr = curr.next;`,
            },
          }),
          codeLines: [5],
          variables: this.vars([
            v(
              "curr",
              this.nodes[i + 1]?.value ?? "null",
              true
            ),
          ]),
        })
      );
    }

    steps.push(
      step({
        type: "miss",
        en: "curr == null — not found",
        vi: "curr == null — không thấy",
        data: this.frame({
          curr: "null",
          edgeHl: ["to-null"],
          action: {
            en: `Reached NULL terminator`,
            vi: `Đã tới NULL`,
            code: `return false;`,
          },
          annotations: [
            {
              id: "miss",
              text: "curr → NULL",
              x: START_X + this.nodes.length * GAP,
              y: Y + 70,
              kind: "null",
              highlighted: true,
            },
          ],
        }),
        codeLines: [7],
        variables: this.vars([v("curr", "null", true), v("return", false, true)]),
      })
    );
    return steps;
  }

  private traverse(): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: "Call traverse()",
        vi: "Gọi traverse()",
        data: this.frame({
          action: {
            en: `Walk the structure`,
            vi: `Duyệt cấu trúc`,
            code: `traverse()`,
          },
        }),
        codeLines: [0],
        variables: this.vars(),
      })
    );

    if (this.nodes.length === 0) {
      steps.push(
        step({
          type: "empty",
          en: "Empty — return",
          vi: "Rỗng — return",
          data: this.frame({
            action: {
              en: `Nothing to visit`,
              vi: `Không có gì để thăm`,
              code: `if (empty) return;`,
            },
          }),
          codeLines: [1],
          variables: this.vars(),
        })
      );
      return steps;
    }

    steps.push(
      step({
        type: "assign",
        en: `curr = head (= ${this.nodes[0].value})`,
        vi: `curr = head (= ${this.nodes[0].value})`,
        data: this.frame({
          curr: this.nodes[0].id,
          highlight: [this.nodes[0].id],
          edgeHl: ["head"],
          action: {
            en: `Start at HEAD`,
            vi: `Bắt đầu tại HEAD`,
            code: `curr = head;`,
          },
        }),
        codeLines: [2],
        variables: this.vars([v("curr", this.nodes[0].value, true)]),
      })
    );

    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      steps.push(
        step({
          type: "visit",
          en: `Visit [${n.value}]`,
          vi: `Thăm [${n.value}]`,
          data: this.frame({
            curr: n.id,
            highlight: [n.id],
            active: n.id,
            edgeHl: i > 0 ? [`e-next-${i - 1}`] : ["head"],
            action: {
              en: `Process node [${n.value}]`,
              vi: `Xử lý node [${n.value}]`,
              code: `visit(curr); // ${n.value}`,
            },
            annotations: [
              {
                id: `v-${i}`,
                text: `visit(${n.value})`,
                x: START_X + i * GAP,
                y: Y - 100,
                kind: "assign",
                highlighted: true,
              },
            ],
          }),
          codeLines: [4, 5],
          variables: this.vars([
            v("curr", n.value, true),
            v("visited", n.value, true),
          ]),
        })
      );
    }

    if (this.kind === "circular") {
      steps.push(
        step({
          type: "loop",
          en: "Back to HEAD — one full cycle ⟳",
          vi: "Về HEAD — đủ một vòng ⟳",
          data: this.frame({
            curr: this.nodes[0].id,
            highlight: [this.nodes[0].id],
            edgeHl: ["e-loop"],
            action: {
              en: `Loop edge: last.next → head`,
              vi: `Cạnh vòng: last.next → head`,
              code: `while (curr != head);`,
            },
          }),
          codeLines: [6],
          variables: this.vars([v("backToHead", true, true)]),
        })
      );
    } else {
      steps.push(
        step({
          type: "null",
          en: "curr.next → NULL — end of list",
          vi: "curr.next → NULL — hết list",
          data: this.frame({
            edgeHl: ["to-null"],
            active: "null-end",
            highlight: ["null-end"],
            action: {
              en: `Hit NULL terminator`,
              vi: `Gặp NULL kết thúc`,
              code: `// curr == null → stop`,
            },
          }),
          codeLines: [6],
          variables: this.vars([v("curr", "null", true)]),
        })
      );
    }

    steps.push(
      step({
        type: "done",
        en: "Traversal complete",
        vi: "Duyệt xong",
        data: this.frame({
          action: {
            en: `Done`,
            vi: `Hoàn tất`,
            code: `// done`,
          },
        }),
        codeLines: [7],
        variables: this.vars(),
      })
    );
    return steps;
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
            en: `Clear entire list`,
            vi: `Xóa toàn bộ list`,
            code: `clear()`,
          },
        }),
        codeLines: [0],
        variables: this.vars(),
      })
    );
    this.nodes = [];
    steps.push(
      step({
        type: "assign",
        en: "head = null; size = 0",
        vi: "head = null; size = 0",
        data: this.frame({
          action: {
            en: `All references dropped → NULL`,
            vi: `Mọi tham chiếu về NULL`,
            code: `head = null; size = 0;`,
          },
          annotations: [
            {
              id: "clr",
              text: "head → null",
              x: START_X + 80,
              y: Y + 60,
              kind: "null",
              highlighted: true,
            },
          ],
        }),
        codeLines: [1, 2],
        variables: this.vars([], ["head", "size", "list", "tail"]),
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
    return this.values();
  }

  setValues(values: number[]) {
    this.nodes = values.map((val) => ({ id: nid(), value: val }));
  }
}
