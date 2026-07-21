import { notFound } from "next/navigation";
import { getAllSlugs, getStructure } from "@/lib/data/structures";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import type { DSSlug } from "@/types";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ds = getStructure(slug);
  if (!ds) return { title: "Quiz" };
  return { title: `${ds.name} Quiz · CSD201 Lab` };
}

export default async function ModuleQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ds = getStructure(slug);
  if (!ds) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <QuizPanel slug={slug as DSSlug} />
    </div>
  );
}
