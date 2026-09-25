import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, monthBounds } from "@/lib/utils";

const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const month = request.nextUrl.searchParams.get("month") || currentMonth();
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "Mes no válido" }, { status: 400 });
  const { start, end } = monthBounds(month);
  let query = supabase.from("transactions").select("type,amount,description,date,category:categories(name)").gte("date", start).lte("date", end).order("date", { ascending: true });
  const type = request.nextUrl.searchParams.get("type");
  if (type === "income" || type === "expense") query = query.eq("type", type);
  const category = request.nextUrl.searchParams.get("category");
  if (category) query = query.eq("category_id", category);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "No se pudieron exportar los movimientos" }, { status: 500 });
  const lines = [["Fecha", "Tipo", "Categoría", "Descripción", "Importe EUR"], ...(data || []).map((row) => [row.date, row.type === "income" ? "Ingreso" : "Gasto", (row.category as unknown as { name: string } | null)?.name || "", row.description, Number(row.amount).toFixed(2)])];
  const csv = `\uFEFF${lines.map((line) => line.map(quote).join(";")).join("\r\n")}`;
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mis-gastos-${month}.csv"`, "Cache-Control": "private, no-store" } });
}
