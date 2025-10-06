-- デフォルト種目を追加する関数
CREATE OR REPLACE FUNCTION create_default_exercises_for_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO exercises (user_id, name, category, equipment) VALUES
    (user_id, 'ベンチプレス', '胸', 'バーベル'),
    (user_id, 'ラットプルダウン', '背中', 'マシン'),
    (user_id, 'スクワット', '脚', 'バーベル'),
    (user_id, 'デッドリフト', '背中', 'バーベル'),
    (user_id, 'プランク', '体幹', '自重'),
    (user_id, 'サイドレイズ', '肩', 'ダンベル')
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新規ユーザー登録時にデフォルト種目を自動作成するトリガー
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- プロフィール作成
  INSERT INTO profiles (id, email, unit, goal, default_duration, rpe_input_mode, rpe_quick_chips)
  VALUES (
    NEW.id,
    NEW.email,
    'kg',
    'hypertrophy',
    30,
    'all_sets',
    ARRAY[3, 5, 7, 8, 9]
  )
  ON CONFLICT (id) DO NOTHING;

  -- デフォルト種目作成
  PERFORM create_default_exercises_for_user(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersテーブルにトリガーを設定
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
