// check-environment.js - Enhanced environment detection
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🎯 ForkArt Environment Check');
console.log('=' .repeat(40));

// Basic system info
console.log('\n📊 System Information:');
console.log(`• Node: ${process.version}`);
console.log(`• Platform: ${process.platform} ${os.release()}`);
console.log(`• Arch: ${process.arch}`);
console.log(`• CPU Cores: ${os.cpus().length}`);
console.log(`• Memory: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`);
console.log(`• User: ${os.userInfo().username}`);

// Network info
const network = os.networkInterfaces();
let localIp = 'localhost';
Object.keys(network).forEach(iface => {
  network[iface].forEach(addr => {
    if (addr.family === 'IPv4' && !addr.internal) {
      localIp = addr.address;
    }
  });
});
console.log(`• Local IP: ${localIp}`);

// Check for Git
try {
  const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
  console.log(`• Git: ${gitVersion}`);
} catch {
  console.log('• Git: ❌ Not found');
}

// Check for Expo
try {
  const expoVersion = execSync('npx expo --version', { encoding: 'utf8' }).trim();
  console.log(`• Expo: ${expoVersion}`);
} catch {
  console.log('• Expo: ❌ Not found - run: npm install -g expo-cli');
}

// Environment detection
console.log('\n🔍 Environment Detection:');

let environment = 'unknown';
let optimizationLevel = 'normal';
let suggestions = [];

// Detect Codespaces
if (process.env.CODESPACES === 'true' || process.env.GITHUB_CODESPACE) {
  environment = 'codespaces';
  optimizationLevel = 'remote';
  suggestions.push('Use tunnel for device connection: npm run start:tunnel');
  suggestions.push('QR code will use cloud URL');
}

// Detect old Mac (your specific setup from the file)
else if (process.platform === 'darwin') {
  const macVersion = parseFloat(os.release());
  if (macVersion < 20) { // macOS < 11 Big Sur
    environment = 'old-mac';
    optimizationLevel = 'conservative';
    suggestions.push('Using conservative memory settings');
    suggestions.push('Metro workers limited to 1 for stability');
  } else {
    environment = 'modern-mac';
    optimizationLevel = 'aggressive';
    suggestions.push('Full performance mode enabled');
  }
}

// Detect iPad setup
else if (process.platform === 'darwin' && os.arch().includes('arm')) {
  environment = 'ipad';
  optimizationLevel = 'mobile';
  suggestions.push('iPad detected - using touch-friendly optimizations');
}

// Detect Windows
else if (process.platform === 'win32') {
  environment = 'windows';
  suggestions.push('Windows detected - ensure Android/iOS simulators are set up');
}

// Create environment-specific config
console.log(`\n✅ Detected: ${environment} (${optimizationLevel} optimization)`);

const envConfig = {
  'old-mac': {
    EXPO_NO_TELEMETRY: '1',
    REACT_NATIVE_PACKAGER_HOSTNAME: localIp,
    EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
    METRO_MAX_WORKERS: '1',
    NODE_OPTIONS: '--max-old-space-size=4096',
    EXPO_OPTIMIZE_MEMORY: 'true'
  },
  'codespaces': {
    EXPO_NO_TELEMETRY: '1',
    EXPO_TUNNEL_SUBDOMAIN: process.env.CODESPACE_NAME || 'forkart',
    EXPO_USE_TUNNEL: 'true',
    METRO_MAX_WORKERS: '2',
    REACT_NATIVE_PACKAGER_HOSTNAME: '0.0.0.0'
  },
  'ipad': {
    EXPO_NO_TELEMETRY: '1',
    REACT_NATIVE_PACKAGER_HOSTNAME: localIp,
    EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
    EXPO_OPTIMIZE_TOUCH: 'true',
    METRO_MAX_WORKERS: '2'
  },
  'default': {
    EXPO_NO_TELEMETRY: '1',
    REACT_NATIVE_PACKAGER_HOSTNAME: localIp,
    METRO_MAX_WORKERS: Math.max(1, os.cpus().length - 1).toString()
  }
};

// Select config
const config = envConfig[environment] || envConfig.default;

// Write to file
const envContent = Object.entries(config)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync('.env.auto', `# Auto-generated for ${environment}\n${envContent}\n`);
console.log(`📁 Created: .env.auto for ${environment}`);

// Copy to .env if it doesn't exist
if (!fs.existsSync('.env')) {
  fs.copyFileSync('.env.auto', '.env');
  console.log('📁 Copied to .env (was missing)');
}

// Show suggestions
if (suggestions.length > 0) {
  console.log('\n💡 Suggestions:');
  suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
}

// Show startup command
console.log('\n🚀 Startup Commands:');
console.log(`  • npm start           - Standard start`);
console.log(`  • npm run start:${environment} - Environment-specific start`);

if (environment === 'codespaces') {
  console.log(`  • npm run start:tunnel - Use tunnel (recommended for Codespaces)`);
}

console.log('\n📱 Device Connection:');
console.log(`  • Expo URL: exp://${localIp}:19000`);
if (environment === 'codespaces') {
  console.log(`  • Tunnel URL: Check terminal after starting with tunnel`);
}

console.log('\n' + '='.repeat(40));
console.log('✅ Environment check complete!');