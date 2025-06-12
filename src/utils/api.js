import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { getApiBaseUrl } from '../config/api.config';

/**
 * 加密密码函数 - 使用SHA-256哈希，生成64位小写十六进制字符串
 * @param {string} password - 明文密码
 * @returns {Promise<string>} - 加密后的密码
 */
export const encryptPassword = async (password) => {
  try {
    // 使用SHA-256生成摘要，返回64位小写十六进制字符串
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    // 确保返回的是小写字符串
    return digest.toLowerCase();
  } catch (error) {
    console.error('密码加密失败:', error);
    // 加密失败时返回原始密码
    return password;
  }
};

/**
 * 封装的API请求函数
 * @param {string} endpoint - API端点
 * @param {Object} options - fetch选项
 * @returns {Promise<any>} 响应数据
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // 获取认证令牌
    const token = await AsyncStorage.getItem('token');
    
    // 设置默认headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // 如果有token，添加到headers
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('API请求缺少认证令牌 - 可能是登录请求');
    }
    
    // 构建完整URL - 使用动态API地址
    const url = `${getApiBaseUrl()}${endpoint}`;
    console.log(`🌐 API请求: ${options.method || 'GET'} ${url}`);
    console.log(`📋 请求头:`, headers);
    if (options.body) {
      console.log(`📦 请求体:`, options.body);
    }
    
    // 发送请求
    const response = await fetch(url, {
      ...options,
      headers,
      timeout: 10000, // 10秒超时
    });
    
    console.log(`✅ 响应状态: ${response.status} ${response.statusText}`);
    
    // 检查响应状态
    if (!response.ok) {
      // 如果是401错误（未授权），清除令牌并提示用户重新登录
      if (response.status === 401) {
        console.error('❌ 未授权访问，需要重新登录');
        await AsyncStorage.removeItem('token');
        throw new Error('登录已过期，请重新登录');
      }
      
      const errorText = await response.text();
      console.error(`❌ 请求失败详情:`, errorText);
      throw new Error(`请求失败: ${response.status} ${response.statusText}\n详情: ${errorText}`);
    }
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonResponse = await response.json();
      console.log(`📄 JSON响应:`, jsonResponse);
      return jsonResponse;
    }
    
    const textResponse = await response.text();
    console.log(`📄 文本响应:`, textResponse);
    return textResponse;
  } catch (error) {
    // 详细的错误分类
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      console.error('❌ 网络连接失败 - 可能原因:');
      console.error('  1. 服务器不可达');
      console.error('  2. HTTP请求被阻止（需要HTTPS）');
      console.error('  3. 防火墙阻止连接');
      console.error('  4. 手机网络问题');
      throw new Error('网络连接失败，请检查网络设置和服务器状态');
    } else if (error.name === 'AbortError') {
      console.error('❌ 请求超时');
      throw new Error('请求超时，请检查网络连接');
    } else {
      console.error('❌ API请求错误:', error);
      throw error;
    }
  }
};

/**
 * 选择文档文件（PDF、Word、Excel等）
 * @returns {Promise<DocumentPicker.DocumentResult>} 选择结果
 */
export const pickDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',                                                     // PDF
        'application/msword',                                                  // DOC
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/vnd.ms-excel',                                            // XLS
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',   // XLSX
        'application/vnd.ms-powerpoint',                                       // PPT
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
        'text/plain',                                                          // TXT
        'text/csv',                                                            // CSV
        'text/markdown'                                                        // MD
      ],
      copyToCacheDirectory: true
    });
    
    return result;
  } catch (error) {
    console.error('选择文档失败:', error);
    throw error;
  }
};

/**
 * 选择图片
 * @returns {Promise<ImagePicker.ImagePickerResult>} 选择结果
 */
export const pickImage = async () => {
  try {
    // 请求媒体库权限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('需要相册权限才能选择图片');
    }
    
    // 支持的图片类型包括: jpg, jpeg, png, bmp, gif, tiff
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    
    return result;
  } catch (error) {
    console.error('选择图片失败:', error);
    throw error;
  }
};

/**
 * 带文件上传的知识库问答请求
 * @param {string} query - 问题内容
 * @param {Object} file - 文件对象，包含uri、name、type等
 * @param {boolean} useKb - 是否使用知识库
 * @param {string} model - 使用的模型名称
 * @param {string} kbName - 知识库名称
 * @param {boolean} stream - 是否使用流式响应
 * @returns {Promise<Object>} 知识库问答响应
 */
export const knowledgeQAWithFile = async (
  query,
  file,
  useKb = true,
  model = 'default',
  kbName = 'default',
  stream = false
) => {
  try {
    // 获取认证令牌
    const token = await AsyncStorage.getItem('token');
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('query', query);
    
    // 确保布尔值以正确格式发送
    formData.append('use_kb', useKb ? 'true' : 'false');
    formData.append('stream', stream ? 'true' : 'false');
    
    // 其他参数
    formData.append('model', model);
    if (kbName) {
      formData.append('kb_name', kbName);
    }
    
    // 添加缺少的参数，与Web端保持一致
    formData.append('temperature', '0.7');
    formData.append('max_tokens', '8192');
    
    // 添加文件 - 解决422错误的关键修复
    if (file) {
      const fileName = file.name || `file_${Date.now()}`;
      const fileType = file.mimeType || file.type || 'application/octet-stream';
      
      console.log('文件上传信息:', {
        fileName,
        fileType,
        uri: file.uri
      });
      
      // 关键修复：读取文件内容并创建真正的Blob对象
      try {
        // 使用fetch读取文件内容
        const fileResponse = await fetch(file.uri);
        const fileBlob = await fileResponse.blob();
        
        console.log('文件Blob信息:', {
          size: fileBlob.size,
          type: fileBlob.type
        });
        
        // 将Blob对象添加到FormData，这样服务器就能正确识别为文件
        formData.append('file', fileBlob, fileName);
        
      } catch (fileError) {
        console.error('读取文件失败:', fileError);
        // 如果Blob方法失败，回退到原始方法
        formData.append('file', {
          uri: file.uri,
          name: fileName,
          type: fileType
        });
      }
    }
    
    // 设置headers - 不要手动设置Content-Type
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 构建URL
    const url = `${getApiBaseUrl()}/api/workflows/knowledge-qa/upload`;
    
    console.log('发送文件上传请求:', {
      url,
      query: query.substring(0, 50) + '...',
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.mimeType || file?.type,
      useKb,
      model,
      kbName,
      stream
    });
    
    // 调试：输出FormData的内容（仅开发环境）
    if (__DEV__) {
      console.log('FormData内容:');
      for (let [key, value] of formData.entries()) {
        if (key === 'file') {
          if (value instanceof Blob) {
            console.log(`${key}:`, {
              type: 'Blob',
              size: value.size,
              mimeType: value.type
            });
          } else {
            console.log(`${key}:`, {
              name: value.name,
              type: value.type,
              uri: value.uri?.substring(0, 50) + '...'
            });
          }
        } else {
          console.log(`${key}:`, value);
        }
      }
    }
    
    // 如果是流式响应，返回处理函数
    if (stream) {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        // 获取详细错误信息
        let errorMessage = `Stream request failed: ${response.status}`;
        try {
          const errorText = await response.text();
          console.log('服务器错误响应:', errorText);
          
          // 尝试解析JSON错误
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.detail || errorMessage;
          } catch (e) {
            // 如果不是JSON，使用原始文本
            if (errorText) {
              errorMessage = `${errorMessage}: ${errorText.substring(0, 200)}`;
            }
          }
        } catch (e) {
          console.error('无法读取错误响应:', e);
        }
        
        throw new Error(errorMessage);
      }
      
      return response;
    } else {
      // 普通响应
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        // 获取详细错误信息
        let errorMessage = `请求失败: ${response.status}`;
        try {
          const errorText = await response.text();
          console.log('服务器错误响应:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.detail || errorMessage;
          } catch (e) {
            if (errorText) {
              errorMessage = `${errorMessage}: ${errorText.substring(0, 200)}`;
            }
          }
        } catch (e) {
          console.error('无法读取错误响应:', e);
        }
        
        throw new Error(errorMessage);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    }
  } catch (error) {
    console.error('文件上传问答请求失败:', error);
    throw error;
  }
};

/**
 * 登录API
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} 登录响应
 */
export const login = async (username, password) => {
  // 先使用SHA-256哈希加密密码
  const encryptedPassword = await encryptPassword(password);
  
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password: encryptedPassword }),
  });
};

/**
 * 获取用户信息
 * @returns {Promise<Object>} 用户信息
 */
export const getUserInfo = async () => {
  return apiRequest('/api/auth/me');
};

/**
 * 获取历史对话列表
 * @returns {Promise<Array>} 对话列表
 */
export const getConversations = async () => {
  return apiRequest('/api/chat-history/conversations');
};

/**
 * 获取单个对话的消息
 * @param {string} conversationId - 对话ID
 * @returns {Promise<Array>} 消息列表
 */
export const getConversationMessages = async (conversationId) => {
  return apiRequest(`/api/chat-history/conversations/${conversationId}/messages`);
};

/**
 * 创建或更新对话
 * @param {Object} conversation - 对话数据
 * @returns {Promise<Object>} 创建结果
 */
export const saveConversation = async (conversation) => {
  return apiRequest('/api/chat-history/conversations', {
    method: 'POST',
    body: JSON.stringify(conversation),
  });
};

/**
 * 删除对话
 * @param {string} conversationId - 对话ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteConversation = async (conversationId) => {
  try {
    // 获取认证令牌
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      throw new Error('未登录或登录已过期，请重新登录');
    }
    
    // 构建请求URL，确保格式正确
    const url = `${getApiBaseUrl()}/api/chat-history/conversations/${conversationId}`;
    
    console.log(`发送删除请求到: ${url}`);
    console.log(`使用的认证令牌: ${token.substring(0, 10)}...`);
    
    // 严格按照示例中的请求格式发送DELETE请求
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`删除请求响应状态: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`删除请求失败，状态码: ${response.status}, 响应内容: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('登录已过期，请重新登录');
      } else {
        throw new Error(`删除失败: ${response.status} ${errorText}`);
      }
    }
    
    // 尝试解析响应
    try {
      const result = await response.json();
      console.log(`删除成功，响应:`, result);
      return result;
    } catch (e) {
      // 如果响应不是JSON格式，直接返回成功消息
      console.log(`删除成功，但响应不是JSON格式`);
      return { message: '删除成功' };
    }
  } catch (error) {
    console.error('删除对话API错误:', error);
    throw error;
  }
};

/**
 * 发送知识库问答请求
 * @param {Object} data - 问答请求数据
 * @returns {Promise<Object>} 知识库问答响应
 */
export const knowledgeQA = async (data) => {
  return apiRequest('/api/workflows/knowledge-qa', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * 流式知识库问答请求
 * @param {Object} data - 问答请求数据
 * @param {Function} onChunk - 处理每个响应块的回调
 * @returns {Promise<void>}
 */
export const streamKnowledgeQA = async (data, onChunk) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 设置流式数据
    data.stream = true;
    
    const response = await fetch(`${getApiBaseUrl()}/api/workflows/knowledge-qa`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // 读取流
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // 解码内容
      const chunk = decoder.decode(value, { stream: true });
      
      // 处理SSE格式
      const lines = chunk.split('\n\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data === '[DONE]') {
            // 流结束
            break;
          }
          
          try {
            // 解析JSON
            const parsedData = JSON.parse(data);
            onChunk(parsedData);
          } catch (e) {
            console.error('解析响应块错误:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('流式请求错误:', error);
    throw error;
  }
};

/**
 * 流式带文件上传的知识库问答请求
 * @param {string} query - 问题内容
 * @param {Object} file - 文件对象
 * @param {boolean} useKb - 是否使用知识库
 * @param {string} model - 使用的模型名称
 * @param {string} kbName - 知识库名称
 * @param {Function} onChunk - 处理每个响应块的回调
 * @returns {Promise<void>}
 */
export const streamKnowledgeQAWithFile = async (
  query,
  file,
  useKb = true,
  model = 'default',
  kbName = 'default',
  onChunk
) => {
  try {
    const response = await knowledgeQAWithFile(
      query,
      file,
      useKb,
      model,
      kbName,
      true
    );
    
    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // 读取流
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // 解码内容
      const chunk = decoder.decode(value, { stream: true });
      
      // 处理SSE格式
      const lines = chunk.split('\n\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data === '[DONE]') {
            // 流结束
            break;
          }
          
          try {
            // 解析JSON
            const parsedData = JSON.parse(data);
            onChunk(parsedData);
          } catch (e) {
            console.error('解析响应块错误:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('流式文件上传请求错误:', error);
    throw error;
  }
};

/**
 * 发送消息反馈（点赞/点踩）
 * @param {string} messageId - 消息ID
 * @param {string} feedback - 反馈类型，'like'或'dislike'
 * @param {string} comment - 反馈评论（可选，主要用于点踩时）
 * @returns {Promise<Object>} - 反馈响应
 */
export const sendMessageFeedback = async (messageId, feedback, comment = '') => {
  try {
    return await apiRequest('/api/chat-history/feedback', {
      method: 'POST',
      body: JSON.stringify({
        message_id: messageId,
        feedback_type: feedback,
        comment: comment
      })
    });
  } catch (error) {
    console.error('发送消息反馈失败:', error);
    throw error;
  }
};

/**
 * 更新知识库反馈
 * @param {string} question - 用户问题
 * @param {string} answer - AI回答
 * @param {string} feedbackType - 反馈类型：'correct'或'incorrect'
 * @param {string} correction - 当反馈为'incorrect'时的更正内容
 * @param {string} knowledgeBaseId - 知识库ID
 * @returns {Promise<Object>} - 反馈响应
 */
export const sendKnowledgeFeedback = async (
  question,
  answer,
  feedbackType,
  correction = '',
  knowledgeBaseId = 'default'
) => {
  try {
    return await apiRequest('/api/workflows/knowledge-base/feedback', {
      method: 'POST',
      body: JSON.stringify({
        question,
        answer,
        feedback_type: feedbackType,
        correction,
        kb_name: knowledgeBaseId,
        vector_store_type: "lancedb"
      })
    });
  } catch (error) {
    console.error('发送知识库反馈失败:', error);
    throw new Error(`知识库反馈失败: ${error.message}`);
  }
};

export default {
  login,
  getUserInfo,
  getConversations,
  getConversationMessages,
  saveConversation,
  deleteConversation,
  knowledgeQA,
  streamKnowledgeQA,
  pickDocument,
  pickImage,
  knowledgeQAWithFile,
  streamKnowledgeQAWithFile,
  sendMessageFeedback,
  sendKnowledgeFeedback,
}; 