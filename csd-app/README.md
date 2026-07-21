# CSD201 Lab

**Visualize. Learn. Master Data Structures.**

Interactive learning platform for CSD201 — a Duolingo-style playground for data structures with real-time animations, Java implementations, quizzes, and gamified progress.

## Modules

1. Singly Linked Lists  
2. Doubly Linked Lists  
3. Circularly Linked Lists  
4. Stacks  
5. Queues  
6. Binary Trees  
7. Balanced Search Trees (AVL)  
8. Heaps (Min / Max)

## Tech Stack

- Next.js 16 + TypeScript
- Tailwind CSS 4
- Framer Motion
- Zustand (progress persistence)
- Lucide icons
- SVG-based visualization engine

## Getting Started

```bash
cd csd-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Sitemap

| Route | Description |
|-------|-------------|
| `/` | Home — Hero + Bento Grid modules |
| `/learn/[slug]` | Learning Playground (Theory 25% · Viz 50% · Ops 25%) |
| `/quiz` | Mixed quiz + module picker |
| `/quiz/[slug]` | Module-specific quiz |
| `/progress` | XP, module progress, achievements |

## Architecture

```
app/                  # Next.js App Router pages
components/
  home/               # Hero, Bento grid, DS cards
  playground/         # Theory / Visualization / Operations panels
  visualization/      # SVG structure canvas
  quiz/               # Quiz UI
  progress/           # Dashboard
  layout/             # Header, Footer
lib/
  data/               # Structure content, quizzes, achievements
  structures/         # Algorithm engines + animation step generators
  store/              # Zustand stores (progress, playground)
types/                # Shared TypeScript types
```

## Features

- Real-time step animation with Play / Pause / Next / Prev / Speed
- Dark & Light theme
- Progress tracking + achievements (localStorage)
- Responsive layout (mobile → desktop)
- Hover effects: scale, glow, floating cards

## License

Educational project for CSD201.
