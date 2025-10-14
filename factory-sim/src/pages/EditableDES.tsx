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
import '../styles/industrial-theme.css';

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

  const handleBack = () => {
    window.location.hash = '';
    window.location.reload();
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
    <div className="industrial-container" style={{ minHeight: '100vh' }}>
      <div className="blueprint-background"></div>
      
      {/* Header */}
      <div className="industrial-content" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button
              onClick={handleBack}
              className="industrial-button industrial-button--secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              title="Back to Document Extraction"
            >
              ← BACK
            </button>
            <div>
              <div className="industrial-hero__label">DES EDITOR</div>
              <h1 className="industrial-hero__title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
                {extractedSystem?.systemName || 'EDITABLE DES SYSTEM'}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isDirtyInCurrentView() && (
              <div className="industrial-status industrial-status--warning">
                <span className="industrial-status__indicator"></span>
                UNSAVED CHANGES
              </div>
            )}
            <button
              className="industrial-button industrial-button--secondary"
              onClick={() => undo()}
              disabled={!canUndo()}
              title="Undo (Ctrl+Z)"
              style={{ opacity: canUndo() ? 1 : 0.5 }}
            >
              ↶ UNDO
            </button>
            <button
              className="industrial-button industrial-button--secondary"
              onClick={() => redo()}
              disabled={!canRedo()}
              title="Redo (Ctrl+Y)"
              style={{ opacity: canRedo() ? 1 : 0.5 }}
            >
              ↷ REDO
            </button>
            <button 
              className="industrial-button industrial-button--primary" 
              onClick={() => syncAll()}
            >
              SYNC ALL
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginTop: '1.5rem',
          borderBottom: '1px solid var(--color-border)'
        }}>
          {(['spec', 'visual', 'code', 'experiments'] as ViewMode[]).map(view => {
            const labels = {
              spec: 'SPECIFICATION',
              visual: 'VISUAL FLOW',
              code: 'CODE',
              experiments: 'EXPERIMENTS'
            };
            const isActive = currentView === view;
            const dirty = isDirty[view as keyof typeof isDirty];

            return (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: isActive ? 'var(--color-bg-secondary)' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {labels[view]}
                {dirty && (
                  <span style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    width: '6px',
                    height: '6px',
                    background: 'var(--color-warning)',
                    borderRadius: '50%'
                  }}></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="industrial-content" style={{ padding: '2rem', flex: 1 }}>
        {!extractedSystem && (
          <div className="industrial-card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div className="industrial-status industrial-status--idle" style={{ marginBottom: '1.5rem', justifyContent: 'center' }}>
              <span className="industrial-status__indicator"></span>
              NO SYSTEM LOADED
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
              No DES Model Available
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
              Upload a document in the AGENTIC DES page to generate an editable DES model,
              or load an existing system specification.
            </p>
            <button
              className="industrial-button industrial-button--primary"
              onClick={handleBack}
            >
              GO TO AGENTIC DES
            </button>
          </div>
        )}

        {extractedSystem && currentView === 'spec' && <SpecificationEditor />}
        {extractedSystem && currentView === 'visual' && <VisualFlowEditor />}
        {extractedSystem && currentView === 'code' && <CodeEditor />}
        {extractedSystem && currentView === 'experiments' && <ExperimentDesigner />}
      </div>

      {/* Footer Status Bar */}
      {extractedSystem && (
        <div style={{
          padding: '0.75rem 2rem',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)'
        }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span>
              <span style={{ opacity: 0.6 }}>MODE:</span>{' '}
              <span style={{ color: 'var(--color-primary)' }}>{currentView.toUpperCase()}</span>
            </span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>
              <span style={{ opacity: 0.6 }}>ENTITIES:</span>{' '}
              <span style={{ color: 'var(--color-text-primary)' }}>{extractedSystem.entities.length}</span>
            </span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>
              <span style={{ opacity: 0.6 }}>RESOURCES:</span>{' '}
              <span style={{ color: 'var(--color-text-primary)' }}>{extractedSystem.resources.length}</span>
            </span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>
              <span style={{ opacity: 0.6 }}>PROCESSES:</span>{' '}
              <span style={{ color: 'var(--color-text-primary)' }}>{extractedSystem.processes.length}</span>
            </span>
          </div>

          <div className="industrial-badge">
            AI + MANUAL HYBRID
          </div>
        </div>
      )}
    </div>
  );
};
