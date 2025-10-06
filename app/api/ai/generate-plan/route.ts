import OpenAI from "openai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Intent, Goal, Unit } from "@/types/database";

// Zodスキーマ定義
const ExerciseSchema = z.object({
  exercise_name: z.string(),
  sets: z.number(),
  reps: z.number(),
  weight: z.number().nullable(),
  rest_seconds: z.number(),
  target_rpe: z.number().min(1).max(10),
  notes: z.string(),
});

const WorkoutPlanSchema = z.object({
  exercises: z.array(ExerciseSchema),
  overall_notes: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { duration, intent }: { duration: number; intent: Intent } =
      await request.json();

    // プロフィール取得または作成
    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      // プロフィールが存在しない場合は作成
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          unit: "kg",
          goal: "hypertrophy",
          default_duration: 30,
          rpe_input_mode: "all_sets",
          rpe_quick_chips: [3, 5, 7, 8, 9],
        })
        .select()
        .single();

      if (profileError) {
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 },
        );
      }
      profile = newProfile;
    }

    // 最近のセッション取得
    const { data: recentSessions } = await supabase
      .from("sessions")
      .select(
        `
        *,
        session_exercises:session_exercises(
          *,
          exercise:exercises(*)
        )
      `,
      )
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(3);

    // ユーザーの種目リストを取得
    const { data: userExercises } = await supabase
      .from("exercises")
      .select("name, category, equipment")
      .eq("user_id", user.id)
      .order("last_used_at", { ascending: false, nullsFirst: false });

    // AI プロンプト作成
    const prompt = buildPrompt({
      goal: profile.goal,
      unit: profile.unit,
      duration,
      intent,
      recentSessions: recentSessions || [],
      userExercises: userExercises || [],
    });

    // OpenAI Responses API呼び出し
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const model = process.env.OPENAI_MODEL || "gpt-5-mini";

    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "あなたは経験豊富なフィットネストレーナーです。ユーザーの目標、利用可能時間、トレーニング意図、過去の履歴を考慮して、最適なトレーニングメニューを提案してください。必ずユーザーが登録している種目リストの中から選択し、種目名は完全一致で指定してください。JSON形式で回答してください。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      text: {
        format: { type: "json_object" },
      },
    });

    // レスポンスから出力テキストを取得してパース
    const aiResponse = JSON.parse(response.output_text) as z.infer<
      typeof WorkoutPlanSchema
    >;

    // AI生成結果のみを返す（DB保存はしない）
    return NextResponse.json({
      plan: aiResponse,
      duration,
      intent,
    });
  } catch (error: any) {
    console.error("Error generating plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate plan" },
      { status: 500 },
    );
  }
}

function buildPrompt({
  goal,
  unit,
  duration,
  intent,
  recentSessions,
  userExercises,
}: {
  goal: Goal;
  unit: Unit;
  duration: number;
  intent: Intent;
  recentSessions: any[];
  userExercises: any[];
}) {
  const goalText = {
    cutting: "減量（高回数、短休憩）",
    hypertrophy: "筋肥大（中回数、中休憩）",
    strength: "筋力向上（低回数、長休憩）",
  }[goal];

  const intentText = {
    time_saving: "時短優先（種目を少なく、効率的に）",
    weight: "重量重視（高負荷、低回数）",
    volume: "ボリューム重視（多セット）",
    form: "フォーム優先（軽めの重量、RPE低め）",
  }[intent];

  let recentHistory = "";
  if (recentSessions.length > 0) {
    recentHistory = "\n\n直近のトレーニング履歴（重量の参考にしてください）:\n";
    recentSessions.forEach((s: any, idx: number) => {
      recentHistory += `${idx + 1}. ${s.date}:\n`;
      if (s.session_exercises) {
        s.session_exercises.forEach((se: any) => {
          if (se.exercise?.name) {
            recentHistory += `  - ${se.exercise.name}: ${se.sets}セット×${se.reps}回`;
            if (se.weight) {
              recentHistory += ` @ ${se.weight}${unit}`;
            }
            recentHistory += "\n";
          }
        });
      }
    });
  }

  let availableExercises = "";
  if (userExercises.length > 0) {
    availableExercises =
      "\n\n利用可能な種目リスト（exercise_nameは必ずこのリストから完全一致で選択してください）:\n";
    userExercises.forEach((ex: any) => {
      availableExercises += `- ${ex.name}\n`;
    });
  }

  return `以下の条件でトレーニングメニューを提案してください。

## ユーザー情報
- 目標: ${goalText}
- 使用単位: ${unit}
- 利用可能時間: ${duration}分
- 今回の意図: ${intentText}
${availableExercises}${recentHistory}

## メニュー作成ガイドライン
1. **種目選択の必須条件**:
   - exercise_nameは上記の「利用可能な種目リスト」から一字一句そのままコピーして使用してください
   - 括弧や追加情報を付け加えないでください
   - 例: リストに「ベンチプレス」とある場合、「ベンチプレス (胸) [バーベル]」ではなく「ベンチプレス」と記載
2. **種目数**: 時間に応じて3〜5種目を選択
3. **部位バランス**: 連続する種目で同じ部位を避け、全身のバランスを考慮
4. **セット数・レップ数**: 目標と意図に応じて適切に設定
   - 減量: 高回数（12-15レップ）、短休憩（60-90秒）
   - 筋肥大: 中回数（8-12レップ）、中休憩（90-120秒）
   - 筋力向上: 低回数（4-6レップ）、長休憩（180-240秒）
5. **RPE設定**: 目標に応じて適切なRPE（1-10）を設定
   - フォーム優先: RPE 6-7
   - 通常: RPE 7-8
   - 重量重視: RPE 8-9
6. **重量**:
   - 履歴に同じ種目があれば、その重量を基準に適切な重量を提案してください
   - **履歴がない場合は安全第一で非常に軽い重量を提案してください**
     - バーベル種目（スクワット、ベンチプレス、デッドリフト）: 20kg（バーのみ）
     - ダンベル種目: 5-10kg
     - マシン種目: 10-20kg
   - どの目的（重量重視含む）でも、初回は必ずフォーム確認のため軽めの重量から開始
   - 完全に不明な場合のみnullを設定してください
7. **reps**: 必ず数値で返してください（文字列の範囲指定は不可）
8. **ノート**: 各種目に簡潔なアドバイスを記載

## 回答形式
以下のJSON形式で回答してください：

{
  "exercises": [
    {
      "exercise_name": "種目名（リストから完全一致でコピー）",
      "sets": 4,
      "reps": 10,
      "weight": null,
      "rest_seconds": 90,
      "target_rpe": 8,
      "notes": "種目固有のアドバイス"
    }
  ],
  "overall_notes": "メニュー全体に対する総合的なアドバイス"
}`;
}
