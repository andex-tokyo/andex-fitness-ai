"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Target } from "lucide-react";

const durations = [20, 30, 45, 60];
const intents = [
  { value: "time_saving", label: "時短" },
  { value: "weight", label: "重量" },
  { value: "volume", label: "ボリューム" },
  { value: "form", label: "フォーム" },
];

export default function SessionStartPage() {
  const [duration, setDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState("");
  const [intent, setIntent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    if (!intent) {
      alert("意図を選択してください");
      return;
    }

    setLoading(true);

    const selectedDuration = customDuration
      ? parseInt(customDuration)
      : duration;

    try {
      const response = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: selectedDuration,
          intent,
        }),
      });

      const data = await response.json();

      if (data.plan) {
        // AIレスポンスをセッションストレージに保存
        const sessionData = {
          plan: data.plan,
          duration: data.duration,
          intent: data.intent,
        };
        sessionStorage.setItem("pendingSession", JSON.stringify(sessionData));
        router.push(`/session/preview`);
      } else {
        throw new Error("プラン生成に失敗しました");
      }
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <svg
              className="animate-spin h-12 w-12 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-lg font-semibold text-gray-900">
              AIメニュー生成中...
            </p>
            <p className="text-sm text-gray-600">
              最適なメニューを考えています
            </p>
          </div>
        </div>
      )}
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">セッション開始</h1>

        <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">所要時間</h2>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {durations.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDuration(d);
                    setCustomDuration("");
                  }}
                  className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                    duration === d && !customDuration
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {d}分
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="カスタム（分）"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">意図</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {intents.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setIntent(value)}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                    intent === value
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={loading || !intent}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {loading ? "AIメニュー生成中..." : "AIメニューを作成"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          <button
            onClick={() => {
              const selectedDuration = customDuration
                ? parseInt(customDuration)
                : duration;
              sessionStorage.setItem(
                "pendingSession",
                JSON.stringify({
                  plan: { exercises: [], overall_notes: "" },
                  duration: selectedDuration,
                  intent: intent || "form",
                }),
              );
              router.push("/session/preview");
            }}
            className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            AIなしで作成
          </button>
        </div>
      </div>
    </>
  );
}
