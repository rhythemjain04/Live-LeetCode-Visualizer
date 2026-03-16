import { motion } from 'framer-motion';
import { useVisualizerStore } from '@/store/visualizerStore';
import { Slider } from '@/components/ui/slider';
import { Clock, FastForward, Rewind } from 'lucide-react';

const TimelineBar = () => {
  const { currentStep, steps, goToStep, isRunning } = useVisualizerStore();

  const handleTimelineChange = (value: number[]) => {
    goToStep(value[0]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel p-4"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-xs">Timeline</span>
        </div>

        <button 
          onClick={() => goToStep(Math.max(0, currentStep - 1))}
          className="control-button w-8 h-8 p-0 rounded-full"
          disabled={currentStep <= 0}
        >
          <Rewind className="w-4 h-4" />
        </button>

        <div className="flex-1">
          <Slider
            value={[currentStep]}
            onValueChange={handleTimelineChange}
            min={0}
            max={Math.max(0, steps.length - 1)}
            step={1}
            disabled={steps.length <= 1}
            className="cursor-pointer"
          />
        </div>

        <button 
          onClick={() => goToStep(Math.min(steps.length - 1, currentStep + 1))}
          className="control-button w-8 h-8 p-0 rounded-full"
          disabled={currentStep >= steps.length - 1}
        >
          <FastForward className="w-4 h-4" />
        </button>

        {/* Step markers */}
        <div className="flex items-center gap-1">
          {steps.slice(0, Math.min(10, steps.length)).map((_, i) => (
            <motion.div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${
                i === currentStep 
                  ? 'bg-primary' 
                  : i < currentStep 
                    ? 'bg-secondary' 
                    : 'bg-muted'
              }`}
              whileHover={{ scale: 1.5 }}
              onClick={() => goToStep(i)}
            />
          ))}
          {steps.length > 10 && (
            <span className="text-xs text-muted-foreground ml-1">+{steps.length - 10}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TimelineBar;
