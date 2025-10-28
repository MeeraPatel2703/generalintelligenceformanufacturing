/**
 * SYSTEM-GRAPH ADAPTER
 * Bidirectional conversion between ExtractedSystem and ProcessGraph
 * Enables using ParsedDataReview component with EditableConfigPage
 */

import { ExtractedSystem } from '../types/extraction';
import { ProcessGraph, Distribution, Station, Entity, Route, Arrival } from '../types/processGraph';

// ============================================================================
// EXTRACTED SYSTEM → PROCESS GRAPH
// ============================================================================

export function extractedSystemToProcessGraph(system: ExtractedSystem): ProcessGraph {
  // Ensure system has required fields with defaults
  const safeSystem = {
    systemName: system?.systemName || 'Unnamed Model',
    systemType: system?.systemType || 'manufacturing',
    description: system?.description || '',
    entities: system?.entities || [],
    resources: system?.resources || [],
    processes: system?.processes || [],
    simulationDuration: system?.simulationDuration || 8,
    warmupPeriod: system?.warmupPeriod || 0,
    replications: system?.replications || 1,
    randomSeed: system?.randomSeed || 12345
  };

  const graph: ProcessGraph = {
    metadata: {
      model_id: safeSystem.systemName,
      version: '1.0',
      description: safeSystem.description,
      created: new Date().toISOString(),
      author: 'User',
      assumptions: []
    },
    entities: convertEntities(safeSystem),
    arrivals: convertArrivals(safeSystem),
    stations: convertStations(safeSystem),
    routes: convertRoutes(safeSystem),
    resources: convertResources(safeSystem),
    distributions: {},
    runConfig: {
      runLength_min: safeSystem.simulationDuration * 60,
      warmup_min: safeSystem.warmupPeriod * 60,
      replications: safeSystem.replications,
      confidence: 95,
      seed: safeSystem.randomSeed
    },
    kpis: convertKPIs(safeSystem)
  };

  return graph;
}

// ============================================================================
// PROCESS GRAPH → EXTRACTED SYSTEM
// ============================================================================

export function processGraphToExtractedSystem(graph: ProcessGraph): ExtractedSystem {
  const system: ExtractedSystem = {
    systemName: graph.metadata?.model_id || 'Unnamed Model',
    systemType: 'manufacturing',
    description: graph.metadata?.description || '',
    entities: convertEntitiesToExtracted(graph),
    resources: convertResourcesToExtracted(graph),
    processes: convertStationsToProcesses(graph),
    simulationDuration: (graph.runConfig?.runLength_min || 480) / 60,
    warmupPeriod: (graph.runConfig?.warmup_min || 0) / 60,
    replications: graph.runConfig?.replications || 1,
    randomSeed: graph.runConfig?.seed || 12345
  };

  return system;
}

// ============================================================================
// ENTITY CONVERSION
// ============================================================================

function convertEntities(system: ExtractedSystem): Entity[] {
  if (!system.entities || system.entities.length === 0) {
    return [{
      id: 'Part',
      class: 'Part',
      priority: 0,
      batch_size: 1
    }];
  }

  return system.entities.map((entity: any) => ({
    id: entity.name || entity.id || 'Entity',
    class: entity.type || 'Part',
    priority: entity.priority || 0,
    batch_size: entity.batchSize || 1,
    attributes: entity.attributes || {},
    cost_per_unit: entity.costPerUnit || 0
  }));
}

function convertEntitiesToExtracted(graph: ProcessGraph): any[] {
  if (!graph.entities || graph.entities.length === 0) {
    return [];
  }

  return graph.entities.map(entity => ({
    name: entity.id,
    type: entity.class,
    priority: entity.priority || 0,
    batchSize: entity.batch_size || 1,
    attributes: entity.attributes || {},
    costPerUnit: entity.cost_per_unit || 0
  }));
}

// ============================================================================
// ARRIVAL CONVERSION
// ============================================================================

function convertArrivals(system: ExtractedSystem): Arrival[] {
  if (!system.entities || system.entities.length === 0) {
    return [{
      entity_id: 'Part',
      policy: 'poisson',
      rate_table: [{ time_start: 0, rate: 10 }]
    }];
  }

  return system.entities.map((entity: any) => ({
    entity_id: entity.name || entity.id || 'Entity',
    policy: 'poisson',
    rate_table: entity.arrivalRate ? [{ time_start: 0, rate: entity.arrivalRate }] : [{ time_start: 0, rate: 10 }],
    first_arrival_time: 0
  }));
}

// ============================================================================
// STATION CONVERSION
// ============================================================================

function convertStations(system: ExtractedSystem): Station[] {
  const stations: Station[] = [];

  // Convert resources to stations
  if (system.resources && system.resources.length > 0) {
    system.resources.forEach((resource: any) => {
      stations.push({
        id: resource.name || 'Station',
        kind: resource.type || 'machine',
        count: resource.capacity || 1,
        capacity: resource.capacity || 1,
        queue: resource.queueDiscipline || 'FIFO',
        processTime: {
          type: 'constant',
          params: { value: 1 },
          units: 'minutes'
        }
      });
    });
  }

  // Convert processes to station details
  if (system.processes && system.processes.length > 0) {
    system.processes.forEach((process: any) => {
      const existingStation = stations.find(s => s.id === process.resourceName);
      if (existingStation) {
        existingStation.processTime = {
          type: process.processingTimeDistribution || 'constant',
          params: { value: process.processingTime || 1 },
          units: 'minutes'
        } as Distribution;

        if (process.setupTime && process.setupTime > 0) {
          existingStation.setup = {
            mode: 'cadence',
            cadence: {
              every_n: 10,
              time: {
                type: 'constant',
                params: { value: process.setupTime },
                units: 'minutes'
              }
            }
          };
        }
      }
    });
  }

  // If no stations, create a default one
  if (stations.length === 0) {
    stations.push({
      id: 'Machine1',
      kind: 'machine',
      count: 1,
      capacity: 1,
      queue: 'FIFO',
      processTime: {
        type: 'constant',
        params: { value: 1 },
        units: 'minutes'
      }
    });
  }

  return stations;
}

function convertStationsToProcesses(graph: ProcessGraph): any[] {
  if (!graph.stations || graph.stations.length === 0) return [];

  return graph.stations.map((station, idx) => ({
    name: station.id || 'Process',
    entityType: graph.entities?.[0]?.id || 'Part',
    routingLogic: 'sequential' as const,
    sequence: [
      {
        id: `step-${idx}-process`,
        type: 'process' as const,
        resourceName: station.id || 'Resource',
        duration: station.processTime || {
          type: 'constant' as const,
          params: { value: 1 },
          units: 'minutes' as const
        },
        description: `Process at ${station.id}`
      }
    ],
    description: `Process for ${station.id}`,
    // Legacy fields for backward compatibility
    resourceName: station.id || 'Resource',
    processingTime: station.processTime?.type === 'constant' ?
      (station.processTime.params as any).value : 1,
    processingTimeDistribution: station.processTime?.type || 'constant',
    setupTime: station.setup?.mode === 'cadence' && station.setup.cadence?.time.type === 'constant' ?
      (station.setup.cadence.time.params as any).value : 0,
    teardownTime: 0,
    batchSize: 1,
    yield: 100
  }));
}

// ============================================================================
// ROUTE CONVERSION
// ============================================================================

function convertRoutes(system: ExtractedSystem): Route[] {
  const routes: Route[] = [];

  // Create simple sequential routing if we have multiple stations
  if (system.resources && system.resources.length > 1) {
    for (let i = 0; i < system.resources.length - 1; i++) {
      routes.push({
        from: system.resources[i].name,
        to: system.resources[i + 1].name,
        probability: 1.0,
        transport_type: 'instant'
      });
    }
  }

  return routes;
}

// ============================================================================
// RESOURCE CONVERSION
// ============================================================================

function convertResources(system: ExtractedSystem): any[] {
  if (!system.resources) return [];

  return system.resources.map((resource: any) => ({
    pool_id: resource.name,
    type: resource.type === 'worker' ? 'operator' : 'tool',
    count: resource.capacity || 1,
    home_station: resource.name,
    skills: resource.skills || []
  }));
}

function convertResourcesToExtracted(graph: ProcessGraph): any[] {
  if (!graph.resources || graph.resources.length === 0) return [];

  return graph.resources.map((resource: any) => ({
    name: resource.pool_id || 'Resource',
    type: resource.type === 'operator' ? 'worker' : 'machine',
    capacity: resource.count || 1,
    initialCapacity: resource.count || 1,
    skills: resource.skills || [],
    queueDiscipline: 'FIFO'
  }));
}

// ============================================================================
// KPI CONVERSION
// ============================================================================

function convertKPIs(system: ExtractedSystem): any[] {
  const kpis: any[] = [];

  // Add default KPIs
  kpis.push({
    name: 'Throughput',
    type: 'rate',
    formula: 'entities_completed / run_length',
    units: 'entities/hour',
    target: 100
  });

  kpis.push({
    name: 'Cycle Time',
    type: 'time',
    formula: 'avg(entity.total_time)',
    units: 'minutes',
    target: 30
  });

  kpis.push({
    name: 'Utilization',
    type: 'percentage',
    formula: 'avg(station.busy_time / run_length)',
    units: '%',
    target: 80
  });

  return kpis;
}
