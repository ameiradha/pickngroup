import { ThemePalette, PaletteId } from './types';

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'vibrant',
    name: 'Vibrant Party',
    colors: [
      '#f43f5e', // rose 500
      '#3b82f6', // blue 500
      '#eab308', // yellow 500
      '#10b981', // emerald 500
      '#8b5cf6', // violet 500
      '#f97316', // orange 500
      '#ec4899', // pink 500
      '#06b6d4', // cyan 500
    ],
  },
  {
    id: 'neon',
    name: 'Neon Cyberpunk',
    colors: [
      '#ff0055', // Neon Pink
      '#00ffcc', // Neon Cyan
      '#9900ff', // Neon Purple
      '#ffcc00', // Neon Yellow
      '#33ff00', // Neon Green
      '#ff6600', // Neon Orange
    ],
  },
  {
    id: 'pastel',
    name: 'Soft Pastel',
    colors: [
      '#fecdd3', // Soft Rose
      '#bfdbfe', // Soft Blue
      '#fef08a', // Soft Yellow
      '#a7f3d0', // Soft Green
      '#ddd6fe', // Soft Purple
      '#fed7aa', // Soft Orange
      '#fbcfe8', // Soft Pink
      '#cffafe', // Soft Cyan
    ],
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    colors: [
      '#0f172a', // Slate 900
      '#1e3a8a', // Blue 900
      '#1d4ed8', // Blue 700
      '#2563eb', // Blue 600
      '#3b82f6', // Blue 500
      '#60a5fa', // Blue 400
      '#93c5fd', // Blue 300
      '#bfdbfe', // Blue 200
    ],
  },
  {
    id: 'sunset',
    name: 'Warm Sunset',
    colors: [
      '#7c2d12', // Orange 900
      '#9a3412', // Orange 800
      '#c2410c', // Orange 700
      '#ea580c', // Orange 600
      '#f97316', // Orange 500
      '#fb923c', // Orange 400
      '#fdba74', // Orange 300
      '#fed7aa', // Orange 200
    ],
  },
  {
    id: 'retro',
    name: 'Retro 80s',
    colors: [
      '#f43f5e', // Pink
      '#0ea5e9', // Light Blue
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#d946ef', // Fuchsia
      '#6366f1', // Indigo
    ],
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    colors: [
      '#064e3b', // Emerald 900
      '#047857', // Emerald 700
      '#10b981', // Emerald 500
      '#34d399', // Emerald 400
      '#a7f3d0', // Emerald 200
      '#854d0e', // Yellow 800
      '#ca8a04', // Yellow 600
      '#fef08a', // Yellow 200
    ],
  },
  {
    id: 'classic',
    name: 'Classic Gray & Blue',
    colors: [
      '#1e293b', // Slate 800
      '#334155', // Slate 700
      '#475569', // Slate 600
      '#64748b', // Slate 500
      '#94a3b8', // Slate 400
      '#cbd5e1', // Slate 300
      '#2563eb', // Blue 600
      '#3b82f6', // Blue 500
    ],
  },
];

export function getPaletteColors(id: PaletteId, customColors: string[] = []): string[] {
  if (id === 'classic' && customColors.length > 0) {
    return customColors;
  }
  const found = THEME_PALETTES.find((p) => p.id === id);
  return found ? found.colors : THEME_PALETTES[0].colors;
}
