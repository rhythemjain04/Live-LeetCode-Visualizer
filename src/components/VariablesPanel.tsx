import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizerStore } from '@/store/visualizerStore';
import { Variable, Terminal, Layers, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

const VariablesPanel = () => {
  const { steps, currentStep, consoleOutput } = useVisualizerStore();
  const [isCallStackVisible, setIsCallStackVisible] = useState(true);
  const [isConsoleVisible, setIsConsoleVisible] = useState(true);

  const currentStepData = steps[currentStep];
  const variables = currentStepData?.variables || [];
  const callStack = currentStepData?.callStack || [];
  const consoleMessages = currentStepData?.console || consoleOutput;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Variables Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="panel-header">
          <Variable className="w-4 h-4 text-primary" />
          <span>Variables</span>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2">
          <AnimatePresence mode="popLayout">
            {variables.length > 0 ? (
              variables.map((variable, index) => (
                <motion.div
                  key={`${variable.name}-${index}`}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className={`variable-card ${variable.changed ? 'variable-card-active' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-mono text-primary truncate">{variable.name}</span>
                    <span className="text-xs text-muted-foreground">({variable.type})</span>
                  </div>
                  <motion.span 
                    key={String(variable.value)}
                    initial={variable.changed ? { scale: 1.2, color: 'hsl(190, 100%, 50%)' } : {}}
                    animate={{ scale: 1, color: 'hsl(210, 40%, 96%)' }}
                    className="text-sm font-mono font-medium truncate max-w-[120px]"
                    title={String(variable.value)}
                  >
                    {typeof variable.value === 'string' && variable.value.length > 15 
                      ? variable.value.slice(0, 15) + '...' 
                      : String(variable.value)}
                  </motion.span>
                </motion.div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No variables in scope
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Call Stack Section */}
      <div className="border-t border-white/10">
        <div
          className="panel-header cursor-pointer select-none hover:bg-white/5 transition-colors"
          onClick={() => setIsCallStackVisible(!isCallStackVisible)}
        >
          <Layers className="w-4 h-4 text-secondary" />
          <span>Call Stack</span>
          <button className="ml-auto p-0.5 rounded hover:bg-white/10 transition-colors">
            {isCallStackVisible ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {isCallStackVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-3 max-h-32 overflow-auto">
                <AnimatePresence mode="popLayout">
                  {callStack.length > 0 ? (
                    <div className="space-y-1">
                      {callStack.map((frame, index) => (
                        <motion.div
                          key={`${frame.functionName}-${index}`}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <ChevronRight className="w-3 h-3 text-secondary" />
                          <span className="font-mono text-secondary">{frame.functionName}</span>
                          <span className="text-xs text-muted-foreground">line {frame.line}</span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      Empty
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Console Section */}
      <div className="border-t border-white/10 flex-1 min-h-0 flex flex-col">
        <div
          className="panel-header cursor-pointer select-none hover:bg-white/5 transition-colors"
          onClick={() => setIsConsoleVisible(!isConsoleVisible)}
        >
          <Terminal className="w-4 h-4 text-accent" />
          <span>Console</span>
          <button className="ml-auto p-0.5 rounded hover:bg-white/10 transition-colors">
            {isConsoleVisible ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {isConsoleVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden flex-1"
            >
              <div className="overflow-auto p-3 bg-black/20 font-mono text-sm max-h-48">
                <AnimatePresence mode="popLayout">
                  {consoleMessages.length > 0 ? (
                    consoleMessages.map((msg, index) => (
                      <motion.div
                        key={`${msg}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`py-0.5 ${
                          msg.startsWith('✓') 
                            ? 'text-accent' 
                            : msg.includes('error') 
                              ? 'text-destructive' 
                              : 'text-foreground/80'
                        }`}
                      >
                        <span className="text-muted-foreground mr-2">{'>'}</span>
                        {msg}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">
                      <span className="text-muted-foreground/50">{'>'}</span> Ready...
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VariablesPanel;
