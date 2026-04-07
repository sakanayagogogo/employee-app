# 技術スタック概要 (Technology Stack)

本プロジェクト（employee-app）で使用されている主要な技術スタックをまとめました。

## 1. フロントエンド (Frontend)
- **Framework**: [Next.js](https://nextjs.org/) (v16.1.6 - App Router)
- **UI Library**: [React](https://reactjs.org/) (v19.2.3)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4.0)
- **Icons/Components**: Heroicons (SVGベース), Lucide-like custom SVG icons
- **State Management**: React Hooks (useState, useEffect, useMemo), Context API (`AuthContext`)

## 2. バックエンド & API (Backend)
- **Framework**: Next.js API Routes (Route Handlers)
- **Auth**:
  - [jose](https://github.com/panva/jose) (JWTの生成・検証)
  - [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (パスワードハッシュ化)
- **Validation**: [Zod](https://zod.dev/) (スキーマ定義および入力バリデーション)
- **Role Based Access Control (RBAC)**: カスタム実装 (`lib/rbac.ts`) による権限管理（HQ_ADMIN, STORE_ADMIN, GENERAL）

## 3. データベース (Database)
- **Engine**: [PostgreSQL](https://www.postgresql.org/)
- **Driver**: `pg` (node-postgres)
- **Management**: Raw SQL queries (SQLを直接記述する柔軟な設計)
- **Features**: トランザクション管理、リレーションシップ、ON DELETE CASCADE等

## 4. インフラ & その他 (Infrastructure & Others)
- **PWA**: `next-pwa` によるプログレッシブウェブアプリ対応
- **Date Handling**: カスタムユーティリティ (`lib/date.ts`)
- **Audit Logs**: 操作ログの記録機能 (`lib/audit.ts`)
- **Dev Tools**: ESLint, PostCSS

## 5. 主要なライブラリ構成
| カテゴリ | ライブラリ | 用途 |
| :--- | :--- | :--- |
| コア | `next`, `react`, `typescript` | アプリケーション基盤 |
| デザイン | `tailwindcss`, `postcss` | モダンでレスポンシブなUI設計 |
| セキュリティ | `jose`, `bcryptjs` | セキュアな認証基盤 |
| バリデーション | `zod` | 型安全なデータ検証 |
| DBアクセス | `pg` | PostgreSQLへの接続 |
| ユーティリティ | `dotenv`, `csv-parse` | 環境変数管理、CSVインポート |
| モバイル | `next-pwa` | インストール可能なWebアプリ化 |

---

このスタックは、**「型安全性の確保」「高いパフォーマンス」「保守性の高いクリーンな設計」**を重視して選定されています。
特にTailwind CSS 4.0を採用することで、高速かつ柔軟なデザインシステムを実現しています。
