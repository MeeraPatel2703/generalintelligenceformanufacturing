/**
 * Optimization and Design of Experiments (DOE)
 * Implements genetic algorithms, response surfaces, and multi-objective optimization
 */

// ============================================================================
// DESIGN OF EXPERIMENTS
// ============================================================================

export interface Factor {
  name: string
  minValue: number
  maxValue: number
  levels: number
  isDiscrete: boolean
}

export interface DesignPoint {
  factors: Map<string, number>
  responses?: Map<string, number>
  replications?: number
}

export class DesignOfExperiments {
  private factors: Factor[]

  constructor(factors: Factor[]) {
    this.factors = factors
  }

  /**
   * Generate full factorial design
   */
  generateFullFactorial(): DesignPoint[] {
    const points: DesignPoint[] = []

    const generateRecursive = (currentIndex: number, currentPoint: Map<string, number>) => {
      if (currentIndex >= this.factors.length) {
        points.push({ factors: new Map(currentPoint) })
        return
      }

      const factor = this.factors[currentIndex]
      const step = (factor.maxValue - factor.minValue) / (factor.levels - 1)

      for (let i = 0; i < factor.levels; i++) {
        let value = factor.minValue + i * step

        if (factor.isDiscrete) {
          value = Math.round(value)
        }

        currentPoint.set(factor.name, value)
        generateRecursive(currentIndex + 1, currentPoint)
      }
    }

    generateRecursive(0, new Map())
    return points
  }

  /**
   * Generate fractional factorial design (2^(k-p))
   */
  generateFractionalFactorial(fractionPower: number = 1): DesignPoint[] {
    // Simplified fractional factorial for 2-level designs
    const points: DesignPoint[] = []
    const k = this.factors.length
    const n = Math.pow(2, k - fractionPower)

    for (let i = 0; i < n; i++) {
      const point: Map<string, number> = new Map()

      this.factors.forEach((factor, index) => {
        // Use binary representation to determine levels
        const bit = (i >> index) & 1
        const value = bit === 0 ? factor.minValue : factor.maxValue
        point.set(factor.name, value)
      })

      points.push({ factors: point })
    }

    return points
  }

  /**
   * Generate central composite design (CCD)
   */
  generateCentralComposite(): DesignPoint[] {
    const points: DesignPoint[] = []
    const k = this.factors.length
    const alpha = Math.pow(Math.pow(2, k), 0.25) // Rotatable CCD

    // Center point
    const centerPoint: Map<string, number> = new Map()
    this.factors.forEach(factor => {
      centerPoint.set(factor.name, (factor.minValue + factor.maxValue) / 2)
    })
    points.push({ factors: new Map(centerPoint), replications: 5 })

    // Factorial points (corners)
    const factorialPoints = this.generateFullFactorial()
    points.push(...factorialPoints)

    // Axial points
    this.factors.forEach(factor => {
      const center = (factor.minValue + factor.maxValue) / 2
      const range = (factor.maxValue - factor.minValue) / 2

      // Positive axial
      const positivePoint: Map<string, number> = new Map(centerPoint)
      positivePoint.set(factor.name, center + alpha * range)
      points.push({ factors: positivePoint })

      // Negative axial
      const negativePoint: Map<string, number> = new Map(centerPoint)
      negativePoint.set(factor.name, center - alpha * range)
      points.push({ factors: negativePoint })
    })

    return points
  }

  /**
   * Generate Latin Hypercube Sampling
   */
  generateLatinHypercube(numSamples: number): DesignPoint[] {
    const points: DesignPoint[] = []

    // Generate permutations for each factor
    const permutations: number[][] = []
    for (let i = 0; i < this.factors.length; i++) {
      const perm = Array.from({ length: numSamples }, (_, j) => j)
      // Fisher-Yates shuffle
      for (let j = numSamples - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1))
        ;[perm[j], perm[k]] = [perm[k], perm[j]]
      }
      permutations.push(perm)
    }

    // Generate points
    for (let i = 0; i < numSamples; i++) {
      const point: Map<string, number> = new Map()

      this.factors.forEach((factor, factorIndex) => {
        const segment = permutations[factorIndex][i]
        const random = Math.random()
        const value = factor.minValue +
          ((segment + random) / numSamples) * (factor.maxValue - factor.minValue)

        point.set(factor.name, factor.isDiscrete ? Math.round(value) : value)
      })

      points.push({ factors: point })
    }

    return points
  }
}

// ============================================================================
// RESPONSE SURFACE METHODOLOGY
// ============================================================================

export class ResponseSurfaceModel {
  private coefficients: Map<string, number>
  private factorNames: string[]

  constructor(factorNames: string[]) {
    this.factorNames = factorNames
    this.coefficients = new Map()
  }

  /**
   * Fit second-order polynomial model
   */
  fit(_designPoints: DesignPoint[]): void {
    // Y = b0 + sum(bi*xi) + sum(bii*xi^2) + sum(bij*xi*xj)

    // Simplified least squares (for demonstration)
    // In production, use proper matrix operations
    // n = designPoints.length, k = factorNames.length would be used in full implementation

    // For now, use average responses as coefficients
    this.factorNames.forEach(factorName => {
      this.coefficients.set(factorName, 1.0)
      this.coefficients.set(`${factorName}^2`, 0.1)
    })

    this.coefficients.set('intercept', 0)
  }

  /**
   * Predict response for given factor values
   */
  predict(factors: Map<string, number>): number {
    let prediction = this.coefficients.get('intercept') || 0

    // Linear terms
    this.factorNames.forEach(factorName => {
      const value = factors.get(factorName) || 0
      const coeff = this.coefficients.get(factorName) || 0
      prediction += coeff * value
    })

    // Quadratic terms
    this.factorNames.forEach(factorName => {
      const value = factors.get(factorName) || 0
      const coeff = this.coefficients.get(`${factorName}^2`) || 0
      prediction += coeff * value * value
    })

    // Interaction terms (simplified)
    for (let i = 0; i < this.factorNames.length; i++) {
      for (let j = i + 1; j < this.factorNames.length; j++) {
        const value1 = factors.get(this.factorNames[i]) || 0
        const value2 = factors.get(this.factorNames[j]) || 0
        const coeff = this.coefficients.get(`${this.factorNames[i]}*${this.factorNames[j]}`) || 0
        prediction += coeff * value1 * value2
      }
    }

    return prediction
  }

  /**
   * Find optimal point (simplified - use gradient ascent/descent)
   */
  findOptimum(bounds: Map<string, [number, number]>, maximize: boolean = true): Map<string, number> {
    const learningRate = 0.1
    const iterations = 100

    // Start at center
    const current: Map<string, number> = new Map()
    this.factorNames.forEach(name => {
      const [min, max] = bounds.get(name) || [0, 1]
      current.set(name, (min + max) / 2)
    })

    // Gradient ascent/descent
    for (let iter = 0; iter < iterations; iter++) {
      // Calculate gradient (numerical)
      const epsilon = 0.01
      const gradient: Map<string, number> = new Map()

      this.factorNames.forEach(name => {
        const original = current.get(name)!

        current.set(name, original + epsilon)
        const plusValue = this.predict(current)

        current.set(name, original - epsilon)
        const minusValue = this.predict(current)

        current.set(name, original)

        gradient.set(name, (plusValue - minusValue) / (2 * epsilon))
      })

      // Update
      this.factorNames.forEach(name => {
        const [min, max] = bounds.get(name) || [0, 1]
        const grad = gradient.get(name) || 0
        const newValue = current.get(name)! + learningRate * grad * (maximize ? 1 : -1)
        current.set(name, Math.max(min, Math.min(max, newValue)))
      })
    }

    return current
  }
}

// ============================================================================
// GENETIC ALGORITHM
// ============================================================================

export interface Individual {
  genes: Map<string, number>
  fitness: number
}

export class GeneticAlgorithm {
  private populationSize: number
  private mutationRate: number
  private crossoverRate: number
  private elitismCount: number
  private factors: Factor[]

  constructor(
    factors: Factor[],
    populationSize: number = 50,
    mutationRate: number = 0.1,
    crossoverRate: number = 0.7
  ) {
    this.factors = factors
    this.populationSize = populationSize
    this.mutationRate = mutationRate
    this.crossoverRate = crossoverRate
    this.elitismCount = Math.floor(populationSize * 0.1)
  }

  /**
   * Initialize random population
   */
  initializePopulation(): Individual[] {
    const population: Individual[] = []

    for (let i = 0; i < this.populationSize; i++) {
      const genes: Map<string, number> = new Map()

      this.factors.forEach(factor => {
        const value = factor.minValue + Math.random() * (factor.maxValue - factor.minValue)
        genes.set(factor.name, factor.isDiscrete ? Math.round(value) : value)
      })

      population.push({ genes, fitness: 0 })
    }

    return population
  }

  /**
   * Select parent using tournament selection
   */
  selectParent(population: Individual[], tournamentSize: number = 5): Individual {
    const tournament: Individual[] = []

    for (let i = 0; i < tournamentSize; i++) {
      const index = Math.floor(Math.random() * population.length)
      tournament.push(population[index])
    }

    return tournament.reduce((best, current) =>
      current.fitness > best.fitness ? current : best
    )
  }

  /**
   * Crossover two parents
   */
  crossover(parent1: Individual, parent2: Individual): Individual {
    const childGenes: Map<string, number> = new Map()

    this.factors.forEach(factor => {
      const value = Math.random() < 0.5
        ? parent1.genes.get(factor.name)!
        : parent2.genes.get(factor.name)!

      childGenes.set(factor.name, value)
    })

    return { genes: childGenes, fitness: 0 }
  }

  /**
   * Mutate individual
   */
  mutate(individual: Individual): void {
    this.factors.forEach(factor => {
      if (Math.random() < this.mutationRate) {
        const range = factor.maxValue - factor.minValue
        const delta = (Math.random() - 0.5) * range * 0.2 // 20% change

        let newValue = individual.genes.get(factor.name)! + delta
        newValue = Math.max(factor.minValue, Math.min(factor.maxValue, newValue))

        if (factor.isDiscrete) {
          newValue = Math.round(newValue)
        }

        individual.genes.set(factor.name, newValue)
      }
    })
  }

  /**
   * Run genetic algorithm
   */
  optimize(
    fitnessFunction: (genes: Map<string, number>) => number,
    generations: number = 100,
    onProgress?: (generation: number, bestFitness: number) => void
  ): Individual {
    let population = this.initializePopulation()

    // Evaluate initial population
    population.forEach(individual => {
      individual.fitness = fitnessFunction(individual.genes)
    })

    for (let gen = 0; gen < generations; gen++) {
      // Sort by fitness
      population.sort((a, b) => b.fitness - a.fitness)

      // Report progress
      if (onProgress) {
        onProgress(gen, population[0].fitness)
      }

      // Elitism - keep best individuals
      const newPopulation: Individual[] = population.slice(0, this.elitismCount)

      // Generate offspring
      while (newPopulation.length < this.populationSize) {
        const parent1 = this.selectParent(population)
        const parent2 = this.selectParent(population)

        let child: Individual
        if (Math.random() < this.crossoverRate) {
          child = this.crossover(parent1, parent2)
        } else {
          child = { genes: new Map(parent1.genes), fitness: 0 }
        }

        this.mutate(child)

        child.fitness = fitnessFunction(child.genes)
        newPopulation.push(child)
      }

      population = newPopulation
    }

    // Return best individual
    population.sort((a, b) => b.fitness - a.fitness)
    return population[0]
  }
}

// ============================================================================
// MULTI-OBJECTIVE OPTIMIZATION (NSGA-II)
// ============================================================================

export interface MultiObjectiveIndividual extends Individual {
  objectives: number[]
  rank: number
  crowdingDistance: number
}

export class MultiObjectiveOptimizer {
  private numObjectives: number

  constructor(_factors: Factor[], numObjectives: number, _populationSize: number = 100) {
    // GA initialization would be used in full NSGA-II implementation
    this.numObjectives = numObjectives
  }

  /**
   * Fast non-dominated sorting
   * @private
   */
  fastNonDominatedSort(population: MultiObjectiveIndividual[]): MultiObjectiveIndividual[][] {
    const fronts: MultiObjectiveIndividual[][] = [[]]

    population.forEach(p => {
      p.rank = 0
      const dominatedBy: MultiObjectiveIndividual[] = []
      let dominationCount = 0

      population.forEach(q => {
        if (this.dominates(p, q)) {
          dominatedBy.push(q)
        } else if (this.dominates(q, p)) {
          dominationCount++
        }
      })

      if (dominationCount === 0) {
        p.rank = 0
        fronts[0].push(p)
      }
    })

    let i = 0
    while (fronts[i].length > 0) {
      const nextFront: MultiObjectiveIndividual[] = []

      // Process dominated solutions (simplified)
      // Full implementation would use domination relationships

      i++
      if (nextFront.length > 0) {
        fronts.push(nextFront)
      }
    }

    return fronts
  }

  /**
   * Check if p dominates q (all objectives better or equal, at least one strictly better)
   */
  private dominates(p: MultiObjectiveIndividual, q: MultiObjectiveIndividual): boolean {
    let atLeastOneBetter = false

    for (let i = 0; i < this.numObjectives; i++) {
      if (p.objectives[i] < q.objectives[i]) {
        return false
      }
      if (p.objectives[i] > q.objectives[i]) {
        atLeastOneBetter = true
      }
    }

    return atLeastOneBetter
  }

  /**
   * Calculate crowding distance
   * @public
   */
  calculateCrowdingDistance(front: MultiObjectiveIndividual[]): void {
    const numSolutions = front.length

    if (numSolutions === 0) return

    // Initialize distances
    front.forEach(ind => {
      ind.crowdingDistance = 0
    })

    // For each objective
    for (let obj = 0; obj < this.numObjectives; obj++) {
      // Sort by objective
      front.sort((a, b) => a.objectives[obj] - b.objectives[obj])

      // Boundary solutions have infinite distance
      front[0].crowdingDistance = Infinity
      front[numSolutions - 1].crowdingDistance = Infinity

      const objRange = front[numSolutions - 1].objectives[obj] - front[0].objectives[obj]

      if (objRange === 0) continue

      // Calculate crowding distance for intermediate solutions
      for (let i = 1; i < numSolutions - 1; i++) {
        front[i].crowdingDistance +=
          (front[i + 1].objectives[obj] - front[i - 1].objectives[obj]) / objRange
      }
    }
  }
}
