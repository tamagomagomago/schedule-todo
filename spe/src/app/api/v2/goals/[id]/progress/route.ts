import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 子目標の達成が親に再帰的に伝播する
async function propagateProgress(goalId: number): Promise<void> {
  const { data: goal } = await supabase
    .from("goals_v2")
    .select("*")
    .eq("id", goalId)
    .single();

  if (!goal || !goal.parent_id) return;

  // 親目標の子たちを全部取得
  const { data: siblings } = await supabase
    .from("goals_v2")
    .select("current_value, target_value, is_achieved")
    .eq("parent_id", goal.parent_id);

  if (!siblings || siblings.length === 0) return;

  // 子の達成率平均で親の current_value を更新
  const { data: parent } = await supabase
    .from("goals_v2")
    .select("*")
    .eq("id", goal.parent_id)
    .single();

  if (!parent) return;

  let newCurrentValue = parent.current_value;

  if (parent.target_value) {
    // 子の達成度合い（何件達成 / 総件数）× 親のtarget_value
    const achievedCount = siblings.filter((s) => s.is_achieved).length;
    newCurrentValue = Math.round((achievedCount / siblings.length) * parent.target_value);
  } else {
    // target_value がない場合は達成済み件数をそのままカウント
    newCurrentValue = siblings.filter((s) => s.is_achieved).length;
  }

  const isAchieved = parent.target_value
    ? newCurrentValue >= parent.target_value
    : siblings.every((s) => s.is_achieved);

  await supabase
    .from("goals_v2")
    .update({
      current_value: newCurrentValue,
      is_achieved: isAchieved,
      updated_at: new Date().toISOString(),
    })
    .eq("id", goal.parent_id);

  // 再帰的に上位目標へ伝播
  if (isAchieved) {
    await propagateProgress(goal.parent_id);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { current_value, is_achieved } = body;

  const { data, error } = await supabase
    .from("goals_v2")
    .update({
      current_value,
      is_achieved: is_achieved ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 達成された場合は親へ伝播
  if (is_achieved) {
    await propagateProgress(Number(params.id));
  }

  return NextResponse.json(data);
}
