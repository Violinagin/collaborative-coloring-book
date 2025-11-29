const os = require('os');

if (!os.availableParallelism) {
    os.availableParallelism = function() {
        return os.cpus().length;
    };
}

const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.maxWorkers = 2;

config.resolver.assetExts.push('png', 'jpg', 'jpeg');
config.resolver.sourceExts.push('js', 'jsx', 'ts', 'tsx', 'json');

module.exports = config;