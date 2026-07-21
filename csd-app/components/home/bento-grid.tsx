"use client";

import { DATA_STRUCTURES } from "@/lib/data/structures";
import { DSCard } from "./ds-card";

export function BentoGrid() {
  return (
    <section id="modules" className="scroll-mt-24">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Module học tập
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            8 cấu trúc dữ liệu · animation tương tác · quiz &amp; XP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DATA_STRUCTURES.map((ds, i) => (
          <DSCard
            key={ds.slug}
            ds={ds}
            index={i}
            large={i === 0 || i === 5}
          />
        ))}
      </div>
    </section>
  );
}
