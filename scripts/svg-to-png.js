const fs = require('fs');
const path = require('path');
const { svg2png, initialize } = require('svg2png-wasm');

async function convertSvgToPng() {
  try {
    // 初始化wasm
    await initialize(fs.readFileSync(path.join(__dirname, '../node_modules/svg2png-wasm/svg2png_wasm_bg.wasm')));
    
    const assetsDir = path.join(process.cwd(), 'assets', 'images');
    
    // 转换配置
    const conversions = [
      { svg: 'icon.svg', png: 'icon.png', size: 1024 },
      { svg: 'adaptive-icon.svg', png: 'adaptive-icon.png', size: 1024 },
      { svg: 'splash-icon.svg', png: 'splash-icon.png', size: 1024 },
      { svg: 'favicon.svg', png: 'favicon.png', size: 512 }
    ];
    
    console.log('🔄 开始转换SVG到PNG...\n');
    
    for (const config of conversions) {
      const svgPath = path.join(assetsDir, config.svg);
      const pngPath = path.join(assetsDir, config.png);
      
      if (!fs.existsSync(svgPath)) {
        console.log(`❌ ${config.svg} 不存在，跳过`);
        continue;
      }
      
      try {
        const svgContent = fs.readFileSync(svgPath);
        const pngBuffer = await svg2png(svgContent, {
          width: config.size,
          height: config.size,
          backgroundColor: 'transparent'
        });
        
        fs.writeFileSync(pngPath, pngBuffer);
        console.log(`✅ 转换成功: ${config.svg} -> ${config.png} (${config.size}x${config.size})`);
      } catch (error) {
        console.log(`❌ 转换失败: ${config.svg} - ${error.message}`);
      }
    }
    
    console.log('\n🎉 图标转换完成！');
    console.log('\n📱 下一步：');
    console.log('1. 清理缓存: npx expo start --clear');
    console.log('2. 重新构建: npx expo prebuild --clear');
    console.log('3. 运行应用: npx expo run:android 或 npx expo run:ios');
    
  } catch (error) {
    console.error('❌ 转换过程中出错:', error.message);
    console.log('\n💡 备选方案：');
    console.log('使用在线工具转换：https://www.svgviewer.dev/');
  }
}

convertSvgToPng(); 