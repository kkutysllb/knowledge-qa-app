import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Button,
  Divider,
  IconButton,
  List,
  Modal,
  Provider as PaperProvider,
  Portal,
  Text
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { ThemeType, useTheme } from '../src/context/ThemeContext';

const SettingsScreen = () => {
  const { themeType, setTheme, theme, currentThemeType, getStatusBarStyle } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [language, setLanguage] = useState('中文 (简体中文)');
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 根据当前主题确定是否为深色模式
  const isDark = currentThemeType === ThemeType.DARK;
  
  // 创建动态样式
  const dynamicStyles = useMemo(() => createStyles(theme), [theme]);
  
  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);
  
  const handleThemeChange = (newTheme) => {
    console.log('切换主题为:', newTheme);
    setTheme(newTheme);
    setThemeModalVisible(false);
  };
  
  // 处理退出登录
  const handleLogout = useCallback(async () => {
    try {
      setLoggingOut(true);
      console.log('正在退出登录...');
      
      // 调用登出方法
      await logout();
      
      console.log('已登出');
    } catch (error) {
      console.error('退出登录出错:', error);
      alert('退出登录时出现问题，请重试');
    } finally {
      setLoggingOut(false);
    }
  }, [logout]);

  return (
    <PaperProvider theme={{ colors: theme }}>
      <View style={dynamicStyles.container}>
        <StatusBar 
          translucent 
          backgroundColor="transparent" 
          barStyle={getStatusBarStyle()} 
        />
        <SafeAreaView style={dynamicStyles.safeArea}>
          <View style={dynamicStyles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.push('/qa')}
              iconColor={theme.text}
            />
            <Text style={dynamicStyles.headerTitle}>设置</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            style={dynamicStyles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* 账户信息 */}
            <View style={dynamicStyles.sectionContainer}>
              <Text style={dynamicStyles.sectionLabel}>账户</Text>
              
              {loading ? (
                <ActivityIndicator size="small" color={theme.primary} style={{margin: 20}} />
              ) : (
                <>
                  <View style={dynamicStyles.itemContainer}>
                    <View style={dynamicStyles.iconContainer}>
                      <List.Icon icon="account" color={theme.icon} />
                    </View>
                    <View style={dynamicStyles.textContainer}>
                      <Text style={dynamicStyles.itemTitle}>{user?.username || '加载中...'}</Text>
                      <Text style={dynamicStyles.itemDescription}>{user?.role === 'admin' ? '知识库管理员' : '普通用户'}</Text>
                    </View>
                  </View>
                  
                  <Divider style={dynamicStyles.divider} />
                  
                  <View style={dynamicStyles.itemContainer}>
                    <View style={dynamicStyles.iconContainer}>
                      <List.Icon icon="email" color={theme.icon} />
                    </View>
                    <View style={dynamicStyles.textContainer}>
                      <Text style={dynamicStyles.itemTitle}>邮箱</Text>
                      <Text style={dynamicStyles.itemDescription}>{user?.email || 'loading@example.com'}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* 应用设置 */}
            <View style={dynamicStyles.sectionContainer}>
              <Text style={dynamicStyles.sectionLabel}>应用</Text>
              
              <View style={dynamicStyles.itemContainer}>
                <View style={dynamicStyles.iconContainer}>
                  <List.Icon icon="earth" color={theme.icon} />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text style={dynamicStyles.itemTitle}>语言</Text>
                  <Text style={dynamicStyles.itemDescription}>简体中文</Text>
                </View>
              </View>
              
              <Divider style={dynamicStyles.divider} />

              <TouchableOpacity
                style={dynamicStyles.itemContainer}
                onPress={() => setThemeModalVisible(true)}
              >
                <View style={dynamicStyles.iconContainer}>
                  <List.Icon icon="theme-light-dark" color={theme.icon} />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text style={dynamicStyles.itemTitle}>外观</Text>
                  <Text style={dynamicStyles.itemDescription}>
                    {themeType === ThemeType.LIGHT 
                      ? '浅色' 
                      : themeType === ThemeType.DARK 
                        ? '深色（黑色）' 
                        : '随系统'}
                  </Text>
                </View>
                <List.Icon icon="chevron-right" color={theme.icon} />
              </TouchableOpacity>
            </View>

            {/* 关于 */}
            <View style={dynamicStyles.sectionContainer}>
              <Text style={dynamicStyles.sectionLabel}>关于</Text>
              
              <TouchableOpacity style={dynamicStyles.itemContainer}>
                <View style={dynamicStyles.iconContainer}>
                  <List.Icon icon="update" color={theme.icon} />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text style={dynamicStyles.itemTitle}>检查更新</Text>
                  <Text style={dynamicStyles.itemDescription}>1.2.2(79)</Text>
                </View>
                <List.Icon icon="chevron-right" color={theme.icon} />
              </TouchableOpacity>
              
              <Divider style={dynamicStyles.divider} />
              
              <TouchableOpacity style={dynamicStyles.itemContainer}>
                <View style={dynamicStyles.iconContainer}>
                  <List.Icon icon="file-document-outline" color={theme.icon} />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text style={dynamicStyles.itemTitle}>服务协议</Text>
                </View>
                <List.Icon icon="chevron-right" color={theme.icon} />
              </TouchableOpacity>
              
              <Divider style={dynamicStyles.divider} />
              
              <TouchableOpacity style={dynamicStyles.itemContainer}>
                <View style={dynamicStyles.iconContainer}>
                  <List.Icon icon="message-text-outline" color={theme.icon} />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text style={dynamicStyles.itemTitle}>联系我们</Text>
                </View>
                <List.Icon icon="chevron-right" color={theme.icon} />
              </TouchableOpacity>
            </View>

            {/* 退出登录按钮 */}
            <View style={dynamicStyles.logoutContainer}>
              <Button
                mode="contained"
                style={dynamicStyles.logoutButton}
                labelStyle={dynamicStyles.logoutButtonText}
                onPress={handleLogout}
                loading={loggingOut}
                disabled={loggingOut}
              >
                退出登录
              </Button>
            </View>

            {/* 底部安全间距 */}
            <View style={dynamicStyles.safeBottom} />
          </ScrollView>
          
          {/* 主题选择模态框 */}
          <Portal>
            <Modal
              visible={themeModalVisible}
              onDismiss={() => setThemeModalVisible(false)}
              contentContainerStyle={dynamicStyles.modalContainer}
            >
              <Text style={dynamicStyles.modalTitle}>外观</Text>
              
              <TouchableOpacity 
                style={dynamicStyles.modalOption}
                onPress={() => handleThemeChange(ThemeType.SYSTEM)}
              >
                <View style={dynamicStyles.radioContainer}>
                  <View style={[
                    dynamicStyles.radioOuter,
                    themeType === ThemeType.SYSTEM && dynamicStyles.radioOuterSelected
                  ]}>
                    {themeType === ThemeType.SYSTEM && <View style={dynamicStyles.radioInner} />}
                  </View>
                  <Text style={dynamicStyles.modalOptionText}>系统</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={dynamicStyles.modalOption}
                onPress={() => handleThemeChange(ThemeType.LIGHT)}
              >
                <View style={dynamicStyles.radioContainer}>
                  <View style={[
                    dynamicStyles.radioOuter,
                    themeType === ThemeType.LIGHT && dynamicStyles.radioOuterSelected
                  ]}>
                    {themeType === ThemeType.LIGHT && <View style={dynamicStyles.radioInner} />}
                  </View>
                  <Text style={dynamicStyles.modalOptionText}>浅色</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={dynamicStyles.modalOption}
                onPress={() => handleThemeChange(ThemeType.DARK)}
              >
                <View style={dynamicStyles.radioContainer}>
                  <View style={[
                    dynamicStyles.radioOuter,
                    themeType === ThemeType.DARK && dynamicStyles.radioOuterSelected
                  ]}>
                    {themeType === ThemeType.DARK && <View style={dynamicStyles.radioInner} />}
                  </View>
                  <Text style={dynamicStyles.modalOptionText}>深色</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={dynamicStyles.confirmButton}
                onPress={() => setThemeModalVisible(false)}
              >
                <Text style={dynamicStyles.confirmButtonText}>确认</Text>
              </TouchableOpacity>
            </Modal>
          </Portal>
        </SafeAreaView>
      </View>
    </PaperProvider>
  );
};

// 动态样式创建函数
const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    height: 56,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  content: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.divider,
    marginLeft: 64, // 与图标对齐
  },
  modalContainer: {
    margin: 40,
    marginTop: 100,
    marginBottom: 100,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  selectedOption: {
    fontWeight: 'bold',
    color: theme.primary,
  },
  confirmButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#EEEEEE',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#0A59F7',
    fontWeight: '600',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#0A59F7',
    borderWidth: 1,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0A59F7',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#f44336', // 红色
    paddingVertical: 6,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  safeBottom: {
    height: 40,
  },
});

export default SettingsScreen;
