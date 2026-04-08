import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { session_id, actual_minutes, linked_subtask_id } = await req.json();

    if (!session_id || !actual_minutes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // focus_sessions を更新
    const { error: sessionError } = await supabase
      .from("focus_sessions")
      .update({
        actual_minutes,
        linked_subtask_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    if (sessionError) throw sessionError;

    // サブタスクの actual_minutes を加算
    if (linked_subtask_id) {
      const { data: subtask, error: subtaskError } = await supabase
        .from("weekly_subtasks")
        .select("actual_minutes, weekly_task_id")
        .eq("id", linked_subtask_id)
        .single();

      if (subtaskError && subtaskError.code !== "PGRST116")
        throw subtaskError;

      if (subtask) {
        const newActualMinutes = (subtask.actual_minutes || 0) + actual_minutes;

        // サブタスク更新
        await supabase
          .from("weekly_subtasks")
          .update({ actual_minutes: newActualMinutes })
          .eq("id", linked_subtask_id);

        // 週間タスクの actual_minutes も再計算
        if (subtask.weekly_task_id) {
          const { data: subtasks } = await supabase
            .from("weekly_subtasks")
            .select("actual_minutes")
            .eq("weekly_task_id", subtask.weekly_task_id);

          const totalMinutes = (subtasks || []).reduce(
            (sum, st) => sum + (st.actual_minutes || 0),
            0
          );

          await supabase
            .from("weekly_tasks")
            .update({ actual_minutes: totalMinutes })
            .eq("id", subtask.weekly_task_id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to complete session with subtask:", err);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
