
import React from 'react';
import { GameState, ItemId, SubjectId, TimeSlot } from '../types';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';
import { getAvailability, getStudyHint } from '../logic/advisor';
import { getWorkConfig } from '../data/work';
import { getItemEffectDescription } from '../utils/common';
import { getExamWarnings } from '../logic/warningSystem';
import { BookOpen, Users, Gamepad2, Package, School, GraduationCap, UserPlus, AlertTriangle, ShoppingCart, Briefcase, Bed, Sun, Moon, BatteryCharging, Ban, Coffee } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface Props {
  state: GameState;
  actions: {
    study: (id: SubjectId) => void;
    rest: () => void;
    work: () => void;
    escapism: () => void;
    askProfessor: () => void;
    askSenior: () => void;
    relyFriend: () => void;
    useItem: (id: ItemId) => void;
    openShop: () => void;
  };
}

export const ActionPanel: React.FC<Props> = ({ state, actions }) => {
  const { timeSlot, caffeine, status } = state;
  const isGameOver = status !== 'PLAYING';
  const warnings = getExamWarnings(state);
  const hasCriticalWarning = warnings.some(w => w.severity === 'critical' || w.severity === 'danger');

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

  // Helpers
  const ownedItems = Object.entries(state.inventory)
    .filter(([_, count]) => ((count as number) || 0) > 0)
    .map(([id]) => id as ItemId);

  const { professor: isProfAvailable, senior: isSeniorAvailable, friend: isFriendAvailable } = getAvailability(timeSlot);
  const studyHint = getStudyHint(timeSlot, caffeine);
  const workConfig = getWorkConfig(timeSlot);

  const getRestConfig = (slot: TimeSlot) => {
    switch (slot) {
      case TimeSlot.LATE_NIGHT: return { label: "就寝 (布団)", desc: "HP大/SAN大", icon: <Bed size={16} />, variant: 'secondary' as const };
      case TimeSlot.MORNING: return { label: "二度寝", desc: "HP中/SAN小", icon: <Sun size={16} />, variant: 'secondary' as const };
      case TimeSlot.NOON: return { label: "昼寝", desc: "HP小/SAN中", icon: <Moon size={16} />, variant: 'secondary' as const };
      default: return { label: "仮眠 (机)", desc: "HP小/SAN微", icon: <BatteryCharging size={16} />, variant: 'secondary' as const };
    }
  };
  const restConfig = getRestConfig(timeSlot);

  return (
    <div className="grid grid-cols-2 gap-2 p-2 md:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:p-4 border-t-2 border-green-900 bg-gray-950">
      
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="col-span-2 lg:col-span-4 mb-2">
          <div className={`p-2 rounded border flex items-start gap-3 ${hasCriticalWarning ? 'bg-red-900/20 border-red-800' : 'bg-yellow-900/20 border-yellow-800'}`}>
            <AlertTriangle className={hasCriticalWarning ? 'text-red-500' : 'text-yellow-500'} size={18} />
            <div className="flex-1">
              <div className="text-xs font-bold text-gray-200 mb-1">WARNINGS DETECTED ({warnings.length})</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                {warnings.slice(0, 4).map((w, i) => (
                  <div key={i} className="text-[10px] text-gray-400 flex items-center gap-1">
                    <span>{w.icon}</span> {w.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACADEMIC */}
      <div className="col-span-2 lg:col-span-1 space-y-2">
        <div className="flex justify-between items-center text-xs text-gray-500 font-bold mb-1 px-1">
           <span className="flex items-center gap-2"><BookOpen size={12} /> ACADEMIC</span>
           <Badge variant={caffeine > 100 ? 'warning' : 'outline'}>{studyHint.split('(')[0]}</Badge>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          {Object.values(SUBJECTS).map((sub) => (
            <Button
              key={sub.id}
              onClick={() => actions.study(sub.id)}
              label={sub.name}
              subLabel={`Diff: ${sub.difficulty}x`}
              icon={<School size={16} />}
              variant="primary"
              fullWidth
            />
          ))}
        </div>
      </div>

      {/* LIFE & ECONOMY */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-2 px-1">
           <Briefcase size={12} /> LIFE & ECONOMY
        </div>
        <Button
          onClick={actions.rest}
          label={restConfig.label}
          subLabel={restConfig.desc}
          icon={restConfig.icon}
          variant="secondary"
          fullWidth
        />
        <Button
          onClick={actions.work}
          label={workConfig.label}
          subLabel={`¥${workConfig.salary.toLocaleString()}`}
          icon={<Briefcase size={16} />}
          variant="outline"
          className="border-orange-900 text-orange-400 hover:border-orange-700"
          fullWidth
        />
        <Button
          onClick={actions.openShop}
          label="生協オンライン"
          subLabel="アイテム購入"
          icon={<ShoppingCart size={16} />}
          variant="outline"
          className="border-cyan-900 text-cyan-400 hover:border-cyan-700"
          fullWidth
        />
      </div>

      {/* SOCIAL */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-2 px-1">
           <Users size={12} /> SOCIAL
        </div>
        <Button
          onClick={actions.askProfessor}
          disabled={!isProfAvailable}
          label="教授に質問"
          subLabel={isProfAvailable ? "理解度UP" : "不在"}
          icon={<GraduationCap size={16} />}
          variant={isProfAvailable ? "outline" : "ghost"}
          className={isProfAvailable ? "border-indigo-900 text-indigo-400 hover:border-indigo-700" : ""}
          fullWidth
        />
        <Button
          onClick={actions.askSenior}
          disabled={!isSeniorAvailable}
          label="先輩を頼る"
          subLabel={isSeniorAvailable ? "アイテム/情報" : "不在"}
          icon={<Users size={16} />}
          variant={isSeniorAvailable ? "outline" : "ghost"}
          className={isSeniorAvailable ? "border-purple-900 text-purple-400 hover:border-purple-700" : ""}
          fullWidth
        />
        <Button
          onClick={actions.relyFriend}
          disabled={!isFriendAvailable}
          label="友人と協力"
          subLabel={isFriendAvailable ? "SAN回復" : "睡眠中"}
          icon={<UserPlus size={16} />}
          variant={isFriendAvailable ? "outline" : "ghost"}
          className={isFriendAvailable ? "border-pink-900 text-pink-400 hover:border-pink-700" : ""}
          fullWidth
        />
        <Button
          onClick={actions.escapism}
          label="現実逃避"
          subLabel="時間経過/SAN回復"
          icon={<Gamepad2 size={16} />}
          variant="outline"
          className="border-pink-900/50 text-pink-400/70 hover:border-pink-700 hover:text-pink-300"
          fullWidth
        />
      </div>

      {/* INVENTORY */}
      <div className="col-span-2 lg:col-span-1 space-y-2">
        <div className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-2 px-1">
           <Package size={12} /> INVENTORY
        </div>
        {ownedItems.length === 0 ? (
           <div className="text-xs text-gray-600 p-4 border border-gray-800 border-dashed text-center rounded">
             NO ITEMS
           </div>
        ) : (
          <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2">
            {ownedItems.map((itemId) => {
              const item = ITEMS[itemId];
              return (
                <Button
                  key={itemId}
                  onClick={() => actions.useItem(itemId)}
                  label={`${item.name} x${state.inventory[itemId]}`}
                  subLabel={getItemEffectDescription(item)}
                  icon={<Package size={14} />}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:border-gray-500"
                  fullWidth
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
