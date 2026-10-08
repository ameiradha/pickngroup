import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Wheel from './components/Wheel';
import Entries from './components/Entries';
import GroupSorter from './components/GroupSorter';
import CustomizeModal from './components/CustomizeModal';
import WinnerModal from './components/WinnerModal';
import HistoryModal from './components/HistoryModal';
import Confetti from './components/Confetti';
import ClassroomModal from './components/ClassroomModal';
import { WheelSettings, SpinResult } from './types';
import { playWinSound } from './audio';
import { Sparkles, Users } from 'lucide-react';


const DEFAULT_SETTINGS: WheelSettings = {
  spinTime: 5,
  volume: 0.6,
  spinSound: 'tick',
  winnerSound: 'fanfare',
  allowDuplicates: true,
  autoRemoveWinner: false,
  paletteId: 'vibrant',
  centerEmoji: '✨',
  centerText: '',
  centerImage: null,
  customColors: ['#f43f5e', '#3b82f6', '#eab308', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4'],
  launchConfetti: true,
};

const INITIAL_NAMES = [
  'Alice 🌸',
  'Bob 🚀',
  'Charlie 🎨',
  'David 🍕',
  'Emma ⭐',
  'Frank 🍀',
  'Grace 🎵',
  'Henry 🌟',
];

export default function App() {
  const [namesText, setNamesText] = useState<string>(() => {
    const saved = localStorage.getItem('won_names_list');
    return saved !== null ? saved : INITIAL_NAMES.join('\n');
  });

  const [settings, setSettings] = useState<WheelSettings>(() => {
    const saved = localStorage.getItem('won_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Fallback for newer fields
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [history, setHistory] = useState<SpinResult[]>(() => {
    const saved = localStorage.getItem('won_spin_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  
  // Modals
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWinnerOpen, setIsWinnerOpen] = useState(false);
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const [isClassroomOpen, setIsClassroomOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'wheel' | 'sorter'>('wheel');
  const [sorterFullWidth, setSorterFullWidth] = useState<boolean>(false);


  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('won_names_list', namesText);
  }, [namesText]);

  useEffect(() => {
    localStorage.setItem('won_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('won_spin_history', JSON.stringify(history));
  }, [history]);

  // Handle Ctrl+Enter global shortcut to Spin the wheel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        const parsedNames = getNamesArray();
        if (parsedNames.length > 0 && !isSpinning) {
          handleSpinStart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [namesText, isSpinning]);

  // Parse lines to clean array
  const getNamesArray = (): string[] => {
    const raw = namesText
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (!settings.allowDuplicates) {
      // Remove exact duplicates
      return Array.from(new Set(raw));
    }
    return raw;
  };

  const handleSpinStart = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setIsWinnerOpen(false);
    setIsConfettiActive(false);
    setCurrentWinner(null);
  };

  const handleSpinEnd = (winnerName: string) => {
    setIsSpinning(false);
    setCurrentWinner(winnerName);
    setIsWinnerOpen(true);

    // Play triumphant celebration chime/sound
    playWinSound(settings.winnerSound, settings.volume);

    // Confetti
    if (settings.launchConfetti) {
      setIsConfettiActive(true);
    }

    // Log to history
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    
    const logItem: SpinResult = {
      id: Math.random().toString(36).substring(2, 9),
      name: winnerName,
      timestamp,
    };
    setHistory((prev) => [logItem, ...prev]);

    // Handle Auto-Remove Winner immediately
    if (settings.autoRemoveWinner) {
      removeWinnerFromList(winnerName);
    }
  };

  // Remove winner from the list helper
  const removeWinnerFromList = (nameToRemove: string) => {
    const raw = namesText.split('\n');
    // Find first occurrence and remove it
    const index = raw.findIndex((line) => line.trim() === nameToRemove.trim());
    if (index !== -1) {
      raw.splice(index, 1);
      setNamesText(raw.join('\n'));
    }
  };

  const handleRemoveWinnerAction = () => {
    if (currentWinner) {
      removeWinnerFromList(currentWinner);
    }
    setIsWinnerOpen(false);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire spin history?')) {
      setHistory([]);
    }
  };

  const handleUploadCenterImage = (dataUrl: string | null) => {
    setSettings((prev) => ({
      ...prev,
      centerImage: dataUrl,
      // Clear center emoji/text if image is uploaded to avoid overlapping text
      centerEmoji: dataUrl ? '' : prev.centerEmoji,
      centerText: dataUrl ? '' : prev.centerText,
    }));
  };

  const cleanNames = getNamesArray();

  return (
    <div className="min-h-screen md:h-screen md:max-h-screen md:overflow-hidden bg-slate-50/60 font-sans text-gray-800 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Background visual soft details */}
      <div className="absolute top-0 left-0 right-0 h-[380px] bg-linear-to-b from-blue-50/30 via-transparent to-transparent pointer-events-none -z-10" />

      {/* Persistent Confetti Overlay */}
      <Confetti active={isConfettiActive} duration={3500} />

      {/* Header element */}
      <Header
        onOpenCustomize={() => setIsCustomizeOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenClassrooms={() => setIsClassroomOpen(true)}
        historyCount={history.length}
      />

      {/* Main Grid content wrapper: Full Width Edge-to-Edge with Viewport Fit on Tablet */}
      <main className="flex-1 min-h-0 w-full max-w-full px-2 sm:px-3 md:px-4 lg:px-5 py-2 sm:py-2.5 flex flex-col gap-2 sm:gap-2.5 overflow-hidden">
        
        {/* Activity Mode Segmented Control Tab Bar */}
        <div className="flex items-center justify-between bg-white border border-slate-200/70 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 shadow-2xs shrink-0 w-full">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xs font-black text-slate-800 tracking-tight uppercase">Mod Aktiviti:</h2>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:inline">Pilih seorang murid atau susun murid ke dalam kumpulan</p>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg sm:rounded-xl shrink-0">
            <button
              onClick={() => setActiveMode('wheel')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-md sm:rounded-lg transition-all cursor-pointer ${
                activeMode === 'wheel'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Putar Roda</span>
            </button>
            <button
              onClick={() => setActiveMode('sorter')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-md sm:rounded-lg transition-all cursor-pointer ${
                activeMode === 'sorter'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Susun Kumpulan</span>
            </button>
          </div>
        </div>

        {/* Dynamic 2-column or full-width workspace (side-by-side on tablet md:) */}
        <div className={`grid grid-cols-1 ${activeMode === 'sorter' && sorterFullWidth ? 'md:grid-cols-1' : 'md:grid-cols-12'} gap-2.5 sm:gap-3.5 items-stretch flex-1 min-h-0 w-full`}>
          {/* Main Interactive Canvas / Workspace (Left Column) */}
          <div className={`${activeMode === 'sorter' && sorterFullWidth ? 'md:col-span-1' : 'md:col-span-7 lg:col-span-8'} flex flex-col bg-white rounded-2xl md:rounded-3xl border border-slate-200/70 p-3 sm:p-4 shadow-xs relative min-h-0 overflow-hidden`}>
            {activeMode === 'wheel' ? (
              <div className="flex-1 w-full h-full min-h-0 flex flex-col justify-center items-center overflow-hidden relative">
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex items-center gap-1.5 select-none opacity-45">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Roda Nama Aktif</span>
                </div>
                
                <Wheel
                  names={cleanNames}
                  isSpinning={isSpinning}
                  onSpinStart={handleSpinStart}
                  onSpinEnd={handleSpinEnd}
                  settings={settings}
                />
              </div>
            ) : (
              <div className="flex-1 w-full h-full min-h-0 flex flex-col overflow-hidden">
                <GroupSorter
                  names={cleanNames}
                  onChangeNames={setNamesText}
                  isSpinning={isSpinning}
                  isFullWidth={sorterFullWidth}
                  onToggleFullWidth={() => setSorterFullWidth(prev => !prev)}
                />
              </div>
            )}
          </div>

          {/* Clean Names Entries panel (Right Column) */}
          {(!sorterFullWidth || activeMode === 'wheel') && (
            <div className="md:col-span-5 lg:col-span-4 flex flex-col h-full min-h-0">
              <Entries
                value={namesText}
                onChange={setNamesText}
                isSpinning={isSpinning}
                onUploadCenterImage={handleUploadCenterImage}
                centerImage={settings.centerImage}
                onOpenCustomize={() => setIsCustomizeOpen(true)}
                onOpenClassrooms={() => setIsClassroomOpen(true)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals & Popups Overlays */}
      <ClassroomModal
        isOpen={isClassroomOpen}
        onClose={() => setIsClassroomOpen(false)}
        currentNames={namesText}
        onLoadNames={setNamesText}
      />

      <CustomizeModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        results={history}
        onClearHistory={handleClearHistory}
      />

      <WinnerModal
        isOpen={isWinnerOpen}
        winner={currentWinner}
        onClose={() => {
          setIsWinnerOpen(false);
          setIsConfettiActive(false);
        }}
        onRemoveWinner={handleRemoveWinnerAction}
      />

      {/* Slim Quick-Tip Footer */}
      <footer className="h-6 sm:h-7 shrink-0 px-4 border-t border-slate-100 bg-white/70 flex items-center justify-between text-[11px] text-slate-400 select-none">
        <p className="font-semibold truncate">Name Picker & Group Sorter</p>
        <p className="text-[10px] opacity-75 truncate">Disimpan secara automatik</p>
      </footer>
    </div>
  );
}
