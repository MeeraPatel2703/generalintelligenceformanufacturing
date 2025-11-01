/**
 * EXTRACTED SYSTEM TO FACTORY ANALYSIS ADAPTER
 *
 * Converts simulation results from ExtractedSystem (PDF/document-based)
 * into FactoryAnalysis format for comprehensive analysis.
 *
 * This enables root cause analysis, improvement scenarios, and ROI
 * calculations for PDF-extracted systems.
 */

import type { ExtractedSystem } from '../../src/types/extraction';
import type { FactoryAnalysis } from '../../src/types/analysis';
import { GenericDESModel } from './SystemToDESMapper';

/**
 * Run ExtractedSystem simulation and convert to FactoryAnalysis format
 */
export function runExtractedSystemWithComprehensiveAnalysis(
  system: ExtractedSystem,
  simulationTime: number = 480,
  numReplications: number = 10
): FactoryAnalysis {
  console.log('[Adapter] Converting ExtractedSystem to FactoryAnalysis format...');

  // Run the DES simulation
  const model = new GenericDESModel(system);

  // Run multiple replications to gather statistics
  const replicationResults: any[] = [];

  for (let rep = 0; rep < numReplications; rep++) {
    model.reset();
    model.rng.setSeed(12345 + rep);
    model.scheduleArrivals(simulationTime);
    model.run(simulationTime);

    const results = model.getResults();
    replicationResults.push(results);

    if ((rep + 1) % 10 === 0) {
      console.log(`[Adapter] Completed replication ${rep + 1}/${numReplications}`);
    }
  }

  // Aggregate results
  const aggregated = aggregateReplicationResults(replicationResults);

  // Convert to FactoryAnalysis format
  const factoryAnalysis = convertToFactoryAnalysis(system, aggregated, simulationTime);

  console.log('[Adapter] Conversion complete');
  return factoryAnalysis;
}

/**
 * Aggregate results across replications
 */
function aggregateReplicationResults(replications: any[]): any {
  if (replications.length === 0) {
    return {};
  }

  const aggregated: any = {
    observations: {},
    resources: {}
  };

  // Aggregate observations
  const obsNames = Object.keys(replications[0].observations || {});
  for (const obsName of obsNames) {
    const values = replications.map(r => r.observations[obsName]?.mean).filter(v => v !== undefined && !isNaN(v));

    if (values.length > 0) {
      aggregated.observations[obsName] = {
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        stdDev: calculateStdDev(values),
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  }

  // Aggregate resource utilization
  const resourceNames = Object.keys(replications[0].resources || {});
  for (const resourceName of resourceNames) {
    const utilizations = replications.map(r => r.resources[resourceName]?.utilization).filter(v => v !== undefined && !isNaN(v));

    if (utilizations.length > 0) {
      aggregated.resources[resourceName] = {
        utilization: utilizations.reduce((a, b) => a + b, 0) / utilizations.length,
        utilizationStdDev: calculateStdDev(utilizations)
      };
    }
  }

  return aggregated;
}

/**
 * Convert aggregated simulation results to FactoryAnalysis format
 */
function convertToFactoryAnalysis(
  system: ExtractedSystem,
  aggregated: any,
  simulationTime: number
): FactoryAnalysis {
  console.log('[Adapter] Building FactoryAnalysis object...');

  // Extract metrics from aggregated results
  const throughputCount = aggregated.observations?.throughput?.count || 0;

  // Create machine entries from resources
  const machines = (system.resources || []).map((resource) => {
    const resourceName = resource.name;
    const utilization = aggregated.resources?.[resourceName]?.utilization || 0.5;
    const utilizationStdDev = aggregated.resources?.[resourceName]?.utilizationStdDev || 0.1;

    // Estimate processing time from resource definition
    const processTime = resource.processingTime?.parameters?.mean ||
                       resource.processingTime?.parameters?.value || 5;

    return {
      id: resourceName.replace(/\s+/g, '_'),
      name: resourceName,
      type: inferMachineType(resource.name) as any,
      plc_tag_prefix: resourceName.replace(/\s+/g, '_').toUpperCase(),
      cycle_time: {
        distribution_type: 'normal' as const,
        mean: processTime,
        std_dev: processTime * 0.2, // 20% CV
        min: processTime * 0.8,
        max: processTime * 1.2,
        unit: 'min' as const
      },
      resource_config: {
        capacity: resource.capacity || 1,
        routing_rule: 'FIFO' as const,
        initial_state: 'available' as const
      },
      failure_maintenance: {
        mtbf_minutes: 480, // 8 hours default
        mttr_minutes: 15,
        failure_type: 'RANDOM' as const
      },
      utilization: {
        avg: utilization * 100,
        max: Math.min(100, (utilization + utilizationStdDev) * 100),
        is_bottleneck: false // Will be set below
      },
      queue_pattern: {
        avg_length: utilization > 0.8 ? 5 : utilization > 0.6 ? 2 : 0.5,
        max_length: utilization > 0.8 ? 15 : utilization > 0.6 ? 8 : 3,
        is_growing: utilization > 0.85
      },
      visualization: {
        position: { x: 0, y: 0, z: 0 },
        visual_type: 'station' as const,
        color_hex: '#4A90E2'
      }
    };
  });

  // Identify bottleneck (highest utilization)
  let bottleneckMachine = machines[0];
  for (const machine of machines) {
    if (machine.utilization.avg > bottleneckMachine.utilization.avg) {
      bottleneckMachine = machine;
    }
  }

  // Mark bottleneck machine
  bottleneckMachine.utilization.is_bottleneck = true;

  // Create flow sequence
  const flowSequence = machines.map(m => m.id);

  // Build FactoryAnalysis object
  const factoryAnalysis: FactoryAnalysis = {
    machines,
    material_handling: {
      conveyors: [],
      agv_system: {
        vehicles: [],
        network_nodes: [],
        network_edges: []
      },
      transporters: []
    },
    flow_routing: {
      sequence: flowSequence,
      connections: {} // Simple sequential flow
    },
    entity_sources: [
      {
        id: 'source_1',
        entity_type: system.entities?.[0]?.name || 'Part',
        interarrival_time: {
          distribution_type: 'exponential' as const,
          mean: system.entities?.[0]?.arrivalPattern?.interarrivalTime?.parameters?.mean || 5,
          unit: 'min' as const
        },
        max_arrivals: 'unlimited' as const,
        position: { x: -10, y: 0, z: 0 }
      }
    ],
    shifts_calendars: {
      calendar_type: '24x7' as const,
      shifts: [],
      breaks: [],
      holidays: [],
      resource_calendars: {}
    },
    optimization: {
      bottleneck: {
        machine_id: bottleneckMachine.id,
        reason: `High utilization (${bottleneckMachine.utilization.avg.toFixed(1)}%) limiting system throughput`,
        utilization_pct: bottleneckMachine.utilization.avg,
        queue_length: bottleneckMachine.queue_pattern.avg_length,
        severity: bottleneckMachine.utilization.avg > 90 ? 'high' as const :
                  bottleneckMachine.utilization.avg > 80 ? 'medium' as const : 'low' as const
      },
      opportunities: [
        `Add capacity at ${bottleneckMachine.id}`,
        'Reduce variability in processing times',
        'Optimize scheduling and routing'
      ],
      factors_for_doe: [
        {
          name: `${bottleneckMachine.id}_capacity`,
          min: 1,
          max: 3,
          current: bottleneckMachine.resource_config.capacity,
          discrete: true
        }
      ]
    },
    simulation_config: {
      duration_minutes: simulationTime,
      warmup_minutes: simulationTime * 0.1,
      num_replications: 100,
      enable_3d: false,
      enable_material_handling: false,
      enable_failures: false,
      enable_shifts: false,
      enable_ai_insights: true
    },
    data_quality: {
      total_rows: throughputCount,
      time_span_hours: simulationTime / 60,
      missing_data_pct: 0,
      confidence_level: 'high' as const
    },
    // Legacy fields for backward compatibility
    flow_sequence: flowSequence,
    bottleneck: {
      machine_id: bottleneckMachine.id,
      reason: `High utilization (${bottleneckMachine.utilization.avg.toFixed(1)}%) limiting system throughput`,
      utilization_pct: bottleneckMachine.utilization.avg,
      queue_length: bottleneckMachine.queue_pattern.avg_length,
      severity: bottleneckMachine.utilization.avg > 90 ? 'high' as const :
                bottleneckMachine.utilization.avg > 80 ? 'medium' as const : 'low' as const
    }
  };

  return factoryAnalysis;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Infer machine type from resource name
 */
function inferMachineType(name: string): string {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('cnc') || lowerName.includes('mill') || lowerName.includes('lathe')) {
    return 'CNC';
  } else if (lowerName.includes('assembly') || lowerName.includes('assemble')) {
    return 'Assembly';
  } else if (lowerName.includes('inspect') || lowerName.includes('quality') || lowerName.includes('qc')) {
    return 'QualityControl';
  } else if (lowerName.includes('storage') || lowerName.includes('warehouse') || lowerName.includes('buffer')) {
    return 'Storage';
  }

  return 'CNC'; // Default
}
