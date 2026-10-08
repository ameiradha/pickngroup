import React from 'react';
import { Settings, History, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenCustomize: () => void;
  onOpenHistory: () => void;
  onOpenClassrooms: () => void;
  historyCount: number;
}

export default function Header({
  onOpenCustomize,
  onOpenHistory,
  onOpenClassrooms,
  historyCount,
}: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-13 sm:h-14 flex items-center justify-between px-3 sm:px-5 md:px-6 bg-white border-b border-slate-200 sticky top-0 z-40 select-none w-full shrink-0">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0.5 rounded-full border border-dashed border-white/40 animate-spin" style={{ animationDuration: '20s' }}></div>
          <Sparkles className="w-4.5 h-4.5" />
        </div>
        <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900" id="logo-link">
          Name <span className="text-blue-500">Picker</span>
        </h1>
      </div>

      {/* Header Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Classroom Saver Button */}
        <button
          onClick={onOpenClassrooms}
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-bold transition-all border ${
            user
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-xs'
              : 'bg-slate-100 text-slate-700 border-slate-200/60 hover:bg-slate-200'
          }`}
          id="btn-header-classroom"
          title="Classroom Saver - Sign in with Google to sync rosters"
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              referrerPolicy="no-referrer"
              className="w-4.5 h-4.5 rounded-full object-cover border border-blue-300"
            />
          ) : (
            <Users className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span className="hidden md:inline">
            {user ? (user.displayName?.split(' ')[0] || 'My Classes') : 'Classroom Saver'}
          </span>
        </button>

        {/* History Logger */}
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all relative border border-slate-200/40"
          id="btn-header-history"
          title="View previous spin results"
        >
          <History className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline">Results</span>
          {historyCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
              {historyCount}
            </span>
          )}
        </button>

        {/* Customize Settings Panel */}
        <button
          onClick={onOpenCustomize}
          className="flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all shadow-md shadow-blue-500/20"
          id="btn-header-customize"
          title="Customize colors, sounds, and spin physics"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Customize</span>
        </button>
      </div>
    </header>
  );
}

