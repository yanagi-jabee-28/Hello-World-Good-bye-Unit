
import React from 'react';
import { GameState, SubjectId, TimeSlot } from '../../types';
import { SUBJECTS } from '../../data/subjects';
import { FORGETTING_CONSTANTS } from '../../config/gameConstants';
import { predictStudyRisk } from '../../logic/riskSystem';
import { ProgressButton } from '../ui/ProgressButton';
import { Button } from '../ui/Button';
import { Clock, School, Layers } from 'lucide-react';

interface Props {
  state: GameState;
  onStudy: (id: SubjectId) => void;
  onStudyAll: () => void;
  isMobile: boolean;
}

export const AcademicSection: React.FC<Props> = React.memo(({ state, onStudy, onStudyAll, isMobile }) => {
  // showDeathHintsフラグがONの場合のみリスクを表示
  const isStudyLethal = state.debugFlags.showDeathHints && predictStudyRisk(state);
  
  // 授業中(AM, AFTERNOON)は総合演習不可
  const isClassTime = state.timeSlot === TimeSlot.AM || state.timeSlot === TimeSlot.AFTERNOON;
  const isLateNight = state.timeSlot === TimeSlot.LATE_NIGHT;

  return (
    <div className="space-y-1.5">
      {Object.values(SUBJECTS).map((sub) => {
        const lastStudied = state.lastStudied[sub.id] || 0;
        const turnsSince = state.turnCount - lastStudied;
        const isForgetRisk = turnsSince >= FORGETTING_CONSTANTS.WARNING_THRESHOLD && state.knowledge[sub.id] > 0;
        const isCritical = turnsSince >= FORGETTING_CONSTANTS.GRACE_PERIOD_TURNS && state.knowledge[sub.id] > 0;

        return (
          <ProgressButton
            key={sub.id}
            onClick={() => onStudy(sub.id)}
            label={sub.name}
            subLabel={
              isCritical ? `⚠ 忘却中 (放置 ${turnsSince}ターン)` :
              isForgetRisk ? `⚠ 復習推奨 (放置 ${turnsSince}ターン)` :
              `Difficulty: ${sub.difficulty}x`
            }
            icon={isForgetRisk ? <Clock size={14} className={isCritical ? "text-red-500 animate-pulse" : "text-yellow-500"} /> : <School size={14} />}
            progress={state.knowledge[sub.id]}
            maxValue={100}
            className={`${isMobile ? "min-h-[52px]" : "min-h-[48px]"} ${isCritical ? 'border-red-900/50' : ''}`}
            ariaLabel={`${sub.name}を勉強する。現在の理解度 ${state.knowledge[sub.id]}%`}
            variant="default"
            isLethal={isStudyLethal}
          />
        );
      })}
      
      {/* 総合学習ボタン */}
      <Button
        onClick={onStudyAll}
        disabled={isClassTime}
        label="総合演習 (ALL)"
        subLabel={
          isClassTime ? "授業中は不可" :
          isLateNight ? "深夜効率UP / 激しく消耗" :
          "全科目復習 / 科目特性を反映"
        }
        icon={<Layers size={14} />}
        variant="outline"
        className={`mt-2 ${
          isClassTime
            ? "border-gray-800 text-gray-600 bg-transparent"
            : isLateNight 
              ? "border-purple-800 text-purple-400 hover:border-purple-600 bg-purple-950/20"
              : "border-green-800 text-green-400 hover:border-green-600 bg-green-950/20"
        }`}
        fullWidth
        size={isMobile ? "lg" : "sm"}
        isLethal={isStudyLethal}
      />
    </div>
  );
});
