/**
 * Editable DES System - Main Page
 *
 * Complete editable discrete event simulation system with:
 * - Multi-view editing (Spec, Visual, Code, Properties)
 * - Bidirectional sync
 * - Undo/redo
 * - AI + Manual hybrid workflow
 */

import React, { useState } from 'react';
import { useDESModelStore } from '../store/desModelStore';
import { SpecificationEditor } from '../components/editors/SpecificationEditor';
import { VisualFlowEditor } from '../components/editors/VisualFlowEditor';
import { CodeEditor } from '../components/editors/CodeEditor';
import { ExperimentDesigner } from '../components/editors/ExperimentDesigner';
import './EditableDES.css';

type ViewMode = 'spec' | 'visual' | 'code' | 'experiments';

export const EditableDES: React.FC = () => {
  const {
    extractedSystem,
    setEditMode,
    isDirty,
    undo,
    redo,
    canUndo,
    canRedo,
    syncAll,
  } = useDESModelStore();

  const [currentView, setCurrentView] = useState<ViewMode>('spec');

  const handleViewChange = (view: ViewMode) => {
    // Check for unsaved changes
    if (Object.values(isDirty).some(Boolean)) {
      const confirmSwitch = confirm(
        'You have unsaved changes. Switching views will sync changes. Continue?'
      );
      if (confirmSwitch) {
        syncAll();
      } else {
        return;
      }
    }
    setCurrentView(view);
    setEditMode(view as any);
  };

  const isDirtyInCurrentView = () => {
    switch (currentView) {
      case 'spec':
        return isDirty.spec;
      case 'visual':
        return isDirty.visual;
      case 'code':
        return isDirty.code;
      default:
        return false;
    }
  };

  return (
    <div className="editable-des">
      {/* Header */}
      <div className="des-header">
        <div className="header-left">
          <button
            className="back-btn"
            onClick={() => {
              window.location.hash = '';
              window.location.reload();
            }}
            title="Back to Document Extraction"
          >
            ← Back
          </button>
          <h1>EDITABLE DES SYSTEM</h1>
          {extractedSystem && (
            <span className="system-badge">{extractedSystem.systemName}</span>
          )}
        </div>

        <div className="header-right">
          {isDirtyInCurrentView() && (
            <span className="dirty-indicator">● Unsaved changes</span>
          )}
          <button
            className="header-btn"
            onClick={() => undo()}
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            className="header-btn"
            onClick={() => redo()}
            disabled={!canRedo()}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <button className="header-btn" onClick={() => syncAll()}>
            Sync All
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button
          className={`tab ${currentView === 'spec' ? 'active' : ''}`}
          onClick={() => handleViewChange('spec')}
        >
          <span className="tab-label">Specification</span>
          {isDirty.spec && <span className="dirty-dot">●</span>}
        </button>

        <button
          className={`tab ${currentView === 'visual' ? 'active' : ''}`}
          onClick={() => handleViewChange('visual')}
        >
          <span className="tab-label">Visual Flow</span>
          {isDirty.visual && <span className="dirty-dot">●</span>}
        </button>

        <button
          className={`tab ${currentView === 'code' ? 'active' : ''}`}
          onClick={() => handleViewChange('code')}
        >
          <span className="tab-label">Code</span>
          {isDirty.code && <span className="dirty-dot">●</span>}
        </button>

        <button
          className={`tab ${currentView === 'experiments' ? 'active' : ''}`}
          onClick={() => handleViewChange('experiments')}
        >
          <span className="tab-label">Experiments</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="des-content">
        {!extractedSystem && (
          <div className="empty-state">
            <h2>No System Loaded</h2>
            <p>
              Upload a document in the Document Extraction page to generate an
              editable DES model.
            </p>
            <button
              className="btn-primary"
              onClick={() => (window.location.href = '#/document-extraction')}
            >
              Go to Document Extraction
            </button>
          </div>
        )}

        {extractedSystem && currentView === 'spec' && <SpecificationEditor />}
        {extractedSystem && currentView === 'visual' && <VisualFlowEditor />}
        {extractedSystem && currentView === 'code' && <CodeEditor />}
        {extractedSystem && currentView === 'experiments' && <ExperimentDesigner />}
      </div>

      {/* Footer Status Bar */}
      <div className="des-footer">
        <div className="footer-left">
          <span className="status-item">
            <span className="label">Mode:</span>
            <span className="value">{currentView}</span>
          </span>
          {extractedSystem && (
            <>
              <span className="separator">|</span>
              <span className="status-item">
                <span className="label">Entities:</span>
                <span className="value">{extractedSystem.entities.length}</span>
              </span>
              <span className="separator">|</span>
              <span className="status-item">
                <span className="label">Resources:</span>
                <span className="value">{extractedSystem.resources.length}</span>
              </span>
              <span className="separator">|</span>
              <span className="status-item">
                <span className="label">Processes:</span>
                <span className="value">{extractedSystem.processes.length}</span>
              </span>
            </>
          )}
        </div>

        <div className="footer-right">
          <span className="status-item">
            <span className="label">AI + Manual Hybrid</span>
          </span>
        </div>
      </div>
    </div>
  );
};
