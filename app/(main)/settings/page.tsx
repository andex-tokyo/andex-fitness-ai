"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { Profile } from "@/types/database";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
    } else {
      // プロフィールがない場合は作成
      const newProfile: Partial<Profile> = {
        id: user.id,
        email: user.email,
        unit: "kg",
        goal: "hypertrophy",
        default_duration: 30,
        rpe_input_mode: "all_sets",
        rpe_quick_chips: [3, 5, 7, 8, 9],
      };
      await supabase.from("profiles").insert(newProfile);
      setProfile(newProfile as Profile);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        unit: profile.unit,
        goal: profile.goal,
        default_duration: profile.default_duration,
        rpe_input_mode: profile.rpe_input_mode,
        rpe_quick_chips: profile.rpe_quick_chips,
      })
      .eq("id", profile.id);

    if (error) {
      alert("保存に失敗しました");
    } else {
      alert("保存しました");
    }
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">設定</h1>

      <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            単位
          </label>
          <select
            value={profile.unit}
            onChange={(e) =>
              setProfile({ ...profile, unit: e.target.value as any })
            }
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="kg">キログラム (kg)</option>
            <option value="lb">ポンド (lb)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            目標
          </label>
          <select
            value={profile.goal}
            onChange={(e) =>
              setProfile({ ...profile, goal: e.target.value as any })
            }
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="cutting">減量</option>
            <option value="hypertrophy">筋肥大</option>
            <option value="strength">筋力向上</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            デフォルト時間（分）
          </label>
          <input
            type="number"
            value={profile.default_duration}
            onChange={(e) =>
              setProfile({
                ...profile,
                default_duration: parseInt(e.target.value),
              })
            }
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RPE入力方式
          </label>
          <select
            value={profile.rpe_input_mode}
            onChange={(e) =>
              setProfile({ ...profile, rpe_input_mode: e.target.value as any })
            }
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all_sets">各セットごと</option>
            <option value="last_set_only">最終セットのみ</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
      >
        <LogOut className="w-5 h-5" />
        ログアウト
      </button>
    </div>
  );
}
