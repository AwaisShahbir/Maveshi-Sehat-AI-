const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  watchFolders: [__dirname],
  resolver: {
    blockList: [
      // Block android and gradle build artifacts from triggering file-watch restarts
      new RegExp(`^${path.resolve(__dirname, 'android/app/build').replace(/\\/g, '\\\\')}.*`),
      new RegExp(`^${path.resolve(__dirname, 'android/build').replace(/\\/g, '\\\\')}.*`),
      new RegExp(`^${path.resolve(__dirname, '.gradle').replace(/\\/g, '\\\\')}.*`),
      // Block sibling portals and backend
      new RegExp(`^${path.resolve(__dirname, '../maveshi-sehat-backend').replace(/\\/g, '\\\\')}.*`),
      new RegExp(`^${path.resolve(__dirname, '../maveshi-sehat-admin').replace(/\\/g, '\\\\')}.*`),
      new RegExp(`^${path.resolve(__dirname, '../maveshi-sehat-pharmacy').replace(/\\/g, '\\\\')}.*`),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
