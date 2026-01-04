// metro.config.js - just Metro config, no polyfills
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Be gentle with your old computer
config.maxWorkers = 1;

// Keep your asset extensions
config.resolver.assetExts.push('png', 'jpg', 'jpeg');
config.resolver.sourceExts.push('js', 'jsx', 'ts', 'tsx', 'json');

config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Override any localhost references
        const url = req.url;
        if (url.includes('127.0.0.1') || url.includes('localhost')) {
          req.url = url.replace(/127\.0\.0\.1|localhost/g, '192.168.4.22');
        }
        return middleware(req, res, next);
      };
    }
  };

  config.serializer = {
    ...config.serializer,
    getRunModuleStatement: (moduleId) => {
      return `global.__METRO_GLOBAL_PREFIX__ = "http://192.168.4.22:8081";\n` +
             `module.exports = global.__r(${moduleId});`;
    }
  };

module.exports = config;