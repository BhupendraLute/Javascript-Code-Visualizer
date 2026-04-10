import React, { useState, useRef } from 'react';
import { EditorView, CallStack, WebAPIs, TaskQueues, Controls, ConsoleView, DOMView, MemoryView } from './components';
import { CodeVisualizerEngine } from './engine/Interpreter';
import { Code2 } from 'lucide-react';
import './index.css';

const DEFAULT_CODE = `const globalVar = 'I am global';
function outer(outerArg) {
  const closedOver = 'secret';
  return function inner(innerArg) {
     console.log(globalVar, outerArg, closedOver, innerArg);
  }
}
const fn = outer('arg1');
fn('arg2');
`;

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [snapshots, setSnapshots] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const engineRef = useRef(null);

  const handleRun = () => {
    setIsRunning(true);
    try {
      engineRef.current = new CodeVisualizerEngine(code);
      const generatedSnapshots = engineRef.current.run();
      setSnapshots([...generatedSnapshots]);
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
      alert('Error parsing or evaluating code. Please check console.');
    }
    setIsRunning(false);
  };

  const handleSimulateClick = (id, event) => {
    if (engineRef.current && snapshots.length > 0) {
       const newSnapshots = engineRef.current.triggerDOMEvent(id, event);
       setSnapshots([...newSnapshots]);
    }
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
        actionText={currentSnapshot.contextName}
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
          <MemoryView memory={currentSnapshot.memory} />
          {code.includes('document.') && <DOMView onSimulateClick={handleSimulateClick} />}
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
