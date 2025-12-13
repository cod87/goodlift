import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });
  const page = await context.newPage();

  // Load the visualization HTML
  const htmlPath = 'file:///tmp/svg-visualization.html';
  console.log(`Loading ${htmlPath}...`);
  await page.goto(htmlPath);
  
  // Wait for SVGs to render
  await page.waitForTimeout(1000);

  // Take full page screenshot
  console.log('Taking desktop screenshot...');
  await page.screenshot({ 
    path: '/tmp/muscle-svg-desktop.png',
    fullPage: true 
  });

  // Resize for tablet
  console.log('Taking tablet screenshot...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: '/tmp/muscle-svg-tablet.png',
    fullPage: true 
  });

  // Resize for mobile
  console.log('Taking mobile screenshot...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: '/tmp/muscle-svg-mobile.png',
    fullPage: true 
  });

  await browser.close();
  
  console.log('\n✅ Screenshots generated:');
  console.log('   - /tmp/muscle-svg-desktop.png (1200x800)');
  console.log('   - /tmp/muscle-svg-tablet.png (768x1024)');
  console.log('   - /tmp/muscle-svg-mobile.png (375x667)');
}

generateScreenshots().catch(console.error);
