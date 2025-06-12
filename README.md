# 5GC智擎知识问答移动端

> 基于大语言模型的5G核心网智能问答系统 - 移动端应用

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0.0-000020.svg)](https://expo.dev/)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey.svg)](https://github.com/facebook/react-native)

## 项目简介

5GC智擎知识问答移动端是陕西移动网管中心自研的基于人工智能技术的移动应用，专为5G核心网运维人员提供智能化的知识查询和问答服务。

### 核心功能

- 🤖 **AI智能问答** - 基于大语言模型的自然语言交互
- 📚 **知识库检索** - 覆盖5G核心网运维、故障处理等多领域知识
- 📁 **文档上传** - 支持PDF、Word、Excel、图片等多种格式
- 💬 **对话管理** - 完整的对话历史记录和管理
- 🎨 **主题适配** - 支持深色/浅色主题自动适配
- 🔐 **安全认证** - 完善的用户认证和权限管理
- 📱 **移动优化** - 专为移动设备优化的用户界面

### 技术特性

- ✅ 流式响应显示，实时AI回复展示
- ✅ 智能思考过程可视化
- ✅ 完整的引用来源追踪
- ✅ 用户反馈和评价系统
- ✅ 离线缓存和同步机制
- ✅ 符合中国法律法规的隐私政策

## 技术架构

```
├── 前端框架: React Native + Expo
├── 状态管理: React Context API
├── 路由导航: Expo Router
├── UI组件库: React Native Paper
├── 图表渲染: React Native WebView + Mermaid
├── 文件处理: Expo Document Picker
├── 本地存储: AsyncStorage
└── 网络请求: Fetch API + 流式处理
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- iOS/Android 开发环境（可选）

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd knowledge-qa-app

# 安装依赖
npm install

# 修复依赖兼容性
npx expo install --fix
```

### 开发调试

```bash
# 启动开发服务器
npx expo start

# 选择平台
# i - iOS模拟器
# a - Android模拟器/设备
# w - Web浏览器
```

### 项目结构

```
knowledge-qa-app/
├── app/                    # 路由页面
│   ├── login.js           # 登录页面
│   ├── qa.js              # 主问答页面
│   └── _layout.js         # 布局配置
├── src/
│   ├── components/        # 可复用组件
│   ├── context/          # 全局状态管理
│   │   ├── AuthContext.js    # 认证状态
│   │   ├── ChatContext.js    # 聊天状态
│   │   └── ThemeContext.js   # 主题状态
│   ├── utils/            # 工具函数
│   │   └── api.js        # API接口
│   └── assets/           # 静态资源
├── app.json              # Expo配置
├── eas.json              # EAS构建配置
└── BUILD_GUIDE.md        # 构建指导文档
```

## 功能特性详解

### 1. 智能对话系统

- **流式响应**: 实时显示AI回复过程，提升用户体验
- **思考过程**: 可视化AI推理过程，增强回答可信度
- **多轮对话**: 支持上下文理解的连续对话
- **对话管理**: 完整的历史记录保存和检索

### 2. 知识库集成

- **RAG技术**: 检索增强生成，确保回答准确性
- **多领域覆盖**: 5G核心网、运维管理、故障处理等
- **实时更新**: 知识库内容持续更新维护
- **引用追溯**: 每个回答都提供清晰的来源引用

### 3. 文档处理能力

- **多格式支持**: PDF、Word、Excel、PPT、图片等
- **智能解析**: 自动提取文档关键信息
- **上下文关联**: 基于上传文档的针对性问答
- **安全处理**: 文档处理过程完全加密

### 4. 用户体验优化

- **响应式设计**: 适配各种屏幕尺寸
- **主题切换**: 自动适配系统深色/浅色模式
- **离线支持**: 本地缓存保证离线可用性
- **手势操作**: 符合移动端使用习惯

## API接口说明

### 认证接口

```javascript
// 用户登录
POST /api/auth/login
{
  "username": "用户名",
  "password": "密码"
}

// 刷新Token
POST /api/auth/refresh
{
  "refreshToken": "刷新令牌"
}
```

### 问答接口

```javascript
// 知识问答 (流式)
POST /api/workflows/knowledge-qa
{
  "query": "问题内容",
  "model": "模型名称",
  "use_kb": true,
  "stream": true
}

// 文件问答 (流式)
POST /api/workflows/knowledge-qa/upload
FormData: {
  "query": "问题内容",
  "file": File对象,
  "use_kb": "true"
}
```

### 对话管理

```javascript
// 获取对话列表
GET /api/chat-history/conversations

// 保存对话
POST /api/chat-history/conversations
{
  "id": "对话ID",
  "title": "对话标题",
  "messages": [...]
}

// 删除对话
DELETE /api/chat-history/conversations/{id}
```

## 构建部署

### 开发构建

```bash
# Android APK (测试版)
eas build --platform android --profile preview

# iOS IPA (测试版)
eas build --platform ios --profile preview
```

### 生产构建

```bash
# Android AAB (发布版)
eas build --platform android --profile production

# iOS IPA (App Store)
eas build --platform ios --profile production
```

详细构建指导请参考：[BUILD_GUIDE.md](./BUILD_GUIDE.md)

## 环境配置

### 开发环境

在项目根目录创建 `.env` 文件：

```bash
# API服务器地址
API_BASE_URL=https://your-api-server.com

# Expo项目ID
EXPO_PROJECT_ID=your-project-id

# 其他配置...
```

### 生产环境

确保生产环境配置：

- API服务器SSL证书配置
- 数据库连接安全配置
- 用户认证加密配置
- 文件上传安全策略

## 安全考虑

### 数据安全

- 所有API通信使用HTTPS加密
- 用户密码采用bcrypt加密存储
- JWT Token有效期限制
- 文件上传大小和类型限制

### 隐私保护

- 符合《个人信息保护法》要求
- 用户数据最小化收集原则
- 明确的隐私政策和用户协议
- 用户数据删除权保障

### 访问控制

- 基于角色的权限管理
- API接口访问频率限制
- 用户会话管理
- 异常行为监控

## 测试策略

### 功能测试

- 用户登录认证流程
- 问答功能完整性测试
- 文件上传处理测试
- 对话历史管理测试

### 兼容性测试

- Android 不同版本适配
- iOS 不同版本适配  
- 各品牌手机兼容性
- 网络环境适应性

### 性能测试

- 应用启动速度
- 流式响应性能
- 内存使用优化
- 电池消耗控制

## 故障排除

### 常见问题

1. **登录失败**
   - 检查网络连接
   - 验证API服务器状态
   - 确认用户凭据正确

2. **文件上传失败**
   - 检查文件大小限制
   - 验证文件格式支持
   - 确认网络稳定性

3. **对话历史丢失**
   - 检查本地存储权限
   - 验证服务器同步状态
   - 重新登录刷新数据

### 日志调试

```bash
# 启动调试模式
npx expo start --dev-client

# 查看实时日志
npx expo logs --platform android
npx expo logs --platform ios
```

## 贡献指南

### 开发规范

- 遵循ESLint代码规范
- 使用Prettier格式化代码
- 编写完整的JSDoc注释
- 提交前运行测试用例

### 提交流程

1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 版本历史

### v1.0.0 (2024.12)

- ✨ 初始版本发布
- ✅ 基础问答功能
- ✅ 文件上传支持
- ✅ 用户认证系统
- ✅ 对话历史管理
- ✅ 主题适配支持

## 联系我们

**开发团队：** 陕西移动网管中心自研团队

**技术支持：**

- 📞 电话：13609247807
- 📧 邮箱：<libing1@sn.chinamobile.com>
- 🏢 地址：陕西省西安市中国移动陕西公司网管中心

**项目链接：**

- 🔗 项目主页：[GitHub Repository]
- 📚 API文档：[API Documentation]
- 🐛 问题反馈：[Issue Tracker]

## 许可证

本项目为中国移动陕西公司网管中心内部项目，所有权利保留。

---

*© 2024 中国移动通信集团陕西有限公司网管中心. All rights reserved.*
