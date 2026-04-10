export const EXAMPLES = [
  {
    id: 'async-await',
    name: 'Async/Await & Fetch',
    code: `console.log('1. Script Start');

let dataReady = false;

async function init() {
  console.log('3. Inside async init');
  
  // Await fetch (simulated 10ms)
  const res = await fetch('https://api.example.com/data');
  console.log('5. Data received:', res.status);
  
  dataReady = true;
}

setTimeout(() => {
  console.log('6. setTimeout callback - dataReady:', dataReady);
}, 0);

init();

console.log('2. Script End');`
  },
  {
    id: 'var-loop',
    name: 'The "var" Loop Trap',
    code: `console.log('Loop started...');

// var shares the same scope for every iteration
// When the callback runs, i is ALREADY 4
for (var i = 1; i <= 3; i++) {
  setTimeout(() => {
    console.log('var index:', i);
  }, 100);
}

console.log('Sync code finished.');`
  },
  {
    id: 'let-loop',
    name: 'The "let" Loop Fix',
    code: `console.log('Loop started...');

// let creates a new block-scoped variable for EVERY iteration
// Each callback "closes over" its own unique j
for (let j = 1; j <= 3; j++) {
  setTimeout(() => {
    console.log('let index:', j);
  }, 100);
}

console.log('Sync code finished.');`
  },
  {
    id: 'macro-micro',
    name: 'Macro vs Microtask Priority',
    code: `console.log('Script Start');

// Macrotasks go to the Task Queue
setTimeout(() => console.log('setTimeout (Macrotask)'), 0);

// Microtasks go to the Promise Queue
// They run immediately after the current task finishes!
Promise.resolve()
  .then(() => console.log('Promise 1 (Microtask)'))
  .then(() => console.log('Promise 2 (Microtask)'));

console.log('Script End');`
  },
  {
    id: 'closure-counter',
    name: 'Shared Closure Counter',
    code: `function createCounter() {
  let count = 0;
  
  return function increment() {
    count++;
    console.log('Count is now:', count);
  };
}

const counterA = createCounter();
const counterB = createCounter();

console.log('--- Counter A ---');
counterA(); // count 1
counterA(); // count 2

console.log('--- Counter B ---');
counterB(); // count 1 (independent scope!)`
  }
];
