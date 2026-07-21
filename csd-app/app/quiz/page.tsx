import Link from "next/link";
import { DATA_STRUCTURES, COLOR_MAP } from "@/lib/data/structures";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Quiz · CSD201 Lab",
  description: "Test your data structures knowledge",
};

export default function QuizPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
        <p className="mt-1 text-muted-foreground">
          Challenge yourself — pick a module or take a mixed quiz
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DATA_STRUCTURES.map((ds) => {
          const colors = COLOR_MAP[ds.color];
          return (
            <Link
              key={ds.slug}
              href={`/quiz/${ds.slug}`}
              className={cn(
                "rounded-xl border p-3 text-center transition hover:scale-[1.02]",
                colors.border,
                colors.soft
              )}
            >
              <p className={cn("text-sm font-bold", colors.text)}>
                {ds.shortName}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {ds.name}
              </p>
            </Link>
          );
        })}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold">Mixed Challenge</h2>
        <QuizPanel />
      </section>
    </div>
  );
}
