import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, TrendingUp } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // プロフィール取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 最近のセッション取得
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(5);

  // 今月のセッション数を取得
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const { count: monthlyCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("date", firstDayOfMonth);

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">こんにちは！</h1>
        <p className="text-gray-600">
          目標:{" "}
          {profile?.goal === "cutting"
            ? "減量"
            : profile?.goal === "hypertrophy"
              ? "筋肥大"
              : "筋力向上"}
        </p>
      </div>

      <div className="bg-indigo-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              今月のトレーニング
            </h2>
            <p className="text-3xl font-bold text-indigo-600">
              {monthlyCount || 0}回
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          最近のセッション
        </h2>
        {sessions && sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">
                    {new Date(session.date).toLocaleDateString("ja-JP")}
                  </span>
                  <span className="text-sm text-gray-600">
                    {session.duration}分
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            まだセッションがありません
          </p>
        )}
      </div>

      <Link
        href="/session/start"
        className="block w-full bg-indigo-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
      >
        セッションを開始
      </Link>
    </div>
  );
}
