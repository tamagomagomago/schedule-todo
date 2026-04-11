import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const endedAt = new Date().toISOString();

  const { data: session } = await supabase
    .from("focus_sessions_v2")
    .select("started_at, planned_minutes")
    .eq("id", params.id)
    .single();

  const actualMinutes = session
    ? Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000)
    : body.actual_minutes;

  const { data, error } = await supabase
    .from("focus_sessions_v2")
    .update({
      ended_at: endedAt,
      actual_minutes: actualMinutes,
      ...body,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
