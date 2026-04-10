import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CallStack({ callStack }) {
  return (
    <div className="visualizer-panel callstack-panel">
      <div className="panel-header">
        <h3>Call Stack</h3>
        <span className="badge">{callStack?.length || 0}</span>
      </div>
      <div className="panel-content stack-container">
        <AnimatePresence>
          {[...(callStack || [])].reverse().map((frame, idx) => (
            <motion.div
              key={`${frame.name}-${idx}`}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
              className="stack-frame"
              style={{
                zIndex: callStack.length - idx,
                marginTop: idx === 0 ? 0 : '-8px'
              }}
            >
              <span className="func-name">{frame.name}</span>
              <span className="status-dot pulsing"></span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!callStack || callStack.length === 0 ? (
          <div className="empty-state">Stack is empty</div>
        ) : null}
      </div>
    </div>
  );
}
