import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
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
  Portal,
  Text
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeType, useTheme } from '../src/context/ThemeContext';

const SettingsScreen = () => {
  const { themeType, setTheme, theme, currentThemeType, getStatusBarStyle } = useTheme();
  const [language, setLanguage] = useState('中文 (简体中文)');
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  // 根据当前主题确定是否为深色模式
  const isDark = currentThemeType === ThemeType.DARK;
  
  // 创建动态样式
  const dynamicStyles = useMemo(() => createStyles(theme), [theme]);
  
  const handleThemeChange = (newTheme) => {
    console.log('切换主题为:', newTheme);
    setTheme(newTheme);
    setThemeModalVisible(false);
  };
  
  // 直接处理退出登录，不使用Alert.alert
  const handleLogout = useCallback(async () => {
    try {
      setLoggingOut(true);
      console.log('正在退出登录...');
      
      // 清除所有存储的用户数据
      await AsyncStorage.removeItem('userData');
      console.log('用户数据已清除');
      
      // 直接调用路由跳转
      console.log('正在跳转到登录页...');
      
      // 关闭当前页面并返回到登录页
      router.navigate({
        pathname: '/login',
        replace: true
      });
      
      console.log('已执行跳转命令');
    } catch (error) {
      console.error('退出登录出错:', error);
      // 如果路由方法失败，尝试直接操作应用状态
      alert('退出登录时出现问题，请重试');
    } finally {
      setLoggingOut(false);
    }
  }, []);

  // 自定义的主题选择模态框
  const renderThemeModal = () => {
    return (
      <Portal>
        <Modal
          visible={themeModalVisible}
          onDismiss={() => setThemeModalVisible(false)}
          contentContainerStyle={dynamicStyles.modalContainer}
        >
          <Text style={dynamicStyles.modalTitle}>选择外观</Text>
          
          <TouchableOpacity 
            style={dynamicStyles.modalOption}
            onPress={() => handleThemeChange(ThemeType.LIGHT)}
          >
            <Text style={[
              dynamicStyles.modalOptionText, 
              themeType === ThemeType.LIGHT && dynamicStyles.selectedOption
            ]}>
              浅色
            </Text>
            {themeType === ThemeType.LIGHT && (
              <List.Icon icon="check" color={theme.iconActive} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={dynamicStyles.modalOption}
            onPress={() => handleThemeChange(ThemeType.DARK)}
          >
            <Text style={[
              dynamicStyles.modalOptionText, 
              themeType === ThemeType.DARK && dynamicStyles.selectedOption
            ]}>
              深色（黑色）
            </Text>
            {themeType === ThemeType.DARK && (
              <List.Icon icon="check" color={theme.iconActive} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={dynamicStyles.modalOption}
            onPress={() => handleThemeChange(ThemeType.SYSTEM)}
          >
            <Text style={[
              dynamicStyles.modalOptionText, 
              themeType === ThemeType.SYSTEM && dynamicStyles.selectedOption
            ]}>
              随系统
            </Text>
            {themeType === ThemeType.SYSTEM && (
              <List.Icon icon="check" color={theme.iconActive} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={dynamicStyles.modalCancelButton}
            onPress={() => setThemeModalVisible(false)}
          >
            <Text style={dynamicStyles.modalCancelText}>取消</Text>
          </TouchableOpacity>
        </Modal>
      </Portal>
    );
  };

  return (
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
            
            <View style={dynamicStyles.itemContainer}>
              <View style={dynamicStyles.iconContainer}>
                <List.Icon icon="account" color={theme.icon} />
              </View>
              <View style={dynamicStyles.textContainer}>
                <Text style={dynamicStyles.itemTitle}>kkutys</Text>
                <Text style={dynamicStyles.itemDescription}>知识库管理员</Text>
              </View>
            </View>
            
            <Divider style={dynamicStyles.divider} />
            
            <View style={dynamicStyles.itemContainer}>
              <View style={dynamicStyles.iconContainer}>
                <List.Icon icon="email" color={theme.icon} />
              </View>
              <View style={dynamicStyles.textContainer}>
                <Text style={dynamicStyles.itemTitle}>邮箱</Text>
                <Text style={dynamicStyles.itemDescription}>kkutys@example.com</Text>
              </View>
            </View>
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
              onPress={() => setThemeModalVisible(true)}
            >
              <View style={dynamicStyles.itemContainer}>
                <View style={dynamicStyles.iconContainer}>
                  <List.Icon icon="theme-light-dark" color={theme.icon} />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text style={dynamicStyles.itemTitle}>外观</Text>
                  <Text style={dynamicStyles.itemDescription}>
                    {themeType === ThemeType.LIGHT ? "浅色" : 
                     themeType === ThemeType.DARK ? "深色（黑色）" : "随系统"}
                  </Text>
                </View>
                <View style={dynamicStyles.arrowContainer}>
                  <IconButton 
                    icon="chevron-right" 
                    size={20} 
                    iconColor={theme.iconInactive} 
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* 关于 */}
          <View style={dynamicStyles.sectionContainer}>
            <Text style={dynamicStyles.sectionLabel}>关于</Text>
            
            <TouchableOpacity>
              <View style={dynamicStyles.itemContainer}>
                <View style={dynamicStyles.iconContainer}>
                  <List.Icon icon="update" color={theme.icon} />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text style={dynamicStyles.itemTitle}>检查更新</Text>
                  <Text style={dynamicStyles.itemDescription}>1.2.2(79)</Text>
                </View>
                <View style={dynamicStyles.arrowContainer}>
                  <IconButton 
                    icon="chevron-right" 
                    size={20} 
                    iconColor={theme.iconInactive} 
                  />
                </View>
              </View>
            </TouchableOpacity>
            
            <Divider style={dynamicStyles.divider} />
            
            <TouchableOpacity>
              <View style={dynamicStyles.itemContainer}>
                <View style={dynamicStyles.iconContainer}>
                  <List.Icon icon="file-document-outline" color={theme.icon} />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text style={dynamicStyles.itemTitle}>服务协议</Text>
                </View>
                <View style={dynamicStyles.arrowContainer}>
                  <IconButton 
                    icon="chevron-right" 
                    size={20} 
                    iconColor={theme.iconInactive} 
                  />
                </View>
              </View>
            </TouchableOpacity>
            
            <Divider style={dynamicStyles.divider} />
            
            <TouchableOpacity>
              <View style={dynamicStyles.itemContainer}>
                <View style={dynamicStyles.iconContainer}>
                  <List.Icon icon="message-outline" color={theme.icon} />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text style={dynamicStyles.itemTitle}>联系我们</Text>
                </View>
                <View style={dynamicStyles.arrowContainer}>
                  <IconButton 
                    icon="chevron-right" 
                    size={20} 
                    iconColor={theme.iconInactive} 
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* 退出登录 - 使用Button替代TouchableOpacity */}
          <View style={dynamicStyles.logoutButtonContainer}>
            <Button 
              mode="contained"
              buttonColor="#FF3B30"
              textColor="#FFFFFF"
              style={dynamicStyles.logoutButtonNew}
              labelStyle={dynamicStyles.logoutButtonLabel}
              onPress={handleLogout}
              loading={loggingOut}
              disabled={loggingOut}
            >
              退出登录
            </Button>
          </View>

          {/* 底部版权信息 */}
          <View style={dynamicStyles.footer}>
            <Text style={dynamicStyles.footerText}>模型名称: 5GC"智擎"</Text>
            <Text style={dynamicStyles.footerText}>备案号: 陕西移动网管中心自研团队</Text>
            <Text style={dynamicStyles.footerText}>内容由 AI 生成，请仔细甄别，并合法使用</Text>
          </View>
        </ScrollView>
        
        {/* 渲染主题选择模态框 */}
        {renderThemeModal()}
      </SafeAreaView>
    </View>
  );
};

// 创建动态样式函数
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: theme.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  content: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 8,
    backgroundColor: theme.surface,
  },
  sectionLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 8,
    width: 24,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  arrowContainer: {
    width: 40,
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    color: theme.text,
  },
  itemDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 0.5,
    backgroundColor: theme.divider,
    marginLeft: 16,
  },
  logoutButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  logoutButtonNew: {
    borderRadius: 8,
    paddingVertical: 4,
  },
  logoutButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  // 主题选择模态框样式
  modalContainer: {
    backgroundColor: theme.surface,
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  modalOptionText: {
    fontSize: 16,
    color: theme.text,
  },
  selectedOption: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
});

export default SettingsScreen;
