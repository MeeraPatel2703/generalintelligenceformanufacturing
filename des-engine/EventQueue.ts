export interface Event {
  time: number;
  type: string;
  id?: number;
  [key: string]: any;
}

export class EventQueue {
  private events: Event[] = [];
  private insertionOrder = 0;

  insert(event: Event): void {
    // Add insertion order for tie-breaking
    const eventWithOrder = { ...event, _order: this.insertionOrder++ };
    this.events.push(eventWithOrder);

    // Bubble up to maintain min-heap property
    this.bubbleUp(this.events.length - 1);
  }

  getNext(): Event | null {
    if (this.events.length === 0) return null;

    const minEvent = this.events[0];
    const lastEvent = this.events.pop()!;

    if (this.events.length > 0) {
      this.events[0] = lastEvent;
      this.bubbleDown(0);
    }

    // Remove internal insertion order before returning
    const { _order, ...result } = minEvent;
    return result as Event;
  }

  isEmpty(): boolean {
    return this.events.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);

      if (this.compare(this.events[index], this.events[parentIndex]) >= 0) {
        break;
      }

      // Swap with parent
      [this.events[index], this.events[parentIndex]] = [this.events[parentIndex], this.events[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < this.events.length && this.compare(this.events[leftChild], this.events[smallest]) < 0) {
        smallest = leftChild;
      }

      if (rightChild < this.events.length && this.compare(this.events[rightChild], this.events[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      // Swap with smallest child
      [this.events[index], this.events[smallest]] = [this.events[smallest], this.events[index]];
      index = smallest;
    }
  }

  private compare(a: any, b: any): number {
    // First compare by time
    if (a.time !== b.time) {
      return a.time - b.time;
    }
    // Tie-break by insertion order (FIFO)
    return a._order - b._order;
  }
}
