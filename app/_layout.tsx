import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { ReactNode, useEffect } from 'react';
import { Text, View } from 'react-native';
import { MD3Theme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 导入主题相关
import { createTheme } from '../src/theme/theme';
// 导入主题上下文提供者
import { AuthProvider } from '../src/context/AuthContext';
import { ChatProvider } from '../src/context/ChatContext';
import { ThemeProvider, ThemeType, useTheme } from '../src/context/ThemeContext';

// 创建一个包装组件来使用ThemeContext
const ThemedApp = () => {
  const { currentThemeType, getStatusBarStyle } = useTheme();
  
  // 添加调试日志
  useEffect(() => {
    console.log('当前主题类型:', currentThemeType);
  }, [currentThemeType]);
  
  // 确保currentThemeType有效
  const isDark = currentThemeType === ThemeType.DARK;
  
  // 添加错误处理
  let paperTheme: MD3Theme;
  try {
    const theme = createTheme(isDark);
    console.log('主题创建成功', isDark ? '深色模式' : '浅色模式');
    paperTheme = theme as MD3Theme;
  } catch (error) {
    console.error('创建主题时出错:', error);
    // 出错时使用默认主题
    paperTheme = createTheme(false) as MD3Theme;
  }
  
  // 获取状态栏样式，带有安全回退
  const statusBarStyle = getStatusBarStyle ? getStatusBarStyle() : 'auto';
  
  return (
    <PaperProvider theme={paperTheme}>
        <SafeAreaProvider>
        <AuthProvider>
          <ChatProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="qa" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="+not-found" />
          </Stack>
            <StatusBar style={statusBarStyle} />
          </ChatProvider>
        </AuthProvider>
        </SafeAreaProvider>
      </PaperProvider>
  );
};

// 添加错误边界
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      errorMessage: '' 
    };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新状态，以便下一次渲染显示错误UI
    return { 
      hasError: true, 
      errorMessage: error.message || '未知错误' 
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('主题应用错误:', error, errorInfo);
  }
  
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 20 }}>应用加载出错</Text>
          <Text style={{ color: 'red', marginBottom: 10 }}>{this.state.errorMessage}</Text>
          <Text>请重启应用或联系开发人员</Text>
        </View>
      );
    }
    
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <ThemedApp />
          </ChatProvider>
        </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
