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
    <aside className="w-full bg-white rounded-2xl md:rounded-3xl border border-slate-200/70 flex flex-col p-3 sm:p-4 gap-2.5 sm:gap-3 shadow-xs h-full min-h-0 overflow-hidden">
      {/* Title & Entry Counter with integrated quick actions */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 shrink-0">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          <span>Senarai Murid</span>
          <span className="text-xs font-semibold text-slate-400 ml-1">
            ({namesArray.length} nama)
          </span>
        </h2>
        
        {/* Compact action buttons header */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={handleShuffle}
            disabled={isSpinning || namesArray.length === 0}
            title="Rawak semula senarai"
            className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-lg text-slate-500 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Shuffle className="w-3.5 h-3.5 text-blue-500" />
          </button>
          <button
            onClick={handleSort}
            disabled={isSpinning || namesArray.length === 0}
            title="Susun ikut abjad A-Z"
            className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-lg text-slate-500 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SortAsc className="w-3.5 h-3.5 text-blue-500" />
          </button>
          <button
            onClick={handleClear}
            disabled={isSpinning || namesArray.length === 0}
            title="Padam semua"
            className="p-1.5 hover:bg-red-50 hover:text-red-500 active:scale-95 rounded-lg text-slate-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>

      {/* Preset List Dropdown Overlay inside spacing */}
      {showPresets && (
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 animate-fadeIn shrink-0">
          <p className="text-xs font-bold text-slate-700 mb-1.5">Pilih Senarai Templat:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset.items)}
                className="text-left text-xs text-gray-600 hover:text-blue-600 hover:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 transition-all font-medium cursor-pointer"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main High-Density Textarea wrapper */}
      <div className="flex-1 relative flex flex-col min-h-[130px]">
        <textarea
          id="names-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isSpinning}
          placeholder="Masukkan nama murid di sini&#10;Satu murid setiap baris...&#10;&#10;Contoh:&#10;Ahmad 🌸&#10;Siti 🚀&#10;Muhammad ⭐"
          className="w-full flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium leading-relaxed text-slate-700 transition-all text-xs sm:text-sm shadow-inner disabled:opacity-60 disabled:cursor-not-allowed overflow-y-auto"
        />

        {/* Floating miniature notification if center logo active */}
        {centerImage && (
          <div className="absolute bottom-2.5 right-2.5 bg-white/95 border border-slate-200/80 p-1.5 rounded-lg shadow-xs flex items-center gap-1.5">
            <img src={centerImage} alt="Center Logo" className="w-4 h-4 rounded object-cover" />
            <span className="text-[10px] text-slate-500 font-bold">Logo Tengah</span>
          </div>
        )}
      </div>

      {/* Action buttons matching Design grid */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
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
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>{centerImage ? 'Buang Logo' : 'Tambah Imej'}</span>
        </button>

        <button
          onClick={onOpenCustomize}
          disabled={isSpinning}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>Tetapan Roda</span>
        </button>
      </div>

      {/* Additional high-density lists builder utility */}
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={onOpenClassrooms}
          className="flex-1 py-1.5 px-2 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-xl text-[11px] font-bold text-blue-700 text-center transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
          id="btn-entries-classroom-saver"
          title="Simpan atau muat senarai kelas dengan Google"
        >
          <Users className="w-3 h-3 text-blue-600" />
          <span>Simpan Kelas</span>
        </button>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex-1 py-1.5 px-2 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-50 text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <ListPlus className="w-3 h-3 text-slate-500" />
          <span>Templat</span>
        </button>
        <button
          onClick={handleAddRandomEmoji}
          className="py-1.5 px-2 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-50 text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
          title="Tambah emoji secara rawak pada setiap murid"
        >
          <SmilePlus className="w-3 h-3 text-slate-500" />
        </button>
      </div>

      {/* Under-entries mini dynamic navigation links */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3 text-[10px] font-bold text-slate-400 select-none shrink-0">
        <button onClick={onOpenCustomize} className="hover:text-slate-600 uppercase tracking-widest transition-colors cursor-pointer">Tetapan</button>
        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
        <button onClick={() => alert("Name Picker: Masukkan senarai nama di sini, klik putar roda atau susun murid ke dalam kumpulan secara rawak.")} className="hover:text-slate-600 uppercase tracking-widest transition-colors cursor-pointer">Bantuan</button>
        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
        <button onClick={() => alert("Cadangan atau maklum balas boleh dihantar ke AmeirAdha4@gmail.com.")} className="hover:text-slate-600 uppercase tracking-widest transition-colors cursor-pointer">Maklum Balas</button>
      </div>
    </aside>
  );
}
