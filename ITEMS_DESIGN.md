# アイテム設計バイブル v2.2-Ready

このドキュメントは `data/items.ts` と `config/gameBalance.ts` を編集する際の唯一の参照点であり、現行バランスと将来拡張ルールを同時に保証する。更新前に必ず本書を同期し、Pull Request には該当セクションへのハイパーリンクを添付すること。

## 0. Authoring Protocol
1. 企画意図を「効果カテゴリ」「リスク」「シナリオの想定ターン」に分解して記述。
2. `config` の設計定数が変わる場合は先に値を確定し、ここで根拠を提示。
3. `data/items.ts` の差分テスト (unit: `logic/effectProcessor.test.ts`) を実行。
4. テキストログや UI 警告を更新し、60点ラインを跨ぐ挙動の差分をログに追記。

## 1. Macro Baselines

### 1.1 Passing-Line Doctrine
- 0-59 点: 基礎学習のみで到達可能。リスクアイテムはギャンブル扱い。
- 60-79 点: USB と人脈の併用が前提。ここからが実質的なゲーム開始。
- 80 点以降: 教授・先輩のレジェンド報酬とコンディション管理が支配的。

### 1.2 Core Resource Bands
| Resource | Safe Zone | Danger Zone | Failure | 備考 |
|----------|-----------|-------------|---------|------|
| HP       | 60-100    | 30-59       | 0       | HP<30 で警告。中毒/睡眠負債と連動。
| SAN      | 60-100    | 30-59       | 0       | SAN<30 で狂気ブースト。
| Satiety  | 20-80     | <20 or >85  | n/a     | 85 以上は効率 0.9 倍。
| Caffeine | 40-149    | 0-39 / 150+ | 200     | 150+ で毒性フェーズ。

### 1.3 Caffeine States (Ver.2.0)
| Band | Range | 学習効率 | 毎ターン副作用 |
|------|-------|---------|---------------|
| NORMAL | 0-39 | 1.0x | なし |
| AWAKE | 40-99 | 1.2x | なし |
| ZONE | 100-149 | 1.5x | HP-3 / SAN-1 |
| TOXICITY | 150-200 | 2.0x | HP-12 / SAN-6 |
| 自然減衰 | - | - | -10mg / turn |

## 2. Taxonomy & Slots
| Class | 役割 | 使用タイミング | テンプレ制約 |
|-------|------|----------------|---------------|
| Consumable | 短期リソース補正 | 任意 | 効果 3 つ以内 + Optional デメリット |
| Sustainer | バフ/デバフ | バフ枠 2 個 (重複不可) | Duration を明記 |
| Social Catalyst | 人脈トリガー | 行動コマンド連動 | 成功率/報酬テーブル必須 |
| Legendary | イベント限定 | 条件付き | 成功率式 + ログ分岐 |

## 3. Balancing Heuristics
- 価格はリカバリー期待値 (点数換算) × 150 円を上限とする。
- SAN と HP を同時に伸ばす場合はいずれかを 30 未満に抑える。
- 満腹度が 60 以上になる設計は Digestive 系を併記し、連食戦略を担保。
- バフは「倍率」「持続ターン」「副作用」の 3 軸セットで記述し、いずれか 1 つは必ずマイナス要素にする。

## 4. Quick Reference Matrix
| ID | Price | Primary Effect | Secondary | Risk Vector | Loop Impact |
|----|-------|----------------|-----------|-------------|-------------|
| BLACK_COFFEE | 160 | CAF +50 | HP/SAN +2 | なし | 序盤集中維持 |
| ENERGY_DRINK | 550 | CAF +120 | SAN-5 | 中毒導線 | ZONE 固定 |
| MINERAL_WATER | 120 | CAF -15 | HP/SAN +小 | 効果小 | カフェイン調整 |
| CAFE_LATTE | 380 | CAF +30 | HP/SAN +15 | 満腹度+25 | 緩やかな延長 |
| HERBAL_TEA | 600 | CAF -100 | SAN +35 | 高価 | 中毒脱出 |
| PROTEIN_BAR | 250 | HP +35 | Sat +35 | なし | 夜間回復 |
| CUP_RAMEN | 480 | HP +55 | Sat +75 | Sat 過多 | 緊急救済 |
| HIGH_CACAO_CHOCO | 320 | SAN +18 | CAF +15 | Sat+22 | SAN 調整 |
| GUMMY_CANDY | 180 | SAN +15 | 低 Sat | なし | 安価ケア |
| RICE_BALL | 150 | HP +15 | Sat +50 | Sat 過多 | 空腹管理 |
| ENERGY_JELLY | 280 | HP +25 | CAF +20 | Sat +15 | 連続使用可 |
| DIGESTIVE_ENZYME | 450 | Sat -60 | HP -3 | HP ペナルティ | 連食許可 |
| HOT_EYE_MASK | 1500 | Rest 1.5x | 4T | バフ枠消費 | 睡眠コンボ |
| EARPLUGS | 2200 | SAN +45 | 即時 | 単発 | 破滅リセット |
| GAMING_SUPPLEMENT | 4500 | Study 1.2x | SAN-4/t | 満腹度+5 | 安全ドーピング |
| SMART_DRUG | 15800 | Study 2.0x | HP-40, SAN-12/t | 高リスク | ラストスパート |
| USB_MEMORY | Event | +20 random subject | SAN-20 on fail | 成功率式 | 60 点転換 |
| VERIFIED_PAST_PAPERS | Event | +30 random subject | SAN-10 on fail | 98% 成功 | 高得点導線 |
| REFERENCE_BOOK | 10800 | Lowest subject +15 | なし | 高額 | 金で解決 |
| GIFT_SWEETS | 3500 | Relationship boost | 確定成功 | 在庫制限 | わらしべ起点 |

## 5. Item Catalog (Detailed Specs)
各アイテムは以下テンプレに準拠する。`Effect` は JSON で `targets`, `amount`, `duration` を整理。

### 5.1 BLACK_COFFEE (缶コーヒー 微糖)
```
price: 160
Effect: { caffeine:+50, hp:+2, san:+2, satiety:+12 }
Design: 0→50 で AWAKE に到達。減衰 2 ターン分を保証。
Notes: 深夜連打時も中毒閾値に届かないよう +50 を上限化。
```

### 5.2 ENERGY_DRINK (ZONe Ver.Infinity)
```
price: 550
Effect: { caffeine:+120, hp:+10, san:-5, satiety:+20 }
Design: 即 ZONE。3 ターン連続で 100 以上を維持。
Risk: SAN -5 で精神破綻ループを抑止。中毒ログを必ず表示。
```

### 5.3 MINERAL_WATER
```
price: 120
Effect: { caffeine:-15, hp:+2, san:+1, satiety:+5 }
Design: マイルドなデトックスで AWAKE→NORMAL の橋渡し。
Guideline: CAF -15 は 3 本で HERBAL と同等。調整しやすさ優先。
```

### 5.4 CAFE_LATTE
```
price: 380
Effect: { caffeine:+30, hp:+15, san:+15, satiety:+25 }
Design: 維持用ブースト。HP/SAN の同時ケアで汎用性確保。
Future Hook: Reduced Sugar Variant を追加する場合は CAF +20 / Sat +15 を目安。
```

### 5.5 HERBAL_TEA
```
price: 600
Effect: { caffeine:-100, san:+35, hp:+5, satiety:+10 }
Design: TOXICITY から瞬時に復帰。
Risk: 価格で乱用を抑制。SAN 回復を 35 に据え、Earplugs と差別化。
```

### 5.6 PROTEIN_BAR
```
price: 250
Effect: { hp:+35, satiety:+35 }
Design: カフェイン非依存の HP 回復。夜間連続使用を想定。
Note: Satiety 35 以上の固形は Digestive 併記が必須。
```

### 5.7 CUP_RAMEN
```
price: 480
Effect: { hp:+55, san:+5, satiety:+75 }
Design: 緊急時の大回復。Satiety 75 により連食を封じる。
Maintenance: HP 上方修正時は Satiety も同率 (1:1.35) で調整。
```

### 5.8 HIGH_CACAO_CHOCO
```
price: 320
Effect: { san:+18, hp:+5, caffeine:+15, satiety:+22 }
Design: SAN ケアと覚醒維持の微調整。
Hook: 代替品を追加する際は CAF +15 を固定し、SAN ±2 で個性を出す。
```

### 5.9 GUMMY_CANDY
```
price: 180
Effect: { san:+15, hp:+2, satiety:+18 }
Design: 最安 SAN ケア。カフェインを持たない夜食枠。
```

### 5.10 RICE_BALL
```
price: 150
Effect: { hp:+15, satiety:+50 }
Design: 金欠救済。Satiety 50 により Digestive とのコンボを想定。
```

### 5.11 ENERGY_JELLY
```
price: 280
Effect: { hp:+25, caffeine:+20, satiety:+15 }
Design: 2 回連続で使用しても Satiety 制限に掛からない即応性。
```

### 5.12 DIGESTIVE_ENZYME
```
price: 450
Effect: { satiety:-60, hp:-3 }
Design: 満腹度リセット。HP -3 で多用リスクを可視化。
Guideline: Satiety 減少量は 60 を下限とし、他アイテムの過食設計を支える。
```

### 5.13 HOT_EYE_MASK
```
price: 1500
Effect: buff(restEfficiency:1.5, duration:4)
Design: 休息コマンドをブースト。睡眠負債リセットとセットで使う。
Maintenance: バフ枠の同時適用は最大 1。競合追加時は優先度を定義。
```

### 5.14 EARPLUGS
```
price: 2200
Effect: { san:+45 }
Design: 即時 SAN 最大回復に近い値。終盤の精神崩壊を防ぐ安全網。
```

### 5.15 GAMING_SUPPLEMENT
```
price: 4500
Effect: buff(studyEfficiency:1.2, duration:4), tickCost(san:-4)
Design: カフェイン倍率と乗算。SAN の線形減少で管理スキルを要求。
```

### 5.16 SMART_DRUG (イベント)
```
price: 15800
Effect: hp:-40, buff(studyEfficiency:2.0, duration:3), tickCost(san:-12), satiety:+5
Design: 禁断の逆転札。使用後の回復導線を必ず用意する。
```

### 5.17 USB_MEMORY (先輩イベント)
```
price: 非売品
Effect: success -> randomSubject+20, failure -> san:-20
SuccessRate: 0.30 + 0.006 * AlgoScore, capped at 0.95
Design: 60 点で安定、序盤はギャンブル。ログ分岐を実装済み。
Future: DLC で科目追加時は +20 を等価な割合ボーナスに変換。
```

### 5.18 VERIFIED_PAST_PAPERS (教授/先輩高ランク)
```
price: 非売品
Effect: success -> randomSubject+30, failure -> san:-10
SuccessRate: 0.98 固定 (2% で破損)
Design: 高得点帯を押し上げる信頼資産。USB との違いは安定性。
```

### 5.19 REFERENCE_BOOK
```
price: 10800
Effect: lowestSubject+15
Design: 金で解決する終盤アイテム。最低科目が 70 以上の場合は 10 点に漸減 (soft cap)。
```

### 5.20 GIFT_SWEETS
```
price: 3500
Effect: relationshipBoost + guaranteed success + reward table
Design: 先輩/教授行動の成功率を引き上げ、USB/過去問を間接的に供給。
Rules: 友好度 50/70/80 の各閾値に応じて報酬テーブルを更新すること。
```

## 6. Analytical Appendix

### 6.1 60 点到達ターン試算
```
Baseline Study Gain = 6 pts/turn
With Caffeine AWAKE (1.2x) = 7.2 pts/turn
With GAMING_SUPPLEMENT (1.2x) + ZONE (1.5x) = 10.8 pts/turn
```
- 素の状態: 約 10 ターンで 60 点
- AWAKE 維持: 8-9 ターン
- ZONE + Supplement: 6 ターン (SAN コスト 12/t)

### 6.2 USB 期待値
| Algo Score | Success | Expectation | 評価 |
|------------|---------|-------------|------|
| 0 | 30% | +6 点相当 | 無謀 |
| 30 | 48% | +9.6 点 | まだ運ゲー |
| 60 | 95% | +19 点 | 安定圏 |
| 100 | 95% | +19 点 | キャップ |

### 6.3 Upgrade Hooks
- Consumable の派生品を追加する際は Quick Reference に追加し、カテゴリ別に 3 つ以内の役割重複を維持。
- 新規 Legendary は「成功率式」「結果ログ」「在庫制限」をセットで定義。
- 価格改定は `scripts/balance-report.ts` を実行し、下記式を満たすこと。
```
price <= (expectedKnowledgeGain * 150) + (sanGain * 20) + (hpGain * 15)
```

## 7. Future Work Checklist
- Knowledge Bar グラデーションと 60 点マーカーを UI に実装。
- USB 所持時の警告表示を 60 点未満/以上で差し替え。
- effectProcessor の単体テストをイベントアイテムにも拡張。
