"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search } from "lucide-react";
import type { Exercise } from "@/types/database";

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: "",
    category: "",
    equipment: "",
  });
  const supabase = createClient();

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("exercises")
      .select("*")
      .eq("user_id", user.id)
      .order("last_used_at", { ascending: false, nullsFirst: false });

    if (data) setExercises(data);
  }

  async function handleAdd() {
    if (!newExercise.name.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("exercises").insert({
      user_id: user.id,
      name: newExercise.name,
      category: newExercise.category || null,
      equipment: newExercise.equipment || null,
    });

    if (!error) {
      setNewExercise({ name: "", category: "", equipment: "" });
      setShowAddForm(false);
      loadExercises();
    }
  }

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">種目</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          追加
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
          <input
            type="text"
            placeholder="種目名"
            value={newExercise.name}
            onChange={(e) =>
              setNewExercise({ ...newExercise, name: e.target.value })
            }
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="カテゴリ（胸、背中など）"
              value={newExercise.category}
              onChange={(e) =>
                setNewExercise({ ...newExercise, category: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="器具（バーベルなど）"
              value={newExercise.equipment}
              onChange={(e) =>
                setNewExercise({ ...newExercise, equipment: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            追加
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="種目を検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-2">
        {filteredExercises.map((exercise) => (
          <div key={exercise.id} className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
            <div className="flex gap-3 mt-1 text-sm text-gray-600">
              {exercise.category && <span>📂 {exercise.category}</span>}
              {exercise.equipment && <span>🏋️ {exercise.equipment}</span>}
            </div>
            {exercise.last_used_at && (
              <p className="text-xs text-gray-500 mt-2">
                最終使用:{" "}
                {new Date(exercise.last_used_at).toLocaleDateString("ja-JP")}
              </p>
            )}
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500">
            {search ? "種目が見つかりません" : "種目を追加してください"}
          </p>
        </div>
      )}
    </div>
  );
}
