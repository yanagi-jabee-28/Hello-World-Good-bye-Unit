
import React from 'react';
import { ActionType, SubjectId, GameStatus, GameState, ItemId } from '../types';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';
import { getAvailability, getStudyHint, getRestHint } from '../logic/advisor';
import { BookOpen, Coffee, Moon, Users, Gamepad2, Package, School, GraduationCap, UserPlus, AlertTriangle } from 'lucide-react';

interface Props {
  state: GameState;
  // Overloaded definitions for stricter type checking in component
  onAction: {
    (type: ActionType.STUDY, payload: SubjectId): void;
    (type: ActionType.USE_ITEM, payload: ItemId): void;
    (type: Exclude<ActionType, ActionType.STUDY | ActionType.USE_ITEM>): void;
  };
}

export const ActionPanel: React.FC<Props> = ({ state, onAction }) => {
  const isGameOver = state.status !== GameStatus.PLAYING;
  const { timeSlot, caffeine } = state;
  
  if (isGameOver) return null;

  const ownedItems = Object.entries(state.inventory)
    .filter(([_, count]) => (count || 0) > 0)
    .map(([id]) => id as ItemId);

  // Logic delegated to Advisor
  const { professor: isProfAvailable, senior: isSeniorAvailable, friend: isFriendAvailable } = getAvailability(timeSlot);
  const studyHint = getStudyHint(timeSlot, caffeine);
  const restHint = getRestHint(timeSlot, caffeine);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-t-2 border-green-900 bg-gray-950">
      {/* Study Actions */}
      <div className="space-y-2">
        <h3 className="text-xs text-gray-500 font-bold mb-2 flex items-center gap-2">
           <BookOpen size={12} />
           ACADEMIC (学習)
        </h3>
        <div className="text-[10px] text-green-600 mb-1 bg-green-900/10 p-1 border border-green-900/30 text-center">
           {studyHint}
        </div>
        {Object.values(SUBJECTS).map((sub) => (
          <button
            key={sub.id}
            onClick={() => onAction(ActionType.STUDY, sub.id)}
            className="w-full flex items-center gap-3 p-2 border border-green-800 hover:bg-green-900/30 text-left group transition-colors"
          >
            <School size={16} className="text-green-500 group-hover:text-green-300" />
            <div>
              <div className="text-xs font-bold text-green-400 group-hover:text-green-200">{sub.name}</div>
              <div className="text-[10px] text-gray-500">Diff: {sub.difficulty}x</div>
            </div>
          </button>
        ))}
      </div>

      {/* Survival Actions */}
      <div className="space-y-2">
        <h3 className="text-xs text-gray-500 font-bold mb-2 flex items-center gap-2">
           <Moon size={12} />
           SURVIVAL (生存行動)
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
            <button
            onClick={() => onAction(ActionType.REST)}
            className="w-full flex flex-col items-center gap-1 p-2 border border-blue-900 hover:bg-blue-900/20 text-center group"
            >
              <div className="relative">
                 <Moon size={16} className="text-blue-500" />
                 {caffeine > 80 && <AlertTriangle size={10} className="absolute -top-1 -right-1 text-yellow-500" />}
              </div>
              <div className="text-[10px] font-bold text-blue-400">休息/睡眠</div>
            </button>

            <button
            onClick={() => onAction(ActionType.CONSUME_CAFFEINE)}
            className="w-full flex flex-col items-center gap-1 p-2 border border-yellow-900 hover:bg-yellow-900/20 text-center"
            >
              <Coffee size={16} className="text-yellow-500" />
              <div className="text-[10px] font-bold text-yellow-400">カフェイン</div>
            </button>
        </div>
        <div className="text-[10px] text-gray-500 text-center">
           {restHint}
        </div>

        <button
          onClick={() => onAction(ActionType.ESCAPISM)}
          className="w-full flex items-center gap-3 p-2 border border-pink-900 hover:bg-pink-900/20 text-left mt-2"
        >
          <Gamepad2 size={16} className="text-pink-500" />
          <div>
            <div className="text-xs font-bold text-pink-400">現実逃避</div>
            <div className="text-[10px] text-gray-500">SAN回復 / 時間経過</div>
          </div>
        </button>
      </div>

      {/* Social Actions */}
      <div className="space-y-2">
        <h3 className="text-xs text-gray-500 font-bold mb-2 flex items-center gap-2">
           <Users size={12} />
           SOCIAL (人脈)
        </h3>

        <button
          onClick={() => onAction(ActionType.ASK_PROFESSOR)}
          disabled={!isProfAvailable}
          className={`w-full flex items-center gap-3 p-2 border text-left transition-colors ${!isProfAvailable ? 'border-gray-800 opacity-40 cursor-not-allowed' : 'border-indigo-900 hover:bg-indigo-900/20'}`}
        >
          <GraduationCap size={16} className="text-indigo-500" />
          <div>
            <div className="text-xs font-bold text-indigo-400">教授に質問</div>
            <div className="text-[10px] text-gray-500">
               {isProfAvailable ? "理解度UP (日中・放課後)" : "不在 (時間外)"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onAction(ActionType.ASK_SENIOR)}
          disabled={!isSeniorAvailable}
          className={`w-full flex items-center gap-3 p-2 border text-left transition-colors ${!isSeniorAvailable ? 'border-gray-800 opacity-40 cursor-not-allowed' : 'border-purple-900 hover:bg-purple-900/20'}`}
        >
          <Users size={16} className="text-purple-500" />
          <div>
            <div className="text-xs font-bold text-purple-400">先輩を頼る</div>
            <div className="text-[10px] text-gray-500">
              {isSeniorAvailable ? "アイテム入手 (午後・夜間)" : "不在 (午前中)"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onAction(ActionType.RELY_FRIEND)}
          disabled={!isFriendAvailable}
          className={`w-full flex items-center gap-3 p-2 border text-left transition-colors ${!isFriendAvailable ? 'border-gray-800 opacity-40 cursor-not-allowed' : 'border-pink-900 hover:bg-pink-900/20'}`}
        >
          <UserPlus size={16} className="text-pink-500" />
          <div>
            <div className="text-xs font-bold text-pink-400">友人と協力</div>
            <div className="text-[10px] text-gray-500">
              {isFriendAvailable ? "SAN回復 (深夜以外)" : "睡眠中"}
            </div>
          </div>
        </button>
      </div>

      {/* Item Actions */}
      <div className="space-y-2">
        <h3 className="text-xs text-gray-500 font-bold mb-2 flex items-center gap-2">
           <Package size={12} />
           INVENTORY
        </h3>
        {ownedItems.length === 0 ? (
           <div className="text-xs text-gray-600 p-2 border border-gray-800 border-dashed text-center">
             NO ITEMS
           </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ownedItems.map((itemId) => (
              <button
                key={itemId}
                onClick={() => onAction(ActionType.USE_ITEM, itemId)}
                className="flex items-start gap-2 p-2 border border-gray-700 hover:bg-gray-900 text-left transition-colors"
              >
                <Package size={14} className="text-orange-400 mt-1 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-orange-300">
                    {ITEMS[itemId].name} x{state.inventory[itemId]}
                  </div>
                  <div className="text-[9px] text-gray-400 leading-tight">{ITEMS[itemId].effectDescription}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
