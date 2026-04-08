"use client";

import { useState, useEffect, useCallback } from "react";

interface WeeklySubtask {
  id: number;
  name: string;
  estimated_minutes: number;
  actual_minutes: number;
  completed: boolean;
}

interface WeeklyTask {
  id: number;
  goal_id: string;
  category: string;
  allocated_minutes: number;
  actual_minutes: number;
  week_number: number;
  weekly_subtasks: WeeklySubtask[];
}

export default function WeeklyTasksDisplay() {
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubtask, setSelectedSubtask] = useState<{
    id: number;
    weeklyTaskId: number;
  } | null>(null);
  const [sessionMinutes, setSessionMinutes] = useState<string>("25");

  useEffect(() => {
    fetchWeeklyTasks();
  }, []);

  const fetchWeeklyTasks = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const week = Math.ceil((now.getDate() + new Date(year, now.getMonth(), 1).getDay()) / 7);

      const res = await fetch(
        `/api/weekly-tasks/list?week=${week}&month=${year}-${month}`
      );
      const data = await res.json();
      setWeeklyTasks(data.tasks || []);
    } catch (err) {
      console.error("Failed to fetch weekly tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRecordSession = useCallback(async () => {
    if (!selectedSubtask || !sessionMinutes) return;

    try {
      const res = await fetch("/api/focus/sessions/complete-with-subtask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: null, // Placeholder
          actual_minutes: parseInt(sessionMinutes),
          linked_subtask_id: selectedSubtask.id,
        }),
      });

      if (res.ok) {
        setSelectedSubtask(null);
        setSessionMinutes("25");
        await fetchWeeklyTasks();
      }
    } catch (err) {
      console.error("Failed to record session:", err);
    }
  }, [selectedSubtask, sessionMinutes, fetchWeeklyTasks]);

  if (loading) {
    return <div className="text-gray-500 text-xs text-center py-4">読み込み中...</div>;
  }

  if (weeklyTasks.length === 0) {
    return (
      <div className="text-gray-500 text-xs text-center py-4">
        今週のOKRタスクはまだ分解されていません
      </div>
    );
  }

  // カテゴリでグループ化
  const groupedByCategory: Record<string, WeeklyTask[]> = {};
  weeklyTasks.forEach((task) => {
    if (!groupedByCategory[task.category]) {
      groupedByCategory[task.category] = [];
    }
    groupedByCategory[task.category].push(task);
  });

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📋</span>
          <span className="font-semibold text-gray-200">今週のOKRタスク</span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(groupedByCategory).map(([category, tasks]) => (
          <div key={category}>
            <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">
              {category}
            </p>

            {tasks.map((task) => {
              const totalAllocated = task.allocated_minutes;
              const totalActual = task.actual_minutes;
              const progress = Math.min(
                100,
                Math.round((totalActual / totalAllocated) * 100)
              );

              return (
                <div key={task.id} className="mb-3 bg-gray-800 p-2.5 rounded">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-300">{category}</span>
                    <span className="text-xs text-gray-500">
                      {totalActual}/{totalAllocated}分 ({progress}%)
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-300 ${
                        progress >= 80
                          ? "bg-green-500"
                          : progress >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    {task.weekly_subtasks?.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 bg-gray-700/50 p-1.5 rounded text-xs group"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          className="w-3 h-3 rounded accent-green-500 cursor-pointer"
                        />
                        <span className="flex-1 text-gray-400">
                          {subtask.name}
                        </span>
                        <span className="text-gray-600 text-[10px]">
                          {subtask.actual_minutes}/{subtask.estimated_minutes}分
                        </span>
                        <button
                          onClick={() =>
                            setSelectedSubtask({
                              id: subtask.id,
                              weeklyTaskId: task.id,
                            })
                          }
                          className="bg-gray-600 hover:bg-blue-700 text-gray-300 px-1.5 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          記録
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* セッション記録ダイアログ */}
      {selectedSubtask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 w-96">
            <p className="text-sm font-semibold text-gray-200 mb-3">
              セッション時間を記録
            </p>

            <input
              type="number"
              min="1"
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(e.target.value)}
              className="w-full bg-gray-800 text-gray-200 rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="分数"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSubtask(null)}
                className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleRecordSession}
                className="flex-1 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded transition-colors"
              >
                記録
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
