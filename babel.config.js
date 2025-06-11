module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 添加class static blocks支持
      '@babel/plugin-transform-class-static-block'
    ],
  };
}; 