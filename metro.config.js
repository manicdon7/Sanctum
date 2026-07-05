const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow bundling audio files as assets
config.resolver.assetExts.push('mp3', 'wav', 'aac');

// Reduce file watching to prevent EMFILE errors
config.watchFolders = [];
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;
