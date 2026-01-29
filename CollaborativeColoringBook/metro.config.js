// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize for old Mac
//config.maxWorkers = 1;
//config.resetCache = true;

module.exports = config;