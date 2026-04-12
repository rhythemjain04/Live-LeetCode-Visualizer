import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Zap,
  ChevronDown
} from 'lucide-react';
import { useVisualizerStore, DataStructureType, ProgrammingLanguage } from '@/store/visualizerStore';
import { getSnippetsByLanguage, CodeSnippet } from '@/data/codeSnippets';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { apiUrl } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const ControlBar = () => {
  const { 
    code,
    isRunning, 
    isPaused,
    currentStep,
    steps,
    speed,
    language,
    setSpeed,
    setSteps,
    setCode,
    setDataStructure,
    algorithmName,
    setAlgorithmName,
    setLanguage,
    run,
    pause,
    step,
    reset,
    goToStep,
  } = useVisualizerStore();

  const languageSnippets = getSnippetsByLanguage(language);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(languageSnippets[0] || null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update selected snippet when language changes
  useEffect(() => {
    const newSnippets = getSnippetsByLanguage(language);
    if (newSnippets.length > 0) {
      setSelectedSnippet(newSnippets[0]);
    }
  }, [language]);

  // Auto-step when running
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        step();
      }, 1000 / speed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, speed, step]);

  // Stop when reaching end
  useEffect(() => {
    if (currentStep >= steps.length - 1 && isRunning) {
      pause();
    }
  }, [currentStep, steps.length, isRunning, pause]);

  const handleSnippetSelect = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet);
    setCode(snippet.code);
    setAlgorithmName(snippet.name);
    setDataStructure(snippet.dataStructure);
    reset();
  };

  const handleRun = async () => {
    try {
      const res = await fetch(apiUrl('/api/execute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Execute failed');
      }
      setAlgorithmName(data.algorithmName ?? 'Algorithm');
      setDataStructure((data.dataStructure as DataStructureType) ?? 'array');
      setSteps(data.steps ?? []);
      reset(); // Initialize state with first step
      run();
    } catch (err) {
      setSteps([
        {
          line: 0,
          code: '',
          description: 'Error',
          nodes: [],
          variables: [],
          callStack: [],
          console: [err instanceof Error ? err.message : String(err)],
        },
      ]);
      run();
    }
  };

  const handlePlayPause = () => {
    if (isRunning) {
      pause();
    } else {
      if (currentStep >= steps.length - 1) {
        reset();
        setTimeout(() => {
          handleRun();
        }, 100);
      } else if (steps.length > 1) {
        run();
      } else {
        handleRun();
      }
    }
  };

  const progress = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0;

  const groupedSnippets = languageSnippets.reduce((acc, snippet) => {
    if (!acc[snippet.category]) {
      acc[snippet.category] = [];
    }
    acc[snippet.category].push(snippet);
    return acc;
  }, {} as Record<string, CodeSnippet[]>);

  return (
    <div className="glass-panel-strong">
      {/* Main Controls */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10">
        {/* Snippet Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[200px] justify-between gap-2 bg-muted/50 border-white/10 hover:bg-muted hover:border-white/20">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="truncate">
                  {algorithmName || selectedSnippet?.name || 'Select Algorithm'}
                </span>
              </span>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-card/95 backdrop-blur-xl border-white/10">
            {Object.entries(groupedSnippets).map(([category, snippets]) => (
              <div key={category}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">{category}</DropdownMenuLabel>
                {snippets.map((snippet) => (
                  <DropdownMenuItem
                    key={snippet.id}
                    onClick={() => handleSnippetSelect(snippet)}
                    className="cursor-pointer"
                  >
                    <span className={snippet.id === selectedSnippet?.id ? 'text-primary' : ''}>
                      {snippet.name}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-white/10" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[100px] justify-between gap-2 bg-muted/50 border-white/10 hover:bg-muted hover:border-white/20">
              <span className="text-xs font-mono">
                {language === 'java' ? '☕ Java' : language === 'python' ? '🐍 Python' : language === 'cpp' ? '⚡ C++' : language}
              </span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-36 bg-card/95 backdrop-blur-xl border-white/10">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Language</DropdownMenuLabel>
            {([['java', '☕ Java'], ['python', '🐍 Python'], ['cpp', '⚡ C++']] as [ProgrammingLanguage, string][]).map(([lang, label]) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`cursor-pointer ${language === lang ? 'text-primary font-semibold' : ''}`}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
            className={`control-button-primary w-10 h-10 rounded-full p-0 ${isRunning && !isPaused ? 'neon-glow-cyan' : ''}`}
          >
            {isRunning && !isPaused ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={step}
            disabled={currentStep >= steps.length - 1}
            className="control-button w-10 h-10 rounded-full p-0 disabled:opacity-30"
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="control-button-danger w-10 h-10 rounded-full p-0"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-3 ml-4">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Speed</span>
          <Slider
            value={[speed]}
            onValueChange={([value]) => setSpeed(value)}
            min={0.25}
            max={4}
            step={0.25}
            className="w-24"
          />
          <span className="text-xs font-mono text-primary w-10">{speed}x</span>
        </div>

        {/* Step Counter */}
        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Step </span>
            <span className="text-primary font-mono">{currentStep}</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-foreground font-mono">{Math.max(0, steps.length - 1)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-muted/50 relative overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>


    </div>
  );
};

export default ControlBar;
