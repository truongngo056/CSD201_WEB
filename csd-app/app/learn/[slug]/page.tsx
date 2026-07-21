import { notFound } from "next/navigation";
import { getAllSlugs, getStructure } from "@/lib/data/structures";
import { LearningPlayground } from "@/components/playground/learning-playground";

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
  if (!ds) return { title: "Not Found" };
  return {
    title: `${ds.name} · CSD201 Lab`,
    description: ds.description.en,
  };
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ds = getStructure(slug);
  if (!ds) notFound();

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6">
      <LearningPlayground ds={ds} />
    </div>
  );
}
