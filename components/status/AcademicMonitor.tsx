import React from 'react';
import { GameState, SubjectId, RelationshipId } from '../../types';
import { SUBJECTS, PASSING_SCORE } from '../../data/subjects';
import { Users } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';

interface Props {
  state: GameState;
}

const SubjectBar: React.FC<{ subjectId: SubjectId; score: number }> = ({ subjectId, score }) => {
  const isPassing = score >= PASSING_SCORE;
  const color = isPassing ? 'bg-green-500' : 'bg-red-500';
  
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className={isPassing ? 'text-green-400' : 'text-red-400'}>{SUBJECTS[subjectId].name}</span>
        <span>{score}%</span>
      </div>
      <div className="h-2 w-full bg-gray-900 border border-gray-800">
         <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
};

export const AcademicMonitor: React.FC<Props> = ({ state }) => {
  return (
    <>
      <div className="mt-6">
        <h3 className="text-sm font-bold text-green-700 mb-2 border-b border-green-900 pb-1 flex items-center gap-2">
          <Users size={14} /> SOCIAL_LINKS (友好度)
        </h3>
        <div className="space-y-2">
            <ProgressBar 
              label="教授" 
              value={state.relationships[RelationshipId.PROFESSOR]} 
              max={100} 
              colorClass="bg-indigo-500" 
              subLabel={`${state.relationships[RelationshipId.PROFESSOR]}%`}
            />
            <ProgressBar 
              label="先輩" 
              value={state.relationships[RelationshipId.SENIOR]} 
              max={100} 
              colorClass="bg-purple-500" 
              subLabel={`${state.relationships[RelationshipId.SENIOR]}%`}
            />
            <ProgressBar 
              label="友人" 
              value={state.relationships[RelationshipId.FRIEND]} 
              max={100} 
              colorClass="bg-pink-500" 
              subLabel={`${state.relationships[RelationshipId.FRIEND]}%`}
            />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-bold text-green-700 mb-2 border-b border-green-900 pb-1">ACADEMIC_PROGRESS (単位状況)</h3>
        {Object.values(SubjectId).map(id => (
          <SubjectBar key={id} subjectId={id} score={state.knowledge[id]} />
        ))}
      </div>
    </>
  );
};