import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Clipboard,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemeType, useTheme } from '../src/context/ThemeContext';

const { width, height } = Dimensions.get('window');

// 模拟对话历史
const chatHistory = [
  { id: '1', title: '什么是5G网络架构?', date: '2023-05-15' },
  { id: '2', title: '核心网的主要功能有哪些?', date: '2023-05-16' },
  { id: '3', title: '网络切片技术的优势', date: '2023-05-17' },
  { id: '4', title: '移动边缘计算在5G中的应用', date: '2023-05-18' },
  { id: '5', title: '如何解决网络拥塞问题?', date: '2023-05-19' },
];

// 模拟问答数据
const initialMessages = [
  {
    id: 1,
    type: 'system',
    content: '欢迎使用5GC"智擎"知识库问答系统，请输入您的问题。',
    timestamp: new Date(),
  },
];

const QAScreen = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, themeType, currentThemeType, getStatusBarStyle } = useTheme();
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('qa'); // 'basic' 或 'qa'
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [isModelMenuVisible, setIsModelMenuVisible] = useState(false);
  const [isKbMenuVisible, setIsKbMenuVisible] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-300)).current;
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const router = useRouter();
  
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

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const toggleTts = () => {
    setIsTtsEnabled(!isTtsEnabled);
    // 这里可以添加TTS语音合成功能
    console.log(`TTS ${!isTtsEnabled ? 'enabled' : 'disabled'}`);
  };

  const handleNewChat = () => {
    setMessages(initialMessages);
    setInputText('');
    // 如果抽屉是打开的，关闭它
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
    }
  };

  const handleSelectChat = (chat) => {
    // 这里可以加载选中的聊天内容
    setMessages([
      initialMessages[0],
      {
        id: 2,
        type: 'user',
        content: chat.title,
        timestamp: new Date(chat.date),
      },
      {
        id: 3,
        type: 'bot',
        content: `关于"${chat.title}"的模拟回答内容。这是来自知识库的回复...`,
        timestamp: new Date(chat.date),
      },
    ]);
    setIsDrawerOpen(false);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    // 添加用户问题
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setIsLoading(true);

    // 模拟API响应
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: `这是${selectedModel === 'qa' ? '问答模型' : '基础模型'}${useKnowledgeBase ? '使用知识库' : '不使用知识库'}关于"${inputText}"的回答。${useKnowledgeBase ? '知识库中包含了相关信息，根据分析，这个问题的答案是...' : '根据我的理解，这个问题的答案是...'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
      
      // 滚动到底部
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
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

  // 提交反馈内容
  const submitFeedback = () => {
    if (currentFeedbackMessageId) {
      // 保存反馈内容
      setMessageFeedback(prev => ({
        ...prev,
        [currentFeedbackMessageId]: {
          type: 'dislike',
          content: feedbackText
        }
      }));
      
      // 这里可以发送反馈到服务器
      console.log(`提交反馈：消息ID ${currentFeedbackMessageId}，内容：${feedbackText}`);
      
      // 关闭对话框并重置状态
      setFeedbackModalVisible(false);
      setFeedbackText('');
      setCurrentFeedbackMessageId(null);
      
      // 显示感谢信息
      Alert.alert('反馈已提交', '感谢您的反馈，我们会继续改进。');
    }
  };
  
  // 取消反馈
  const cancelFeedback = () => {
    setFeedbackModalVisible(false);
    setFeedbackText('');
    setCurrentFeedbackMessageId(null);
  };

  // 重新回答
  const regenerateAnswer = (questionContent) => {
    setIsLoading(true);
    // 模拟重新生成回答
    setTimeout(() => {
      const botResponse = {
        id: Date.now(),
        type: 'bot',
        content: `这是关于"${questionContent}"的重新回答。我尝试提供更准确、更全面的回答...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
      
      // 滚动到底部
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
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
        
        {/* 时间分组标题 */}
        <Text style={[styles.timeGroupTitle, { color: theme.text }]}>今天</Text>
        
        <FlatList
          data={chatHistory}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.historyItem}
              onPress={() => handleSelectChat(item)}
            >
              <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{item.date}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <Divider style={{ backgroundColor: theme.divider, opacity: 0.5 }} />}
          style={styles.historyList}
        />
        
        {/* 用户信息区域 */}
        <View style={styles.userInfoContainer}>
          <Divider style={{ backgroundColor: theme.divider }} />
          <View style={styles.userInfoContent}>
            <Avatar.Icon
              size={40}
              icon="account"
              style={styles.userAvatar}
              color="#fff"
              theme={{ colors: { primary: theme.primary } }}
            />
            <View style={styles.userTextContainer}>
              <Text style={[styles.userName, { color: theme.text }]}>kkutys</Text>
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
              icon={isTtsEnabled ? "volume-high" : "volume-off"}
              size={24}
              iconColor={isTtsEnabled ? theme.success : theme.icon}
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

        {/* 消息内容区 */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length <= 1 && styles.centeredContent
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderWelcomeScreen()}
          {messages.length > 1 && messages.map((msg, index) => {
            // 跳过第一条系统消息，因为我们用欢迎屏幕代替它
            if (index === 0 && msg.type === 'system') return null;
            return renderMessage(msg);
          })}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={{ color: theme.textSecondary }}>正在思考...</Text>
            </View>
          )}
        </ScrollView>

        {/* 底部输入区 */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.inputContainer}
        >
          <View style={[styles.inputSurface, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.inputRow}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="请输入您的问题..."
                style={styles.input}
                multiline
                maxLength={500}
                dense
                textColor={theme.text}
                placeholderTextColor={theme.placeholderText}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />
              
              <View style={styles.inputActions}>
                {/* 附件上传按钮 */}
                <IconButton
                  icon="paperclip"
                  size={24}
                  iconColor={theme.iconInactive}
                  onPress={() => {
                    // 这里添加上传附件的功能
                    console.log('Upload attachment');
                  }}
                />
                
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
                    />
                  }
                  contentStyle={{ backgroundColor: theme.surface }}
                >
                  <RadioButton.Group
                    onValueChange={value => {
                      setSelectedModel(value);
                      setIsModelMenuVisible(false);
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
                    />
                  }
                  contentStyle={{ backgroundColor: theme.surface }}
                >
                  <RadioButton.Group
                    onValueChange={value => {
                      setUseKnowledgeBase(value === 'use');
                      setIsKbMenuVisible(false);
                    }}
                    value={useKnowledgeBase ? 'use' : 'none'}
                  >
                    <View style={styles.menuItem}>
                      <RadioButton value="use" color={theme.success} />
                      <Text style={{ color: theme.text }}>使用知识库</Text>
                    </View>
                    <View style={styles.menuItem}>
                      <RadioButton value="none" color={theme.iconInactive} />
                      <Text style={{ color: theme.text }}>不使用知识库</Text>
                    </View>
                  </RadioButton.Group>
                </Menu>
                
                {/* 发送按钮 */}
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!inputText.trim() || isLoading}
                >
                  <IconButton
                    icon="send"
                    size={24}
                    color="#fff"
                    disabled={!inputText.trim() || isLoading}
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
    padding: 16,
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
    padding: 16,
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userAvatar: {
    marginBottom: 4,
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
});

export default QAScreen;
