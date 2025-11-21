import React from 'react';
import { ActionType, SubjectId, GameStatus, GameState, ItemId, TimeSlot } from '../types';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';
import { getAvailability, getStudyHint } from '../logic/advisor';
import { getWorkConfig } from '../data/work';
import { getItemEffectDescription } from '../utils/common';
import { BookOpen, Moon, Users, Gamepad2, Package, School, GraduationCap, UserPlus, AlertTriangle, ShoppingCart, Briefcase, Bed, Sun, BatteryCharging, Ban } from 'lucide-react';

interface Props {
  state: GameState;
  onAction: {
    (type: ActionType.STUDY, payload: SubjectId): void;
    (type: ActionType.USE_ITEM, payload: ItemId): void;
    (type: ActionType.WORK): void;
    (type: Exclude<ActionType, ActionType.STUDY | ActionType.USE_ITEM | ActionType.WORK>): void;
  };
  onShopOpen: () => void;
}

export const ActionPanel: React.FC<Props> = ({ state, onAction, onShopOpen }) => {
  const isGameOver = state.status !== GameStatus.PLAYING;
  
  if (isGameOver) {
    return (
      <div className="h-full w-full p-4 border-t-2 border-red-900 bg-black flex items-center justify-center">
        <div className="text-red-600 font-mono text-center animate-pulse space-y-2">
          <Ban size={48} className="mx-auto mb-2" />
          <h2 className="text-2xl font-bold tracking-widest">SYSTEM HALTED</h2>
          <p className="text-xs text-red-800">USER INPUT DISABLED // WAITING FOR REBOOT</p>
        </div>
      </div>
    );
  }

  const { timeSlot, caffeine } = state;
  const ownedItems = Object.entries(state.inventory)
    .filter(([_, count]) => ((count as number) || 0) > 0)
    .map(([id]) => id as ItemId);

  const { professor: isProfAvailable, senior: isSeniorAvailable, friend: isFriendAvailable } = getAvailability(timeSlot);
  const studyHint = getStudyHint(timeSlot, caffeine);

  const workConfig = getWorkConfig(timeSlot);
  const workInfo = {
    text: workConfig.label,
    sub: `¥${workConfig.salary.toLocaleString()} / ${workConfig.description}`
  };

  const getRestConfig = (slot: TimeSlot) => {
    switch (slot) {
      case TimeSlot.LATE_NIGHT:
        return {
          label: "就寝 (布団)",
          desc: "1日を終了し深く眠る",
          effect: "HP大/SAN大 回復",
          icon: Bed,
          style: "border-blue-800 hover:bg-blue-900/30"
        };
      case TimeSlot.MORNING:
        return {
          label: "二度寝",
          desc: "登校時間まで粘る",
          effect: "HP中/SAN小 回復",
          icon: Sun,
          style: "border-blue-900 hover:bg-blue-900/20"
        };
      case TimeSlot.NOON:
        return {
          label: "昼寝",
          desc: "午後の講義に備える",
          effect: "HP小/SAN中 回復",
          icon: Moon,
          style: "border-blue-900 hover:bg-blue-900/20"
        };
      default:
        return {
          label: "仮眠 (机)",
          desc: "隙間時間で回復",
          effect: "HP小/SAN微 回復",
          icon: BatteryCharging,
          style: "border-blue-900 hover:bg-blue-900/20"
        };
    }
  };

  const restConfig = getRestConfig(timeSlot);
  const RestIcon = restConfig.icon;

  return (
    <div className="grid grid-cols-2 gap-2 p-2 md:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:p-4 border-t-2 border-green-900 bg-gray-950">
      {/* Study Actions */}
      <div className="col-span-2 lg:col-span-1 space-y-2">
        <h3 className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-2">
           <BookOpen size={12} />
           ACADEMIC
        </h3>
        <div className="text-[10px] text-green-600 mb-1 bg-green-900/10 p-1 border border-green-900/30 text-center">
           {studyHint}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          {Object.values(SUBJECTS).map((sub) => (
            <button
              key={sub.id}
              onClick={() => onAction(ActionType.STUDY, sub.id)}
              className="w-full flex items-center gap-2 p-2 border border-green-800 hover:bg-green-900/30 text-left group transition-colors"
            >
              <School size={16} className="text-green-500 shrink-0" />
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-green-400 truncate">{sub.name}</div>
                <div className="text-[9px] text-gray-500">Diff: {sub.difficulty}x</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Life & Economy Actions */}
      <div className="space-y-2">
        <h3 className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-2">
           <Briefcase size={12} />
           LIFE & ECONOMY
        </h3>
        
        <button
          onClick={() => onAction(ActionType.REST)}
          className={`w-full flex items-center gap-2 p-2 border text-left group transition-colors ${restConfig.style}`}
        >
          <div className="relative shrink-0">
              <RestIcon size={16} className="text-blue-500" />
              {caffeine > 80 && <AlertTriangle size={10} className="absolute -top-1 -right-1 text-yellow-500" />}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-blue-400 truncate">{restConfig.label}</div>
            <div className="text-[9px] text-gray-400 truncate">{restConfig.desc}</div>
            <div className="text-[9px] text-blue-300 font-bold mt-0.5 truncate">{restConfig.effect}</div>
          </div>
        </button>

        <button
          onClick={() => onAction(ActionType.WORK)}
          className="w-full flex items-center gap-2 p-2 border border-orange-900 hover:bg-orange-900/20 text-left"
        >
          <Briefcase size={16} className="text-orange-500 shrink-0" />
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-orange-400 truncate">{workInfo.text}</div>
            <div className="text-[9px] text-gray-500 truncate">{workInfo.sub}</div>
          </div>
        </button>

        <button
          onClick={onShopOpen}
          className="w-full flex items-center gap-2 p-2 border border-cyan-900 hover:bg-cyan-900/20 text-left"
        >
          <ShoppingCart size={16} className="text-cyan-500 shrink-0" />
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-cyan-400">生協オンライン</div>
            <div className="text-[9px] text-gray-500">アイテム購入</div>
          </div>
        </button>
      </div>

      {/* Social Actions */}
      <div className="space-y-2">
        <h3 className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-2">
           <Users size={12} />
           SOCIAL
        </h3>

        <button
          onClick={() => onAction(ActionType.ASK_PROFESSOR)}
          disabled={!isProfAvailable}
          className={`w-full flex items-center gap-2 p-2 border text-left transition-colors ${!isProfAvailable ? 'border-gray-800 opacity-40 cursor-not-allowed' : 'border-indigo-900 hover:bg-indigo-900/20'}`}
        >
          <GraduationCap size={16} className="text-indigo-500 shrink-0" />
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-indigo-400">教授に質問</div>
            <div className="text-[9px] text-gray-500 truncate">
               {isProfAvailable ? "理解度UP" : "不在(時間外)"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onAction(ActionType.ASK_SENIOR)}
          disabled={!isSeniorAvailable}
          className={`w-full flex items-center gap-2 p-2 border text-left transition-colors ${!isSeniorAvailable ? 'border-gray-800 opacity-40 cursor-not-allowed' : 'border-purple-900 hover:bg-purple-900/20'}`}
        >
          <Users size={16} className="text-purple-500 shrink-0" />
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-purple-400">先輩を頼る</div>
            <div className="text-[9px] text-gray-500 truncate">
              {isSeniorAvailable ? "アイテム入手" : "不在(午前)"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onAction(ActionType.RELY_FRIEND)}
          disabled={!isFriendAvailable}
          className={`w-full flex items-center gap-2 p-2 border text-left transition-colors ${!isFriendAvailable ? 'border-gray-800 opacity-40 cursor-not-allowed' : 'border-pink-900 hover:bg-pink-900/20'}`}
        >
          <UserPlus size={16} className="text-pink-500 shrink-0" />
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-pink-400">友人と協力</div>
            <div className="text-[9px] text-gray-500 truncate">
              {isFriendAvailable ? "SAN回復" : "睡眠中"}
            </div>
          </div>
        </button>

        <button
          onClick={() => onAction(ActionType.ESCAPISM)}
          className="w-full flex items-center gap-2 p-2 border border-pink-900 hover:bg-pink-900/20 text-left"
        >
          <Gamepad2 size={16} className="text-pink-500 shrink-0" />
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-pink-400">現実逃避</div>
            <div className="text-[9px] text-gray-500 truncate">SAN回復/時間経過</div>
          </div>
        </button>
      </div>

      {/* Item Actions */}
      <div className="col-span-2 lg:col-span-1 space-y-2">
        <h3 className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-2">
           <Package size={12} />
           INVENTORY
        </h3>
        {ownedItems.length === 0 ? (
           <div className="text-xs text-gray-600 p-2 border border-gray-800 border-dashed text-center">
             NO ITEMS
           </div>
        ) : (
          <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2">
            {ownedItems.map((itemId) => {
              const item = ITEMS[itemId];
              return (
                <button
                  key={itemId}
                  onClick={() => onAction(ActionType.USE_ITEM, itemId)}
                  className="flex items-start gap-2 p-2 border border-gray-700 hover:bg-gray-900 text-left transition-colors"
                >
                  <Package size={14} className="text-orange-400 mt-1 shrink-0" />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-orange-300 truncate">
                      {item.name} x{state.inventory[itemId]}
                    </div>
                    <div className="text-[9px] text-gray-400 leading-tight truncate">
                      {getItemEffectDescription(item)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};