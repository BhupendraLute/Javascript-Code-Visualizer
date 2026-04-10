import React, { useRef, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

export function EditorView({ code, setCode, currentLine }) {
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);
  const monaco = useMonaco();

  function handleEditorDidMount(editor, m) {
    editorRef.current = editor;
  }

  useEffect(() => {
    if (editorRef.current && currentLine && monaco) {
      const editor = editorRef.current;
      const newDecorations = [
        {
          range: new monaco.Range(currentLine, 1, currentLine, 1),
          options: {
            isWholeLine: true,
            className: 'active-line-highlight',
            glyphMarginClassName: 'active-line-glyph',
          }
        }
      ];
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
      editor.revealLineInCenter(currentLine);
    } else if (editorRef.current && !currentLine && monaco) {
       decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  }, [currentLine, monaco]);

  return (
    <div className="editor-container">
      <div className="editor-header">
        script.js
      </div>
      <Editor
        height="calc(100% - 37px)"
        theme="vs-dark"
        defaultLanguage="javascript"
        value={code}
        onChange={(val) => setCode(val || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineHeight: 24,
          padding: { top: 16 },
          glyphMargin: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          formatOnPaste: true,
        }}
      />
    </div>
  );
}
