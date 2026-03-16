import { create } from 'zustand';
import { getDefaultSnippet } from '@/data/codeSnippets';

export type DataStructureType = 'array' | 'stack' | 'queue' | 'linkedList' | 'bst' | 'heap' | 'graph' | 'hashTable';

export type VizMode = '2d' | '3d';

export type ProgrammingLanguage = 'java' | 'cpp' | 'c' | 'python' | 'javascript';

export type NodeState = 'default' | 'active' | 'visited' | 'comparing' | 'swapping' | 'found' | 'inserted' | 'deleted';

export interface VisualizationNode {
  id: string;
  value: number | string;
  state: NodeState;
  x?: number;
  y?: number;
  left?: string | null;
  right?: string | null;
  next?: string | null;
  prev?: string | null;
  pointers?: string[]; // Array of variable names pointing to this node
}

export interface VisualizationEdge {
  id: string;
  from: string;
  to: string;
  weight?: number;
  state: 'default' | 'active' | 'visited';
}

export interface Variable {
  name: string;
  value: any;
  type: string;
  changed: boolean;
}

export interface StackFrame {
  functionName: string;
  line: number;
  variables: Variable[];
}

export interface StepVisualization {
  title?: string;
  dataStructure: DataStructureType;
  nodes: VisualizationNode[];
  edges?: VisualizationEdge[];
}

export interface ExecutionStep {
  line: number;
  code: string;
  description: string;
  dataStructure?: DataStructureType; // Add dataStructure field
  nodes: VisualizationNode[];
  edges?: VisualizationEdge[];
  visualizations?: StepVisualization[];
  variables: Variable[];
  callStack: StackFrame[];
  console: string[];
}

interface VisualizerState {
  // Code
  code: string;
  setCode: (code: string) => void;
  language: ProgrammingLanguage;
  setLanguage: (lang: ProgrammingLanguage) => void;
  algorithmName: string;
  setAlgorithmName: (name: string) => void;
  
  // Execution
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  steps: ExecutionStep[];
  speed: number;
  
  // Data Structure
  dataStructure: DataStructureType;
  nodes: VisualizationNode[];
  edges: VisualizationEdge[];
  visualizations: StepVisualization[];
  
  // Viz mode
  vizMode: VizMode;
  
  // Variables & Stack
  variables: Variable[];
  callStack: StackFrame[];
  consoleOutput: string[];
  
  // Input
  inputValue: string;
  setInputValue: (value: string) => void;
  
  // Actions
  setDataStructure: (ds: DataStructureType) => void;
  setSpeed: (speed: number) => void;
  setSteps: (steps: ExecutionStep[]) => void;
  setVisualizations: (visualizations: StepVisualization[]) => void;
  setVizMode: (mode: VizMode) => void;
  run: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  goToStep: (step: number) => void;
  
  // Console
  addConsoleOutput: (output: string) => void;
  clearConsole: () => void;
}


const defaultSteps: ExecutionStep[] = [
  {
    line: 0,
    code: '// Select an algorithm to begin',
    description: 'Welcome! Select a code snippet or write your own code.',
    nodes: [],
    variables: [],
    callStack: [],
    console: [],
  },
];

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  // Initial state
  code: getDefaultSnippet('java')?.code || '',
  language: 'java',
  algorithmName: 'BubbleSort',
  isRunning: false,
  isPaused: false,
  currentStep: 0,
  steps: defaultSteps,
  speed: 1,
  dataStructure: 'array',
  nodes: [],
  edges: [],
  visualizations: [],
  vizMode: '2d',
  variables: [],
  callStack: [],
  consoleOutput: [],
  inputValue: '64, 34, 25, 12, 22, 11, 90',
  
  // Setters
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setAlgorithmName: (algorithmName) => set({ algorithmName }),
  setInputValue: (inputValue) => set({ inputValue }),
  setDataStructure: (dataStructure) => set({ dataStructure }),
  setSpeed: (speed) => set({ speed }),
  setSteps: (steps) => set({ steps, currentStep: 0 }),
  setVisualizations: (visualizations) => set({ visualizations }),
  setVizMode: (vizMode) => set({ vizMode }),
  
  // Execution control
  run: () => {
    const state = get();
    if (state.isPaused) {
      set({ isPaused: false, isRunning: true });
    } else {
      set({ isRunning: true, isPaused: false, currentStep: 0 });
    }
  },
  
  pause: () => set({ isPaused: true, isRunning: false }),
  
  step: () => {
    const state = get();
    if (state.currentStep < state.steps.length - 1) {
      const nextStep = state.currentStep + 1;
      const stepData = state.steps[nextStep];
      set({ 
        currentStep: nextStep,
        nodes: stepData.nodes,
        edges: stepData.edges || [],
        variables: stepData.variables,
        callStack: stepData.callStack,
        consoleOutput: stepData.console,
        visualizations: stepData.visualizations || [],
        dataStructure: stepData.dataStructure || 'array', // Update dataStructure from step
      });
    } else {
      set({ isRunning: false });
    }
  },
  
  reset: () => {
    const state = get();
    const initialStep = state.steps[0];
    set({ 
      isRunning: false, 
      isPaused: false, 
      currentStep: 0,
      nodes: initialStep?.nodes || [],
      edges: initialStep?.edges || [],
      variables: initialStep?.variables || [],
      callStack: initialStep?.callStack || [],
      consoleOutput: [],
      visualizations: initialStep?.visualizations || [],
      dataStructure: initialStep?.dataStructure || 'array', // Reset dataStructure from step
    });
  },
  
  goToStep: (step) => {
    const state = get();
    if (step >= 0 && step < state.steps.length) {
      const stepData = state.steps[step];
      set({ 
        currentStep: step,
        nodes: stepData.nodes,
        edges: stepData.edges || [],
        variables: stepData.variables,
        callStack: stepData.callStack,
        consoleOutput: stepData.console,
        visualizations: stepData.visualizations || [],
        dataStructure: stepData.dataStructure || 'array', // Update dataStructure from step
      });
    }
  },
  
  // Console
  addConsoleOutput: (output) => set((state) => ({ 
    consoleOutput: [...state.consoleOutput, output] 
  })),
  clearConsole: () => set({ consoleOutput: [] }),
}));
