import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import apiConfig from '../config/api.config';
import {
  deleteConversation,
  getConversationMessages,
  getConversations,
  knowledgeQA,
  knowledgeQAWithFile,
  saveConversation,
  streamKnowledgeQA,
  streamKnowledgeQAWithFile
} from '../utils/api';
import { useAuth } from './AuthContext';

// 创建聊天上下文
const ChatContext = createContext();

// 初始系统消息
const initialSystemMessage = {
  id: 'system-welcome',
  type: 'system',
  content: '欢迎使用5GC"智擎"知识库问答系统，请输入您的问题。',
  timestamp: new Date(),
};

// 聊天提供者组件
export const ChatProvider = ({ children }) => {
  // 状态管理
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([initialSystemMessage]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  // 模型和知识库设置
  const [selectedModel, setSelectedModel] = useState('qa'); // 默认使用问答模型
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true); // 默认使用知识库
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState('default'); // 默认知识库
  
  // 附件相关状态
  const [currentAttachment, setCurrentAttachment] = useState(null);
  const [isProcessingAttachment, setIsProcessingAttachment] = useState(false);
  
  // 获取认证上下文
  const { isAuthenticated, user } = useAuth();
  
  // 当用户登录后，加载会话历史
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    } else {
      // 如果用户未登录，重置状态
      setConversations([]);
      setCurrentConversationId(null);
      setMessages([initialSystemMessage]);
    }
  }, [isAuthenticated, user]);
  
  // 当选择不同会话时，加载会话消息
  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
    } else {
      // 如果没有选择会话，重置消息为初始状态
      setMessages([initialSystemMessage]);
    }
  }, [currentConversationId]);
  
  // 加载会话列表
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      if (response && Array.isArray(response)) {
        // 按照更新时间排序，最新的在前面
        const sortedConversations = response.sort((a, b) => {
          return new Date(b.updated_at) - new Date(a.updated_at);
        });
        setConversations(sortedConversations);
      }
    } catch (err) {
      console.error('加载会话失败:', err);
      setError(err.message || '加载会话失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 加载会话消息
  const loadConversationMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await getConversationMessages(conversationId);
      if (response && Array.isArray(response)) {
        // 按照时间排序消息
        const sortedMessages = response.sort((a, b) => {
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        // 转换为应用内的消息格式
        const formattedMessages = sortedMessages.map(message => ({
          id: message.id,
          type: message.role === 'user' ? 'user' : 'bot',
          content: message.content,
          timestamp: new Date(message.timestamp || message.created_at),
          feedback: message.feedback || null,
        }));
        
        // 确保始终有欢迎消息
        if (formattedMessages.length === 0 || formattedMessages[0].type !== 'system') {
          formattedMessages.unshift(initialSystemMessage);
        }
        
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('加载会话消息失败:', err);
      setError(err.message || '加载会话消息失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 创建新会话
  const createNewConversation = () => {
    // 重置当前会话和消息
    setCurrentConversationId(null);
    setMessages([initialSystemMessage]);
    setCurrentAttachment(null);
  };
  
  // 选择会话
  const selectConversation = (conversationId) => {
    setCurrentConversationId(conversationId);
    setCurrentAttachment(null);
  };
  
  // 设置当前附件
  const setAttachment = (file) => {
    setCurrentAttachment(file);
  };
  
  // 移除当前附件
  const removeAttachment = () => {
    setCurrentAttachment(null);
  };
  
  // 发送消息（包含可选的文件附件）
  const sendMessage = async (content) => {
    if (!content.trim() && !currentAttachment) return;
    
    try {
      setLoading(true);
      
      // 创建用户消息对象
      const userMessage = {
        id: uuidv4(),
        type: 'user',
        content: currentAttachment 
          ? `${content}\n[附件: ${currentAttachment.name}]` 
          : content,
        timestamp: new Date(),
        hasAttachment: !!currentAttachment,
        attachmentName: currentAttachment?.name
      };
      
      // 添加到消息列表
      setMessages(prev => [...prev, userMessage]);
      
      // 如果没有当前会话，创建一个新会话
      let conversationId = currentConversationId;
      if (!conversationId) {
        // 基于用户第一条消息创建会话标题
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        
        const newConversation = {
          id: uuidv4(),
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user?.id,
          messages: [
            {
              id: userMessage.id,
              role: 'user',
              content: userMessage.content,
              timestamp: userMessage.timestamp.toISOString(),
            }
          ]
        };
        
        // 保存新会话到服务器
        const saveResponse = await saveConversation(newConversation);
        if (saveResponse && saveResponse.id) {
          conversationId = saveResponse.id;
          setCurrentConversationId(conversationId);
          
          // 刷新会话列表
          await loadConversations();
        }
      } else {
        // 找到当前会话
        const currentConversation = conversations.find(conv => conv.id === conversationId);
        if (currentConversation) {
          // 更新会话的最后更新时间
          const updatedConversation = {
            ...currentConversation,
            updated_at: new Date().toISOString(),
            messages: [
              {
                id: userMessage.id,
                role: 'user',
                content: userMessage.content,
                timestamp: userMessage.timestamp.toISOString(),
              }
            ]
          };
          
          // 保存更新到服务器
          await saveConversation(updatedConversation);
        }
      }
      
      // 准备请求参数
      const requestData = {
        query: content,
        model: selectedModel,
        kb_name: selectedKnowledgeBase,
        use_kb: useKnowledgeBase,
        history: messages
          .filter(msg => msg.type !== 'system') // 排除系统消息
          .map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
      };
      
      // 处理带附件的请求
      if (currentAttachment) {
        setIsProcessingAttachment(true);
        
        if (isStreaming) {
          // 处理流式响应
          setIsStreaming(true);
          setStreamingContent('');
          
          // 创建临时助手消息
          const tempAssistantMessage = {
            id: uuidv4(),
            type: 'bot',
            content: '',
            timestamp: new Date(),
            isStreaming: true
          };
          
          // 添加临时消息
          setMessages(prev => [...prev, tempAssistantMessage]);
          
          // 处理流式响应
          let fullResponse = '';
          await streamKnowledgeQAWithFile(
            content,
            currentAttachment,
            useKnowledgeBase,
            selectedModel,
            selectedKnowledgeBase,
            chunk => {
              if (chunk.data && chunk.data.chunk) {
                fullResponse += chunk.data.chunk;
                setStreamingContent(fullResponse);
                
                // 更新消息列表中的临时消息
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && updated[lastIndex].id === tempAssistantMessage.id) {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: fullResponse
                    };
                  }
                  return updated;
                });
              }
            }
          );
          
          // 流式响应完成后
          setIsStreaming(false);
          
          // 创建最终的助手消息
          const assistantMessage = {
            id: tempAssistantMessage.id,
            type: 'bot',
            content: fullResponse,
            timestamp: new Date(),
          };
          
          // 更新消息列表，替换临时消息
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].id === tempAssistantMessage.id) {
              updated[lastIndex] = assistantMessage;
            }
            return updated;
          });
          
          // 保存助手回复到服务器
          if (conversationId) {
            // 找到当前会话
            const currentConversation = conversations.find(conv => conv.id === conversationId);
            if (currentConversation) {
              const updatedConversation = {
                ...currentConversation,
                updated_at: new Date().toISOString(),
                messages: [
                  {
                    id: assistantMessage.id,
                    role: 'assistant',
                    content: assistantMessage.content,
                    timestamp: assistantMessage.timestamp.toISOString(),
                  }
                ]
              };
              
              // 保存更新到服务器
              await saveConversation(updatedConversation);
            }
          }
        } else {
          // 处理普通响应
          const response = await knowledgeQAWithFile(
            content, 
            currentAttachment,
            useKnowledgeBase,
            selectedModel,
            selectedKnowledgeBase,
            false
          );
          
          if (response && response.data && response.data.content) {
            // 创建助手消息
            const assistantMessage = {
              id: uuidv4(),
              type: 'bot',
              content: response.data.content,
              timestamp: new Date(),
            };
            
            // 添加到消息列表
            setMessages(prev => [...prev, assistantMessage]);
            
            // 保存助手回复到服务器
            if (conversationId) {
              // 找到当前会话
              const currentConversation = conversations.find(conv => conv.id === conversationId);
              if (currentConversation) {
                const updatedConversation = {
                  ...currentConversation,
                  updated_at: new Date().toISOString(),
                  messages: [
                    {
                      id: assistantMessage.id,
                      role: 'assistant',
                      content: assistantMessage.content,
                      timestamp: assistantMessage.timestamp.toISOString(),
                    }
                  ]
                };
                
                // 保存更新到服务器
                await saveConversation(updatedConversation);
              }
            }
          } else {
            throw new Error('未收到有效响应');
          }
        }
        
        // 清除当前附件
        setCurrentAttachment(null);
        setIsProcessingAttachment(false);
      } else {
        // 发送不带附件的请求
        if (isStreaming) {
          // 处理流式响应
          setIsStreaming(true);
          setStreamingContent('');
          
          // 创建临时助手消息
          const tempAssistantMessage = {
            id: uuidv4(),
            type: 'bot',
            content: '',
            timestamp: new Date(),
            isStreaming: true
          };
          
          // 添加临时消息
          setMessages(prev => [...prev, tempAssistantMessage]);
          
          // 处理流式响应
          let fullResponse = '';
          await streamKnowledgeQA(requestData, chunk => {
            if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta) {
              const content = chunk.choices[0].delta.content || '';
              fullResponse += content;
              setStreamingContent(fullResponse);
              
              // 更新消息列表中的临时消息
              setMessages(prev => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (lastIndex >= 0 && updated[lastIndex].id === tempAssistantMessage.id) {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: fullResponse
                  };
                }
                return updated;
              });
            }
          });
          
          // 流式响应完成后
          setIsStreaming(false);
          
          // 创建最终的助手消息
          const assistantMessage = {
            id: tempAssistantMessage.id,
            type: 'bot',
            content: fullResponse,
            timestamp: new Date(),
          };
          
          // 更新消息列表，替换临时消息
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].id === tempAssistantMessage.id) {
              updated[lastIndex] = assistantMessage;
            }
            return updated;
          });
          
          // 保存助手回复到服务器
          if (conversationId) {
            // 找到当前会话
            const currentConversation = conversations.find(conv => conv.id === conversationId);
            if (currentConversation) {
              const updatedConversation = {
                ...currentConversation,
                updated_at: new Date().toISOString(),
                messages: [
                  {
                    id: assistantMessage.id,
                    role: 'assistant',
                    content: assistantMessage.content,
                    timestamp: assistantMessage.timestamp.toISOString(),
                  }
                ]
              };
              
              // 保存更新到服务器
              await saveConversation(updatedConversation);
            }
          }
        } else {
          // 处理普通响应
          const response = await knowledgeQA(requestData);
          
          if (response && response.choices && response.choices[0] && response.choices[0].message) {
            // 创建助手消息
            const assistantMessage = {
              id: uuidv4(),
              type: 'bot',
              content: response.choices[0].message.content,
              timestamp: new Date(),
            };
            
            // 添加到消息列表
            setMessages(prev => [...prev, assistantMessage]);
            
            // 保存助手回复到服务器
            if (conversationId) {
              // 找到当前会话
              const currentConversation = conversations.find(conv => conv.id === conversationId);
              if (currentConversation) {
                const updatedConversation = {
                  ...currentConversation,
                  updated_at: new Date().toISOString(),
                  messages: [
                    {
                      id: assistantMessage.id,
                      role: 'assistant',
                      content: assistantMessage.content,
                      timestamp: assistantMessage.timestamp.toISOString(),
                    }
                  ]
                };
                
                // 保存更新到服务器
                await saveConversation(updatedConversation);
              }
            }
          } else {
            throw new Error('未收到有效响应');
          }
        }
      }
    } catch (err) {
      console.error('发送消息失败:', err);
      setError(err.message || '发送消息失败');
      
      // 添加错误消息
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          type: 'system',
          content: `错误: ${err.message || '请求失败，请重试'}`,
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setIsProcessingAttachment(false);
    }
  };
  
  // 删除会话
  const deleteConversationById = async (id) => {
    try {
      setLoading(true);
      console.log(`=== 开始删除对话: ${id} ===`);
      
      // 先更新本地状态，提供即时反馈
      const updatedConversations = conversations.filter(conv => conv.id !== id);
      setConversations(updatedConversations);
      
      // 如果删除的是当前对话，重置当前对话
      if (id === currentConversationId) {
        setCurrentConversationId(null);
        setMessages([initialSystemMessage]);
      }
      
      // 检查token
      const token = await AsyncStorage.getItem('token');
      console.log(`=== 当前token状态: ${token ? '存在' : '不存在'} ===`);
      
      if (!token) {
        // 未登录状态只能本地删除
        Alert.alert('提示', '未登录状态下仅支持本地删除');
        return;
      }
      
      // 发送删除请求到服务器
      console.log(`=== 准备调用deleteConversation(${id}) ===`);
      try {
        const result = await deleteConversation(id);
        console.log(`=== 服务器删除结果: ===`, result);
        
        // 删除成功后刷新会话列表
        await loadConversations();
        console.log(`=== 会话列表已刷新 ===`);
      } catch (deleteError) {
        console.error(`=== deleteConversation调用失败: ===`, deleteError);
        throw deleteError;
      }
    } catch (err) {
      console.error(`=== 删除对话失败: ===`, err);
      Alert.alert('错误', `删除对话失败: ${err.message}`);
      
      // 删除失败，重新加载对话列表
      await loadConversations();
    } finally {
      setLoading(false);
    }
  };
  
  // 直接测试删除API - 用于UI直接调用
  const testDeleteAPI = async (id) => {
    try {
      setLoading(true);
      console.log(`=== 直接测试删除API: ${id} ===`);
      
      // 检查token
      const token = await AsyncStorage.getItem('token');
      console.log(`=== 当前token状态: ${token ? '存在' : '不存在'} ===`);
      
      if (!token) {
        Alert.alert('提示', '未登录状态下不能删除对话');
        return;
      }
      
      // 使用配置文件中的API地址
      const API_URL = apiConfig.API_BASE_URL;
      const url = `${API_URL}/api/chat-history/conversations/${id}`;
      
      console.log(`=== 直接发送DELETE请求到: ${url} ===`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`=== 测试删除API响应状态: ${response.status} ===`);
      
      try {
        const responseText = await response.text();
        console.log(`=== 测试删除API响应内容: ${responseText} ===`);
        
        // 响应成功
        if (response.ok) {
          // 更新本地状态
          setConversations(prev => prev.filter(conv => conv.id !== id));
          
          // 如果删除的是当前对话，重置当前对话
          if (id === currentConversationId) {
            setCurrentConversationId(null);
            setMessages([initialSystemMessage]);
          }
          
          // 刷新对话列表
          await loadConversations();
          Alert.alert('成功', '对话已删除');
        } else {
          Alert.alert('错误', `删除失败: ${response.status} ${responseText}`);
        }
      } catch (e) {
        console.error('解析响应失败:', e);
      }
    } catch (err) {
      console.error(`=== 直接API调用失败: ===`, err);
      Alert.alert('错误', `删除失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 提供的上下文值
  const value = {
    conversations,
    currentConversationId,
    messages,
    loading,
    error,
    isStreaming,
    streamingContent,
    selectedModel,
    useKnowledgeBase,
    selectedKnowledgeBase,
    currentAttachment,
    isProcessingAttachment,
    loadConversations,
    createNewConversation,
    selectConversation,
    sendMessage,
    deleteConversationById,
    testDeleteAPI,
    setSelectedModel,
    setUseKnowledgeBase,
    setSelectedKnowledgeBase,
    setIsStreaming,
    setAttachment,
    removeAttachment
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// 自定义钩子函数
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext; 