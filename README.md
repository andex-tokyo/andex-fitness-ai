# Andex Fitness AI

ジム記録 × AIメニュー提案アプリ

## 概要

Andex Fitness AIは、トレーニングを簡単に記録し、その履歴をもとにAI（OpenAI GPT-4）が次回のトレーニングメニューを自動提案するWebアプリです。

## 主な機能

### ✨ コア機能

- **AIメニュー提案**: 目標・時間・意図に基づいてAIが最適なトレーニングメニューを生成
- **簡単記録**: 最小タップで重量・回数・RPEを記録
- **RPE入力**: 1-10のスライダー＋クイックチップで直感的に記録
- **履歴管理**: セッション履歴を時系列で確認

### 🎯 設定機能

- 目標設定（減量/筋肥大/筋力向上）
- 単位設定（kg/lb）
- デフォルト時間設定
- RPE入力方式（各セット/最終セットのみ）

### 📱 モバイル対応

- SPファースト設計
- PWA対応（ホーム画面に追加可能）
- 片手操作に最適化されたUI

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **AI**: OpenAI gpt-5-mini
- **UI**: Lucide Icons

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd andex-fitness-ai
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local.example` を `.env.local` にコピーして、必要な環境変数を設定してください。

```bash
cp .env.local.example .env.local
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5-mini
```

※ `OPENAI_MODEL`は省略可能です。デフォルトは`gpt-5-mini`です。他のモデル（例：`gpt-4o`、`gpt-4-turbo`など）に変更できます。

### 4. Supabaseのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. `supabase/schema.sql` のSQLを実行してテーブルを作成
3. Supabase URLとAnon Keyを `.env.local` に設定

### 5. OpenAI APIキーの取得

1. [OpenAI Platform](https://platform.openai.com)でAPIキーを取得
2. APIキーを `.env.local` に設定

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## データベーススキーマ

### profiles

ユーザープロフィール情報

### exercises

種目マスター

### sessions

トレーニングセッション

### session_exercises

セッション内の種目（Plan/Actual）

### session_sets

各セットの詳細記録

詳細は `supabase/schema.sql` を参照してください。

## 使い方

### 初回利用

1. アカウントを作成してログイン
2. 設定画面で目標・単位・デフォルト時間を設定
3. セッション開始から初回トレーニングを記録

### セッションの流れ

1. **セッション開始**: 時間（20/30/45/60分）と意図（時短/重量/ボリューム/フォーム）を選択
2. **AIメニュー生成**: 履歴と設定をもとにAIがメニューを提案
3. **実行・記録**: Planを基に重量・回数・RPEを調整して保存
4. **履歴確認**: セッション履歴から進捗を振り返り

### RPE（Rate of Perceived Exertion）

1-10のスケールで運動強度を記録：

- RPE 1-4: 楽
- RPE 5-6: 普通〜ややきつい
- RPE 7-8: きつい〜かなりきつい
- RPE 9-10: 非常にきつい〜限界

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)でプロジェクトをインポート
2. 環境変数を設定
3. デプロイ

```bash
npm run build
```

## ライセンス

MIT

## 作者

Andex Fitness AI チーム
