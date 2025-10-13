interface Simulation {
  run(endTime: number): { avgWaitTime: number; avgTimeInSystem: number; customersCompleted: number };
}

interface ReplicationResults {
  mean: number;
  stdDev: number;
  ci95Lower: number;
  ci95Upper: number;
  replications: number;
  allValues: number[];
}

export class SimulationRunner {
  runMultipleReplications(
    numReplications: number,
    simFactory: () => Simulation,
    endTime: number
  ): ReplicationResults {
    const waitTimes: number[] = [];

    for (let i = 0; i < numReplications; i++) {
      const sim = simFactory(); // Fresh simulation
      const results = sim.run(endTime);
      waitTimes.push(results.avgWaitTime);
    }

    // Calculate statistics across replications
    const mean = this.mean(waitTimes);
    const stdDev = this.stdDev(waitTimes);
    const ci95 = 1.96 * stdDev / Math.sqrt(numReplications);

    return {
      mean,
      stdDev,
      ci95Lower: mean - ci95,
      ci95Upper: mean + ci95,
      replications: numReplications,
      allValues: waitTimes
    };
  }

  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private stdDev(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = this.mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }
}
