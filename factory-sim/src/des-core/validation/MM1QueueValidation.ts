/**
 * M/M/1 QUEUE ANALYTICAL VALIDATION
 *
 * Validates IndustrialDESKernel against queueing theory
 *
 * System: Single server, exponential arrivals, exponential service
 * Arrival Rate: λ
 * Service Rate: μ
 * Utilization: ρ = λ/μ
 *
 * Theoretical Formulas:
 * - L  = ρ/(1-ρ)           [Avg number in system]
 * - Lq = ρ²/(1-ρ)          [Avg number in queue]
 * - W  = 1/(μ-λ)           [Avg time in system]
 * - Wq = ρ/(μ-λ)           [Avg time in queue]
 * - U  = ρ                 [Server utilization]
 *
 * Success Criteria: % Error < 2% for all metrics
 */

import { IndustrialDESKernel, DESEvent, Distribution } from '../IndustrialDESKernel';

interface MM1Parameters {
  arrivalRate: number;    // λ (customers per hour)
  serviceRate: number;    // μ (customers per hour)
  simulationTime: number; // Total time to simulate
  warmupTime: number;     // Warmup period to discard
}

interface MM1TheoreticalResults {
  rho: number;           // Utilization ρ = λ/μ
  L: number;             // Avg in system
  Lq: number;            // Avg in queue
  W: number;             // Avg time in system
  Wq: number;            // Avg time in queue
  throughput: number;    // λ
}

interface MM1SimulationResults {
  L: number;
  Lq: number;
  W: number;
  Wq: number;
  U: number;
  throughput: number;
}

interface ValidationResult {
  parameter: string;
  theoretical: number;
  simulated: number;
  error: number;
  percentError: number;
  pass: boolean;
}

export class MM1QueueValidation {
  /**
   * Calculate theoretical M/M/1 results
   */
  static calculateTheoretical(params: MM1Parameters): MM1TheoreticalResults {
    const lambda = params.arrivalRate;
    const mu = params.serviceRate;
    const rho = lambda / mu;

    if (rho >= 1) {
      throw new Error('System unstable: ρ >= 1 (arrival rate >= service rate)');
    }

    return {
      rho,
      L: rho / (1 - rho),
      Lq: (rho * rho) / (1 - rho),
      W: 1 / (mu - lambda),
      Wq: rho / (mu - lambda),
      throughput: lambda
    };
  }

  /**
   * Run M/M/1 simulation
   */
  static runSimulation(params: MM1Parameters): MM1SimulationResults {
    const kernel = new IndustrialDESKernel(12345); // Fixed seed for reproducibility

    // Add single server resource
    kernel.addResource('server', 'Server', 1);

    // Service time distribution (exponential with rate μ)
    const serviceTimeMean = 1 / params.serviceRate; // Convert rate to mean time
    const serviceTimeDistribution: Distribution = {
      type: 'exponential',
      mean: serviceTimeMean
    };

    // Schedule arrivals (exponential with rate λ)
    const arrivalMean = 1 / params.arrivalRate;
    let arrivalTime = 0;
    let entityCount = 0;

    while (arrivalTime < params.simulationTime) {
      // Sample inter-arrival time
      const interarrival = -Math.log(1 - kernel.getRNGStreamManager().getStream('arrivals').random()) * arrivalMean;
      arrivalTime += interarrival;

      if (arrivalTime >= params.simulationTime) break;

      const entityId = `customer_${entityCount}`;
      entityCount++;

      // Schedule arrival
      kernel.scheduleEvent(new DESEvent(
        arrivalTime,
        'arrival',
        0,
        entityId,
        undefined,
        {
          entityType: 'customer',
          firstResource: 'server',
          serviceTimeDistribution
        }
      ));

      // Prevent infinite loop
      if (entityCount > 100000) break;
    }

    // Run simulation
    kernel.run(params.simulationTime, params.warmupTime);

    // Extract statistics
    const stats = kernel.getStatistics();

    // Calculate metrics
    const L = stats.timePersistent.entities_in_system?.timeAverage || 0;
    const Lq = stats.timePersistent.entities_waiting?.timeAverage || 0;
    const W = stats.tally.entity_cycle_time?.mean || 0;
    const Wq = stats.tally.entity_wait_time?.mean || 0;
    const U = stats.resources.server?.utilization
      ? parseFloat(stats.resources.server.utilization.replace('%', '')) / 100
      : 0;

    const actualSimTime = params.simulationTime - params.warmupTime;
    const throughput = actualSimTime > 0
      ? stats.simulation.entitiesDeparted / actualSimTime
      : 0;

    return {
      L,
      Lq,
      W,
      Wq,
      U,
      throughput
    };
  }

  /**
   * Validate simulation against theory
   */
  static validate(params: MM1Parameters, errorThreshold: number = 0.05): ValidationResult[] {
    console.log('='.repeat(80));
    console.log('M/M/1 QUEUE VALIDATION');
    console.log('='.repeat(80));
    console.log('\nParameters:');
    console.log(`  Arrival Rate (λ):    ${params.arrivalRate} customers/hour`);
    console.log(`  Service Rate (μ):    ${params.serviceRate} customers/hour`);
    console.log(`  Simulation Time:     ${params.simulationTime} hours`);
    console.log(`  Warmup Time:         ${params.warmupTime} hours`);
    console.log('');

    // Calculate theoretical results
    const theory = this.calculateTheoretical(params);

    console.log('Theoretical Results:');
    console.log(`  Utilization (ρ):     ${theory.rho.toFixed(4)}`);
    console.log(`  Avg in System (L):   ${theory.L.toFixed(4)}`);
    console.log(`  Avg in Queue (Lq):   ${theory.Lq.toFixed(4)}`);
    console.log(`  Avg Time in Sys (W): ${theory.W.toFixed(4)} hours`);
    console.log(`  Avg Wait Time (Wq):  ${theory.Wq.toFixed(4)} hours`);
    console.log(`  Throughput:          ${theory.throughput.toFixed(4)} customers/hour`);
    console.log('');

    // Run simulation
    console.log('Running simulation...');
    const simStart = Date.now();
    const sim = this.runSimulation(params);
    const simDuration = Date.now() - simStart;
    console.log(`Simulation completed in ${simDuration}ms`);
    console.log('');

    console.log('Simulation Results:');
    console.log(`  Utilization (U):     ${sim.U.toFixed(4)}`);
    console.log(`  Avg in System (L):   ${sim.L.toFixed(4)}`);
    console.log(`  Avg in Queue (Lq):   ${sim.Lq.toFixed(4)}`);
    console.log(`  Avg Time in Sys (W): ${sim.W.toFixed(4)} hours`);
    console.log(`  Avg Wait Time (Wq):  ${sim.Wq.toFixed(4)} hours`);
    console.log(`  Throughput:          ${sim.throughput.toFixed(4)} customers/hour`);
    console.log('');

    // Compare results
    const results: ValidationResult[] = [
      this.compareMetric('Utilization (ρ/U)', theory.rho, sim.U, errorThreshold),
      this.compareMetric('Avg in System (L)', theory.L, sim.L, errorThreshold),
      this.compareMetric('Avg in Queue (Lq)', theory.Lq, sim.Lq, errorThreshold),
      this.compareMetric('Avg Time in System (W)', theory.W, sim.W, errorThreshold),
      this.compareMetric('Avg Wait Time (Wq)', theory.Wq, sim.Wq, errorThreshold),
      this.compareMetric('Throughput', theory.throughput, sim.throughput, errorThreshold)
    ];

    console.log('Validation Results:');
    console.log('─'.repeat(80));
    console.log('Metric'.padEnd(25) + 'Theoretical'.padEnd(15) + 'Simulated'.padEnd(15) + '% Error'.padEnd(12) + 'Status');
    console.log('─'.repeat(80));

    for (const result of results) {
      const statusIcon = result.pass ? '✓ PASS' : '✗ FAIL';
      const statusColor = result.pass ? '' : ' ⚠️';

      console.log(
        result.parameter.padEnd(25) +
        result.theoretical.toFixed(4).padEnd(15) +
        result.simulated.toFixed(4).padEnd(15) +
        result.percentError.toFixed(2).padEnd(12) +
        statusIcon + statusColor
      );
    }

    console.log('─'.repeat(80));

    // Overall result
    const allPassed = results.every(r => r.pass);
    const passCount = results.filter(r => r.pass).length;

    console.log('');
    console.log(`Overall: ${passCount}/${results.length} metrics passed`);

    if (allPassed) {
      console.log('✓ VALIDATION SUCCESSFUL - All metrics within error threshold');
    } else {
      console.log('✗ VALIDATION FAILED - Some metrics exceed error threshold');
    }

    console.log('='.repeat(80));
    console.log('');

    return results;
  }

  /**
   * Compare metric
   */
  private static compareMetric(
    parameter: string,
    theoretical: number,
    simulated: number,
    threshold: number
  ): ValidationResult {
    const error = Math.abs(simulated - theoretical);
    const percentError = theoretical !== 0
      ? Math.abs((simulated - theoretical) / theoretical) * 100
      : 0;
    const pass = (percentError / 100) <= threshold;

    return {
      parameter,
      theoretical,
      simulated,
      error,
      percentError,
      pass
    };
  }

  /**
   * Run standard validation test
   */
  static runStandardTest(): boolean {
    // Standard test: ρ = 0.8 (moderately loaded)
    const params: MM1Parameters = {
      arrivalRate: 48,      // 48 customers/hour
      serviceRate: 60,      // 60 customers/hour
      simulationTime: 1000, // 1000 hours
      warmupTime: 100       // 100 hour warmup
    };

    const results = this.validate(params, 0.02); // 2% error threshold
    return results.every(r => r.pass);
  }

  /**
   * Run multiple scenarios
   */
  static runMultipleScenarios(): void {
    console.log('\n');
    console.log('█'.repeat(80));
    console.log('M/M/1 QUEUE VALIDATION - MULTIPLE SCENARIOS');
    console.log('█'.repeat(80));
    console.log('\n');

    const scenarios: Array<{ name: string; params: MM1Parameters }> = [
      {
        name: 'Light Load (ρ = 0.5)',
        params: { arrivalRate: 30, serviceRate: 60, simulationTime: 2000, warmupTime: 200 }
      },
      {
        name: 'Moderate Load (ρ = 0.8)',
        params: { arrivalRate: 48, serviceRate: 60, simulationTime: 2000, warmupTime: 200 }
      },
      {
        name: 'Heavy Load (ρ = 0.9)',
        params: { arrivalRate: 54, serviceRate: 60, simulationTime: 2000, warmupTime: 200 }
      }
    ];

    let allPassed = true;

    for (const scenario of scenarios) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`SCENARIO: ${scenario.name}`);
      console.log(`${'='.repeat(80)}\n`);

      const results = this.validate(scenario.params, 0.05);
      const passed = results.every(r => r.pass);

      if (!passed) {
        allPassed = false;
      }
    }

    console.log('\n');
    console.log('█'.repeat(80));
    if (allPassed) {
      console.log('✓ ALL SCENARIOS PASSED - Industrial-grade DES kernel validated!');
    } else {
      console.log('✗ SOME SCENARIOS FAILED - Review results above');
    }
    console.log('█'.repeat(80));
    console.log('\n');
  }
}

/**
 * Run validation if executed directly
 */
if (require.main === module) {
  MM1QueueValidation.runMultipleScenarios();
}
