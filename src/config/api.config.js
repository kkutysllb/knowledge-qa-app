/**
 * API配置文件
 * 包含API基础URL和其他API相关配置
 */

// 不同环境的API配置
const ENV = {
  development: {
    API_BASE_URL: 'http://172.16.20.20:8030',
    TIMEOUT: 30000, // 30秒
  },
  production: {
    API_BASE_URL: 'http://172.16.20.20:8030', // 生产环境地址，后续可以替换
    TIMEOUT: 30000,
  },
  test: {
    API_BASE_URL: 'http://172.16.20.20:8030', // 测试环境地址
    TIMEOUT: 30000,
  }
};

// 获取当前环境
// 在React Native中，可以通过process.env.NODE_ENV或__DEV__全局变量确定环境
const currentEnv = __DEV__ ? 'development' : 'production';

// 导出当前环境的配置
export default ENV[currentEnv]; 