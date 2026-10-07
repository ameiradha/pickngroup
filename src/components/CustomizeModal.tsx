import React, { useState } from 'react';
import { X, Volume2, Music, Timer, Sparkles, Palette, Settings, Smile } from 'lucide-react';
import { WheelSettings, PaletteId } from '../types';
import { THEME_PALETTES } from '../themePalettes';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WheelSettings;
  onSaveSettings: (settings: WheelSettings) => void;
}

const EMOJI_OPTIONS = ['✨', '⭐', '🎉', '🔥', '👑', '🚀', '🎯', '🍀', '💎', '🍕', '🐱', '⚽', '💡', '🌈'];

export default function CustomizeModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}: CustomizeModalProps) {
  const [activeTab, setActiveTab] = useState<'wheel' | 'sounds' | 'advanced'>('wheel');
  const [localSettings, setLocalSettings] = useState<WheelSettings>({ ...settings });
  const [customColorInput, setCustomColorInput] = useState('#2563eb');

  if (!isOpen) return null;

  const updateField = <K extends keyof WheelSettings>(field: K, value: WheelSettings[K]) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const addCustomColor = () => {
    if (/^#[0-9A-F]{6}$/i.test(customColorInput)) {
      const updatedColors = [...localSettings.customColors, customColorInput];
      updateField('customColors', updatedColors);
      updateField('paletteId', 'classic'); // Switch to custom palette when color is added
    }
  };

  const removeCustomColor = (index: number) => {
    const updatedColors = localSettings.customColors.filter((_, i) => i !== index);
    updateField('customColors', updatedColors);
  };

  const resetCustomColors = () => {
    updateField('customColors', ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        id="customize-settings-dialog"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800 font-sans tracking-tight">
              Customize Wheel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            id="btn-close-customize"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-3 py-1">
          <button
            onClick={() => setActiveTab('wheel')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold rounded-xl transition-all border-b-2 ${
              activeTab === 'wheel'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
            id="tab-wheel"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Colors</span>
          </button>
          
          <button
            onClick={() => setActiveTab('sounds')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold rounded-xl transition-all border-b-2 ${
              activeTab === 'sounds'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
            id="tab-sounds"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Sounds & Music</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold rounded-xl transition-all border-b-2 ${
              activeTab === 'advanced'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
            id="tab-advanced"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Spin & Rules</span>
          </button>
        </div>

        {/* Modal Body (Scrollable settings) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: WHEEL COLORS & LOOK */}
          {activeTab === 'wheel' && (
            <div className="space-y-6">
              {/* Color Palettes */}
              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">
                  Color Palette
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {THEME_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => updateField('paletteId', pal.id)}
                      className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                        localSettings.paletteId === pal.id
                          ? 'border-blue-500 bg-blue-50/25 ring-2 ring-blue-500/10'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-gray-700 mb-2">
                        {pal.name}
                      </span>
                      <div className="flex gap-1 overflow-hidden w-full h-4 rounded-md">
                        {pal.colors.slice(0, 6).map((c, i) => (
                          <div
                            key={i}
                            className="flex-1 h-full"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                  
                  {/* Custom Palette Option Trigger */}
                  <button
                    onClick={() => updateField('paletteId', 'classic')}
                    className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                      localSettings.paletteId === 'classic'
                        ? 'border-blue-500 bg-blue-50/25 ring-2 ring-blue-500/10'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-xs font-bold text-gray-700 mb-2">
                      🎨 Custom Palette
                    </span>
                    <div className="flex gap-1 overflow-hidden w-full h-4 rounded-md bg-gray-50 border border-dashed border-gray-200 justify-center items-center text-[9px] font-bold text-gray-400">
                      Edit custom list below
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom Colors Editor */}
              {localSettings.paletteId === 'classic' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Customize Custom Palette</span>
                    <button
                      onClick={resetCustomColors}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Reset to Default
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {localSettings.customColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-gray-100 text-xs font-bold shadow-xs"
                      >
                        <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: color }} />
                        <span className="font-mono text-[10px] text-gray-500 uppercase">{color}</span>
                        <button
                          onClick={() => removeCustomColor(idx)}
                          className="text-red-400 hover:text-red-600 font-bold"
                          title="Remove color"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="color"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      placeholder="#FFFFFF"
                      maxLength={7}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={addCustomColor}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Add Color
                    </button>
                  </div>
                </div>
              )}

              {/* Center Wheel Design (Emoji and text) */}
              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                  Wheel Center Decoration
                </label>
                <p className="text-[11px] text-gray-400 mb-3">
                  Choose a central design. Emojis take priority over text labels.
                </p>

                {/* Emojis Selector Grid */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  <button
                    onClick={() => {
                      updateField('centerEmoji', '');
                      updateField('centerText', 'STAR');
                    }}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      !localSettings.centerEmoji
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    None
                  </button>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        updateField('centerEmoji', emoji);
                        updateField('centerText', '');
                      }}
                      className={`py-2 text-lg rounded-xl border transition-all ${
                        localSettings.centerEmoji === emoji
                          ? 'bg-blue-50 border-blue-400 scale-105'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Custom Text Option */}
                {!localSettings.centerEmoji && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600">Custom Center Text Label</label>
                    <input
                      type="text"
                      maxLength={12}
                      value={localSettings.centerText}
                      onChange={(e) => updateField('centerText', e.target.value)}
                      placeholder="e.g. WINNER"
                      className="w-full px-4 py-2.5 border border-gray-100 hover:border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 font-semibold transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SOUNDS & MASTER VOLUME */}
          {activeTab === 'sounds' && (
            <div className="space-y-6">
              {/* Spinning Sound */}
              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">
                  Spinning Sound Effect
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['tick', 'synth', 'woodblock', 'none'] as const).map((sound) => (
                    <button
                      key={sound}
                      onClick={() => updateField('spinSound', sound)}
                      className={`py-3 px-4 rounded-2xl border text-left font-bold text-xs transition-all flex flex-col capitalize ${
                        localSettings.spinSound === sound
                          ? 'border-blue-500 bg-blue-50/30 text-blue-700'
                          : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      <span>{sound === 'tick' ? 'Classic Tick' : sound === 'synth' ? 'Arcade Bubbly' : sound === 'woodblock' ? 'Wooden Block' : 'Muted (Silent)'}</span>
                      <span className="text-[10px] text-gray-400 font-medium normal-case mt-1">
                        {sound === 'none' ? 'Totally quiet spins' : 'Tactile tick-tocks'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Winning Theme Chord */}
              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">
                  Winner Triumphant Sound
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['fanfare', 'chime', 'laser', 'none'] as const).map((sound) => (
                    <button
                      key={sound}
                      onClick={() => updateField('winnerSound', sound)}
                      className={`py-3 px-4 rounded-2xl border text-left font-bold text-xs transition-all flex flex-col capitalize ${
                        localSettings.winnerSound === sound
                          ? 'border-blue-500 bg-blue-50/30 text-blue-700'
                          : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      <span>{sound}</span>
                      <span className="text-[10px] text-gray-400 font-medium normal-case mt-1">
                        {sound === 'fanfare' ? 'Triads celebration' : sound === 'chime' ? 'Wind chime chime' : sound === 'laser' ? 'Retro laser sweep' : 'Quiet winner reveals'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                    Sound Effects Volume
                  </label>
                  <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    {Math.round(localSettings.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.volume}
                  onChange={(e) => updateField('volume', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SPIN RULES & PERFORMANCE */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Spin Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                    Spin Duration (Seconds)
                  </label>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {localSettings.spinTime}s
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">
                  How long the wheel spins before slowing down to reveal the winning choice.
                </p>
                <div className="flex gap-4 items-center">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={localSettings.spinTime}
                    onChange={(e) => updateField('spinTime', parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={localSettings.spinTime}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 5;
                      updateField('spinTime', Math.max(1, Math.min(30, val)));
                    }}
                    className="w-16 text-center px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Celebration Confetti */}
              <div className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="pr-4">
                  <span className="block text-xs font-bold text-slate-800">
                    Confetti Explosions
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Launch a colorful, immersive confetti storm when a winner is chosen.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('launchConfetti', !localSettings.launchConfetti)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    localSettings.launchConfetti ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 left-1 ${
                      localSettings.launchConfetti ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Allow Duplicate Names */}
              <div className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="pr-4">
                  <span className="block text-xs font-bold text-slate-800">
                    Allow Duplicate Entries
                  </span>
                  <span className="text-[11px] text-slate-400">
                    If false, duplicate matching names inside the list are combined/sanitized on the wheel.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('allowDuplicates', !localSettings.allowDuplicates)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    localSettings.allowDuplicates ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 left-1 ${
                      localSettings.allowDuplicates ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Auto Remove Winner */}
              <div className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="pr-4">
                  <span className="block text-xs font-bold text-slate-800">
                    Auto-Remove Winner From List
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Automatically delete the chosen name from the entry list so they can only win once.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('autoRemoveWinner', !localSettings.autoRemoveWinner)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    localSettings.autoRemoveWinner ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-1 left-1 ${
                      localSettings.autoRemoveWinner ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] text-gray-400 font-medium">
            Changes are saved in real-time automatically
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            id="btn-done-customize"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
