/**
 * Part Entity
 *
 * Represents a single work piece flowing through the factory.
 * Tracks timestamps for cycle time and wait time analysis.
 */

export class Part {
  id: string;
  arrivalTime: number;

  // Timestamps for each machine
  startTimes: Map<string, number> = new Map();
  endTimes: Map<string, number> = new Map();

  // Queue wait times
  queueEntryTimes: Map<string, number> = new Map();
  queueExitTimes: Map<string, number> = new Map();

  // Completion flag
  completed: boolean = false;
  exitTime: number = 0;

  constructor(id: string, arrivalTime: number) {
    this.id = id;
    this.arrivalTime = arrivalTime;
  }

  /**
   * Record when part enters a queue
   */
  enterQueue(machineId: string, time: number): void {
    this.queueEntryTimes.set(machineId, time);
  }

  /**
   * Record when part exits a queue
   */
  exitQueue(machineId: string, time: number): void {
    this.queueExitTimes.set(machineId, time);
  }

  /**
   * Record when processing starts at a machine
   */
  startProcessing(machineId: string, time: number): void {
    this.startTimes.set(machineId, time);
  }

  /**
   * Record when processing ends at a machine
   */
  endProcessing(machineId: string, time: number): void {
    this.endTimes.set(machineId, time);
  }

  /**
   * Mark part as completed and exited system
   */
  complete(time: number): void {
    this.completed = true;
    this.exitTime = time;
  }

  /**
   * Calculate total time in system (cycle time)
   */
  getCycleTime(): number {
    if (!this.completed) return 0;
    return this.exitTime - this.arrivalTime;
  }

  /**
   * Calculate total processing time (value-added time)
   */
  getValueAddedTime(): number {
    let total = 0;
    this.startTimes.forEach((startTime, machineId) => {
      const endTime = this.endTimes.get(machineId);
      if (endTime !== undefined) {
        total += endTime - startTime;
      }
    });
    return total;
  }

  /**
   * Calculate total queue wait time
   */
  getQueueWaitTime(): number {
    let total = 0;
    this.queueEntryTimes.forEach((entryTime, machineId) => {
      const exitTime = this.queueExitTimes.get(machineId);
      if (exitTime !== undefined) {
        total += exitTime - entryTime;
      }
    });
    return total;
  }

  /**
   * Calculate total wait time (queue + blocking)
   */
  getTotalWaitTime(): number {
    return this.getCycleTime() - this.getValueAddedTime();
  }
}
