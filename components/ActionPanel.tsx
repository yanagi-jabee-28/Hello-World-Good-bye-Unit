
import React from 'react';
import { GameState, ItemId, SubjectId, TimeSlot } from '../types';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';
import { getAvailability, getStudyHint } from '../logic/advisor';
import { getWorkConfig } from '../data/work';
import { getShortEffectString } from '../utils/logFormatter';
import { getExamWarnings } from '../logic/warningSystem';
import { BookOpen, Users, Gamepad2, Package, School, GraduationCap, UserPlus, AlertTriangle, ShoppingCart, Briefcase, Bed, Sun, Moon, BatteryCharging, Ban, Coffee, Zap } from 'lucide-react';
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
  onInspect?: (itemId: ItemId, mode: 'inventory' | 'shop') => void;
}

export const ActionPanel: React.FC<Props> = ({ state, actions, onInspect }) => {
  const { timeSlot, caffeine, status } = state;
  const isGameOver = status !== 'PLAYING';
  const warnings = getExamWarnings(state);
  const hasCriticalWarning = warnings.some(w => w.severity === 'critical' || w.severity === 'danger');

  if (isGameOver) {
    return (
      <div className="h-full w-full p-4 border-2 border-red-900 bg-black/90 flex items-center justify-center backdrop-blur-sm">
        <div className="text-red-600 font-mono text-center animate-pulse space-y-4">
          <Ban size={64} className="mx-auto" />
          <div>
            <h2 className="text-3xl font-bold tracking-[0.5em] glitch-text" data-text="SYSTEM HALTED">SYSTEM HALTED</h2>
            <p className="text-sm text-red-800 mt-2 uppercase tracking-widest">Fatal Error // User Input Disabled</p>
          </div>
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
      case TimeSlot.LATE_NIGHT: return { label: "就寝 (布団)", desc: "HP大/SAN大", icon: <Bed size={16} /> };
      case TimeSlot.MORNING: return { label: "二度寝", desc: "HP中/SAN小", icon: <Sun size={16} /> };
      case TimeSlot.NOON: return { label: "昼寝", desc: "HP小/SAN中", icon: <Moon size={16} /> };
      default: return { label: "仮眠 (机)", desc: "HP小/SAN微", icon: <BatteryCharging size={16} /> };
    }
  };
  const restConfig = getRestConfig(timeSlot);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-black/50 h-full content-start overflow-y-auto custom-scrollbar">
      
      {/* Warnings Overlay/Banner */}
      {warnings.length > 0 && (
        <div className="col-span-2 md:col-span-4">
          <div className={`p-2 border-l-4 flex items-start gap-3 ${hasCriticalWarning ? 'bg-red-950/30 border-red-600' : 'bg-yellow-950/30 border-yellow-600'}`}>
            <AlertTriangle className={hasCriticalWarning ? 'text-red-500 animate-pulse' : 'text-yellow-500'} size={18} />
            <div className="flex-1">
              <div className="fs-xxs font-bold text-gray-400 mb-1 tracking-wider uppercase">System Warning ({warnings.length})</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                {warnings.slice(0, 4).map((w, i) => (
                  <div key={i} className="fs-xxs text-gray-200 flex items-center gap-2">
                    <span className="fs-xs">{w.icon}</span> {w.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACADEMIC */}
      <div className="col-span-2 md:col-span-1 space-y-2">
        <div className="flex justify-between items-center px-1">
           <span className="fs-xxs font-bold text-gray-500 flex items-center gap-1"><BookOpen size={10} /> ACADEMIC_MODULE</span>
           <Badge variant={caffeine > 100 ? 'warning' : 'outline'} className="scale-75 origin-right">{studyHint.split('(')[0]}</Badge>
        </div>
        <div className="space-y-1.5">
          {Object.values(SUBJECTS).map((sub) => (
            <Button
              key={sub.id}
              onClick={() => actions.study(sub.id)}
              label={sub.name}
              subLabel={`Difficulty: ${sub.difficulty}x`}
              icon={<School size={14} />}
              variant="primary"
              fullWidth
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* LIFE & ECONOMY */}
      <div className="col-span-1 space-y-2">
        <div className="fs-xxs font-bold text-gray-500 flex items-center gap-1 px-1">
           <Briefcase size={10} /> LIFE_SUPPORT
        </div>
        <div className="space-y-1.5">
          <Button
            onClick={actions.rest}
            label={restConfig.label}
            subLabel={restConfig.desc}
            icon={restConfig.icon}
            variant="secondary"
            fullWidth
            size="sm"
          />
          <Button
            onClick={actions.work}
            label={workConfig.label}
            subLabel={`EARN: ¥${workConfig.salary.toLocaleString()}`}
            icon={<Briefcase size={14} />}
            variant="outline"
            className="border-orange-800 text-orange-400 hover:border-orange-600"
            fullWidth
            size="sm"
          />
          <Button
            onClick={actions.openShop}
            label="生協 NET"
            subLabel="PURCHASE"
            icon={<ShoppingCart size={14} />}
            variant="outline"
            className="border-cyan-800 text-cyan-400 hover:border-cyan-600"
            fullWidth
            size="sm"
          />
        </div>
      </div>

      {/* SOCIAL */}
      <div className="col-span-1 space-y-2">
        <div className="fs-xxs font-bold text-gray-500 flex items-center gap-1 px-1">
           <Users size={10} /> SOCIAL_LINK
        </div>
        <div className="space-y-1.5">
          <Button
            onClick={actions.askProfessor}
            disabled={!isProfAvailable}
            label="教授に質問"
            subLabel={isProfAvailable ? "AVAILABLE" : "OFFLINE"}
            icon={<GraduationCap size={14} />}
            variant={isProfAvailable ? "outline" : "ghost"}
            className={isProfAvailable ? "border-indigo-800 text-indigo-400 hover:border-indigo-600" : ""}
            fullWidth
            size="sm"
          />
          <Button
            onClick={actions.askSenior}
            disabled={!isSeniorAvailable}
            label="先輩を頼る"
            subLabel={isSeniorAvailable ? "AVAILABLE" : "OFFLINE"}
            icon={<Users size={14} />}
            variant={isSeniorAvailable ? "outline" : "ghost"}
            className={isSeniorAvailable ? "border-purple-800 text-purple-400 hover:border-purple-600" : ""}
            fullWidth
            size="sm"
          />
          <Button
            onClick={actions.relyFriend}
            disabled={!isFriendAvailable}
            label="友人と協力"
            subLabel={isFriendAvailable ? "AVAILABLE" : "SLEEPING"}
            icon={<UserPlus size={14} />}
            variant={isFriendAvailable ? "outline" : "ghost"}
            className={isFriendAvailable ? "border-pink-800 text-pink-400 hover:border-pink-600" : ""}
            fullWidth
            size="sm"
          />
          <Button
            onClick={actions.escapism}
            label="現実逃避"
            subLabel="SAN RECOVERY"
            icon={<Gamepad2 size={14} />}
            variant="outline"
            className="border-pink-900/50 text-pink-400/70 hover:border-pink-600 hover:text-pink-300"
            fullWidth
            size="sm"
          />
        </div>
      </div>

      {/* INVENTORY */}
      <div className="col-span-2 md:col-span-1 space-y-2">
        <div className="fs-xxs font-bold text-gray-500 flex items-center gap-1 px-1">
           <Package size={10} /> STORAGE
        </div>
        <div className="space-y-1.5">
          {ownedItems.length === 0 ? (
             <div className="fs-xxs text-gray-600 p-4 border border-gray-800 border-dashed text-center rounded h-full flex items-center justify-center bg-black/30">
               NO DATA
             </div>
          ) : (
            <div className="grid grid-cols-2 md:flex md:flex-col gap-1.5">
              {ownedItems.map((itemId) => {
                const item = ITEMS[itemId];
                const shortEffect = getShortEffectString(item);
                
                return (
                  <Button
                    key={itemId}
                    onClick={() => actions.useItem(itemId)}
                    label={`${item.name}`}
                    subLabel={`x${state.inventory[itemId]} | ${shortEffect}`}
                    icon={<Zap size={12} />}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:border-gray-500 bg-gray-900/50"
                    fullWidth
                    size="sm"
                    onInspect={onInspect ? () => onInspect(itemId, 'inventory') : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
