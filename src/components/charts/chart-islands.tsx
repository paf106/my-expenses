"use client";

import dynamic from "next/dynamic";

export const CategoryChartClient = dynamic(
  () => import("@/components/charts").then((module) => module.CategoryChart),
  { ssr: false, loading: () => <div aria-hidden="true" className="mx-auto h-[210px] w-full max-w-[210px] animate-pulse rounded-full bg-[var(--soft-blue)]" /> },
);

export const TrendChartClient = dynamic(
  () => import("@/components/charts").then((module) => module.TrendChart),
  { ssr: false, loading: () => <div aria-hidden="true" className="h-[260px] w-full animate-pulse rounded-2xl bg-[var(--soft-blue)]" /> },
);
