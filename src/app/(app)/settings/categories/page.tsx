import { CategoriesView } from "@/components/categories-view";
import { getCategories } from "@/lib/data/categories";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Categorías y presupuestos" };
export default async function CategoriesPage() {
  const categories = await getCategories(true);
  return <CategoriesView categories={categories}/>;
}
