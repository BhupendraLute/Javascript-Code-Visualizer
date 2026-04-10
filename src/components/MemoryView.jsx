import React from 'react';
import { Database } from 'lucide-react';

export function MemoryView({ memory }) {
  const memList = memory || [];
  const localScope = memList.find(s => s.name === 'Local') || { name: 'Local', vars: {} };
  const closures = memList.filter(s => s.name === 'Closure');
  const globalScope = memList.find(s => s.name === 'Global') || { name: 'Global', vars: {} };

  const orderedScopes = [localScope, ...closures, globalScope];

  return (
    <div className="visualizer-panel memory-panel" style={{ gridColumn: '1 / -1' }}>
      <div className="panel-header">
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="#e879f9" />
            <h3>Memory &amp; Environment</h3>
         </div>
      </div>
      <div className="panel-content" style={{ display: 'flex', flexDirection: 'row', gap: '16px', overflowX: 'auto', alignItems: 'flex-start' }}>
        {orderedScopes.map((scope, idx) => (
          <div key={idx} className={`scope-container ${scope.name.toLowerCase()}-scope`} style={{ flex: '1', minWidth: '200px' }}>
             <div className="scope-header">
                <span className="scope-name">{scope.name} Scope</span>
                {scope.name === 'Closure' && <span className="closure-badge">Preserved</span>}
             </div>
             
             {Object.keys(scope.vars).length === 0 ? (
                <div className="scope-empty">No variables</div>
             ) : (
                <div className="scope-vars">
                  {Object.entries(scope.vars).map(([key, val]) => (
                    <div key={key} className="var-row">
                       <span className="var-key">{key}</span>
                       <span className="var-colon">:</span>
                       <span className={`var-value ${val === 'undefined' ? 'val-undefined' : ''}`}>
                          {val === 'undefined' ? 'undefined' : val}
                       </span>
                    </div>
                  ))}
                </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
}
