import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

export function Controls({
  onRun,
  onNext,
  onPrev,
  onReset,
  isRunning,
  canNext,
  canPrev,
  currentIndex,
  totalSteps
}) {
  return (
    <div className="controls-bar">
      <button 
        className={`btn btn-primary ${isRunning ? 'running' : ''}`}
        onClick={onRun}
        disabled={isRunning}
      >
        <Play size={18} />
        {isRunning ? 'Running...' : 'Run Code'}
      </button>

      <div className="divider"></div>

      <button 
        className="btn btn-secondary" 
        onClick={onPrev} 
        disabled={!canPrev}
      >
        <SkipBack size={18} />
        Prev
      </button>

      <button 
        className="btn btn-secondary" 
        onClick={onNext} 
        disabled={!canNext}
      >
        Next
        <SkipForward size={18} />
      </button>

      <div className="divider"></div>

      <button className="btn btn-danger" onClick={onReset}>
        <RotateCcw size={18} />
        Reset
      </button>

      {totalSteps > 0 && (
        <div className="progress-info">
          Step {currentIndex} / {totalSteps - 1}
        </div>
      )}
    </div>
  );
}
