# Hello World Good-bye Unit - 設計思想書 (Design Philosophy)

> **Version**: 2.1 (合格ライン基準設計)  
> **Last Updated**: 2025年11月28日  
> **Architect**: Grandmaster Game Designer (AGENTS.md Protocol)

---

## 📜 目次

0. [ドキュメントガバナンス](#0-ドキュメントガバナンス)
1. [全体コンセプト](#1-全体コンセプト)
2. [コアゲームループ](#2-コアゲームループ)
3. [難易度曲線と60点の壁](#3-難易度曲線と60点の壁)
4. [リソース管理システム](#4-リソース管理システム)
5. [進行システム](#5-進行システム)
6. [イベントシステム](#6-イベントシステム)
7. [アーキテクチャ設計](#7-アーキテクチャ設計)
8. [バランス調整の哲学](#8-バランス調整の哲学)

---

## 0. ドキュメントガバナンス

### 0.1 役割と適用範囲
- この設計書はゲームバランス、UI、シナリオ、オーディオ、実装規約を統合的に管理する唯一の一次情報源とする。
- `ITEMS_DESIGN.md`、`config/gameBalance.ts`、`data/events/*`、`logic/*` の改定は必ず本章を更新し、差分の根拠を残す。
- 60点ラインに影響する仕様はプレイヤー体験へ直接波及するため、影響分析メモを Pull Request に添付する。

### 0.2 更新ワークフロー
1. 変更目的を Model/View/Controller に分類し、影響するプレイヤー行動を列挙。
2. 期待されるバランスシミュレーションを `scripts/balance-report.ts` で取得し、Before/After を貼付。
3. `logic/effectProcessor.test.ts` と `logic/turnManager.test.ts` を実行し、忘却曲線・カフェイン系の回 regress を検出。
4. UI 仕様が変わる場合は `components/` 配下のデザインタスクと setlist を `DESIGN_PHILOSOPHY.md` に同期。
5. ドキュメント更新後、`docs/PWA_SETUP.md` や `TAURI_SETUP.md` 等の周辺資料との整合性を確認。

### 0.3 クロスファイル依存マップ
| セクション | 参照先ファイル | 同期内容 |
|-------------|----------------|----------|
| 2. コアゲームループ | `logic/turnManager.ts`, `logic/reducer.ts` | ターンフロー、警告システム |
| 3. 難易度曲線 | `logic/handlers/study.ts`, `config/gameBalance.ts` | 知識獲得倍率、閾値 |
| 4. リソース管理 | `config/gameConstants.ts`, `logic/effectProcessor.ts` | HP/SAN/満腹度/カフェイン定数 |
| 6. イベントシステム | `data/events/*`, `logic/eventManager.ts` | 重み付け、cooldown |
| 7. アーキテクチャ設計 | `components/**`, `hooks/**`, `types/**` | FSD 構造、Zustand ストア |

### 0.4 将来編集チェックリスト
- 60点ラインを跨ぐ仕様変更では、視覚的/ログ/バランス/チュートリアルの4視点で差分を検証。
- 新リソースや行動カテゴリを追加する際は、リソース管理ルール (セクション4) に最小-最大レンジを追記。
- 体験至上主義に反する処理 (長時間ブロッキング、音切れ) が疑われる場合、`useGameSound.ts` と `components/OverlayLayer.tsx` を優先監査。
- DLC や将来の After Story 拡張はセクション 11 のロードマップへ必ず追記し、既存難易度を崩さないガードを設置。

---

## 1. 全体コンセプト

### 1.1 ゲームジャンル

**ジャンル**: リソース管理型サバイバルSLG × ビジュアルノベル  
**テーマ**: 「高専の試験期間を生き延びる」

### 1.2 デザインフィロソフィー

```
"60点は到達点ではなく、戦略の起点"
```

このゲームは、**合格ラインの60点**を中心に設計されたリソース管理ゲームです。

#### 3つの設計柱

1. **Experience First (体験至上主義)**
   - プレイヤーの没入感を阻害する要因（ロード時間、カクつき、音声の途切れ）はバグと同等に扱う
   - 全てのUI/UXは「試験前の学生の焦燥感」を演出する

2. **Meaningful Choices (意味のある選択)**
   - 全ての選択肢に明確なトレードオフが存在する
   - 「正解ルート」は存在せず、リソース配分の最適化を追求する

3. **Emergent Narrative (創発的物語)**
   - プレイヤーの行動から物語が生まれる
   - 失敗もまた、語るべきストーリーとなる

### 1.3 ターゲットプレイヤー像

- **Primary**: 高専・理工系大学経験者（共感駆動）
- **Secondary**: リソース管理ゲーム愛好者（最適化駆動）
- **Tertiary**: 学園モノ・試験サバイバル系コンテンツ愛好者

---

## 2. コアゲームループ

### 2.1 基本サイクル

```
┌─────────────────────────────────────┐
│  1. リソース確認 (HP/SAN/金/満腹度)  │
│           ↓                         │
│  2. 行動選択 (学習/社交/休息/労働)   │
│           ↓                         │
│  3. 結果評価 (ステータス変動)        │
│           ↓                         │
│  4. ターン経過 (自然減衰・イベント)   │
│           ↓                         │
│  5. 警告判定 (試験まで残り○日)      │
└─────────────────────────────────────┘
           ↓ (試験日到来)
      【最終判定: 合否決定】
```

### 2.2 勝利条件と敗北条件

#### 勝利条件
- **基本合格**: 総合点900点以上（平均75点相当 + ボーナス）
- **ランクS**: 総合点1800点以上（ほぼ完璧 + 人脈フル活用）

#### 敗北条件
- **HP枯渇**: 過労で病院送り（Game Over: HP）
- **SAN枯渇**: 精神崩壊で自主退学（Game Over: SANITY）
- **試験失敗**: 合格基準未達（Failure）

---

## 3. 難易度曲線と60点の壁

### 3.1 知識獲得の非線形性

```typescript
// logic/handlers/study.ts より
let progressionMultiplier = 1.0;
if (currentScore < KNOWLEDGE_THRESHOLDS.PASSING_LINE) {       // < 60点
  progressionMultiplier = 1.5; // ボーナス（確実に到達可能）
} else if (currentScore < KNOWLEDGE_THRESHOLDS.SAFE_ZONE) {    // 60-80点
  progressionMultiplier = 0.7; // 急峻化（過去問必須）
} else if (currentScore < KNOWLEDGE_THRESHOLDS.PERFECT_ZONE) { // 80-90点
  progressionMultiplier = 0.4; // 激減（人脈+運+完璧コンディション）
} else {                                                       // 90点以上
  progressionMultiplier = 0.15; // ほぼ上がらない
}
```

### 3.2 60点の壁の設計意図

#### Phase 1: 基礎習得期（0-60点）
- **期間**: ゲーム前半（Day 1-5）
- **戦略**: 基礎学習のみで到達可能
- **特徴**: 
  - 学習効率1.5倍ボーナス
  - 忘却曲線の影響小
  - USBメモリは「ギャンブル」（成功率30-48%）

#### Phase 2: 実践応用期（60-80点）
- **期間**: ゲーム中盤（Day 6-10）
- **戦略**: 過去問 + アイテムバフ必須
- **特徴**:
  - 学習効率0.7倍（急峻化）
  - USBメモリが「戦略リソース」に変化（成功率95%）
  - 人脈構築の重要性が増す

#### Phase 3: 高得点域（80-90点+）
- **期間**: ゲーム終盤（Day 11-14）
- **戦略**: 人脈フル活用 + 完璧コンディション + 運
- **特徴**:
  - 学習効率0.4倍（激減）
  - 教授ボーナス（+20%）、先輩リーク（+10%）が必須
  - ランクS到達には「わらしべ長者」戦略が必要

### 3.3 科目難易度の差別化

```typescript
// data/subjects.ts
export const SUBJECTS = {
  ALGO:       { difficulty: 0.7 }, // 最難関（低倍率 = 伸びにくい）
  MATH:       { difficulty: 0.9 }, // やや難
  CIRCUIT:    { difficulty: 1.0 }, // 標準
  HUMANITIES: { difficulty: 1.4 }  // 単位取りやすい（高倍率）
};
```

**設計意図**:
- アルゴリズムは「USB解析成功率のカギ」として位置づけ
- 人間科学は「精神安定剤」として、SAN管理の余裕を生む
- 難易度差が戦略の多様性を生む（どの科目を優先するか？）

---

## 4. リソース管理システム

### 4.1 四大リソース

#### HP（体力: 0-100）
- **役割**: 行動の原動力
- **減少要因**: 学習、労働、カフェイン中毒
- **回復手段**: 休息、食事アイテム
- **ゼロ時**: 病院送り（敗北）

#### SAN（精神力: 0-100）
- **役割**: 判断力の指標
- **減少要因**: 学習、孤独、カフェイン中毒、失敗イベント
- **回復手段**: 休息、社交、メンタルケアアイテム
- **特殊効果**: SAN < 30で「狂気ボーナス」（効率1.3倍、HP消費+10）
- **ゼロ時**: 精神崩壊（敗北）

#### 満腹度（Satiety: 0-100）
- **役割**: 行動コストの可視化
- **減少要因**: 全行動（学習-18、労働-22、社交-10）
- **特殊状態**: 
  - 85以上: 満腹（効率0.9倍）
  - 10以下: 空腹（UI警告のみ、ペナルティなし）
- **設計意図**: 「食事タイミングの戦略性」を生む

#### カフェイン（Caffeine: 0-200）
- **役割**: 学習効率の増幅剤
- **自然減衰**: -15/ターン
- **状態閾値**:
  ```
  0-39:   NORMAL     (効率1.0倍)
  40-99:  AWAKE      (効率1.2倍)
  100-149: ZONE      (効率1.5倍、HP-3/T、SAN-1/T)
  150-200: TOXICITY  (効率2.0倍、HP-12/T、SAN-6/T)
  ```
- **設計意図**: 「短期的爆発力 vs 長期的安定性」のジレンマ

### 4.2 金銭経済

#### 収入源
- **アルバイト**: 基本収入（¥1,500-8,000）
- **イベント報酬**: 教授・先輩からの依頼
- **ハイリスク案件**: フリーランス、闇市場（高額だが危険）

#### 支出先
- **アイテム購入**: 消耗品（¥120-600）、装備（¥1,500-10,800）
- **戦略的投資**: 手土産スイーツ（¥3,500）で人脈構築

#### バランス設計
- **序盤**: 金欠（選択を迫る）
- **中盤**: 余裕（戦略的投資可能）
- **終盤**: 「わかる本」（¥10,800）で最後の賭け

---

## 5. 進行システム

### 5.1 時間システム（7スロット制）

```typescript
enum TimeSlot {
  MORNING = '朝',           // 効率1.2倍
  AM = '午前',              // 教授との遭遇率高
  NOON = '昼',              // カフェイン必須（なければ0.8倍）
  AFTERNOON = '午後',       // 標準
  AFTER_SCHOOL = '放課後',  // 社交最適
  NIGHT = '夜',             // 労働可能
  LATE_NIGHT = '深夜'       // 睡眠負債+1.0、消費0.7倍
}
```

**設計意図**:
- 各時間帯に明確な「得意分野」を持たせる
- 深夜特化戦略（睡眠負債の蓄積）vs 健康管理戦略

### 5.2 忘却曲線システム

```typescript
// config/gameConstants.ts
export const FORGETTING_CONSTANTS = {
  GRACE_PERIOD_TURNS: 8,  // 猶予期間（約1日）
  WARNING_THRESHOLD: 6,   // 警告表示
  DECAY_RATE: 0.03,       // 毎ターン3%減少
  MIN_DECAY: 1,           // 最低-1点
};
```

**実装ロジック**:
```typescript
// logic/turnManager.ts
const turnsSinceStudy = newState.turnCount - lastStudied;
if (turnsSinceStudy > GRACE_PERIOD_TURNS) {
  let decay = Math.floor(currentScore * DECAY_RATE);
  decay = Math.max(decay, MIN_DECAY);
  newScore = Math.max(0, currentScore - decay);
}
```

**設計意図**:
- 「バランスよく復習する」vs「1科目に集中する」の戦略差別化
- UI警告（⚠マーク）で視覚的にプレッシャーを演出

### 5.3 睡眠負債システム

```typescript
// logic/turnManager.ts
if (!isResting) {
  let debtIncrease = 0.2;
  if (timeSlot === TimeSlot.LATE_NIGHT) {
    debtIncrease = 1.0; // 深夜活動でペナルティ大
  }
  state.flags.sleepDebt += debtIncrease;
}
```

**効果**:
- 睡眠負債が蓄積すると、休息時の回復効率が低下
- 「一夜漬け」の代償を表現

---

## 6. イベントシステム

### 6.1 イベントトリガー分類

#### 1. ターン終了イベント（turn_end）
- **発生確率**: 20%（ランダム）
- **種類**: 日常フレーバー、金策、緊急事態
- **設計意図**: 予測不可能性の演出

#### 2. 行動イベント（action_*）
- **professor**: 教授との交渉（出題傾向、過去問交渉）
- **senior**: 先輩との交流（USBメモリ入手、裏情報）
- **friend**: 友人との協力（テスト教え合い、慰め合い）
- **work**: バイトイベント（収入、疲労）

#### 3. 分岐イベント（branching）
- **特徴**: 複数選択肢、成功率による結果分岐
- **リスク分類**: safe / low / mid / high
- **設計意図**: リスク・リターンの可視化

### 6.2 人脈システム（Relationship Tiers）

```typescript
export const REL_TIERS = {
  LOW: 0,     // 顔見知り
  MID: 30,    // 信頼関係（アイテム交換）
  HIGH: 60,   // 親密（重要情報）
  ELITE: 80,  // 運命共同体（核心リーク）
};
```

#### 教授（PROFESSOR）
- **Tier 0-30**: 基礎的な質問対応
- **Tier 30-60**: 出題傾向のヒント
- **Tier 60+**: 弱点科目への直接指導
- **Tier 80+**: 検証済み過去問の提供

#### 先輩（SENIOR）
- **Tier 0-30**: 雑談、軽い手伝い
- **Tier 30-60**: USBメモリ（1個目）
- **Tier 60+**: 秘蔵過去問フォルダ
- **Tier 80+**: 回路理論の完全リーク

#### 友人（FRIEND）
- **Tier 0-30**: 愚痴聞き、軽いSAN回復
- **Tier 30-60**: テスト教え合い
- **Tier 60+**: 深夜ファミレス勉強会
- **Tier 80+**: 共闘（相互バフ）

### 6.3 イベント重み付けシステム

```typescript
export const WEIGHTS = {
  COMMON: 50,     // 1/2確率
  UNCOMMON: 30,   // 1/3確率
  RARE: 15,       // 1/6確率
  LEGENDARY: 5,   // 1/20確率
  ONE_OFF: 100,   // 条件満たせば優先
};
```

**動的重み計算**:
```typescript
// logic/eventManager.ts
const calculateDynamicWeight = (state, event) => {
  let weight = event.weight;
  
  // クールダウン判定
  if (turnsSinceLast < event.coolDownTurns) return 0;
  
  // 最大発生回数判定
  if (stats.count >= event.maxOccurrences) return 0;
  
  // 減衰（同じイベントの連発防止）
  if (event.decay) weight *= Math.pow(event.decay, stats.count);
  
  return weight;
};
```

---

## 7. アーキテクチャ設計

### 7.1 ディレクトリ構造（Feature-Sliced Design）

```
Hello-World-Good-bye-Unit/
├── components/          # Reactコンポーネント（Presentation Layer）
│   ├── ActionPanel.tsx  # 行動選択UI
│   ├── StatusDisplay.tsx # ステータス表示
│   ├── EventDialog.tsx  # イベントモーダル
│   └── ui/              # 汎用UIコンポーネント
├── logic/               # ゲームロジック（Business Logic Layer）
│   ├── reducer.ts       # State管理の中核
│   ├── turnManager.ts   # ターン経過処理
│   ├── eventManager.ts  # イベント選択・実行
│   ├── examEvaluation.ts # 試験判定ロジック
│   └── handlers/        # 行動ハンドラー（学習、休息、社交、労働、アイテム）
├── data/                # ゲームデータ（Data Layer）
│   ├── events/          # イベント定義（教授、先輩、友人、分岐）
│   ├── items.ts         # アイテムマスター
│   ├── subjects.ts      # 科目マスター
│   └── presets/         # Effect Templatesビルダー
├── config/              # バランス調整（Configuration Layer）
│   ├── gameBalance.ts   # 報酬量、閾値、成功率
│   ├── gameConstants.ts # カフェイン、満腹度、忘却曲線
│   └── initialValues.ts # ゲーム初期値
├── types/               # TypeScript型定義
│   ├── state.ts         # GameState型
│   ├── event.ts         # GameEvent型
│   └── enums.ts         # SubjectId, ItemId, TimeSlot等
└── utils/               # ユーティリティ
    ├── rng.ts           # 決定的乱数生成器
    ├── math.ts          # 数値計算
    └── sound.ts         # Web Audio APIラッパー
```

### 7.2 State Management（Zustand + Immer）

```typescript
// hooks/useGameEngine.ts
export const useGameStore = create<GameStore>()(
  immer((set) => ({
    state: getInitialGameState(),
    dispatch: (action) => set((store) => {
      store.state = gameReducer(store.state, action);
    }),
  }))
);
```

**設計思想**:
- **Immutability**: Immer middlewareで不変性を保証
- **Atomic Selectors**: `useStore(state => state.specificValue)` でピンポイント購読
- **予測可能性**: Redux-likeなReducerパターンで状態遷移を明確化

### 7.3 Effect処理の一元化

```typescript
// logic/effectProcessor.ts
export const applyEffect = (
  state: GameState, 
  effect: GameEventEffect
): { newState: GameState; messages: string[] } => {
  // HP, SAN, 知識, 人脈, 所持金, アイテム, バフなど
  // 全てのステータス変動をこの関数で処理
  // ⇒ ログ生成も自動化
};
```

**利点**:
- バランス調整時、`gameBalance.ts`を変更するだけで全体に反映
- デバッグが容易（ログ出力が統一される）
- テストコードが書きやすい

---

## 8. バランス調整の哲学

### 8.1 バランス調整の5原則

#### 1. 数値は定数ファイルで一元管理
```typescript
// config/gameBalance.ts
export const KNOWLEDGE_GAINS = {
  TINY: 4,
  SMALL: 7,
  MEDIUM: 12,
  LARGE: 18,
  HUGE: 25,
};
```
- ハードコーディング禁止
- 全ての数値に名前を付ける

#### 2. Soft Cap方式の採用
```typescript
// utils/common.ts
export const applySoftCap = (value: number, asymptote: number): number => {
  // 指数関数的減衰でキャップに漸近
  return asymptote * (1 - Math.exp(-value / asymptote));
};
```
- 「Hard Capの壁」を避ける
- バフスタックの暴走を防ぐ

#### 3. 期待値計算の透明性
```typescript
// USB期待値（アルゴ60点）
// 成功率95% × 知識+20 = +19点
// 失敗率5% × SAN-20 = -1SAN（無視できる）
// ⇒ ほぼノーリスクで運用可能
```

#### 4. プレイテストデータの記録
- 想定プレイ時間: 30-45分
- クリア率: 60-70%（初見）
- ランクS到達率: 10-15%（上級者）

#### 5. フィードバックループの短縮
- ステータス変動は即座に可視化
- 警告システムで「詰み」を事前検知
- ログウィンドウで因果関係を追跡可能

### 8.2 調整履歴（Version History）

#### v2.1 (2025-11-28) - 合格ライン基準設計
- **USB成功率**: アルゴ60点で確定成功（95%）に変更
- **VERIFIED_PAST_PAPERS**: 成功率95% → 98%に向上
- **知識獲得曲線**: 60点を境に急峻化（1.5倍 → 0.7倍）
- **視覚的フィードバック**: 60点ラインのマーカー追加予定

#### v2.0 - カフェインシステム刷新
- **満腹度システム**: 空腹ペナルティ廃止、満腹ペナルティ導入
- **カフェイン減衰**: 10mg/T → 15mg/Tに増加
- **忘却曲線**: 猶予期間を6T → 8Tに延長

#### v1.5 - 人脈システム強化
- **友好度上昇**: 全体的に上げにくく調整（LARGE: 12 → 10）
- **先輩関係**: 基礎上昇量を大幅増（5 → 12）
- **教授イベント**: 関係値80+で検証済み過去問確定入手

### 8.3 未実装・将来的な拡張

#### DLC構想: "After Story"
- 試験後の就活編
- 留年ルート（敗北から継続）
- マルチエンディング（ランクS+の先）

#### システム改善案
- オートセーブ機能（LocalStorage → IndexedDB移行）
- Achievements（実績システム）
- Statistics（統計情報の可視化）

---

## 9. 技術スタック詳細

### 9.1 採用技術

- **Frontend**: React 18 + TypeScript 5 (Strict Mode)
- **State**: Zustand + Immer
- **Validation**: Zod（シナリオデータ検証）
- **Audio**: Web Audio API（カスタム実装）
- **Storage**: IndexedDB（セーブデータ）
- **Animation**: CSS Transitions + Framer Motion（予定）
- **Build**: Vite
- **Deploy**: GitHub Pages

### 9.2 パフォーマンス最適化

#### 1. メモ化戦略
```typescript
// コンポーネントレベル
export const StatusDisplay = React.memo(({ state }) => { ... });

// Selectorレベル
const hp = useGameStore(state => state.hp);
```

#### 2. Lazy Loading
```typescript
// 動的インポート
const ShopModal = lazy(() => import('./components/ShopModal'));
```

#### 3. 決定的乱数生成器（RNG）
```typescript
// utils/rng.ts
// Mulberry32アルゴリズムでシード固定
// ⇒ リプレイ機能の実装が容易
```

### 9.3 アクセシビリティ（a11y）

- **ARIA Attributes**: 全てのボタンに `aria-label`
- **Keyboard Navigation**: Tab順序の最適化
- **Screen Reader**: ステータス変動をアナウンス
- **Reduced Motion**: `prefers-reduced-motion` 対応

---

## 10. 設計思想の根幹

### 10.1 なぜ「60点の壁」なのか？

1. **リアリティ**: 実際の高専生の感覚を再現
2. **目標の明確化**: 「まず60点」という短期目標
3. **戦略の転換点**: ギャンブル → 戦略への質的変化
4. **視覚的演出**: グラデーション変化で達成感を可視化

### 10.2 なぜリソース管理なのか？

```
試験勉強 = 有限リソース（時間/体力/精神力）の最適配分問題
```

- 単なる「勉強ゲー」ではなく、**経営シミュレーション**の文脈で設計
- プレイヤーは「自分という企業のCEO」として意思決定する
- 失敗は「戦略ミス」であり、「努力不足」ではない

### 10.3 なぜイベントシステムなのか？

```
予測不可能性こそが、試験期間のリアル
```

- 完全情報ゲームでは「最適解」が存在してしまう
- ランダムイベントは「運」ではなく「リスク管理能力」を試す
- 失敗時の言い訳（「あのイベントさえなければ...」）がストーリーを生む

---

## 11. 今後の開発方針

### 11.1 短期目標（v2.2）

- [ ] 60点ラインマーカーの実装
- [ ] Knowledge Barグラデーション変化
- [ ] 警告システムの強化（アルゴ60点未満でUSB不安定警告）
- [ ] ログメッセージの60点閾値対応完全化

### 11.2 中期目標（v3.0）

- [ ] サウンドエフェクトの拡充
- [ ] アニメーション演出（Framer Motion導入）
- [ ] モバイル最適化（タッチジェスチャー）
- [ ] PWA対応（オフラインプレイ）

### 11.3 長期目標（v4.0+）

- [ ] マルチエンディング実装
- [ ] リプレイ機能（RNGシード保存）
- [ ] コミュニティ投稿イベント機能
- [ ] 多言語対応（i18next）

---

## 12. 謝辞と参考文献

### インスピレーション源

- **Papers, Please**: 限られたリソースでの意思決定
- **Darkest Dungeon**: ストレス管理システム
- **This War of Mine**: 倫理的ジレンマとサバイバル
- **高専あるある**: リアルな試験期間の過酷さ

### 設計参考資料

- Mark Brown『Game Maker's Toolkit』- Difficulty Curves
- Raph Koster『A Theory of Fun』- 学習曲線
- Jesse Schell『The Art of Game Design』- レンズ理論

---

**Designed with 💀 by Grandmaster Game Architect**  
**"In the darkness of despair, there is always a glimmer of hope... or at least a USB drive."**
