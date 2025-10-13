/**
 * Code Editor - Level 4 Editability
 *
 * Monaco-based code editor for direct TypeScript editing
 * - Syntax highlighting
 * - Auto-completion
 * - Error checking
 * - Bidirectional sync with spec
 */

import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useDESModelStore } from '../../store/desModelStore';
import './CodeEditor.css';

export const CodeEditor: React.FC = () => {
  const {
    generatedCode,
    setGeneratedCode,
    syncCodeToSpec,
    regenerateCode,
  } = useDESModelStore();

  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure TypeScript defaults
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    // Add custom key bindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setGeneratedCode(value);
    }
  };

  const handleSave = () => {
    console.log('Saving code and syncing to spec...');
    syncCodeToSpec();
  };

  const handleRegenerate = () => {
    if (
      confirm(
        'This will regenerate the code from the specification and discard your changes. Continue?'
      )
    ) {
      regenerateCode();
    }
  };

  return (
    <div className="code-editor-container">
      <div className="code-editor-header">
        <h3>SIMULATION MODEL CODE</h3>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleRegenerate}>
            🔄 Regenerate from Spec
          </button>
          <button className="btn-primary" onClick={handleSave}>
            💾 Save & Sync
          </button>
        </div>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={generatedCode}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            wordWrap: 'off',
          }}
        />
      </div>

      <div className="code-editor-footer">
        <div className="footer-info">
          <span className="status-indicator success">●</span>
          <span>TypeScript</span>
          <span className="separator">|</span>
          <span>Line {editorRef.current?.getPosition()?.lineNumber || 1}</span>
          <span className="separator">|</span>
          <span>UTF-8</span>
        </div>
        <div className="footer-actions">
          <button className="footer-btn">Format Code</button>
          <button className="footer-btn">Find & Replace</button>
        </div>
      </div>
    </div>
  );
};
