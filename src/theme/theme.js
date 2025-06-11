import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { ThemeColors } from '../context/ThemeContext';

// 创建动态主题生成函数 - 兼容react-native-paper v5
export const createTheme = (isDark = false) => {
  // 使用MD3LightTheme或MD3DarkTheme作为基础
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const themeColors = isDark ? ThemeColors.dark : ThemeColors.light;
  
  // 确保baseTheme非空
  if (!baseTheme) {
    console.warn('基础主题不存在，使用默认配置');
    // 提供一个基本的默认主题，避免错误
    return {
      dark: isDark,
  colors: {
        primary: themeColors.primary || '#3F51B5',
        onPrimary: themeColors.buttonText || '#FFFFFF',
        primaryContainer: isDark ? '#3F51B5' : '#E8EAF6',
        onPrimaryContainer: isDark ? '#FFFFFF' : '#0A1045',
        secondary: themeColors.secondary || '#7986CB',
        onSecondary: themeColors.buttonText || '#FFFFFF',
        secondaryContainer: isDark ? '#5C6BC0' : '#C5CAE9',
        onSecondaryContainer: isDark ? '#FFFFFF' : '#283593',
        background: themeColors.background || (isDark ? '#121212' : '#F5F7FA'),
        onBackground: themeColors.text || (isDark ? '#FFFFFF' : '#212121'),
        surface: themeColors.surface || (isDark ? '#1E1E1E' : '#FFFFFF'),
        onSurface: themeColors.text || (isDark ? '#FFFFFF' : '#212121'),
        surfaceVariant: themeColors.card || (isDark ? '#2D2D2D' : '#FFFFFF'),
        onSurfaceVariant: themeColors.textSecondary || (isDark ? '#CCCCCC' : '#757575'),
        error: themeColors.error || (isDark ? '#CF6679' : '#B00020'),
        onError: '#FFFFFF',
        errorContainer: isDark ? '#B00020' : '#FFDAD6',
        onErrorContainer: isDark ? '#FFFFFF' : '#410002',
        outline: themeColors.border || (isDark ? '#424242' : '#E0E0E0'),
      },
      mode: 'adaptive',
    };
  }

  // 创建新的主题对象，使用baseTheme作为基础
  return {
    ...baseTheme,
    dark: isDark,
    // 明确指定所有MD3主题需要的颜色，避免undefined错误
    colors: {
      ...baseTheme.colors,
      primary: themeColors.primary,
      onPrimary: themeColors.buttonText,
      primaryContainer: isDark ? themeColors.primary : '#E8EAF6',
      onPrimaryContainer: isDark ? '#FFFFFF' : '#0A1045',
      secondary: themeColors.secondary,
      onSecondary: themeColors.buttonText,
      secondaryContainer: isDark ? themeColors.secondary : '#C5CAE9',
      onSecondaryContainer: isDark ? '#FFFFFF' : '#283593',
      tertiary: themeColors.accent,
      onTertiary: themeColors.buttonText,
      tertiaryContainer: isDark ? themeColors.accent : '#FFD8E4',
      onTertiaryContainer: isDark ? '#FFFFFF' : '#5C0058',
      background: themeColors.background,
      onBackground: themeColors.text,
      surface: themeColors.surface,
      onSurface: themeColors.text,
      surfaceVariant: themeColors.card,
      onSurfaceVariant: themeColors.textSecondary,
      surfaceDisabled: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      onSurfaceDisabled: isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)',
      outline: themeColors.border,
      outlineVariant: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      shadow: themeColors.shadow,
      scrim: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
      inverseSurface: isDark ? '#FFFFFF' : '#121212',
      inverseOnSurface: isDark ? '#121212' : '#FFFFFF',
      inversePrimary: isDark ? '#1A237E' : '#7986CB',
      error: themeColors.error,
      onError: '#FFFFFF',
      errorContainer: isDark ? '#B00020' : '#FFDAD6',
      onErrorContainer: isDark ? '#FFFFFF' : '#410002',
      elevation: {
        level0: 'transparent',
        level1: isDark ? '#1E1E1E' : '#FFFFFF',
        level2: isDark ? '#222222' : '#F5F5F5',
        level3: isDark ? '#252525' : '#EEEEEE',
        level4: isDark ? '#272727' : '#E0E0E0',
        level5: isDark ? '#2A2A2A' : '#D6D6D6',
      }
  },
};
};

// 默认导出浅色主题（为了向后兼容）
export default createTheme(false);
