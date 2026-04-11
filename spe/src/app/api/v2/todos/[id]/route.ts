import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const updates: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  };

  // 完了時は完了日時を自動設定
  if (body.is_completed === true && !body.completed_at) {
    updates.completed_at = new Date().toISOString();
  }
  if (body.is_completed === false) {
    updates.completed_at = null;
  }

  // MITを設定する場合は他のMITを外す
  if (body.is_mit === true) {
    await supabase
      .from("todos_v2")
      .update({ is_mit: false })
      .eq("user_id", "default_user")
      .eq("is_mit", true)
      .neq("id", params.id);
  }

  const { data, error } = await supabase
    .from("todos_v2")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from("todos_v2").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
