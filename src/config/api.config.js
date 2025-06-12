import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API配置文件
 * 支持动态切换服务节点
 */

// 服务节点配置
const NODES = {
  provincial: {
    name: '省端X节点',
    API_BASE_URL: 'http://111.19.156.74:8030',
    TIMEOUT: 30000,
    requiresVPN: false,
  },
  yanan: {
    name: '延安智算节点', 
    API_BASE_URL: 'http://172.16.20.20:8030',
    TIMEOUT: 30000,
    requiresVPN: true,
  }
};

// 当前选择的节点（默认省端）
let currentNode = 'provincial';

/**
 * 获取当前节点配置
 */
export const getCurrentNodeConfig = () => {
  return NODES[currentNode];
};

/**
 * 获取当前API基础URL
 */
export const getApiBaseUrl = () => {
  return NODES[currentNode].API_BASE_URL;
};

/**
 * 设置当前服务节点
 * @param {string} nodeKey - 节点键值 ('provincial' 或 'yanan')
 */
export const setCurrentNode = async (nodeKey) => {
  if (NODES[nodeKey]) {
    currentNode = nodeKey;
    // 保存到本地存储
    await AsyncStorage.setItem('selectedNode', nodeKey);
    console.log(`🔄 服务节点已切换到: ${NODES[nodeKey].name} (${NODES[nodeKey].API_BASE_URL})`);
  } else {
    console.error('❌ 无效的节点键值:', nodeKey);
  }
};

/**
 * 从本地存储加载已保存的节点选择
 */
export const loadSavedNode = async () => {
  try {
    const savedNode = await AsyncStorage.getItem('selectedNode');
    if (savedNode && NODES[savedNode]) {
      currentNode = savedNode;
      console.log(`📂 已加载保存的节点: ${NODES[savedNode].name}`);
    }
  } catch (error) {
    console.error('❌ 加载节点配置失败:', error);
  }
};

/**
 * 获取当前节点键值
 */
export const getCurrentNode = () => {
  return currentNode;
};

/**
 * 获取所有可用节点
 */
export const getAllNodes = () => {
  return NODES;
};

/**
 * 检查当前节点是否需要VPN
 */
export const requiresVPN = () => {
  return NODES[currentNode].requiresVPN;
};

// 默认配置（向后兼容）
const defaultConfig = {
  get API_BASE_URL() {
    return getApiBaseUrl();
  },
  get TIMEOUT() {
    return getCurrentNodeConfig().TIMEOUT;
  }
};

export default defaultConfig; 