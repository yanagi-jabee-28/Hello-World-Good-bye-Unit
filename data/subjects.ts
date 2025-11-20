
import { Subject, SubjectId } from '../types';

export const SUBJECTS: Record<SubjectId, Subject> = {
  [SubjectId.MATH]: {
    id: SubjectId.MATH,
    name: '線形代数',
    description: '行列の固有値が、あなたのSAN値を削り取る。',
    difficulty: 0.9, // やや難
  },
  [SubjectId.ALGO]: {
    id: SubjectId.ALGO,
    name: 'アルゴリズム',
    description: '再帰呼び出しの深淵を覗く時、深淵もまた...Stack Overflow.',
    difficulty: 0.7, // 最難関
  },
  [SubjectId.CIRCUIT]: {
    id: SubjectId.CIRCUIT,
    name: '回路理論',
    description: 'キルヒホフの法則？いや、これはオカルトだ。',
    difficulty: 1.0, // 標準
  },
  [SubjectId.HUMANITIES]: {
    id: SubjectId.HUMANITIES,
    name: '人間科学(教養)',
    description: '「人間とは何か」を問う前に、出席日数が足りない。',
    difficulty: 1.4, // 単位を取りやすい
  },
};

export const PASSING_SCORE = 60;
export const PERFECT_SCORE = 90;
