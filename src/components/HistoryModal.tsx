import React from 'react';
import { X, Trash2, Calendar, ClipboardCopy, FileText, Share2 } from 'lucide-react';
import { SpinResult } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: SpinResult[];
  onClearHistory: () => void;
}

export default function HistoryModal({
  isOpen,
  onClose,
  results,
  onClearHistory,
}: HistoryModalProps) {
  if (!isOpen) return null;

  const handleCopyAll = () => {
    if (results.length === 0) return;
    const namesList = results.map((r, i) => `${i + 1}. ${r.name} (${r.timestamp})`).join('\n');
    navigator.clipboard.writeText(namesList).then(() => {
      alert('Copied results history to clipboard!');
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
        id="results-history-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800 font-sans tracking-tight">
              Spin History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 select-none">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4 border border-dashed border-gray-200">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-gray-700">No spin results yet</p>
              <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">
                Spin the wheel to pick random winners! Previous results will be logged here securely.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  Logged Winners
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {results.length} total
                </span>
              </div>
              
              <div className="divide-y divide-gray-100">
                {results.map((res, index) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between py-3 font-medium text-sm text-gray-700 hover:bg-gray-50/50 px-2 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5 text-center">
                        #{results.length - index}
                      </span>
                      <span className="font-semibold text-gray-800">{res.name}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {res.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {results.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClearHistory}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-100 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              id="btn-clear-history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
            <button
              onClick={handleCopyAll}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/15"
              id="btn-copy-history"
            >
              <ClipboardCopy className="w-3.5 h-3.5" />
              <span>Copy History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
