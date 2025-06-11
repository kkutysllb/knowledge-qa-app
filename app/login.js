import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    TextInput as RNTextInput,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import {
    Checkbox,
    Snackbar,
    Text
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../src/assets/logo';
import { useAuth } from '../src/context/AuthContext';
import { ThemeType, useTheme } from '../src/context/ThemeContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [checked, setChecked] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { theme, themeType, currentThemeType, getStatusBarStyle } = useTheme();
  const { isAuthenticated, login, loading, error, clearError } = useAuth();
  
  // 判断是否是深色模式
  const isDark = currentThemeType === ThemeType.DARK;
  
  // 创建动态样式
  const dynamicStyles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  
  // 监听登录状态变化
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/qa');
    }
  }, [isAuthenticated]);
  
  // 监听错误状态
  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarVisible(true);
    }
  }, [error]);
  
  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      setSnackbarMessage('请输入用户名');
      setSnackbarVisible(true);
      return;
    }
    
    if (!password.trim()) {
      setSnackbarMessage('请输入密码');
      setSnackbarVisible(true);
      return;
    }
    
    if (!checked) {
      setSnackbarMessage('请阅读并同意用户协议与隐私政策');
      setSnackbarVisible(true);
      return;
    }
    
    try {
      // 调用登录函数
      const success = await login(username, password);
      if (success) {
        console.log('登录成功，即将跳转到问答页面');
      }
    } catch (error) {
      // 错误已经在AuthContext中处理，这里只需处理额外的UI反馈
      console.error('登录失败:', error);
      setSnackbarMessage(error.message || '登录失败，请检查网络连接');
      setSnackbarVisible(true);
    }
  };
  
  const handleDismissSnackbar = () => {
    setSnackbarVisible(false);
    clearError();
  };

  return (
    <View style={dynamicStyles.backgroundImage}>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle={getStatusBarStyle()} 
      />
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.logoContainer}>
          <Logo size="large" />
        </View>
        
        <Text style={dynamicStyles.loginDescription}>账号密码登录</Text>
            
        <View style={dynamicStyles.formContainer}>
          <View style={dynamicStyles.inputWrapper}>
            <Ionicons 
              name="person-outline" 
              size={20} 
              color={theme.placeholderText} 
              style={dynamicStyles.inputIcon} 
            />
            <RNTextInput
              placeholder="账号"
              value={username}
              onChangeText={setUsername}
              style={dynamicStyles.input}
              placeholderTextColor={theme.placeholderText}
              color={theme.text}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
          
          <View style={dynamicStyles.inputWrapper}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={theme.placeholderText} 
              style={dynamicStyles.inputIcon} 
            />
            <View style={dynamicStyles.passwordInputContainer}>
              <RNTextInput
              placeholder="密码"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
                style={dynamicStyles.input}
                placeholderTextColor={theme.placeholderText}
                color={theme.text}
                editable={!loading}
              />
              <TouchableOpacity 
                style={dynamicStyles.eyeIconContainer} 
                  onPress={toggleSecureEntry}
                disabled={loading}
              >
                <Ionicons 
                  name={secureTextEntry ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={theme.placeholderText} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={dynamicStyles.checkboxContainer}>
            <Checkbox.Android
              status={checked ? 'checked' : 'unchecked'}
              onPress={() => setChecked(!checked)}
              color={theme.primary}
              disabled={loading}
            />
            <Text style={dynamicStyles.termsText}>
              已阅读并同意 
              <Text style={dynamicStyles.termsLink}>用户协议</Text> 
              与 
              <Text style={dynamicStyles.termsLink}>隐私政策</Text>
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              dynamicStyles.loginButton, 
              (!username || !password || !checked || loading) && dynamicStyles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={!username || !password || !checked || loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <Text style={dynamicStyles.loginButtonText}>登录</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={dynamicStyles.footerContainer}>
          <Text style={dynamicStyles.footerText}>
            陕西移动网管中心自研团队 5GC"智擎"平台知识库问答 v1.0.0
          </Text>
        </View>
        
        <Snackbar
          visible={snackbarVisible}
          onDismiss={handleDismissSnackbar}
          duration={3000}
          style={{ backgroundColor: isDark ? '#333' : '#f0f0f0' }}
          wrapperStyle={{ bottom: 80 }}
        >
          <Text style={{ color: isDark ? '#fff' : '#333' }}>
            {snackbarMessage}
          </Text>
        </Snackbar>
      </SafeAreaView>
    </View>
  );
};

// 创建动态样式函数
const createStyles = (theme, isDark) => StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loginDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 10,
    backgroundColor: isDark ? theme.card : theme.surface,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  passwordInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIconContainer: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  termsText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  termsLink: {
    color: theme.primary,
  },
  loginButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: isDark ? '#555555' : '#CCCCCC',
  },
  loginButtonText: {
    color: theme.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    color: theme.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LoginScreen;
