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
  totalSteps,
  actionText
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
        <>
          <div className="divider"></div>
          <div className="action-info" style={{ color: '#fbbf24', marginLeft: 'auto', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
             <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Event Loop Status:</span>
             <span style={{ background: 'rgba(251, 191, 36, 0.15)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
               {actionText || 'Idle'}
             </span>
          </div>
          <div className="progress-info" style={{ marginLeft: '16px' }}>
            Step {currentIndex} / {totalSteps - 1}
          </div>
        </>
      )}
    </div>
  );
}
