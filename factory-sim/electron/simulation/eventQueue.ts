/**
 * Priority Queue for Discrete Event Simulation
 *
 * Events are ordered by time (ascending).
 * Uses a min-heap for O(log n) insert/remove operations.
 */

import { SimulationEvent } from '../../src/types/simulation';

export class EventQueue {
  private heap: SimulationEvent[] = [];

  /**
   * Insert event into queue (maintains time ordering)
   */
  enqueue(event: SimulationEvent): void {
    this.heap.push(event);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Remove and return next event (earliest time)
   */
  dequeue(): SimulationEvent | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);

    return min;
  }

  /**
   * Peek at next event without removing
   */
  peek(): SimulationEvent | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.heap = [];
  }

  /**
   * Bubble up element at index (restore heap property)
   */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);

      if (this.heap[index].time >= this.heap[parentIndex].time) {
        break;
      }

      // Swap with parent
      [this.heap[index], this.heap[parentIndex]] =
        [this.heap[parentIndex], this.heap[index]];

      index = parentIndex;
    }
  }

  /**
   * Bubble down element at index (restore heap property)
   */
  private bubbleDown(index: number): void {
    const length = this.heap.length;

    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length &&
          this.heap[leftChild].time < this.heap[smallest].time) {
        smallest = leftChild;
      }

      if (rightChild < length &&
          this.heap[rightChild].time < this.heap[smallest].time) {
        smallest = rightChild;
      }

      if (smallest === index) {
        break;
      }

      // Swap with smallest child
      [this.heap[index], this.heap[smallest]] =
        [this.heap[smallest], this.heap[index]];

      index = smallest;
    }
  }
}
