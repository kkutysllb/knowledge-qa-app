import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput as RNTextInput,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Button,
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
  const [userAgreementVisible, setUserAgreementVisible] = useState(false);
  const [privacyPolicyVisible, setPrivacyPolicyVisible] = useState(false);
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

  // 用户协议内容
  const renderUserAgreement = () => (
    <Modal
      visible={userAgreementVisible}
      animationType="slide"
      onRequestClose={() => setUserAgreementVisible(false)}
    >
      <SafeAreaView style={[dynamicStyles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[dynamicStyles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[dynamicStyles.modalTitle, { color: theme.text }]}>用户服务协议</Text>
          <TouchableOpacity onPress={() => setUserAgreementVisible(false)}>
            <Ionicons name="close" size={24} color={theme.icon} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={dynamicStyles.modalContent} showsVerticalScrollIndicator={true}>
          <Text style={[dynamicStyles.agreementText, { color: theme.text }]}>
{`欢迎使用5GC"智擎"网络运行安全平台知识库问答系统（以下简称"本服务"）。

一、服务提供者
本服务由中国移动通信集团陕西有限公司网管中心提供。

二、服务说明
1. 本服务基于人工智能技术为用户提供5G核心网相关知识问答服务
2. 服务内容包括但不限于：网络运维知识查询、故障处理建议、技术文档检索等
3. 本服务仅供内部学习和工作参考使用

三、用户权利与义务
1. 用户有权使用本服务进行合法的知识查询和学习
2. 用户应妥善保管账号信息，不得将账号转让或借用他人
3. 用户承诺不利用本服务从事违法违规活动
4. 用户应尊重知识产权，不得恶意传播或滥用服务内容

四、服务限制
1. 本服务仅供授权用户使用，未经授权不得访问
2. 禁止利用本服务进行网络攻击、数据窃取等恶意行为
3. 禁止传播违法、有害、虚假信息
4. 我们有权对违规行为进行限制或终止服务

五、知识产权保护
1. 本服务涉及的软件、算法、数据库等均受法律保护
2. 未经授权，不得复制、修改、传播本服务的任何内容
3. 用户在使用过程中产生的查询记录等数据归服务提供方所有

六、免责声明
1. 本服务提供的信息仅供参考，不作为最终决策依据
2. 因网络故障、系统维护等原因导致的服务中断，我们不承担责任
3. 用户因使用本服务而产生的任何直接或间接损失，服务提供方不承担责任
4. 本服务可能包含第三方链接，我们对第三方内容不承担责任

七、隐私保护
1. 我们承诺保护用户隐私，具体内容详见《隐私政策》
2. 用户数据仅用于服务改进和技术支持，不会用于其他商业目的
3. 我们采用行业标准的安全措施保护用户信息

八、服务变更与终止
1. 我们有权根据业务需要调整或终止服务
2. 服务变更将通过适当方式通知用户
3. 用户可随时停止使用本服务

九、争议解决
1. 本协议的解释和争议解决适用中华人民共和国法律
2. 如发生争议，应首先通过友好协商解决
3. 协商不成的，提交西安市仲裁委员会仲裁

十、其他条款
1. 本协议自用户点击同意之日起生效
2. 我们有权根据法律法规和业务需要修改本协议
3. 协议修改后，继续使用服务视为接受新协议

联系方式：
电话：13609247807
邮箱：libing1@sn.chinamobile.com

最后更新时间：2024年12月`}
          </Text>
        </ScrollView>
        
        <View style={[dynamicStyles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button 
            mode="contained" 
            onPress={() => setUserAgreementVisible(false)}
            buttonColor={theme.primary}
            textColor={theme.buttonText}
          >
            我已阅读
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // 隐私政策内容
  const renderPrivacyPolicy = () => (
    <Modal
      visible={privacyPolicyVisible}
      animationType="slide"
      onRequestClose={() => setPrivacyPolicyVisible(false)}
    >
      <SafeAreaView style={[dynamicStyles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[dynamicStyles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[dynamicStyles.modalTitle, { color: theme.text }]}>隐私政策</Text>
          <TouchableOpacity onPress={() => setPrivacyPolicyVisible(false)}>
            <Ionicons name="close" size={24} color={theme.icon} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={dynamicStyles.modalContent} showsVerticalScrollIndicator={true}>
          <Text style={[dynamicStyles.agreementText, { color: theme.text }]}>
{`中国移动通信集团陕西有限公司网管中心（以下简称"我们"）非常重视用户的隐私保护。本隐私政策详细说明了我们如何收集、使用、存储和保护您的个人信息。

一、信息收集
我们可能收集以下类型的信息：
1. 基本信息：用户名、工号、部门信息等身份标识信息
2. 使用信息：登录时间、查询记录、使用频率等行为数据
3. 技术信息：设备类型、IP地址、浏览器信息等技术参数
4. 交互信息：问答内容、反馈意见、评价等交互数据

二、信息使用目的
我们收集和使用个人信息的目的包括：
1. 提供和改进知识问答服务
2. 进行用户身份验证和访问控制
3. 分析服务使用情况，优化用户体验
4. 确保系统安全，防范网络攻击
5. 遵守法律法规要求

三、信息存储与保护
1. 数据存储：您的信息存储在中国移动内部服务器，采用加密存储
2. 访问控制：仅授权人员可访问个人信息，严格遵循最小权限原则
3. 安全措施：采用防火墙、入侵检测、数据备份等多重安全防护
4. 保存期限：根据业务需要和法律要求确定数据保存期限

四、信息共享与披露
我们承诺不会向第三方出售、出租或交易您的个人信息，除非：
1. 获得您的明确同意
2. 法律法规要求披露
3. 保护中国移动合法权益需要
4. 紧急情况下保护用户或公众安全

五、用户权利
根据相关法律法规，您享有以下权利：
1. 查询权：查询我们持有的您的个人信息
2. 更正权：要求更正不准确的个人信息
3. 删除权：在特定情况下要求删除个人信息
4. 限制权：要求限制个人信息的处理
5. 投诉权：对隐私政策执行情况进行投诉

六、未成年人保护
1. 本服务不针对未成年人提供
2. 如发现收集了未成年人信息，我们将立即删除
3. 未成年人使用服务需获得监护人同意

七、第三方服务
1. 本服务可能包含第三方链接，我们不对第三方隐私政策负责
2. 建议您在使用第三方服务前仔细阅读其隐私政策
3. 第三方服务的数据处理由其隐私政策规范

八、跨境数据传输
1. 您的个人信息主要存储在中国境内
2. 如需境外传输，将严格遵循相关法律法规
3. 采用适当措施确保境外传输的数据安全

九、数据安全事件处理
1. 如发生数据安全事件，我们将立即启动应急预案
2. 在法律要求的时间内通知相关部门和受影响用户
3. 采取必要措施控制事件影响，防止进一步损失

十、政策更新
1. 我们可能根据法律变化或业务需要更新本政策
2. 更新后的政策将通过适当方式通知用户
3. 继续使用服务视为接受更新后的政策

十一、联系我们
如您对本隐私政策有任何疑问或需要行使相关权利，请联系：
电话：13609247807
邮箱：libing1@sn.chinamobile.com
地址：陕西省西安市中国移动陕西公司网管中心

本政策符合《中华人民共和国网络安全法》、《中华人民共和国数据安全法》、《中华人民共和国个人信息保护法》等相关法律法规要求。

最后更新时间：2024年12月`}
          </Text>
        </ScrollView>
        
        <View style={[dynamicStyles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button 
            mode="contained" 
            onPress={() => setPrivacyPolicyVisible(false)}
            buttonColor={theme.primary}
            textColor={theme.buttonText}
          >
            我已阅读
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );

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
              <Text 
                style={dynamicStyles.termsLink}
                onPress={() => setUserAgreementVisible(true)}
              >
                用户协议
              </Text> 
              与 
              <Text 
                style={dynamicStyles.termsLink}
                onPress={() => setPrivacyPolicyVisible(true)}
              >
                隐私政策
              </Text>
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
        
        {/* 用户协议模态框 */}
        {renderUserAgreement()}
        
        {/* 隐私政策模态框 */}
        {renderPrivacyPolicy()}
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
    flex: 1,
    flexWrap: 'wrap',
  },
  termsLink: {
    color: theme.primary,
    textDecorationLine: 'underline',
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
  // 模态框样式
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  agreementText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },
});

export default LoginScreen;
