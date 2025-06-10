import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  TextInput as RNTextInput,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Checkbox,
  Text
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../src/assets/logo';
import { ThemeType, useTheme } from '../src/context/ThemeContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [checked, setChecked] = useState(false);
  const { theme, themeType, currentThemeType, getStatusBarStyle } = useTheme();
  
  // 判断是否是深色模式
  const isDark = currentThemeType === ThemeType.DARK;
  
  // 创建动态样式
  const dynamicStyles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  
  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const handleLogin = () => {
    setIsLoading(true);
    // 模拟登录过程
    setTimeout(() => {
      setIsLoading(false);
      router.push('/qa');
    }, 1500);
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
              />
              <TouchableOpacity 
                style={dynamicStyles.eyeIconContainer} 
                onPress={toggleSecureEntry}
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
              (!username || !password || !checked) && dynamicStyles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={!username || !password || !checked || isLoading}
          >
            <Text style={dynamicStyles.loginButtonText}>
              {isLoading ? '登录中...' : '登录'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={dynamicStyles.footerContainer}>
          <Text style={dynamicStyles.footerText}>
            陕西移动网管中心自研团队 5GC"智擎"平台知识库问答 v1.0.0
          </Text>
        </View>
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
