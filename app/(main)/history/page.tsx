import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessions } = await supabase
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
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">履歴</h1>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => {
            const actualExercises =
              (session.session_exercises as any[])?.filter(
                (ex) => !ex.is_plan,
              ) || [];
            const exerciseNames = actualExercises
              .map((ex) => ex.exercise?.name)
              .filter(Boolean)
              .slice(0, 3)
              .join(", ");

            return (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {new Date(session.date).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {session.duration && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <Clock className="w-4 h-4" />
                      {session.duration}分
                    </div>
                  )}
                </div>
                <p className="text-gray-700 text-sm">
                  {exerciseNames || "種目なし"}
                  {actualExercises.length > 3 &&
                    ` 他${actualExercises.length - 3}種目`}
                </p>
                {session.notes && (
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                    {session.notes}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">まだセッションがありません</p>
          <Link
            href="/session/start"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            セッションを開始
          </Link>
        </div>
      )}
    </div>
  );
}
