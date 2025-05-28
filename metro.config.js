/* eslint-env node */
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Simplest approach: just add the blockList without trying to merge
config.resolver.blockList = [
  /node_modules\/ws\/lib\/stream\.js$/,
  /node_modules\/ws\/index\.js$/,
];
 
module.exports = withNativeWind(config, { input: './src/assets/styles/global.css' })