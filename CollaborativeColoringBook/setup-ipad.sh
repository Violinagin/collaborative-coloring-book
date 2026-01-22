#!/bin/bash
# setup-ipad.sh - Quick setup for iPad/Codespaces
echo "📱 Setting up ForkArt for iPad/Codespaces..."

# Check if we're in Codespaces
if [ -n "$CODESPACES" ] || [ -n "$GITHUB_CODESPACE" ]; then
  echo "🌐 GitHub Codespaces detected"
  
  # Install Expo CLI if needed
  if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g expo-cli
  fi
  
  # Update package.json for Codespaces
  echo "🔧 Updating npm scripts for Codespaces..."
  node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Add Codespaces-specific script if not exists
  if (!pkg.scripts['start:codespaces']) {
    pkg.scripts['start:codespaces'] = 'npm run start:ipad';
  }
  
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  "
fi

# Create QR code helper
echo "📋 Creating QR code helper..."
cat > show-qr.js << 'EOF'
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
EOF

# Make start-dev executable
chmod +x start-dev

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Quick start:"
echo "   ./start-dev"
echo ""
echo "📱 On your iPad:"
echo "   1. Open Expo Go app"
echo "   2. Scan the QR code that appears"
echo ""
echo "🔧 Alternative commands:"
echo "   npm run start:ipad    - Tunnel mode (best for Codespaces)"
echo "   npm run start:lan     - LAN mode"
echo "   npm start            - Standard mode"