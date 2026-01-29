// start-dev.js - Smart device detection
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('🚀 Smart Expo Starter');
console.log('='.repeat(40));

// Detect device
const isWindows = os.platform() === 'win32';
const isOldMac = os.platform() === 'darwin' && parseFloat(os.release()) < 20;
const isIPad = os.platform() === 'darwin' && os.arch().includes('arm');

console.log(`💻 Platform: ${os.platform()} (${os.arch()})`);
console.log(`📡 Device: ${isWindows ? 'PC' : isOldMac ? 'Old Mac' : isIPad ? 'iPad' : 'Modern Mac'}`);

// Determine which .env file to use
let envFile = '.env'; // Base file always loaded
if (isOldMac && fs.existsSync('.env.mac')) {
  console.log('📁 Loading: .env + .env.mac');
  envFile += ' .env.mac';
} else if (isWindows && fs.existsSync('.env.pc')) {
  console.log('📁 Loading: .env + .env.pc');
  envFile += ' .env.pc';
} else {
  console.log('📁 Loading: .env only');
}

// Build environment
const env = { ...process.env };
['.env', '.env.mac', '.env.pc'].forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=#]+)=([^#]*)/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key && value) {
          env[key] = value;
        }
      }
    });
  }
});

// Determine start mode
let args = ['expo', 'start', '--clear'];
if (isOldMac) {
  args.push('--lan');
  console.log('🌐 Mode: LAN (Old Mac needs specific IP)');
} else {
  args.push('--tunnel');
  console.log('🌐 Mode: Tunnel (works anywhere)');
}

console.log('\n📱 Connection:');
if (args.includes('--tunnel')) {
  console.log('   Use tunnel QR code - works on any network!');
} else {
  const ip = env.REACT_NATIVE_PACKAGER_HOSTNAME || 'localhost';
  console.log(`   exp://${ip}:19000`);
}

console.log('\n' + '='.repeat(40));

// Start Expo
const expoProcess = spawn('npx', args, {
  stdio: 'inherit',
  env,
  shell: true
});

expoProcess.on('close', (code) => {
  console.log(`Expo exited with code ${code}`);
});