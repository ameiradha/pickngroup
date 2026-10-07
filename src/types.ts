export type PaletteId = 'vibrant' | 'neon' | 'pastel' | 'ocean' | 'sunset' | 'retro' | 'forest' | 'classic';

export interface ThemePalette {
  id: PaletteId;
  name: string;
  colors: string[];
}

export interface WheelSettings {
  spinTime: number; // in seconds
  volume: number; // 0 to 1
  spinSound: 'tick' | 'synth' | 'woodblock' | 'none';
  winnerSound: 'fanfare' | 'chime' | 'laser' | 'none';
  allowDuplicates: boolean;
  autoRemoveWinner: boolean;
  paletteId: PaletteId;
  centerEmoji: string;
  centerText: string;
  centerImage: string | null; // Data URL or image URL
  customColors: string[];
  launchConfetti: boolean;
}

export interface SpinResult {
  id: string;
  name: string;
  timestamp: string;
}

export interface EntryItem {
  id: string;
  name: string;
  weight: number;
  image?: string; // Optional image URL or base64 for custom entry image
}

export interface Classroom {
  id: string;
  name: string;
  names: string[];
  lastModified: string;
}

export interface UserProfile {
  teacherName: string;
  schoolName: string;
  isLoggedIn: boolean;
}

