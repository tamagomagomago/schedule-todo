import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("focus_sessions_v2")
    .select("*")
    .eq("user_id", "default_user")
    .gte("started_at", `${date}T00:00:00`)
    .lte("started_at", `${date}T23:59:59`)
    .order("started_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("focus_sessions_v2")
    .insert({
      user_id: "default_user",
      todo_id: body.todo_id ?? null,
      todo_title: body.todo_title ?? null,
      category: body.category,
      planned_minutes: body.planned_minutes,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
