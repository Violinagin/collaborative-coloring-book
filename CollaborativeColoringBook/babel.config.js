// babel.config.js
module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    // This ensures polyfills load before any other code
    plugins: []
  };
};