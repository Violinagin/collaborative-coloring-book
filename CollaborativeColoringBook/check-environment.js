// check-environment.js - SIMPLIFIED
const os = require('os');

console.log('🔍 Simple Environment Check');
console.log('='.repeat(40));

console.log(`Node: ${process.version}`);
console.log(`Platform: ${process.platform} (${os.arch()})`);
console.log(`CPU Cores: ${os.cpus().length}`);

// Get local IP for LAN connections
const network = os.networkInterfaces();
let localIp = 'localhost';

Object.keys(network).forEach(iface => {
  network[iface].forEach(addr => {
    if (addr.family === 'IPv4' && !addr.internal) {
      localIp = addr.address;
    }
  });
});

console.log(`Local IP: ${localIp}`);
console.log('\n💡 Recommended command:');

if (process.platform === 'win32') {
  console.log('npm run start:pc    (for Windows)');
} else if (process.platform === 'darwin') {
  // Check if it's likely an iPad
  const isIPadLike = os.arch().includes('arm') || process.env.Mobile === 'true';
  if (isIPadLike) {
    console.log('npm run start:ipad  (for iPad)');
  } else {
    console.log('npm run start:mac   (for older MacBook)');
  }
} else {
  console.log('npm start           (standard)');
}

console.log('\n' + '='.repeat(40));