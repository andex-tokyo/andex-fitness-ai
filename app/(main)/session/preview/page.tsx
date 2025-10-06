"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Save, X, Plus } from "lucide-react";
import RPEInput from "@/components/RPEInput";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

interface ExerciseData {
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number | null;
  rest_seconds: number;
  target_rpe: number;
  notes: string;
}

export default function SessionPreviewPage() {
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [overallNotes, setOverallNotes] = useState("");
  const [duration, setDuration] = useState<number>(0);
  const [intent, setIntent] = useState<string>("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const pendingSession = sessionStorage.getItem("pendingSession");
    if (pendingSession) {
      const data = JSON.parse(pendingSession);
      setExercises(data.plan.exercises);
      setOverallNotes(data.plan.overall_notes || "");
      setDuration(data.duration);
      setIntent(data.intent);
    } else {
      router.push("/session/start");
    }
    loadExercises();
  }, [router]);

  async function loadExercises() {
    const { data } = await supabase
      .from("exercises")
      .select("*")
      .order("last_used_at", { ascending: false, nullsFirst: false });
    if (data) {
      setAvailableExercises(data);
    }
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sessions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration,
          intent,
          plan: {
            exercises,
            overall_notes: overallNotes,
          },
        }),
      });

      const data = await response.json();

      if (data.sessionId) {
        sessionStorage.removeItem("pendingSession");
        router.push("/");
      } else {
        throw new Error("セッション保存に失敗しました");
      }
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem("pendingSession");
    router.push("/session/start");
  };

  const updateExercise = (
    index: number,
    field: keyof ExerciseData,
    value: any,
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)),
    );
  };

  const addExercise = (exerciseName: string) => {
    const newExercise: ExerciseData = {
      exercise_name: exerciseName,
      sets: 3,
      reps: 10,
      weight: null,
      rest_seconds: 90,
      target_rpe: 7,
      notes: "",
    };
    setExercises((prev) => [...prev, newExercise]);
    setShowExerciseModal(false);
    setExpandedIndex(exercises.length);
  };

  if (!duration) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">AIメニュー確認</h1>
        <span className="text-sm text-gray-500">{duration}分</span>
      </div>

      {overallNotes && (
        <div className="bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-indigo-900">{overallNotes}</p>
        </div>
      )}

      <button
        onClick={() => setShowExerciseModal(true)}
        className="w-full bg-white border-2 border-dashed border-indigo-300 text-indigo-600 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        種目を追加
      </button>

      {exercises.map((ex, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <button
            onClick={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50"
          >
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">
                {ex.exercise_name}
              </h3>
              <p className="text-sm text-gray-600">
                {ex.sets}セット × {ex.reps}回{" "}
                {ex.weight ? `@ ${ex.weight}kg` : ""}
              </p>
            </div>
            {expandedIndex === index ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedIndex === index && (
            <div className="p-4 border-t space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    セット
                  </label>
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) =>
                      updateExercise(index, "sets", parseInt(e.target.value))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    回数
                  </label>
                  <input
                    type="number"
                    value={ex.reps}
                    onChange={(e) =>
                      updateExercise(index, "reps", parseInt(e.target.value))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    重量(kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={ex.weight || ""}
                    onChange={(e) =>
                      updateExercise(
                        index,
                        "weight",
                        e.target.value ? parseFloat(e.target.value) : null,
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標RPE
                </label>
                <RPEInput
                  value={ex.target_rpe}
                  onChange={(value) =>
                    updateExercise(index, "target_rpe", value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  休憩（秒）
                </label>
                <input
                  type="number"
                  value={ex.rest_seconds}
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "rest_seconds",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {ex.notes && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{ex.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateExercise(index, "weight", (ex.weight || 0) - 2.5)
                  }
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  -2.5kg
                </button>
                <button
                  onClick={() => updateExercise(index, "reps", ex.reps + 1)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  +1回
                </button>
                <button
                  onClick={() =>
                    updateExercise(index, "weight", (ex.weight || 0) + 2.5)
                  }
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  +2.5kg
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showExerciseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                種目を選択
              </h3>
              <button
                onClick={() => setShowExerciseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {availableExercises.length > 0 ? (
                <div className="space-y-2">
                  {availableExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => addExercise(exercise.name)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {exercise.name}
                      </div>
                      {exercise.category && (
                        <div className="text-sm text-gray-600">
                          {exercise.category}
                          {exercise.equipment && ` • ${exercise.equipment}`}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  種目がありません
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}
