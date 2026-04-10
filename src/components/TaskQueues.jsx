import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function TaskQueues({ macrotasks, microtasks }) {
  return (
    <div className="queues-container">
      {/* Microtask Queue */}
      <div className="visualizer-panel microtask-panel">
        <div className="panel-header">
          <h3>Microtask Queue</h3>
          <span className="badge micro-badge">{microtasks?.length || 0}</span>
        </div>
        <div className="panel-content queue-content">
          <AnimatePresence>
            {microtasks?.map((task, idx) => (
              <motion.div
                key={`${task}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="queue-item microtask-item"
              >
                {task}
              </motion.div>
            ))}
          </AnimatePresence>
          {!microtasks || microtasks.length === 0 ? (
            <div className="empty-state">Queue is empty</div>
          ) : null}
        </div>
      </div>

      {/* Macrotask Queue */}
      <div className="visualizer-panel macrotask-panel mt-4">
        <div className="panel-header">
          <h3>Task (Macrotask) Queue</h3>
          <span className="badge macro-badge">{macrotasks?.length || 0}</span>
        </div>
        <div className="panel-content queue-content">
          <AnimatePresence>
            {macrotasks?.map((task, idx) => (
              <motion.div
                key={`${task}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="queue-item macrotask-item"
              >
                {task}
              </motion.div>
            ))}
          </AnimatePresence>
          {!macrotasks || macrotasks.length === 0 ? (
            <div className="empty-state">Queue is empty</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
