import { CategoriesView } from "@/components/categories-view";
import { getCategories } from "@/lib/data/categories";
export default async function CategoriesPage() {
  const categories = await getCategories(true);
  return <CategoriesView categories={categories}/>;
}
