// show-qr.js - Display connection info
const os = require('os');
const qrcode = require('qrcode-terminal');

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

const ip = getLocalIP();
const expoUrl = `exp://${ip}:19000`;

console.log('\n📱 ForkArt Connection Info:');
console.log('='.repeat(40));
console.log(`Local URL: ${expoUrl}`);
console.log('\nQR Code:');
qrcode.generate(expoUrl, { small: true });
console.log('\n💡 Tips:');
console.log('1. Make sure your device is on the same network');
console.log('2. Open Expo Go app and scan the QR code');
console.log('3. Or enter the URL manually in Expo Go');
console.log('='.repeat(40));
