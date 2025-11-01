/**
 * Machine Entity
 *
 * Represents a processing station in the factory.
 * Manages state, queue, and processes parts.
 */

import { Distribution } from './distributions';
import { Part } from './part';
import { MachineState, MachineConfig } from '../../src/types/simulation';

export class Machine {
  // Identity
  id: string;
  name: string;
  type: string;

  // Configuration
  processTimeDistribution: Distribution;
  setupTimeDistribution?: Distribution;
  capacity: number;  // Queue capacity
  mtbf?: number;     // Mean time between failures
  mttr?: number;     // Mean time to repair

  // Current state
  state: MachineState = 'idle';
  currentPart: Part | null = null;
  queue: Part[] = [];

  // Statistics (accumulated during simulation)
  totalBusyTime: number = 0;
  totalBlockedTime: number = 0;
  totalIdleTime: number = 0;
  totalDownTime: number = 0;
  partsProcessed: number = 0;

  // State tracking timestamps
  private lastStateChangeTime: number = 0;
  private stateHistory: { state: MachineState; time: number }[] = [];

  constructor(config: MachineConfig, processTimeDistribution: Distribution) {
    this.id = config.id;
    this.name = config.id;
    this.type = config.type;
    this.processTimeDistribution = processTimeDistribution;
    this.capacity = config.capacity;
    this.mtbf = config.mtbf;
    this.mttr = config.mttr;
  }

  /**
   * Check if machine can accept a new part
   */
  canAccept(): boolean {
    return this.state === 'idle' && this.queue.length < this.capacity;
  }

  /**
   * Check if machine can receive part to queue
   */
  canEnqueue(): boolean {
    return this.queue.length < this.capacity;
  }

  /**
   * Add part to queue
   */
  enqueue(part: Part, currentTime: number): void {
    if (this.queue.length >= this.capacity) {
      throw new Error(`Machine ${this.id} queue is full (capacity: ${this.capacity})`);
    }
    this.queue.push(part);
    part.enterQueue(this.id, currentTime);
  }

  /**
   * Remove part from queue
   */
  dequeue(currentTime: number): Part | null {
    const part = this.queue.shift();
    if (part) {
      part.exitQueue(this.id, currentTime);
    }
    return part || null;
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Start processing a part
   */
  startProcessing(part: Part, currentTime: number): void {
    if (this.state !== 'idle') {
      throw new Error(`Machine ${this.id} cannot start processing in state ${this.state}`);
    }

    this.currentPart = part;
    this.setState('busy', currentTime);
    part.startProcessing(this.id, currentTime);
  }

  /**
   * End processing current part
   */
  endProcessing(currentTime: number): Part {
    if (this.state !== 'busy' || !this.currentPart) {
      throw new Error(`Machine ${this.id} is not processing a part`);
    }

    const part = this.currentPart;
    part.endProcessing(this.id, currentTime);
    this.partsProcessed++;
    this.currentPart = null;

    return part;
  }

  /**
   * Set machine to blocked state
   */
  setBlocked(currentTime: number): void {
    this.setState('blocked', currentTime);
  }

  /**
   * Set machine to idle state
   */
  setIdle(currentTime: number): void {
    this.setState('idle', currentTime);
  }

  /**
   * Set machine to down state (failure)
   */
  setDown(currentTime: number): void {
    this.setState('down', currentTime);
  }

  /**
   * Change machine state and update statistics
   */
  private setState(newState: MachineState, currentTime: number): void {
    if (this.state !== newState) {
      // Update time in previous state
      const timeInState = currentTime - this.lastStateChangeTime;

      switch (this.state) {
        case 'idle':
          this.totalIdleTime += timeInState;
          break;
        case 'busy':
          this.totalBusyTime += timeInState;
          break;
        case 'blocked':
          this.totalBlockedTime += timeInState;
          break;
        case 'down':
          this.totalDownTime += timeInState;
          break;
      }

      // Record state change
      this.stateHistory.push({ state: this.state, time: currentTime });

      // Update state
      this.state = newState;
      this.lastStateChangeTime = currentTime;
    }
  }

  /**
   * Finalize statistics at end of simulation
   */
  finalize(currentTime: number): void {
    // Update time in current state
    const timeInState = currentTime - this.lastStateChangeTime;

    switch (this.state) {
      case 'idle':
        this.totalIdleTime += timeInState;
        break;
      case 'busy':
        this.totalBusyTime += timeInState;
        break;
      case 'blocked':
        this.totalBlockedTime += timeInState;
        break;
      case 'down':
        this.totalDownTime += timeInState;
        break;
    }
  }

  /**
   * Get utilization (busy time / total time)
   */
  getUtilization(): number {
    const totalTime = this.totalBusyTime + this.totalBlockedTime +
                      this.totalIdleTime + this.totalDownTime;
    return totalTime > 0 ? this.totalBusyTime / totalTime : 0;
  }

  /**
   * Get blocked time percentage
   */
  getBlockedPercent(): number {
    const totalTime = this.totalBusyTime + this.totalBlockedTime +
                      this.totalIdleTime + this.totalDownTime;
    return totalTime > 0 ? this.totalBlockedTime / totalTime : 0;
  }

  /**
   * Get idle time percentage
   */
  getIdlePercent(): number {
    const totalTime = this.totalBusyTime + this.totalBlockedTime +
                      this.totalIdleTime + this.totalDownTime;
    return totalTime > 0 ? this.totalIdleTime / totalTime : 0;
  }

  /**
   * Reset machine to initial state
   */
  reset(): void {
    this.state = 'idle';
    this.currentPart = null;
    this.queue = [];
    this.totalBusyTime = 0;
    this.totalBlockedTime = 0;
    this.totalIdleTime = 0;
    this.totalDownTime = 0;
    this.partsProcessed = 0;
    this.lastStateChangeTime = 0;
    this.stateHistory = [];
  }
}
