import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Intent } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      duration,
      intent,
      plan,
    }: {
      duration: number;
      intent: Intent;
      plan: {
        exercises: Array<{
          exercise_name: string;
          sets: number;
          reps: number;
          weight: number | null;
          rest_seconds: number;
          target_rpe: number;
          notes: string;
        }>;
        overall_notes: string;
      };
    } = await request.json();

    // セッション作成
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        date: new Date().toISOString().split("T")[0],
        duration,
        intent,
        notes: plan.overall_notes || "",
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // 種目とPlan作成
    for (let i = 0; i < plan.exercises.length; i++) {
      const ex = plan.exercises[i];

      // 種目を取得または作成
      let { data: exercise } = await supabase
        .from("exercises")
        .select("*")
        .eq("user_id", user.id)
        .eq("name", ex.exercise_name)
        .single();

      if (!exercise) {
        const { data: newExercise } = await supabase
          .from("exercises")
          .insert({
            user_id: user.id,
            name: ex.exercise_name,
            last_used_at: new Date().toISOString(),
          })
          .select()
          .single();
        exercise = newExercise;
      }

      if (exercise) {
        // Plan作成
        await supabase.from("session_exercises").insert({
          session_id: session.id,
          exercise_id: exercise.id,
          order_index: i,
          is_plan: true,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          rest_seconds: ex.rest_seconds,
          target_rpe: ex.target_rpe,
          notes: ex.notes,
        });
      }
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error("Error saving session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save session" },
      { status: 500 },
    );
  }
}
