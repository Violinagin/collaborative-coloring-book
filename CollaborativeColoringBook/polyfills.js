// Polyfill for URL.canParse - needed for older Node.js versions
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