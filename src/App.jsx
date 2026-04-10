import React, { useState, useEffect } from 'react';
import { EditorView, CallStack, WebAPIs, TaskQueues, Controls, ConsoleView } from './components';
import { CodeVisualizerEngine } from './engine/Interpreter';
import { Code2 } from 'lucide-react';
import './index.css';

const DEFAULT_CODE = `console.log('1. Script start');

setTimeout(() => {
  console.log('4. setTimeout callback');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise then');
});

console.log('2. Script end');
`;

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [snapshots, setSnapshots] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    try {
      const engine = new CodeVisualizerEngine(code);
      const generatedSnapshots = engine.run();
      setSnapshots(generatedSnapshots);
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
      alert('Error parsing or evaluating code. Please check console.');
    }
    setIsRunning(false);
  };

  const currentSnapshot = snapshots[currentIndex] || {
    callStack: [],
    webAPIs: [],
    macrotaskQueue: [],
    microtaskQueue: [],
    console: [],
    line: null
  };

  const handleNext = () => {
    if (currentIndex < snapshots.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setSnapshots([]);
    setCurrentIndex(0);
  };

  return (
    <div className="app-container">
      <header className="header">
        <Code2 size={28} color="#60a5fa" />
        <h1>JavaScript Visualizer</h1>
      </header>

      <Controls 
        onRun={handleRun}
        onNext={handleNext}
        onPrev={handlePrev}
        onReset={handleReset}
        isRunning={isRunning}
        canNext={snapshots.length > 0 && currentIndex < snapshots.length - 1}
        canPrev={currentIndex > 0}
        currentIndex={currentIndex}
        totalSteps={snapshots.length}
      />

      <div className="main-content">
        <div className="left-panel">
          <EditorView 
            code={code} 
            setCode={setCode} 
            currentLine={currentSnapshot.line} 
          />
          <ConsoleView logs={currentSnapshot.console} />
        </div>

        <div className="right-panel">
          <CallStack callStack={currentSnapshot.callStack} />
          <WebAPIs apis={currentSnapshot.webAPIs} />
          <TaskQueues 
            macrotasks={currentSnapshot.macrotaskQueue} 
            microtasks={currentSnapshot.microtaskQueue} 
          />
        </div>
      </div>
    </div>
  );
}

export default App;
