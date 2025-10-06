# セットアップガイド

## 1. Supabaseのセットアップ

### ステップ1: Supabaseダッシュボードでスキーマを適用

1. [Supabase Dashboard](https://supabase.com/dashboard/project/rqropblzoyyvpkesgjxv) にアクセス
2. 左メニューから **SQL Editor** を選択
3. **New Query** をクリック
4. `supabase/schema.sql` の内容をコピー＆ペースト
5. **Run** をクリックしてスキーマを適用

### ステップ2: Row Level Security (RLS) の確認

スキーマ適用後、以下のテーブルでRLSが有効になっていることを確認：
- profiles
- exercises
- sessions
- session_exercises
- session_sets

## 2. ローカル開発環境のセットアップ

### 環境変数の確認

`.env.local` ファイルが正しく設定されていることを確認：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4o-mini
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 3. 動作確認

### アカウント作成

1. `/login` ページでアカウントを作成
2. メール確認（開発環境ではSupabaseダッシュボードの **Authentication > Users** で確認可能）

### 初回セッション

1. ログイン後、「セッション開始」をクリック
2. 時間と意図を選択
3. AIメニューが生成されることを確認

## トラブルシューティング

### スキーマエラーが発生する場合

Supabase SQL Editorで以下を実行してテーブルを削除してから再度スキーマを適用：

```sql
DROP TABLE IF EXISTS session_sets CASCADE;
DROP TABLE IF EXISTS session_exercises CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

### OpenAI APIエラーが発生する場合

1. APIキーが正しいか確認
2. OpenAIアカウントに残高があるか確認
3. モデル名が正しいか確認（`gpt-4o-mini` または `gpt-4o`）

### 認証エラーが発生する場合

1. Supabase URLとAnon Keyが正しいか確認
2. Supabaseダッシュボードの **Settings > API** で値を再確認
