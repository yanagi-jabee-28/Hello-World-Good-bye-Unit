
import React from 'react';
import { GameState, ItemId, SubjectId, TimeSlot, RelationshipId } from '../types';
import { SUBJECTS } from '../data/subjects';
import { ITEMS } from '../data/items';
import { getAvailability, getStudyHint } from '../logic/advisor';
import { getWorkConfig } from '../data/work';
import { getShortEffectString } from '../utils/logFormatter';
import { getExamWarnings } from '../logic/warningSystem';
import { predictStudyRisk, predictWorkRisk, predictItemRisk } from '../logic/riskSystem';
import { FORGETTING_CONSTANTS } from '../config/gameConstants';
import { BookOpen, Users, Gamepad2, Package, School, GraduationCap, UserPlus, AlertTriangle, ShoppingCart, Briefcase, Bed, Sun, Moon, BatteryCharging, Ban, Zap, Clock } from 'lucide-react';
import { Button } from './ui/Button';
import { ProgressButton } from './ui/ProgressButton';
import { Badge } from './ui/Badge';
import { CollapsibleSection } from './ui/CollapsibleSection';

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
  isMobile?: boolean;
}

// --- Sub Components (Defined outside to prevent re-creation) ---

const AcademicSection: React.FC<{ 
  state: GameState; 
  onStudy: (id: SubjectId) => void; 
  isMobile: boolean 
}> = React.memo(({ state, onStudy, isMobile }) => {
  const isStudyLethal = predictStudyRisk(state);

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
    </div>
  );
});

const LifeSection: React.FC<{
  state: GameState;
  onRest: () => void;
  onWork: () => void;
  onOpenShop: () => void;
  isMobile: boolean;
}> = React.memo(({ state, onRest, onWork, onOpenShop, isMobile }) => {
  const timeSlot = state.timeSlot;
  const workConfig = getWorkConfig(timeSlot);
  const isWorkLethal = predictWorkRisk(state);
  
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
    <div className="space-y-1.5">
      <Button
        onClick={onRest}
        label={restConfig.label}
        subLabel={restConfig.desc}
        icon={restConfig.icon}
        variant="secondary"
        fullWidth
        size={isMobile ? "lg" : "sm"}
      />
      <Button
        onClick={onWork}
        label={workConfig.label}
        subLabel={`EARN: ¥${workConfig.salary.toLocaleString()}`}
        icon={<Briefcase size={14} />}
        variant="outline"
        className="border-orange-800 text-orange-400 hover:border-orange-600"
        fullWidth
        size={isMobile ? "lg" : "sm"}
        isLethal={isWorkLethal}
      />
      <Button
        onClick={onOpenShop}
        label="生協 NET"
        subLabel="PURCHASE"
        icon={<ShoppingCart size={14} />}
        variant="outline"
        className="border-cyan-800 text-cyan-400 hover:border-cyan-600"
        fullWidth
        size={isMobile ? "lg" : "sm"}
      />
    </div>
  );
});

const SocialSection: React.FC<{
  state: GameState;
  actions: Props['actions'];
  isMobile: boolean;
}> = React.memo(({ state, actions, isMobile }) => {
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

const InventorySection: React.FC<{
  state: GameState;
  onUse: (id: ItemId) => void;
  onInspect?: (id: ItemId, mode: 'inventory') => void;
  isMobile: boolean;
}> = React.memo(({ state, onUse, onInspect, isMobile }) => {
  const { inventory } = state;
  const ownedItems = Object.entries(inventory)
    .filter(([_, count]) => ((count as number) || 0) > 0)
    .map(([id]) => id as ItemId);

  return (
    <div className="space-y-1.5">
      {ownedItems.length === 0 ? (
         <div className="fs-xxs text-gray-600 p-4 border border-gray-800 border-dashed text-center rounded h-full flex items-center justify-center bg-black/30">
           NO DATA
         </div>
      ) : (
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:flex md:flex-col'} gap-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1`}>
          {ownedItems.map((itemId) => {
            const item = ITEMS[itemId];
            const shortEffect = getShortEffectString(item);
            const isLethal = predictItemRisk(state, itemId);
            
            return (
              <Button
                key={itemId}
                onClick={() => onUse(itemId)}
                label={`${item.name}`}
                subLabel={`x${inventory[itemId]} | ${shortEffect}`}
                icon={<Zap size={12} />}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:border-gray-500 bg-gray-900/50"
                fullWidth
                size={isMobile ? "lg" : "sm"}
                onInspect={onInspect ? () => onInspect(itemId, 'inventory') : undefined}
                isLethal={isLethal}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

// --- Main Component ---

export const ActionPanel: React.FC<Props> = ({ state, actions, onInspect, isMobile = false }) => {
  const { timeSlot, caffeine, status } = state;
  const isGameOver = status !== 'PLAYING';
  const warnings = getExamWarnings(state);
  const hasCriticalWarning = warnings.some(w => w.severity === 'critical' || w.severity === 'danger');
  const studyHint = getStudyHint(timeSlot, caffeine);

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

  return (
    <div className="h-full bg-black/50 content-start overflow-y-auto custom-scrollbar">
      
      {/* Warnings Banner (Common) */}
      {warnings.length > 0 && (
        <div className="p-3 pb-1">
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

      {/* === DESKTOP LAYOUT (Hidden on Mobile) === */}
      <div className="hidden md:grid grid-cols-4 gap-3 p-3">
         {/* ACADEMIC */}
         <div className="col-span-1 space-y-2">
            <div className="flex justify-between items-center px-1">
               <span className="fs-xxs font-bold text-gray-500 flex items-center gap-1"><BookOpen size={10} /> ACADEMIC</span>
               <Badge variant={caffeine > 100 ? 'warning' : 'outline'} className="scale-75 origin-right">{studyHint.split('(')[0]}</Badge>
            </div>
            <AcademicSection state={state} onStudy={actions.study} isMobile={false} />
         </div>

         {/* LIFE & ECONOMY */}
         <div className="col-span-1 space-y-2">
            <div className="fs-xxs font-bold text-gray-500 flex items-center gap-1 px-1">
               <Briefcase size={10} /> LIFE
            </div>
            <LifeSection 
              state={state}
              onRest={actions.rest} 
              onWork={actions.work} 
              onOpenShop={actions.openShop} 
              isMobile={false} 
            />
         </div>

         {/* SOCIAL */}
         <div className="col-span-1 space-y-2">
            <div className="fs-xxs font-bold text-gray-500 flex items-center gap-1 px-1">
               <Users size={10} /> SOCIAL
            </div>
            <SocialSection state={state} actions={actions} isMobile={false} />
         </div>

         {/* INVENTORY */}
         <div className="col-span-1 space-y-2">
            <div className="fs-xxs font-bold text-gray-500 flex items-center gap-1 px-1">
               <Package size={10} /> STORAGE
            </div>
            <InventorySection 
              state={state} 
              onUse={actions.useItem} 
              onInspect={onInspect} 
              isMobile={false} 
            />
         </div>
      </div>

      {/* === MOBILE LAYOUT (Visible on Mobile) === */}
      <div className="md:hidden p-2 space-y-1">
         <CollapsibleSection title="ACADEMIC (学習)" defaultOpen={true}>
            <AcademicSection state={state} onStudy={actions.study} isMobile={true} />
         </CollapsibleSection>
         
         <CollapsibleSection title="LIFE SUPPORT (生活)" defaultOpen={true}>
            <LifeSection 
              state={state}
              onRest={actions.rest} 
              onWork={actions.work} 
              onOpenShop={actions.openShop} 
              isMobile={true} 
            />
         </CollapsibleSection>
         
         <CollapsibleSection title="SOCIAL LINK (人脈)" defaultOpen={true}>
            <SocialSection state={state} actions={actions} isMobile={true} />
         </CollapsibleSection>
         
         <CollapsibleSection title="INVENTORY (所持品)" defaultOpen={true}>
            <InventorySection 
              state={state}
              onUse={actions.useItem} 
              onInspect={onInspect} 
              isMobile={true} 
            />
         </CollapsibleSection>
      </div>
    </div>
  );
};
