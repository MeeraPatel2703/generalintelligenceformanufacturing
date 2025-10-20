/**
 * Question Sidebar Demo
 * Demo component to showcase the question sidebar functionality
 */

import { useState } from 'react';
import { QuestionSidebar } from './QuestionSidebar';
import { ExtractedSystem } from '../types/extraction';
import { ComprehensiveSimulationResults } from '../types/simulation';

interface Props {
  system: ExtractedSystem;
  results?: ComprehensiveSimulationResults;
}

export function QuestionSidebarDemo({ system, results }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 20px',
          backgroundColor: isOpen ? '#ef4444' : 'var(--color-primary)',
          color: isOpen ? '#fff' : '#000',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        }}
      >
        {isOpen ? '✕ Close AI' : '🤖 Ask AI'}
      </button>

      {/* Question Sidebar */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '0',
          right: '0',
          width: '450px',
          height: '100vh',
          zIndex: 1001,
        }}>
          <QuestionSidebar
            system={system}
            currentResults={results}
            onRunScenario={async (parameters) => {
              console.log('[Demo] Scenario requested:', parameters);
              return results!;
            }}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}

