
import React from 'react';
import { GameState, ItemId, SubjectId } from '../types';
import { getStudyHint } from '../logic/advisor';
import { getExamWarnings } from '../logic/warningSystem';
import { BookOpen, Users, Package, Briefcase, AlertTriangle, Ban } from 'lucide-react';
import { Badge } from './ui/Badge';
import { CollapsibleSection } from './ui/CollapsibleSection';

// Extracted Modules
import { AcademicSection } from './modules/AcademicSection';
import { LifeSection } from './modules/LifeSection';
import { SocialSection } from './modules/SocialSection';
import { InventorySection } from './modules/InventorySection';

interface Props {
  state: GameState;
  actions: {
    study: (id: SubjectId) => void;
    studyAll: () => void;
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
      <div className="hidden md:grid grid-cols-4 gap-3 p-3 h-full">
         {/* ACADEMIC */}
         <div className="col-span-1 space-y-2">
            <div className="flex justify-between items-center px-1">
               <span className="fs-xxs font-bold text-gray-500 flex items-center gap-1"><BookOpen size={10} /> ACADEMIC</span>
               <Badge variant={caffeine > 100 ? 'warning' : 'outline'} className="scale-75 origin-right">{studyHint.split('(')[0]}</Badge>
            </div>
            <AcademicSection state={state} onStudy={actions.study} onStudyAll={actions.studyAll} isMobile={false} />
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
         <div className="col-span-1 space-y-2 flex flex-col h-full min-h-0">
            <div className="fs-xxs font-bold text-gray-500 flex items-center gap-1 px-1 shrink-0">
               <Package size={10} /> STORAGE
            </div>
            <div className="flex-1 min-h-0">
              <InventorySection 
                state={state} 
                onUse={actions.useItem} 
                onInspect={onInspect} 
                isMobile={false} 
              />
            </div>
         </div>
      </div>

      {/* === MOBILE LAYOUT (Visible on Mobile) === */}
      <div className="md:hidden p-2 space-y-1">
         <CollapsibleSection title="ACADEMIC (学習)" defaultOpen={true}>
            <AcademicSection state={state} onStudy={actions.study} onStudyAll={actions.studyAll} isMobile={true} />
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
