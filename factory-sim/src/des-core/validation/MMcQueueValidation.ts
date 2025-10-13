/**
 * M/M/c QUEUE ANALYTICAL VALIDATION
 *
 * Validates IndustrialDESKernel against Erlang-C formula
 *
 * System: c servers, exponential arrivals, exponential service
 * Arrival Rate: λ
 * Service Rate: μ (per server)
 * Number of Servers: c
 * Traffic Intensity: a = λ/μ
 * Utilization per server: ρ = a/c
 *
 * Theoretical Formulas (Erlang-C):
 * - C(c,a) = [a^c/c!] / [Σ(a^k/k!) + a^c/(c!(1-ρ))]  [Prob wait > 0]
 * - Lq = C(c,a) * ρ/(1-ρ)                             [Avg in queue]
 * - Wq = Lq/λ                                         [Avg wait time]
 * - W  = Wq + 1/μ                                     [Avg time in system]
 * - L  = λ * W                                        [Avg in system]
 *
 * Success Criteria: % Error < 2% for all metrics
 */

import { IndustrialDESKernel, DESEvent, Distribution } from '../IndustrialDESKernel';

interface MMcParameters {
  arrivalRate: number;    // λ (customers per hour)
  serviceRate: number;    // μ (customers per hour per server)
  numServers: number;     // c (number of servers)
  simulationTime: number; // Total time to simulate
  warmupTime: number;     // Warmup period to discard
}

interface MMcTheoreticalResults {
  c: number;             // Number of servers
  a: number;             // Traffic intensity a = λ/μ
  rho: number;           // Utilization per server ρ = a/c
  erlangC: number;       // Probability of waiting
  Lq: number;            // Avg in queue
  Wq: number;            // Avg wait time
  W: number;             // Avg time in system
  L: number;             // Avg in system
}

interface MMcSimulationResults {
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

export class MMcQueueValidation {
  /**
   * Calculate factorial
   */
  private static factorial(n: number): number {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Calculate Erlang-C formula
   * C(c, a) = probability that arriving customer must wait
   */
  private static erlangC(c: number, a: number): number {
    const rho = a / c;

    if (rho >= 1) {
      return 1; // System unstable
    }

    // Numerator: a^c / c!
    const numerator = Math.pow(a, c) / this.factorial(c);

    // Denominator: Σ(a^k/k!) for k=0 to c-1, plus a^c/(c!(1-ρ))
    let summation = 0;
    for (let k = 0; k < c; k++) {
      summation += Math.pow(a, k) / this.factorial(k);
    }

    const denominator = summation + (Math.pow(a, c) / (this.factorial(c) * (1 - rho)));

    return numerator / denominator;
  }

  /**
   * Calculate theoretical M/M/c results
   */
  static calculateTheoretical(params: MMcParameters): MMcTheoreticalResults {
    const lambda = params.arrivalRate;
    const mu = params.serviceRate;
    const c = params.numServers;
    const a = lambda / mu;
    const rho = a / c;

    if (rho >= 1) {
      throw new Error(`System unstable: ρ = ${rho.toFixed(3)} >= 1 (arrival rate too high for ${c} servers)`);
    }

    const erlangC = this.erlangC(c, a);
    const Lq = erlangC * rho / (1 - rho);
    const Wq = Lq / lambda;
    const W = Wq + 1 / mu;
    const L = lambda * W;

    return {
      c,
      a,
      rho,
      erlangC,
      Lq,
      Wq,
      W,
      L
    };
  }

  /**
   * Run M/M/c simulation
   */
  static runSimulation(params: MMcParameters): MMcSimulationResults {
    const kernel = new IndustrialDESKernel(12345); // Fixed seed

    // Add c servers as a single resource with capacity c
    kernel.addResource('servers', `${params.numServers} Servers`, params.numServers);

    // Service time distribution (exponential with rate μ)
    const serviceTimeMean = 1 / params.serviceRate;
    const serviceTimeDistribution: Distribution = {
      type: 'exponential',
      mean: serviceTimeMean
    };

    // Schedule arrivals
    const arrivalMean = 1 / params.arrivalRate;
    let arrivalTime = 0;
    let entityCount = 0;

    while (arrivalTime < params.simulationTime) {
      const interarrival = -Math.log(1 - kernel.getRNGStreamManager().getStream('arrivals').random()) * arrivalMean;
      arrivalTime += interarrival;

      if (arrivalTime >= params.simulationTime) break;

      const entityId = `customer_${entityCount}`;
      entityCount++;

      kernel.scheduleEvent(new DESEvent(
        arrivalTime,
        'arrival',
        0,
        entityId,
        undefined,
        {
          entityType: 'customer',
          firstResource: 'servers',
          serviceTimeDistribution
        }
      ));

      if (entityCount > 100000) break;
    }

    // Run simulation
    kernel.run(params.simulationTime, params.warmupTime);

    // Extract statistics
    const stats = kernel.getStatistics();

    const L = stats.timePersistent.entities_in_system?.timeAverage || 0;
    const Lq = stats.timePersistent.entities_waiting?.timeAverage || 0;
    const W = stats.tally.entity_cycle_time?.mean || 0;
    const Wq = stats.tally.entity_wait_time?.mean || 0;
    const U = stats.resources.servers?.utilization
      ? parseFloat(stats.resources.servers.utilization.replace('%', '')) / 100
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
  static validate(params: MMcParameters, errorThreshold: number = 0.05): ValidationResult[] {
    console.log('='.repeat(80));
    console.log('M/M/c QUEUE VALIDATION (Erlang-C)');
    console.log('='.repeat(80));
    console.log('\nParameters:');
    console.log(`  Arrival Rate (λ):    ${params.arrivalRate} customers/hour`);
    console.log(`  Service Rate (μ):    ${params.serviceRate} customers/hour per server`);
    console.log(`  Number of Servers:   ${params.numServers}`);
    console.log(`  Simulation Time:     ${params.simulationTime} hours`);
    console.log(`  Warmup Time:         ${params.warmupTime} hours`);
    console.log('');

    // Calculate theoretical results
    const theory = this.calculateTheoretical(params);

    console.log('Theoretical Results (Erlang-C):');
    console.log(`  Traffic Intensity (a): ${theory.a.toFixed(4)}`);
    console.log(`  Utilization (ρ):       ${theory.rho.toFixed(4)}`);
    console.log(`  Erlang-C (P(wait>0)):  ${theory.erlangC.toFixed(4)}`);
    console.log(`  Avg in Queue (Lq):     ${theory.Lq.toFixed(4)}`);
    console.log(`  Avg in System (L):     ${theory.L.toFixed(4)}`);
    console.log(`  Avg Wait Time (Wq):    ${theory.Wq.toFixed(4)} hours`);
    console.log(`  Avg Time in Sys (W):   ${theory.W.toFixed(4)} hours`);
    console.log('');

    // Run simulation
    console.log('Running simulation...');
    const simStart = Date.now();
    const sim = this.runSimulation(params);
    const simDuration = Date.now() - simStart;
    console.log(`Simulation completed in ${simDuration}ms`);
    console.log('');

    console.log('Simulation Results:');
    console.log(`  Utilization (U):       ${sim.U.toFixed(4)}`);
    console.log(`  Avg in Queue (Lq):     ${sim.Lq.toFixed(4)}`);
    console.log(`  Avg in System (L):     ${sim.L.toFixed(4)}`);
    console.log(`  Avg Wait Time (Wq):    ${sim.Wq.toFixed(4)} hours`);
    console.log(`  Avg Time in Sys (W):   ${sim.W.toFixed(4)} hours`);
    console.log(`  Throughput:            ${sim.throughput.toFixed(4)} customers/hour`);
    console.log('');

    // Compare results
    const results: ValidationResult[] = [
      this.compareMetric('Utilization (ρ/U)', theory.rho, sim.U, errorThreshold),
      this.compareMetric('Avg in Queue (Lq)', theory.Lq, sim.Lq, errorThreshold),
      this.compareMetric('Avg in System (L)', theory.L, sim.L, errorThreshold),
      this.compareMetric('Avg Wait Time (Wq)', theory.Wq, sim.Wq, errorThreshold),
      this.compareMetric('Avg Time in System (W)', theory.W, sim.W, errorThreshold)
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
   * Run multiple scenarios
   */
  static runMultipleScenarios(): void {
    console.log('\n');
    console.log('█'.repeat(80));
    console.log('M/M/c QUEUE VALIDATION - MULTIPLE SCENARIOS (Erlang-C)');
    console.log('█'.repeat(80));
    console.log('\n');

    const scenarios: Array<{ name: string; params: MMcParameters }> = [
      {
        name: '2 Servers, Light Load (ρ = 0.4)',
        params: { arrivalRate: 40, serviceRate: 50, numServers: 2, simulationTime: 2000, warmupTime: 200 }
      },
      {
        name: '3 Servers, Moderate Load (ρ = 0.6)',
        params: { arrivalRate: 108, serviceRate: 60, numServers: 3, simulationTime: 2000, warmupTime: 200 }
      },
      {
        name: '5 Servers, Heavy Load (ρ = 0.85)',
        params: { arrivalRate: 255, serviceRate: 60, numServers: 5, simulationTime: 2000, warmupTime: 200 }
      },
      {
        name: '10 Servers, Moderate Load (ρ = 0.7)',
        params: { arrivalRate: 420, serviceRate: 60, numServers: 10, simulationTime: 2000, warmupTime: 200 }
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
      console.log('✓ ALL M/M/c SCENARIOS PASSED - Erlang-C validation successful!');
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
  MMcQueueValidation.runMultipleScenarios();
}
