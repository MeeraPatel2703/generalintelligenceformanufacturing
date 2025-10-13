/**
 * Sophisticated Simulation Adapter
 *
 * Adapts the SophisticatedDESEngine for visual display
 * Handles layout, entity visualization, and stats
 */

import { SophisticatedDESEngine, SimEntity, SimResource } from './SophisticatedDESEngine';
import type { ExtractedSystem } from '../types/extraction';

export interface VisualEntity {
  id: string;
  type: string;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  state: 'traveling' | 'waiting' | 'processing' | 'departed';
  color: string;
  currentResource?: string;
}

export interface VisualResource {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  capacity: number;
  currentLoad: number;
  queueLength: number;
}

export class SophisticatedSimulationAdapter {
  private engine: SophisticatedDESEngine;
  private system: ExtractedSystem;

  // Layout
  private resourcePositions: Map<string, { x: number; y: number }> = new Map();
  private entryPosition = { x: 100, y: 300 };
  private exitPosition = { x: 1100, y: 300 };

  // Visual state
  private entityColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  constructor(system: ExtractedSystem) {
    this.system = system;
    this.engine = new SophisticatedDESEngine(system);
    this.calculateLayout();
  }

  private calculateLayout(): void {
    const numResources = this.system.resources.length;
    const spacing = 800 / Math.max(1, numResources - 1);
    const startX = 250;
    const y = 300;

    this.system.resources.forEach((resource, idx) => {
      const name = resource.name || `resource-${idx}`;
      this.resourcePositions.set(name, {
        x: startX + (idx * spacing),
        y
      });
    });
  }

  public start(): void {
    // Engine is initialized in constructor
  }

  public step(): boolean {
    return this.engine.step();
  }

  public getCurrentTime(): number {
    return this.engine.getCurrentTime();
  }

  public getVisualEntities(): VisualEntity[] {
    const simEntities = this.engine.getEntities();

    return simEntities.map(entity => {
      const position = this.calculateEntityPosition(entity);
      const targetPosition = this.calculateEntityTargetPosition(entity);

      return {
        id: entity.id,
        type: entity.type,
        position,
        targetPosition,
        state: this.mapEntityState(entity.state),
        color: this.entityColors[parseInt(entity.id.split('-')[1] || '0') % this.entityColors.length],
        currentResource: entity.seizedResources[0]
      };
    });
  }

  private calculateEntityPosition(entity: SimEntity): { x: number; y: number } {
    // If waiting or processing at a resource
    if (entity.seizedResources.length > 0) {
      const resourceName = entity.seizedResources[0];
      const resourcePos = this.resourcePositions.get(resourceName);
      if (resourcePos) {
        return { x: resourcePos.x, y: resourcePos.y - 40 };
      }
    }

    // If in queue
    const resources = this.engine.getResources();
    for (const resource of resources) {
      const queueIndex = resource.queue.findIndex(e => e.id === entity.id);
      if (queueIndex !== -1) {
        const resourcePos = this.resourcePositions.get(resource.name);
        if (resourcePos) {
          return {
            x: resourcePos.x - 30 - (queueIndex * 15),
            y: resourcePos.y - 40
          };
        }
      }
    }

    // Default to entry
    return this.entryPosition;
  }

  private calculateEntityTargetPosition(entity: SimEntity): { x: number; y: number } {
    if (entity.state === 'departed') {
      return this.exitPosition;
    }

    if (entity.seizedResources.length > 0) {
      const resourceName = entity.seizedResources[0];
      const resourcePos = this.resourcePositions.get(resourceName);
      if (resourcePos) {
        return { x: resourcePos.x, y: resourcePos.y - 40 };
      }
    }

    return this.entryPosition;
  }

  private mapEntityState(state: SimEntity['state']): VisualEntity['state'] {
    switch (state) {
      case 'arriving':
      case 'traveling':
        return 'traveling';
      case 'waiting':
        return 'waiting';
      case 'processing':
        return 'processing';
      case 'departed':
        return 'departed';
      case 'deciding':
        return 'processing';
      default:
        return 'traveling';
    }
  }

  public getVisualResources(): VisualResource[] {
    const simResources = this.engine.getResources();

    return simResources.map(resource => {
      const position = this.resourcePositions.get(resource.name) || { x: 0, y: 0 };

      return {
        id: resource.id,
        name: resource.name,
        position,
        size: { width: 120, height: 80 },
        capacity: resource.capacity,
        currentLoad: resource.inUse,
        queueLength: resource.queue.length
      };
    });
  }

  public getStats() {
    const stats = this.engine.getStats();
    const resources = this.engine.getResources();

    // Calculate resource utilization
    const resourceStats = resources.map(r => ({
      name: r.name,
      utilization: r.capacity > 0 ? (r.inUse / r.capacity) * 100 : 0,
      queueLength: r.queue.length
    }));

    return {
      ...stats,
      progress: Math.min(100, (stats.currentTime / 500) * 100),
      resources: resourceStats
    };
  }

  public getEntryPosition() {
    return this.entryPosition;
  }

  public getExitPosition() {
    return this.exitPosition;
  }
}
