import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

/**
 * Web平台专用的Mermaid图表渲染器
 * 使用直接DOM操作渲染mermaid图表，避免在Web平台上使用WebView
 */
export default function MermaidDOMRenderer({ code, isDark, theme }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [chartHeight, setChartHeight] = useState(300); // 设置初始固定高度
  const containerRef = useRef(null);
  const primaryColor = theme?.primary || '#6200ee';
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 清空容器内容
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    
    // 创建pre元素，并添加mermaid类和图表代码
    const preElement = document.createElement('pre');
    preElement.className = 'mermaid';
    preElement.textContent = code;
    containerRef.current.appendChild(preElement);
    
    setIsLoading(true);
    setHasError(false);
    
    // 使用ResizeObserver监听图表尺寸变化
    let resizeObserver = null;
    let renderAttempts = 0;
    const MAX_RENDER_ATTEMPTS = 5;
    
    // 使用函数检查mermaid是否已加载
    const renderMermaid = () => {
      if (renderAttempts >= MAX_RENDER_ATTEMPTS) {
        console.error('Mermaid渲染尝试次数过多');
        setHasError(true);
        setErrorMessage('渲染尝试次数过多');
        setIsLoading(false);
        return;
      }
      
      renderAttempts++;
      
      if (window.mermaid) {
        try {
          // 初始化mermaid配置
          window.mermaid.initialize({
            theme: isDark ? 'dark' : 'default',
            securityLevel: 'loose',
            fontFamily: 'arial,sans-serif',
            startOnLoad: false, // 我们将手动触发渲染
          });
          
          // 手动触发渲染
          window.mermaid.run()
            .then(() => {
              setIsLoading(false);
              
              // 设置ResizeObserver来监测图表高度变化
              if (containerRef.current) {
                try {
                  if (resizeObserver) {
                    resizeObserver.disconnect();
                  }
                  
                  resizeObserver = new ResizeObserver(entries => {
                    if (!containerRef.current) return;
                    
                    for (let entry of entries) {
                      // 修复：增加null检查，确保containerRef.current不为null
                      if (!containerRef.current) continue;
                      
                      // 获取实际渲染的图表高度
                      // 修复：增加安全检查，处理可能的querySelector('svg')返回null的情况
                      const svgElement = containerRef.current.querySelector('svg');
                      
                      if (svgElement) {
                        const newHeight = svgElement.getBoundingClientRect().height;
                        if (newHeight > 100) { // 避免设置过小的高度
                          setChartHeight(newHeight + 40); // 添加一些额外空间
                        }
                      } else {
                        // 如果找不到SVG元素，可能需要等待渲染完成
                        console.log('未找到SVG元素，使用默认高度');
                      }
                    }
                  });
                  
                  // 增加try-catch以防止observe抛出错误
                  try {
                    resizeObserver.observe(containerRef.current);
                  } catch (observeError) {
                    console.error('ResizeObserver.observe错误:', observeError);
                  }
                } catch (error) {
                  console.error('创建ResizeObserver失败:', error);
                }
              }
            })
            .catch(error => {
              console.error('Mermaid渲染错误:', error);
              setHasError(true);
              setErrorMessage(error.toString());
              setIsLoading(false);
            });
        } catch (error) {
          console.error('Mermaid初始化错误:', error);
          setHasError(true);
          setErrorMessage(error.toString());
          setIsLoading(false);
        }
      } else {
        // mermaid库还未加载，等待加载完成 - 延长间隔减少状态更新频率
        setTimeout(renderMermaid, 300);
      }
    };
    
    // 如果mermaid库未加载，加载它
    if (!window.mermaid) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.8.0/dist/mermaid.min.js';
      script.async = true;
      script.onload = renderMermaid;
      script.onerror = (error) => {
        console.error('Mermaid库加载失败:', error);
        setHasError(true);
        setErrorMessage('无法加载Mermaid库');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      // mermaid库已加载，直接渲染
      renderMermaid();
    }
    
    // 清理函数
    return () => {
      if (resizeObserver) {
        try {
          resizeObserver.disconnect();
        } catch (error) {
          console.error('ResizeObserver.disconnect错误:', error);
        }
      }
    };
  }, [code, isDark]); // 当代码或主题更改时重新渲染
  
  return (
    <View style={{ 
      width: '100%', 
      height: chartHeight,
      position: 'relative'
    }}>
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
          zIndex: 10
        }}>
          <ActivityIndicator color={primaryColor} size="large" />
          <Text style={{ marginTop: 8, color: isDark ? '#fff' : '#000' }}>图表渲染中...</Text>
        </View>
      )}
      <View 
        style={{ 
          width: '100%',
          height: '100%',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease' // 添加过渡效果
        }}
      >
        {/* 使用ref获取DOM节点引用 */}
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%',
            height: '100%',
            transition: 'height 0.5s ease' // 添加高度平滑过渡
          }} 
        />
      </View>
      {hasError && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,0,0,0.05)' : 'rgba(255,0,0,0.03)',
          padding: 16,
          zIndex: 20
        }}>
          <Text style={{ color: 'red', marginBottom: 8 }}>图表渲染失败</Text>
          <View style={{ 
            marginTop: 8, 
            padding: 8, 
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', 
            borderRadius: 4,
            width: '100%'
          }}>
            <Text style={{ 
              fontFamily: 'monospace', 
              fontSize: 12,
              color: isDark ? '#eee' : '#333'
            }}>
              {code.length > 150 ? code.substring(0, 150) + '...' : code}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
} 