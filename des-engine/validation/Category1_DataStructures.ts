import { EventQueue } from '../EventQueue';
import { createTest, pass, fail } from './ValidationFramework';

export const category1Tests = [
  // Test 1.1: Event Queue - Time Ordering
  createTest(
    '1.1',
    'Category 1',
    'Event Queue - Time Ordering',
    'Insert 1000 random events, verify dequeue in ascending time order',
    () => {
      const queue = new EventQueue();
      const times: number[] = [];

      // Insert 1000 random events
      for (let i = 0; i < 1000; i++) {
        const time = Math.random() * 10000;
        times.push(time);
        queue.insert({ time, type: 'TEST', id: i });
      }

      times.sort((a, b) => a - b);

      // Dequeue and verify ordering
      for (let i = 0; i < 1000; i++) {
        const event = queue.getNext();
        if (!event) {
          return fail('Queue returned null before all events processed');
        }
        if (event.time !== times[i]) {
          return fail(`Event ${i} has wrong time: ${event.time}, expected ${times[i]}`);
        }
      }

      return pass('All 1000 events dequeued in correct time order');
    }
  ),

  // Test 1.2: Event Queue - Tie Breaking
  createTest(
    '1.2',
    'Category 1',
    'Event Queue - Tie Breaking (FIFO)',
    'Insert events with identical timestamps, verify FIFO ordering',
    () => {
      const queue = new EventQueue();
      const numRuns = 1000;
      let allCorrect = true;

      for (let run = 0; run < numRuns; run++) {
        // Clear queue
        while (!queue.isEmpty()) queue.getNext();

        // Insert 10 events at same time
        const time = Math.random() * 100;
        for (let i = 0; i < 10; i++) {
          queue.insert({ time, type: 'TEST', id: i });
        }

        // Verify FIFO order
        for (let i = 0; i < 10; i++) {
          const event = queue.getNext();
          if (!event || event.id !== i) {
            allCorrect = false;
            break;
          }
        }
      }

      return allCorrect
        ? pass('FIFO ordering consistent across 1000 runs')
        : fail('FIFO ordering violated');
    }
  ),

  // Test 1.3: Event Queue - Large Scale Performance
  createTest(
    '1.3',
    'Category 1',
    'Event Queue - Large Scale Performance',
    'Insert/remove 1M events, verify O(log n) performance',
    () => {
      const queue = new EventQueue();
      const n = 1000000;

      const startTime = Date.now();

      // Insert 1M events
      for (let i = 0; i < n; i++) {
        queue.insert({ time: Math.random() * 1000000, type: 'TEST' });
      }

      // Remove all events
      let count = 0;
      while (!queue.isEmpty()) {
        queue.getNext();
        count++;
      }

      const elapsed = Date.now() - startTime;

      if (count !== n) {
        return fail(`Expected ${n} events, got ${count}`);
      }

      if (elapsed > 2000) {
        return fail(`Too slow: ${elapsed}ms for 1M operations (target: <2000ms)`);
      }

      return pass(`1M operations completed in ${elapsed}ms`, { elapsed, eventsPerMs: n / elapsed });
    }
  ),

  // Test 1.4: Event Queue - Edge Cases
  createTest(
    '1.4',
    'Category 1',
    'Event Queue - Edge Cases',
    'Test empty queue, single event, bulk insertion',
    () => {
      // Test 1: Empty queue
      const q1 = new EventQueue();
      if (!q1.isEmpty()) return fail('New queue should be empty');
      if (q1.getNext() !== null) return fail('Empty queue should return null');

      // Test 2: Single event
      const q2 = new EventQueue();
      q2.insert({ time: 5, type: 'SINGLE' });
      if (q2.isEmpty()) return fail('Queue with one event should not be empty');
      const e = q2.getNext();
      if (!e || e.time !== 5) return fail('Single event not retrieved correctly');
      if (!q2.isEmpty()) return fail('Queue should be empty after removing single event');

      // Test 3: Bulk insertion
      const q3 = new EventQueue();
      const events = [];
      for (let i = 0; i < 10000; i++) {
        const time = Math.random() * 1000;
        events.push(time);
        q3.insert({ time, type: 'BULK' });
      }
      events.sort((a, b) => a - b);

      for (let i = 0; i < 10000; i++) {
        const event = q3.getNext();
        if (!event || Math.abs(event.time - events[i]) > 1e-10) {
          return fail('Bulk insertion ordering failed');
        }
      }

      return pass('All edge cases handled correctly');
    }
  ),

  // Test 1.5: Priority Queue Stress Test
  createTest(
    '1.5',
    'Category 1',
    'Priority Queue - Stress Test',
    'Interleave 100K inserts and removes randomly',
    () => {
      const queue = new EventQueue();
      const operations = 100000;
      let insertCount = 0;
      let removeCount = 0;
      let lastTime = -Infinity;

      for (let i = 0; i < operations; i++) {
        if (Math.random() < 0.6 || queue.isEmpty()) {
          // Insert
          queue.insert({ time: Math.random() * 100000, type: 'STRESS' });
          insertCount++;
        } else {
          // Remove
          const event = queue.getNext();
          if (!event) {
            return fail('Queue returned null when not empty');
          }
          if (removeCount > 0 && event.time < lastTime) {
            return fail(`Time ordering violated: ${event.time} < ${lastTime}`);
          }
          lastTime = event.time;
          removeCount++;
        }
      }

      // Drain remaining events
      let prevTime = lastTime;
      while (!queue.isEmpty()) {
        const event = queue.getNext();
        if (!event) break;
        if (event.time < prevTime) {
          return fail('Final drain violated time ordering');
        }
        prevTime = event.time;
        removeCount++;
      }

      if (insertCount !== removeCount) {
        return fail(`Insert/remove mismatch: ${insertCount} inserts, ${removeCount} removes`);
      }

      return pass(`Stress test passed: ${insertCount} inserts/removes, always returned minimum time`);
    }
  )
];
