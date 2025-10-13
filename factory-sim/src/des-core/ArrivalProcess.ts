/**
 * ARRIVAL PROCESS GENERATOR
 *
 * Handles continuous arrival generation with:
 * - Stationary arrival rates (constant)
 * - Non-stationary arrival rates (time-varying)
 * - Exponential inter-arrival times
 * - Automatic next-arrival scheduling
 *
 * This solves the BUG: "Simulation stops early" by continuously
 * generating arrivals until endTime is reached.
 */

import { IndustrialDESKernel, DESEvent, Distribution } from './IndustrialDESKernel';

export interface ArrivalSchedule {
  /**
   * Time periods with different arrival rates
   * If empty, uses defaultRate for entire simulation
   */
  periods?: Array<{
    startTime: number;
    endTime: number;
    ratePerHour: number; // Arrivals per hour
  }>;

  /**
   * Default rate (used if no periods specified)
   */
  defaultRatePerHour?: number;
}

export interface ArrivalProcessConfig {
  /**
   * Unique ID for this arrival process
   */
  id: string;

  /**
   * Entity type to create
   */
  entityType: string;

  /**
   * First resource entities should go to
   */
  firstResource: string;

  /**
   * Service time distribution for entities
   */
  serviceTimeDistribution: Distribution;

  /**
   * Arrival rate schedule
   */
  schedule: ArrivalSchedule;

  /**
   * Optional: Maximum number of arrivals (for bounded generation)
   * If undefined, generates until endTime
   */
  maxArrivals?: number;
}

/**
 * Arrival Process Manager
 *
 * Attaches to a DES kernel and generates continuous arrivals
 */
export class ArrivalProcess {
  private kernel: IndustrialDESKernel;
  private config: ArrivalProcessConfig;
  private arrivalCount: number = 0;
  private endTime: number = Infinity;

  constructor(kernel: IndustrialDESKernel, config: ArrivalProcessConfig) {
    this.kernel = kernel;
    this.config = config;
  }

  /**
   * Start arrival process
   * Schedule the first arrival, which will trigger subsequent arrivals
   */
  start(endTime: number): void {
    this.endTime = endTime;
    this.arrivalCount = 0;

    // Schedule first arrival at time 0
    this.scheduleNextArrival(0);
  }

  /**
   * Get current arrival rate for given time
   */
  private getCurrentRate(time: number): number {
    // Check if we have time-varying rates
    if (this.config.schedule.periods && this.config.schedule.periods.length > 0) {
      // Find period containing this time
      for (const period of this.config.schedule.periods) {
        if (time >= period.startTime && time < period.endTime) {
          return period.ratePerHour;
        }
      }

      // Time is outside all periods, return 0 (no arrivals)
      return 0;
    }

    // Use default rate
    return this.config.schedule.defaultRatePerHour || 0;
  }

  /**
   * Schedule next arrival
   * This is the KEY FUNCTION that prevents "simulation stops early"
   */
  private scheduleNextArrival(currentTime: number): void {
    // Check if we've hit max arrivals limit
    if (this.config.maxArrivals !== undefined && this.arrivalCount >= this.config.maxArrivals) {
      console.log(`[ArrivalProcess:${this.config.id}] Reached max arrivals (${this.config.maxArrivals}), stopping generation`);
      return;
    }

    // Get current arrival rate
    const ratePerHour = this.getCurrentRate(currentTime);

    // If rate is 0, we're outside operating hours
    if (ratePerHour <= 0) {
      // Check if there are future periods with non-zero rates
      if (this.config.schedule.periods) {
        const nextPeriod = this.config.schedule.periods.find(p => p.startTime > currentTime);
        if (nextPeriod && nextPeriod.startTime < this.endTime) {
          // Schedule arrival at start of next period
          console.log(`[ArrivalProcess:${this.config.id}] Scheduling arrival at start of next period: ${nextPeriod.startTime}`);
          this.scheduleArrivalAt(nextPeriod.startTime);
          return;
        }
      }

      // No future arrivals
      console.log(`[ArrivalProcess:${this.config.id}] No more arrivals (rate=0, no future periods)`);
      return;
    }

    // Convert rate to per-minute
    const ratePerMinute = ratePerHour / 60;

    // Sample exponential inter-arrival time
    const interArrivalTime = -Math.log(1 - Math.random()) / ratePerMinute;

    // Calculate next arrival time
    const nextArrivalTime = currentTime + interArrivalTime;

    // Only schedule if within endTime
    if (nextArrivalTime < this.endTime) {
      this.scheduleArrivalAt(nextArrivalTime);
    } else {
      console.log(`[ArrivalProcess:${this.config.id}] Next arrival would be at ${nextArrivalTime.toFixed(2)} > endTime ${this.endTime}, stopping generation`);
    }
  }

  /**
   * Schedule arrival at specific time
   */
  private scheduleArrivalAt(time: number): void {
    this.arrivalCount++;
    const entityId = `${this.config.id}_entity_${this.arrivalCount}`;

    // Create arrival event with embedded callback for next arrival
    this.kernel.scheduleEvent(new DESEvent(
      time,
      'arrival',
      0,
      entityId,
      undefined,
      {
        entityType: this.config.entityType,
        firstResource: this.config.firstResource,
        serviceTimeDistribution: this.config.serviceTimeDistribution,
        // Callback: After this arrival is processed, schedule next one
        onProcessed: () => {
          this.scheduleNextArrival(time);
        }
      }
    ));
  }

  /**
   * Get number of arrivals generated so far
   */
  getArrivalCount(): number {
    return this.arrivalCount;
  }

  /**
   * Reset arrival process
   */
  reset(): void {
    this.arrivalCount = 0;
  }
}

/**
 * Modified kernel arrival handler to support arrival process callbacks
 *
 * IMPORTANT: The kernel needs to be modified to call event.data.onProcessed()
 * after processing an arrival event.
 *
 * Add this to handleArrival() in IndustrialDESKernel:
 *
 *   // At end of handleArrival():
 *   if (event.data?.onProcessed) {
 *     event.data.onProcessed();
 *   }
 */
