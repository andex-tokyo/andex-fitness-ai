-- ユーザープロフィール
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'lb')),
  goal TEXT DEFAULT 'hypertrophy' CHECK (goal IN ('cutting', 'hypertrophy', 'strength')),
  default_duration INTEGER DEFAULT 30,
  rpe_input_mode TEXT DEFAULT 'all_sets' CHECK (rpe_input_mode IN ('all_sets', 'last_set_only')),
  rpe_quick_chips INTEGER[] DEFAULT ARRAY[3, 5, 7, 8, 9],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 種目マスター
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- 胸、背中、脚、肩、腕、体幹など
  equipment TEXT, -- バーベル、ダンベル、マシン、自重など
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- セッション
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  duration INTEGER, -- 分
  intent TEXT, -- time_saving, weight, volume, form
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- セッション種目（Plan / Actual）
CREATE TABLE session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  is_plan BOOLEAN DEFAULT FALSE, -- TRUE = Plan, FALSE = Actual
  sets INTEGER,
  reps INTEGER,
  weight NUMERIC(6,2),
  rest_seconds INTEGER,
  target_rpe INTEGER,
  actual_rpe INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- セット詳細（各セットごとのRPE記録用）
CREATE TABLE session_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_exercise_id UUID REFERENCES session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight NUMERIC(6,2),
  rpe INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS（Row Level Security）の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_sets ENABLE ROW LEVEL SECURITY;

-- profiles のポリシー
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- exercises のポリシー
CREATE POLICY "Users can view own exercises" ON exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercises" ON exercises FOR DELETE USING (auth.uid() = user_id);

-- sessions のポリシー
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

-- session_exercises のポリシー
CREATE POLICY "Users can view own session exercises" ON session_exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_exercises.session_id AND sessions.user_id = auth.uid())
);
CREATE POLICY "Users can insert own session exercises" ON session_exercises FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_exercises.session_id AND sessions.user_id = auth.uid())
);
CREATE POLICY "Users can update own session exercises" ON session_exercises FOR UPDATE USING (
  EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_exercises.session_id AND sessions.user_id = auth.uid())
);
CREATE POLICY "Users can delete own session exercises" ON session_exercises FOR DELETE USING (
  EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_exercises.session_id AND sessions.user_id = auth.uid())
);

-- session_sets のポリシー
CREATE POLICY "Users can view own session sets" ON session_sets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM session_exercises se
    JOIN sessions s ON s.id = se.session_id
    WHERE se.id = session_sets.session_exercise_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own session sets" ON session_sets FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM session_exercises se
    JOIN sessions s ON s.id = se.session_id
    WHERE se.id = session_sets.session_exercise_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own session sets" ON session_sets FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM session_exercises se
    JOIN sessions s ON s.id = se.session_id
    WHERE se.id = session_sets.session_exercise_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete own session sets" ON session_sets FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM session_exercises se
    JOIN sessions s ON s.id = se.session_id
    WHERE se.id = session_sets.session_exercise_id AND s.user_id = auth.uid()
  )
);

-- 自動的に updated_at を更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_exercises_updated_at BEFORE UPDATE ON session_exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- インデックス
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_last_used ON exercises(user_id, last_used_at DESC);
CREATE INDEX idx_sessions_user_id_date ON sessions(user_id, date DESC);
CREATE INDEX idx_session_exercises_session_id ON session_exercises(session_id);
CREATE INDEX idx_session_sets_session_exercise_id ON session_sets(session_exercise_id);
