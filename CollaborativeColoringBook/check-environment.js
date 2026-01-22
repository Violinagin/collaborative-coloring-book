// check-environment.js - Enhanced for your setup
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_exec');

console.log('🎯 ForkArt Environment Detection');
console.log('='.repeat(40));

// Get local IP (better method)
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const ifaceName in interfaces) {
    for (const iface of interfaces[ifaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
console.log(`📡 Local IP: ${localIP}`);

// Detect environment
let environment = 'unknown';
let suggestions = [];

if (process.platform === 'darwin') {
  const macVersion = parseFloat(os.release());
  if (macVersion < 20) {
    environment = 'old-mac';
    console.log('🖥️  Detected: Old Mac (pre-Big Sur)');
    suggestions.push('Using conservative memory settings (max-workers=1)');
    
    // Check if this is YOUR specific Mac
    if (localIP === '192.168.4.22') {
      console.log('✅ This is your development Mac!');
      environment = 'dev-mac';
    }
  } else {
    environment = 'modern-mac';
    console.log('💻 Detected: Modern Mac');
  }
} else if (process.env.CODESPACES) {
  environment = 'codespaces';
  console.log('🌐 Detected: GitHub Codespaces');
  suggestions.push('Using tunnel mode for device connection');
} else if (process.platform === 'linux' && os.arch().includes('arm')) {
  environment = 'ipad';
  console.log('📱 Detected: iPad (Linux ARM)');
  suggestions.push('Using tunnel mode for reliability');
}

// Create appropriate start command
const commands = {
  'dev-mac': 'npm run start:lan',  // Your specific Mac
  'old-mac': 'npm start',          // Conservative settings
  'modern-mac': 'npm start',       // Standard
  'codespaces': 'npm run start:ipad', // Use tunnel
  'ipad': 'npm run start:ipad',    // Use tunnel
  'default': 'npm start'
};

const startCommand = commands[environment] || commands.default;

console.log('\n💡 Recommended command:');
console.log(`   ${startCommand}`);

if (suggestions.length > 0) {
  console.log('\n🔧 Suggestions:');
  suggestions.forEach(s => console.log(`   • ${s}`));
}

// Create/update .env file if needed
if (!fs.existsSync('.env')) {
  const envContent = `# Auto-generated environment
EXPO_NO_TELEMETRY=1
REACT_NATIVE_PACKAGER_HOSTNAME=${localIP}
NODE_OPTIONS=--require ./preload-polyfills.js
`;
  fs.writeFileSync('.env', envContent);
  console.log(`\n📁 Created .env file with IP: ${localIP}`);
}

console.log('\n' + '='.repeat(40));
console.log('✅ Ready to start development!');