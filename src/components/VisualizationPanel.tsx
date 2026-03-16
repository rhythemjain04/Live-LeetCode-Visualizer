import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizerStore, VisualizationNode, StepVisualization, DataStructureType, VizMode } from '@/store/visualizerStore';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  active: { bg: '#00d4ff', border: '#00eeff', glow: 'rgba(0,212,255,0.6)', text: '#0a0f1e' },
  visited: { bg: '#a855f7', border: '#c084fc', glow: 'rgba(168,85,247,0.5)', text: '#fff' },
  comparing: { bg: '#f97316', border: '#fb923c', glow: 'rgba(249,115,22,0.5)', text: '#0a0f1e' },
  swapping: { bg: '#ec4899', border: '#f472b6', glow: 'rgba(236,72,153,0.5)', text: '#fff' },
  found: { bg: '#10b981', border: '#34d399', glow: 'rgba(16,185,129,0.5)', text: '#fff' },
  default: { bg: '#1e293b', border: '#334155', glow: 'transparent', text: '#e2e8f0' },
};

const nodeColors = (state = 'default') => COLORS[state as keyof typeof COLORS] ?? COLORS.default;

// ─── Shared spring config ─────────────────────────────────────────────────────
const spring = { type: 'spring' as const, stiffness: 450, damping: 28 };

// ════════════════════════════════════════════════════════════════════════════════
// 2D RENDERERS (unchanged from original)
// ════════════════════════════════════════════════════════════════════════════════

// ─── Array ────────────────────────────────────────────────────────────────────
const RenderArray = ({ nodes }: { nodes: VisualizationNode[] }) => (
  <div className="flex items-end justify-center gap-1.5 flex-wrap px-4">
    <AnimatePresence mode="popLayout">
      {nodes.map((node, i) => {
        const c = nodeColors(node.state);
        return (
          <motion.div key={node.id} layout initial={{ scale: 0, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0, opacity: 0 }}
            transition={{ ...spring, delay: i * 0.02 }}
            className="flex flex-col items-center">
            <motion.div
              animate={{ backgroundColor: c.bg, borderColor: c.border }}
              transition={{ duration: 0.25 }}
              className="w-14 h-14 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-base"
              style={{ color: c.text, boxShadow: `0 0 18px ${c.glow}` }}
            >
              {String(node.value)}
            </motion.div>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">[{i}]</span>
          </motion.div>
        );
      })}
    </AnimatePresence>
    {nodes.length === 0 && <p className="text-slate-500 text-sm">Empty array</p>}
  </div>
);

// ─── Stack ────────────────────────────────────────────────────────────────────
const RenderStack = ({ nodes }: { nodes: VisualizationNode[] }) => (
  <div className="flex flex-col items-center gap-1 relative">
    <div style={{ order: 999 }} className="w-28 h-2 rounded bg-slate-700 mt-1" />
    <AnimatePresence mode="popLayout">
      {[...nodes].reverse().map((node, ri) => {
        const i = nodes.length - 1 - ri;
        const c = nodeColors(node.state);
        const isTop = i === nodes.length - 1;
        return (
          <motion.div key={node.id} layout
            initial={{ x: -60, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 60, opacity: 0, scale: 0.8 }}
            transition={spring}
            className="relative flex items-center"
          >
            <motion.div
              animate={{ backgroundColor: c.bg, borderColor: c.border }}
              transition={{ duration: 0.25 }}
              className="w-28 h-11 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-base"
              style={{ color: c.text, boxShadow: `0 0 14px ${c.glow}` }}
            >
              {String(node.value)}
            </motion.div>
            {isTop && (
              <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                className="absolute -right-16 text-xs font-mono text-cyan-400 whitespace-nowrap">
                ← top
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </AnimatePresence>
    {nodes.length === 0 && <p className="text-slate-500 text-sm mt-4">Empty Stack</p>}
  </div>
);

// ─── Queue / Deque ────────────────────────────────────────────────────────────
const RenderQueue = ({ nodes }: { nodes: VisualizationNode[] }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="flex items-center gap-0.5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="text-xs font-mono text-emerald-400 mr-2 flex flex-col items-center">
        <span>▶</span><span>front</span>
      </motion.div>
      <div className="flex items-center gap-1.5 relative">
        <div className="absolute -top-3 left-0 right-0 h-px bg-slate-700/60" />
        <div className="absolute -bottom-3 left-0 right-0 h-px bg-slate-700/60" />
        <AnimatePresence mode="popLayout">
          {nodes.map((node, i) => {
            const c = nodeColors(node.state);
            return (
              <motion.div key={node.id} layout
                initial={{ y: -30, opacity: 0, scale: 0.7 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 30, opacity: 0, scale: 0.7 }}
                transition={{ ...spring, delay: i * 0.03 }}
              >
                <motion.div
                  animate={{ backgroundColor: c.bg, borderColor: c.border }}
                  transition={{ duration: 0.25 }}
                  className="w-14 h-14 rounded-xl border-2 flex items-center justify-center font-mono font-bold text-base"
                  style={{ color: c.text, boxShadow: `0 0 16px ${c.glow}` }}
                >
                  {String(node.value)}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="text-xs font-mono text-amber-400 ml-2 flex flex-col items-center">
        <span>◀</span><span>back</span>
      </motion.div>
    </div>
    {nodes.length === 0 && <p className="text-slate-500 text-sm">Empty Queue/Deque</p>}
  </div>
);

// ─── Linked List ──────────────────────────────────────────────────────────────
const RenderLinkedList = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return (
    <div className="text-center text-slate-500"><p className="text-lg">Empty Linked List</p></div>
  );
  const NODE_W = 72, NODE_H = 48, GAP = 56, Y = 140;
  const totalW = Math.max(700, nodes.length * (NODE_W + GAP) + 80);
  const edges: { x1: number; y1: number; x2: number; y2: number; fromId: string; toId: string }[] = [];
  nodes.forEach((node, i) => {
    if (node.next) {
      const targetIdx = nodes.findIndex(n => n.id === node.next);
      if (targetIdx !== -1) {
        const x1 = 60 + i * (NODE_W + GAP) + NODE_W;
        const x2 = 60 + targetIdx * (NODE_W + GAP);
        edges.push({ x1, y1: Y, x2, y2: Y, fromId: node.id, toId: node.next });
      }
    }
  });
  return (
    <div className="overflow-x-auto w-full">
      <svg width={totalW} height={220} viewBox={`0 0 ${totalW} 220`}>
        <defs>
          <marker id="ll-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0,8 3,0 6" fill="#475569" />
          </marker>
          <filter id="ll-glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <AnimatePresence>
          {edges.map((e, i) => {
            const isForward = e.x2 > e.x1;
            const cx = (e.x1 + e.x2) / 2;
            const cy = isForward ? Y : Y + 60;
            const d = isForward
              ? `M${e.x1} ${Y} Q${cx} ${cy - 30} ${e.x2} ${Y}`
              : `M${e.x1} ${Y} C${cx} ${cy + 50} ${cx} ${cy + 50} ${e.x2} ${Y}`;
            return (
              <motion.path key={`${e.fromId}-${e.toId}`}
                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.8 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}
                d={d} fill="none" stroke="#475569" strokeWidth="2" markerEnd="url(#ll-arrow)" />
            );
          })}
        </AnimatePresence>
        <text x={60 + nodes.length * (NODE_W + GAP) - 10} y={Y + 5}
          fill="#475569" fontSize="12" fontFamily="monospace">null</text>
        <AnimatePresence>
          {nodes.map((node, i) => {
            const x = 60 + i * (NODE_W + GAP);
            const c = nodeColors(node.state);
            return (
              <motion.g key={node.id}
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }} transition={{ ...spring, delay: i * 0.05 }}>
                <motion.rect x={x} y={Y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="8"
                  animate={{ fill: c.bg, stroke: c.border }} transition={{ duration: 0.25 }}
                  strokeWidth="2"
                  style={{ filter: node.state !== 'default' ? `drop-shadow(0 0 10px ${c.glow})` : undefined }} />
                <line x1={x + NODE_W * 0.65} y1={Y - NODE_H / 2} x2={x + NODE_W * 0.65} y2={Y + NODE_H / 2}
                  stroke={c.border} strokeWidth="1" opacity="0.6" />
                <text x={x + NODE_W * 0.3} y={Y + 1} textAnchor="middle" dominantBaseline="central"
                  fill={c.text} fontSize="14" fontWeight="bold" fontFamily="monospace">
                  {String(node.value)}
                </text>
                <text x={x + NODE_W * 0.83} y={Y + 1} textAnchor="middle" dominantBaseline="central"
                  fill={c.border} fontSize="9" fontFamily="monospace" opacity="0.7">next</text>
                {i === 0 && (
                  <text x={x + NODE_W / 2} y={Y - NODE_H / 2 - 14} textAnchor="middle"
                    fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">HEAD</text>
                )}
                {node.pointers?.map((ptr, pi) => (
                  <text key={ptr} x={x + NODE_W / 2} y={Y + NODE_H / 2 + 18 + pi * 14}
                    textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace">{ptr} ↑</text>
                ))}
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
    </div>
  );
};

// ─── BST / Tree ───────────────────────────────────────────────────────────────
function computeTreeLayout(nodes: VisualizationNode[]): Map<string, { x: number; y: number }> {
  const allChildren = new Set<string>();
  nodes.forEach(n => { if (n.left) allChildren.add(n.left); if (n.right) allChildren.add(n.right); });
  const root = nodes.find(n => !allChildren.has(n.id));
  if (!root) return new Map();
  const positions = new Map<string, { x: number; y: number }>();
  const LEVEL_H = 80, START_Y = 40;
  function assign(nodeId: string, xMin: number, xMax: number, depth: number) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const x = (xMin + xMax) / 2;
    const y = START_Y + depth * LEVEL_H;
    positions.set(nodeId, { x, y });
    if (node.left) assign(node.left, xMin, x, depth + 1);
    if (node.right) assign(node.right, x, xMax, depth + 1);
  }
  assign(root.id, 20, 580, 0);
  return positions;
}

const RenderBST = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Tree</p>;
  const pos = computeTreeLayout(nodes);
  const edges: { x1: number; y1: number; x2: number; y2: number; id: string }[] = [];
  nodes.forEach(node => {
    const from = pos.get(node.id);
    if (!from) return;
    [node.left, node.right].forEach((childId, ci) => {
      if (!childId) return;
      const to = pos.get(childId);
      if (to) edges.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, id: `${node.id}-${ci}` });
    });
  });
  return (
    <svg width="100%" height="340" viewBox="0 0 600 340">
      <defs>
        <marker id="bst-arrow" markerWidth="8" markerHeight="6" refX="22" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill="#334155" />
        </marker>
      </defs>
      <AnimatePresence>
        {edges.map(e => (
          <motion.line key={e.id}
            initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#334155" strokeWidth="2" markerEnd="url(#bst-arrow)" />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {nodes.map(node => {
          const p = pos.get(node.id);
          if (!p) return null;
          const c = nodeColors(node.state);
          return (
            <motion.g key={node.id}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }} transition={spring}>
              <motion.circle cx={p.x} cy={p.y} r="22"
                animate={{ fill: c.bg, stroke: c.border }} transition={{ duration: 0.25 }}
                strokeWidth="2.5"
                style={{ filter: node.state !== 'default' ? `drop-shadow(0 0 8px ${c.glow})` : undefined }} />
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                fill={c.text} fontSize="12" fontWeight="bold" fontFamily="monospace">
                {String(node.value)}
              </text>
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
};

// ─── Graph ────────────────────────────────────────────────────────────────────
function circularLayout(count: number, cx = 300, cy = 175, r = 140): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / count - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / count - Math.PI / 2),
  }));
}

interface GraphEdgeData {
  from: string | { id: string; [key: string]: any };
  to: string | { id: string; [key: string]: any };
}

const RenderGraph = ({ nodes, edges: rawEdges }: { nodes: VisualizationNode[]; edges?: GraphEdgeData[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Graph</p>;
  const hasPos = nodes.some(n => n.x && n.x > 0);
  const positions = hasPos
    ? nodes.map(n => ({ x: n.x ?? 0, y: n.y ?? 0 }))
    : circularLayout(nodes.length);

  // Build node position lookup
  const posMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, i) => posMap.set(n.id, positions[i]));

  // Build rendered edges from viz data
  const edges: { x1: number; y1: number; x2: number; y2: number; id: string }[] = [];
  if (rawEdges && rawEdges.length > 0) {
    rawEdges.forEach((e, i) => {
      const fromId = typeof e.from === 'string' ? e.from : e.from?.id;
      const toId = typeof e.to === 'string' ? e.to : e.to?.id;
      if (!fromId || !toId) return;
      const fromPos = posMap.get(fromId);
      const toPos = posMap.get(toId);
      if (fromPos && toPos) {
        edges.push({ x1: fromPos.x, y1: fromPos.y, x2: toPos.x, y2: toPos.y, id: `edge-${i}-${fromId}-${toId}` });
      }
    });
  } else {
    // Fallback: use node.next if available
    nodes.forEach((node, i) => {
      if (node.next) {
        const from = positions[i];
        const j = nodes.findIndex(n => n.id === node.next);
        if (j !== -1) {
          const to = positions[j];
          edges.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, id: `${node.id}-${node.next}` });
        }
      }
    });
  }

  return (
    <svg width="100%" height="350" viewBox="0 0 600 350">
      <defs>
        <marker id="graph-arrow" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill="#475569" />
        </marker>
      </defs>
      <AnimatePresence>
        {edges.map(e => (
          <motion.line key={e.id}
            initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#475569" strokeWidth="2" markerEnd="url(#graph-arrow)" />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {nodes.map((node, i) => {
          const p = positions[i];
          const c = nodeColors(node.state);
          return (
            <motion.g key={node.id}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }} transition={{ ...spring, delay: i * 0.04 }}>
              <motion.circle cx={p.x} cy={p.y} r="26"
                animate={{ fill: c.bg, stroke: c.border }} transition={{ duration: 0.25 }}
                strokeWidth="2.5"
                style={{ filter: node.state !== 'default' ? `drop-shadow(0 0 10px ${c.glow})` : undefined }} />
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                fill={c.text} fontSize="12" fontWeight="bold" fontFamily="monospace">
                {String(node.value)}
              </text>
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
};

// ─── HashMap / HashSet ────────────────────────────────────────────────────────
const RenderHashTable = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Hash Table</p>;
  return (
    <div className="grid gap-2 p-4" style={{ gridTemplateColumns: `repeat(${Math.min(nodes.length, 6)}, minmax(0,1fr))` }}>
      <AnimatePresence mode="popLayout">
        {nodes.map((node, i) => {
          const c = nodeColors(node.state);
          return (
            <motion.div key={node.id} layout
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              transition={{ ...spring, delay: i * 0.02 }}
              className="min-w-[60px] h-16 rounded-xl border-2 flex flex-col items-center justify-center font-mono font-bold text-xs p-1 text-center"
              style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text, boxShadow: `0 0 12px ${c.glow}` }}>
              <span className="text-[9px] opacity-60 mb-0.5">#{i}</span>
              <span className="text-sm leading-tight">{String(node.value)}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// ─── Heap ────────────────────────────────────────────────────────────────────
const RenderHeap = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Heap</p>;
  function heapPos(i: number): { x: number; y: number } {
    const level = Math.floor(Math.log2(i + 1));
    const posInLevel = i - (Math.pow(2, level) - 1);
    const totalAtLevel = Math.pow(2, level);
    const segW = 560 / totalAtLevel;
    return { x: 20 + segW * posInLevel + segW / 2, y: 40 + level * 80 };
  }
  const positions = nodes.map((_, i) => heapPos(i));
  return (
    <svg width="100%" height="340" viewBox="0 0 600 340">
      <AnimatePresence>
        {nodes.map((_, i) => {
          if (i === 0) return null;
          const parent = Math.floor((i - 1) / 2);
          const from = positions[parent], to = positions[i];
          return (
            <motion.line key={`heap-e-${i}`}
              initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
              x1={from.x} y1={from.y + 22} x2={to.x} y2={to.y - 22}
              stroke="#334155" strokeWidth="2" />
          );
        })}
      </AnimatePresence>
      <AnimatePresence>
        {nodes.map((node, i) => {
          const p = positions[i];
          const c = nodeColors(node.state);
          return (
            <motion.g key={node.id}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }} transition={{ ...spring, delay: i * 0.04 }}>
              <motion.circle cx={p.x} cy={p.y} r="22"
                animate={{ fill: c.bg, stroke: c.border }} transition={{ duration: 0.25 }}
                strokeWidth="2.5"
                style={{ filter: node.state !== 'default' ? `drop-shadow(0 0 8px ${c.glow})` : undefined }} />
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                fill={c.text} fontSize="11" fontWeight="bold" fontFamily="monospace">
                {String(node.value)}
              </text>
              <text x={p.x} y={p.y + 32} textAnchor="middle"
                fill="#475569" fontSize="9" fontFamily="monospace">[{i}]</text>
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
};

// ─── 2D Dispatcher ────────────────────────────────────────────────────────────
const renderVisualization2D = (ds: DataStructureType, nodes: VisualizationNode[], edges?: any[]) => {
  switch (ds) {
    case 'stack': return <RenderStack nodes={nodes} />;
    case 'queue': return <RenderQueue nodes={nodes} />;
    case 'linkedList': return <RenderLinkedList nodes={nodes} />;
    case 'bst': return <RenderBST nodes={nodes} />;
    case 'graph': return <RenderGraph nodes={nodes} edges={edges} />;
    case 'hashTable': return <RenderHashTable nodes={nodes} />;
    case 'heap': return <RenderHeap nodes={nodes} />;
    case 'array':
    default: return <RenderArray nodes={nodes} />;
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// 3D RENDERERS
// ════════════════════════════════════════════════════════════════════════════════

const stateToColor = (state: string = 'default'): string => {
  const c = nodeColors(state);
  return c.bg;
};

// 3D Node cube/bar component
const Node3D = ({ position, value, state, scale = [1, 1, 1] }: {
  position: [number, number, number];
  value: string;
  state: string;
  scale?: [number, number, number];
}) => {
  const color = stateToColor(state);
  return (
    <group position={position}>
      <RoundedBox args={scale as any} radius={0.08} smoothness={4}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </RoundedBox>
      <Text
        position={[0, 0, scale[2] / 2 + 0.01]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {value}
      </Text>
    </group>
  );
};

// 3D Sphere node
const Sphere3D = ({ position, value, state, radius = 0.4 }: {
  position: [number, number, number];
  value: string;
  state: string;
  radius?: number;
}) => {
  const color = stateToColor(state);
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <Text
        position={[0, 0, radius + 0.05]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {value}
      </Text>
    </group>
  );
};

// 3D Edge line
const Edge3D = ({ from, to }: { from: [number, number, number]; to: [number, number, number] }) => {
  const points = useMemo(() => [
    new THREE.Vector3(...from),
    new THREE.Vector3(...to),
  ], [from, to]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color="#475569" linewidth={2} />
    </line>
  );
};

// 3D Canvas wrapper
const Canvas3DWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full h-[350px] rounded-xl overflow-hidden">
    <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.4} color="#00d4ff" />
      <OrbitControls enablePan enableZoom enableRotate />
      {children}
    </Canvas>
  </div>
);

// ─── 3D Array ─────────────────────────────────────────────────────────────────
const RenderArray3D = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty array</p>;
  const maxNumVal = Math.max(...nodes.map(n => {
    const v = parseFloat(String(n.value));
    return isNaN(v) ? 1 : Math.abs(v);
  }), 1);
  return (
    <Canvas3DWrapper>
      {nodes.map((node, i) => {
        const numVal = parseFloat(String(node.value));
        const h = isNaN(numVal) ? 1 : Math.max(0.2, (Math.abs(numVal) / maxNumVal) * 3);
        const x = (i - nodes.length / 2) * 1.2;
        return (
          <Node3D
            key={node.id}
            position={[x, h / 2, 0]}
            value={String(node.value)}
            state={node.state}
            scale={[0.9, h, 0.9]}
          />
        );
      })}
    </Canvas3DWrapper>
  );
};

// ─── 3D Stack ─────────────────────────────────────────────────────────────────
const RenderStack3D = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Stack</p>;
  return (
    <Canvas3DWrapper>
      {nodes.map((node, i) => (
        <Node3D
          key={node.id}
          position={[0, i * 0.85, 0]}
          value={String(node.value)}
          state={node.state}
          scale={[1.5, 0.7, 1]}
        />
      ))}
      {/* Base */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[2, 0.1, 1.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </Canvas3DWrapper>
  );
};

// ─── 3D Queue ─────────────────────────────────────────────────────────────────
const RenderQueue3D = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Queue</p>;
  return (
    <Canvas3DWrapper>
      {nodes.map((node, i) => (
        <Node3D
          key={node.id}
          position={[(i - nodes.length / 2) * 1.2, 0, 0]}
          value={String(node.value)}
          state={node.state}
          scale={[0.9, 0.9, 0.9]}
        />
      ))}
    </Canvas3DWrapper>
  );
};

// ─── 3D Linked List ───────────────────────────────────────────────────────────
const RenderLinkedList3D = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Linked List</p>;
  return (
    <Canvas3DWrapper>
      {nodes.map((node, i) => {
        const x = (i - nodes.length / 2) * 2;
        return (
          <group key={node.id}>
            <Sphere3D position={[x, 0, 0]} value={String(node.value)} state={node.state} />
            {i < nodes.length - 1 && (
              <Edge3D from={[x + 0.5, 0, 0]} to={[x + 1.5, 0, 0]} />
            )}
          </group>
        );
      })}
    </Canvas3DWrapper>
  );
};

// ─── 3D BST ───────────────────────────────────────────────────────────────────
const RenderBST3D = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Tree</p>;
  const pos = computeTreeLayout(nodes);
  return (
    <Canvas3DWrapper>
      {nodes.map(node => {
        const p = pos.get(node.id);
        if (!p) return null;
        const x3d = (p.x - 300) / 60;
        const y3d = -(p.y - 40) / 60;
        return (
          <group key={node.id}>
            <Sphere3D position={[x3d, y3d, 0]} value={String(node.value)} state={node.state} radius={0.35} />
            {[node.left, node.right].map(childId => {
              if (!childId) return null;
              const cp = pos.get(childId);
              if (!cp) return null;
              const cx3d = (cp.x - 300) / 60;
              const cy3d = -(cp.y - 40) / 60;
              return <Edge3D key={`${node.id}-${childId}`} from={[x3d, y3d, 0]} to={[cx3d, cy3d, 0]} />;
            })}
          </group>
        );
      })}
    </Canvas3DWrapper>
  );
};

// ─── 3D Graph ─────────────────────────────────────────────────────────────────
const RenderGraph3D = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Graph</p>;
  const n = nodes.length;
  const radius = 2.5;
  const positions3d: [number, number, number][] = nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return [radius * Math.cos(angle), 0, radius * Math.sin(angle)];
  });
  return (
    <Canvas3DWrapper>
      {nodes.map((node, i) => (
        <Sphere3D key={node.id} position={positions3d[i]} value={String(node.value)} state={node.state} />
      ))}
      {nodes.map((node, i) => {
        if (!node.next) return null;
        const j = nodes.findIndex(n => n.id === node.next);
        if (j === -1) return null;
        return <Edge3D key={`${node.id}-edge`} from={positions3d[i]} to={positions3d[j]} />;
      })}
    </Canvas3DWrapper>
  );
};

// ─── 3D HashTable ─────────────────────────────────────────────────────────────
const RenderHashTable3D = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Hash Table</p>;
  const cols = Math.min(nodes.length, 6);
  return (
    <Canvas3DWrapper>
      {nodes.map((node, i) => {
        const x = (i % cols - cols / 2) * 1.3;
        const y = -Math.floor(i / cols) * 1.3;
        return (
          <Node3D
            key={node.id}
            position={[x, y, 0]}
            value={String(node.value)}
            state={node.state}
            scale={[1, 1, 0.5]}
          />
        );
      })}
    </Canvas3DWrapper>
  );
};

// ─── 3D Heap ──────────────────────────────────────────────────────────────────
const RenderHeap3D = ({ nodes }: { nodes: VisualizationNode[] }) => {
  if (nodes.length === 0) return <p className="text-slate-500">Empty Heap</p>;
  return (
    <Canvas3DWrapper>
      {nodes.map((node, i) => {
        const level = Math.floor(Math.log2(i + 1));
        const posInLevel = i - (Math.pow(2, level) - 1);
        const totalAtLevel = Math.pow(2, level);
        const x = (posInLevel - totalAtLevel / 2 + 0.5) * (4 / totalAtLevel);
        const y = -level * 1.5;
        return (
          <group key={node.id}>
            <Sphere3D position={[x, y, 0]} value={String(node.value)} state={node.state} radius={0.35} />
            {i > 0 && (() => {
              const pi = Math.floor((i - 1) / 2);
              const plevel = Math.floor(Math.log2(pi + 1));
              const pPosInLevel = pi - (Math.pow(2, plevel) - 1);
              const pTotalAtLevel = Math.pow(2, plevel);
              const px = (pPosInLevel - pTotalAtLevel / 2 + 0.5) * (4 / pTotalAtLevel);
              const py = -plevel * 1.5;
              return <Edge3D from={[px, py, 0]} to={[x, y, 0]} />;
            })()}
          </group>
        );
      })}
    </Canvas3DWrapper>
  );
};

// ─── 3D Dispatcher ────────────────────────────────────────────────────────────
const renderVisualization3D = (ds: DataStructureType, nodes: VisualizationNode[]) => {
  switch (ds) {
    case 'stack': return <RenderStack3D nodes={nodes} />;
    case 'queue': return <RenderQueue3D nodes={nodes} />;
    case 'linkedList': return <RenderLinkedList3D nodes={nodes} />;
    case 'bst': return <RenderBST3D nodes={nodes} />;
    case 'graph': return <RenderGraph3D nodes={nodes} />;
    case 'hashTable': return <RenderHashTable3D nodes={nodes} />;
    case 'heap': return <RenderHeap3D nodes={nodes} />;
    case 'array':
    default: return <RenderArray3D nodes={nodes} />;
  }
};

// ─── Combined dispatcher ─────────────────────────────────────────────────────
const renderVisualization = (ds: DataStructureType, nodes: VisualizationNode[], mode: VizMode, edges?: any[]) => {
  return mode === '3d' ? renderVisualization3D(ds, nodes) : renderVisualization2D(ds, nodes, edges);
};

// ─── DS label map ─────────────────────────────────────────────────────────────
const DS_LABELS: Record<string, string> = {
  array: 'Array', stack: 'Stack', queue: 'Queue / Deque',
  linkedList: 'Linked List', bst: 'Binary Tree',
  graph: 'Graph', hashTable: 'Hash Map / Set', heap: 'Heap',
};

// ─── Main Panel ───────────────────────────────────────────────────────────────
interface VizPanelProps {
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const VisualizationPanel = ({ onToggleFullscreen, isFullscreen = false }: VizPanelProps) => {
  const { nodes, edges, dataStructure, steps, currentStep, visualizations, vizMode, setVizMode } = useVisualizerStore();
  const currentStepData = steps[currentStep];
  const displayNodes = currentStepData?.nodes || nodes;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="panel-header">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <span>Visualization</span>

        {/* 2D / 3D Toggle */}
        <div className="ml-3 flex rounded-lg overflow-hidden border border-white/10">
          <button
            onClick={() => setVizMode('2d')}
            className={`px-3 py-1 text-xs font-mono font-semibold transition-all ${
              vizMode === '2d'
                ? 'bg-cyan-500/20 text-cyan-400 border-r border-cyan-400/30'
                : 'text-slate-500 hover:text-slate-300 border-r border-white/10'
            }`}
          >
            2D
          </button>
          <button
            onClick={() => setVizMode('3d')}
            className={`px-3 py-1 text-xs font-mono font-semibold transition-all ${
              vizMode === '3d'
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            3D
          </button>
        </div>

        <span className="ml-auto text-xs text-muted-foreground font-normal normal-case tracking-normal">
          {DS_LABELS[dataStructure] ?? dataStructure}
        </span>

        {/* Fullscreen toggle */}
        <button
          onClick={() => onToggleFullscreen?.()}
          className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 grid-bg overflow-auto">
        {visualizations && visualizations.length > 0 ? (
          <div className="w-full h-full flex flex-col gap-6 overflow-auto py-2">
            {visualizations.map((viz: StepVisualization, idx: number) => (
              <div key={`${viz.dataStructure}-${idx}`} className="w-full">
                {/* Label bar */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded px-2 py-0.5">
                    {viz.title || 'structure'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {DS_LABELS[viz.dataStructure] ?? viz.dataStructure}
                  </span>
                  <span className="text-xs text-slate-600 ml-auto">
                    {viz.nodes?.length ?? 0} element{viz.nodes?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Visual */}
                <div className="w-full flex items-center justify-center min-h-[100px] rounded-xl bg-slate-900/40 border border-white/5 p-4">
                  <div className="w-full flex items-center justify-center">
                    {renderVisualization(viz.dataStructure, viz.nodes, vizMode, viz.edges as any[])}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayNodes.length > 0 ? (
          <div className="w-full flex justify-center">
            {renderVisualization(dataStructure, displayNodes, vizMode)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center text-muted-foreground">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg mb-2">No data to visualize</p>
            <p className="text-sm">Run the algorithm to see the visualization</p>
          </motion.div>
        )}
      </div>

      {/* Step description bar */}
      <AnimatePresence>
        {currentStepData && (
          <motion.div key={currentStep}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 border-t border-white/10 bg-muted/30">
            <p className="text-sm font-mono text-primary truncate">{currentStepData.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisualizationPanel;
