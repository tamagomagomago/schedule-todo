import Anthropic from "@anthropic-ai/sdk";

export interface BreakdownConfig {
  [key: string]: number; // category: hours per item
}

export interface WeeklyTaskBreakdown {
  week: number; // 1-4
  tasks: {
    category: string;
    allocated_minutes: number;
    subtasks: string[];
  }[];
}

export interface DecompositionResult {
  weeklyBreakdowns: WeeklyTaskBreakdown[];
  summary: string;
}

export async function decomposeOKRWithClaude(
  goal: {
    title: string;
    targetValue: number;
    unit: string;
  },
  breakdownConfig: BreakdownConfig
): Promise<DecompositionResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const configSummary = Object.entries(breakdownConfig)
    .map(([category, hours]) => `${category}: ${hours}時間/${goal.unit}`)
    .join("\n");

  const prompt = `
あなたは映像制作プロジェクト管理の専門家です。
以下の月間目標（OKR）を4週間に分解してください。

【月間目標】
タイトル: ${goal.title}
目標数: ${goal.targetValue}${goal.unit}
月間総時間: ${Object.values(breakdownConfig).reduce((a, b) => a + b) * goal.targetValue}時間

【各作業の時間配分】（1${goal.unit}あたり）
${configSummary}

【要件】
1. 4週間に均等に分散させてください
2. 各週で全カテゴリの作業を含めてください
3. 各カテゴリごとに2-3個の具体的なサブタスクを提示してください
4. 返答は以下のJSON形式のみ（前後のテキストなし）で返してください

{
  "weeklyBreakdowns": [
    {
      "week": 1,
      "tasks": [
        {
          "category": "撮影",
          "allocated_minutes": 120,
          "subtasks": ["ロケハン", "機材準備", "撮影実行"]
        }
      ]
    }
  ],
  "summary": "月間目標達成のための4週間の分解計画です..."
}

※ allocated_minutes は分単位で指定してください
`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // JSON をパース
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude response as JSON");
  }

  const result: DecompositionResult = JSON.parse(jsonMatch[0]);
  return result;
}
