/**
 * QUEUEING THEORY FORMULAS
 *
 * Industry-standard formulas for theoretical validation of DES results
 * Based on:
 * - Gross & Harris: "Fundamentals of Queueing Theory"
 * - Kleinrock: "Queueing Systems, Volume 1"
 * - Banks et al.: "Discrete-Event System Simulation"
 */

export interface MM1Results {
  lambda: number;        // Arrival rate
  mu: number;           // Service rate
  rho: number;          // Utilization (λ/μ)
  L: number;            // Average number in system
  Lq: number;           // Average number in queue
  W: number;            // Average time in system
  Wq: number;           // Average time in queue
  P0: number;           // Probability of 0 in system
  stable: boolean;      // Is system stable (ρ < 1)?
}

export interface MMcResults extends MM1Results {
  c: number;            // Number of servers
  a: number;            // Offered load (λ/μ)
  C: number;            // Erlang-C (probability of wait)
}

export interface MG1Results extends MM1Results {
  sigma: number;        // Service time std deviation
  CV: number;           // Coefficient of variation
  Ca2: number;          // Squared coefficient of variation
}

/**
 * M/M/1 Queue - Single Server, Exponential Arrivals and Service
 *
 * Assumptions:
 * - Poisson arrivals (rate λ)
 * - Exponential service (rate μ)
 * - Single server (c = 1)
 * - Infinite queue capacity
 * - FCFS discipline
 */
export class MM1Queue {
  static analyze(lambda: number, mu: number): MM1Results {
    if (lambda <= 0 || mu <= 0) {
      throw new Error('Arrival and service rates must be positive');
    }

    const rho = lambda / mu;  // Utilization
    const stable = rho < 1;

    if (!stable) {
      // Unstable system - return infinite values
      return {
        lambda,
        mu,
        rho,
        L: Infinity,
        Lq: Infinity,
        W: Infinity,
        Wq: Infinity,
        P0: 0,
        stable: false
      };
    }

    // Little's Law: L = λW
    const L = rho / (1 - rho);                    // Average in system
    const Lq = (rho * rho) / (1 - rho);          // Average in queue
    const W = 1 / (mu - lambda);                  // Time in system
    const Wq = rho / (mu - lambda);               // Time in queue
    const P0 = 1 - rho;                           // Idle probability

    return {
      lambda,
      mu,
      rho,
      L,
      Lq,
      W,
      Wq,
      P0,
      stable
    };
  }

  /**
   * Probability of n customers in system
   */
  static Pn(n: number, rho: number): number {
    if (rho >= 1) return 0;
    return Math.pow(rho, n) * (1 - rho);
  }

  /**
   * Probability of more than n customers in system
   */
  static PnOrMore(n: number, rho: number): number {
    if (rho >= 1) return 1;
    return Math.pow(rho, n);
  }
}

/**
 * M/M/c Queue - Multiple Servers, Exponential Arrivals and Service
 *
 * Assumptions:
 * - Poisson arrivals (rate λ)
 * - Exponential service (rate μ per server)
 * - c identical servers
 * - Infinite queue capacity
 * - FCFS discipline
 */
export class MMcQueue {
  static analyze(lambda: number, mu: number, c: number): MMcResults {
    if (lambda <= 0 || mu <= 0 || c < 1) {
      throw new Error('Invalid parameters');
    }

    const a = lambda / mu;        // Offered load
    const rho = a / c;             // Server utilization
    const stable = rho < 1;

    if (!stable) {
      return {
        lambda,
        mu,
        c,
        a,
        rho,
        L: Infinity,
        Lq: Infinity,
        W: Infinity,
        Wq: Infinity,
        P0: 0,
        C: 1,
        stable: false
      };
    }

    // Calculate P0 (probability of 0 in system)
    const P0 = this.calculateP0(a, c);

    // Erlang-C formula (probability of waiting)
    const C = this.erlangC(a, c);

    // Average number in queue
    const Lq = (C * rho) / (1 - rho);

    // Average time in queue (by Little's Law)
    const Wq = Lq / lambda;

    // Average time in system
    const W = Wq + (1 / mu);

    // Average number in system
    const L = lambda * W;

    return {
      lambda,
      mu,
      c,
      a,
      rho,
      L,
      Lq,
      W,
      Wq,
      P0,
      C,
      stable
    };
  }

  /**
   * Erlang-C Formula
   * Probability that an arriving customer must wait
   */
  static erlangC(a: number, c: number): number {
    const numerator = Math.pow(a, c) / this.factorial(c);
    const denominator1 = 1 / (1 - (a / c));

    let sum = 0;
    for (let n = 0; n < c; n++) {
      sum += Math.pow(a, n) / this.factorial(n);
    }

    const denominator2 = sum + numerator * denominator1;

    return (numerator * denominator1) / denominator2;
  }

  /**
   * Calculate P0 for M/M/c
   */
  private static calculateP0(a: number, c: number): number {
    let sum = 0;

    // Sum from n=0 to c-1
    for (let n = 0; n < c; n++) {
      sum += Math.pow(a, n) / this.factorial(n);
    }

    // Add the c-th term
    const lastTerm = (Math.pow(a, c) / this.factorial(c)) * (c / (c - a));
    sum += lastTerm;

    return 1 / sum;
  }

  /**
   * Helper: Factorial
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
   * Erlang-B Formula
   * Probability of blocking (for systems with no queue)
   */
  static erlangB(a: number, c: number): number {
    const numerator = Math.pow(a, c) / this.factorial(c);

    let sum = 0;
    for (let n = 0; n <= c; n++) {
      sum += Math.pow(a, n) / this.factorial(n);
    }

    return numerator / sum;
  }
}

/**
 * M/G/1 Queue - Single Server, General Service Distribution
 *
 * Uses Pollaczek-Khinchine formula
 *
 * Assumptions:
 * - Poisson arrivals (rate λ)
 * - General service distribution with mean 1/μ and variance σ²
 * - Single server
 * - Infinite queue capacity
 */
export class MG1Queue {
  static analyze(lambda: number, mu: number, sigma: number): MG1Results {
    if (lambda <= 0 || mu <= 0 || sigma < 0) {
      throw new Error('Invalid parameters');
    }

    const rho = lambda / mu;
    const stable = rho < 1;

    if (!stable) {
      return {
        lambda,
        mu,
        sigma,
        rho,
        CV: sigma * mu,
        Ca2: Math.pow(sigma * mu, 2),
        L: Infinity,
        Lq: Infinity,
        W: Infinity,
        Wq: Infinity,
        P0: 0,
        stable: false
      };
    }

    const serviceTime = 1 / mu;
    const CV = sigma / serviceTime;      // Coefficient of variation
    const Ca2 = CV * CV;                  // Squared CV

    // Pollaczek-Khinchine formula for Lq
    const Lq = (lambda * lambda * sigma * sigma + rho * rho) / (2 * (1 - rho));

    // By Little's Law
    const Wq = Lq / lambda;
    const W = Wq + serviceTime;
    const L = lambda * W;
    const P0 = 1 - rho;

    return {
      lambda,
      mu,
      sigma,
      rho,
      CV,
      Ca2,
      L,
      Lq,
      W,
      Wq,
      P0,
      stable
    };
  }

  /**
   * For common distributions
   */
  static forDistribution(
    lambda: number,
    mu: number,
    distribution: 'exponential' | 'constant' | 'uniform' | 'erlang-k',
    k?: number
  ): MG1Results {
    const serviceTime = 1 / mu;
    let sigma: number;

    switch (distribution) {
      case 'exponential':
        sigma = serviceTime;  // CV = 1
        break;

      case 'constant':
        sigma = 0;  // CV = 0
        break;

      case 'uniform':
        // For uniform(a,b), variance = (b-a)²/12
        // If mean = serviceTime, then a=0, b=2*serviceTime
        sigma = serviceTime / Math.sqrt(3);  // CV ≈ 0.577
        break;

      case 'erlang-k':
        if (!k || k < 1) throw new Error('k must be >= 1 for Erlang');
        sigma = serviceTime / Math.sqrt(k);  // CV = 1/√k
        break;

      default:
        throw new Error('Unknown distribution');
    }

    return this.analyze(lambda, mu, sigma);
  }
}

/**
 * G/G/1 Queue - General Arrivals and Service
 *
 * Uses Kingman's approximation (VUT equation)
 *
 * Note: This is an approximation, not exact
 */
export class GG1Queue {
  static approximate(
    lambda: number,
    mu: number,
    Ca: number,  // CV of arrival process
    Cs: number   // CV of service process
  ): MG1Results {
    const rho = lambda / mu;
    const stable = rho < 1;

    if (!stable) {
      return {
        lambda,
        mu,
        sigma: 0,
        rho,
        CV: Cs,
        Ca2: Cs * Cs,
        L: Infinity,
        Lq: Infinity,
        W: Infinity,
        Wq: Infinity,
        P0: 0,
        stable: false
      };
    }

    // Kingman's VUT approximation
    const Wq = ((Ca * Ca + Cs * Cs) / 2) * (rho / (1 - rho)) * (1 / mu);

    const Lq = lambda * Wq;
    const W = Wq + (1 / mu);
    const L = lambda * W;
    const P0 = 1 - rho;

    return {
      lambda,
      mu,
      sigma: Cs / mu,
      rho,
      CV: Cs,
      Ca2: Cs * Cs,
      L,
      Lq,
      W,
      Wq,
      P0,
      stable
    };
  }
}

/**
 * Jackson Network - Network of M/M/1 queues
 *
 * Assumptions:
 * - Poisson external arrivals
 * - Exponential service at each node
 * - Routing probabilities between nodes
 * - Open network (entities leave)
 */
export interface JacksonNode {
  id: string;
  mu: number;           // Service rate
  externalArrivalRate: number;  // External arrivals to this node
}

export interface JacksonNetworkResults {
  nodeResults: Map<string, MM1Results>;
  totalL: number;       // Total entities in network
  throughput: number;   // System throughput
  stable: boolean;
}

export class JacksonNetwork {
  static analyze(
    nodes: JacksonNode[],
    routingMatrix: number[][]  // P[i][j] = prob of i→j
  ): JacksonNetworkResults {
    const n = nodes.length;

    // Solve traffic equations: λ_j = γ_j + Σ λ_i * P_ij
    const lambda = new Array(n).fill(0);

    // Initialize with external arrivals
    for (let j = 0; j < n; j++) {
      lambda[j] = nodes[j].externalArrivalRate;
    }

    // Iterative solution (could use matrix inversion for exact)
    for (let iter = 0; iter < 100; iter++) {
      const newLambda = [...lambda];
      for (let j = 0; j < n; j++) {
        let sum = nodes[j].externalArrivalRate;
        for (let i = 0; i < n; i++) {
          sum += lambda[i] * routingMatrix[i][j];
        }
        newLambda[j] = sum;
      }
      lambda.splice(0, lambda.length, ...newLambda);
    }

    // Analyze each node as M/M/1
    const nodeResults = new Map<string, MM1Results>();
    let totalL = 0;
    let stable = true;

    for (let i = 0; i < n; i++) {
      const nodeAnalysis = MM1Queue.analyze(lambda[i], nodes[i].mu);
      nodeResults.set(nodes[i].id, nodeAnalysis);
      totalL += nodeAnalysis.L;
      stable = stable && nodeAnalysis.stable;
    }

    // Throughput is sum of external arrivals (for open network)
    const throughput = nodes.reduce((sum, node) => sum + node.externalArrivalRate, 0);

    return {
      nodeResults,
      totalL,
      throughput,
      stable
    };
  }
}

/**
 * Utility Functions
 */
export class QueuingUtils {
  /**
   * Little's Law verification: L = λW
   */
  static verifyLittlesLaw(L: number, lambda: number, W: number, tolerance: number = 0.01): boolean {
    const expected = lambda * W;
    const error = Math.abs(L - expected) / expected;
    return error < tolerance;
  }

  /**
   * Convert rate units
   */
  static convertRate(rate: number, from: 'per_hour' | 'per_minute' | 'per_second', to: 'per_hour' | 'per_minute' | 'per_second'): number {
    const conversions: Record<string, number> = {
      'per_hour': 1,
      'per_minute': 60,
      'per_second': 3600
    };

    return (rate * conversions[to]) / conversions[from];
  }

  /**
   * Check system stability
   */
  static isStable(lambda: number, mu: number, c: number = 1): boolean {
    return (lambda / mu) < c;
  }

  /**
   * Calculate confidence interval width percentage
   */
  static ciWidthPercentage(mean: number, ci: [number, number]): number {
    const width = ci[1] - ci[0];
    return (width / mean) * 100;
  }
}
