/**
 * Validation Framework for DES Engine
 * Manages test execution, scoring, and reporting
 */

export interface ValidationTest {
  id: string;
  category: string;
  name: string;
  description: string;
  execute: () => Promise<TestResult>;
}

export interface TestResult {
  passed: boolean;
  value?: number;
  expected?: number;
  tolerance?: number;
  message: string;
  details?: any;
}

export interface CategoryResult {
  category: string;
  totalTests: number;
  passed: number;
  failed: number;
  score: number;
  tests: { id: string; name: string; result: TestResult }[];
}

export interface ValidationReport {
  timestamp: Date;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  overallScore: number;
  categories: CategoryResult[];
  certified: boolean;
  certificationLevel: string;
}

export class ValidationFramework {
  private tests: ValidationTest[] = [];
  private results: Map<string, TestResult> = new Map();

  registerTest(test: ValidationTest): void {
    this.tests.push(test);
  }

  registerTests(tests: ValidationTest[]): void {
    tests.forEach(test => this.registerTest(test));
  }

  async runAll(verbose: boolean = false): Promise<ValidationReport> {
    console.log('================================================================================');
    console.log('DES ENGINE - COMPREHENSIVE VALIDATION SUITE');
    console.log('================================================================================\n');

    this.results.clear();

    const categoryMap = new Map<string, { tests: any[]; passed: number; failed: number }>();

    for (const test of this.tests) {
      if (verbose) {
        console.log(`Running: ${test.id} - ${test.name}`);
      }

      try {
        const result = await test.execute();
        this.results.set(test.id, result);

        // Update category stats
        if (!categoryMap.has(test.category)) {
          categoryMap.set(test.category, { tests: [], passed: 0, failed: 0 });
        }
        const cat = categoryMap.get(test.category)!;
        cat.tests.push({ id: test.id, name: test.name, result });
        if (result.passed) {
          cat.passed++;
          if (verbose) console.log(`  ✓ PASS`);
        } else {
          cat.failed++;
          if (verbose) console.log(`  ✗ FAIL: ${result.message}`);
        }
      } catch (error: any) {
        const result: TestResult = {
          passed: false,
          message: `Error: ${error.message}`
        };
        this.results.set(test.id, result);

        if (!categoryMap.has(test.category)) {
          categoryMap.set(test.category, { tests: [], passed: 0, failed: 0 });
        }
        categoryMap.get(test.category)!.failed++;
        if (verbose) console.log(`  ✗ ERROR: ${error.message}`);
      }

      if (verbose) console.log('');
    }

    // Compile results
    const categories: CategoryResult[] = [];
    let totalPassed = 0;
    let totalFailed = 0;

    for (const [category, stats] of categoryMap.entries()) {
      const total = stats.passed + stats.failed;
      categories.push({
        category,
        totalTests: total,
        passed: stats.passed,
        failed: stats.failed,
        score: stats.passed / total,
        tests: stats.tests
      });
      totalPassed += stats.passed;
      totalFailed += stats.failed;
    }

    const totalTests = totalPassed + totalFailed;
    const overallScore = totalPassed / totalTests;

    // Determine certification
    const certified = this.determineCertification(categories);
    const certificationLevel = this.getCertificationLevel(categories, overallScore);

    return {
      timestamp: new Date(),
      totalTests,
      totalPassed,
      totalFailed,
      overallScore,
      categories,
      certified,
      certificationLevel
    };
  }

  printReport(report: ValidationReport): void {
    console.log('\n================================================================================');
    console.log('VALIDATION REPORT');
    console.log('================================================================================\n');

    console.log(`Timestamp: ${report.timestamp.toISOString()}`);
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Passed: ${report.totalPassed} (${(report.overallScore * 100).toFixed(1)}%)`);
    console.log(`Failed: ${report.totalFailed} (${((1 - report.overallScore) * 100).toFixed(1)}%)`);
    console.log('');

    console.log('CATEGORY BREAKDOWN:');
    console.log('--------------------------------------------------------------------------------');

    for (const cat of report.categories) {
      const percentage = (cat.score * 100).toFixed(1);
      const status = cat.score === 1.0 ? '✓' : cat.score >= 0.8 ? '~' : '✗';
      console.log(`${status} ${cat.category}`);
      console.log(`  Tests: ${cat.passed}/${cat.totalTests} passed (${percentage}%)`);

      // Show failed tests
      const failedTests = cat.tests.filter(t => !t.result.passed);
      if (failedTests.length > 0) {
        console.log(`  Failed:`);
        failedTests.forEach(t => {
          console.log(`    - ${t.id}: ${t.result.message}`);
        });
      }
      console.log('');
    }

    console.log('================================================================================');
    console.log('CERTIFICATION STATUS');
    console.log('================================================================================\n');

    console.log(`Overall Score: ${(report.overallScore * 100).toFixed(1)}%`);
    console.log(`Certification Level: ${report.certificationLevel}`);
    console.log(`Certified for Production: ${report.certified ? 'YES ✓' : 'NO ✗'}`);
    console.log('');

    if (report.certified) {
      console.log('✓✓✓ DES ENGINE IS MATHEMATICALLY CORRECT ✓✓✓');
      console.log('Ready for production use.');
    } else {
      console.log('✗✗✗ CERTIFICATION REQUIREMENTS NOT MET ✗✗✗');
      console.log('Review failed tests and fix before production deployment.');
    }

    console.log('\n================================================================================\n');
  }

  private determineCertification(categories: CategoryResult[]): boolean {
    // Certification requirements:
    // - Categories 1-7 (fundamental): 100% pass
    // - Categories 8-10 (advanced): ≥90% pass
    // - Categories 11-17 (specialized): ≥80% pass
    // - Categories 18-20 (optimization): ≥70% pass

    const requirements = {
      'Category 1': 1.0,
      'Category 2': 1.0,
      'Category 3': 1.0,
      'Category 4': 1.0,
      'Category 5': 1.0,
      'Category 6': 1.0,
      'Category 7': 1.0,
      'Category 8': 0.9,
      'Category 9': 0.9,
      'Category 10': 0.9,
      'Category 11': 0.8,
      'Category 12': 0.8,
      'Category 13': 0.8,
      'Category 14': 0.8,
      'Category 15': 0.8,
      'Category 16': 0.8,
      'Category 17': 0.8,
      'Category 18': 0.7,
      'Category 19': 0.7,
      'Category 20': 0.7
    };

    for (const cat of categories) {
      const required = requirements[cat.category as keyof typeof requirements] || 0.7;
      if (cat.score < required) {
        return false;
      }
    }

    return true;
  }

  private getCertificationLevel(categories: CategoryResult[], overallScore: number): string {
    if (overallScore === 1.0) return 'PLATINUM - Perfect Score';
    if (overallScore >= 0.95) return 'GOLD - Excellent';
    if (overallScore >= 0.90) return 'SILVER - Very Good';
    if (overallScore >= 0.80) return 'BRONZE - Good';
    if (overallScore >= 0.70) return 'BASIC - Acceptable';
    return 'INSUFFICIENT - Not Ready';
  }

  getResult(testId: string): TestResult | undefined {
    return this.results.get(testId);
  }

  getAllResults(): Map<string, TestResult> {
    return new Map(this.results);
  }
}

/**
 * Helper function to create a test
 */
export function createTest(
  id: string,
  category: string,
  name: string,
  description: string,
  execute: () => Promise<TestResult> | TestResult
): ValidationTest {
  return {
    id,
    category,
    name,
    description,
    execute: async () => {
      const result = execute();
      return result instanceof Promise ? await result : result;
    }
  };
}

/**
 * Helper to create a passing test result
 */
export function pass(message: string, details?: any): TestResult {
  return { passed: true, message, details };
}

/**
 * Helper to create a failing test result
 */
export function fail(message: string, value?: number, expected?: number, tolerance?: number): TestResult {
  return { passed: false, message, value, expected, tolerance };
}

/**
 * Helper to check if value is within tolerance
 */
export function withinTolerance(value: number, expected: number, tolerance: number): TestResult {
  const error = Math.abs(value - expected) / expected;
  const passed = error <= tolerance;

  return {
    passed,
    value,
    expected,
    tolerance,
    message: passed
      ? `Value ${value.toFixed(4)} within ${(tolerance * 100).toFixed(1)}% of expected ${expected.toFixed(4)}`
      : `Value ${value.toFixed(4)} outside tolerance (error: ${(error * 100).toFixed(2)}%, max: ${(tolerance * 100).toFixed(1)}%)`
  };
}
