"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Calendar, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

interface SessionExercise {
  id: string;
  exercise: {
    name: string;
  };
  sets: number;
  reps: number;
  weight: number | null;
  rest_seconds: number;
  target_rpe: number;
  actual_rpe: number | null;
  notes: string;
  is_plan: boolean;
}

interface Session {
  id: string;
  date: string;
  duration: number;
  intent: string;
  notes: string;
  session_exercises: SessionExercise[];
}

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadSession();
  }, [params.id]);

  async function loadSession() {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        *,
        session_exercises:session_exercises(
          *,
          exercise:exercises(name)
        )
      `,
      )
      .eq("id", params.id)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setSession(data as Session);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <p className="text-gray-500">セッションが見つかりません</p>
      </div>
    );
  }

  const intentLabels: Record<string, string> = {
    time_saving: "時短",
    weight: "重量",
    volume: "ボリューム",
    form: "フォーム",
  };

  const actualExercises = session.session_exercises?.filter(
    (ex) => !ex.is_plan,
  );
  const planExercises = session.session_exercises?.filter((ex) => ex.is_plan);
  const exercisesToShow =
    actualExercises && actualExercises.length > 0
      ? actualExercises
      : planExercises;

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/history")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">セッション詳細</h1>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">
            {new Date(session.date).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="flex gap-4 text-sm text-gray-600">
          {session.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {session.duration}分
            </div>
          )}
          {session.intent && (
            <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
              {intentLabels[session.intent] || session.intent}
            </div>
          )}
        </div>

        {session.notes && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-700">{session.notes}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">種目</h2>

        {exercisesToShow && exercisesToShow.length > 0 ? (
          exercisesToShow.map((ex, index) => (
            <div key={ex.id} className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">
                {index + 1}. {ex.exercise.name}
              </h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">セット:</span>{" "}
                  <span className="font-medium">{ex.sets}</span>
                </div>
                <div>
                  <span className="text-gray-600">回数:</span>{" "}
                  <span className="font-medium">{ex.reps}</span>
                </div>
                {ex.weight !== null && (
                  <div>
                    <span className="text-gray-600">重量:</span>{" "}
                    <span className="font-medium">{ex.weight}kg</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">休憩:</span>{" "}
                  <span className="font-medium">{ex.rest_seconds}秒</span>
                </div>
                {ex.target_rpe && (
                  <div>
                    <span className="text-gray-600">目標RPE:</span>{" "}
                    <span className="font-medium">{ex.target_rpe}</span>
                  </div>
                )}
                {ex.actual_rpe && (
                  <div>
                    <span className="text-gray-600">実際RPE:</span>{" "}
                    <span className="font-medium">{ex.actual_rpe}</span>
                  </div>
                )}
              </div>

              {ex.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{ex.notes}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500">種目がありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
