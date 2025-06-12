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
  const [serviceAgreementModalVisible, setServiceAgreementModalVisible] = useState(false);
  const [contactUsModalVisible, setContactUsModalVisible] = useState(false);
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

  // 服务协议内容
  const serviceAgreementContent = `5G核心网"智擎"网络运行安全平台服务协议

欢迎使用5G核心网"智擎"网络运行安全平台（以下简称"本平台"）。本协议是您与平台运营方之间关于使用本平台服务的法律协议。

第一条 服务提供者
本平台由相关运营机构提供和运营，致力于为用户提供5G核心网络安全智能分析服务。

第二条 服务内容
2.1 本平台提供包括但不限于以下服务：
- 5G核心网络状态实时监测与分析
- 网络资源指标智能评估
- 告警与故障智能关联分析
- 网络安全威胁检测与预警
- 智能运维建议与预案推荐
- 知识库检索与智能问答

2.2 平台基于人工智能、大数据分析等技术为用户提供网络运行安全相关的决策支持。

第三条 用户权利与义务
3.1 用户权利：
- 按照本协议约定使用平台服务
- 要求平台保护个人信息安全
- 对服务质量提出合理建议

3.2 用户义务：
- 遵守国家相关法律法规
- 不得利用平台从事违法违规活动
- 妥善保管账户信息，对账户安全负责
- 不得恶意攻击或干扰平台正常运行

第四条 个人信息保护
4.1 信息收集：平台仅收集为提供服务所必需的个人信息，包括账户信息、使用行为数据等。

4.2 信息使用：收集的个人信息仅用于：
- 提供和改进平台服务
- 进行安全防护和风险识别
- 遵守法律法规要求

4.3 信息保护：平台采用行业标准的安全措施保护用户个人信息，包括数据加密、访问控制等技术手段。

4.4 信息共享：除法律法规要求或用户同意外，平台不会向第三方共享用户个人信息。

第五条 知识产权
5.1 平台的软件、界面设计、数据库、算法模型等知识产权归平台运营方所有。

5.2 用户在使用过程中产生的数据，在不涉及个人隐私的前提下，可用于平台服务优化。

5.3 用户应尊重平台及第三方的知识产权，不得进行侵权行为。

第六条 免责声明
6.1 技术限制：由于技术限制，平台无法保证服务的绝对连续性和准确性。

6.2 网络因素：因网络故障、通信线路中断等不可抗力因素导致的服务中断，平台不承担责任。

6.3 数据准确性：平台提供的分析结果仅供参考，用户应结合实际情况进行判断。

6.4 第三方内容：平台可能包含第三方内容或链接，平台不对此类内容的准确性负责。

第七条 服务变更与终止
7.1 平台有权根据业务需要调整服务内容，并会提前通知用户。

7.2 如用户违反本协议，平台有权暂停或终止向用户提供服务。

7.3 平台终止服务时，将提前通知用户并协助用户进行数据迁移。

第八条 争议解决
8.1 本协议的解释、效力及纠纷解决均适用中华人民共和国法律。

8.2 双方应友好协商解决争议，协商不成的，可向平台运营方所在地人民法院提起诉讼。

第九条 协议修改
平台有权根据法律法规变化或业务需要修改本协议，修改后的协议将在平台内公布，用户继续使用服务即视为同意修改后的协议。

第十条 其他条款
10.1 本协议自用户开始使用平台服务时生效。

10.2 如本协议的任何条款被认定为无效，不影响其他条款的效力。

10.3 平台保留本协议的最终解释权。

生效日期：2024年1月1日
最后更新：2024年12月`;

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
              
              <TouchableOpacity 
                style={dynamicStyles.itemContainer}
                onPress={() => setServiceAgreementModalVisible(true)}
              >
                <View style={dynamicStyles.iconContainer}>
                  <List.Icon icon="file-document-outline" color={theme.icon} />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text style={dynamicStyles.itemTitle}>服务协议</Text>
                </View>
                <List.Icon icon="chevron-right" color={theme.icon} />
              </TouchableOpacity>
              
              <Divider style={dynamicStyles.divider} />
              
              <TouchableOpacity 
                style={dynamicStyles.itemContainer}
                onPress={() => setContactUsModalVisible(true)}
              >
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

          {/* 服务协议模态框 */}
          <Portal>
            <Modal
              visible={serviceAgreementModalVisible}
              onDismiss={() => setServiceAgreementModalVisible(false)}
              contentContainerStyle={dynamicStyles.agreementModalContainer}
            >
              <View style={dynamicStyles.agreementHeader}>
                <Text style={dynamicStyles.agreementTitle}>服务协议</Text>
                <IconButton
                  icon="close"
                  size={24}
                  iconColor={isDark ? '#FFFFFF' : '#000000'}
                  onPress={() => setServiceAgreementModalVisible(false)}
                />
              </View>
              
              <ScrollView 
                style={dynamicStyles.agreementContent}
                showsVerticalScrollIndicator={true}
              >
                <Text style={dynamicStyles.agreementText}>
                  {serviceAgreementContent}
                </Text>
              </ScrollView>
              
              <View style={dynamicStyles.agreementFooter}>
                <Button
                  mode="contained"
                  onPress={() => setServiceAgreementModalVisible(false)}
                  style={dynamicStyles.agreementCloseButton}
                  labelStyle={dynamicStyles.agreementCloseButtonText}
                >
                  我已阅读
                </Button>
              </View>
            </Modal>
          </Portal>

          {/* 联系我们模态框 */}
          <Portal>
            <Modal
              visible={contactUsModalVisible}
              onDismiss={() => setContactUsModalVisible(false)}
              contentContainerStyle={dynamicStyles.contactModalContainer}
            >
              <View style={dynamicStyles.contactHeader}>
                <Text style={dynamicStyles.contactTitle}>联系我们</Text>
                <IconButton
                  icon="close"
                  size={24}
                  iconColor={isDark ? '#FFFFFF' : '#000000'}
                  onPress={() => setContactUsModalVisible(false)}
                />
              </View>
              
              <View style={dynamicStyles.contactContent}>
                <View style={dynamicStyles.contactItem}>
                  <View style={dynamicStyles.contactIconContainer}>
                    <List.Icon icon="account-group" color={theme.primary} size={32} />
                  </View>
                  <View style={dynamicStyles.contactTextContainer}>
                    <Text style={dynamicStyles.contactLabel}>开发团队</Text>
                    <Text style={dynamicStyles.contactValue}>陕西移动网管中心自研团队</Text>
                  </View>
                </View>

                <View style={dynamicStyles.contactItem}>
                  <View style={dynamicStyles.contactIconContainer}>
                    <List.Icon icon="phone" color={theme.primary} size={32} />
                  </View>
                  <View style={dynamicStyles.contactTextContainer}>
                    <Text style={dynamicStyles.contactLabel}>联系电话</Text>
                    <Text style={dynamicStyles.contactValue}>13609247807</Text>
                  </View>
                </View>

                <View style={dynamicStyles.contactItem}>
                  <View style={dynamicStyles.contactIconContainer}>
                    <List.Icon icon="email" color={theme.primary} size={32} />
                  </View>
                  <View style={dynamicStyles.contactTextContainer}>
                    <Text style={dynamicStyles.contactLabel}>邮箱地址</Text>
                    <Text style={dynamicStyles.contactValue}>libing1@sn.chinamobile.com</Text>
                  </View>
                </View>

                <View style={dynamicStyles.contactItem}>
                  <View style={dynamicStyles.contactIconContainer}>
                    <List.Icon icon="information" color={theme.primary} size={32} />
                  </View>
                  <View style={dynamicStyles.contactTextContainer}>
                    <Text style={dynamicStyles.contactLabel}>平台简介</Text>
                    <Text style={dynamicStyles.contactDescription}>
                      5G核心网"智擎"网络运行安全平台致力于为用户提供智能化的网络安全分析服务，
                      通过AI技术实现网络状态监测、故障预警和智能运维建议。
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={dynamicStyles.contactFooter}>
                <Button
                  mode="contained"
                  onPress={() => setContactUsModalVisible(false)}
                  style={dynamicStyles.contactCloseButton}
                  labelStyle={dynamicStyles.contactCloseButtonText}
                >
                  确定
                </Button>
              </View>
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
  // 服务协议模态框样式
  agreementModalContainer: {
    margin: 20,
    marginTop: 60,
    marginBottom: 60,
    backgroundColor: theme.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  agreementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  agreementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  agreementContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  agreementText: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.text,
    textAlign: 'justify',
  },
  agreementFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
  },
  agreementCloseButton: {
    backgroundColor: theme.primary,
  },
  agreementCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // 联系我们模态框样式
  contactModalContainer: {
    margin: 20,
    marginTop: 80,
    marginBottom: 80,
    backgroundColor: theme.surface,
    borderRadius: 16,
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
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  contactContent: {
    padding: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  contactIconContainer: {
    marginRight: 16,
    paddingTop: 2,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    lineHeight: 24,
  },
  contactDescription: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
    textAlign: 'justify',
  },
  contactFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
  },
  contactCloseButton: {
    backgroundColor: theme.primary,
  },
  contactCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SettingsScreen;
