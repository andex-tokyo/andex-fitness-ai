-- 既存のユーザー全員にデフォルト種目を追加
INSERT INTO exercises (user_id, name, category, equipment)
SELECT
  u.id,
  e.name,
  e.category,
  e.equipment
FROM auth.users u
CROSS JOIN (
  VALUES
    ('ベンチプレス', '胸', 'バーベル'),
    ('ラットプルダウン', '背中', 'マシン'),
    ('スクワット', '脚', 'バーベル'),
    ('デッドリフト', '背中', 'バーベル'),
    ('プランク', '体幹', '自重'),
    ('サイドレイズ', '肩', 'ダンベル')
) AS e(name, category, equipment)
ON CONFLICT (user_id, name) DO NOTHING;
