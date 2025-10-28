/**
 * EDITABLE CONFIGURATION PAGE
 *
 * End-to-end editable interface for all parsed system data
 * Appears after AI parsing, before simulation
 *
 * Uses ParsedDataReview component with adapter for full 15-section editing
 */

import React, { useState } from 'react';
import { ExtractedSystem } from '../types/extraction';
import { ProcessGraph } from '../types/processGraph';
import { FloatingChatbotButton } from '../components/FloatingChatbotButton';
import { ChatbotSidebar } from '../components/ChatbotSidebar';
import ParsedDataReview from '../components/ParsedDataReview';
import { extractedSystemToProcessGraph, processGraphToExtractedSystem } from '../utils/systemGraphAdapter';
import './EditableConfigPage.css';

interface EditableConfigPageProps {
  system: ExtractedSystem;
  onSave: (updatedSystem: ExtractedSystem) => void;
  onCancel: () => void;
}

export const EditableConfigPage: React.FC<EditableConfigPageProps> = ({ system, onSave, onCancel }) => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Convert ExtractedSystem to ProcessGraph for editing
  const initialGraph = extractedSystemToProcessGraph(system);

  const handleApprove = (editedGraph: ProcessGraph) => {
    console.log('[EditableConfigPage] handleApprove called with graph:', editedGraph);
    // Convert back to ExtractedSystem and save
    const updatedSystem = processGraphToExtractedSystem(editedGraph);
    console.log('[EditableConfigPage] Converted to ExtractedSystem:', updatedSystem);
    console.log('[EditableConfigPage] Calling onSave...');
    onSave(updatedSystem);
  };

  const handleReject = () => {
    onCancel();
  };

  return (
    <div className="editable-config-page" style={{ position: 'relative' }}>
      {/* Use comprehensive ParsedDataReview component with all 15 sections */}
      <ParsedDataReview
        initialGraph={initialGraph}
        validation={{ valid: true, errors: [], warnings: [] }}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* AI Chatbot Integration (positioned over ParsedDataReview) */}
      <FloatingChatbotButton
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        isOpen={isChatbotOpen}
      />

      {isChatbotOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          zIndex: 1000,
        }}>
          <ChatbotSidebar
            system={system}
            onClose={() => setIsChatbotOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

// Remove all old editor components below - they're now in ParsedDataReview
// ============================================================================
// OLD CONTENT REMOVED - REPLACED WITH PARSEDDATAREVIEW
// ============================================================================
/*
OLD EDITORS:
- OverviewEditor
- EntitiesEditor
- ResourcesEditor
- ProcessesEditor
- RoutingEditor
- DistributionsEditor
- KPIsEditor

ALL NOW AVAILABLE IN PARSEDDATAREVIEW WITH 15 COMPREHENSIVE SECTIONS:
1. Stations (enhanced with batching, energy, layout)
2. Routes (complete routing configuration)
3. Arrivals (4 policies: poisson, schedule, orders, empirical)
4. Resources (skills, calendars, dispatching)
5. Entities (attributes, BOM, cost)
6. Run Config (comprehensive simulation parameters)
7. Metadata (model info, assumptions, missing fields)
8. Setups/Changeovers (cadence, class-based, sequence-dependent)
9. Quality/Rework/Scrap (inspection, yield tracking)
10. Failures/Downtime (MTBF/MTTR configuration)
11. Buffers/Storage (capacity, holding policies)
12. KPIs/Statistics (full CRUD operations)
13. Calendars (shifts, breaks - if implemented)
14. WIP Control (CONWIP/Kanban - if implemented)
15. Control Logic (event hooks - if implemented)
*/
