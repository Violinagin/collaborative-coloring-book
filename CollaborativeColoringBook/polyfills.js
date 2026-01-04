// polyfills.js - ALL your polyfills in one place
console.log('🔧 Loading polyfills for ancient Node.js', process.version);

// Array methods (from your existing file)
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function toReversed() {
    const O = Object(this);
    const len = O.length >>> 0;
    const A = new Array(len);
    for (let k = 0; k < len; k++) {
      A[k] = O[len - k - 1];
    }
    return A;
  };
}

// Add other Array methods similarly...

// URL.canParse (from your existing file)
if (typeof URL !== 'undefined' && !URL.canParse) {
  URL.canParse = function(url, base) {
    try {
      new URL(url, base);
      return true;
    } catch (e) {
      return false;
    }
  };
}

// OS.availableParallelism (NEW - fixes your current error)
const os = require('os');
if (os && !os.availableParallelism) {
  os.availableParallelism = function() {
    return (os.cpus && os.cpus().length) || 1;
  };
}

console.log('🎯 All polyfills loaded successfully');