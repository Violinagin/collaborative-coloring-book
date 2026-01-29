// get-ip.js
const os = require('os');

const interfaces = os.networkInterfaces();
console.log('🔍 Network Interfaces:');
console.log('='.repeat(40));

let validIPs = [];

Object.keys(interfaces).forEach(iface => {
  interfaces[iface].forEach(addr => {
    if (addr.family === 'IPv4' && !addr.internal) {
      console.log(`${iface}: ${addr.address}`);
      validIPs.push(addr.address);
    }
  });
});

console.log('\n✅ Use this IP for devices:');
if (validIPs.length > 0) {
  // Filter out broadcast addresses (ending in .255)
  const deviceIP = validIPs.find(ip => !ip.endsWith('.255'));
  console.log(`📱 exp://${deviceIP}:19000`);
  console.log(`🌐 http://${deviceIP}:19000`);
} else {
  console.log('❌ No valid IP found. Are you connected to WiFi?');
}