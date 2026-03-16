import { create } from 'zustand';

export type ThemeId = 'midnight' | 'cyberpunk' | 'ocean' | 'forest' | 'sunset';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  primary: string;
  primaryGlow: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  editorBg: string;
}

export const THEMES: Record<ThemeId, { label: string; emoji: string; colors: ThemeColors }> = {
  midnight: {
    label: 'Midnight',
    emoji: '🌙',
    colors: {
      background: '#0a0f1e',
      surface: 'rgba(15, 23, 42, 0.6)',
      surfaceHover: 'rgba(30, 41, 59, 0.5)',
      border: 'rgba(255, 255, 255, 0.08)',
      primary: '#00d4ff',
      primaryGlow: 'rgba(0, 212, 255, 0.15)',
      secondary: '#a855f7',
      accent: '#10b981',
      text: '#e2e8f0',
      textMuted: '#64748b',
      editorBg: '#0d1117',
    },
  },
  cyberpunk: {
    label: 'Cyberpunk',
    emoji: '⚡',
    colors: {
      background: '#0d0221',
      surface: 'rgba(20, 5, 50, 0.7)',
      surfaceHover: 'rgba(40, 10, 80, 0.5)',
      border: 'rgba(255, 0, 255, 0.15)',
      primary: '#ff00ff',
      primaryGlow: 'rgba(255, 0, 255, 0.2)',
      secondary: '#00ffff',
      accent: '#ffff00',
      text: '#f0e6ff',
      textMuted: '#8b6fad',
      editorBg: '#0a0118',
    },
  },
  ocean: {
    label: 'Ocean',
    emoji: '🌊',
    colors: {
      background: '#0a192f',
      surface: 'rgba(10, 25, 50, 0.7)',
      surfaceHover: 'rgba(20, 40, 70, 0.5)',
      border: 'rgba(100, 200, 255, 0.1)',
      primary: '#64ffda',
      primaryGlow: 'rgba(100, 255, 218, 0.15)',
      secondary: '#7ec8e3',
      accent: '#ffd700',
      text: '#ccd6f6',
      textMuted: '#8892b0',
      editorBg: '#0a1628',
    },
  },
  forest: {
    label: 'Forest',
    emoji: '🌿',
    colors: {
      background: '#0b1a0b',
      surface: 'rgba(10, 30, 10, 0.7)',
      surfaceHover: 'rgba(20, 50, 20, 0.5)',
      border: 'rgba(80, 200, 80, 0.12)',
      primary: '#4ade80',
      primaryGlow: 'rgba(74, 222, 128, 0.15)',
      secondary: '#facc15',
      accent: '#f97316',
      text: '#d4e8d0',
      textMuted: '#6b8f6b',
      editorBg: '#0a160a',
    },
  },
  sunset: {
    label: 'Sunset',
    emoji: '🌅',
    colors: {
      background: '#1a0a0a',
      surface: 'rgba(30, 15, 15, 0.7)',
      surfaceHover: 'rgba(50, 25, 25, 0.5)',
      border: 'rgba(255, 100, 50, 0.12)',
      primary: '#f97316',
      primaryGlow: 'rgba(249, 115, 22, 0.15)',
      secondary: '#ec4899',
      accent: '#eab308',
      text: '#fde8d8',
      textMuted: '#a0786b',
      editorBg: '#150808',
    },
  },
};

interface ThemeState {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: (localStorage.getItem('algoviz_theme') as ThemeId) || 'midnight',
  setTheme: (themeId) => {
    localStorage.setItem('algoviz_theme', themeId);
    set({ themeId });
  },
}));

/** Apply theme CSS variables to document root */
export function applyTheme(themeId: ThemeId) {
  const t = THEMES[themeId]?.colors ?? THEMES.midnight.colors;
  const root = document.documentElement.style;
  root.setProperty('--theme-bg', t.background);
  root.setProperty('--theme-surface', t.surface);
  root.setProperty('--theme-surface-hover', t.surfaceHover);
  root.setProperty('--theme-border', t.border);
  root.setProperty('--theme-primary', t.primary);
  root.setProperty('--theme-primary-glow', t.primaryGlow);
  root.setProperty('--theme-secondary', t.secondary);
  root.setProperty('--theme-accent', t.accent);
  root.setProperty('--theme-text', t.text);
  root.setProperty('--theme-text-muted', t.textMuted);
  root.setProperty('--theme-editor-bg', t.editorBg);
  document.body.style.backgroundColor = t.background;
}
