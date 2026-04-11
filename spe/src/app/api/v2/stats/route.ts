import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weeks = Number(searchParams.get("weeks") ?? "4");

  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  // 集中セッション（期間内）
  const { data: sessions } = await supabase
    .from("focus_sessions_v2")
    .select("category, actual_minutes, planned_minutes, started_at")
    .eq("user_id", "default_user")
    .gte("started_at", since.toISOString())
    .not("ended_at", "is", null);

  // カテゴリ別集計
  const focusByCategory: Record<string, number> = {};
  (sessions ?? []).forEach((s) => {
    const min = s.actual_minutes ?? s.planned_minutes ?? 0;
    focusByCategory[s.category] = (focusByCategory[s.category] ?? 0) + min;
  });

  // 週別集計
  const weekMap: Record<string, number> = {};
  (sessions ?? []).forEach((s) => {
    const d = new Date(s.started_at);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const key = monday.toISOString().split("T")[0];
    weekMap[key] = (weekMap[key] ?? 0) + (s.actual_minutes ?? s.planned_minutes ?? 0);
  });

  const weeklyFocus = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, minutes]) => ({ week, minutes }));

  // 週次達成率トレンド（weekly_reviews から）
  const { data: reviews } = await supabase
    .from("weekly_reviews_v2")
    .select("week_start, achievement_rate")
    .eq("user_id", "default_user")
    .gte("week_start", since.toISOString().split("T")[0])
    .order("week_start", { ascending: true });

  const goalAchievementTrend = (reviews ?? []).map((r) => ({
    week: r.week_start,
    rate: r.achievement_rate ?? 0,
  }));

  return NextResponse.json({ focusByCategory, weeklyFocus, goalAchievementTrend });
}
