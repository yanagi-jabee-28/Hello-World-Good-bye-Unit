
import React from 'react';
import { GameState, RelationshipId } from '../../types';
import { getAvailability } from '../../logic/advisor';
import { ProgressButton } from '../ui/ProgressButton';
import { Button } from '../ui/Button';
import { GraduationCap, Users, UserPlus, Gamepad2 } from 'lucide-react';

interface Props {
  state: GameState;
  actions: {
    askProfessor: () => void;
    askSenior: () => void;
    relyFriend: () => void;
    escapism: () => void;
  };
  isMobile: boolean;
}

export const SocialSection: React.FC<Props> = React.memo(({ state, actions, isMobile }) => {
  const { professor: isProfAvailable, senior: isSeniorAvailable, friend: isFriendAvailable } = getAvailability(state.timeSlot);

  return (
    <div className="space-y-1.5">
      <ProgressButton
        onClick={actions.askProfessor}
        disabled={!isProfAvailable}
        label="教授に質問"
        subLabel={isProfAvailable ? "AVAILABLE" : "OFFLINE"}
        icon={<GraduationCap size={14} />}
        progress={state.relationships[RelationshipId.PROFESSOR]}
        maxValue={100}
        className={isMobile ? "min-h-[52px]" : "min-h-[48px]"}
        ariaLabel={`教授に質問する。友好度 ${state.relationships[RelationshipId.PROFESSOR]}%`}
        variant="professor"
      />
      <ProgressButton
        onClick={actions.askSenior}
        disabled={!isSeniorAvailable}
        label="先輩を頼る"
        subLabel={isSeniorAvailable ? "AVAILABLE" : "OFFLINE"}
        icon={<Users size={14} />}
        progress={state.relationships[RelationshipId.SENIOR]}
        maxValue={100}
        className={isMobile ? "min-h-[52px]" : "min-h-[48px]"}
        ariaLabel={`先輩を頼る。友好度 ${state.relationships[RelationshipId.SENIOR]}%`}
        variant="senior"
      />
      <ProgressButton
        onClick={actions.relyFriend}
        disabled={!isFriendAvailable}
        label="友人と協力"
        subLabel={isFriendAvailable ? "AVAILABLE" : "SLEEPING"}
        icon={<UserPlus size={14} />}
        progress={state.relationships[RelationshipId.FRIEND]}
        maxValue={100}
        className={isMobile ? "min-h-[52px]" : "min-h-[48px]"}
        ariaLabel={`友人と協力する。友好度 ${state.relationships[RelationshipId.FRIEND]}%`}
        variant="friend"
      />
      <Button
        onClick={actions.escapism}
        label="現実逃避"
        subLabel="SAN RECOVERY"
        icon={<Gamepad2 size={14} />}
        variant="outline"
        className="border-pink-900/50 text-pink-400/70 hover:border-pink-600 hover:text-pink-300"
        fullWidth
        size={isMobile ? "lg" : "sm"}
      />
    </div>
  );
});
