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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../src/context/AuthContext';
import { useChat } from '../src/context/ChatContext';
import { ThemeType, useTheme } from '../src/context/ThemeContext';
import { pickDocument, pickImage } from '../src/utils/api';

const { width, height } = Dimensions.get('window');

// 移除模拟聊天历史和初始消息

const QAScreen = () => {
  const [inputText, setInputText] = useState('');
  const { theme, themeType, currentThemeType, getStatusBarStyle } = useTheme();
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModelMenuVisible, setIsModelMenuVisible] = useState(false);
  const [isKbMenuVisible, setIsKbMenuVisible] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-300)).current;
  const router = useRouter();
  
  // 获取认证和聊天上下文
  const { isAuthenticated, user, logout } = useAuth();
  const {
    conversations,
    currentConversationId,
    messages,
    loading,
    isStreaming,
    selectedModel,
    useKnowledgeBase,
    selectedKnowledgeBase,
    createNewConversation,
    selectConversation,
    sendMessage,
    deleteConversationById,
    setSelectedModel,
    setUseKnowledgeBase,
    setSelectedKnowledgeBase,
    setIsStreaming,
    currentAttachment,
    setAttachment,
    removeAttachment,
    isProcessingAttachment,
    loadConversations
  } = useChat();
  
  // 判断是否是深色模式
  const isDark = currentThemeType === ThemeType.DARK;
  
  // 创建动态样式
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  
  // 消息反馈状态
  const [messageFeedback, setMessageFeedback] = useState({});
  
  // 添加更多状态变量
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [currentFeedbackMessageId, setCurrentFeedbackMessageId] = useState(null);
  const [isAttachmentMenuVisible, setIsAttachmentMenuVisible] = useState(false);

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
    if (!isAuthenticated) {
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

  const toggleTts = () => {
    const newStreamingState = !isStreaming;
    setIsStreaming(newStreamingState);
    console.log(`流式响应 ${newStreamingState ? '启用' : '禁用'}`);
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
    await Clipboard.setStringAsync(content);
    Alert.alert('复制成功', '已复制到剪贴板');
  };

  // 处理点赞/点踩
  const handleFeedback = (messageId, feedbackType) => {
    if (feedbackType === 'dislike') {
      // 点踩时，打开反馈对话框
      setCurrentFeedbackMessageId(messageId);
      setFeedbackModalVisible(true);
      return;
    }
    
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
      
      // TODO: 将反馈发送到服务器
      
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

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    if (isSystem) {
      return (
        <View 
          style={styles.systemMessageContainer} 
          key={message.id}
        >
          <Text style={styles.systemMessageText}>{message.content}</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.botMessageRow,
        ]}
        key={message.id}
      >
        {!isUser && (
          <Avatar.Icon
            size={40}
            icon="robot"
            style={styles.avatar}
            color="#fff"
            theme={{ colors: { primary: theme.primary } }}
          />
        )}
        <View style={styles.messageContainer}>
          <Surface
            style={[
              styles.messageBubble,
              isUser ? 
                [styles.userBubble] : 
                [styles.botBubble],
            ]}
          >
            <Text style={[
              isUser ? styles.userMessageText : styles.botMessageText,
            ]}>
              {message.content}
            </Text>
          </Surface>
          
          {/* 机器人回答下方的操作按钮 */}
          {!isUser && (
            <View style={styles.messageActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => copyMessageContent(message.content)}
              >
                <IconButton
                  icon="content-copy"
                  size={18}
                  iconColor={theme.iconInactive}
                  style={styles.actionIcon}
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleFeedback(message.id, 'like')}
              >
                <IconButton
                  icon="thumb-up"
                  size={18}
                  iconColor={messageFeedback[message.id] === 'like' ? theme.primary : theme.iconInactive}
                  style={styles.actionIcon}
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleFeedback(message.id, 'dislike')}
              >
                <IconButton
                  icon="thumb-down"
                  size={18}
                  iconColor={
                    messageFeedback[message.id] && 
                    (messageFeedback[message.id] === 'dislike' || messageFeedback[message.id].type === 'dislike') 
                      ? theme.error 
                      : theme.iconInactive
                  }
                  style={styles.actionIcon}
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  // 找到对应的用户问题
                  const userMessages = messages.filter(msg => msg.type === 'user');
                  const questionContent = userMessages[userMessages.length - 1]?.content || '';
                  regenerateAnswer(questionContent);
                }}
              >
                <IconButton
                  icon="refresh"
                  size={18}
                  iconColor={theme.iconInactive}
                  style={styles.actionIcon}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {isUser && (
          <Avatar.Icon
            size={40}
            icon="account"
            style={styles.avatar}
            color="#fff"
            theme={{ colors: { primary: theme.accent } }}
          />
        )}
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
              console.log('开始调用deleteConversationById');
              await deleteConversationById(id);
              console.log('deleteConversationById调用完成');
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
              <TouchableOpacity 
                style={{flex: 1}}
                onPress={() => handleSelectChat(item)}
              >
                <View style={styles.historyItemContent}>
                  <Text 
                    style={[styles.historyTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
                    {formatDate(item.updated_at)}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* 添加删除按钮 */}
              <IconButton
                icon="trash-can-outline"
                size={20}
                iconColor={theme.error}
                onPress={(e) => {
                  console.log("删除按钮被点击");
                  e.stopPropagation(); // 阻止事件冒泡
                  handleDeleteChat(item.id);
                }}
                style={styles.deleteButton}
              />
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            新对话
          </Text>
          <View style={styles.headerRightContainer}>
            <IconButton
              icon={isStreaming ? "volume-high" : "volume-off"}
              size={24}
              iconColor={isStreaming ? theme.success : theme.icon}
              onPress={toggleTts}
            />
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
              {messages.map(message => renderMessage(message))}
              
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
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  messageContainer: {
    maxWidth: '75%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: isDark ? theme.primary : '#E3F2FD',
    borderBottomRightRadius: 4,
    marginRight: 8,
  },
  botBubble: {
    backgroundColor: theme.surface,
    borderBottomLeftRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  userMessageText: {
    color: isDark ? '#FFFFFF' : theme.text,
  },
  botMessageText: {
    color: theme.text,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
    marginLeft: 8,
  },
  actionButton: {
    marginRight: 8,
  },
  actionIcon: {
    margin: 0,
  },
  systemMessageContainer: {
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    borderWidth: 0,
  },
  systemMessageText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  avatar: {
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 16,
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
});

export default QAScreen;
