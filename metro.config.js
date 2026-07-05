const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Allow bundling audio files, textures, and fonts as assets
config.resolver.assetExts.push('mp3', 'wav', 'aac', 'ttf', 'otf', 'wasm');

// Polyfill Node core 'buffer' module
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer/'),
};

module.exports = withNativeWind(config, { input: './global.css' });
