import React from 'react';
import { X, Award, Trash2, Check, Sparkles } from 'lucide-react';

interface WinnerModalProps {
  isOpen: boolean;
  winner: string | null;
  onClose: () => void;
  onRemoveWinner: () => void;
}

export default function WinnerModal({
  isOpen,
  winner,
  onClose,
  onRemoveWinner,
}: WinnerModalProps) {
  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-center border border-slate-100 p-8 relative animate-zoomIn"
        id="winner-celebration-dialog"
      >
        {/* Confetti sparkle background effect decoration */}
        <div className="absolute top-4 left-4 text-amber-400 opacity-20 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute bottom-4 right-4 text-blue-400 opacity-20 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>

        {/* Top visual decoration */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shadow-inner relative animate-bounce">
            <Award className="w-10 h-10 text-blue-600" />
            <span className="absolute -top-1 -right-1 text-2xl">🎉</span>
          </div>
        </div>

        {/* Headings */}
        <p className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-1 select-none">
          We have a winner!
        </p>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-sans leading-tight px-2 break-words" id="lbl-winner-name">
          {winner}
        </h2>

        {/* Short energetic subtext */}
        <p className="text-sm text-gray-400 font-medium mt-3 mb-8 px-4 select-none">
          Congratulations! What would you like to do with this entry?
        </p>

        {/* CTA Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onRemoveWinner}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-red-50 hover:bg-red-100/80 active:bg-red-200/50 text-red-600 font-bold text-xs transition-all border border-red-100"
            id="btn-remove-winner"
            title="Delete this name from the wheel entries"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Name</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20"
            id="btn-close-winner"
          >
            <Check className="w-4 h-4" />
            <span>Keep & Close</span>
          </button>
        </div>

        {/* Absolute top-right close icon as alternative */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
