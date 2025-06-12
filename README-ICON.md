# 🎨 App图标替换指南

## 📁 已创建的资源文件

### SVG图标文件

- `assets/app-icon.svg` - 完整动画版logo
- `assets/app-icon-static.svg` - 静态版logo（推荐用于生成PNG）
- `assets/images/icon.svg` - 简化版主图标
- `assets/images/adaptive-icon.svg` - Android自适应图标
- `assets/images/splash-icon.svg` - 启动画面图标
- `assets/images/favicon.svg` - Web图标

## 🔧 手动转换步骤

### 方法1: 使用在线工具（推荐）

1. **访问在线SVG转PNG工具**
   - <https://www.svgviewer.dev/>
   - <https://convertio.co/zh/svg-png/>
   - <https://cloudconvert.com/svg-to-png>

2. **批量转换图标**

   ```
   assets/images/icon.svg → assets/images/icon.png (1024x1024)
   assets/images/adaptive-icon.svg → assets/images/adaptive-icon.png (1024x1024)
   assets/images/splash-icon.svg → assets/images/splash-icon.png (1024x1024)
   assets/images/favicon.svg → assets/images/favicon.png (32x32)
   ```

3. **下载并替换文件**
   - 下载转换后的PNG文件
   - 替换`assets/images/`目录中对应的原有文件

### 方法2: 使用Figma/Sketch

1. 导入SVG文件到设计工具
2. 导出为PNG格式，设置合适的尺寸
3. 确保在小尺寸下文字仍清晰可读

### 方法3: 使用命令行工具

```bash
# 安装ImageMagick (macOS)
brew install imagemagick

# 转换SVG到PNG
convert assets/images/icon.svg -resize 1024x1024 assets/images/icon.png
convert assets/images/adaptive-icon.svg -resize 1024x1024 assets/images/adaptive-icon.png
convert assets/images/splash-icon.svg -resize 1024x1024 assets/images/splash-icon.png
convert assets/images/favicon.svg -resize 32x32 assets/images/favicon.png
```

## 🚀 构建和测试

### 1. 清理缓存

```bash
npx expo start --clear
```

### 2. 重新构建应用

```bash
npx expo prebuild --clear
```

### 3. 在设备上测试

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## 📱 验证图标效果

### 检查项目

- ✅ 图标在主屏幕显示正确
- ✅ 图标在不同背景下清晰可见
- ✅ 启动画面图标正常显示
- ✅ 在小尺寸下文字仍可读

### app.json配置

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ]
  }
}
```

## 🎨 设计说明

创建的图标基于登录页面的"5GC智擎"logo设计：

- **色彩**：蓝色渐变（#4FC3F7 到 #0D47A1）
- **主文字**：5GC（白色，粗体）
- **副文字**：智擎（浅蓝色）
- **形状**：圆形背景，现代简洁
- **效果**：径向渐变，光晕效果

## 🔄 如果图标不生效

1. **完全清理**

   ```bash
   rm -rf .expo
   rm -rf node_modules/.cache
   npx expo start --clear
   ```

2. **重新安装依赖**

   ```bash
   rm -rf node_modules
   npm install
   ```

3. **检查文件权限**

   ```bash
   chmod 644 assets/images/*.png
   ```

4. **验证文件格式**
   - 确保PNG文件格式正确
   - 检查文件大小不为0

## 📞 需要帮助？

如果遇到问题，请检查：

1. PNG文件是否正确生成
2. 文件路径是否正确
3. app.json配置是否正确
4. 是否已清理缓存并重新构建
