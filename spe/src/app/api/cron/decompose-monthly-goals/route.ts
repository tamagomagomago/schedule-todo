import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decomposeOKRWithClaude } from "@/lib/claudeTaskDecomposer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  // Vercel Cron の検証（オプション）
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // breakdown_config が設定されている goal を取得
    const { data: goals, error: goalsError } = await supabase
      .from("goals")
      .select("id, title, target_value, unit, breakdown_config")
      .not("breakdown_config", "is", null);

    if (goalsError) throw goalsError;

    let processedCount = 0;
    const errors: string[] = [];

    for (const goal of goals || []) {
      try {
        // Claude で分解
        const decomposition = await decomposeOKRWithClaude(
          {
            title: goal.title,
            targetValue: goal.target_value,
            unit: goal.unit,
          },
          goal.breakdown_config
        );

        // 既存タスクを削除
        await supabase.from("weekly_tasks").delete().eq("goal_id", goal.id);

        // 新しいタスクを作成
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;

        for (const weeklyBreakdown of decomposition.weeklyBreakdowns) {
          for (const task of weeklyBreakdown.tasks) {
            const { data: insertedTask } = await supabase
              .from("weekly_tasks")
              .insert({
                goal_id: goal.id,
                user_id: "default_user",
                week_number: weeklyBreakdown.week,
                month: `${monthStr}-01`,
                category: task.category,
                allocated_minutes: task.allocated_minutes,
              })
              .select();

            if (insertedTask?.[0]) {
              const subtasks = task.subtasks.map((name) => ({
                weekly_task_id: insertedTask[0].id,
                name,
                estimated_minutes: Math.round(
                  task.allocated_minutes / task.subtasks.length
                ),
              }));

              await supabase.from("weekly_subtasks").insert(subtasks);
            }
          }
        }

        // goal を更新
        await supabase
          .from("goals")
          .update({
            decomposed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", goal.id);

        processedCount++;

        // Pushover 通知
        try {
          await fetch("https://api.pushover.net/1/messages.json", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: process.env.PUSHOVER_APP_TOKEN,
              user: process.env.PUSHOVER_USER_KEY,
              message: `✅ 月間目標「${goal.title}」を分解しました`,
              priority: 0,
            }),
          });
        } catch {}
      } catch (err) {
        errors.push(`Goal ${goal.id}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors,
    });
  } catch (err) {
    console.error("Cron decomposition failed:", err);
    return NextResponse.json(
      { error: "Failed to process cron task", details: String(err) },
      { status: 500 }
    );
  }
}
