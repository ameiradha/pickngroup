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
    <div className="min-h-screen bg-slate-50/60 font-sans text-gray-800 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Background visual soft details */}
      <div className="absolute top-0 left-0 right-0 h-[480px] bg-linear-to-b from-blue-50/30 via-transparent to-transparent pointer-events-none -z-10" />

      {/* Persistent Confetti Overlay */}
      <Confetti active={isConfettiActive} duration={3500} />

      {/* Header element */}
      <Header
        onOpenCustomize={() => setIsCustomizeOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenClassrooms={() => setIsClassroomOpen(true)}
        historyCount={history.length}
      />

      {/* Main Grid content wrapper for Dynamic Interactive Activity Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        
        {/* Activity Mode Segmented Control Tab Bar */}
        <div className="flex items-center justify-between bg-white border border-slate-200/60 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
            <h2 className="text-xs font-black text-slate-800 tracking-tight uppercase">Class Activity:</h2>
            <p className="text-[11px] text-slate-400 font-medium">Switch seamlessly between picking single names or sorting the class into groups</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              onClick={() => setActiveMode('wheel')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeMode === 'wheel'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spin Wheel</span>
            </button>
            <button
              onClick={() => setActiveMode('sorter')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeMode === 'sorter'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Group Sorter</span>
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${activeMode === 'sorter' && sorterFullWidth ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8 items-stretch flex-1`}>
          {/* Main Interactive Canvas / Workspace */}
          <div className={`${activeMode === 'sorter' && sorterFullWidth ? 'lg:col-span-1' : 'lg:col-span-7 xl:col-span-8'} flex flex-col bg-white rounded-3xl border border-slate-200/60 p-5 sm:p-7 shadow-xs relative min-h-[480px]`}>
            {activeMode === 'wheel' ? (
              <div className="flex-1 flex flex-col justify-center items-center h-full overflow-hidden">
                <div className="absolute top-4 left-4 flex items-center gap-1.5 select-none opacity-45">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Active Wheel Canvas</span>
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
              <div className="flex-1 flex flex-col pt-2">
                <div className="flex items-center gap-1.5 select-none opacity-50 mb-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Panel Susun Kumpulan / Group Sorter</span>
                </div>
                
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

          {/* Clean Names Entries panel */}
          <div className={`${activeMode === 'sorter' && sorterFullWidth ? 'lg:col-span-1' : 'lg:col-span-5 xl:col-span-4'} flex flex-col h-full`}>
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

      {/* Sticky Quick-Tip Footer */}
      <footer className="py-6 border-t border-gray-100 text-center text-xs text-gray-400 select-none">
        <p className="font-semibold">Name Picker — Randomized decision making made fast and simple.</p>
        <p className="mt-1 text-[10px] opacity-75">All selections are securely saved locally inside your browser.</p>
      </footer>
    </div>
  );
}
