import React, { useRef, useEffect } from 'react';

export function ConsoleView({ logs }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="visualizer-panel console-panel">
      <div className="panel-header">
        <h3>Console Output</h3>
      </div>
      <div className="panel-content console-content" ref={contentRef}>
        {logs?.map((log, idx) => (
          <div key={idx} className="console-line">
            <span className="console-prompt">&gt;</span>
            <span className="console-text">{log}</span>
          </div>
        ))}
        {!logs || logs.length === 0 ? (
          <div className="empty-state">No output</div>
        ) : null}
      </div>
    </div>
  );
}
