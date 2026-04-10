import React from 'react';
import { MousePointer2 } from 'lucide-react';

export function DOMView({ onSimulateClick }) {
  return (
    <div className="visualizer-panel dom-panel" style={{ gridColumn: '1 / -1' }}>
      <div className="panel-header">
        <h3>Mini Browser Simulator</h3>
        <span className="badge">DOM</span>
      </div>
      <div className="panel-content dom-content" style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#111', borderRadius: '8px', padding: '16px' }}>
        <p style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic', flex: 1 }}>
          Interact with "document.getElementById('btn')"
        </p>
        
        <button 
          onClick={() => onSimulateClick('btn', 'click')}
          style={{
             display: 'flex',
             alignItems: 'center',
             gap: '8px',
             background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
             color: 'white',
             border: 'none',
             padding: '8px 16px',
             borderRadius: '6px',
             cursor: 'pointer',
             fontWeight: '600',
             fontFamily: 'Inter, sans-serif',
             boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
          }}
        >
          <MousePointer2 size={16} />
          Click Me (id: "btn")
        </button>
      </div>
    </div>
  );
}
