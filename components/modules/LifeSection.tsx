
import React from 'react';
import { GameState, TimeSlot } from '../../types';
import { getWorkConfig } from '../../data/work';
import { predictWorkRisk } from '../../logic/riskSystem';
import { Button } from '../ui/Button';
import { Bed, Sun, Moon, BatteryCharging, Briefcase, ShoppingCart } from 'lucide-react';

interface Props {
  state: GameState;
  onRest: () => void;
  onWork: () => void;
  onOpenShop: () => void;
  isMobile: boolean;
}

export const LifeSection: React.FC<Props> = React.memo(({ state, onRest, onWork, onOpenShop, isMobile }) => {
  const timeSlot = state.timeSlot;
  const workConfig = getWorkConfig(timeSlot);
  // showDeathHintsフラグがONの場合のみリスクを表示
  const isWorkLethal = state.debugFlags.showDeathHints && predictWorkRisk(state);
  
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
