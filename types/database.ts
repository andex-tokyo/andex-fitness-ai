export type Unit = 'kg' | 'lb'
export type Goal = 'cutting' | 'hypertrophy' | 'strength'
export type RpeInputMode = 'all_sets' | 'last_set_only'
export type Intent = 'time_saving' | 'weight' | 'volume' | 'form'

export interface Profile {
  id: string
  email: string | null
  unit: Unit
  goal: Goal
  default_duration: number
  rpe_input_mode: RpeInputMode
  rpe_quick_chips: number[]
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  user_id: string
  name: string
  category: string | null
  equipment: string | null
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  date: string
  duration: number | null
  intent: Intent | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SessionExercise {
  id: string
  session_id: string
  exercise_id: string
  order_index: number
  is_plan: boolean
  sets: number | null
  reps: number | null
  weight: number | null
  rest_seconds: number | null
  target_rpe: number | null
  actual_rpe: number | null
  notes: string | null
  created_at: string
  updated_at: string
  exercise?: Exercise
}

export interface SessionSet {
  id: string
  session_exercise_id: string
  set_number: number
  reps: number | null
  weight: number | null
  rpe: number | null
  created_at: string
}

export interface AIPlanRequest {
  goal: Goal
  unit: Unit
  duration: number
  intent: Intent
  recent_sessions?: Session[]
  user_exercises?: Exercise[]
}

export interface AIPlanExercise {
  exercise_name: string
  sets: number
  reps: number
  weight: number | null
  rest_seconds: number
  target_rpe: number
  notes: string
}

export interface AIPlanResponse {
  exercises: AIPlanExercise[]
  overall_notes: string
}
