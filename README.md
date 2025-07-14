# 動画アノテーションツール

動画再生中に特定のタイミングでアノテーション（状況・推奨行動・理由）を記録するためのWebアプリケーションです。

## 🎥 主な機能

### 動画再生機能
- 複数の動画ファイルの選択と切り替え
- 再生・一時停止・シーク操作
- 現在時刻の表示（HH:MM:SS形式）

### アノテーション機能
- 任意のタイミングでアノテーション追加
- アノテーション編集・更新機能
- 以下の項目を記録：
  - **動画時間**: HH:MM:SS形式（手入力可能）
  - **状況**: 動画内で起きている状況の説明
  - **推奨行動**: 取るべき行動の提案
  - **理由**: 推奨行動の根拠

### データ管理機能
- アノテーション一覧の表示
- JSONL形式でのデータエクスポート
- 既存アノテーションのクリック編集

## 🚀 開発環境セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 動画ファイルの配置
`public/movies/` ディレクトリに動画ファイル（mp4, webm等）を配置してください。

現在のサンプル動画：
- `aaa.mp4`
- `bbb.mp4`
- `ccc.mp4`

### 3. 開発サーバーの起動
```bash
npm run dev
```
ローカル開発サーバーが `http://localhost:5173` で起動します。

## 📦 ビルドとデプロイ

### 開発用コマンド
```bash
# 開発サーバー起動
npm run dev

# TypeScript型チェック
npm run lint

# プロダクション用ビルド
npm run build
```

### GitHub Pagesデプロイ

このプロジェクトは、Private/Public両方のGitHubリポジトリでのデプロイに対応しています。

#### リポジトリタイプの設定（初回のみ）
```bash
# 対話形式でPrivate/Publicを選択
npm run switch-repo-type
```

#### デプロイ実行
```bash
# ビルド + GitHub Pagesへの自動デプロイ
npm run deploy
```

#### アクセスURL
- **Publicリポジトリ**: `https://CyberAgentAILab.github.io/cst-lab/`
- **Privateリポジトリ**: GitHub Pagesが生成する特殊なURL（例: `https://fictional-disco.pages.github.io/`）

#### 手動設定（.envファイル）
```env
# Privateリポジトリの場合
VITE_PUBLIC_REPO=false
VITE_REPO_NAME=cst-lab

# Publicリポジトリの場合
VITE_PUBLIC_REPO=true
VITE_REPO_NAME=cst-lab
```

## 🎯 使用方法

### 基本的な操作手順
1. **動画選択**: ドロップダウンから動画を選択
2. **再生開始**: 「再生」ボタンで動画を開始
3. **アノテーション追加**:
   - 「現在の時間でアノテーション」ボタンをクリック
   - 動画が自動的に一時停止
   - 右側のダイアログに情報を入力
   - 「保存」ボタンで記録
4. **アノテーション編集**: 下部のアノテーション一覧をクリックして編集
5. **データエクスポート**: 「テスト終了」ボタンでJSONLファイルをダウンロード

### アノテーション項目の詳細
- **動画時間**: `HH:MM:SS` 形式で自動入力、手動修正可能
- **状況**: 例）"お客様がロボットの質問に対し短く返答しているだけで、会話が深まらない。"
- **推奨行動**: 例）"「普段はどんな商品をお探しですか？」など、オープンクエスチョンを使って会話を深掘りする。"
- **理由**: 例）"お客様の関心が低いまま一方的に説明を続けると、顧客体験が低下する恐れがあるため。"

## 🔧 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite
- **スタイリング**: インラインCSS
- **デプロイ**: GitHub Pages
- **ビルドツール**: Vite
- **パッケージマネージャー**: npm

## 📁 プロジェクト構成

```
src/
├── App.tsx                     # メインアプリケーション
├── components/
│   ├── VideoPlayer.tsx         # 動画プレイヤーコンポーネント
│   └── AnnotationDialog.tsx    # アノテーション入力ダイアログ
├── types/
│   └── annotation.ts           # TypeScript型定義
└── main.tsx                    # エントリーポイント

public/
└── movies/                     # 動画ファイル配置ディレクトリ
    ├── aaa.mp4
    ├── bbb.mp4
    └── ccc.mp4
```

## 📝 エクスポートデータ形式

JSONLファイル（1行1アノテーション）として出力されます：

```json
{"videoTime":"00:01:23","situation":"お客様が困惑している様子","recommendedAction":"具体的な使用例を示す","reason":"抽象的な説明では理解が困難なため","videoFileName":"テスト動画1","timestamp":"2025-01-01T12:00:00.000Z"}
```

## 📄 ライセンス

[Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/deed)