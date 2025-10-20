/**
 * Advanced Statistical Analysis
 * Implements ANOVA, hypothesis testing, correlation, distribution fitting
 */

// ============================================================================
// HYPOTHESIS TESTING
// ============================================================================

export class HypothesisTesting {
  /**
   * T-test for comparing two means
   */
  static tTest(sample1: number[], sample2: number[], twoTailed: boolean = true): {
    tStatistic: number
    pValue: number
    degreesOfFreedom: number
    reject: boolean
    confidenceLevel: number
  } {
    const n1 = sample1.length
    const n2 = sample2.length

    const mean1 = sample1.reduce((a, b) => a + b, 0) / n1
    const mean2 = sample2.reduce((a, b) => a + b, 0) / n2

    const var1 = sample1.reduce((sum, x) => sum + (x - mean1) ** 2, 0) / (n1 - 1)
    const var2 = sample2.reduce((sum, x) => sum + (x - mean2) ** 2, 0) / (n2 - 1)

    // Pooled standard deviation
    const pooledVariance = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2)
    const standardError = Math.sqrt(pooledVariance * (1 / n1 + 1 / n2))

    const tStatistic = (mean1 - mean2) / standardError
    const degreesOfFreedom = n1 + n2 - 2

    // Approximate p-value (simplified)
    const pValue = this.tDistributionCDF(Math.abs(tStatistic), degreesOfFreedom)

    return {
      tStatistic,
      pValue: twoTailed ? pValue * 2 : pValue,
      degreesOfFreedom,
      reject: (twoTailed ? pValue * 2 : pValue) < 0.05,
      confidenceLevel: 0.95
    }
  }

  /**
   * Chi-square test for independence
   */
  static chiSquareTest(observed: number[][], expected?: number[][]): {
    chiSquare: number
    pValue: number
    degreesOfFreedom: number
    reject: boolean
  } {
    const rows = observed.length
    const cols = observed[0].length

    // Calculate expected frequencies if not provided
    if (!expected) {
      expected = []
      const rowTotals = observed.map(row => row.reduce((a, b) => a + b, 0))
      const colTotals = observed[0].map((_, col) => observed.reduce((sum, row) => sum + row[col], 0))
      const grandTotal = rowTotals.reduce((a, b) => a + b, 0)

      for (let i = 0; i < rows; i++) {
        expected[i] = []
        for (let j = 0; j < cols; j++) {
          expected[i][j] = (rowTotals[i] * colTotals[j]) / grandTotal
        }
      }
    }

    // Calculate chi-square statistic
    let chiSquare = 0
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const diff = observed[i][j] - expected[i][j]
        chiSquare += (diff * diff) / expected[i][j]
      }
    }

    const degreesOfFreedom = (rows - 1) * (cols - 1)
    const pValue = this.chiSquareCDF(chiSquare, degreesOfFreedom)

    return {
      chiSquare,
      pValue,
      degreesOfFreedom,
      reject: pValue < 0.05
    }
  }

  /**
   * Approximate t-distribution CDF
   */
  private static tDistributionCDF(t: number, df: number): number {
    // Approximation using normal distribution for large df
    if (df > 30) {
      return 1 - this.normalCDF(t)
    }

    // Simplified approximation for small df
    const x = df / (df + t * t)
    return 1 - 0.5 * this.betaCDF(x, df / 2, 0.5)
  }

  /**
   * Normal distribution CDF
   */
  private static normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z))
    const d = 0.3989423 * Math.exp(-z * z / 2)
    const probability =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))

    return z > 0 ? 1 - probability : probability
  }

  /**
   * Chi-square CDF approximation
   */
  private static chiSquareCDF(x: number, df: number): number {
    // Simplified approximation
    if (df > 30) {
      const z = Math.sqrt(2 * x) - Math.sqrt(2 * df - 1)
      return 1 - this.normalCDF(z)
    }

    return 1 - this.gammaCDF(x / 2, df / 2)
  }

  /**
   * Gamma CDF approximation
   */
  private static gammaCDF(x: number, _shape: number): number {
    // Simplified approximation (shape parameter would be used in full implementation)
    return 1 - Math.exp(-x)
  }

  /**
   * Beta CDF approximation
   */
  private static betaCDF(x: number, a: number, _b: number): number {
    // Simplified approximation (b parameter would be used in full implementation)
    return Math.pow(x, a)
  }
}

// ============================================================================
// ANOVA (Analysis of Variance)
// ============================================================================

export class ANOVA {
  /**
   * One-way ANOVA
   */
  static oneWay(groups: number[][]): {
    fStatistic: number
    pValue: number
    betweenGroupsDF: number
    withinGroupsDF: number
    reject: boolean
    ssBetween: number
    ssWithin: number
    mssBetween: number
    mssWithin: number
  } {
    const k = groups.length // number of groups
    const n = groups.reduce((sum, group) => sum + group.length, 0) // total observations

    // Calculate group means
    const groupMeans = groups.map(group => group.reduce((a, b) => a + b, 0) / group.length)

    // Calculate grand mean
    const grandMean = groups.flat().reduce((a, b) => a + b, 0) / n

    // Sum of squares between groups (SSB)
    let ssBetween = 0
    groups.forEach((group, i) => {
      ssBetween += group.length * Math.pow(groupMeans[i] - grandMean, 2)
    })

    // Sum of squares within groups (SSW)
    let ssWithin = 0
    groups.forEach((group, i) => {
      group.forEach(value => {
        ssWithin += Math.pow(value - groupMeans[i], 2)
      })
    })

    // Degrees of freedom
    const betweenGroupsDF = k - 1
    const withinGroupsDF = n - k

    // Mean squares
    const mssBetween = ssBetween / betweenGroupsDF
    const mssWithin = ssWithin / withinGroupsDF

    // F-statistic
    const fStatistic = mssBetween / mssWithin

    // P-value (approximation)
    const pValue = this.fDistributionCDF(fStatistic, betweenGroupsDF, withinGroupsDF)

    return {
      fStatistic,
      pValue,
      betweenGroupsDF,
      withinGroupsDF,
      reject: pValue < 0.05,
      ssBetween,
      ssWithin,
      mssBetween,
      mssWithin
    }
  }

  /**
   * Two-way ANOVA (simplified)
   */
  static twoWay(_data: number[][][]): any {
    // Simplified version - full implementation would be more complex
    return {
      message: 'Two-way ANOVA requires more complex implementation'
    }
  }

  /**
   * F-distribution CDF approximation
   */
  private static fDistributionCDF(f: number, df1: number, df2: number): number {
    // Simplified approximation
    const x = (df2 * f) / (df2 * f + df1)
    return 1 - Math.pow(x, df2 / 2)
  }
}

// ============================================================================
// CORRELATION ANALYSIS
// ============================================================================

export class CorrelationAnalysis {
  /**
   * Pearson correlation coefficient
   */
  static pearson(x: number[], y: number[]): {
    correlation: number
    pValue: number
    significant: boolean
  } {
    const n = Math.min(x.length, y.length)

    const meanX = x.reduce((a, b) => a + b, 0) / n
    const meanY = y.reduce((a, b) => a + b, 0) / n

    let numerator = 0
    let sumXSquared = 0
    let sumYSquared = 0

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX
      const dy = y[i] - meanY

      numerator += dx * dy
      sumXSquared += dx * dx
      sumYSquared += dy * dy
    }

    const correlation = numerator / Math.sqrt(sumXSquared * sumYSquared)

    // T-test for significance
    const tStatistic = (correlation * Math.sqrt(n - 2)) / Math.sqrt(1 - correlation * correlation)
    const pValue = 2 * (1 - HypothesisTesting['normalCDF'](Math.abs(tStatistic)))

    return {
      correlation,
      pValue,
      significant: pValue < 0.05
    }
  }

  /**
   * Spearman rank correlation
   */
  static spearman(x: number[], y: number[]): {
    correlation: number
    pValue: number
    significant: boolean
  } {
    // Convert to ranks
    const ranksX = this.getRanks(x)
    const ranksY = this.getRanks(y)

    // Use Pearson on ranks
    return this.pearson(ranksX, ranksY)
  }

  /**
   * Calculate ranks
   */
  private static getRanks(data: number[]): number[] {
    const sorted = data.map((value, index) => ({ value, index }))
      .sort((a, b) => a.value - b.value)

    const ranks = new Array(data.length)

    sorted.forEach((item, rank) => {
      ranks[item.index] = rank + 1
    })

    return ranks
  }

  /**
   * Correlation matrix
   */
  static correlationMatrix(data: number[][]): number[][] {
    const numVars = data.length
    const matrix: number[][] = []

    for (let i = 0; i < numVars; i++) {
      matrix[i] = []
      for (let j = 0; j < numVars; j++) {
        if (i === j) {
          matrix[i][j] = 1
        } else {
          const result = this.pearson(data[i], data[j])
          matrix[i][j] = result.correlation
        }
      }
    }

    return matrix
  }
}

// ============================================================================
// DISTRIBUTION FITTING
// ============================================================================

export class DistributionFitting {
  /**
   * Fit normal distribution
   */
  static fitNormal(data: number[]): {
    mean: number
    stdDev: number
    goodnessOfFit: number
  } {
    const n = data.length
    const mean = data.reduce((a, b) => a + b, 0) / n
    const variance = data.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1)
    const stdDev = Math.sqrt(variance)

    // Kolmogorov-Smirnov test
    const goodnessOfFit = this.kolmogorovSmirnovTest(data, (x) => {
      return this.normalCDF(x, mean, stdDev)
    })

    return {
      mean,
      stdDev,
      goodnessOfFit
    }
  }

  /**
   * Fit exponential distribution
   */
  static fitExponential(data: number[]): {
    lambda: number
    mean: number
    goodnessOfFit: number
  } {
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    const lambda = 1 / mean

    const goodnessOfFit = this.kolmogorovSmirnovTest(data, (x) => {
      return 1 - Math.exp(-lambda * x)
    })

    return {
      lambda,
      mean,
      goodnessOfFit
    }
  }

  /**
   * Fit Weibull distribution (simplified MLE)
   */
  static fitWeibull(data: number[]): {
    shape: number
    scale: number
    goodnessOfFit: number
  } {
    // Simplified method - use method of moments
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    const variance = data.reduce((sum, x) => sum + (x - mean) ** 2, 0) / data.length

    // Rough approximation
    const shapeParam = Math.pow(mean / Math.sqrt(variance), 1.086)
    const scaleParam = mean / this.gammaFunction(1 + 1 / shapeParam)

    const goodnessOfFit = this.kolmogorovSmirnovTest(data, (x) => {
      return 1 - Math.exp(-Math.pow(x / scaleParam, shapeParam))
    })

    return {
      shape: shapeParam,
      scale: scaleParam,
      goodnessOfFit
    }
  }

  /**
   * Kolmogorov-Smirnov test
   */
  private static kolmogorovSmirnovTest(
    data: number[],
    cdf: (x: number) => number
  ): number {
    const sorted = [...data].sort((a, b) => a - b)
    const n = sorted.length

    let maxDifference = 0

    for (let i = 0; i < n; i++) {
      const empiricalCDF = (i + 1) / n
      const theoreticalCDF = cdf(sorted[i])
      const difference = Math.abs(empiricalCDF - theoreticalCDF)

      if (difference > maxDifference) {
        maxDifference = difference
      }
    }

    return maxDifference
  }

  /**
   * Normal CDF
   */
  private static normalCDF(x: number, mean: number, stdDev: number): number {
    const z = (x - mean) / stdDev
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)))
  }

  /**
   * Error function (approximation)
   */
  private static erf(x: number): number {
    // Abramowitz and Stegun approximation
    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const t = 1 / (1 + p * x)
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  /**
   * Gamma function (approximation)
   */
  private static gammaFunction(z: number): number {
    // Stirling's approximation
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * this.gammaFunction(1 - z))
    }

    z -= 1
    const g = 7
    const coefficients = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ]

    let x = coefficients[0]
    for (let i = 1; i < g + 2; i++) {
      x += coefficients[i] / (z + i)
    }

    const t = z + g + 0.5
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x
  }
}

// ============================================================================
// TIME SERIES ANALYSIS
// ============================================================================

export class TimeSeriesAnalysis {
  /**
   * Calculate autocorrelation
   */
  static autocorrelation(data: number[], lag: number): number {
    const n = data.length
    const mean = data.reduce((a, b) => a + b, 0) / n

    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n - lag; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean)
    }

    for (let i = 0; i < n; i++) {
      denominator += (data[i] - mean) ** 2
    }

    return numerator / denominator
  }

  /**
   * Moving average
   */
  static movingAverage(data: number[], windowSize: number): number[] {
    const result: number[] = []

    for (let i = 0; i <= data.length - windowSize; i++) {
      const window = data.slice(i, i + windowSize)
      const average = window.reduce((a, b) => a + b, 0) / windowSize
      result.push(average)
    }

    return result
  }

  /**
   * Exponential smoothing
   */
  static exponentialSmoothing(data: number[], alpha: number): number[] {
    const result: number[] = [data[0]]

    for (let i = 1; i < data.length; i++) {
      const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1]
      result.push(smoothed)
    }

    return result
  }
}
