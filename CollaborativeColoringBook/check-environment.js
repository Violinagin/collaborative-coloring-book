// check-environment.js - Auto-detect and configure environment
const os = require('os');
const fs = require('fs');

console.log('🔍 Checking environment...');
console.log('Node:', process.version);
console.log('Platform:', process.platform);
console.log('Arch:', process.arch);
console.log('CPU Cores:', os.cpus().length);

// Check if we're on your old Mac
const isOldMac = process.platform === 'darwin' && 
                 parseFloat(os.release()) < 20; // macOS < 11 (Big Sur)

if (isOldMac) {
  console.log('🖥️ Detected older Mac - applying optimizations...');
  
  // Create a .env file with Mac-specific settings
  const envConfig = `
# Auto-generated for old Mac
EXPO_NO_TELEMETRY=1
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.4.22
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
METRO_MAX_WORKERS=1
NODE_OPTIONS=--max-old-space-size=4096
`;
  
  fs.writeFileSync('.env.mac', envConfig);
  console.log('✅ Created .env.mac with optimizations');
  
  // Suggest command
  console.log('\n💡 Run this command:');
  console.log('npm run start:mac');
} else {
  console.log('🚀 Modern environment detected - full speed ahead!');
  console.log('\n💡 Run this command:');
  console.log('npm start');
}

process.exit(0);