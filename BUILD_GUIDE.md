# 5GC智擎知识问答移动端构建指导文档

## 项目概述

本文档详细说明如何构建5GC智擎知识问答移动应用的iOS和Android安装包。

**项目信息：**

- 项目名称：5GC智擎知识问答
- 包名：com.sncc.knowledgeqa
- 技术栈：React Native + Expo
- 开发团队：陕西移动网管中心自研团队

## 环境准备

### 1. 基础环境要求

**操作系统：**

- macOS（推荐用于iOS构建）
- Windows/Linux（可用于Android构建）

**必需软件：**

```bash
# Node.js (版本 18+)
node --version

# npm 或 yarn
npm --version

# Git
git --version
```

### 2. 安装构建工具

```bash
# 安装 Expo CLI
npm install -g @expo/cli

# 安装 EAS CLI（用于云构建）
npm install -g eas-cli

# 验证安装
expo --version
eas --version
```

### 3. 账户准备

1. **注册Expo账户**
   - 访问：<https://expo.dev/signup>
   - 使用邮箱注册账户
   - 验证邮箱

2. **登录EAS CLI**

   ```bash
   eas login
   # 输入注册的邮箱和密码
   ```

## 项目配置

### 1. 项目初始化

```bash
# 克隆项目
git clone <项目地址>
cd knowledge-qa-app

# 安装依赖
npm install

# 修复依赖兼容性
npx expo install --fix
```

### 2. 配置文件检查

确保 `app.json` 配置正确：

```json
{
  "expo": {
    "name": "5GC智擎知识问答",
    "slug": "knowledge-qa-app",
    "version": "1.0.0",
    "android": {
      "package": "com.sncc.knowledgeqa",
      "versionCode": 1,
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.CAMERA"
      ]
    },
    "ios": {
      "bundleIdentifier": "com.sncc.knowledgeqa",
      "buildNumber": "1"
    }
  }
}
```

### 3. EAS构建配置

初始化EAS项目：

```bash
# 配置EAS构建
eas build:configure

# 选择所有平台 (iOS + Android)
```

生成的 `eas.json` 文件：

```json
{
  "cli": {
    "version": ">= 16.9.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Android构建指导

### 1. 构建APK包（测试版）

```bash
# 构建预览版APK（无需Google Play签名）
eas build --platform android --profile preview

# 构建开发版APK（包含调试功能）
eas build --platform android --profile development
```

### 2. 构建AAB包（发布版）

```bash
# 构建生产版AAB（用于Google Play上架）
eas build --platform android --profile production
```

### 3. 构建过程说明

1. **上传项目**：项目文件压缩上传到EAS云端
2. **生成密钥**：自动生成Android签名密钥
3. **编译构建**：云端编译React Native代码
4. **打包签名**：生成签名的APK/AAB文件
5. **构建完成**：提供下载链接

**构建时间：** 约10-20分钟

### 4. Android安装测试

**在华为手机等Android设备上测试：**

1. 下载构建完成的APK文件
2. 启用"未知来源应用安装"：
   - 华为：设置 → 安全 → 更多安全设置 → 未知来源应用下载
   - 小米：设置 → 应用设置 → 应用管理 → 右上角三点 → 应用包安装程序
   - OPPO：设置 → 安全 → 应用安装 → 安装外部来源应用
3. 点击APK文件进行安装
4. 运行应用进行测试

## iOS构建指导

### 1. 准备iOS开发者账户

**个人/公司开发者账户：**

- 访问：<https://developer.apple.com/programs/>
- 注册Apple Developer Program（年费$99）
- 获取Team ID

**企业开发者账户：**

- Apple Developer Enterprise Program（年费$299）
- 适用于内部分发，无需App Store审核

### 2. 配置iOS构建

```bash
# 配置iOS凭证
eas credentials:configure --platform ios

# 选择选项：
# 1. Automatic (推荐) - EAS自动管理证书
# 2. Manual - 手动上传证书
```

### 3. 构建IPA包

```bash
# 构建开发版IPA（内部测试）
eas build --platform ios --profile development

# 构建预览版IPA（内部分发）
eas build --platform ios --profile preview

# 构建生产版IPA（App Store发布）
eas build --platform ios --profile production
```

### 4. iOS构建配置选项

**开发版本 (development)：**

- 包含调试功能
- 可在模拟器和真机上运行
- 需要注册设备UDID

**预览版本 (preview)：**

- 优化版本，接近生产环境
- 用于内部测试和演示
- 支持Ad Hoc分发

**生产版本 (production)：**

- 最终发布版本
- 用于App Store提交
- 完全优化和压缩

### 5. iOS安装测试

**方式一：通过Xcode安装**

```bash
# 在Mac上通过Xcode安装到连接的iOS设备
# 需要iOS设备连接到Mac电脑
```

**方式二：通过TestFlight**

```bash
# 上传到App Store Connect
eas submit --platform ios --profile production

# 通过TestFlight邀请测试用户
```

**方式三：企业分发**

- 适用于企业开发者账户
- 可直接通过网页链接安装
- 无需App Store审核

## 构建命令速查

### 常用构建命令

```bash
# 查看构建状态
eas build:list

# 取消正在进行的构建
eas build:cancel

# 查看构建日志
eas build:view <build-id>

# 重新运行失败的构建
eas build:retry <build-id>
```

### 环境配置

```bash
# 查看项目配置
eas project:info

# 配置环境变量
eas env:create

# 查看环境变量
eas env:list
```

### 凭证管理

```bash
# 查看凭证
eas credentials

# 配置Android凭证
eas credentials:configure --platform android

# 配置iOS凭证  
eas credentials:configure --platform ios
```

## 本地构建（可选）

### Android本地构建

```bash
# 生成Android项目
npx expo run:android

# 构建发布版APK
npx expo run:android --variant release
```

**前提条件：**

- 安装Android Studio
- 配置Android SDK
- 设置ANDROID_HOME环境变量

### iOS本地构建

```bash
# 生成iOS项目
npx expo run:ios

# 构建发布版
npx expo run:ios --configuration Release
```

**前提条件：**

- macOS操作系统
- 安装Xcode
- 配置iOS开发者账户

## 版本管理

### 版本号规则

- **version**: 语义化版本号 (如: 1.0.0, 1.1.0, 2.0.0)
- **versionCode** (Android): 递增整数 (如: 1, 2, 3)
- **buildNumber** (iOS): 构建号 (如: 1, 2, 3)

### 版本更新

```bash
# 自动递增版本号
eas build --auto-increment

# 手动修改 app.json 中的版本信息
{
  "expo": {
    "version": "1.1.0",
    "android": {
      "versionCode": 2
    },
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

## 发布分发

### Android发布

**内部测试分发：**

- 直接分发APK文件
- 通过企业应用商店
- 二维码扫描下载

**Google Play发布：**

```bash
# 上传到Google Play Console
eas submit --platform android --profile production
```

### iOS发布

**企业内部分发：**

- 通过企业开发者账户
- 生成安装链接
- 员工直接下载安装

**App Store发布：**

```bash
# 上传到App Store Connect
eas submit --platform ios --profile production
```

## 常见问题解决

### 构建失败

1. **依赖冲突**

   ```bash
   # 清理缓存
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

2. **网络问题**

   ```bash
   # 使用镜像源
   npm config set registry https://registry.npmmirror.com
   ```

3. **版本兼容性**

   ```bash
   # 修复版本冲突
   npx expo install --fix
   ```

### iOS构建问题

1. **证书过期**

   ```bash
   # 重新配置证书
   eas credentials:configure --platform ios
   ```

2. **设备UDID未注册**
   - 在Apple Developer Portal添加测试设备
   - 重新生成Provisioning Profile

### Android构建问题

1. **签名密钥丢失**

   ```bash
   # 重新生成密钥
   eas credentials:configure --platform android
   ```

2. **权限问题**
   - 检查app.json中的permissions配置
   - 确保权限声明完整

## 监控和调试

### 构建监控

- **EAS Dashboard**: <https://expo.dev/accounts/[username]/projects/[project>]
- **构建日志**: 实时查看构建进度和错误
- **构建历史**: 查看所有历史构建记录

### 应用调试

```bash
# 启动开发服务器
npx expo start

# 连接到开发构建
# 扫描二维码或输入开发服务器URL
```

### 错误跟踪

- 集成Sentry等错误监控服务
- 查看崩溃日志和性能数据
- 用户反馈收集

## 团队协作

### 多人构建

1. **共享Expo账户**
   - 团队成员使用相同Expo账户
   - 统一管理构建和凭证

2. **组织账户**
   - 创建Expo组织
   - 分配不同权限给团队成员

### CI/CD集成

```yaml
# GitHub Actions 示例
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## 联系信息

**技术支持：**

- 电话：13609247807
- 邮箱：<libing1@sn.chinamobile.com>
- 团队：陕西移动网管中心自研团队

**文档版本：** v1.0.0  
**最后更新：** 2024年12月

---

*本文档为5GC智擎知识问答移动端构建的完整指导，如有疑问请联系技术支持团队。*
