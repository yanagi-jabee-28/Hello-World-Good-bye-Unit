
import React, { useState, useEffect } from 'react';
import { GameState, ActionType } from '../types';
import { SaveSlotId, getSaveList, saveToSlot, loadGame, deleteSave, exportSaveData, importSaveData, clearAllData, SaveMetadata } from '../logic/storage';
import { X, Save, Upload, Download, Trash2, HardDrive, AlertOctagon, FileJson } from 'lucide-react';

interface Props {
  currentState: GameState;
  onClose: () => void;
  onLoad: (state: GameState) => void;
  onReset: () => void;
}

type Tab = 'SAVE' | 'LOAD' | 'SYSTEM';

export const SaveLoadModal: React.FC<Props> = ({ currentState, onClose, onLoad, onReset }) => {
  const [activeTab, setActiveTab] = useState<Tab>('SAVE');
  const [saveList, setSaveList] = useState<SaveMetadata[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: 'overwrite' | 'delete' | 'load' | 'reset', slotId?: SaveSlotId } | null>(null);

  useEffect(() => {
    refreshList();
  }, []);

  const refreshList = () => {
    setSaveList(getSaveList());
  };

  const handleSave = (slotId: SaveSlotId) => {
    saveToSlot(currentState, slotId);
    refreshList();
    setConfirmAction(null);
  };

  const handleLoad = (slotId: SaveSlotId) => {
    const loadedState = loadGame(slotId);
    if (loadedState) {
      onLoad(loadedState);
      onClose();
    }
  };

  const handleDelete = (slotId: SaveSlotId) => {
    deleteSave(slotId);
    refreshList();
    setConfirmAction(null);
  };

  const handleExport = () => {
    const json = exportSaveData(currentState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsa_save_day${currentState.day}_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importSaveData(file)
      .then((state) => {
        onLoad(state);
        onClose();
      })
      .catch((err) => {
        alert('セーブデータの読み込みに失敗しました。\n' + err.message);
      });
  };

  const handleFactoryReset = () => {
    setConfirmAction({ type: 'reset' });
  };

  // --- RENDER HELPERS ---

  const renderSlot = (slot: SaveMetadata) => {
    const isAuto = slot.id === 'auto';
    const hasData = slot.timestamp > 0;
    const dateStr = hasData ? new Date(slot.timestamp).toLocaleString() : '---';

    return (
      <div key={slot.id} className={`border border-gray-800 bg-gray-900/50 p-3 flex items-center justify-between group transition-all ${hasData ? 'hover:border-green-700' : 'opacity-70'}`}>
        <div className="flex-1">
           <div className="flex items-center gap-2 mb-1">
             <span className={`font-bold font-mono ${isAuto ? 'text-yellow-500' : 'text-green-400'}`}>
               {isAuto ? 'AUTO_SAVE' : `SLOT_${slot.id}`}
             </span>
             <span className="text-[10px] text-gray-500">{dateStr}</span>
           </div>
           <div className="text-xs text-gray-300 font-mono truncate">
             {slot.summary}
           </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {activeTab === 'SAVE' && (
             <button
               onClick={() => setConfirmAction({ type: 'overwrite', slotId: slot.id })}
               className="px-3 py-1 bg-green-900/30 border border-green-700 text-green-400 text-xs hover:bg-green-700 hover:text-black transition-colors"
             >
               SAVE
             </button>
          )}
          {activeTab === 'LOAD' && hasData && (
             <button
               onClick={() => handleLoad(slot.id)}
               className="px-3 py-1 bg-blue-900/30 border border-blue-700 text-blue-400 text-xs hover:bg-blue-700 hover:text-black transition-colors"
             >
               LOAD
             </button>
          )}
          {!isAuto && hasData && (
             <button
               onClick={() => setConfirmAction({ type: 'delete', slotId: slot.id })}
               className="p-1 text-gray-600 hover:text-red-500 transition-colors"
               title="Delete Slot"
             >
               <Trash2 size={14} />
             </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-[fadeIn_0.2s]">
      <div className="max-w-2xl w-full h-[80vh] border-2 border-green-800 bg-black shadow-[0_0_50px_rgba(34,197,94,0.15)] flex flex-col relative">
        
        {/* Header */}
        <div className="flex-none flex justify-between items-center p-4 border-b border-green-900 bg-green-900/10">
           <h2 className="text-xl font-bold text-green-500 flex items-center gap-2 tracking-wider">
             <HardDrive className="text-green-400" /> SYSTEM_MENU
           </h2>
           <button onClick={onClose} className="text-green-700 hover:text-green-400 transition-colors">
             <X size={24} />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-green-900">
           {['SAVE', 'LOAD', 'SYSTEM'].map(t => (
             <button
               key={t}
               onClick={() => setActiveTab(t as Tab)}
               className={`flex-1 py-3 text-sm font-bold tracking-widest transition-colors ${
                 activeTab === t 
                 ? 'bg-green-900/30 text-green-400 border-b-2 border-green-500' 
                 : 'text-gray-600 hover:text-gray-300 hover:bg-gray-900'
               }`}
             >
               {t}
             </button>
           ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
           {activeTab === 'SYSTEM' ? (
             <div className="space-y-6 p-2">
                {/* Export */}
                <div className="border border-gray-800 p-4 rounded bg-gray-900/30">
                  <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                    <Download size={16} /> DATA_EXPORT
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    現在の進行状況をJSONファイルとしてダウンロードします。バックアップや別端末への移動に使用できます。
                  </p>
                  <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-900/50 border border-green-700 text-green-400 text-xs hover:bg-green-800 transition-colors">
                    JSON保存 (.json)
                  </button>
                </div>

                {/* Import */}
                <div className="border border-gray-800 p-4 rounded bg-gray-900/30">
                  <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                    <Upload size={16} /> DATA_IMPORT
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    エクスポートしたJSONファイルを読み込み、状態を復元します。現在の進行状況は上書きされます。
                  </p>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-900/50 border border-blue-700 text-blue-400 text-xs hover:bg-blue-800 transition-colors w-fit cursor-pointer">
                    <FileJson size={14} />
                    ファイルを選択してロード
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </div>

                {/* Factory Reset */}
                <div className="border border-red-900/50 p-4 rounded bg-red-900/10 mt-8">
                  <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2">
                    <AlertOctagon size={16} /> FACTORY_RESET
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    【危険】全てのセーブデータとシステム設定（強くてニューゲーム状態含む）を完全に削除し、初期化します。この操作は取り消せません。
                  </p>
                  <button onClick={handleFactoryReset} className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-700 text-red-500 text-xs hover:bg-red-900/50 transition-colors">
                    <Trash2 size={14} /> 全データ完全消去
                  </button>
                </div>
             </div>
           ) : (
             <>
               {saveList.map(slot => renderSlot(slot))}
             </>
           )}
        </div>

        {/* Confirmation Overlay */}
        {confirmAction && (
          <div className="absolute inset-0 z-10 bg-black/80 flex items-center justify-center p-8 animate-[fadeIn_0.2s]">
             <div className={`border-2 ${confirmAction.type === 'reset' ? 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)]' : 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]'} bg-black p-6 max-w-sm w-full`}>
               <h3 className={`text-lg font-bold ${confirmAction.type === 'reset' ? 'text-red-500 animate-pulse' : 'text-white'} mb-2`}>
                 {confirmAction.type === 'reset' ? '⚠ DANGER ZONE ⚠' : 'CONFIRMATION'}
               </h3>
               <p className="text-sm text-gray-300 mb-6 leading-relaxed whitespace-pre-wrap">
                 {confirmAction.type === 'overwrite' && 'このスロットに上書きしますか？\n古いデータは完全に失われます。'}
                 {confirmAction.type === 'delete' && 'このデータを削除しますか？\n復元することはできません。'}
                 {confirmAction.type === 'reset' && '全てのセーブデータと進行状況を完全に削除し、初期化します。\nこの操作は絶対に取り消せません。\n本当によろしいですか？'}
               </p>
               <div className="flex gap-3 justify-end">
                 <button 
                   onClick={() => setConfirmAction(null)}
                   className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors border border-transparent hover:border-gray-600"
                 >
                   CANCEL
                 </button>
                 <button 
                   onClick={() => {
                     if (confirmAction.type === 'overwrite' && confirmAction.slotId) handleSave(confirmAction.slotId);
                     if (confirmAction.type === 'delete' && confirmAction.slotId) handleDelete(confirmAction.slotId);
                     if (confirmAction.type === 'reset') {
                        clearAllData();
                        onReset(); // In-memory reset
                        onClose();
                     }
                   }}
                   className={`px-6 py-2 text-xs font-bold transition-all transform hover:scale-105 ${
                     confirmAction.type === 'reset' 
                       ? 'bg-red-700 text-white hover:bg-red-600 shadow-lg shadow-red-900/50' 
                       : 'bg-green-700 text-black hover:bg-green-500 shadow-lg shadow-green-900/50'
                   }`}
                 >
                   EXECUTE
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
