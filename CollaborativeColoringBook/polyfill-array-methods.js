// polyfill-array-methods.js
console.log('🔧 Loading Array method polyfills for Node', process.version);

// Safe, non-polluting polyfills
const addPolyfill = (name, implementation) => {
  if (!Array.prototype[name]) {
    Object.defineProperty(Array.prototype, name, {
      value: implementation,
      writable: true,
      configurable: true,
      enumerable: false
    });
    console.log(`✅ Added Array.prototype.${name}`);
  }
};

// toReversed - returns reversed copy
addPolyfill('toReversed', function toReversed() {
  if (this == null) {
    throw new TypeError('Array.prototype.toReversed called on null or undefined');
  }
  const O = Object(this);
  const len = O.length >>> 0;
  const A = new Array(len);
  for (let k = 0; k < len; k++) {
    A[k] = O[len - k - 1];
  }
  return A;
});

// toSorted - returns sorted copy
addPolyfill('toSorted', function toSorted(compareFn) {
  if (this == null) {
    throw new TypeError('Array.prototype.toSorted called on null or undefined');
  }
  const O = Object(this);
  const A = O.slice();
  A.sort(compareFn);
  return A;
});

// toSpliced - returns spliced copy
addPolyfill('toSpliced', function toSpliced(start, deleteCount, ...items) {
  if (this == null) {
    throw new TypeError('Array.prototype.toSpliced called on null or undefined');
  }
  const O = Object(this);
  const A = O.slice();
  A.splice(start, deleteCount, ...items);
  return A;
});

// with - returns copy with element replaced
addPolyfill('with', function (index, value) {
  if (this == null) {
    throw new TypeError('Array.prototype.with called on null or undefined');
  }
  const O = Object(this);
  const len = O.length >>> 0;
  const relativeIndex = index < 0 ? len + index : index;
  
  if (relativeIndex < 0 || relativeIndex >= len) {
    throw new RangeError('Invalid index : ' + index);
  }
  
  const A = O.slice();
  A[relativeIndex] = value;
  return A;
});

console.log('🎯 Polyfills loaded successfully');