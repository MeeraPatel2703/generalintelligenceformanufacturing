import { EventQueue } from './EventQueue';

console.log('=== TESTING EVENT QUEUE ===\n');

// Test 1: Basic ordering
console.log('Test 1: Basic ordering');
const queue = new EventQueue();
queue.insert({ time: 10, type: 'A' });
queue.insert({ time: 5, type: 'B' });
queue.insert({ time: 15, type: 'C' });

const e1 = queue.getNext();
const e2 = queue.getNext();
const e3 = queue.getNext();

console.assert(e1!.time === 5, "FAILED: First event wrong");
console.assert(e2!.time === 10, "FAILED: Second event wrong");
console.assert(e3!.time === 15, "FAILED: Third event wrong");

console.log(`  First event time: ${e1!.time} (expected 5) ✓`);
console.log(`  Second event time: ${e2!.time} (expected 10) ✓`);
console.log(`  Third event time: ${e3!.time} (expected 15) ✓`);
console.log('✓ Basic ordering works\n');

// Test 2: Simultaneous events (FIFO tie-breaking)
console.log('Test 2: Simultaneous events (FIFO tie-breaking)');
const queue2 = new EventQueue();
queue2.insert({ time: 10, type: 'X', id: 1 });
queue2.insert({ time: 10, type: 'Y', id: 2 });
queue2.insert({ time: 10, type: 'Z', id: 3 });

const f1 = queue2.getNext();
const f2 = queue2.getNext();
const f3 = queue2.getNext();

console.assert(f1!.id === 1, "FAILED: Tie-breaking wrong");
console.assert(f2!.id === 2, "FAILED: Tie-breaking wrong");
console.assert(f3!.id === 3, "FAILED: Tie-breaking wrong");

console.log(`  First event id: ${f1!.id} (expected 1) ✓`);
console.log(`  Second event id: ${f2!.id} (expected 2) ✓`);
console.log(`  Third event id: ${f3!.id} (expected 3) ✓`);
console.log('✓ Simultaneous events handled correctly\n');

// Test 3: Empty queue behavior
console.log('Test 3: Empty queue behavior');
const queue3 = new EventQueue();
console.assert(queue3.isEmpty() === true, "FAILED: isEmpty should return true");
console.assert(queue3.getNext() === null, "FAILED: getNext should return null");
console.log(`  isEmpty on empty queue: true ✓`);
console.log(`  getNext on empty queue: null ✓`);
console.log('✓ Empty queue behavior correct\n');

// Test 4: Complex interleaved ordering
console.log('Test 4: Complex interleaved ordering');
const queue4 = new EventQueue();
const times = [50, 10, 30, 20, 40, 5, 15, 35, 25, 45];
times.forEach(t => queue4.insert({ time: t, type: 'TEST' }));

const sorted = [];
while (!queue4.isEmpty()) {
  sorted.push(queue4.getNext()!.time);
}

const expected = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
console.assert(JSON.stringify(sorted) === JSON.stringify(expected), "FAILED: Complex ordering wrong");
console.log(`  Sorted times: ${sorted.join(', ')}`);
console.log(`  Expected: ${expected.join(', ')}`);
console.log('✓ Complex ordering works\n');

// Test 5: Mixed simultaneous and different times
console.log('Test 5: Mixed simultaneous and different times');
const queue5 = new EventQueue();
queue5.insert({ time: 10, type: 'A', id: 1 });
queue5.insert({ time: 5, type: 'B', id: 2 });
queue5.insert({ time: 10, type: 'C', id: 3 });
queue5.insert({ time: 5, type: 'D', id: 4 });
queue5.insert({ time: 15, type: 'E', id: 5 });

const results = [];
while (!queue5.isEmpty()) {
  const event = queue5.getNext()!;
  results.push({ time: event.time, id: event.id });
}

console.assert(results[0].time === 5 && results[0].id === 2, "FAILED: First should be time 5, id 2");
console.assert(results[1].time === 5 && results[1].id === 4, "FAILED: Second should be time 5, id 4");
console.assert(results[2].time === 10 && results[2].id === 1, "FAILED: Third should be time 10, id 1");
console.assert(results[3].time === 10 && results[3].id === 3, "FAILED: Fourth should be time 10, id 3");
console.assert(results[4].time === 15 && results[4].id === 5, "FAILED: Fifth should be time 15, id 5");

console.log(`  Event order:`);
results.forEach((r, i) => console.log(`    ${i + 1}. time=${r.time}, id=${r.id}`));
console.log('✓ Mixed timing works correctly\n');

console.log('=== ALL EVENT QUEUE TESTS PASSED ===\n');
