import type { AnimationStep, VisualizationState, VizEdge, VizNode } from "@/types";
import {
  fmtArr,
  mergeVars,
  resetStepCounter,
  step,
  v,
} from "./animation-helpers";

export interface BTNode {
  id: string;
  value: number;
  left: BTNode | null;
  right: BTNode | null;
  balanceFactor?: number;
  height?: number;
}

let idSeq = 0;
function nid() {
  idSeq += 1;
  return `t${idSeq}`;
}

function layout(
  root: BTNode | null,
  highlight: Set<string> = new Set(),
  active?: string,
  showBF = false
): VisualizationState {
  const nodes: VizNode[] = [];
  const edges: VizEdge[] = [];
  if (!root) return { nodes, edges, meta: { empty: true } };

  function place(node: BTNode, depth: number, xMin: number, xMax: number) {
    const x = (xMin + xMax) / 2;
    const y = 50 + depth * 90;
    nodes.push({
      id: node.id,
      value: node.value,
      x,
      y,
      highlighted: highlight.has(node.id),
      active: active === node.id,
      balanceFactor: showBF ? node.balanceFactor : undefined,
      label:
        showBF && node.balanceFactor !== undefined
          ? `bf=${node.balanceFactor}`
          : undefined,
    });
    if (node.left) {
      place(node.left, depth + 1, xMin, x);
      edges.push({
        id: `e-${node.id}-L`,
        from: node.id,
        to: node.left.id,
        type: "left",
        highlighted: highlight.has(node.id) && highlight.has(node.left.id),
      });
    }
    if (node.right) {
      place(node.right, depth + 1, x, xMax);
      edges.push({
        id: `e-${node.id}-R`,
        from: node.id,
        to: node.right.id,
        type: "right",
        highlighted: highlight.has(node.id) && highlight.has(node.right.id),
      });
    }
  }

  place(root, 0, 40, 560);
  return { nodes, edges, meta: { showBF } };
}

export class BinaryTreeEngine {
  root: BTNode | null = null;
  avl: boolean;

  constructor(initial: number[] = [], avl = false) {
    this.avl = avl;
    for (const val of initial) this.insertSilent(val);
  }

  private height(n: BTNode | null): number {
    return n ? n.height ?? 0 : 0;
  }

  private update(n: BTNode) {
    n.height = 1 + Math.max(this.height(n.left), this.height(n.right));
    n.balanceFactor = this.height(n.left) - this.height(n.right);
  }

  private rotateRight(y: BTNode): BTNode {
    const x = y.left!;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    this.update(y);
    this.update(x);
    return x;
  }

  private rotateLeft(x: BTNode): BTNode {
    const y = x.right!;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    this.update(x);
    this.update(y);
    return y;
  }

  private rebalance(node: BTNode): BTNode {
    this.update(node);
    const bf = node.balanceFactor ?? 0;
    if (bf > 1 && (node.left!.balanceFactor ?? 0) >= 0) return this.rotateRight(node);
    if (bf < -1 && (node.right!.balanceFactor ?? 0) <= 0) return this.rotateLeft(node);
    if (bf > 1 && (node.left!.balanceFactor ?? 0) < 0) {
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }
    if (bf < -1 && (node.right!.balanceFactor ?? 0) > 0) {
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }
    return node;
  }

  private insertSilent(value: number) {
    const insertRec = (node: BTNode | null): BTNode => {
      if (!node) {
        return {
          id: nid(),
          value,
          left: null,
          right: null,
          height: 1,
          balanceFactor: 0,
        };
      }
      if (value < node.value) node.left = insertRec(node.left);
      else if (value > node.value) node.right = insertRec(node.right);
      else return node;
      if (this.avl) return this.rebalance(node);
      this.update(node);
      return node;
    };
    this.root = insertRec(this.root);
  }

  private collect(): number[] {
    const vals: number[] = [];
    const walk = (n: BTNode | null) => {
      if (!n) return;
      walk(n.left);
      vals.push(n.value);
      walk(n.right);
    };
    walk(this.root);
    return vals;
  }

  private vars(extra: ReturnType<typeof v>[] = []) {
    return mergeVars(
      [
        v("root", this.root?.value ?? "null"),
        v("inOrder", fmtArr(this.collect())),
        v("avl", this.avl),
      ],
      extra
    );
  }

  snap(hl: string[] = [], active?: string): VisualizationState {
    return layout(this.root, new Set(hl), active, this.avl);
  }

  run(op: string, value?: number): AnimationStep[] {
    resetStepCounter();
    switch (op) {
      case "insert":
        return this.insert(value ?? 0);
      case "delete":
        return this.delete(value ?? 0);
      case "search":
        return this.search(value ?? 0);
      case "preOrder":
        return this.traverse("pre");
      case "inOrder":
        return this.traverse("in");
      case "postOrder":
        return this.traverse("post");
      case "levelOrder":
        return this.levelOrder();
      case "leftRotation":
        return this.demoRotation("left");
      case "rightRotation":
        return this.demoRotation("right");
      case "rebalance":
        return this.showBalanceFactors();
      default:
        return [
          step({
            type: "info",
            en: `Unknown: ${op}`,
            vi: `Không xác định: ${op}`,
            data: this.snap(),
          }),
        ];
    }
  }

  private insert(value: number): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: `Call insert(${value})`,
        vi: `Gọi insert(${value})`,
        data: this.snap(),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public void insert(int value)  // value=${value}`,
        variables: this.vars([v("value", value, true)]),
      })
    );

    const path: string[] = [];
    let curr = this.root;
    let parent: BTNode | null = null;
    let wentLeft = false;

    if (!curr) {
      steps.push(
        step({
          type: "check",
          en: "root == null → create new root",
          vi: "root == null → tạo root mới",
          data: this.snap(),
          codeLines: [1, 2],
          pseudoLines: [1],
          codeSnippet: `if (node == null) return new Node(value);`,
          variables: this.vars([v("root", "null", true), v("value", value)]),
        })
      );
    }

    while (curr) {
      path.push(curr.id);
      const cmp =
        value < curr.value ? "left" : value > curr.value ? "right" : "equal";
      steps.push(
        step({
          type: "compare",
          en: `Compare ${value} with [${curr.value}] → go ${cmp}`,
          vi: `So sánh ${value} với [${curr.value}] → đi ${cmp === "left" ? "trái" : cmp === "right" ? "phải" : "trùng"}`,
          data: this.snap(path, curr.id),
          codeLines: [3, 4, 5],
          pseudoLines: [2, 3, 4],
          codeSnippet:
            cmp === "left"
              ? `if (value < node.data) node.left = insert(left);`
              : cmp === "right"
                ? `else if (value > node.data) node.right = insert(right);`
                : `else return node; // duplicate`,
          variables: this.vars([
            v("value", value),
            v("node.data", curr.value, true),
            v("compare", cmp, true),
          ]),
        })
      );
      if (value === curr.value) {
        steps.push(
          step({
            type: "dup",
            en: `Duplicate ${value} — skip insert`,
            vi: `Trùng ${value} — bỏ qua insert`,
            data: this.snap(path, curr.id),
            codeLines: [6],
            pseudoLines: [4],
            codeSnippet: `return node; // already exists`,
            variables: this.vars([v("inserted", false, true)]),
          })
        );
        return steps;
      }
      parent = curr;
      if (value < curr.value) {
        wentLeft = true;
        curr = curr.left;
      } else {
        wentLeft = false;
        curr = curr.right;
      }
      if (!curr) {
        steps.push(
          step({
            type: "check",
            en: `Reached null on ${wentLeft ? "left" : "right"} of [${parent.value}]`,
            vi: `Gặp null phía ${wentLeft ? "trái" : "phải"} của [${parent.value}]`,
            data: this.snap(path, parent.id),
            codeLines: [2],
            pseudoLines: [1],
            codeSnippet: `if (node == null) return new Node(value);`,
            variables: this.vars([
              v("parent", parent.value),
              v("childSide", wentLeft ? "left" : "right", true),
            ]),
          })
        );
      }
    }

    const newNode: BTNode = {
      id: nid(),
      value,
      left: null,
      right: null,
      height: 1,
      balanceFactor: 0,
    };
    if (!parent) this.root = newNode;
    else if (wentLeft) parent.left = newNode;
    else parent.right = newNode;

    steps.push(
      step({
        type: "insert",
        en: `Create leaf Node(${value}) under ${parent ? `[${parent.value}].${wentLeft ? "left" : "right"}` : "root"}`,
        vi: `Tạo lá Node(${value}) dưới ${parent ? `[${parent.value}].${wentLeft ? "left" : "right"}` : "root"}`,
        data: this.snap([newNode.id], newNode.id),
        codeLines: [2],
        pseudoLines: [5],
        codeSnippet: `return new Node(${value});`,
        variables: this.vars([
          v("newNode", value, true),
          v("parent", parent?.value ?? "null"),
        ]),
        duration: 1000,
      })
    );

    if (this.avl) {
      const rebuild = (n: BTNode | null): BTNode | null => {
        if (!n) return null;
        n.left = rebuild(n.left);
        n.right = rebuild(n.right);
        return this.rebalance(n);
      };
      steps.push(
        step({
          type: "rebalance",
          en: "Update heights & check |BF| > 1 → rotate if needed",
          vi: "Cập nhật height & kiểm tra |BF| > 1 → xoay nếu cần",
          data: this.snap([newNode.id], newNode.id),
          codeLines: [7, 8],
          pseudoLines: [6, 7],
          codeSnippet: `// rebalance: LL/RR/LR/RL rotations`,
          variables: this.vars([v("phase", "rebalance", true)]),
        })
      );
      this.root = rebuild(this.root);
      steps.push(
        step({
          type: "done",
          en: "AVL rebalance complete",
          vi: "Cân bằng AVL xong",
          data: this.snap(),
          codeLines: [8],
          pseudoLines: [8],
          codeSnippet: `return rebalanced node;`,
          variables: this.vars([v("inserted", value, true)]),
        })
      );
    } else {
      const updateAll = (n: BTNode | null) => {
        if (!n) return;
        updateAll(n.left);
        updateAll(n.right);
        this.update(n);
      };
      updateAll(this.root);
      steps.push(
        step({
          type: "done",
          en: `insert(${value}) complete`,
          vi: `insert(${value}) hoàn tất`,
          data: this.snap(),
          codeLines: [7],
          pseudoLines: [5],
          codeSnippet: `return node;`,
          variables: this.vars([v("inserted", value, true)]),
        })
      );
    }
    return steps;
  }

  private minNode(n: BTNode): BTNode {
    while (n.left) n = n.left;
    return n;
  }

  private delete(value: number): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: `Call delete(${value})`,
        vi: `Gọi delete(${value})`,
        data: this.snap(),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public void delete(int value)`,
        variables: this.vars([v("value", value, true)]),
      })
    );

    let found = false;
    const deleteRec = (node: BTNode | null): BTNode | null => {
      if (!node) return null;
      if (value < node.value) {
        steps.push(
          step({
            type: "compare",
            en: `${value} < [${node.value}] → go left`,
            vi: `${value} < [${node.value}] → sang trái`,
            data: this.snap([node.id], node.id),
            codeLines: [2, 3],
            pseudoLines: [1],
            codeSnippet: `if (value < node.data) node.left = delete(left);`,
            variables: this.vars([
              v("value", value),
              v("node", node.value, true),
              v("branch", "left", true),
            ]),
          })
        );
        node.left = deleteRec(node.left);
      } else if (value > node.value) {
        steps.push(
          step({
            type: "compare",
            en: `${value} > [${node.value}] → go right`,
            vi: `${value} > [${node.value}] → sang phải`,
            data: this.snap([node.id], node.id),
            codeLines: [2, 3],
            pseudoLines: [1],
            codeSnippet: `else if (value > node.data) node.right = delete(right);`,
            variables: this.vars([
              v("value", value),
              v("node", node.value, true),
              v("branch", "right", true),
            ]),
          })
        );
        node.right = deleteRec(node.right);
      } else {
        found = true;
        steps.push(
          step({
            type: "found",
            en: `Found [${value}] — determine delete case`,
            vi: `Tìm thấy [${value}] — xác định trường hợp xóa`,
            data: this.snap([node.id], node.id),
            codeLines: [4],
            pseudoLines: [2],
            codeSnippet: `// found node to delete`,
            variables: this.vars([
              v("node", value, true),
              v(
                "case",
                !node.left && !node.right
                  ? "leaf"
                  : !node.left || !node.right
                    ? "one-child"
                    : "two-children",
                true
              ),
            ]),
          })
        );
        if (!node.left && !node.right) {
          steps.push(
            step({
              type: "case",
              en: "Case 0 children: remove leaf → return null",
              vi: "TH 0 con: xóa lá → return null",
              data: this.snap([node.id], node.id),
              codeLines: [5],
              pseudoLines: [3],
              codeSnippet: `return null; // leaf`,
              variables: this.vars([v("result", "null", true)]),
            })
          );
          return null;
        }
        if (!node.left) {
          steps.push(
            step({
              type: "case",
              en: `Case 1 child (right): replace with [${node.right!.value}]`,
              vi: `TH 1 con (phải): thay bằng [${node.right!.value}]`,
              data: this.snap([node.id, node.right!.id], node.right!.id),
              codeLines: [6],
              pseudoLines: [4],
              codeSnippet: `return node.right;`,
              variables: this.vars([v("replaceWith", node.right!.value, true)]),
            })
          );
          return node.right;
        }
        if (!node.right) {
          steps.push(
            step({
              type: "case",
              en: `Case 1 child (left): replace with [${node.left.value}]`,
              vi: `TH 1 con (trái): thay bằng [${node.left.value}]`,
              data: this.snap([node.id, node.left.id], node.left.id),
              codeLines: [6],
              pseudoLines: [4],
              codeSnippet: `return node.left;`,
              variables: this.vars([v("replaceWith", node.left.value, true)]),
            })
          );
          return node.left;
        }
        const succ = this.minNode(node.right);
        steps.push(
          step({
            type: "successor",
            en: `Case 2 children: inorder successor = [${succ.value}]`,
            vi: `TH 2 con: successor trung tố = [${succ.value}]`,
            data: this.snap([node.id, succ.id], succ.id),
            codeLines: [7, 8],
            pseudoLines: [5],
            codeSnippet: `int succ = min(node.right); node.data = succ;`,
            variables: this.vars([
              v("node", node.value),
              v("successor", succ.value, true),
            ]),
          })
        );
        node.value = succ.value;
        const target = succ.value;
        const delMin = (n: BTNode | null): BTNode | null => {
          if (!n) return null;
          if (target < n.value) n.left = delMin(n.left);
          else if (target > n.value) n.right = delMin(n.right);
          else {
            if (!n.left) return n.right;
            if (!n.right) return n.left;
          }
          if (this.avl) return this.rebalance(n);
          this.update(n);
          return n;
        };
        node.right = delMin(node.right);
        steps.push(
          step({
            type: "assign",
            en: `node.data = ${succ.value}; delete successor leaf`,
            vi: `node.data = ${succ.value}; xóa successor`,
            data: this.snap([node.id], node.id),
            codeLines: [8, 9],
            pseudoLines: [5],
            codeSnippet: `node.right = delete(node.right, succ);`,
            variables: this.vars([v("node.data", succ.value, true)]),
          })
        );
      }
      if (this.avl && node) return this.rebalance(node);
      if (node) this.update(node);
      return node;
    };

    this.root = deleteRec(this.root);
    steps.push(
      step({
        type: found ? "done" : "miss",
        en: found ? `delete(${value}) complete` : `${value} not found`,
        vi: found ? `delete(${value}) xong` : `Không tìm thấy ${value}`,
        data: this.snap(),
        codeLines: [10],
        pseudoLines: [6],
        codeSnippet: found ? `// deleted` : `// not found`,
        variables: this.vars([v("found", found, true)]),
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
        data: this.snap(),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public boolean search(int value)`,
        variables: this.vars([v("value", value, true)]),
      })
    );

    steps.push(
      step({
        type: "assign",
        en: `curr = root (= ${this.root?.value ?? "null"})`,
        vi: `curr = root (= ${this.root?.value ?? "null"})`,
        data: this.snap(
          this.root ? [this.root.id] : [],
          this.root?.id
        ),
        codeLines: [1],
        pseudoLines: [1],
        codeSnippet: `Node curr = root;`,
        variables: this.vars([v("curr", this.root?.value ?? "null", true)]),
      })
    );

    let curr = this.root;
    const path: string[] = [];
    while (curr) {
      path.push(curr.id);
      if (value === curr.value) {
        steps.push(
          step({
            type: "found",
            en: `curr.data == ${value} → return true`,
            vi: `curr.data == ${value} → return true`,
            data: this.snap(path, curr.id),
            codeLines: [3],
            pseudoLines: [3],
            codeSnippet: `if (value == curr.data) return true;`,
            variables: this.vars([
              v("curr", curr.value, true),
              v("return", true, true),
            ]),
          })
        );
        return steps;
      }
      const dir = value < curr.value ? "left" : "right";
      steps.push(
        step({
          type: "compare",
          en: `${value} ${value < curr.value ? "<" : ">"} [${curr.value}] → ${dir}`,
          vi: `${value} ${value < curr.value ? "<" : ">"} [${curr.value}] → ${dir === "left" ? "trái" : "phải"}`,
          data: this.snap(path, curr.id),
          codeLines: [4],
          pseudoLines: [4, 5],
          codeSnippet: `curr = value < curr.data ? curr.left : curr.right;`,
          variables: this.vars([
            v("curr", curr.value, true),
            v("next", dir, true),
          ]),
        })
      );
      curr = value < curr.value ? curr.left : curr.right;
    }

    steps.push(
      step({
        type: "miss",
        en: "curr == null → return false",
        vi: "curr == null → return false",
        data: this.snap(path),
        codeLines: [6],
        pseudoLines: [6],
        codeSnippet: `return false;`,
        variables: this.vars([v("curr", "null", true), v("return", false, true)]),
      })
    );
    return steps;
  }

  private traverse(order: "pre" | "in" | "post"): AnimationStep[] {
    const steps: AnimationStep[] = [];
    const label =
      order === "pre" ? "preOrder" : order === "in" ? "inOrder" : "postOrder";
    const pattern =
      order === "pre"
        ? "Root → Left → Right"
        : order === "in"
          ? "Left → Root → Right"
          : "Left → Right → Root";

    steps.push(
      step({
        type: "call",
        en: `Call ${label}() — ${pattern}`,
        vi: `Gọi ${label}() — ${pattern}`,
        data: this.snap(),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public void ${label}(Node node)`,
        variables: this.vars([v("order", pattern, true)]),
      })
    );

    const visitOrder: number[] = [];
    const walk = (n: BTNode | null) => {
      if (!n) return;
      if (order === "pre") {
        visitOrder.push(n.value);
        steps.push(
          step({
            type: "visit",
            en: `Visit [${n.value}] (Root first)`,
            vi: `Thăm [${n.value}] (Root trước)`,
            data: this.snap([n.id], n.id),
            codeLines: [2],
            pseudoLines: [2],
            codeSnippet: `visit(node); // ${n.value}`,
            variables: this.vars([
              v("visited", n.value, true),
              v("sequence", fmtArr(visitOrder), true),
            ]),
          })
        );
      }
      walk(n.left);
      if (order === "in") {
        visitOrder.push(n.value);
        steps.push(
          step({
            type: "visit",
            en: `Visit [${n.value}] (after left)`,
            vi: `Thăm [${n.value}] (sau nhánh trái)`,
            data: this.snap([n.id], n.id),
            codeLines: [3],
            pseudoLines: [3],
            codeSnippet: `visit(node); // ${n.value}`,
            variables: this.vars([
              v("visited", n.value, true),
              v("sequence", fmtArr(visitOrder), true),
            ]),
          })
        );
      }
      walk(n.right);
      if (order === "post") {
        visitOrder.push(n.value);
        steps.push(
          step({
            type: "visit",
            en: `Visit [${n.value}] (after both children)`,
            vi: `Thăm [${n.value}] (sau hai con)`,
            data: this.snap([n.id], n.id),
            codeLines: [4],
            pseudoLines: [4],
            codeSnippet: `visit(node); // ${n.value}`,
            variables: this.vars([
              v("visited", n.value, true),
              v("sequence", fmtArr(visitOrder), true),
            ]),
          })
        );
      }
    };
    walk(this.root);

    steps.push(
      step({
        type: "done",
        en: `${label} → [${visitOrder.join(", ")}]`,
        vi: `${label} → [${visitOrder.join(", ")}]`,
        data: this.snap(),
        codeLines: [5],
        pseudoLines: [5],
        codeSnippet: `// complete`,
        variables: this.vars([v("result", fmtArr(visitOrder), true)]),
      })
    );
    return steps;
  }

  private levelOrder(): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: "Call levelOrder() — BFS with queue",
        vi: "Gọi levelOrder() — BFS dùng queue",
        data: this.snap(),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public void levelOrder()`,
        variables: this.vars(),
      })
    );
    if (!this.root) {
      steps.push(
        step({
          type: "empty",
          en: "Tree empty",
          vi: "Cây rỗng",
          data: this.snap(),
          codeLines: [1],
          variables: this.vars([v("root", "null", true)]),
        })
      );
      return steps;
    }

    steps.push(
      step({
        type: "assign",
        en: `queue.enqueue(root=${this.root.value})`,
        vi: `queue.enqueue(root=${this.root.value})`,
        data: this.snap([this.root.id], this.root.id),
        codeLines: [1, 2],
        pseudoLines: [1],
        codeSnippet: `q.add(root);`,
        variables: this.vars([v("queue", `[${this.root.value}]`, true)]),
      })
    );

    const q: BTNode[] = [this.root];
    const order: number[] = [];
    while (q.length) {
      const n = q.shift()!;
      order.push(n.value);
      const children: number[] = [];
      if (n.left) {
        q.push(n.left);
        children.push(n.left.value);
      }
      if (n.right) {
        q.push(n.right);
        children.push(n.right.value);
      }
      steps.push(
        step({
          type: "visit",
          en: `Dequeue [${n.value}]; enqueue children ${fmtArr(children)}`,
          vi: `Lấy [${n.value}]; enqueue con ${fmtArr(children)}`,
          data: this.snap([n.id], n.id),
          codeLines: [4, 5, 6, 7],
          pseudoLines: [3, 4, 5],
          codeSnippet: `visit(${n.value}); enqueue left/right;`,
          variables: this.vars([
            v("dequeued", n.value, true),
            v("queue", fmtArr(q.map((x) => x.value)), true),
            v("order", fmtArr(order), true),
          ]),
        })
      );
    }

    steps.push(
      step({
        type: "done",
        en: `levelOrder → [${order.join(", ")}]`,
        vi: `levelOrder → [${order.join(", ")}]`,
        data: this.snap(),
        codeLines: [8],
        variables: this.vars([v("result", fmtArr(order), true)]),
      })
    );
    return steps;
  }

  private demoRotation(dir: "left" | "right"): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: `${dir === "left" ? "Left" : "Right"} rotation demo`,
        vi: `Demo xoay ${dir === "left" ? "trái" : "phải"}`,
        data: this.snap(),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `private Node ${dir}Rotate(Node y)`,
        variables: this.vars([v("dir", dir, true)]),
      })
    );
    if (!this.root) {
      steps.push(
        step({
          type: "empty",
          en: "Empty tree",
          vi: "Cây rỗng",
          data: this.snap(),
          variables: this.vars(),
        })
      );
      return steps;
    }
    steps.push(
      step({
        type: "before",
        en: `Before: root = [${this.root.value}]`,
        vi: `Trước xoay: root = [${this.root.value}]`,
        data: this.snap([this.root.id], this.root.id),
        codeLines: [1, 2],
        variables: this.vars([v("y", this.root.value, true)]),
      })
    );
    if (dir === "left" && this.root.right) {
      const y = this.root.value;
      const x = this.root.right.value;
      this.root = this.rotateLeft(this.root);
      steps.push(
        step({
          type: "rotate",
          en: `LEFT: x=${x} promoted; y=${y} becomes left child`,
          vi: `XOAY TRÁI: x=${x} lên; y=${y} thành con trái`,
          data: this.snap([this.root.id], this.root.id),
          codeLines: [2, 3, 4, 5],
          pseudoLines: [1, 2, 3],
          codeSnippet: `x = y.right; y.right = x.left; x.left = y;`,
          variables: this.vars([
            v("x", x, true),
            v("y", y, true),
            v("newRoot", this.root.value, true),
          ]),
        })
      );
    } else if (dir === "right" && this.root.left) {
      const y = this.root.value;
      const x = this.root.left.value;
      this.root = this.rotateRight(this.root);
      steps.push(
        step({
          type: "rotate",
          en: `RIGHT: x=${x} promoted; y=${y} becomes right child`,
          vi: `XOAY PHẢI: x=${x} lên; y=${y} thành con phải`,
          data: this.snap([this.root.id], this.root.id),
          codeLines: [2, 3, 4, 5],
          pseudoLines: [1, 2, 3],
          codeSnippet: `x = y.left; y.left = x.right; x.right = y;`,
          variables: this.vars([
            v("x", x, true),
            v("y", y, true),
            v("newRoot", this.root.value, true),
          ]),
        })
      );
    } else {
      steps.push(
        step({
          type: "skip",
          en: `Cannot ${dir}-rotate — missing child`,
          vi: `Không xoay ${dir} được — thiếu con`,
          data: this.snap(),
          codeLines: [1],
          variables: this.vars([v("ok", false, true)]),
        })
      );
    }
    steps.push(
      step({
        type: "done",
        en: "Rotation demo complete",
        vi: "Demo xoay xong",
        data: this.snap(),
        codeLines: [6],
        variables: this.vars(),
      })
    );
    return steps;
  }

  private showBalanceFactors(): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: "Show balance factors on all nodes",
        vi: "Hiển thị hệ số cân bằng mọi node",
        data: this.snap(),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `private Node rebalance(Node node)`,
        variables: this.vars(),
      })
    );
    const visit = (n: BTNode | null) => {
      if (!n) return;
      this.update(n);
      steps.push(
        step({
          type: "bf",
          en: `Node [${n.value}] BF = height(L)-height(R) = ${n.balanceFactor}`,
          vi: `Node [${n.value}] BF = height(L)-height(R) = ${n.balanceFactor}`,
          data: this.snap([n.id], n.id),
          codeLines: [1],
          pseudoLines: [1],
          codeSnippet: `int bf = height(left) - height(right); // ${n.balanceFactor}`,
          variables: this.vars([
            v("node", n.value, true),
            v("BF", n.balanceFactor ?? 0, true),
            v("hL", this.height(n.left)),
            v("hR", this.height(n.right)),
          ]),
        })
      );
      visit(n.left);
      visit(n.right);
    };
    visit(this.root);
    if (this.avl && this.root) {
      const rebuild = (n: BTNode | null): BTNode | null => {
        if (!n) return null;
        n.left = rebuild(n.left);
        n.right = rebuild(n.right);
        return this.rebalance(n);
      };
      this.root = rebuild(this.root);
      steps.push(
        step({
          type: "rebalance",
          en: "Apply rotations where |BF| > 1",
          vi: "Áp dụng xoay khi |BF| > 1",
          data: this.snap(),
          codeLines: [2, 3, 4, 5],
          pseudoLines: [2],
          codeSnippet: `// LL / RR / LR / RL`,
          variables: this.vars([v("rebalanced", true, true)]),
        })
      );
    }
    steps.push(
      step({
        type: "done",
        en: "Balance check complete",
        vi: "Kiểm tra cân bằng xong",
        data: this.snap(),
        variables: this.vars(),
      })
    );
    return steps;
  }

  currentState(): VisualizationState {
    return this.snap();
  }

  getValues(): number[] {
    return this.collect();
  }

  setValues(values: number[]) {
    this.root = null;
    for (const val of values) this.insertSilent(val);
  }
}
