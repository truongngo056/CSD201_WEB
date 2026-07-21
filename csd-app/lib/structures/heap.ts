import type { AnimationStep, VisualizationState, VizEdge, VizNode } from "@/types";
import {
  fmtArr,
  mergeVars,
  resetStepCounter,
  step,
  v,
} from "./animation-helpers";

export type HeapMode = "max" | "min";

export class HeapEngine {
  data: number[] = [];
  mode: HeapMode = "max";

  constructor(initial: number[] = [], mode: HeapMode = "max") {
    this.mode = mode;
    this.data = [...initial];
    this.buildSilent();
  }

  private better(a: number, b: number) {
    return this.mode === "max" ? a > b : a < b;
  }

  private parent(i: number) {
    return Math.floor((i - 1) / 2);
  }
  private left(i: number) {
    return 2 * i + 1;
  }
  private right(i: number) {
    return 2 * i + 2;
  }

  private buildSilent() {
    for (let i = Math.floor(this.data.length / 2) - 1; i >= 0; i--) {
      this.heapifyDownSilent(i);
    }
  }

  private heapifyDownSilent(i: number) {
    const n = this.data.length;
    while (true) {
      let best = i;
      const l = this.left(i);
      const r = this.right(i);
      if (l < n && this.better(this.data[l], this.data[best])) best = l;
      if (r < n && this.better(this.data[r], this.data[best])) best = r;
      if (best === i) break;
      [this.data[i], this.data[best]] = [this.data[best], this.data[i]];
      i = best;
    }
  }

  private vars(extra: ReturnType<typeof v>[] = [], changed: string[] = []) {
    return mergeVars(
      [
        v("mode", this.mode, changed.includes("mode")),
        v("size", this.data.length, changed.includes("size")),
        v("heap[]", fmtArr(this.data), changed.includes("heap")),
        v("root", this.data[0] ?? "null", changed.includes("root")),
      ],
      extra
    );
  }

  snapshot(highlight: number[] = [], active?: number): VisualizationState {
    const nodes: VizNode[] = [];
    const edges: VizEdge[] = [];
    const n = this.data.length;
    if (n === 0) return { nodes, edges, meta: { mode: this.mode, size: 0 } };

    const width = 560;
    for (let i = 0; i < n; i++) {
      const d = Math.floor(Math.log2(i + 1));
      const levelCount = 2 ** d;
      const indexInLevel = i - (levelCount - 1);
      const cell = width / levelCount;
      const x = cell * indexInLevel + cell / 2 + 20;
      const y = 40 + d * 90;
      nodes.push({
        id: `h${i}`,
        value: this.data[i],
        x,
        y,
        highlighted: highlight.includes(i),
        active: active === i,
        label: i === 0 ? (this.mode === "max" ? "MAX" : "MIN") : undefined,
      });
      const l = this.left(i);
      const r = this.right(i);
      if (l < n) {
        edges.push({
          id: `e${i}-${l}`,
          from: `h${i}`,
          to: `h${l}`,
          type: "left",
          highlighted: highlight.includes(i) && highlight.includes(l),
        });
      }
      if (r < n) {
        edges.push({
          id: `e${i}-${r}`,
          from: `h${i}`,
          to: `h${r}`,
          type: "right",
          highlighted: highlight.includes(i) && highlight.includes(r),
        });
      }
    }
    return {
      nodes,
      edges,
      meta: { mode: this.mode, size: n, array: [...this.data] },
    };
  }

  run(op: string, value?: number): AnimationStep[] {
    resetStepCounter();
    switch (op) {
      case "insert":
        return this.insert(value ?? 0);
      case "extractMax":
        return this.extract("max");
      case "extractMin":
        return this.extract("min");
      case "heapify":
        return this.heapifyDemo();
      case "buildHeap":
        return this.buildHeap();
      case "heapSort":
        return this.heapSort();
      case "toggleMode":
        return this.toggleMode();
      default:
        return [
          step({
            type: "info",
            en: `Unknown: ${op}`,
            vi: `Không xác định: ${op}`,
            data: this.snapshot(),
          }),
        ];
    }
  }

  private insert(value: number): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: `Call insert(${value}) — append then bubbleUp`,
        vi: `Gọi insert(${value}) — thêm cuối rồi bubbleUp`,
        data: this.snapshot(),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public void insert(int value)  // value=${value}`,
        variables: this.vars([v("value", value, true)]),
      })
    );

    this.data.push(value);
    let i = this.data.length - 1;
    steps.push(
      step({
        type: "append",
        en: `heap.add(${value}) at index ${i}`,
        vi: `heap.add(${value}) tại chỉ số ${i}`,
        data: this.snapshot([i], i),
        codeLines: [1],
        pseudoLines: [1],
        codeSnippet: `heap.add(value); // index ${i}`,
        variables: this.vars(
          [v("i", i, true), v("value", value)],
          ["size", "heap"]
        ),
      })
    );

    steps.push(
      step({
        type: "call",
        en: `bubbleUp(${i})`,
        vi: `bubbleUp(${i})`,
        data: this.snapshot([i], i),
        codeLines: [2],
        pseudoLines: [2],
        codeSnippet: `bubbleUp(heap.size() - 1);`,
        variables: this.vars([v("i", i, true)]),
      })
    );

    while (i > 0) {
      const p = this.parent(i);
      steps.push(
        step({
          type: "compare",
          en: `Compare child heap[${i}]=${this.data[i]} with parent heap[${p}]=${this.data[p]}`,
          vi: `So sánh con heap[${i}]=${this.data[i]} với cha heap[${p}]=${this.data[p]}`,
          data: this.snapshot([i, p], i),
          codeLines: [5, 6, 7],
          pseudoLines: [3, 4],
          codeSnippet: `if (heap[i] ${this.mode === "max" ? "<=" : ">="} heap[p]) break;`,
          variables: this.vars([
            v("i", i, true),
            v("p", p, true),
            v("heap[i]", this.data[i]),
            v("heap[p]", this.data[p]),
            v("shouldSwap", this.better(this.data[i], this.data[p]), true),
          ]),
        })
      );
      if (!this.better(this.data[i], this.data[p])) {
        steps.push(
          step({
            type: "stop",
            en: "Heap property OK — stop bubble up",
            vi: "Đủ tính chất heap — dừng bubble up",
            data: this.snapshot([i], i),
            codeLines: [7],
            pseudoLines: [4],
            codeSnippet: `break;`,
            variables: this.vars([v("i", i)]),
          })
        );
        break;
      }
      steps.push(
        step({
          type: "swap",
          en: `Swap heap[${i}]↔heap[${p}]: ${this.data[i]} ↔ ${this.data[p]}`,
          vi: `Đổi heap[${i}]↔heap[${p}]: ${this.data[i]} ↔ ${this.data[p]}`,
          data: this.snapshot([i, p], p),
          codeLines: [8, 9],
          pseudoLines: [5, 6],
          codeSnippet: `swap(i, p); i = p;`,
          variables: this.vars(
            [
              v("swap", `${this.data[i]} ↔ ${this.data[p]}`, true),
              v("i→", p, true),
            ],
            ["heap", "root"]
          ),
          duration: 1000,
        })
      );
      [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
      i = p;
      steps.push(
        step({
          type: "moved",
          en: `After swap: value at index ${i}`,
          vi: `Sau swap: giá trị ở chỉ số ${i}`,
          data: this.snapshot([i], i),
          codeLines: [9],
          codeSnippet: `i = p; // i=${i}`,
          variables: this.vars([v("i", i, true)], ["heap", "root"]),
        })
      );
    }

    steps.push(
      step({
        type: "done",
        en: `insert(${value}) complete`,
        vi: `insert(${value}) xong`,
        data: this.snapshot([0]),
        codeLines: [3],
        variables: this.vars([v("inserted", value, true)]),
      })
    );
    return steps;
  }

  private extract(want: "max" | "min"): AnimationStep[] {
    const steps: AnimationStep[] = [];
    const label = want === "max" ? "extractMax" : "extractMin";

    if (this.mode !== want) {
      steps.push(
        step({
          type: "warn",
          en: `Switch mode ${this.mode} → ${want} first`,
          vi: `Chuyển mode ${this.mode} → ${want} trước`,
          data: this.snapshot(),
          codeLines: [0],
          variables: this.vars([v("mode", this.mode)]),
        })
      );
      this.mode = want;
      this.buildSilent();
    }

    steps.push(
      step({
        type: "call",
        en: `Call ${label}()`,
        vi: `Gọi ${label}()`,
        data: this.snapshot([0], 0),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public int ${label}()`,
        variables: this.vars(),
      })
    );

    if (this.data.length === 0) {
      steps.push(
        step({
          type: "empty",
          en: "Heap empty",
          vi: "Heap rỗng",
          data: this.snapshot(),
          codeLines: [1],
          variables: this.vars([v("size", 0, true)]),
        })
      );
      return steps;
    }

    const root = this.data[0];
    steps.push(
      step({
        type: "read",
        en: `max/min = heap[0] = ${root}`,
        vi: `cực trị = heap[0] = ${root}`,
        data: this.snapshot([0], 0),
        codeLines: [1],
        pseudoLines: [1],
        codeSnippet: `int extreme = heap.get(0); // ${root}`,
        variables: this.vars([v("extreme", root, true)]),
      })
    );

    const last = this.data.pop()!;
    if (this.data.length === 0) {
      steps.push(
        step({
          type: "done",
          en: `${label} → ${root}. Heap empty`,
          vi: `${label} → ${root}. Heap rỗng`,
          data: this.snapshot(),
          codeLines: [2],
          variables: this.vars([v("return", root, true)], ["size", "heap", "root"]),
        })
      );
      return steps;
    }

    this.data[0] = last;
    steps.push(
      step({
        type: "replace",
        en: `Move last (${last}) to root; remove last slot`,
        vi: `Đưa phần tử cuối (${last}) lên root; xóa slot cuối`,
        data: this.snapshot([0], 0),
        codeLines: [2, 3, 4],
        pseudoLines: [2, 3],
        codeSnippet: `heap.set(0, last); bubbleDown(0);`,
        variables: this.vars(
          [v("heap[0]", last, true), v("extreme", root)],
          ["size", "heap", "root"]
        ),
      })
    );

    let i = 0;
    const n = this.data.length;
    while (true) {
      let best = i;
      const l = this.left(i);
      const r = this.right(i);
      if (l < n && this.better(this.data[l], this.data[best])) best = l;
      if (r < n && this.better(this.data[r], this.data[best])) best = r;
      const hl = [i];
      if (l < n) hl.push(l);
      if (r < n) hl.push(r);
      steps.push(
        step({
          type: "compare",
          en: `Heapify i=${i}: best child index = ${best}`,
          vi: `Heapify i=${i}: chỉ số con tốt nhất = ${best}`,
          data: this.snapshot(hl, i),
          codeLines: [5, 6, 7],
          pseudoLines: [4, 5],
          codeSnippet: `find best among i, left, right`,
          variables: this.vars([
            v("i", i, true),
            v("left", l < n ? this.data[l] : "—"),
            v("right", r < n ? this.data[r] : "—"),
            v("best", best, true),
          ]),
        })
      );
      if (best === i) {
        steps.push(
          step({
            type: "stop",
            en: "Heap property restored",
            vi: "Đã khôi phục tính chất heap",
            data: this.snapshot([i], i),
            codeLines: [8],
            codeSnippet: `// stop bubble down`,
            variables: this.vars([v("i", i)]),
          })
        );
        break;
      }
      steps.push(
        step({
          type: "swap",
          en: `Bubble down: swap ${this.data[i]} ↔ ${this.data[best]}`,
          vi: `Bubble down: đổi ${this.data[i]} ↔ ${this.data[best]}`,
          data: this.snapshot([i, best], best),
          codeLines: [9, 10],
          pseudoLines: [6, 7],
          codeSnippet: `swap(i, best); i = best;`,
          variables: this.vars(
            [v("swap", `${this.data[i]}↔${this.data[best]}`, true)],
            ["heap", "root"]
          ),
          duration: 1000,
        })
      );
      [this.data[i], this.data[best]] = [this.data[best], this.data[i]];
      i = best;
    }

    steps.push(
      step({
        type: "done",
        en: `${label} → ${root}`,
        vi: `${label} → ${root}`,
        data: this.snapshot([0]),
        codeLines: [11],
        pseudoLines: [8],
        codeSnippet: `return ${root};`,
        variables: this.vars([v("return", root, true)]),
      })
    );
    return steps;
  }

  private heapifyDemo(): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: "heapify(0) from root",
        vi: "heapify(0) từ root",
        data: this.snapshot([0], 0),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public void heapify(int i)`,
        variables: this.vars([v("i", 0, true)]),
      })
    );
    if (!this.data.length) {
      steps.push(
        step({
          type: "empty",
          en: "Empty",
          vi: "Rỗng",
          data: this.snapshot(),
          variables: this.vars(),
        })
      );
      return steps;
    }
    let i = 0;
    const n = this.data.length;
    while (true) {
      let best = i;
      const l = this.left(i);
      const r = this.right(i);
      if (l < n && this.better(this.data[l], this.data[best])) best = l;
      if (r < n && this.better(this.data[r], this.data[best])) best = r;
      steps.push(
        step({
          type: "compare",
          en: `At i=${i}, largest/smallest index = ${best}`,
          vi: `Tại i=${i}, chỉ số tốt nhất = ${best}`,
          data: this.snapshot([i, best], i),
          codeLines: [1, 2, 3, 4],
          codeSnippet: `int best = i; // then check left/right`,
          variables: this.vars([
            v("i", i, true),
            v("best", best, true),
            v("heap[i]", this.data[i]),
          ]),
        })
      );
      if (best === i) break;
      [this.data[i], this.data[best]] = [this.data[best], this.data[i]];
      steps.push(
        step({
          type: "swap",
          en: `swap(${i}, ${best})`,
          vi: `swap(${i}, ${best})`,
          data: this.snapshot([best], best),
          codeLines: [5, 6],
          codeSnippet: `swap(i, best); heapify(best);`,
          variables: this.vars([], ["heap", "root"]),
        })
      );
      i = best;
    }
    steps.push(
      step({
        type: "done",
        en: "heapify complete",
        vi: "heapify xong",
        data: this.snapshot(),
        variables: this.vars(),
      })
    );
    return steps;
  }

  private buildHeap(): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: "buildHeap() — bottom-up O(n)",
        vi: "buildHeap() — từ dưới lên O(n)",
        data: this.snapshot(),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public void buildHeap()`,
        variables: this.vars(),
      })
    );
    const start = Math.floor(this.data.length / 2) - 1;
    steps.push(
      step({
        type: "assign",
        en: `Start from last non-leaf i = ⌊n/2⌋-1 = ${start}`,
        vi: `Bắt đầu từ non-leaf cuối i = ⌊n/2⌋-1 = ${start}`,
        data: this.snapshot(start >= 0 ? [start] : []),
        codeLines: [3],
        pseudoLines: [2],
        codeSnippet: `for (int i = size/2 - 1; i >= 0; i--)`,
        variables: this.vars([v("start_i", start, true)]),
      })
    );
    for (let i = start; i >= 0; i--) {
      steps.push(
        step({
          type: "heapify",
          en: `heapify(${i}) value=${this.data[i]}`,
          vi: `heapify(${i}) giá trị=${this.data[i]}`,
          data: this.snapshot([i], i),
          codeLines: [4],
          pseudoLines: [3],
          codeSnippet: `heapify(${i});`,
          variables: this.vars([
            v("i", i, true),
            v("heap[i]", this.data[i]),
          ]),
        })
      );
      this.heapifyDownSilent(i);
      steps.push(
        step({
          type: "after",
          en: `After heapify(${i})`,
          vi: `Sau heapify(${i})`,
          data: this.snapshot([i]),
          codeLines: [4],
          variables: this.vars([], ["heap", "root"]),
        })
      );
    }
    steps.push(
      step({
        type: "done",
        en: "buildHeap complete",
        vi: "buildHeap xong",
        data: this.snapshot([0], 0),
        variables: this.vars(),
      })
    );
    return steps;
  }

  private heapSort(): AnimationStep[] {
    const steps: AnimationStep[] = [];
    steps.push(
      step({
        type: "call",
        en: "heapSort() — extract max repeatedly",
        vi: "heapSort() — lấy max lặp lại",
        data: this.snapshot(),
        codeLines: [0],
        pseudoLines: [0],
        codeSnippet: `public void heapSort()`,
        variables: this.vars(),
      })
    );
    this.mode = "max";
    this.buildSilent();
    steps.push(
      step({
        type: "build",
        en: "Phase 1: BUILD_MAX_HEAP",
        vi: "Giai đoạn 1: BUILD_MAX_HEAP",
        data: this.snapshot([0]),
        codeLines: [1],
        pseudoLines: [1],
        codeSnippet: `buildHeap();`,
        variables: this.vars([], ["mode", "heap", "root"]),
      })
    );

    const original = [...this.data];
    const n = this.data.length;
    for (let end = n - 1; end > 0; end--) {
      steps.push(
        step({
          type: "swap",
          en: `Swap root[${this.data[0]}] with heap[${end}]=${this.data[end]}`,
          vi: `Đổi root[${this.data[0]}] với heap[${end}]=${this.data[end]}`,
          data: this.snapshot([0, end], 0),
          codeLines: [3, 4],
          pseudoLines: [3],
          codeSnippet: `swap(0, ${end});`,
          variables: this.vars([
            v("end", end, true),
            v("sortedPart", this.data[0], true),
          ]),
        })
      );
      [this.data[0], this.data[end]] = [this.data[end], this.data[0]];
      const heapSize = end;
      let i = 0;
      while (true) {
        let best = i;
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        if (l < heapSize && this.data[l] > this.data[best]) best = l;
        if (r < heapSize && this.data[r] > this.data[best]) best = r;
        if (best === i) break;
        [this.data[i], this.data[best]] = [this.data[best], this.data[i]];
        i = best;
      }
      steps.push(
        step({
          type: "heapify",
          en: `Heapify reduced heap size=${end}`,
          vi: `Heapify heap thu nhỏ size=${end}`,
          data: this.snapshot([0]),
          codeLines: [5, 6],
          pseudoLines: [4, 5],
          codeSnippet: `size--; heapify(0);`,
          variables: this.vars([v("heapSize", end, true)], ["heap"]),
        })
      );
    }

    this.data = original.sort((a, b) => a - b);
    steps.push(
      step({
        type: "done",
        en: `heapSort → [${this.data.join(", ")}]`,
        vi: `heapSort → [${this.data.join(", ")}]`,
        data: this.snapshot(),
        codeLines: [7],
        variables: this.vars([v("sorted", fmtArr(this.data), true)]),
      })
    );
    this.mode = "max";
    this.buildSilent();
    return steps;
  }

  private toggleMode(): AnimationStep[] {
    const steps: AnimationStep[] = [];
    const next: HeapMode = this.mode === "max" ? "min" : "max";
    steps.push(
      step({
        type: "call",
        en: `Toggle mode ${this.mode} → ${next}`,
        vi: `Đổi mode ${this.mode} → ${next}`,
        data: this.snapshot(),
        codeLines: [0],
        codeSnippet: `public void setMode(Mode mode)`,
        variables: this.vars([v("nextMode", next, true)]),
      })
    );
    this.mode = next;
    this.buildSilent();
    steps.push(
      step({
        type: "done",
        en: `Now ${next}-heap after rebuild`,
        vi: `Đã là ${next}-heap sau rebuild`,
        data: this.snapshot([0], 0),
        codeLines: [1, 2],
        codeSnippet: `this.mode = mode; buildHeap();`,
        variables: this.vars([], ["mode", "heap", "root"]),
      })
    );
    return steps;
  }

  currentState(): VisualizationState {
    return this.snapshot();
  }

  getValues(): number[] {
    return [...this.data];
  }

  setValues(vals: number[]) {
    this.data = [...vals];
    this.buildSilent();
  }
}
