const fs = require('fs');
const path = require('path');

// 创建一个简化的SVG图标 (用于快速测试)
const createSimpleIcon = (size = 1024) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="70%">
      <stop offset="0%" style="stop-color:#4FC3F7"/>
      <stop offset="60%" style="stop-color:#1976D2"/>
      <stop offset="100%" style="stop-color:#0D47A1"/>
    </radialGradient>
  </defs>
  
  <!-- 背景 -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.47}" fill="url(#bg)"/>
  
  <!-- 主文字 -->
  <text x="${size/2}" y="${size*0.47}" font-family="Arial, sans-serif" font-size="${size*0.18}" 
        font-weight="bold" text-anchor="middle" fill="white">5GC</text>
  
  <!-- 副标题 -->
  <text x="${size/2}" y="${size*0.57}" font-family="Arial, sans-serif" font-size="${size*0.08}" 
        font-weight="500" text-anchor="middle" fill="#E3F2FD" opacity="0.9">智擎</text>
</svg>`;
};

// 创建图标配置
const icons = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'splash-icon.png', size: 1024 },
  { name: 'favicon.png', size: 512 }
];

const assetsDir = path.join(process.cwd(), 'assets', 'images');

// 为每个图标创建对应的SVG文件
icons.forEach(icon => {
  const svgContent = createSimpleIcon(icon.size);
  const svgPath = path.join(assetsDir, icon.name.replace('.png', '.svg'));
  
  try {
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✅ 创建了 ${icon.name.replace('.png', '.svg')}`);
  } catch (error) {
    console.error(`❌ 创建 ${icon.name.replace('.png', '.svg')} 失败:`, error.message);
  }
});

console.log('\n📁 SVG文件已创建在 assets/images/ 目录中');
console.log('\n🔄 接下来的步骤：');
console.log('1. 使用在线工具将SVG转换为PNG:');
console.log('   - https://www.svgviewer.dev/');
console.log('   - https://convertio.co/zh/svg-png/');
console.log('');
console.log('2. 或者安装sharp工具进行转换:');
console.log('   npm install -g sharp-cli');
console.log('   sharp -i assets/images/icon.svg -o assets/images/icon.png -f png');
console.log('');
console.log('3. 清理并重建应用:');
console.log('   npx expo start --clear'); 