# CSD201 Lab — Architecture & Design

## Sitemap

```
/                                 Home (Hero + Bento Grid)
├── /learn/[slug]                 Learning Playground
│   ├── singly-linked-lists
│   ├── doubly-linked-lists
│   ├── circularly-linked-lists
│   ├── stacks
│   ├── queues
│   ├── binary-trees
│   ├── balanced-search-trees
│   └── heaps
├── /quiz                         Mixed quiz + module picker
├── /quiz/[slug]                  Module quiz
└── /progress                     XP · progress · achievements
```

## Color Mapping

| Structure                 | Theme Color |
|---------------------------|-------------|
| Singly Linked Lists       | Sky Blue    |
| Doubly Linked Lists       | Purple      |
| Circularly Linked Lists   | Orange      |
| Stacks                    | Pink        |
| Queues                    | Mint Green  |
| Binary Trees              | Green       |
| Balanced Search Trees     | Yellow      |
| Heaps                     | Coral Red   |

## Component Tree

```
RootLayout
├── ThemeProvider
├── Header (nav, XP, theme toggle)
├── main
│   ├── HomePage
│   │   ├── HeroSection (aurora, particles, floating nodes, parallax)
│   │   ├── BentoGrid
│   │   │   └── DSCard × 8
│   │   └── FeatureStrip
│   ├── LearnPage
│   │   └── LearningPlayground
│   │       ├── TheoryPanel (25%)
│   │       ├── VisualizationPanel (50%)
│   │       │   ├── StructureCanvas (SVG zoom/pan/drag)
│   │       │   └── AnimationControls
│   │       └── OperationsPanel (25%)
│   ├── QuizPage / ModuleQuizPage
│   │   └── QuizPanel
│   └── ProgressPage
│       └── ProgressDashboard
└── Footer
```

## Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│  UI (components/app)                    │
├─────────────────────────────────────────┤
│  State (Zustand: progress, playground)  │
├─────────────────────────────────────────┤
│  Domain Engines (lib/structures/*)      │
│  → produce AnimationStep[] + VizState   │
├─────────────────────────────────────────┤
│  Content Data (lib/data/*)              │
│  Types (types/*)                        │
└─────────────────────────────────────────┘
```

### Domain Engines

Each engine mutates its structure and emits discrete animation steps:

- `LinkedListEngine` — singly / doubly / circular
- `StackEngine`
- `QueueEngine`
- `BinaryTreeEngine` — BST + AVL mode
- `HeapEngine` — min / max

Every operation returns `AnimationStep[]` with embedded `VisualizationState` snapshots so the UI can step forward/backward without re-running algorithms.

## Playground Layout (25 / 50 / 25)

| Panel | Width | Content |
|-------|-------|---------|
| Theory | 25% | Definition, characteristics, pros/cons, apps, complexity |
| Visualization | 50% | SVG canvas, timeline, play controls, fullscreen |
| Operations | 25% | Op picker, Java + pseudocode, input, Run Animation |

## Animation Controls

- ▶ Play / ⏸ Pause  
- ⏮ Previous / ⏭ Next  
- Reset  
- Speed ×0.5 (Slow) / ×1 / ×1.5 / ×2  
- Auto Play ON/OFF  
- Progress bar + step counter + clickable timeline  

## Educational Features

- **Quiz** — 3 questions per module + mixed challenge  
- **Progress** — operations (70%) + quiz score (30%)  
- **Achievements** — Linked List Explorer, Stack Specialist, Queue Master, Tree Architect, Heap Champion, etc.  
- **XP** — persisted in `localStorage` via Zustand  

## Responsive

- Mobile: stacked panels  
- Tablet: 2-column where useful  
- Desktop: 3-column playground (25/50/25)  
- Dark / Light theme via `next-themes`  

## Performance Notes

- Static generation for all learn/quiz routes (`generateStaticParams`)
- Animation steps are pure snapshots (no continuous RAF unless playing)
- Progress store is selective (only serializable fields persisted)
- SVG nodes use Framer Motion only for mount/unmount springs
