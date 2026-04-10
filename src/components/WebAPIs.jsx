import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function WebAPIs({ apis }) {
  return (
    <div className="visualizer-panel webapis-panel">
      <div className="panel-header">
        <h3>Web APIs</h3>
        <span className="badge">{apis?.length || 0}</span>
      </div>
      <div className="panel-content api-container">
        <AnimatePresence>
          {apis?.map((api, idx) => (
            <motion.div
              key={`${api}-${idx}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              className="api-item"
            >
              <div className="spinner"></div>
              <span>{api}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!apis || apis.length === 0 ? (
          <div className="empty-state">No Web APIs running</div>
        ) : null}
      </div>
    </div>
  );
}
