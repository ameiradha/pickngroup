import React, { useRef, useState } from 'react';
import { Shuffle, SortAsc, Trash2, ListPlus, SmilePlus, Image as ImageIcon, Users } from 'lucide-react';

interface EntriesProps {
  value: string;
  onChange: (newValue: string) => void;
  isSpinning: boolean;
  onUploadCenterImage: (dataUrl: string | null) => void;
  centerImage: string | null;
  onOpenCustomize: () => void;
  onOpenClassrooms: () => void;
}

const PRESETS = [
  {
    name: '👥 Names Picker',
    items: ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'],
  },
  {
    name: '🍕 Dinner Decider',
    items: ['Pizza 🍕', 'Burgers 🍔', 'Sushi 🍣', 'Tacos 🌮', 'Pasta 🍝', 'Salad 🥗', 'Ramen 🍜', 'Thai Curry 🍛'],
  },
  {
    name: '🎲 Yes / No / Maybe',
    items: ['Yes! ✅', 'No ❌', 'Maybe 🤔', 'Spin Again 🔄', 'Ask later ⏳', 'Absolutely! 🌟'],
  },
  {
    name: '🔢 Lucky Numbers',
    items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  },
  {
    name: '🚀 Fun Activities',
    items: ['Watch a Movie 🍿', 'Read a Book 📚', 'Go for a Run 🏃', 'Play Video Games 🎮', 'Cook a New Recipe 🍳', 'Draw/Paint 🎨'],
  }
];

const EMOJIS = ['⭐', '🔥', '🎉', '🍀', '🍕', '🚀', '🎁', '💡', '👑', '🌈', '🍦', '🦁', '🐱', '⚽', '🎯'];

export default function Entries({
  value,
  onChange,
  isSpinning,
  onUploadCenterImage,
  centerImage,
  onOpenCustomize,
  onOpenClassrooms,
}: EntriesProps) {
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse lines to count valid names
  const namesArray = value
    .split('\n')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  const handleShuffle = () => {
    if (namesArray.length === 0) return;
    const shuffled = [...namesArray];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    onChange(shuffled.join('\n'));
  };

  const handleSort = () => {
    if (namesArray.length === 0) return;
    const sorted = [...namesArray].sort((a, b) => a.localeCompare(b));
    onChange(sorted.join('\n'));
  };

  const handleClear = () => {
    onChange('');
  };

  const handlePresetSelect = (presetItems: string[]) => {
    onChange(presetItems.join('\n'));
    setShowPresets(false);
  };

  const handleAddRandomEmoji = () => {
    if (namesArray.length === 0) {
      onChange(EMOJIS.join('\n'));
    } else {
      const updated = namesArray.map(
        (name) => `${name} ${EMOJIS[Math.floor(Math.random() * EMOJIS.length)]}`
      );
      onChange(updated.join('\n'));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onUploadCenterImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveCenterImage = () => {
    onUploadCenterImage(null);
  };

  return (
    <aside className="w-full lg:w-[420px] bg-white border-l border-slate-200 flex flex-col p-6 gap-6 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] h-full">
      {/* Title & Entry Counter with integrated quick actions */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          <span>Entries</span>
          <span className="text-xs font-normal text-slate-400 ml-1">
            {namesArray.length} {namesArray.length === 1 ? 'name' : 'names'} added
          </span>
        </h2>
        
        {/* Compact action buttons header */}
        <div className="flex gap-1.5">
          <button
            onClick={handleShuffle}
            disabled={isSpinning || namesArray.length === 0}
            title="Shuffle"
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Shuffle className="w-4 h-4 text-blue-500" />
          </button>
          <button
            onClick={handleSort}
            disabled={isSpinning || namesArray.length === 0}
            title="Sort A-Z"
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SortAsc className="w-4 h-4 text-blue-500" />
          </button>
          <button
            onClick={handleClear}
            disabled={isSpinning || namesArray.length === 0}
            title="Clear list"
            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Preset List Dropdown Overlay inside spacing */}
      {showPresets && (
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 animate-fadeIn">
          <p className="text-xs font-bold text-slate-700 mb-2">Select a Template List:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset.items)}
                className="text-left text-xs text-gray-600 hover:text-blue-600 hover:bg-white px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-all font-medium"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main High-Density Textarea wrapper */}
      <div className="flex-1 relative flex flex-col min-h-[220px]">
        <textarea
          id="names-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isSpinning}
          placeholder="Enter names or choices here&#10;One per line...&#10;&#10;Examples:&#10;Alice&#10;Bob&#10;Charlie"
          className="w-full flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium leading-loose text-slate-600 transition-all text-sm shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {/* Floating miniature notification if center logo active */}
        {centerImage && (
          <div className="absolute bottom-3 right-3 bg-white/95 border border-slate-200/80 p-1.5 rounded-lg shadow-xs flex items-center gap-1.5">
            <img src={centerImage} alt="Center Logo" className="w-5 h-5 rounded object-cover" />
            <span className="text-[10px] text-slate-500 font-bold">Center Logo</span>
          </div>
        )}
      </div>

      {/* Action buttons matching Design grid */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={centerImage ? handleRemoveCenterImage : triggerFileInput}
          disabled={isSpinning}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-all active:scale-95 disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4 text-slate-500" />
          <span>{centerImage ? 'Clear Logo' : 'Add Image'}</span>
        </button>

        <button
          onClick={onOpenCustomize}
          disabled={isSpinning}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-all active:scale-95 disabled:opacity-50"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>Customize</span>
        </button>
      </div>

      {/* Additional high-density lists builder utility */}
      <div className="flex gap-2">
        <button
          onClick={onOpenClassrooms}
          className="flex-1 py-2 px-3 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-xl text-xs font-bold text-blue-700 text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs"
          id="btn-entries-classroom-saver"
          title="Save or load classroom lists with Google"
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>Classroom Saver</span>
        </button>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 text-center transition-all flex items-center justify-center gap-1.5"
        >
          <ListPlus className="w-3.5 h-3.5 text-slate-500" />
          <span>Preset Lists</span>
        </button>
        <button
          onClick={handleAddRandomEmoji}
          className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 text-center transition-all flex items-center justify-center gap-1.5"
          title="Apply random emojis to entries"
        >
          <SmilePlus className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      {/* Under-entries mini dynamic navigation links */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-bold text-slate-400 select-none">
        <button onClick={onOpenCustomize} className="hover:text-slate-600 uppercase tracking-widest transition-colors">Settings</button>
        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
        <button onClick={() => alert("Welcome to Name Picker! Type choices into the box, click the giant SPIN button, and celebrate your randomized selections.")} className="hover:text-slate-600 uppercase tracking-widest transition-colors">Help</button>
        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
        <button onClick={() => alert("We value your feedback! Send any suggestions to AmeirAdha4@gmail.com.")} className="hover:text-slate-600 uppercase tracking-widest transition-colors">Feedback</button>
      </div>
    </aside>
  );
}
