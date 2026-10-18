import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentMonth, monthBounds, normalizeSearch, parseMonth } from "@/lib/utils";
import { quoteCsvCell } from "@/lib/csv";
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const claims = authData?.claims;
  if (!claims?.sub) return NextResponse.redirect(new URL("/login", request.url));
  const month = parseMonth(request.nextUrl.searchParams.get("month")) || (request.nextUrl.searchParams.has("month") ? null : currentMonth());
  if (!month) return NextResponse.json({ error: "Mes no válido" }, { status: 400 });
  const { start, end } = monthBounds(month);
  const type = request.nextUrl.searchParams.get("type");
  const selectedType = type === "income" || type === "expense" ? type : null;
  const category = request.nextUrl.searchParams.get("category");
  if (category) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category)) return NextResponse.json({ error: "Categoría no válida" }, { status: 400 });
  }
  const data: Array<{ date: string; type: string; amount: number; description: string; category: unknown }> = [];
  for (let offset = 0; ; offset += 1000) {
    let query = supabase.from("transactions").select("type,amount,description,date,category:categories!transaction_category_owner(name)").gte("date", start).lte("date", end).order("date", { ascending: true }).order("created_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 999);
    if (selectedType) query = query.eq("type", selectedType);
    if (category) query = query.eq("category_id", category);
    const { data: page, error } = await query;
    if (error) return NextResponse.json({ error: "No se pudieron exportar los movimientos" }, { status: 500 });
    data.push(...page);
    if (page.length < 1000) break;
  }
  const queryText = normalizeSearch(request.nextUrl.searchParams.get("q") || "");
  const filteredData = queryText ? data.filter((row) => normalizeSearch(`${row.description} ${(row.category as unknown as { name: string } | null)?.name || ""}`).includes(queryText)) : data;
  const lines = [["Fecha", "Tipo", "Categoría", "Descripción", "Importe EUR"], ...filteredData.map((row) => [row.date, row.type === "income" ? "Ingreso" : "Gasto", (row.category as unknown as { name: string } | null)?.name || "", row.description, Number(row.amount).toFixed(2)])];
  const csv = `\uFEFF${lines.map((line) => line.map(quoteCsvCell).join(";")).join("\r\n")}`;
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mis-gastos-${month}.csv"`, "Cache-Control": "private, no-store" } });
}
