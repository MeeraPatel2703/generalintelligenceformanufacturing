/**
 * Simulation Adapter
 *
 * Converts extracted system definitions into DES engine configuration
 * and manages simulation execution
 */

import { DESEngine, Entity, Resource } from './DESEngine';
import { ExtractedSystem } from '../types/extraction';

export interface SimulationConfig {
  runSpeed: number; // Speed multiplier
  maxSimTime: number;
  warmupTime: number;
  collectStats: boolean;
}

export interface VisualEntity {
  id: string;
  type: string;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  state: 'traveling' | 'waiting' | 'processing' | 'departed';
  color: string;
  progress: number;
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

export class SimulationAdapter {
  private engine: DESEngine;
  private system: ExtractedSystem;
  private config: SimulationConfig;

  // Layout information
  private resourcePositions: Map<string, { x: number; y: number }> = new Map();
  private processToResource: Map<string, string> = new Map();

  // Visual state
  private visualEntities: VisualEntity[] = [];
  private visualResources: VisualResource[] = [];

  // Entity colors
  private entityColors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4'
  ];
  private colorIndex = 0;

  constructor(system: ExtractedSystem, config: Partial<SimulationConfig> = {}) {
    this.engine = new DESEngine();
    this.system = system;
    this.config = {
      runSpeed: config.runSpeed || 1,
      maxSimTime: config.maxSimTime || 500,
      warmupTime: config.warmupTime || 50,
      collectStats: config.collectStats !== false
    };

    this.initialize();
  }

  private initialize(): void {
    // Calculate layout
    this.calculateLayout();

    // Configure resources
    this.system.resources?.forEach((resource, index) => {
      this.engine.addResource(
        resource.id || `resource-${index}`,
        resource.name,
        resource.capacity || 1
      );
    });

    // Configure processes from the system
    if (this.system.processes && this.system.processes.length > 0) {
      // Use explicit process definitions
      this.system.processes.forEach((process, index) => {
        const nextProcess = index < this.system.processes!.length - 1
          ? this.system.processes![index + 1].id
          : null;

        this.engine.addProcess(
          process.id || `process-${index}`,
          process.name,
          process.resourceId || this.system.resources![index]?.id || `resource-${index}`,
          this.convertProcessingTime(process.duration),
          nextProcess
        );

        // Track process to resource mapping
        this.processToResource.set(
          process.id || `process-${index}`,
          process.resourceId || this.system.resources![index]?.id || `resource-${index}`
        );
      });
    } else {
      // Infer processes from resources
      this.system.resources?.forEach((resource, index) => {
        const nextResourceId = index < this.system.resources!.length - 1
          ? this.system.resources![index + 1]?.id || `resource-${index + 1}`
          : null;

        const processId = `process-${index}`;
        const resourceId = resource.id || `resource-${index}`;

        this.engine.addProcess(
          processId,
          resource.name,
          resourceId,
          this.convertProcessingTime(resource.processingTime),
          nextResourceId ? `process-${index + 1}` : null
        );

        this.processToResource.set(processId, resourceId);
      });
    }

    // Set arrival rate from entity configuration
    const arrivalRate = this.getArrivalRate();
    this.engine.setArrivalRate(arrivalRate);
    this.engine.setMaxSimTime(this.config.maxSimTime);

    // Subscribe to simulation events
    this.engine.onEvent((event, entities, resources) => {
      this.updateVisualState(entities, resources);
    });
  }

  private calculateLayout(): void {
    const canvasWidth = 1200;
    const canvasHeight = 600;
    const numResources = this.system.resources?.length || 1;
    const spacing = canvasWidth / (numResources + 1);

    this.system.resources?.forEach((resource, index) => {
      const x = spacing * (index + 1);
      const y = canvasHeight / 2;
      this.resourcePositions.set(resource.id || `resource-${index}`, { x, y });
    });
  }

  private convertProcessingTime(processingTime: any): any {
    if (!processingTime) {
      return {
        distribution: 'constant',
        params: { value: 1 }
      };
    }

    const type = processingTime.type?.toLowerCase() || 'constant';
    const params = processingTime.parameters || {};

    switch (type) {
      case 'constant':
        return {
          distribution: 'constant',
          params: { value: params.value || params.mean || 1 }
        };

      case 'exponential':
        return {
          distribution: 'exponential',
          params: { rate: 1 / (params.mean || 1) }
        };

      case 'normal':
        return {
          distribution: 'normal',
          params: {
            mean: params.mean || 1,
            stdDev: params.stdDev || params.standardDeviation || 0.1
          }
        };

      case 'uniform':
        return {
          distribution: 'uniform',
          params: {
            min: params.min || 0.5,
            max: params.max || 1.5
          }
        };

      case 'triangular':
        return {
          distribution: 'triangular',
          params: {
            min: params.min || 0.5,
            mode: params.mode || 1,
            max: params.max || 1.5
          }
        };

      default:
        return {
          distribution: 'constant',
          params: { value: 1 }
        };
    }
  }

  private getArrivalRate(): number {
    if (!this.system.entities || this.system.entities.length === 0) {
      return 1; // Default: 1 entity per minute
    }

    const entity = this.system.entities[0];
    const arrivalPattern = entity.arrivalPattern;

    if (!arrivalPattern) {
      return 1;
    }

    switch (arrivalPattern.type?.toLowerCase()) {
      case 'constant':
        return arrivalPattern.rate || 1;

      case 'poisson':
      case 'exponential':
        return arrivalPattern.rate || 1;

      default:
        return 1;
    }
  }

  private updateVisualState(entities: Entity[], resources: Resource[]): void {
    // Update visual entities
    this.visualEntities = entities
      .filter(e => e.state !== 'departed')
      .map(entity => {
        // Find position based on current state
        let position = { x: 50, y: 300 };
        let targetPosition = { x: 50, y: 300 };
        let progress = 0;

        if (entity.currentProcess) {
          const resourceId = this.processToResource.get(entity.currentProcess);
          if (resourceId) {
            const resourcePos = this.resourcePositions.get(resourceId);
            if (resourcePos) {
              targetPosition = resourcePos;

              if (entity.state === 'traveling') {
                // Interpolate position
                const dx = targetPosition.x - position.x;
                const dy = targetPosition.y - position.y;
                progress = 0.5; // Simplified - in real impl track actual progress
                position = {
                  x: position.x + dx * progress,
                  y: position.y + dy * progress
                };
              } else if (entity.state === 'waiting' || entity.state === 'processing') {
                position = targetPosition;
              }
            }
          }
        }

        return {
          id: entity.id,
          type: entity.type,
          position,
          targetPosition,
          state: entity.state as any,
          color: this.getEntityColor(entity.id),
          progress: entity.state === 'processing' ? 0.5 : 0
        };
      });

    // Update visual resources
    this.visualResources = resources.map(resource => {
      const position = this.resourcePositions.get(resource.id) || { x: 0, y: 0 };

      return {
        id: resource.id,
        name: resource.name,
        position,
        size: { width: 120, height: 80 },
        capacity: resource.capacity,
        currentLoad: resource.currentLoad,
        queueLength: resource.queue.length
      };
    });
  }

  private getEntityColor(entityId: string): string {
    // Consistent color per entity
    const hash = entityId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.entityColors[hash % this.entityColors.length];
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  start(): void {
    this.engine.initialize();
  }

  step(): boolean {
    return this.engine.step();
  }

  run(): void {
    this.engine.run();
  }

  getCurrentTime(): number {
    return this.engine.getCurrentTime();
  }

  getVisualEntities(): VisualEntity[] {
    return this.visualEntities;
  }

  getVisualResources(): VisualResource[] {
    return this.visualResources;
  }

  getStats() {
    return this.engine.getStats();
  }

  getProgress(): number {
    return Math.min(100, (this.getCurrentTime() / this.config.maxSimTime) * 100);
  }

  isComplete(): boolean {
    return this.getCurrentTime() >= this.config.maxSimTime;
  }
}
