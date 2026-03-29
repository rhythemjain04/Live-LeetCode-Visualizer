import { useState, useCallback, useRef, useEffect, CSSProperties } from 'react';
import { ResponsiveGridLayout } from 'react-grid-layout';
import Header from '@/components/Header';
import ControlBar from '@/components/ControlBar';
import CodeEditor from '@/components/CodeEditor';
import VisualizationPanel from '@/components/VisualizationPanel';
import VariablesPanel from '@/components/VariablesPanel';
import TimelineBar from '@/components/TimelineBar';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const STORAGE_KEY = 'algoviz_panel_layout';

const DEFAULT_LAYOUTS: Record<string, any[]> = {
  lg: [
    { i: 'code',      x: 0, y: 0, w: 5,  h: 14, minW: 3, minH: 6, isDraggable: false, isResizable: true },
    { i: 'viz',       x: 5, y: 0, w: 5,  h: 14, minW: 3, minH: 6, isResizable: true },
    { i: 'variables', x: 10, y: 0, w: 2, h: 14, minW: 2, minH: 4, isResizable: true },
  ],
  md: [
    { i: 'code',      x: 0, y: 0, w: 5,  h: 12, minW: 3, minH: 6, isDraggable: false, isResizable: true },
    { i: 'viz',       x: 5, y: 0, w: 5,  h: 12, minW: 3, minH: 6, isResizable: true },
    { i: 'variables', x: 0, y: 12, w: 10, h: 6, minW: 2, minH: 4, isResizable: true },
  ],
  sm: [
    { i: 'code',      x: 0, y: 0, w: 6,  h: 10, minW: 3, minH: 6, isDraggable: false, isResizable: true },
    { i: 'viz',       x: 0, y: 10, w: 6, h: 10, minW: 3, minH: 6, isResizable: true },
    { i: 'variables', x: 0, y: 20, w: 6, h: 6,  minW: 2, minH: 4, isResizable: true },
  ],
};

// Fullscreen: fixed pixel sizes — viz 1077×739, code fills rest
const VIZ_FS_W = 1077;
const VIZ_FS_H = 739;

function loadLayouts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      for (const bp of Object.keys(parsed)) {
        for (const item of parsed[bp]) {
          if (item.i === 'code') item.isDraggable = false;
          item.isResizable = true;
        }
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_LAYOUTS;
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  overflow: 'visible',
};

const panelContentStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  borderRadius: '12px',
};

const Index = () => {
  const [normalLayouts, setNormalLayouts] = useState(loadLayouts);
  const [vizFullscreen, setVizFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  const layouts = normalLayouts;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // ESC to exit fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setVizFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const onLayoutChange = useCallback((_layout: any[], allLayouts: Record<string, any[]>) => {
    if (vizFullscreen) return; // Don't save fullscreen layout
    for (const bp of Object.keys(allLayouts)) {
      for (const item of allLayouts[bp]) {
        if (item.i === 'code') item.isDraggable = false;
      }
    }
    setNormalLayouts(allLayouts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts));
  }, [vizFullscreen]);

  const resetLayout = useCallback(() => {
    setNormalLayouts(DEFAULT_LAYOUTS);
    setVizFullscreen(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Fullscreen fixed-pixel layout styles
  const fsContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    gap: '8px',
    padding: '8px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <Header onResetLayout={resetLayout} />
      <ControlBar />

      <div className="flex-1 overflow-auto relative" ref={containerRef}>
        {vizFullscreen ? (
          /* ── Fullscreen mode: fixed pixel sizes ── */
          <div style={fsContainerStyle}>
            {/* Code editor — fills remaining left space */}
            <div style={{ ...panelStyle, flex: '1 1 0', minWidth: 0, height: '100%', overflow: 'hidden' }}>
              <div style={{ ...panelContentStyle }}>
                <CodeEditor />
              </div>
            </div>

            {/* Viz panel — fixed 1077×739 */}
            <div style={{
              ...panelStyle,
              width: VIZ_FS_W,
              height: VIZ_FS_H,
              flexShrink: 0,
              overflow: 'hidden',
              alignSelf: 'flex-start',
            }}>
              <div style={panelContentStyle}>
                <VisualizationPanel onToggleFullscreen={() => setVizFullscreen(f => !f)} isFullscreen={vizFullscreen} />
              </div>
            </div>
          </div>
        ) : (
          /* ── Normal mode: responsive grid ── */
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 768, sm: 0 }}
            cols={{ lg: 12, md: 10, sm: 6 }}
            rowHeight={30}
            width={containerWidth}
            onLayoutChange={onLayoutChange}
            draggableHandle=".panel-drag-handle"
            compactType="vertical"
            margin={[8, 8]}
            containerPadding={[8, 8]}
            isResizable={true}
            resizeHandles={['se', 'e', 's', 'sw', 'w', 'n', 'ne', 'nw']}
          >
            {/* Code Editor — resizable only, NOT draggable */}
            <div key="code" style={panelStyle}>
              <div style={panelContentStyle}>
                <CodeEditor />
              </div>
            </div>

            {/* Visualization — draggable + resizable */}
            <div key="viz" style={panelStyle}>
              <div style={panelContentStyle}>
                <div className="panel-drag-handle h-6 flex items-center justify-center cursor-grab active:cursor-grabbing bg-white/3 border-b border-white/5 select-none">
                  <div className="w-8 h-1 rounded-full bg-white/15" />
                </div>
                <div style={{ height: 'calc(100% - 24px)' }}>
                  <VisualizationPanel onToggleFullscreen={() => setVizFullscreen(f => !f)} isFullscreen={vizFullscreen} />
                </div>
              </div>
            </div>

            {/* Variables — draggable + resizable */}
            <div key="variables" style={panelStyle}>
              <div style={panelContentStyle}>
                <div className="panel-drag-handle h-6 flex items-center justify-center cursor-grab active:cursor-grabbing bg-white/3 border-b border-white/5 select-none">
                  <div className="w-8 h-1 rounded-full bg-white/15" />
                </div>
                <div style={{ height: 'calc(100% - 24px)' }}>
                  <VariablesPanel />
                </div>
              </div>
            </div>
          </ResponsiveGridLayout>
        )}
      </div>

      <TimelineBar />
    </div>
  );
};

export default Index;
