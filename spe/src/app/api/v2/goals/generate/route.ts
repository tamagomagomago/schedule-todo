import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

function buildDateRanges(
  generateType: "monthly" | "weekly",
  parentStartDate: string,
  parentEndDate: string
): { start: string; end: string }[] {
  const today = new Date();
  const endDate = new Date(parentEndDate);
  const ranges: { start: string; end: string }[] = [];

  if (generateType === "monthly") {
    const monthsRemaining = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const chunkMonths = monthsRemaining > 3 ? 3 : 1; // 3ヶ月超なら四半期、以内なら月次

    let current = new Date(today.getFullYear(), today.getMonth(), 1);
    while (current < endDate) {
      const chunkEnd = new Date(current.getFullYear(), current.getMonth() + chunkMonths, 0);
      const actualEnd = chunkEnd < endDate ? chunkEnd : endDate;
      ranges.push({
        start: current.toISOString().split("T")[0],
        end: actualEnd.toISOString().split("T")[0],
      });
      current = new Date(current.getFullYear(), current.getMonth() + chunkMonths, 1);
    }
  } else {
    // weekly: 親目標の期間内で月曜始まりの週を生成
    let current = new Date(parentStartDate);
    // 直近の月曜日に合わせる
    const dayOfWeek = current.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    current.setDate(current.getDate() + daysToMonday);

    while (current <= endDate) {
      const weekEnd = new Date(current);
      weekEnd.setDate(current.getDate() + 6);
      const actualEnd = weekEnd < endDate ? weekEnd : endDate;
      ranges.push({
        start: current.toISOString().split("T")[0],
        end: actualEnd.toISOString().split("T")[0],
      });
      current = new Date(current);
      current.setDate(current.getDate() + 7);
    }
  }

  return ranges;
}

export async function POST(req: NextRequest) {
  try {
    const { parentGoal, generateType } = await req.json();

    const today = new Date().toISOString().split("T")[0];
    const dateRanges = buildDateRanges(generateType, parentGoal.start_date, parentGoal.end_date);

    if (dateRanges.length === 0) {
      return NextResponse.json({ error: "生成できる期間がありません" }, { status: 400 });
    }

    const periodLabel = generateType === "monthly" ? "月間" : "週間";
    const chunkLabel =
      generateType === "monthly"
        ? dateRanges.length > 0 &&
          new Date(dateRanges[0].end).getMonth() - new Date(dateRanges[0].start).getMonth() >= 2
          ? "3ヶ月ごとの四半期"
          : "1ヶ月ごと"
        : "1週間ごと";

    const valueInfo =
      parentGoal.target_value != null
        ? `\n現在値: ${parentGoal.current_value ?? 0} → 目標値: ${parentGoal.target_value} ${parentGoal.unit ?? ""}`
        : "";

    const userMessage = `
親目標情報:
タイトル: ${parentGoal.title}
カテゴリ: ${parentGoal.category}
期間: ${parentGoal.start_date} 〜 ${parentGoal.end_date}${valueInfo}
今日の日付: ${today}

${chunkLabel}の${periodLabel}目標を生成してください。
以下の${dateRanges.length}つの期間それぞれに対応する目標を1つずつ作成してください:
${dateRanges.map((r, i) => `${i + 1}. ${r.start} 〜 ${r.end}`).join("\n")}

各期間の目標は前の期間の成果を積み上げる形で設計し、最終的に親目標の達成につながるよう逆算してください。
JSON配列のみ出力してください。
    `.trim();

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: `あなたは目標管理の専門家です。ユーザーの目標を分解して段階的な${periodLabel}目標を生成します。

必ずJSON配列のみを出力してください（説明文・マークダウン不要）:
[
  {
    "title": "目標タイトル（定量的な数値を含む）",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "target_value": 数値またはnull,
    "unit": "単位またはnull"
  }
]

生成ルール:
- 定量的な数値を必ず含める（例:「150万円の追加投資」「模擬試験3回実施」）
- 行動ベースの表現（〇〇に取り組む・〇〇を達成する）
- 具体的なTODOは含めない（大枠のみ）
- 各期間が独立した段階になるよう逆算設計
- target_valueはその期間終了時点の累計値または到達値`,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonText = rawText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsed: {
      title: string;
      start_date: string;
      end_date: string;
      target_value: number | null;
      unit: string | null;
    }[];
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "レスポンスのパースに失敗しました", raw: rawText },
        { status: 500 }
      );
    }

    const goals = parsed.map((g) => ({
      ...g,
      category: parentGoal.category,
      period_type: generateType === "monthly" ? "monthly" : "weekly",
      parent_id: parentGoal.id,
    }));

    return NextResponse.json(goals);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
