import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';

const Logo = ({ size = 'large' }) => {
  const logoSize = size === 'large' ? 110 : 70;
  const fontSize = size === 'large' ? 40 : 24;
  const subFontSize = size === 'large' ? 16 : 12;
  
  // 动画值
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const particleAnim1 = useRef(new Animated.Value(0)).current;
  const particleAnim2 = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-100)).current;
  
  // 旋转插值
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // 缩放插值
  const scale = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1]
  });
  
  // 光晕opacity插值
  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1, 0.8]
  });
  
  useEffect(() => {
    // 脉动动画
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ).start();
    
    // 旋转动画
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
    
    // 粒子动画1
    Animated.loop(
      Animated.timing(particleAnim1, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ).start();
    
    // 粒子动画2
    Animated.loop(
      Animated.timing(particleAnim2, {
        toValue: 1,
        duration: 5000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ).start();
    
    // 光束扫过动画
    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 200,
        duration: 2500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ).start();
  }, []);
  
  const renderParticles = () => {
    const particles = [];
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      const animValue = i % 2 === 0 ? particleAnim1 : particleAnim2;
      const delay = i * 100;
      const size = Math.random() * 3 + 1;
      const translateX = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, (Math.random() * 60 - 30)]
      });
      const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, (Math.random() * 60 - 30)]
      });
      const opacity = animValue.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [0, 0.8, 0]
      });
      
      particles.push(
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: size,
              height: size,
              transform: [{ translateX }, { translateY }],
              opacity,
              backgroundColor: i % 3 === 0 ? '#64B5F6' : i % 3 === 1 ? '#81D4FA' : '#4FC3F7',
            }
          ]}
        />
      );
    }
    
    return particles;
  };
  
  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Animated.View style={{ opacity: glowOpacity }}>
        <LinearGradient
          colors={['rgba(3, 169, 244, 0.9)', 'rgba(33, 150, 243, 0.85)', 'rgba(13, 71, 161, 0.9)']}
          style={[styles.outerGlow, { width: logoSize * 2.6, height: logoSize * 1.2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.innerContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.contentContainer}>
              <View style={[styles.logoContainer, { width: logoSize, height: logoSize }]}>
                {/* 旋转的背景圆环 */}
                <Animated.View style={[
                  styles.rotatingRing, 
                  { transform: [{ rotate }], width: logoSize * 1.1, height: logoSize * 1.1 }
                ]}>
                  <Svg width="100%" height="100%" viewBox="0 0 100 100">
                    <Defs>
                      <RadialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <Stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.8" />
                        <Stop offset="70%" stopColor="#0D47A1" stopOpacity="0.3" />
                        <Stop offset="100%" stopColor="#01579B" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Circle cx="50" cy="50" r="40" fill="none" stroke="url(#grad)" strokeWidth="2" />
                    <Circle cx="50" cy="50" r="45" fill="none" stroke="#29B6F6" strokeWidth="0.5" strokeDasharray="5,3" />
                    <Circle cx="50" cy="50" r="35" fill="none" stroke="#0288D1" strokeWidth="1" strokeDasharray="10,2" />
                  </Svg>
                </Animated.View>
                
                {/* 粒子效果 */}
                <View style={styles.particleContainer}>
                  {renderParticles()}
                </View>
                
                <LinearGradient
                  colors={['#0D47A1', '#1976D2', '#42A5F5']}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.logoText, { fontSize: fontSize * 1.1 }]}>5GC</Text>
                  
                  {/* 扫光效果 */}
                  <Animated.View 
                    style={[
                      styles.shine,
                      { transform: [{ translateX: shineAnim }] }
                    ]}
                  />
                  
                  {/* 光点效果 */}
                  <View style={styles.dotContainer}>
                    <View style={[styles.dot, styles.dot1]} />
                    <View style={[styles.dot, styles.dot2]} />
                    <View style={[styles.dot, styles.dot3]} />
                  </View>
                </LinearGradient>
              </View>
              
              <View style={styles.textContainer}>
                <Text style={[styles.title, { fontSize: fontSize }]}>智擎</Text>
                <Text style={[styles.subtitle, { fontSize: subFontSize }]}>知识库问答</Text>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  outerGlow: {
    borderRadius: 20,
    padding: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  innerContainer: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  logoContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    position: 'relative',
  },
  rotatingRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    zIndex: 1,
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 3,
  },
  shine: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: '30%',
    height: '200%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ rotate: '45deg' }],
  },
  dotContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  dot1: {
    top: '20%',
    right: '25%',
    opacity: 0.8,
  },
  dot2: {
    bottom: '30%',
    left: '20%',
    opacity: 0.6,
    width: 3,
    height: 3,
  },
  dot3: {
    top: '65%',
    right: '15%',
    opacity: 0.7,
    width: 2,
    height: 2,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 2,
  },
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: '#FFFFFF',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default Logo;
