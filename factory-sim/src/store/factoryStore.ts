/**
 * Factory Store - Zustand State Management
 *
 * Manages the visual factory model:
 * - Machines on canvas
 * - Connections between machines
 * - Selection state
 * - Simulation state
 */

import { create } from 'zustand';
import { MachineConfig } from '../types/simulation';

export interface VisualMachine extends MachineConfig {
  // Visual properties
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  icon: string;

  // Runtime state (during simulation)
  runtimeState?: 'idle' | 'busy' | 'blocked' | 'down';
  currentQueue?: number;
  currentUtilization?: number;
  isBottleneck?: boolean;
}

export interface Connection {
  id: string;
  from: string; // machine ID
  to: string;   // machine ID
  lagTime: number; // Travel/buffer time in minutes
  capacity: number; // Max entities that can be in transit
  isActive?: boolean; // Visual indicator during simulation
}

export interface Entity {
  id: string;
  connectionId: string;
  progress: number; // 0-1 along the connection path
  type: 'part' | 'product';
  color: string;
}

interface FactoryStore {
  // Factory model
  machines: VisualMachine[];
  connections: Connection[];
  entities: Entity[];
  selectedMachineId: string | null;
  selectedConnectionId: string | null;

  // Connection mode
  connectingMode: {
    active: boolean;
    sourceId: string | null;
    step: 'idle' | 'selecting-source' | 'selecting-target';
  };

  // Machine actions
  addMachine: (machine: VisualMachine) => void;
  updateMachine: (id: string, updates: Partial<VisualMachine>) => void;
  removeMachine: (id: string) => void;
  selectMachine: (id: string | null) => void;

  // Connection actions
  addConnection: (connection: Partial<Connection>) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  removeConnection: (id: string) => void;
  selectConnection: (id: string | null) => void;
  startConnection: (fromMachineId: string) => void;
  completeConnection: (toMachineId: string) => void;
  cancelConnection: () => void;

  // Entity actions
  addEntity: (entity: Entity) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  removeEntity: (id: string) => void;
  spawnEntity: (connectionId: string) => void;

  // Utility
  clearAll: () => void;
  loadFactory: (machines: VisualMachine[], connections: Connection[]) => void;
}

let machineIdCounter = 1;
let connectionIdCounter = 1;
let entityIdCounter = 1;

export const useFactoryStore = create<FactoryStore>((set, get) => ({
  machines: [],
  connections: [],
  entities: [],
  selectedMachineId: null,
  selectedConnectionId: null,
  connectingMode: { active: false, sourceId: null, step: 'idle' },

  addMachine: (machine) => {
    const id = machine.id || `machine_${machineIdCounter++}`;
    set(state => ({
      machines: [...state.machines, { ...machine, id }]
    }));
  },

  updateMachine: (id, updates) => {
    set(state => ({
      machines: state.machines.map(m =>
        m.id === id ? { ...m, ...updates } : m
      )
    }));
  },

  removeMachine: (id) => {
    set(state => ({
      machines: state.machines.filter(m => m.id !== id),
      connections: state.connections.filter(c =>
        c.from !== id && c.to !== id
      ),
      selectedMachineId: state.selectedMachineId === id ? null : state.selectedMachineId
    }));
  },

  selectMachine: (id) => {
    set({ selectedMachineId: id });
  },

  addConnection: (connection) => {
    const id = connection.id || `conn_${connectionIdCounter++}`;
    const fullConnection: Connection = {
      id,
      from: connection.from!,
      to: connection.to!,
      lagTime: connection.lagTime ?? 2, // Default 2 min lag
      capacity: connection.capacity ?? 3, // Default capacity of 3
      isActive: connection.isActive ?? false
    };
    set(state => ({
      connections: [...state.connections, fullConnection]
    }));
  },

  updateConnection: (id, updates) => {
    set(state => ({
      connections: state.connections.map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  },

  removeConnection: (id) => {
    set(state => ({
      connections: state.connections.filter(c => c.id !== id),
      entities: state.entities.filter(e => e.connectionId !== id)
    }));
  },

  selectConnection: (id) => {
    set({ selectedConnectionId: id });
  },

  startConnection: (_fromMachineId) => {
    // Start connection mode - user will select source by clicking
    set({
      connectingMode: { 
        active: true, 
        sourceId: null, 
        step: 'selecting-source' 
      }
    });
  },

  completeConnection: (toMachineId) => {
    const { connectingMode, connections } = get();
    
    // Handle based on current step
    if (connectingMode.step === 'selecting-source') {
      // First click - set as source
      set({
        connectingMode: {
          active: true,
          sourceId: toMachineId,
          step: 'selecting-target'
        }
      });
    } else if (connectingMode.step === 'selecting-target' && connectingMode.sourceId) {
      // Second click - create connection
      const sourceId = connectingMode.sourceId;

      // Don't connect to self
      if (sourceId === toMachineId) {
        return;
      }

      // Check if connection already exists
      const exists = connections.some(c =>
        c.from === sourceId && c.to === toMachineId
      );

      if (!exists) {
        // Create the connection
        set({
          connections: [...connections, {
            id: `conn_${connectionIdCounter++}`,
            from: sourceId,
            to: toMachineId,
            lagTime: 2,
            capacity: 3
          }],
          connectingMode: { active: false, sourceId: null, step: 'idle' }
        });
      } else {
        // Connection exists, just exit
        set({ 
          connectingMode: { active: false, sourceId: null, step: 'idle' } 
        });
      }
    }
  },

  cancelConnection: () => {
    set({ 
      connectingMode: { active: false, sourceId: null, step: 'idle' } 
    });
  },

  // Entity management
  addEntity: (entity) => {
    set(state => ({
      entities: [...state.entities, entity]
    }));
  },

  updateEntity: (id, updates) => {
    set(state => ({
      entities: state.entities.map(e =>
        e.id === id ? { ...e, ...updates } : e
      )
    }));
  },

  removeEntity: (id) => {
    set(state => ({
      entities: state.entities.filter(e => e.id !== id)
    }));
  },

  spawnEntity: (connectionId) => {
    const connection = get().connections.find(c => c.id === connectionId);
    if (!connection) return;

    const entitiesOnConnection = get().entities.filter(e => e.connectionId === connectionId);
    if (entitiesOnConnection.length >= connection.capacity) return;

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const newEntity: Entity = {
      id: `entity_${entityIdCounter++}`,
      connectionId,
      progress: 0,
      type: 'part',
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    set(state => ({
      entities: [...state.entities, newEntity]
    }));
  },

  clearAll: () => {
    set({
      machines: [],
      connections: [],
      entities: [],
      selectedMachineId: null,
      selectedConnectionId: null,
      connectingMode: { active: false, sourceId: null, step: 'idle' }
    });
    machineIdCounter = 1;
    connectionIdCounter = 1;
    entityIdCounter = 1;
  },

  loadFactory: (machines, connections) => {
    set({
      machines,
      connections,
      entities: [],
      selectedMachineId: null,
      selectedConnectionId: null,
      connectingMode: { active: false, sourceId: null, step: 'idle' }
    });
  }
}));
