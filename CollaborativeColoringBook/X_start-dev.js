#!/usr/bin/env node
// start-dev.js - Unified development starter
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

console.log('🚀 ForkArt Development Starter');
console.log('='.repeat(40));

// Load auto-detected environment
let env = {};
if (fs.existsSync('.env.auto')) {
  const envContent = fs.readFileSync('.env.auto', 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !match[1].startsWith('#')) {
      env[match[1]] = match[2];
    }
  });
}

// Merge with existing env
const processEnv = { ...process.env, ...env };

// Determine command based on arguments
let command = 'expo';
let args = ['start'];

const userArgs = process.argv.slice(2);

// Check for specific flags
if (userArgs.includes('--tunnel')) {
  args.push('--tunnel');
  console.log('🌐 Using tunnel mode');
} else if (userArgs.includes('--clear')) {
  args.push('--clear');
  console.log('🧹 Clearing cache');
} else if (userArgs.includes('--ios')) {
  args.push('--ios');
  console.log('🍎 Starting iOS simulator');
} else if (userArgs.includes('--android')) {
  args.push('--android');
  console.log('🤖 Starting Android emulator');
} else {
  // Default: show all options
  args.push('--localhost', '--dev');
  console.log('💻 Starting dev server on local network');
}

// Add LAN flag for local device testing
args.push('--lan');

console.log('\n📊 Environment:');
console.log(`• Host: ${env.REACT_NATIVE_PACKAGER_HOSTNAME || 'localhost'}`);
console.log(`• Workers: ${env.METRO_MAX_WORKERS || 'auto'}`);
console.log(`• Memory: ${env.NODE_OPTIONS || 'default'}`);

console.log('\n🔧 Starting Expo...');
console.log('='.repeat(40));

const expoProcess = spawn(command, args, {
  stdio: 'inherit',
  env: processEnv,
  shell: true
});

expoProcess.on('close', (code) => {
  console.log(`\nExpo process exited with code ${code}`);
  process.exit(code);
});

// Handle termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Expo...');
  expoProcess.kill('SIGINT');
});