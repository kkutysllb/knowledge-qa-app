const fs = require('fs');
const path = require('path');

// 生成图标配置
const iconConfigs = [
  { name: 'icon.png', size: 1024, description: '主应用图标' },
  { name: 'adaptive-icon.png', size: 1024, description: 'Android自适应图标' },
  { name: 'splash-icon.png', size: 1024, description: '启动画面图标' },
  { name: 'favicon.png', size: 32, description: 'Web图标' }
];

console.log('🎨 应用图标生成指南');
console.log('='.repeat(50));
console.log();

console.log('📁 已创建的SVG文件：');
console.log('  - assets/app-icon.svg (动画版本)');
console.log('  - assets/app-icon-static.svg (静态版本，推荐用于生成PNG)');
console.log();

console.log('📋 需要生成的图标文件：');
iconConfigs.forEach(config => {
  console.log(`  - ${config.name} (${config.size}x${config.size}px) - ${config.description}`);
});
console.log();

console.log('🛠️ 生成图标的方法：');
console.log();

console.log('方法1: 使用在线SVG转PNG工具');
console.log('  1. 访问 https://convertio.co/zh/svg-png/ 或 https://www.svgviewer.dev/');
console.log('  2. 上传 assets/app-icon-static.svg');
console.log('  3. 设置输出尺寸为 1024x1024');
console.log('  4. 下载生成的PNG文件');
console.log('  5. 重命名为对应的文件名并替换 assets/images/ 中的文件');
console.log();

console.log('方法2: 使用Figma/Sketch/Adobe Illustrator');
console.log('  1. 导入SVG文件');
console.log('  2. 导出为各种尺寸的PNG');
console.log('  3. 确保图标在小尺寸下仍然清晰可见');
console.log();

console.log('方法3: 使用命令行工具 (需要安装imagemagick)');
console.log('  npm install -g sharp-cli');
console.log('  sharp -i assets/app-icon-static.svg -o assets/images/icon.png -f png --width 1024 --height 1024');
console.log();

console.log('📱 替换图标后的操作：');
console.log('  1. 清理构建缓存: npx expo start --clear');
console.log('  2. 重新构建应用');
console.log('  3. 在设备上测试图标显示效果');
console.log();

console.log('💡 设计建议：');
console.log('  - 确保图标在小尺寸（48x48px）下仍然清晰');
console.log('  - 避免过于复杂的细节');
console.log('  - 保持与应用主题色调一致');
console.log('  - 测试在不同背景色下的显示效果');
console.log();

// 检查现有图标文件
const assetsDir = path.join(process.cwd(), 'assets', 'images');
console.log('📂 当前图标文件状态：');

iconConfigs.forEach(config => {
  const filePath = path.join(assetsDir, config.name);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅ 存在' : '❌ 缺失';
  console.log(`  ${config.name}: ${status}`);
});

console.log();
console.log('🚀 完成图标替换后，运行以下命令构建应用：');
console.log('  npx expo prebuild --clear');
console.log('  npx expo run:android  # Android测试');
console.log('  npx expo run:ios      # iOS测试'); 