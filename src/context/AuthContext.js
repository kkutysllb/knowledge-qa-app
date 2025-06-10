import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin, getUserInfo } from '../utils/api';

// 创建认证上下文
const AuthContext = createContext();

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载已保存的认证状态
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        setLoading(true);
        const savedToken = await AsyncStorage.getItem('token');
        
        if (savedToken) {
          setToken(savedToken);
          // 获取用户信息
          try {
            const userInfo = await getUserInfo();
            setUser(userInfo);
          } catch (err) {
            // 如果获取用户信息失败，清除令牌
            console.error('获取用户信息失败:', err);
            await AsyncStorage.removeItem('token');
            setToken(null);
          }
        }
      } catch (err) {
        console.error('加载认证状态失败:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // 登录函数
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiLogin(username, password);
      
      // 保存token
      if (response.access_token) {
        await AsyncStorage.setItem('token', response.access_token);
        setToken(response.access_token);
        
        // 获取用户信息
        const userInfo = await getUserInfo();
        setUser(userInfo);
        
        return true;
      } else {
        throw new Error('登录响应中没有令牌');
      }
    } catch (err) {
      console.error('登录失败:', err);
      setError(err.message || '登录失败，请检查用户名和密码');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('登出失败:', err);
    }
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  // 提供的上下文值
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义钩子函数
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 