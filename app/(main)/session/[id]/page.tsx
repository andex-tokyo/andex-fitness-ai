"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RPEInput from "@/components/RPEInput";
import { ChevronDown, ChevronUp, Save } from "lucide-react";

interface ExerciseData {
  id: string;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  sets: number;
  reps: number;
  weight: number | null;
  rest_seconds: number;
  target_rpe: number;
  actual_rpe: number;
  notes: string;
}

export default function SessionEditPage() {
  const params = useParams();
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadSession();
  }, [params.id]);

  async function loadSession() {
    const { data: planExercises } = await supabase
      .from("session_exercises")
      .select(
        `
        *,
        exercise:exercises(name)
      `,
      )
      .eq("session_id", params.id)
      .eq("is_plan", true)
      .order("order_index");

    if (planExercises) {
      setExercises(
        planExercises.map((ex) => ({
          id: ex.id,
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise?.name || "",
          order_index: ex.order_index,
          sets: ex.sets || 3,
          reps: ex.reps || 10,
          weight: ex.weight,
          rest_seconds: ex.rest_seconds || 90,
          target_rpe: ex.target_rpe || 7,
          actual_rpe: ex.actual_rpe || 7,
          notes: ex.notes || "",
        })),
      );
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Actual として保存
      for (const ex of exercises) {
        await supabase.from("session_exercises").insert({
          session_id: params.id,
          exercise_id: ex.exercise_id,
          order_index: ex.order_index,
          is_plan: false,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          rest_seconds: ex.rest_seconds,
          actual_rpe: ex.actual_rpe,
          notes: ex.notes,
        });

        // 種目の last_used_at を更新
        await supabase
          .from("exercises")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", ex.exercise_id);
      }

      alert("セッションを保存しました！");
      router.push("/history");
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const updateExercise = (
    index: number,
    field: keyof ExerciseData,
    value: any,
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)),
    );
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">セッション編集</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

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
                  RPE（実際）
                </label>
                <RPEInput
                  value={ex.actual_rpe}
                  onChange={(value) =>
                    updateExercise(index, "actual_rpe", value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <textarea
                  value={ex.notes}
                  onChange={(e) =>
                    updateExercise(index, "notes", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="フォームのコツ、感想など"
                />
              </div>

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
    </div>
  );
}
