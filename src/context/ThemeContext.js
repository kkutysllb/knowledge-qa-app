import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// 主题类型
export const ThemeType = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// 主题颜色配置 - 优化颜色对比度
export const ThemeColors = {
  light: {
    primary: '#3F51B5',
    secondary: '#7986CB',
    accent: '#FF4081',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    buttonText: '#FFFFFF',
    placeholderText: '#9E9E9E',
    icon: '#424242',
    iconActive: '#3F51B5',
    iconInactive: '#9E9E9E',
    border: '#E0E0E0',
    notification: '#FF4081',
    error: '#B00020',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
    statusBar: 'dark-content',
    header: '#FFFFFF',
    headerText: '#212121',
    tabBar: '#FFFFFF',
    tabBarText: '#757575',
    tabBarActiveText: '#3F51B5',
    divider: '#EEEEEE',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    primary: '#5C6BC0',     // 更亮的蓝色，提高可见性
    secondary: '#7986CB',   
    accent: '#FF80AB',      // 更亮的粉色
    background: '#121212',  // 深色背景
    surface: '#1E1E1E',     // 卡片背景
    card: '#2D2D2D',        // 更亮的卡片，增强区分度
    text: '#FFFFFF',        // 白色文本
    textSecondary: '#CCCCCC', // 浅灰色次要文本，提高可读性
    buttonText: '#FFFFFF',  // 按钮文本
    placeholderText: '#999999', // 占位符文本
    icon: '#E0E0E0',        // 图标颜色更亮
    iconActive: '#82B1FF',  // 活跃图标颜色更明显
    iconInactive: '#757575', // 非活跃图标
    border: '#424242',      // 边框颜色
    notification: '#FF80AB', // 通知颜色
    error: '#CF6679',       // 错误颜色
    success: '#4CAF50',     // 成功颜色
    warning: '#FFEB3B',     // 警告颜色
    info: '#64B5F6',        // 信息颜色
    statusBar: 'light-content', // 状态栏样式
    header: '#1E1E1E',      // 头部背景
    headerText: '#FFFFFF',  // 头部文本
    tabBar: '#1E1E1E',      // 标签栏背景
    tabBarText: '#BBBBBB',  // 标签栏文本
    tabBarActiveText: '#82B1FF', // 活跃标签文本
    divider: '#424242',     // 分隔线
    shadow: 'rgba(0, 0, 0, 0.5)', // 阴影
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState(ThemeType.SYSTEM);
  const [isLoading, setIsLoading] = useState(true);

  // 获取当前应该使用的颜色方案
  const getCurrentTheme = () => {
    if (themeType === ThemeType.SYSTEM) {
      return systemColorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
    }
    return themeType === ThemeType.DARK ? ThemeColors.dark : ThemeColors.light;
  };

  // 获取当前主题模式名称
  const getCurrentThemeType = () => {
    if (themeType === ThemeType.SYSTEM) {
      return systemColorScheme === 'dark' ? ThemeType.DARK : ThemeType.LIGHT;
    }
    return themeType;
  };

  // 加载保存的主题设置
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeType');
        if (savedTheme) {
          setThemeType(savedTheme);
        }
      } catch (error) {
        console.log('加载主题设置失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTheme();
  }, []);

  // 保存主题设置
  const saveTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem('themeType', newTheme);
      setThemeType(newTheme);
    } catch (error) {
      console.log('保存主题设置失败:', error);
    }
  };

  // 切换主题
  const toggleTheme = () => {
    const newTheme = themeType === ThemeType.LIGHT 
      ? ThemeType.DARK 
      : themeType === ThemeType.DARK 
        ? ThemeType.SYSTEM 
        : ThemeType.LIGHT;
    
    saveTheme(newTheme);
  };

  // 设置特定主题
  const setTheme = (newTheme) => {
    if (Object.values(ThemeType).includes(newTheme)) {
      saveTheme(newTheme);
    }
  };

  const theme = getCurrentTheme();
  const currentThemeType = getCurrentThemeType();
  
  // 获取状态栏样式
  const getStatusBarStyle = () => {
    if (themeType === ThemeType.SYSTEM) {
      return systemColorScheme === 'dark' ? 'light-content' : 'dark-content';
    }
    return themeType === ThemeType.DARK ? 'light-content' : 'dark-content';
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        themeType, 
        currentThemeType,
        toggleTheme, 
        setTheme,
        isLoading,
        getStatusBarStyle 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
