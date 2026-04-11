import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ルーティン管理 V2",
  description: "目標・集中・タスク管理アプリ V2",
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {children}
    </div>
  );
}
