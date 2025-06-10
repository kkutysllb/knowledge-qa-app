import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  IconButton,
  Text,
  Surface,
  useTheme,
  Avatar,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// 模拟问答数据
const initialMessages = [
  {
    id: 1,
    type: 'system',
    content: '欢迎使用知识库问答系统，请输入您的问题。',
    timestamp: new Date(),
  },
];

const QAScreen = ({ navigation }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 动画效果
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

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
        content: `这是关于"${inputText}"的回答。知识库中包含了相关信息，根据分析，这个问题的答案是...`,
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
        <Surface style={styles.systemMessageContainer} key={message.id}>
          <Text style={styles.systemMessageText}>{message.content}</Text>
        </Surface>
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
            theme={{ colors: { primary: theme.colors.primary } }}
          />
        )}
        <Surface
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          <Text style={isUser ? styles.userMessageText : styles.botMessageText}>
            {message.content}
          </Text>
        </Surface>
        {isUser && (
          <Avatar.Icon
            size={40}
            icon="account"
            style={styles.avatar}
            color="#fff"
            theme={{ colors: { primary: theme.colors.accent } }}
          />
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#f5f7fa', '#c3cfe2']}
      style={styles.gradient}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <Animated.View 
          style={[
            styles.header, 
            { opacity: fadeAnim }
          ]}
        >
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>知识库问答</Text>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => {}}
          />
        </Animated.View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text>正在思考...</Text>
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.inputContainer}
        >
          <Surface style={styles.inputSurface}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="请输入您的问题..."
              style={styles.input}
              multiline
              maxLength={500}
              dense
            />
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
          </Surface>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 4,
    marginRight: 8,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    marginLeft: 8,
  },
  userMessageText: {
    color: '#000',
  },
  botMessageText: {
    color: '#000',
  },
  systemMessageContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderRadius: 16,
    marginVertical: 8,
  },
  systemMessageText: {
    color: '#555',
    fontSize: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
});

export default QAScreen;
