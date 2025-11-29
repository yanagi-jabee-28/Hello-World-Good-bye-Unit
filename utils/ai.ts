
import { GoogleGenAI } from "@google/genai";
import { GameState, GameStatus, SubjectId, RelationshipId } from "../types";
import { SUBJECTS } from "../data/subjects";
import { average, maxOrDefault, minOrDefault, floor } from "./math";

export interface AnalysisSummary {
  statusText: string;
  scores: string;
  profRel: number;
  avgHp: number;
  avgSanity: number;
  avgCaffeine: number;
  maxCaffeine: number;
  minSanity: number;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ゲーム状態からAI分析用のサマリーデータを生成する（純粋関数）
 */
export const summarizeState = (state: GameState): AnalysisSummary => {
  const statusText = {
    [GameStatus.VICTORY]: "試験合格 (生存)",
    [GameStatus.FAILURE]: "留年確定 (単位不足)",
    [GameStatus.GAME_OVER_HP]: "入院 (HP枯渇)",
    [GameStatus.GAME_OVER_SANITY]: "発狂 (SAN枯渇)",
    [GameStatus.PLAYING]: "プレイ中", // Should not happen in ending
  }[state.status] || "不明";

  const scores = Object.entries(state.knowledge)
    .map(([id, score]) => `${SUBJECTS[id as SubjectId].name}: ${score}`)
    .join(", ");

  const history = state.statsHistory;
  
  return {
    statusText,
    scores,
    profRel: state.relationships[RelationshipId.PROFESSOR],
    avgHp: floor(average(history.map(h => h.hp))),
    avgSanity: floor(average(history.map(h => h.sanity))),
    avgCaffeine: floor(average(history.map(h => h.caffeine))),
    maxCaffeine: maxOrDefault(history.map(h => h.caffeine), 0),
    minSanity: minOrDefault(history.map(h => h.sanity), 100),
  };
};

/**
 * サマリーデータからプロンプトを構築する
 */
const buildPrompt = (summary: AnalysisSummary): string => {
  return `
    あなたは「地獄の工学部」を管理する冷徹で皮肉屋なAIシステムです。
    以下の学生の「7日間の生存記録データ」を分析し、120文字以内で評価レポート(日本語)を出力してください。
    
    【重要：評価基準】
    単なる結果だけでなく、**「どのような過程を経てその結末に至ったか」**（ステータスの推移）に言及してください。
    例：
    - 平均SAN値が低い -> 「常に発狂寸前だったようだな」
    - カフェインが高い -> 「血管にコーヒーが流れているのか？」
    - HPが低い -> 「よくその体調で生き残れたものだ」
    
    [リザルト]
    結末: ${summary.statusText}
    科目スコア: ${summary.scores}
    教授友好度: ${summary.profRel}
    
    [生体ログ分析]
    平均HP: ${summary.avgHp} (100点満点中)
    平均SAN値: ${summary.avgSanity} (100点満点中)
    最低SAN値: ${summary.minSanity}
    平均血中カフェイン: ${summary.avgCaffeine}mg
    最大血中カフェイン: ${summary.maxCaffeine}mg (100mgで警告ライン)
    
    [指示]
    - 文体は「ハッカー」「マッドサイエンティスト」「システムログ」を混ぜたようなトーンで。
    - 結末がVICTORYでも、過程がボロボロなら皮肉を言うこと。
    - 結末がFAILUREでも、特定のステータスが異常に高ければ（例：カフェイン中毒）そこを指摘すること。
    - 改行は含めず、プレーンテキストで出力すること。
  `;
};

export const generateGameEvaluation = async (state: GameState): Promise<string> => {
  if (!process.env.API_KEY) {
    return "ERROR: API_KEY_NOT_FOUND. Manual evaluation required.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const summary = summarizeState(state);
  const prompt = buildPrompt(summary);

  // Retry logic with exponential backoff
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      if (response.text) {
        return response.text;
      }
      throw new Error("Empty response from AI");
    } catch (error) {
      console.warn(`AI Generation Attempt ${attempt + 1} failed:`, error);
      attempt++;
      if (attempt < maxRetries) {
        await wait(1000 * Math.pow(2, attempt)); // 2s, 4s, 8s...
      } else {
        return "SYSTEM_ERROR: AI Connection Timed Out. (Analysis Module Offline)";
      }
    }
  }
  return "SYSTEM_ERROR: Unknown Failure.";
};