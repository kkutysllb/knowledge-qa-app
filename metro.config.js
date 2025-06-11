// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 添加WebView的别名配置，将react-native-webview指向react-native-web-webview
// 这是为了在Web平台上支持WebView组件
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-webview': 'react-native-web-webview',
};

module.exports = config; 