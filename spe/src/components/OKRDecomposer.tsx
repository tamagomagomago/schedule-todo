"use client";

import { useState, useCallback } from "react";
import { Goal } from "@/types";

interface BreakdownConfig {
  [key: string]: number;
}

interface DecomposerProps {
  goal: Goal;
  onDecomposed?: () => void;
}

export default function OKRDecomposer({ goal, onDecomposed }: DecomposerProps) {
  const [breakdownConfig, setBreakdownConfig] = useState<BreakdownConfig>(
    goal.breakdown_config || {}
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [lastDecomposed, setLastDecomposed] = useState(goal.decomposed_at);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setBreakdownConfig({
      ...breakdownConfig,
      [newCategoryName]: 1,
    });
    setNewCategoryName("");
  };

  const handleRemoveCategory = (category: string) => {
    const { [category]: _, ...rest } = breakdownConfig;
    setBreakdownConfig(rest);
  };

  const handleUpdateMinutes = (category: string, minutes: number) => {
    setBreakdownConfig({
      ...breakdownConfig,
      [category]: Math.max(0, minutes),
    });
  };

  const handleDecompose = useCallback(async () => {
    if (Object.keys(breakdownConfig).length === 0) {
      alert("最低1つのカテゴリを設定してください");
      return;
    }

    setIsDecomposing(true);
    try {
      const res = await fetch("/api/goals/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_id: goal.id,
          goal: {
            title: goal.title,
            targetValue: goal.target_value || 0,
            unit: goal.unit || "",
          },
          breakdown_config: breakdownConfig,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`分解に失敗しました: ${data.error}`);
        return;
      }

      setLastDecomposed(new Date().toISOString());
      onDecomposed?.();

      // 成功通知を表示
      alert("✅ OKRを分解しました！\n\n" + (data.summary || "分解が完了しました"));
    } catch (err) {
      alert("エラーが発生しました: " + String(err));
    } finally {
      setIsDecomposing(false);
    }
  }, [goal, breakdownConfig, onDecomposed]);

  const totalHours = Object.values(breakdownConfig).reduce((a, b) => a + b, 0);
  const monthlyTotalMinutes =
    totalHours * (goal.target_value || 1) * 60;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-200">{goal.title}</p>
        <p className="text-xs text-gray-500">
          月間: {goal.target_value}{goal.unit} | 総時間: {totalHours * (goal.target_value || 1)}時間
        </p>
        {lastDecomposed && (
          <p className="text-xs text-green-400 mt-1">
            ✅ {new Date(lastDecomposed).toLocaleDateString("ja-JP")} に分解済み
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-600 font-semibold">時間配分:</p>

        {Object.entries(breakdownConfig).map(([category, minutes]) => (
          <div key={category} className="flex items-center gap-2 bg-gray-800 p-2 rounded">
            <span className="text-xs text-gray-400 flex-1">{category}:</span>
            <input
              type="number"
              min="0"
              value={minutes}
              onChange={(e) =>
                handleUpdateMinutes(category, parseInt(e.target.value) || 0)
              }
              className="w-16 bg-gray-700 text-gray-200 text-xs rounded px-1 py-0.5 focus:outline-none"
            />
            <span className="text-xs text-gray-500">時間/{goal.unit}</span>
            <button
              onClick={() => handleRemoveCategory(category)}
              className="text-gray-600 hover:text-red-400 text-xs"
            >
              ✕
            </button>
          </div>
        ))}

        <div className="flex gap-1 mt-2">
          <input
            placeholder="新規カテゴリ"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            className="flex-1 bg-gray-700 text-gray-200 text-xs rounded px-2 py-1 focus:outline-none"
          />
          <button
            onClick={handleAddCategory}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={handleDecompose}
        disabled={isDecomposing || Object.keys(breakdownConfig).length === 0}
        className="w-full mt-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded font-semibold transition-colors disabled:opacity-50"
      >
        {isDecomposing ? "🤖 分解中..." : "🤖 Claude で分解"}
      </button>
    </div>
  );
}
