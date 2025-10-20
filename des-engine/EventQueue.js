export class EventQueue {
    events = [];
    insertionOrder = 0;
    insert(event) {
        // Add insertion order for tie-breaking
        const eventWithOrder = { ...event, _order: this.insertionOrder++ };
        this.events.push(eventWithOrder);
        // Bubble up to maintain min-heap property
        this.bubbleUp(this.events.length - 1);
    }
    getNext() {
        if (this.events.length === 0)
            return null;
        const minEvent = this.events[0];
        const lastEvent = this.events.pop();
        if (this.events.length > 0) {
            this.events[0] = lastEvent;
            this.bubbleDown(0);
        }
        // Remove internal insertion order before returning
        const { _order, ...result } = minEvent;
        return result;
    }
    isEmpty() {
        return this.events.length === 0;
    }
    bubbleUp(index) {
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
    bubbleDown(index) {
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
            if (smallest === index)
                break;
            // Swap with smallest child
            [this.events[index], this.events[smallest]] = [this.events[smallest], this.events[index]];
            index = smallest;
        }
    }
    compare(a, b) {
        // First compare by time
        if (a.time !== b.time) {
            return a.time - b.time;
        }
        // Tie-break by insertion order (FIFO)
        return a._order - b._order;
    }
}
