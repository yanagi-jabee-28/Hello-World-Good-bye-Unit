
import React, { useEffect } from 'react';
import { GameEvent, Persona } from '../types';
import { AlertTriangle, CheckCircle, Shield, Zap, GraduationCap, User, Users, Terminal, MessageSquare } from 'lucide-react';
import { Sound } from '../utils/sound';

interface Props {
  event: GameEvent;
  onResolve: (optionId: string) => void;
}

const PersonaConfig: Record<Persona, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  PROFESSOR: {
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/30',
    border: 'border-indigo-600',
    icon: <GraduationCap size={24} />,
    label: 'PROFESSOR (教授)'
  },
  SENIOR: {
    color: 'text-purple-400',
    bg: 'bg-purple-950/30',
    border: 'border-purple-600',
    icon: <Users size={24} />, // Using Users for Senior as a mentor figure
    label: 'SENIOR (先輩)'
  },
  FRIEND: {
    color: 'text-pink-400',
    bg: 'bg-pink-950/30',
    border: 'border-pink-600',
    icon: <User size={24} />,
    label: 'FRIEND (友人)'
  },
  SYSTEM: {
    color: 'text-green-400',
    bg: 'bg-green-950/30',
    border: 'border-green-600',
    icon: <Terminal size={24} />,
    label: 'SYSTEM ALERT'
  },
  PLAYER: {
    color: 'text-gray-300',
    bg: 'bg-gray-900',
    border: 'border-gray-600',
    icon: <MessageSquare size={24} />,
    label: 'YOU'
  }
};

export const EventDialog: React.FC<Props> = ({ event, onResolve }) => {
  useEffect(() => {
    Sound.play('event_trigger');
  }, []);

  if (!event.options) return null;

  const persona = event.persona || 'SYSTEM';
  const theme = PersonaConfig[persona];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
      <div className={`max-w-lg w-full border-2 ${theme.border} bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden`}>
        
        {/* Background Glow based on Persona */}
        <div className={`absolute inset-0 ${theme.bg} opacity-20 pointer-events-none`} />
        
        {/* Header */}
        <div className={`p-4 border-b ${theme.border} bg-black/80 flex items-center justify-between relative z-10`}>
          <h2 className={`text-lg font-bold ${theme.color} flex items-center gap-3 tracking-wider`}>
            {theme.icon}
            {theme.label}
          </h2>
          <div className="fs-xxs font-mono text-gray-500 uppercase tracking-widest">
            EVENT_ID: {event.id}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 relative z-10">
          {/* Dialogue Box */}
          <div className="flex gap-4">
             {/* Character Visual Placeholder (Optional, keeping it minimal for now) */}
             <div className={`hidden sm:flex shrink-0 w-1 bg-gradient-to-b from-transparent via-${theme.color.split('-')[1]}-500 to-transparent opacity-50`} />
             
             <p className="text-md md:text-lg text-gray-100 leading-relaxed whitespace-pre-wrap font-medium">
               {event.text}
             </p>
          </div>
          
          {/* Options */}
          <div className="space-y-3 mt-8">
            {event.options.map((opt) => {
              // Risk styling
              let borderClass = "border-gray-700";
              let riskColor = "text-gray-500";
              let riskIcon = <Shield size={14} />;
              let bgHover = "hover:bg-gray-900";
              
              if (opt.risk === 'safe') {
                 borderClass = "border-green-800 hover:border-green-500";
                 riskColor = "text-green-500";
                 riskIcon = <Shield size={14} />;
                 bgHover = "hover:bg-green-900/20";
              } else if (opt.risk === 'low') {
                 borderClass = "border-blue-800 hover:border-blue-500";
                 riskColor = "text-blue-500";
                 riskIcon = <CheckCircle size={14} />;
                 bgHover = "hover:bg-blue-900/20";
              } else {
                 borderClass = "border-red-800 hover:border-red-500";
                 riskColor = "text-red-500";
                 riskIcon = <Zap size={14} />;
                 bgHover = "hover:bg-red-900/20";
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => onResolve(opt.id)}
                  className={`w-full p-4 border text-left transition-all group bg-black/50 ${borderClass} ${bgHover}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white group-hover:text-green-300 text-sm md:text-base">
                        <span className="mr-2 text-gray-500 group-hover:text-white transition-colors">▶</span>
                        {opt.label}
                    </span>
                    <div className={`fs-xxs flex items-center gap-1 uppercase font-mono ${riskColor}`}>
                       {riskIcon} {opt.risk.toUpperCase()}
                    </div>
                  </div>
                  <div className="fs-xs text-gray-400 group-hover:text-gray-300 pl-5">
                    {opt.description}
                  </div>
                  <div className="mt-2 fs-xxs text-gray-600 font-mono pl-5 group-hover:text-gray-500">
                     SUCCESS_RATE: {opt.successRate}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-2 border-t ${theme.border} bg-black/80 text-center fs-xxs ${theme.color} relative z-10 opacity-70`}>
          AWAITING RESPONSE...
        </div>
      </div>
    </div>
  );
};
