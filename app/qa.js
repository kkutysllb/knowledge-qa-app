import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Clipboard,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Avatar,
  Button,
  Divider,
  IconButton,
  Menu,
  RadioButton,
  Surface,
  Text,
  TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
// 确保已安装expo-linear-gradient
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';
import { useAuth } from '../src/context/AuthContext';
import { useChat } from '../src/context/ChatContext';
import { ThemeType, useTheme } from '../src/context/ThemeContext';
import { pickDocument, pickImage, sendKnowledgeFeedback } from '../src/utils/api';

const { width, height } = Dimensions.get('window');

// React Native 环境中btoa的兼容性实现
const safebtoa = (input) => {
  try {
    // 使用内置btoa如果可用
    if (typeof btoa === 'function') {
      // 先将UTF-8字符串转换为binary string
      const utf8String = unescape(encodeURIComponent(input));
      return btoa(utf8String);
    }
    
    // 自定义实现
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    
    // 先将UTF-8字符串转换为binary string
    const utf8String = unescape(encodeURIComponent(input));
    
    for (let i = 0; i < utf8String.length; i += 3) {
      const byte1 = utf8String.charCodeAt(i) & 0xff;
      const byte2 = i + 1 < utf8String.length ? utf8String.charCodeAt(i + 1) & 0xff : 0;
      const byte3 = i + 2 < utf8String.length ? utf8String.charCodeAt(i + 2) & 0xff : 0;
      
      const enc1 = byte1 >> 2;
      const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
      const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
      const enc4 = byte3 & 63;
      
      output += chars.charAt(enc1) + chars.charAt(enc2) +
                (i + 1 < utf8String.length ? chars.charAt(enc3) : '=') +
                (i + 2 < utf8String.length ? chars.charAt(enc4) : '=');
    }
    
    return output;
  } catch (e) {
    console.error('Base64编码错误:', e);
    return '';
  }
};

// 移除模拟聊天历史和初始消息

const QA = () => {
  const scrollViewRef = useRef(null);
  const router = useRouter();
  const { darkMode, theme, toggleTheme } = useTheme();
  const { 
    messages, 
    loading, 
    error, 
    setError,
    sendMessage, 
    currentConversationId, 
    clearChat,
    handleMessageFeedback,
    knowledgeBases,
    selectedKnowledgeBase,
    models,
    selectedModel,
    setSelectedModel,
    conversations,
    loadConversations,
    selectConversation,
    createNewConversation,
    testDeleteAPI,
    isStreaming,
    setIsStreaming,
    useKnowledgeBase,
    setUseKnowledgeBase,
    currentAttachment,
    setAttachment,
    removeAttachment,
    isProcessingAttachment,
    streamingContent
  } = useChat();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isMermaidVisible, setIsMermaidVisible] = useState(false);
  const [currentMermaidContent, setCurrentMermaidContent] = useState('');
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [currentFeedbackMessageId, setCurrentFeedbackMessageId] = useState(null);
  const [messageFeedback, setMessageFeedback] = useState({});
  const [menuVisible, setMenuVisible] = useState(false);
  const { theme: themeContext, themeType, currentThemeType, getStatusBarStyle } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModelMenuVisible, setIsModelMenuVisible] = useState(false);
  const [isKbMenuVisible, setIsKbMenuVisible] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-300)).current;
  const [isAttachmentMenuVisible, setIsAttachmentMenuVisible] = useState(false);
  
  // 获取认证和聊天上下文
  const { isAuthenticated, user, logout } = useAuth();
  
  // 判断是否是深色模式
  const isDark = currentThemeType === ThemeType.DARK;
  
  // 创建动态样式
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  
  // 抽屉动画
  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: isDrawerOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isDrawerOpen]);

  // 页面加载动画
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // 检查认证状态
  useEffect(() => {
    // 使用setTimeout确保组件已经挂载
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        console.log('未认证，准备跳转到登录页');
        router.replace('/login');
      } else {
        // 如果已认证，检查令牌并加载历史对话列表
        AsyncStorage.getItem('token').then(token => {
          if (token) {
            console.log('已找到认证令牌，加载会话列表');
            loadConversations();
          } else {
            console.error('未找到有效的认证令牌');
            Alert.alert('登录已过期', '请重新登录以继续使用');
            logout();
          }
        });
      }
    }, 100); // 短暂延迟，确保组件已挂载
    
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
  
  // 滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleNewChat = () => {
    createNewConversation();
    setInputText('');
    // 如果抽屉是打开的，关闭它
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
    }
  };

  const handleSelectChat = (chat) => {
    selectConversation(chat.id);
    setIsDrawerOpen(false);
  };

  const handleSend = () => {
    if (!inputText.trim() || loading) return;

    // 使用聊天上下文的sendMessage函数
    sendMessage(inputText);
    setInputText('');
  };

  // 复制消息内容
  const copyMessageContent = async (content) => {
    try {
      await Clipboard.setStringAsync(content);
      // 显示成功提示
      Alert.alert('复制成功', '内容已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      Alert.alert('复制失败', '无法复制内容到剪贴板');
    }
  };

  // 处理点赞/点踩
  const handleFeedback = (messageId, feedbackType) => {
    // 更新本地反馈状态，立即提供视觉反馈
    setMessageFeedback(prev => {
      // 如果已经选择了相同的反馈，则取消选择
      if (prev[messageId] === feedbackType) {
        const newFeedback = {...prev};
        delete newFeedback[messageId];
        return newFeedback;
      }
      // 否则设置新的反馈
      return {...prev, [messageId]: feedbackType};
    });
    
    // 对于点踩操作，显示反馈对话框
    if (feedbackType === 'dislike') {
      setCurrentFeedbackMessageId(messageId);
      setFeedbackModalVisible(true);
      return;
    }
    
    // 对于点赞操作，直接处理反馈
    if (feedbackType === 'like') {
      // 使用ChatContext的handleMessageFeedback函数
      handleMessageFeedback(messageId, feedbackType);
    }
  };

  const submitFeedback = () => {
    // 提交反馈
    if (currentFeedbackMessageId && feedbackText.trim()) {
      // 设置反馈
      setMessageFeedback(prev => ({
        ...prev,
        [currentFeedbackMessageId]: {
          type: 'dislike',
          reason: feedbackText.trim()
        }
      }));
      
      // 更新知识库
      // 获取当前反馈消息内容
      const assistantMessage = messages.find(msg => msg.id === currentFeedbackMessageId);
      if (!assistantMessage) {
        console.error('缺少当前反馈消息ID');
        return;
      }
      
      const userMessage = findUserQuestionForAssistantMessage(currentFeedbackMessageId);
      if (!userMessage) {
        console.error('无法找到相关用户问题');
        return;
      }
      
      // 发送知识库反馈
      (async () => {
        try {
          Alert.alert('正在更新知识库...', '请稍候');
          
          const result = await sendKnowledgeFeedback(
            userMessage.content,
            assistantMessage.content,
            'incorrect',
            feedbackText.trim(),
            selectedKnowledgeBase
          );
          
          if (result && result.success) {
            Alert.alert('成功', '知识库更新成功');
          } else {
            Alert.alert('失败', `知识库更新失败: ${result?.message || '未知错误'}`);
          }
        } catch (error) {
          console.error('更新知识库出错:', error);
          Alert.alert('失败', '知识库更新失败，请检查网络连接');
        }
      })();
      
      // 关闭对话框
      setFeedbackModalVisible(false);
      setFeedbackText('');
      setCurrentFeedbackMessageId(null);
    }
  };

  const cancelFeedback = () => {
    setFeedbackModalVisible(false);
    setFeedbackText('');
    setCurrentFeedbackMessageId(null);
  };

  const regenerateAnswer = (questionContent) => {
    if (loading) return;
    sendMessage(questionContent);
  };
  
  // 更新模型选择处理
  const handleModelChange = (model) => {
    setSelectedModel(model);
    setIsModelMenuVisible(false);
  };

  // 更新知识库使用设置
  const handleKnowledgeBaseChange = (useKB) => {
    const useKBBool = useKB === 'true';
    setUseKnowledgeBase(useKBBool);
    setIsKbMenuVisible(false);
  };

  // 添加格式化日期函数
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // 今天
    if (date.toDateString() === now.toDateString()) {
      return '今天';
    }
    // 昨天
    else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    // 其他日期
    else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  // 清理消息内容，移除<think>...</think>标签
  const cleanMessageContent = (content, streamingContent) => {
    if (!content && !streamingContent) return '';
    
    // 只使用一个内容来源 - 如果有常规内容就使用它，否则使用流式内容
    const textToClean = content || streamingContent || '';
    return textToClean.replace(/<think>[\s\S]*?<\/think>/g, '');
  };

  // 查找消息内容中的mermaid代码块
  const findMermaidBlocks = (content) => {
    if (!content) return [];
    
    // 更完善的正则表达式，匹配各种mermaid代码块格式
    // 同时匹配```mermaid和不带mermaid标识符的代码块
    const regexWithTag = /```(?:mermaid)\s*\n([\s\S]*?)```/g;
    const regexNoTag = /```\s*\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    
    // 首先检查明确标记为mermaid的代码块
    while ((match = regexWithTag.exec(content)) !== null) {
      blocks.push({
        fullMatch: match[0],
        code: match[1].trim(),
        explicitMermaid: true
      });
    }
    
    // 然后检查未标记但可能是mermaid的代码块
    while ((match = regexNoTag.exec(content)) !== null) {
      const code = match[1].trim();
      
      // 仅当代码块以mermaid关键词开头时才识别为mermaid
      const firstLine = code.split('\n')[0].trim();
      if (firstLine === 'sequenceDiagram' || 
          firstLine === 'flowchart' ||
          firstLine === 'flowchart TD' ||
          firstLine === 'flowchart LR' ||
          firstLine.startsWith('graph ') || 
          firstLine.startsWith('pie ') ||
          firstLine === 'erDiagram' ||
          firstLine === 'classDiagram' || 
          firstLine === 'gantt') {
        
        // 确保这个块还没被添加过
        const alreadyAdded = blocks.some(b => b.fullMatch === match[0]);
        if (!alreadyAdded) {
          blocks.push({
            fullMatch: match[0],
            code: code,
            explicitMermaid: false
          });
        }
      }
    }
    
    return blocks;
  };
  
  // 包装长指令文本为代码块
  const wrapLongCommands = (content) => {
    if (!content) return '';
    
    // 预处理：首先将所有指令样式文本放入代码块
    let processedContent = content;
    
    // 1. 匹配看起来像API命令的长文本（连续字母、数字、下划线组合），但不在代码块内
    const longCmdRegex = /(?<!```[\s\S]*?)([A-Za-z][A-Za-z0-9_]{20,}(?:[._][A-Za-z][A-Za-z0-9_]+)+)(?![\s\S]*?```)/g;
    processedContent = processedContent.replace(longCmdRegex, '`$1`');
    
    // 2. 匹配全大写且包含下划线的配置命令（如SET_AMFTIMER, ADD_GUAMICFG）
    const configCmdRegex = /(?<!```[\s\S]*?)(?<![`'\w])((?:[A-Z]+_?){2,}|(?:ADD|SET|GET|CONFIG|REMOVE)\s+[A-Z_]+)(?![`'\w])(?![\s\S]*?```)/g;
    processedContent = processedContent.replace(configCmdRegex, '`$1`');
    
    // 3. 匹配参数样式文本，如PLMNID=460-00
    const paramRegex = /(?<!```[\s\S]*?)(?<![`'\w])((?:[A-Z]+)=(?:[\w\-\.\/]+))(?![`'\w])(?![\s\S]*?```)/g;
    processedContent = processedContent.replace(paramRegex, '`$1`');
    
    // 4. 匹配看起来像参数名的全大写文本
    const paramNameRegex = /(?<!```[\s\S]*?)(?<![`'\w])([A-Z]{5,})(?![`'\w])(?![\s\S]*?```)/g;
    processedContent = processedContent.replace(paramNameRegex, '`$1`');
    
    return processedContent;
  };

  // 添加一个独立的消息组件
  const ChatMessage = React.memo(({ message, feedback, onCopy, onFeedback, theme, isDark, isStreaming, streamingContent }) => {
    const renderMessage = () => {
      const isUser = message.type === 'user' || message.role === 'user';
      const isSystem = message.type === 'system' || message.role === 'system';
      const isError = message.isError;
      const isBot = message.type === 'bot' || message.role === 'assistant';
      const isLoading = isBot && message.loading;
      const hasThinking = isBot && message.thinking && message.thinking.trim().length > 0;
      const hasCitations = isBot && message.citations && message.citations.length > 0;
      
      // 确保消息内容是字符串
      const safeContent = typeof message.content === 'string' 
        ? message.content 
        : (message.content ? String(message.content) : '');
      const messageContent = safeContent;
      
      // 安全获取主题颜色
      const primaryColor = theme?.primary || '#6200ee';
      
      // 系统消息使用特殊样式 - 但不显示系统设定类消息
      if (isSystem) {
        // 如果包含"欢迎使用5G核心网"等系统设定内容，则不显示
        if (messageContent && (
          messageContent.includes("欢迎使用5G核心网") || 
          messageContent.includes("智擎") ||
          messageContent.includes("我是您的智能助手")
        )) {
          return null;
        }
        
        return (
          <Surface 
            style={[
              styles.systemMessageContainer,
              isError ? { backgroundColor: isDark ? 'rgba(255,0,0,0.1)' : 'rgba(255,0,0,0.05)' } : null
            ]}
          >
            <Text style={styles.systemMessageText}>{messageContent}</Text>
          </Surface>
        );
      }
      
      // 这个消息是否应该使用流式内容 (只有正在loading的bot消息才使用流式内容)
      const shouldUseStreamingContent = isBot && isLoading && isStreaming;
      
      // 检查是否应该渲染图表
      const shouldRenderMermaid = !(isLoading || (isBot && isStreaming && !message.id.includes('streaming')));
      
      // 清理消息内容，移除<think>标签
      let cleanedContent = isBot ? 
        cleanMessageContent(messageContent, shouldUseStreamingContent ? streamingContent : '') : 
        messageContent;
        
      // 处理长指令格式，将其转换为内联代码块
      cleanedContent = wrapLongCommands(cleanedContent);
      
      // 查找mermaid代码块
      const mermaidBlocks = (isBot && shouldRenderMermaid) ? findMermaidBlocks(cleanedContent) : [];
      
      // 替换mermaid代码块为占位符
      let contentWithPlaceholders = cleanedContent;
      const mermaidPlaceholders = [];
      
      mermaidBlocks.forEach((block, index) => {
        const placeholder = `[MERMAID_DIAGRAM_${index}]`;
        contentWithPlaceholders = contentWithPlaceholders.replace(block.fullMatch, placeholder);
        mermaidPlaceholders.push(placeholder);
      });
      
      // 分割内容，处理mermaid图表
      const contentParts = [];
      
      if (contentWithPlaceholders) {
        let lastIndex = 0;
        
        mermaidPlaceholders.forEach((placeholder, index) => {
          const placeholderIndex = contentWithPlaceholders.indexOf(placeholder, lastIndex);
          
          if (placeholderIndex > lastIndex) {
            // 添加占位符前的文本
            contentParts.push({
              type: 'text',
              content: contentWithPlaceholders.substring(lastIndex, placeholderIndex)
            });
          }
          
          if (shouldRenderMermaid) {
            // 添加mermaid图表
            contentParts.push({
              type: 'mermaid',
              content: mermaidBlocks[index].code,
              key: `mermaid-${message.id}-${index}`
            });
          } else {
            // 在流式响应或加载时，不渲染图表，而是显示代码块
            contentParts.push({
              type: 'text',
              content: '\n```\n' + mermaidBlocks[index].code + '\n```\n'
            });
          }
          
          lastIndex = placeholderIndex + placeholder.length;
        });
        
        // 添加最后一部分文本
        if (lastIndex < contentWithPlaceholders.length) {
          contentParts.push({
            type: 'text',
            content: contentWithPlaceholders.substring(lastIndex)
          });
        }
      }
      
      // 如果没有分割部分，添加整个内容
      if (contentParts.length === 0 && contentWithPlaceholders) {
        contentParts.push({
          type: 'text',
          content: contentWithPlaceholders
        });
      }

      return (
        <View
          style={[
            styles.messageRow,
            isUser ? styles.userMessageRow : styles.botMessageRow,
          ]}
        >
          {/* 图标区分用户和AI，沉浸式风格 */}
          <View style={styles.iconContainer}>
            {isUser ? (
              <Icon name="account" size={24} color={theme.accent || '#03dac6'} />
            ) : (
              <Icon name="robot" size={24} color={theme.primary || '#6200ee'} />
            )}
          </View>
          
          <View style={styles.messageContainer}>
            {/* 消息内容 */}
            <View style={styles.messageContent}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={primaryColor} size="small" />
                  <Text style={{ color: theme.textSecondary, marginTop: 8 }}>思考中...</Text>
                </View>
              ) : (
                // 渲染消息内容（包括文本和mermaid图表）
                <View>
                  {contentParts.map((part, index) => {
                    if (part.type === 'text') {
                      return (
                        <Markdown 
                          key={`text-${index}`}
                          style={{
                            body: styles.messageText,
                            // 设置其他Markdown样式
                            heading1: { fontSize: 22, fontWeight: 'bold', marginVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.divider, paddingBottom: 8 },
                            heading2: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
                            heading3: { fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
                            link: { color: theme.primary, textDecorationLine: 'underline' },
                            blockquote: { borderLeftWidth: 4, borderLeftColor: theme.border, paddingLeft: 12, opacity: 0.8, marginVertical: 10 },
                            code_block: { 
                              backgroundColor: isDark ? '#2c3e50' : 'rgba(0,0,0,0.05)', 
                              padding: 12, 
                              borderRadius: 4, 
                              marginVertical: 10, 
                              fontFamily: 'monospace', 
                              fontSize: 16, 
                              lineHeight: 24,
                              color: isDark ? '#ffffff' : undefined,
                              borderWidth: isDark ? 2 : 0,
                              borderColor: '#4fc3f7',
                              fontWeight: isDark ? 'bold' : 'normal'
                            },
                            code_inline: { 
                              backgroundColor: isDark ? '#2c3e50' : 'rgba(0,0,0,0.1)', 
                              paddingHorizontal: 6, 
                              paddingVertical: 3, 
                              borderRadius: 3, 
                              fontFamily: 'monospace',
                              fontSize: 15,
                              flexShrink: 1,
                              flexWrap: 'wrap',
                              wordBreak: 'break-word',
                              color: isDark ? '#ffffff' : undefined,
                              borderWidth: isDark ? 1 : 0,
                              borderColor: '#4fc3f7',
                              fontWeight: isDark ? 'bold' : 'normal'
                            },
                            table: { borderWidth: 1, borderColor: theme.border, marginVertical: 12, width: '100%' },
                            tr: { borderBottomWidth: 1, borderColor: theme.border },
                            th: { padding: 8, fontWeight: 'bold', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                            td: { padding: 8 },
                            hr: { backgroundColor: theme.divider, height: 1, marginVertical: 16 },
                            bullet_list: { marginVertical: 10 },
                            ordered_list: { marginVertical: 10 },
                          }}
                        >
                          {part.content}
                        </Markdown>
                      );
                    } else if (part.type === 'mermaid') {
                      // 渲染mermaid图表
                      return (
                        <MermaidChart 
                          key={part.key} 
                          code={part.content} 
                          theme={theme}
                          isDark={isDark}
                        />
                      );
                    }
                    return null;
                  })}
                </View>
              )}
            </View>
            
            {isBot && !isLoading && (
              <View style={styles.messageActions}>
                {/* 用户反馈（点赞/点踩）*/}
                <View style={styles.feedbackContainer}>
                  <IconButton
                    icon="thumb-up"
                    size={20}
                    iconColor={feedback === 'like' ? theme.success : theme.iconInactive}
                    onPress={() => onFeedback(message.id, 'like')}
                    style={styles.feedbackButton}
                  />
                  <IconButton
                    icon="thumb-down"
                    size={20}
                    iconColor={feedback === 'dislike' ? theme.error : theme.iconInactive}
                    onPress={() => onFeedback(message.id, 'dislike')}
                    style={styles.feedbackButton}
                  />
                  <IconButton
                    icon="content-copy"
                    size={20}
                    iconColor={theme.iconInactive}
                    onPress={() => onCopy(messageContent)}
                    style={styles.feedbackButton}
                  />
                  {hasThinking && (
                    <IconButton
                      icon="thought-bubble"
                      size={20}
                      iconColor={theme.iconInactive}
                      onPress={() => onCopy(messageContent, message.thinking)}
                      style={styles.feedbackButton}
                    />
                  )}
                </View>
                
                {/* 引用来源 */}
                {hasCitations && (
                  <View style={styles.citationsContainer}>
                    <Text style={[styles.citationTitle, { color: theme.textSecondary }]}>
                      引用来源:
                    </Text>
                    {message.citations.map((citation, idx) => (
                      <Text 
                        key={`cite-${idx}`} 
                        style={[styles.citation, { color: theme.textTertiary }]}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {idx + 1}. {citation.title || citation.url || '未知来源'}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      );
    };

    return renderMessage();
  });

  // 单独的MermaidChart组件，使用WebView本地渲染而不是外部服务
  const MermaidChart = ({ code, theme, isDark }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const primaryColor = theme?.primary || '#6200ee';
    
    // 格式化和清理mermaid代码
    const cleanedCode = useMemo(() => {
      // 确保代码第一行是有效的图表声明
      let codeLines = code.trim().split('\n');
      const firstLine = codeLines[0].trim();
      
      // 如果第一行没有合法的mermaid语法标识，尝试根据后续行猜测添加一个
      if (!firstLine.match(/^(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|gantt|pie)/i)) {
        // 检查是否包含特定语法特征
        if (code.includes('-->') && !code.includes('participant')) {
          // 可能是流程图
          codeLines.unshift('flowchart TD');
        } else if (code.includes('participant') || code.includes('->>')) {
          // 可能是时序图
          codeLines.unshift('sequenceDiagram');
        }
      }
      return codeLines.join('\n');
    }, [code]);
    
    // 提取图表标题
    const title = cleanedCode.split('\n')[0].replace(/^graph\s+|^sequenceDiagram\s+|^flowchart\s+|^classDiagram\s+|^erDiagram\s+|^gantt\s+|^pie\s+/i, '');
    
          // 为Web平台使用DOM渲染器，为原生平台使用WebView
    if (Platform.OS === 'web') {
      // 动态导入DOM组件，避免在原生平台上导入
      const MermaidDOMRenderer = require('../components/MermaidDOMRenderer').default;
      return (
        <View style={{ marginVertical: 10, alignItems: 'center' }}>
          <Surface style={styles.mermaidContainer}>
            <Text style={styles.mermaidTitle}>{title}</Text>
            <MermaidDOMRenderer code={cleanedCode} isDark={isDark} theme={theme} />
          </Surface>
        </View>
      );
    }
    
    // 以下是原生平台的WebView实现，保持不变
    // 创建HTML内容，包含Mermaid.js库和图表定义
    const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid Diagram</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.8.0/dist/mermaid.min.js"></script>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: ${isDark ? '#1e1e1e' : '#ffffff'};
        color: ${isDark ? '#ffffff' : '#000000'};
      }
      .codeBlock {
        background-color: ${isDark ? '#2c3e50' : 'rgba(0,0,0,0.05)'};
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
        border: ${isDark ? '2px solid #4fc3f7' : 'none'};
        color: ${isDark ? '#ffffff' : '#000000'};
        font-size: 16px;
        line-height: 1.5;
        font-weight: ${isDark ? 'bold' : 'normal'};
      }
      #diagram {
        width: 100%;
        display: flex;
        justify-content: center;
      }
      svg {
        max-width: 100%;
        height: auto;
      }
    </style>
  </head>
  <body>
    <pre id="diagram" class="mermaid">
${cleanedCode}
    </pre>
    <script>
      try {
        mermaid.initialize({
          startOnLoad: true,
          theme: '${isDark ? 'dark' : 'default'}',
          securityLevel: 'loose',
          fontFamily: 'arial,sans-serif',
          darkMode: ${isDark},
          themeVariables: {
            ${isDark ? `
            primaryColor: '#81D4FA',
            primaryTextColor: '#fff',
            primaryBorderColor: '#7C0000',
            lineColor: '#F8B229',
            secondaryColor: '#006100',
            tertiaryColor: '#222222'
            ` : ''}
          }
        });
        
        const renderDiagram = async () => {
          try {
            await mermaid.run();
            // 通知React Native组件渲染成功
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              height: document.body.scrollHeight
            }));
          } catch (error) {
            // 通知React Native组件渲染失败
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: error.toString()
            }));
          }
        };
        
        // 等待页面加载完成后渲染图表
        if (document.readyState === 'complete') {
          renderDiagram();
        } else {
          window.addEventListener('load', renderDiagram);
        }
      } catch (error) {
        // 通知React Native组件渲染失败
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: error.toString()
        }));
      }
    </script>
  </body>
</html>`;
    
    // 处理WebView消息
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'success') {
          setIsLoading(false);
          setHasError(false);
        } else if (data.type === 'error') {
          console.error('Mermaid渲染错误:', data.message);
          setHasError(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('处理WebView消息失败:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };
    
    return (
      <View style={{ marginVertical: 10, alignItems: 'center' }}>
        <Surface style={styles.mermaidContainer}>
          <Text style={styles.mermaidTitle}>{title}</Text>
          
                        {hasError ? (
            <View style={styles.mermaidError}>
              <Icon name="alert-circle" size={30} color={theme.error || 'red'} />
              <Text style={{ marginTop: 8, color: theme.error || 'red' }}>
                图表渲染失败
              </Text>
              <View style={{ 
                marginTop: 8, 
                padding: 10, 
                backgroundColor: isDark ? '#2c3e50' : 'rgba(0,0,0,0.05)', 
                borderRadius: 4,
                borderWidth: isDark ? 2 : 0,
                borderColor: '#4fc3f7'
              }}>
                <Text style={{ 
                  fontFamily: 'monospace', 
                  fontSize: 14,
                  color: isDark ? '#ffffff' : undefined,
                  fontWeight: isDark ? 'bold' : 'normal'
                }}>
                  {code.length > 150 ? code.substring(0, 150) + '...' : code}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.mermaidImageContainer}>
              {isLoading && (
                <View style={styles.mermaidLoading}>
                  <ActivityIndicator color={primaryColor} size="large" />
                  <Text style={{ marginTop: 8, color: theme.text }}>图表渲染中...</Text>
                </View>
              )}
              <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{ 
                  width: '100%', 
                  height: 300, 
                  backgroundColor: 'transparent',
                  opacity: isLoading ? 0 : 1 
                }}
                onMessage={handleMessage}
                onError={(error) => {
                  console.error('WebView错误:', error);
                  setHasError(true);
                  setIsLoading(false);
                }}
                onHttpError={(error) => {
                  console.error('WebView HTTP错误:', error);
                  setHasError(true);
                  setIsLoading(false);
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            </View>
          )}
        </Surface>
      </View>
    );
  };

  // 渲染欢迎界面
  const renderWelcomeScreen = () => {
    if (messages.length > 1) return null; // 只在初始状态显示
    
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.logoContainer}>
          <Avatar.Icon
            size={80}
            icon="robot"
            style={styles.welcomeLogo}
            color="#fff"
            theme={{ colors: { primary: theme.primary } }}
          />
        </View>
        <Text style={styles.welcomeTitle}>嗨！我是5GC"智擎"</Text>
        <Text style={styles.welcomeSubtitle}>
          我可以帮你解答5G核心网相关问题，请把你的任务交给我吧~
        </Text>
      </View>
    );
  };

  // 根据主题获取渐变颜色
  const getGradientColors = () => {
    return isDark 
      ? [theme.background, theme.surface] 
      : ['#F5F7FA', '#E4EBF5'];
  };

  // 处理文档选择
  const handleDocumentPick = async () => {
    try {
      const result = await pickDocument();
      if (result.canceled) {
        console.log('文档选择已取消');
        return;
      }
      
      setAttachment(result.assets[0]);
      setIsAttachmentMenuVisible(false);
    } catch (error) {
      console.error('选择文档失败:', error);
      Alert.alert('错误', '选择文档失败: ' + error.message);
    }
  };
  
  // 处理图片选择
  const handleImagePick = async () => {
    try {
      const result = await pickImage();
      if (result.canceled) {
        console.log('图片选择已取消');
        return;
      }
      
      // 构造文件对象，使其与DocumentPicker返回的格式兼容
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.uri.split('/').pop(),
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      };
      
      setAttachment(file);
      setIsAttachmentMenuVisible(false);
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败: ' + error.message);
    }
  };

  // 添加一个处理删除对话的函数
  const handleDeleteChat = (id) => {
    console.log(`handleDeleteChat被调用，对话ID: ${id}`);
    
    Alert.alert(
      '删除对话',
      '确定要删除这个对话吗？此操作不可撤销。',
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: () => console.log('取消删除')
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            console.log(`用户确认删除，对话ID: ${id}`);
            try {
              console.log('开始调用testDeleteAPI');
              await testDeleteAPI(id);
              console.log('testDeleteAPI调用完成');
            } catch (error) {
              console.error('删除过程中出错:', error);
              Alert.alert('错误', `删除失败: ${error.message}`);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // 对历史对话按照日期进行分组
  const groupConversationsByDate = () => {
    if (!conversations || conversations.length === 0) {
      return [];
    }

    // 创建分组
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: []
    };

    // 当前日期
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 分类对话
    conversations.forEach(conversation => {
      const convDate = new Date(conversation.updated_at);
      const convDateNoTime = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());
      
      if (convDateNoTime.getTime() === today.getTime()) {
        groups.today.push(conversation);
      } else if (convDateNoTime.getTime() === yesterday.getTime()) {
        groups.yesterday.push(conversation);
      } else if (convDate >= oneWeekAgo) {
        groups.thisWeek.push(conversation);
      } else {
        groups.earlier.push(conversation);
      }
    });

    return [
      { title: '今天', data: groups.today },
      { title: '昨天', data: groups.yesterday },
      { title: '本周', data: groups.thisWeek },
      { title: '更早', data: groups.earlier }
    ].filter(group => group.data.length > 0); // 只保留有数据的分组
  };

  // 查找AI消息对应的用户问题
  const findUserQuestionForAssistantMessage = (assistantMessageId) => {
    const messageIndex = messages.findIndex(msg => msg.id === assistantMessageId);
    if (messageIndex <= 0) return null;
    
    // 向前查找最近的一条用户消息
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user' || messages[i].type === 'user') {
        return messages[i];
      }
    }
    return null;
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      style={styles.gradient}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle={getStatusBarStyle()} />
      
      {/* 侧边抽屉 - 历史对话 */}
      <Animated.View 
        style={[
          styles.drawer,
          { 
            transform: [{ translateX: drawerAnim }],
            backgroundColor: theme.surface
          }
        ]}
      >
        <View style={styles.drawerHeader}>
          <Text style={[styles.drawerTitle, { color: theme.text }]}>历史对话</Text>
          <IconButton
            icon="close"
            size={24}
            iconColor={theme.icon}
            onPress={toggleDrawer}
          />
        </View>
        <Divider style={{ backgroundColor: theme.divider }} />
        
        {/* 使用SectionList替代FlatList，支持分组显示 */}
        <SectionList
          sections={groupConversationsByDate()}
          keyExtractor={item => item.id}
          style={styles.historyList}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.timeGroupTitle, { color: theme.text }]}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <View 
              style={[
                styles.historyItem,
                currentConversationId === item.id && { backgroundColor: isDark ? '#333' : '#f0f0f0' }
              ]}
            >
              {/* 左侧内容区域 */}
              <TouchableOpacity
                style={styles.historyItemContent} 
                onPress={() => handleSelectChat(item)}
              >
                <Text 
                  style={[styles.historyTitle, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
                  {formatDate(item.updated_at)}
                </Text>
              </TouchableOpacity>
              
              {/* 右侧删除按钮 - 使用Button组件，与测试成功的顶部按钮保持一致 */}
              <Button
                icon="trash-can-outline"
                mode="text"
                onPress={() => {
                  // 这里直接调用测试函数，因为我们知道它可以工作
                  console.log(`历史列表删除按钮点击: ${item.id}`);
                  testDeleteAPI(item.id);
                }}
                style={{ marginLeft: 5 }}
                color={theme.error}
              >
                删除
              </Button>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.textSecondary }}>暂无历史会话</Text>
            </View>
          }
        />
        
        {/* 用户信息区域 */}
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfoContent}>
            <Avatar.Icon size={40} icon="account" style={{ backgroundColor: theme.primary }} />
            <View style={[styles.userTextContainer, { marginLeft: 12 }]}>
              <Text style={[styles.userName, { color: theme.text }]}>{user?.username || '用户'}</Text>
            </View>
            <IconButton 
              icon="dots-horizontal" 
              size={24} 
              iconColor={theme.icon}
              onPress={() => {
                // 打开设置菜单
                router.push('/settings');
              }}
            />
            <IconButton 
              icon="logout" 
              size={24} 
              onPress={logout}
              iconColor={theme.error}
            />
          </View>
        </View>
      </Animated.View>
      
      {/* 点击抽屉外区域关闭抽屉 */}
      {isDrawerOpen && (
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={toggleDrawer}
        />
      )}

      <SafeAreaView style={styles.container}>
        {/* 顶部导航 */}
        <Animated.View 
          style={[
            styles.header, 
            { 
              opacity: fadeAnim,
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'
            }
          ]}
        >
          <IconButton
            icon="menu"
            size={24}
            iconColor={theme.icon}
            onPress={toggleDrawer}
          />
          <Text style={styles.headerTitle}>
            新对话
          </Text>
          <View style={styles.headerRightContainer}>
            <IconButton
              icon="plus"
              size={24}
              iconColor={theme.icon}
              onPress={handleNewChat}
          />
          </View>
        </Animated.View>

        {/* 主体内容 */}
        <Animated.View 
          style={[
            styles.messagesContainer,
            { opacity: fadeAnim }
          ]}
        >
          {messages.length <= 1 ? (
            renderWelcomeScreen()
          ) : (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map(message => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  feedback={messageFeedback[message.id]}
                  onCopy={copyMessageContent}
                  onFeedback={handleFeedback}
                  theme={theme}
                  isDark={isDark}
                  isStreaming={isStreaming}
                  streamingContent={streamingContent}
                />
              ))}
              
              {loading && !isStreaming && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={theme.primary} size="small" />
                  <Text style={{ color: theme.textSecondary, marginTop: 8 }}>思考中...</Text>
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>

        {/* 底部输入区 */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.inputContainer}
        >
          {currentAttachment && (
            <View style={[styles.attachmentContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.attachmentContent}>
                <Icon name="file-document-outline" size={20} color={theme.primary} />
                <Text style={[styles.attachmentName, { color: theme.text }]} numberOfLines={1} ellipsizeMode="middle">
                  {currentAttachment.name}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                iconColor={theme.icon}
                onPress={removeAttachment}
              />
            </View>
          )}
          
          <View style={[styles.inputSurface, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.inputRow}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
                placeholder={isProcessingAttachment ? "正在处理附件..." : "请输入您的问题..."}
              style={styles.input}
              multiline
              maxLength={500}
              dense
                textColor={theme.text}
                placeholderTextColor={theme.placeholderText}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                editable={!isProcessingAttachment}
              />
              
              <View style={styles.inputActions}>
                {/* 附件上传按钮 */}
                <Menu
                  visible={isAttachmentMenuVisible}
                  onDismiss={() => setIsAttachmentMenuVisible(false)}
                  anchor={
                    <IconButton
                      icon="paperclip"
                      size={24}
                      iconColor={currentAttachment ? theme.primary : theme.iconInactive}
                      onPress={() => setIsAttachmentMenuVisible(true)}
                      disabled={loading || isProcessingAttachment}
                    />
                  }
                  contentStyle={{ backgroundColor: theme.surface }}
                >
                  <Menu.Item 
                    leadingIcon="file-document-outline" 
                    onPress={handleDocumentPick}
                    title="文档" 
                    titleStyle={{ color: theme.text }}
                    description="PDF, Word, Excel, PPT, TXT, CSV, MD"
                    descriptionStyle={{ color: theme.textSecondary, fontSize: 12 }}
                  />
                  <Menu.Item 
                    leadingIcon="image-outline" 
                    onPress={handleImagePick}
                    title="图片" 
                    titleStyle={{ color: theme.text }}
                    description="JPG, PNG, BMP, GIF, TIFF"
                    descriptionStyle={{ color: theme.textSecondary, fontSize: 12 }}
                  />
                </Menu>
                
                {/* 模型选择按钮 */}
                <Menu
                  visible={isModelMenuVisible}
                  onDismiss={() => setIsModelMenuVisible(false)}
                  anchor={
                    <IconButton
                      icon="brain"
                      size={24}
                      iconColor={selectedModel === 'qa' ? theme.success : theme.warning}
                      onPress={() => setIsModelMenuVisible(true)}
                      disabled={loading || isProcessingAttachment}
                    />
                  }
                  contentStyle={{ backgroundColor: theme.surface }}
                >
                  <RadioButton.Group
                    onValueChange={value => {
                      handleModelChange(value);
                    }}
                    value={selectedModel}
                  >
                    <View style={styles.menuItem}>
                      <RadioButton value="qa" color={theme.success} />
                      <Text style={{ color: theme.text }}>问答模型</Text>
                    </View>
                    <View style={styles.menuItem}>
                      <RadioButton value="basic" color={theme.warning} />
                      <Text style={{ color: theme.text }}>基础模型</Text>
                    </View>
                  </RadioButton.Group>
                </Menu>
                
                {/* 知识库选择按钮 */}
                <Menu
                  visible={isKbMenuVisible}
                  onDismiss={() => setIsKbMenuVisible(false)}
                  anchor={
                    <IconButton
                      icon="database"
                      size={24}
                      iconColor={useKnowledgeBase ? theme.success : theme.iconInactive}
                      onPress={() => setIsKbMenuVisible(true)}
                      disabled={loading || isProcessingAttachment}
                    />
                  }
                  contentStyle={{ backgroundColor: theme.surface }}
                >
                  <RadioButton.Group
                    onValueChange={value => {
                      handleKnowledgeBaseChange(value);
                    }}
                    value={useKnowledgeBase ? 'true' : 'false'}
                  >
                    <View style={styles.menuItem}>
                      <RadioButton value="true" color={theme.success} />
                      <Text style={{ color: theme.text }}>使用知识库</Text>
                    </View>
                    <View style={styles.menuItem}>
                      <RadioButton value="false" color={theme.iconInactive} />
                      <Text style={{ color: theme.text }}>不使用知识库</Text>
                    </View>
                  </RadioButton.Group>
                </Menu>
                
                {/* 发送按钮 */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                    (!inputText.trim() && !currentAttachment) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
                  disabled={(!inputText.trim() && !currentAttachment) || loading || isProcessingAttachment}
            >
              <IconButton
                icon="send"
                size={24}
                color="#fff"
                    disabled={(!inputText.trim() && !currentAttachment) || loading || isProcessingAttachment}
              />
            </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* 反馈对话框 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={feedbackModalVisible}
        onRequestClose={cancelFeedback}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>请告诉我们您的反馈</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              您认为这个回答有什么问题？请提供更准确的信息或建议
            </Text>
            
            <TextInput
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="请输入您的反馈..."
              multiline={true}
              numberOfLines={4}
              style={[styles.feedbackInput, { backgroundColor: isDark ? theme.card : '#F5F7FA' }]}
              placeholderTextColor={theme.placeholderText}
              textColor={theme.text}
            />
            
            <View style={styles.modalButtons}>
              <Button 
                mode="text" 
                onPress={cancelFeedback} 
                textColor={theme.textSecondary}
              >
                取消
              </Button>
              <Button 
                mode="contained" 
                onPress={submitFeedback}
                disabled={!feedbackText.trim()}
                buttonColor={theme.primary}
              >
                提交
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

// 创建动态样式函数
const createStyles = (theme, isDark) => StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? theme.border : 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  drawerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  historyItemContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  welcomeLogo: {
    backgroundColor: theme.primary,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row', 
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    paddingBottom: 16,
  },
  userMessageRow: {
    justifyContent: 'flex-start',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContainer: {
    flex: 1,
    maxWidth: '90%',
  },
  messageContent: {
    paddingVertical: 8,
  },
  messageText: {
    color: theme.text,
    fontSize: 16,
    lineHeight: 24,
  },
  messageActions: {
    flexDirection: 'row',
    marginTop: 8,
    marginLeft: -4, // 抵消按钮内边距
    opacity: 0.8, // 默认状态下稍微透明
  },
  actionButton: {
    margin: 0,
    padding: 8,
    backgroundColor: 'transparent',
  },
  activeActionButton: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
  },
  systemMessageContainer: {
    padding: 12,
    marginVertical: 16,
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    borderWidth: 0,
    width: '100%',
  },
  systemMessageText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  inputContainer: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  inputSurface: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 0.5,
  },
  inputRow: {
    flexDirection: 'column',
  },
  input: {
    backgroundColor: 'transparent',
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sendButton: {
    backgroundColor: theme.success,
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: isDark ? '#555555' : '#E0E0E0',
  },
  timeGroupTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.6)' : 'rgba(245, 245, 245, 0.8)',
  },
  historyList: {
    flex: 1,
  },
  userInfoContainer: {
    padding: 16,
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  feedbackInput: {
    borderRadius: 8,
    marginBottom: 20,
    padding: 10,
    height: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  attachmentContainer: {
    marginHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachmentName: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  deleteButton: {
    padding: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
  },
  // 思考过程样式
  thinkingContainerOuter: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(100,100,255,0.05)' : 'rgba(100,100,255,0.02)',
    borderWidth: 2,
    borderColor: isDark ? 'rgba(100,100,255,0.5)' : 'rgba(100,100,255,0.3)',
    overflow: 'hidden',
  },
  thinkingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: isDark ? 'rgba(100,100,255,0.15)' : 'rgba(100,100,255,0.1)',
  },
  thinkingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.primary,
  },
  thinkingContentContainer: {
    padding: 16,
    paddingTop: 8,
  },
  thinkingContent: {
    fontSize: 14,
    color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.77)',
    lineHeight: 20,
  },
  // 引用信息样式
  citationsContainer: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(100,255,100,0.05)' : 'rgba(100,255,100,0.03)',
    elevation: 1,
  },
  citationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.primary,
  },
  citationItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingVertical: 4,
  },
  citationNumber: {
    marginRight: 8,
    fontWeight: 'bold',
    color: theme.primary,
  },
  citationContent: {
    flex: 1,
    fontSize: 14,
    color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.77)',
  },
  mermaidContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    width: '100%',
    marginVertical: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  mermaidTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.textPrimary || '#000',
    textAlign: 'center',
  },
  mermaidImageContainer: {
    width: '100%',
    minHeight: 200,
    position: 'relative',
  },
  mermaidLoading: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  mermaidError: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,0,0,0.05)' : 'rgba(255,0,0,0.03)',
    borderRadius: 8,
    padding: 16,
  },
  thinkingSeparator: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackButton: {
    margin: 0,
    padding: 8,
    backgroundColor: 'transparent',
  },
  citationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  citation: {
    fontSize: 14,
  },
});

export default QA;
