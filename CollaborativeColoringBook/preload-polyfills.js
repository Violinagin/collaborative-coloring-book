// preload-polyfills.js - LOADS FIRST when Node.js starts
// ONLY for Metro bundler on your Mac

console.log('🔧 Loading Node.js polyfills for Metro...');

// CRITICAL: Array methods that Metro needs
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function(compareFn) {
    return [...this].sort(compareFn);
  };
}

if (!Array.prototype.with) {
  Array.prototype.with = function(index, value) {
    const arr = [...this];
    const i = index < 0 ? arr.length + index : index;
    arr[i] = value;
    return arr;
  };
}

// URL.canParse for Node < 20
if (typeof URL !== 'undefined' && !URL.canParse) {
  URL.canParse = function(url, base) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

console.log('✅ Node.js polyfills ready for Metro');