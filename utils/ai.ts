
import { GoogleGenAI } from "@google/genai";
import { GameState, GameStatus, SubjectId, RelationshipId } from "../types";
import { SUBJECTS } from "../data/subjects";

export const generateGameEvaluation = async (state: GameState): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return "ERROR: API_KEY_NOT_FOUND. Manual evaluation required.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 状態を読みやすいテキストに整形
    const statusText = {
      [GameStatus.VICTORY]: "試験合格 (生存)",
      [GameStatus.FAILURE]: "留年確定 (単位不足)",
      [GameStatus.GAME_OVER_HP]: "入院 (HP枯渇)",
      [GameStatus.GAME_OVER_SANITY]: "発狂 (SAN枯渇)",
    }[state.status];

    const scores = Object.entries(state.knowledge)
      .map(([id, score]) => `${SUBJECTS[id as SubjectId].name}: ${score}`)
      .join(", ");

    // 履歴データの分析
    const history = state.statsHistory;
    const turns = history.length || 1;
    
    const avgHp = Math.floor(history.reduce((sum, h) => sum + h.hp, 0) / turns);
    const avgSanity = Math.floor(history.reduce((sum, h) => sum + h.sanity, 0) / turns);
    const avgCaffeine = Math.floor(history.reduce((sum, h) => sum + h.caffeine, 0) / turns);
    const maxCaffeine = Math.max(...history.map(h => h.caffeine), 0);
    const minSanity = Math.min(...history.map(h => h.sanity), 100);

    const analysisData = `
      平均HP: ${avgHp} (100点満点中)
      平均SAN値: ${avgSanity} (100点満点中)
      最低SAN値: ${minSanity}
      平均血中カフェイン: ${avgCaffeine}mg
      最大血中カフェイン: ${maxCaffeine}mg (100mgで警告ライン)
    `;
    
    const prompt = `
      あなたは「地獄の工学部」を管理する冷徹で皮肉屋なAIシステムです。
      以下の学生の「7日間の生存記録データ」を分析し、120文字以内で評価レポート(日本語)を出力してください。
      
      【重要：評価基準】
      単なる結果だけでなく、**「どのような過程を経てその結末に至ったか」**（ステータスの推移）に言及してください。
      例：
      - 平均SAN値が低い -> 「常に発狂寸前だったようだな」
      - カフェインが高い -> 「血管にコーヒーが流れているのか？」
      - HPが低い -> 「よくその体調で生き残れたものだ」
      
      [リザルト]
      結末: ${statusText}
      科目スコア: ${scores}
      教授友好度: ${state.relationships[RelationshipId.PROFESSOR]}
      
      [生体ログ分析]
      ${analysisData}
      
      [指示]
      - 文体は「ハッカー」「マッドサイエンティスト」「システムログ」を混ぜたようなトーンで。
      - 結末がVICTORYでも、過程がボロボロなら皮肉を言うこと。
      - 結末がFAILUREでも、特定のステータスが異常に高ければ（例：カフェイン中毒）そこを指摘すること。
      - 改行は含めず、プレーンテキストで出力すること。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "SYSTEM_ERROR: Evaluation generation failed.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "CONNECTION_REFUSED: Evaluator offline.";
  }
};
