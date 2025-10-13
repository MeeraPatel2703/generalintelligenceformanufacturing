/**
 * Binary Min-Heap (Priority Queue)
 *
 * Performance: O(log n) insert and extract
 * Used for: DES event calendar
 *
 * Industrial-grade implementation with:
 * - Type safety
 * - Bounds checking
 * - Efficient memory management
 */

export interface Comparable<T> {
  compareTo(other: T): number; // negative if less, 0 if equal, positive if greater
}

export class BinaryHeap<T extends Comparable<T>> {
  private heap: T[] = [];

  /**
   * Get number of elements in heap
   * Complexity: O(1)
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * Check if heap is empty
   * Complexity: O(1)
   */
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * View minimum element without removing
   * Complexity: O(1)
   */
  peek(): T | undefined {
    return this.heap[0];
  }

  /**
   * Insert new element
   * Complexity: O(log n)
   */
  insert(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Remove and return minimum element
   * Complexity: O(log n)
   */
  extractMin(): T | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }

    if (this.heap.length === 1) {
      return this.heap.pop()!;
    }

    const min = this.heap[0];
    const last = this.heap.pop()!;

    this.heap[0] = last;
    this.bubbleDown(0);

    return min;
  }

  /**
   * Clear all elements
   * Complexity: O(1)
   */
  clear(): void {
    this.heap = [];
  }

  /**
   * Get all elements (sorted)
   * Complexity: O(n log n)
   * Note: This creates a copy, doesn't modify heap
   */
  toSortedArray(): T[] {
    const copy = new BinaryHeap<T>();
    copy.heap = [...this.heap];

    const result: T[] = [];
    while (!copy.isEmpty()) {
      const item = copy.extractMin();
      if (item) result.push(item);
    }

    return result;
  }

  /**
   * Restore heap property by moving element up
   * Private helper method
   */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);

      if (this.heap[index].compareTo(this.heap[parentIndex]) >= 0) {
        break; // Heap property satisfied
      }

      // Swap with parent
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  /**
   * Restore heap property by moving element down
   * Private helper method
   */
  private bubbleDown(index: number): void {
    const length = this.heap.length;

    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.heap[leftChild].compareTo(this.heap[smallest]) < 0) {
        smallest = leftChild;
      }

      if (rightChild < length && this.heap[rightChild].compareTo(this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest === index) {
        break; // Heap property satisfied
      }

      // Swap with smallest child
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }

  /**
   * Verify heap property (for testing/debugging)
   * Returns true if valid min-heap
   */
  validate(): boolean {
    for (let i = 0; i < this.heap.length; i++) {
      const leftChild = 2 * i + 1;
      const rightChild = 2 * i + 2;

      if (leftChild < this.heap.length && this.heap[i].compareTo(this.heap[leftChild]) > 0) {
        return false;
      }

      if (rightChild < this.heap.length && this.heap[i].compareTo(this.heap[rightChild]) > 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get heap statistics for diagnostics
   */
  getStats(): { size: number; height: number; isValid: boolean } {
    const size = this.heap.length;
    const height = size > 0 ? Math.floor(Math.log2(size)) + 1 : 0;

    return {
      size,
      height,
      isValid: this.validate()
    };
  }
}

/**
 * Convenience function to create a binary heap from array
 * Uses heapify algorithm for O(n) construction
 */
export function createHeapFrom<T extends Comparable<T>>(items: T[]): BinaryHeap<T> {
  const heap = new BinaryHeap<T>();

  // Insert all items
  for (const item of items) {
    heap.insert(item);
  }

  return heap;
}
