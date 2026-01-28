// scripts/debug-polyfills.js
console.log('🔍 Debugging polyfill loading...');
console.log('Platform:', process.platform);
console.log('Node version:', process.version);
console.log('CWD:', process.cwd());

// Check what polyfill files exist
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.');
const polyfillFiles = files.filter(f => f.includes('polyfill'));
console.log('\nPolyfill files found:', polyfillFiles);

if (polyfillFiles.length > 0) {
  console.log('\nContents of app-polyfills.js:');
  console.log('='.repeat(50));
  try {
    console.log(fs.readFileSync('app-polyfills.js', 'utf8'));
  } catch (e) {
    console.log('Could not read file');
  }
}

console.log('\n💡 Recommendation:');
console.log('On Windows PC, you likely don\'t need any polyfills.');
console.log('Try temporarily renaming app-polyfills.js to test:');
console.log('mv app-polyfills.js app-polyfills.js.backup');
console.log('Then run: npm run start:pc');