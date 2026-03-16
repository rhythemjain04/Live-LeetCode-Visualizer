import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Sparkles, Github, LogOut, RotateCcw, Palette } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useThemeStore, THEMES, ThemeId, applyTheme } from '@/store/themeStore';

interface HeaderProps {
  onResetLayout?: () => void;
}

const Header = ({ onResetLayout }: HeaderProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { themeId, setTheme } = useThemeStore();
  const [showThemes, setShowThemes] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  // Apply theme on mount and change
  useEffect(() => applyTheme(themeId), [themeId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemes(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      className="glass-panel-strong border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
              <Code2 className="w-5 h-5 text-background" />
            </div>
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-1 -right-1">
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">LeetCode Vizualizer</h1>
            <p className="text-xs text-muted-foreground">Data Structure Visualizer</p>
          </div>
        </div>

        {/* Center - Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-muted-foreground">Ready</span>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Picker */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setShowThemes(!showThemes)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5"
              title="Change theme"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{THEMES[themeId].emoji} {THEMES[themeId].label}</span>
            </button>
            <AnimatePresence>
              {showThemes && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 py-2 rounded-xl border border-white/10 min-w-[160px]"
                  style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)' }}
                >
                  {(Object.keys(THEMES) as ThemeId[]).map((id) => (
                    <button
                      key={id}
                      onClick={() => { setTheme(id); setShowThemes(false); }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 hover:bg-white/5 transition-colors ${
                        id === themeId ? 'text-white font-medium' : 'text-slate-400'
                      }`}
                    >
                      <span>{THEMES[id].emoji}</span>
                      <span>{THEMES[id].label}</span>
                      {id === themeId && (
                        <div className="ml-auto w-2 h-2 rounded-full" style={{ background: THEMES[id].colors.primary }} />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {onResetLayout && (
            <button onClick={onResetLayout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5"
              title="Reset panel layout">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Layout</span>
            </button>
          )}

          <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">Source</span>
          </a>

          {user && (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/10">
              <span className="text-xs text-muted-foreground hidden sm:inline">{user}</span>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-400/10"
                title="Logout">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
