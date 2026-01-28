// preload-polyfills.js - SMART polyfills
// Only adds what's missing, never overrides

console.log('🔧 Loading smart polyfills for Node.js', process.version);

// Check Node.js version
const nodeVersion = process.version.match(/v(\d+)\./)[1];
const isOldNode = parseInt(nodeVersion) < 20;

if (!isOldNode) {
  console.log('✅ Modern Node.js - minimal polyfills needed');
  // Don't load unnecessary polyfills on modern Node.js
  process.exit(0);
}

console.log('⚠️  Old Node.js detected - loading compatibility polyfills');

// SAFE polyfill - only add if missing
const addIfMissing = (obj, method, implementation) => {
  if (!obj[method]) {
    Object.defineProperty(obj, method, {
      value: implementation,
      writable: true,
      enumerable: false,
      configurable: true
    });
    console.log(`   + Added ${obj.constructor.name}.${method}`);
  }
};

// Array methods
addIfMissing(Array.prototype, 'toReversed', function() {
  return [...this].reverse();
});

addIfMissing(Array.prototype, 'toSorted', function(compareFn) {
  return [...this].sort(compareFn);
});

addIfMissing(Array.prototype, 'with', function(index, value) {
  const arr = [...this];
  const i = index < 0 ? arr.length + index : index;
  arr[i] = value;
  return arr;
});

// URL.canParse
if (typeof URL !== 'undefined') {
  addIfMissing(URL, 'canParse', function(url, base) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  });
}

console.log('✅ Smart polyfills complete');