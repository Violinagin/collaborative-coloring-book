// start-mobile.js
const { spawn } = require('child_process');
const os = require('os');
const qrcode = require('qrcode-terminal');

// Get real IP (not broadcast)
function getDeviceIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal && !config.address.endsWith('.255')) {
        return config.address;
      }
    }
  }
  return 'localhost';
}

const deviceIP = getDeviceIP();
const expoUrl = `exp://${deviceIP}:19000`;

console.log('\n📱 MOBILE DEVICE CONNECTION');
console.log('='.repeat(40));
console.log(`💻 PC IP: ${deviceIP}`);
console.log(`🔗 Expo URL: ${expoUrl}`);
console.log(`🌐 Web URL: http://${deviceIP}:19000`);

console.log('\n📲 CONNECTION METHODS:');
console.log('1. SCAN QR code below with phone/iPad camera');
console.log('2. In Expo Go app: Enter URL manually');
console.log(`   ${expoUrl}`);
console.log('3. In Safari:');
console.log(`   http://${deviceIP}:19000`);

console.log('\n👆 QR CODE:');
qrcode.generate(expoUrl, { small: true });

console.log('\n🚀 Starting Expo...');
console.log('='.repeat(40));

const expoProcess = spawn('npx', ['expo', 'start', '--lan', '--clear'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    REACT_NATIVE_PACKAGER_HOSTNAME: deviceIP,
    EXPO_NO_TELEMETRY: '1'
  },
  shell: true
});