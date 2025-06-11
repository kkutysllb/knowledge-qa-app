import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import apiConfig from '../config/api.config';
import {
  apiRequest,
  deleteConversation,
  getConversationMessages,
  getConversations,
  saveConversation,
  streamKnowledgeQA,
  streamKnowledgeQAWithFile
} from '../utils/api';
import { useAuth } from './AuthContext';

// 创建聊天上下文
const ChatContext = createContext();

// 助手名称和描述 - 与web端保持一致
const ASSISTANT_NAME = '小智·小擎';
const ASSISTANT_DESCRIPTION = '5G核心网"智擎"网络运行安全平台的智能助手。';

// 初始系统消息
const initialSystemMessage = {
  id: 'system-welcome',
  role: 'assistant',
  content: `欢迎使用5G核心网"智擎"网络运行安全平台，我是您的智能助手${ASSISTANT_NAME}。

我可以为您实时分析网络状态、资源指标、告警与故障，提供智能分析和关联预案建议，支持投诉分析和定制化故障分析任务。

平台通过底层建模、云资源池和上层应用，分布式领域5G云化核心网安全、系统集成及大模型、RAG知识库、智能Agent，助力智能分析与决策。`,
  timestamp: new Date(),
  thinking: '',
  citations: []
};

// 存储密钥常量 - 与web端保持一致
const STORAGE_KEY = 'chatHistory';

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
  
  // 同步状态
  const [needsSync, setNeedsSync] = useState(false);
  
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
  
  // 保存历史记录到本地存储
  const saveHistoryToLocalStorage = async (history) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      console.log('历史记录已保存到本地存储');
    } catch (error) {
      console.error('保存历史记录到本地存储失败:', error);
    }
  };
  
  // 从本地存储加载历史记录
  const loadHistoryFromLocalStorage = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        console.log('从本地存储加载的历史记录:', parsedHistory.length);
        return parsedHistory;
      }
    } catch (error) {
      console.error('从本地存储加载历史记录失败:', error);
    }
    return [];
  };
  
  // 同步历史记录到服务器
  const syncToServer = async (conversation) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return false; // 如果没有登录，不同步
      
      // 准备数据，确保符合后端API期望的格式
      console.log('准备同步会话:', conversation.id, '消息数量:', conversation.messages?.length || 0);
      
      const serverConversation = {
        id: conversation.id,
        title: conversation.title,
        created_at: new Date(conversation.createdAt).toISOString(),
        updated_at: new Date(conversation.updatedAt).toISOString(),
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          conversation_id: conversation.id,
          role: msg.role || (msg.type === 'user' ? 'user' : 'assistant'),
          content: msg.content,
          timestamp: new Date(msg.timestamp).toISOString(),
          thinking: msg.thinking,
          citations: msg.citations,
          feedback: msg.feedback,
          file_info: msg.fileInfo || msg.hasAttachment ? { name: msg.attachmentName } : undefined
        }))
      };
      
      // 调用保存会话API
      const saveResult = await saveConversation(serverConversation);
      if (saveResult && saveResult.id) {
        console.log(`会话 ${conversation.id} 同步成功`);
        return true;
      } else {
        console.error('会话同步失败');
        return false;
      }
    } catch (error) {
      console.error('同步到服务器失败:', error);
      return false;
    }
  };
  
  // 标准化时间戳
  const normalizeTimestamp = (timestamp) => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  };
  
  // 加载会话列表
  const loadConversations = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // 检查是否有token，如果没有token就不从服务器加载
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        // 没有token，只加载本地数据
        const localHistory = await loadHistoryFromLocalStorage();
        if (localHistory && localHistory.length > 0) {
          setConversations(localHistory);
        } else {
          setConversations([]);
        }
        setLoading(false);
        return;
      }
      
      // 有token，优先从服务器加载（除非强制使用本地缓存）
      try {
        console.log('从服务器加载会话列表...');
        const response = await getConversations();
        if (response && Array.isArray(response)) {
          // 按照更新时间排序，最新的在前面
          const sortedConversations = response.sort((a, b) => {
            return new Date(b.updated_at) - new Date(a.updated_at);
          });
          
          // 转换为应用内格式
          const formattedConversations = sortedConversations.map(conv => ({
            id: conv.id,
            title: conv.title,
            createdAt: normalizeTimestamp(conv.created_at),
            updatedAt: normalizeTimestamp(conv.updated_at),
            messages: [], // 消息列表初始为空，需要时再加载
            synced: true
          }));
          
          console.log(`从服务器加载了 ${formattedConversations.length} 个会话`);
          setConversations(formattedConversations);
          
          // 保存到本地存储
          await saveHistoryToLocalStorage(formattedConversations);
          return;
        }
      } catch (serverError) {
        console.error('从服务器加载会话失败，尝试使用本地缓存:', serverError);
        
        // 服务器加载失败，尝试使用本地缓存
        const localHistory = await loadHistoryFromLocalStorage();
        if (localHistory && localHistory.length > 0) {
          console.log(`使用本地缓存，加载了 ${localHistory.length} 个会话`);
          setConversations(localHistory);
        } else {
          setConversations([]);
        }
      }
    } catch (err) {
      console.error('加载会话失败:', err);
      setError(err.message || '加载会话失败');
      
      // 出错时尝试加载本地缓存
      try {
        const localHistory = await loadHistoryFromLocalStorage();
        if (localHistory && localHistory.length > 0) {
          setConversations(localHistory);
        } else {
          setConversations([]);
        }
      } catch (localError) {
        console.error('加载本地缓存也失败:', localError);
        setConversations([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 加载会话消息
  const loadConversationMessages = async (conversationId) => {
    try {
      setLoading(true);
      
      // 查找本地会话
      const localConversation = conversations.find(conv => conv.id === conversationId);
      
      // 如果本地会话有完整消息列表，直接使用
      if (localConversation && localConversation.messages && localConversation.messages.length > 0) {
        console.log(`使用本地缓存的会话消息: ${localConversation.messages.length} 条`);
        
        // 确保格式正确并按时间排序
        const sortedMessages = [...localConversation.messages].sort((a, b) => {
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        // 确保始终有欢迎消息
        if (sortedMessages.length === 0 || (sortedMessages[0].role !== 'system' && sortedMessages[0].type !== 'system')) {
          sortedMessages.unshift(initialSystemMessage);
        }
        
        setMessages(sortedMessages);
        setLoading(false);
        return;
      }
      
      // 从服务器加载消息
      const response = await getConversationMessages(conversationId);
      if (response && Array.isArray(response)) {
        // 按照时间排序消息
        const sortedMessages = response.sort((a, b) => {
          return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        console.log(`从服务器加载会话消息: ${sortedMessages.length} 条`);
        
        // 转换为应用内的消息格式
        const formattedMessages = sortedMessages.map(message => ({
          id: message.id,
          role: message.role,
          type: message.role === 'user' ? 'user' : 'bot', // 保持与旧代码的兼容性
          content: message.content,
          timestamp: new Date(message.timestamp || message.created_at),
          thinking: message.thinking || '',
          citations: message.citations || [],
          feedback: message.feedback || null,
          fileInfo: message.file_info || null,
          hasAttachment: !!message.file_info,
          attachmentName: message.file_info?.name || null
        }));
        
        // 确保始终有欢迎消息
        if (formattedMessages.length === 0 || (formattedMessages[0].role !== 'system' && formattedMessages[0].type !== 'system')) {
          formattedMessages.unshift(initialSystemMessage);
        }
        
        setMessages(formattedMessages);
        
        // 更新本地会话的消息列表
        const updatedConversations = conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: formattedMessages
            };
          }
          return conv;
        });
        
        setConversations(updatedConversations);
        
        // 保存到本地存储
        await saveHistoryToLocalStorage(updatedConversations);
      }
    } catch (err) {
      console.error('加载会话消息失败:', err);
      setError(err.message || '加载会话消息失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 创建新会话
  const createNewConversation = async () => {
    try {
      setLoading(true);
      
      // 清空状态
      setMessages([initialSystemMessage]);
      setStreamingContent('');
      setCurrentConversationId(null);
      setCurrentAttachment(null);
      
      console.log('新对话已创建');
      
    } catch (error) {
      console.error('创建新对话出错:', error);
      setError(error.message);
      
      // 添加错误消息
      setMessages([
        {
          id: 'error-' + Date.now(),
          content: `创建新对话时出错: ${error.message}`,
          type: 'system',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // 选择会话
  const selectConversation = async (conversationId) => {
    try {
      setLoading(true);
      setCurrentConversationId(conversationId);
      setMessages([]);
      setStreamingContent('');
      setCurrentAttachment(null);
      
      // 查找本地存储中的会话
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (conversation && conversation.messages) {
        // 使用本地数据
        setMessages(conversation.messages);
        return;
      }
      
      // 如果本地没有消息数据，尝试从API获取
      try {
        // 获取对话历史
        const data = await apiRequest(`/api/conversations/${conversationId}/messages`, {
          method: 'GET',
        });
        
        console.log('获取到对话历史:', data);
        
        if (data && Array.isArray(data)) {
          // 过滤掉系统设定消息
          const filteredMessages = data.filter(msg => {
            // 排除包含系统设定的消息
            if (msg.role === 'system' || msg.type === 'system') {
              const content = msg.content || '';
              if (content.includes("欢迎使用5G核心网") || 
                  content.includes("智擎") ||
                  content.includes("我是您的智能助手")) {
                return false;
              }
            }
            return true;
          });
          
          setMessages(filteredMessages);
        }
      } catch (error) {
        console.error('从API获取对话历史失败:', error);
        // 失败后仍使用本地数据
        if (conversation && conversation.messages) {
          setMessages(conversation.messages);
        }
      }
      
    } catch (error) {
      console.error('选择对话出错:', error);
      setError(error.message);
      
      // 添加错误消息
      setMessages([
        {
          id: 'error-' + Date.now(),
          content: `选择对话时出错: ${error.message}`,
          type: 'system',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
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
    
    // 创建AI响应消息占位符的ID，使其在try/catch块外可见
    const assistantMessageId = uuidv4();
    
    try {
      setLoading(true);
      
      // 如果有上传文件，在发送前设置处理状态
      if (currentAttachment) {
        setIsProcessingAttachment(true);
      }
      
      // 准备用户消息内容，如果有上传文件，则在消息中包含文件信息
      let userContent = content.trim();
      if (currentAttachment) {
        // 在消息开头添加文件信息
        userContent = `[文件: ${currentAttachment.name}] ${userContent}`;
      }
      
      // 创建用户消息对象
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        type: 'user', // 保持与旧代码的兼容性
        content: userContent,
        timestamp: new Date(),
        // 将文件信息保存到消息中
        fileInfo: currentAttachment ? {
          name: currentAttachment.name,
          type: currentAttachment.mimeType || currentAttachment.type,
          size: currentAttachment.size
        } : undefined,
        hasAttachment: !!currentAttachment,
        attachmentName: currentAttachment?.name
      };
      
      // 添加用户消息到对话中
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // 创建AI响应消息占位符
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        type: 'bot', // 保持与旧代码的兼容性
        content: '',
        timestamp: new Date(),
        loading: true,
        thinking: '',
        citations: []
      };
      
      // 添加AI响应消息到对话
      setMessages([...updatedMessages, assistantMessage]);
      
      // 如果没有当前会话，创建一个新会话
      let conversationId = currentConversationId;
      let currentConversation;
      
      if (!conversationId) {
        // 创建新会话
        conversationId = uuidv4();
        
        // 基于用户第一条消息创建会话标题
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        
        currentConversation = {
          id: conversationId,
          title,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: user?.id,
          messages: [userMessage, assistantMessage],
          synced: false
        };
        
        // 添加到会话列表
        setConversations(prev => [currentConversation, ...prev]);
        setCurrentConversationId(conversationId);
      } else {
        // 更新现有会话
        currentConversation = conversations.find(conv => conv.id === conversationId);
        
        if (currentConversation) {
          currentConversation = {
            ...currentConversation,
            updatedAt: new Date(),
            messages: [...(currentConversation.messages || []), userMessage, assistantMessage],
            synced: false
          };
          
          // 更新会话列表
          setConversations(prev => 
            prev.map(conv => conv.id === conversationId ? currentConversation : conv)
          );
        }

      }
      
      // 保存更新后的会话到本地存储
      if (currentConversation) {
        await saveHistoryToLocalStorage([...conversations]);
      }
      
      // 如果是流式响应，开始流式响应处理
      setIsStreaming(true);
      setStreamingContent('');
      
      // 准备请求参数
      const requestData = {
        query: content,
        model: selectedModel,
        kb_name: selectedKnowledgeBase,
        use_kb: useKnowledgeBase,
        history: messages
          .filter(msg => msg.type !== 'system' && msg.role !== 'system') // 排除系统消息
          .map(msg => ({
            role: msg.role || (msg.type === 'user' ? 'user' : 'assistant'),
            content: msg.content
          }))
      };
      
      // 处理带附件的请求
      if (currentAttachment) {
        try {
          // 使用流式响应处理附件上传请求
          let fullResponse = '';
          let fullThinking = '';
          let citations = [];
          
          await streamKnowledgeQAWithFile(
            content,
            currentAttachment,
            useKnowledgeBase,
            selectedModel,
            selectedKnowledgeBase,
            chunk => {
              // 处理数据块
              if (chunk.success && chunk.data) {
                if (chunk.data.chunk) {
                  // 处理内容块
                  const newContent = chunk.data.chunk;
                  
                  // 从chunk中提取思考过程，并保存到fullThinking
                  if (newContent.includes('<think>') && newContent.includes('</think>')) {
                    const thinkMatch = /<think>([\s\S]*?)<\/think>/g.exec(newContent);
                    if (thinkMatch && thinkMatch[1]) {
                      fullThinking += thinkMatch[1] + '\n';
                    }
                  }
                  
                  // 从内容中移除<think>标签后再添加到fullResponse
                  const cleanedContent = newContent.replace(/<think>[\s\S]*?<\/think>/g, '');
                  fullResponse += cleanedContent;
                  setStreamingContent(fullResponse);
                  
                  // 添加调试日志
                  console.log('接收到流式响应块:', {
                    chunkLength: newContent.length,
                    cleanedLength: cleanedContent.length,
                    fullResponseLength: fullResponse.length
                  });
                  
                  // 更新消息列表中的助手消息
                  setMessages(prev => {
                    const updated = [...prev];
                    const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
                    if (assistantIndex >= 0) {
                      updated[assistantIndex] = {
                        ...updated[assistantIndex],
                        content: fullResponse,
                        thinking: fullThinking,
                        hasThinking: fullThinking.trim().length > 0,
                        loading: false
                      };
                    }
                    return updated;
                  });
                } else if (chunk.data.type === 'citations') {
                  // 处理引用信息
                  if (chunk.data.citations && Array.isArray(chunk.data.citations)) {
                    citations = chunk.data.citations;
                    
                    // 更新消息列表中的助手消息
                    setMessages(prev => {
                      const updated = [...prev];
                      const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
                      if (assistantIndex >= 0) {
                        updated[assistantIndex] = {
                          ...updated[assistantIndex],
                          citations: citations
                        };
                      }
                      return updated;
                    });
                  }
                }
              }
            }
          );
          
          // 流式响应完成后，更新最终消息
          const finalAssistantMessage = {
            id: assistantMessageId,
            role: 'assistant',
            type: 'bot',
            content: fullResponse,
            timestamp: new Date(),
            thinking: fullThinking,
            hasThinking: fullThinking.trim().length > 0,
            citations: citations,
            loading: false
          };
          
          // 添加调试日志
          console.log('流式响应完成:', {
            messageId: assistantMessageId,
            contentLength: fullResponse.length,
            hasThinking: fullThinking.length > 0,
            hasCitations: citations.length > 0
          });
          
          // 更新消息列表
          setMessages(prev => {
            const updated = [...prev];
            const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
            if (assistantIndex >= 0) {
              updated[assistantIndex] = finalAssistantMessage;
            }
            return updated;
          });
          
          // 更新当前会话
          if (conversationId) {
            const updatedConversation = conversations.find(conv => conv.id === conversationId);
            if (updatedConversation) {
              const updatedWithMessage = {
                ...updatedConversation,
                updatedAt: new Date(),
                messages: updatedConversation.messages.map(msg => 
                  msg.id === assistantMessageId ? finalAssistantMessage : msg
                )
              };
              
              // 更新会话列表
              setConversations(prev => 
                prev.map(conv => conv.id === conversationId ? updatedWithMessage : conv)
              );
              
              // 保存到本地存储
              await saveHistoryToLocalStorage([...conversations]);
              
              // 尝试同步到服务器
              setNeedsSync(true);
              await syncToServer(updatedWithMessage);
            }
          }
        } finally {
          // 清除当前附件
          setCurrentAttachment(null);
          setIsProcessingAttachment(false);
        }
      } else {
        // 处理不带附件的请求
        try {
          // 使用流式响应
          let fullResponse = '';
          let fullThinking = '';
          let citations = [];
          
          await streamKnowledgeQA(requestData, chunk => {
            // 添加调试日志
            console.log('接收到流式响应:', chunk);
            
            // 处理OpenAI格式的数据块
            if (chunk.choices && chunk.choices[0]) {
              const content = chunk.choices[0].delta?.content || '';
              if (content) {
                // 从chunk中提取思考过程，并保存到fullThinking
                if (content.includes('<think>') && content.includes('</think>')) {
                  const thinkMatch = /<think>([\s\S]*?)<\/think>/g.exec(content);
                  if (thinkMatch && thinkMatch[1]) {
                    fullThinking += thinkMatch[1] + '\n';
                  }
                }
                
                // 从内容中移除<think>标签后再添加到fullResponse
                const cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/g, '');
                fullResponse += cleanedContent;
                setStreamingContent(fullResponse);
                
                // 添加调试日志
                console.log('处理OpenAI格式响应:', {
                  chunkLength: content.length,
                  cleanedLength: cleanedContent.length,
                  fullResponseLength: fullResponse.length
                });
                
                // 更新消息列表中的助手消息
                setMessages(prev => {
                  const updated = [...prev];
                  const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
                  if (assistantIndex >= 0) {
                    updated[assistantIndex] = {
                      ...updated[assistantIndex],
                      content: fullResponse,
                      thinking: fullThinking,
                      hasThinking: fullThinking.trim().length > 0,
                      loading: false
                    };
                  }
                  return updated;
                });
              }
            } else if (chunk.type === 'thinking') {
              // 处理思考过程
              fullThinking += chunk.content + '\n';
              
              // 更新消息列表中的助手消息
              setMessages(prev => {
                const updated = [...prev];
                const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
                if (assistantIndex >= 0) {
                  updated[assistantIndex] = {
                    ...updated[assistantIndex],
                    thinking: fullThinking
                  };
                }
                return updated;
              });
            } else if (chunk.type === 'citations') {
              // 处理引用信息
              if (chunk.citations && Array.isArray(chunk.citations)) {
                citations = chunk.citations;
                
                // 更新消息列表中的助手消息
                setMessages(prev => {
                  const updated = [...prev];
                  const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
                  if (assistantIndex >= 0) {
                    updated[assistantIndex] = {
                      ...updated[assistantIndex],
                      citations: citations
                    };
                  }
                  return updated;
                });
              }
            } else if (chunk.success && chunk.data && chunk.data.chunk) {
              // 处理自定义格式的内容块
              const newContent = chunk.data.chunk;
              
              // 从chunk中提取思考过程，并保存到fullThinking
              if (newContent.includes('<think>') && newContent.includes('</think>')) {
                const thinkMatch = /<think>([\s\S]*?)<\/think>/g.exec(newContent);
                if (thinkMatch && thinkMatch[1]) {
                  fullThinking += thinkMatch[1] + '\n';
                }
              }
              
              // 从内容中移除<think>标签后再添加到fullResponse
              const cleanedContent = newContent.replace(/<think>[\s\S]*?<\/think>/g, '');
              fullResponse += cleanedContent;
              setStreamingContent(fullResponse);
              
              // 添加调试日志
              console.log('处理自定义格式响应:', {
                chunkLength: newContent.length,
                cleanedLength: cleanedContent.length,
                fullResponseLength: fullResponse.length
              });
              
              // 更新消息列表中的助手消息
              setMessages(prev => {
                const updated = [...prev];
                const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
                if (assistantIndex >= 0) {
                  updated[assistantIndex] = {
                    ...updated[assistantIndex],
                    content: fullResponse,
                    thinking: fullThinking,
                    hasThinking: fullThinking.trim().length > 0,
                    loading: false
                  };
                }
                return updated;
              });
            }
          });
          
          // 流式响应完成后，更新最终消息
          const finalAssistantMessage = {
            id: assistantMessageId,
            role: 'assistant',
            type: 'bot',
            content: fullResponse,
            timestamp: new Date(),
            thinking: fullThinking,
            hasThinking: fullThinking.trim().length > 0,
            citations: citations,
            loading: false
          };
          
          // 添加调试日志
          console.log('流式响应完成:', {
            messageId: assistantMessageId,
            contentLength: fullResponse.length,
            hasThinking: fullThinking.length > 0,
            hasCitations: citations.length > 0
          });
          
          // 更新消息列表
          setMessages(prev => {
            const updated = [...prev];
            const assistantIndex = updated.findIndex(msg => msg.id === assistantMessageId);
            if (assistantIndex >= 0) {
              updated[assistantIndex] = finalAssistantMessage;
            }
            return updated;
          });
          
          // 更新当前会话
          if (conversationId) {
            const updatedConversation = conversations.find(conv => conv.id === conversationId);
            if (updatedConversation) {
              const updatedWithMessage = {
                ...updatedConversation,
                updatedAt: new Date(),
                messages: updatedConversation.messages.map(msg => 
                  msg.id === assistantMessageId ? finalAssistantMessage : msg
                )
              };
              
              // 更新会话列表
              setConversations(prev => 
                prev.map(conv => conv.id === conversationId ? updatedWithMessage : conv)
              );
              
              // 保存到本地存储
              await saveHistoryToLocalStorage([...conversations]);
              
              // 尝试同步到服务器
              setNeedsSync(true);
              await syncToServer(updatedWithMessage);
            }
          }
        } catch (error) {
          console.error('流式请求处理错误:', error);
          throw error;
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
          role: 'system',
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
      
      // 1. 先更新本地状态，提供即时反馈
      const updatedConversations = conversations.filter(conv => conv.id !== id);
      setConversations(updatedConversations);
      await saveHistoryToLocalStorage(updatedConversations);
      
      // 2. 如果删除的是当前对话，重置当前对话
      if (id === currentConversationId) {
        setCurrentConversationId(null);
        setMessages([initialSystemMessage]);
      }
      
      // 3. 检查是否有token，决定是否尝试从服务器删除
      const token = await AsyncStorage.getItem('token');
      console.log(`=== 当前token状态: ${token ? '存在' : '不存在'} ===`);
      
      if (!token) {
        // 未登录状态只能本地删除
        Alert.alert('提示', '未登录状态下仅支持本地删除');
        return;
      }
      
      // 4. 尝试从服务器删除
      console.log(`=== 准备调用deleteConversation(${id}) ===`);
      try {
        const result = await deleteConversation(id);
        console.log(`=== 服务器删除成功: ===`, result);
        Alert.alert('成功', '对话已成功从本地和服务器删除');
      } catch (deleteError) {
        console.error(`=== deleteConversation调用失败: ===`, deleteError);
        
        // 服务器删除失败，但本地已删除
        if (deleteError.message && deleteError.message.includes('404')) {
          Alert.alert('提示', '对话已删除（服务器上未找到对应记录）');
        } else {
          Alert.alert('提示', `对话已在本地删除，但服务器同步失败: ${deleteError.message}`);
        }
      }
    } catch (err) {
      console.error(`=== 删除对话失败: ===`, err);
      Alert.alert('错误', `删除对话失败: ${err.message}`);
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
  
  // 处理消息反馈（点赞/点踩）
  const handleMessageFeedback = async (messageId, feedback) => {
    try {
      // 更新本地消息状态
      setMessages(prev => {
        const updated = [...prev];
        const messageIndex = updated.findIndex(msg => msg.id === messageId);
        if (messageIndex >= 0) {
          updated[messageIndex] = {
            ...updated[messageIndex],
            feedback
          };
        }
        return updated;
      });
      
      // 更新本地会话中的消息
      if (currentConversationId) {
        const updatedConversations = conversations.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: conv.messages.map(msg => 
                msg.id === messageId ? { ...msg, feedback } : msg
              )
            };
          }
          return conv;
        });
        
        setConversations(updatedConversations);
        
        // 保存到本地存储
        await saveHistoryToLocalStorage(updatedConversations);
        
        // 同步到服务器
        const currentConv = updatedConversations.find(conv => conv.id === currentConversationId);
        if (currentConv) {
          setNeedsSync(true);
          await syncToServer(currentConv);
        }
      }
    } catch (error) {
      console.error('更新消息反馈失败:', error);
      Alert.alert('错误', `更新消息反馈失败: ${error.message}`);
    }
  };
  
  // 重新生成回复
  const regenerateAnswer = async (questionContent) => {
    // 找到最后一个用户消息和助手消息
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user' || msg.role === 'user');
    
    if (lastUserMessage) {
      // 移除最后一个助手消息
      setMessages(prev => prev.filter(msg => 
        !(msg.type === 'bot' || msg.role === 'assistant') || 
        msg.id === initialSystemMessage.id
      ));
      
      // 使用上一个问题重新发送
      await sendMessage(questionContent || lastUserMessage.content);
    }
  };

  // 提供所有状态和函数
  return (
    <ChatContext.Provider
      value={{
        // 会话和消息状态
        conversations,
        messages,
        currentConversationId,
        loading,
        error,
        isStreaming,
        streamingContent,
        
        // 模型和知识库设置
        selectedModel,
        setSelectedModel,
        useKnowledgeBase,
        setUseKnowledgeBase,
        selectedKnowledgeBase,
        setSelectedKnowledgeBase,
        
        // 附件相关
        currentAttachment,
        setAttachment,
        removeAttachment: () => setCurrentAttachment(null),
        isProcessingAttachment,
        
        // 操作函数
        sendMessage,
        loadConversations,
        selectConversation,
        createNewConversation,
        deleteConversationById,
        regenerateAnswer,
        handleMessageFeedback,
        
        // 调试函数
        testDeleteAPI,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
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
