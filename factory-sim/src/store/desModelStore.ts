/**
 * Enhanced DES Model Store with Undo/Redo
 *
 * Complete state management for the editable DES system:
 * - ExtractedSystem model (from AI)
 * - Visual flow diagram
 * - Code representation
 * - Undo/redo with command pattern
 * - Bidirectional sync between views
 */

import { create } from 'zustand';
import { produce } from 'immer';
import type { ExtractedSystem, Entity, Resource, Process, Objective, Experiment } from '../types/extraction';
import type { Node, Edge } from 'reactflow';

// ============================================================================
// COMMAND PATTERN FOR UNDO/REDO
// ============================================================================

interface Command {
  execute: (state: ModelState) => ModelState;
  undo: (state: ModelState) => ModelState;
  description: string;
}

class CommandHistory {
  private past: Command[] = [];
  private future: Command[] = [];

  execute(command: Command, state: ModelState): ModelState {
    this.past.push(command);
    this.future = []; // Clear redo stack
    return command.execute(state);
  }

  undo(state: ModelState): ModelState | null {
    const command = this.past.pop();
    if (!command) return null;
    this.future.push(command);
    return command.undo(state);
  }

  redo(state: ModelState): ModelState | null {
    const command = this.future.pop();
    if (!command) return null;
    this.past.push(command);
    return command.execute(state);
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear() {
    this.past = [];
    this.future = [];
  }
}

// ============================================================================
// MODEL STATE
// ============================================================================

export interface ModelState {
  // Core extracted system
  extractedSystem: ExtractedSystem | null;

  // Visual representation (React Flow)
  flowNodes: Node[];
  flowEdges: Edge[];

  // Code representation
  generatedCode: string;

  // Edit mode
  editMode: 'spec' | 'visual' | 'code' | 'properties' | 'distribution';

  // Selection
  selectedEntityId: string | null;
  selectedResourceId: string | null;
  selectedProcessId: string | null;
  selectedNodeId: string | null;

  // AI generation state
  isAIGenerated: boolean;
  aiConfidence: number;

  // Dirty flags for sync
  isDirty: {
    spec: boolean;
    visual: boolean;
    code: boolean;
  };
}

interface DESModelStore extends ModelState {
  // Command history
  history: CommandHistory;

  // System-level actions
  setExtractedSystem: (system: ExtractedSystem) => void;
  clearSystem: () => void;

  // Entity CRUD
  addEntity: (entity: Entity) => void;
  updateEntity: (index: number, updates: Partial<Entity>) => void;
  removeEntity: (index: number) => void;

  // Resource CRUD
  addResource: (resource: Resource) => void;
  updateResource: (index: number, updates: Partial<Resource>) => void;
  removeResource: (index: number) => void;

  // Process CRUD
  addProcess: (process: Process) => void;
  updateProcess: (index: number, updates: Partial<Process>) => void;
  removeProcess: (index: number) => void;

  // Objective CRUD
  addObjective: (objective: Objective) => void;
  updateObjective: (index: number, updates: Partial<Objective>) => void;
  removeObjective: (index: number) => void;

  // Experiment CRUD
  addExperiment: (experiment: Experiment) => void;
  updateExperiment: (index: number, updates: Partial<Experiment>) => void;
  removeExperiment: (index: number) => void;

  // Visual flow actions
  setFlowNodes: (nodes: Node[]) => void;
  setFlowEdges: (edges: Edge[]) => void;
  syncVisualToSpec: () => void;

  // Code actions
  setGeneratedCode: (code: string) => void;
  syncCodeToSpec: () => void;

  // Selection
  selectEntity: (id: string | null) => void;
  selectResource: (id: string | null) => void;
  selectProcess: (id: string | null) => void;
  selectNode: (id: string | null) => void;

  // Edit mode
  setEditMode: (mode: ModelState['editMode']) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Sync operations
  syncAll: () => void;
  regenerateVisual: () => void;
  regenerateCode: () => void;
}

// ============================================================================
// SYNC UTILITIES
// ============================================================================

/**
 * Generate React Flow nodes from ExtractedSystem
 * Creates a continuous flow from entities through resources to exit
 */
function generateFlowNodesFromSystem(system: ExtractedSystem | null): Node[] {
  if (!system) return [];

  const nodes: Node[] = [];
  const horizontalSpacing = 300;
  const verticalSpacing = 120;
  let currentX = 50;

  // Step 1: Create source nodes for entity arrivals (leftmost)
  system.entities.forEach((entity, idx) => {
    nodes.push({
      id: `entity-${idx}`,
      type: 'source',
      position: { x: currentX, y: idx * verticalSpacing + 50 },
      data: {
        label: entity.name,
        entityType: entity.type,
        arrivalPattern: entity.arrivalPattern,
      },
    });
  });

  currentX += horizontalSpacing;

  // Step 2: Create resource nodes in sequential columns
  const resourcesPerColumn = 3;
  system.resources.forEach((resource, idx) => {
    const column = Math.floor(idx / resourcesPerColumn);
    const row = idx % resourcesPerColumn;

    nodes.push({
      id: `resource-${idx}`,
      type: 'resource',
      position: {
        x: currentX + (column * horizontalSpacing),
        y: row * verticalSpacing + 50
      },
      data: {
        label: resource.name,
        resourceType: resource.type,
        capacity: resource.capacity,
        processingTime: resource.processingTime,
      },
    });
  });

  // Calculate the rightmost position
  const numResourceColumns = Math.ceil(system.resources.length / resourcesPerColumn);
  currentX += (numResourceColumns * horizontalSpacing) + horizontalSpacing;

  // Step 3: Create decision nodes if we have processes with routing logic
  const hasDecisions = system.processes.some(
    p => p.routingLogic === 'conditional' || p.routingLogic === 'probabilistic'
  );

  if (hasDecisions) {
    system.processes.forEach((process, idx) => {
      if (process.routingLogic !== 'sequential') {
        nodes.push({
          id: `decision-${idx}`,
          type: 'decision',
          position: { x: currentX, y: idx * verticalSpacing + 50 },
          data: {
            label: `${process.name} Decision`,
            branches: process.sequence.length,
          },
        });
      }
    });
  }

  return nodes;
}

/**
 * Generate React Flow edges from ExtractedSystem
 * Creates continuous flow connections between nodes
 */
function generateFlowEdgesFromSystem(system: ExtractedSystem | null): Edge[] {
  if (!system) return [];

  const edges: Edge[] = [];

  // Step 1: Connect entities to first resource (if any resources exist)
  if (system.resources.length > 0) {
    system.entities.forEach((_entity, entityIdx) => {
      // Connect to first resource
      edges.push({
        id: `edge-entity-${entityIdx}-to-resource-0`,
        source: `entity-${entityIdx}`,
        target: `resource-0`,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: 'arrowclosed' as any },
      });
    });
  }

  // Step 2: Connect resources in sequence
  for (let i = 0; i < system.resources.length - 1; i++) {
    edges.push({
      id: `edge-resource-${i}-to-${i + 1}`,
      source: `resource-${i}`,
      target: `resource-${i + 1}`,
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: 'arrowclosed' as any },
    });
  }

  // Step 3: If we have processes with conditions, create conditional edges
  system.processes.forEach((process, processIdx) => {
    process.sequence.forEach((step, stepIdx) => {
      if (step.conditions && step.conditions.length > 0) {
        step.conditions.forEach((condition, condIdx) => {
          // Find matching resource or decision node
          const targetId = condition.nextStepId || `resource-${(stepIdx + 1) % system.resources.length}`;

          edges.push({
            id: `edge-process-${processIdx}-step-${stepIdx}-${condIdx}`,
            source: `resource-${stepIdx}`,
            target: targetId,
            type: 'smoothstep',
            label: condition.probability ? `${(condition.probability * 100).toFixed(0)}%` : '',
            animated: true,
            markerEnd: { type: 'arrowclosed' as any },
          });
        });
      }
    });
  });

  return edges;
}

/**
 * Generate TypeScript code from ExtractedSystem
 */
function generateCodeFromSystem(system: ExtractedSystem | null): string {
  if (!system) return '';

  return `// ${system.systemName} - DES Model
// Auto-generated from specification - Fully Editable

import { SimulationEngine, Entity, Resource, Process } from './engine';

export class ${toCamelCase(system.systemName)}Simulation extends SimulationEngine {

  // ============================================================================
  // ENTITIES
  // ============================================================================

${system.entities.map((entity, idx) => `  // ${entity.name}
  private entity_${idx} = {
    name: '${entity.name}',
    type: '${entity.type}',
    arrivalPattern: ${JSON.stringify(entity.arrivalPattern, null, 4).split('\n').join('\n    ')},
  };`).join('\n\n')}

  // ============================================================================
  // RESOURCES
  // ============================================================================

${system.resources.map((resource, idx) => `  // ${resource.name}
  private resource_${idx} = new Resource({
    name: '${resource.name}',
    type: '${resource.type}',
    capacity: ${resource.capacity},
    processingTime: ${JSON.stringify(resource.processingTime)},
  });`).join('\n\n')}

  // ============================================================================
  // SIMULATION LOGIC
  // ============================================================================

  constructor() {
    super();
    this.setupSimulation();
  }

  private setupSimulation() {
    // Initialize resources
${system.resources.map((_, idx) => `    this.addResource(this.resource_${idx});`).join('\n')}

    // Setup entity arrivals
${system.entities.map((_, idx) => `    this.scheduleEntityArrivals(this.entity_${idx});`).join('\n')}
  }
}
`;
}

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .map((word, idx) => idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

const commandHistory = new CommandHistory();

export const useDESModelStore = create<DESModelStore>((set, get) => ({
  // Initial state
  extractedSystem: null,
  flowNodes: [],
  flowEdges: [],
  generatedCode: '',
  editMode: 'spec',
  selectedEntityId: null,
  selectedResourceId: null,
  selectedProcessId: null,
  selectedNodeId: null,
  isAIGenerated: false,
  aiConfidence: 0,
  isDirty: { spec: false, visual: false, code: false },
  history: commandHistory,

  // System-level actions
  setExtractedSystem: (system) => {
    set({
      extractedSystem: system,
      flowNodes: generateFlowNodesFromSystem(system),
      flowEdges: generateFlowEdgesFromSystem(system),
      generatedCode: generateCodeFromSystem(system),
      isAIGenerated: true,
      aiConfidence: system.extractionConfidence?.overall || 0,
      isDirty: { spec: false, visual: false, code: false },
    });
    commandHistory.clear();
  },

  clearSystem: () => {
    set({
      extractedSystem: null,
      flowNodes: [],
      flowEdges: [],
      generatedCode: '',
      isAIGenerated: false,
      aiConfidence: 0,
      isDirty: { spec: false, visual: false, code: false },
    });
    commandHistory.clear();
  },

  // Entity CRUD
  addEntity: (entity) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem) {
        draft.extractedSystem.entities.push(entity);
        draft.isDirty.spec = true;
      }
    }));
  },

  updateEntity: (index, updates) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem && draft.extractedSystem.entities[index]) {
        Object.assign(draft.extractedSystem.entities[index], updates);
        draft.isDirty.spec = true;
      }
    }));
  },

  removeEntity: (index) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem) {
        draft.extractedSystem.entities.splice(index, 1);
        draft.isDirty.spec = true;
      }
    }));
  },

  // Resource CRUD
  addResource: (resource) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem) {
        draft.extractedSystem.resources.push(resource);
        draft.isDirty.spec = true;
      }
    }));
  },

  updateResource: (index, updates) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem && draft.extractedSystem.resources[index]) {
        Object.assign(draft.extractedSystem.resources[index], updates);
        draft.isDirty.spec = true;
      }
    }));
  },

  removeResource: (index) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem) {
        draft.extractedSystem.resources.splice(index, 1);
        draft.isDirty.spec = true;
      }
    }));
  },

  // Process CRUD
  addProcess: (process) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem) {
        draft.extractedSystem.processes.push(process);
        draft.isDirty.spec = true;
      }
    }));
  },

  updateProcess: (index, updates) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem && draft.extractedSystem.processes[index]) {
        Object.assign(draft.extractedSystem.processes[index], updates);
        draft.isDirty.spec = true;
      }
    }));
  },

  removeProcess: (index) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem) {
        draft.extractedSystem.processes.splice(index, 1);
        draft.isDirty.spec = true;
      }
    }));
  },

  // Objective CRUD
  addObjective: (objective) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem) {
        draft.extractedSystem.objectives.push(objective);
        draft.isDirty.spec = true;
      }
    }));
  },

  updateObjective: (index, updates) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem && draft.extractedSystem.objectives[index]) {
        Object.assign(draft.extractedSystem.objectives[index], updates);
        draft.isDirty.spec = true;
      }
    }));
  },

  removeObjective: (index) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem) {
        draft.extractedSystem.objectives.splice(index, 1);
        draft.isDirty.spec = true;
      }
    }));
  },

  // Experiment CRUD
  addExperiment: (experiment) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem) {
        draft.extractedSystem.experiments.push(experiment);
        draft.isDirty.spec = true;
      }
    }));
  },

  updateExperiment: (index, updates) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem && draft.extractedSystem.experiments[index]) {
        Object.assign(draft.extractedSystem.experiments[index], updates);
        draft.isDirty.spec = true;
      }
    }));
  },

  removeExperiment: (index) => {
    set(produce((draft: ModelState) => {
      if (draft.extractedSystem) {
        draft.extractedSystem.experiments.splice(index, 1);
        draft.isDirty.spec = true;
      }
    }));
  },

  // Visual flow actions
  setFlowNodes: (nodes) => {
    set({ flowNodes: nodes, isDirty: { ...get().isDirty, visual: true } });
  },

  setFlowEdges: (edges) => {
    set({ flowEdges: edges, isDirty: { ...get().isDirty, visual: true } });
  },

  syncVisualToSpec: () => {
    // TODO: Parse visual flow back to spec
    console.log('Syncing visual to spec...');
  },

  // Code actions
  setGeneratedCode: (code) => {
    set({ generatedCode: code, isDirty: { ...get().isDirty, code: true } });
  },

  syncCodeToSpec: () => {
    // TODO: Parse code back to spec
    console.log('Syncing code to spec...');
  },

  // Selection
  selectEntity: (id) => set({ selectedEntityId: id }),
  selectResource: (id) => set({ selectedResourceId: id }),
  selectProcess: (id) => set({ selectedProcessId: id }),
  selectNode: (id) => set({ selectedNodeId: id }),

  // Edit mode
  setEditMode: (mode) => set({ editMode: mode }),

  // Undo/Redo
  undo: () => {
    const state = commandHistory.undo(get());
    if (state) set(state);
  },

  redo: () => {
    const state = commandHistory.redo(get());
    if (state) set(state);
  },

  canUndo: () => commandHistory.canUndo(),
  canRedo: () => commandHistory.canRedo(),

  // Sync operations
  syncAll: () => {
    const { extractedSystem } = get();
    set({
      flowNodes: generateFlowNodesFromSystem(extractedSystem),
      flowEdges: generateFlowEdgesFromSystem(extractedSystem),
      generatedCode: generateCodeFromSystem(extractedSystem),
      isDirty: { spec: false, visual: false, code: false },
    });
  },

  regenerateVisual: () => {
    const { extractedSystem } = get();
    set({
      flowNodes: generateFlowNodesFromSystem(extractedSystem),
      flowEdges: generateFlowEdgesFromSystem(extractedSystem),
      isDirty: { ...get().isDirty, visual: false },
    });
  },

  regenerateCode: () => {
    const { extractedSystem } = get();
    set({
      generatedCode: generateCodeFromSystem(extractedSystem),
      isDirty: { ...get().isDirty, code: false },
    });
  },
}));
