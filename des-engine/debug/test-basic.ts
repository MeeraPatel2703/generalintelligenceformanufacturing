// STEP 1: VERIFY EVENT QUEUE IS WORKING

import { EventQueue } from '../EventQueue';

console.log("=== TESTING EVENT QUEUE ===");

const queue = new EventQueue();

// Add 3 events
queue.insert({ time: 10, type: 'TEST_A' });
queue.insert({ time: 5, type: 'TEST_B' });
queue.insert({ time: 15, type: 'TEST_C' });

console.log("Added 3 events (times: 10, 5, 15)");

// Remove them
const e1 = queue.getNext();
const e2 = queue.getNext();
const e3 = queue.getNext();

console.log(`Event 1: time=${e1!.time} (should be 5)`);
console.log(`Event 2: time=${e2!.time} (should be 10)`);
console.log(`Event 3: time=${e3!.time} (should be 15)`);

if (e1!.time === 5 && e2!.time === 10 && e3!.time === 15) {
  console.log("✓ EVENT QUEUE WORKS");
  process.exit(0);
} else {
  console.log("✗ EVENT QUEUE BROKEN - FIX THIS FIRST");
  process.exit(1);
}
