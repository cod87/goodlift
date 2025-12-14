import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log('=== Testing Main App ===');
  
  // Navigate to main app
  await page.goto('http://localhost:4173/goodlift/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Take screenshot of home
  await page.screenshot({ path: '/tmp/app-home.png' });
  console.log('Home screenshot: /tmp/app-home.png');

  // Try to navigate to workout tab
  try {
    const workTab = await page.locator('text=Work').first();
    if (await workTab.isVisible()) {
      await workTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/app-work-tab.png', fullPage: true });
      console.log('Work tab screenshot: /tmp/app-work-tab.png');
    }
  } catch (e) {
    console.log('Could not navigate to Work tab:', e.message);
  }

  // Check if there's a workout builder or exercise list
  try {
    const createBtn = await page.locator('text=/create|build|add/i').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/tmp/app-builder.png', fullPage: true });
      console.log('Builder screenshot: /tmp/app-builder.png');
    }
  } catch (e) {
    console.log('Could not open builder:', e.message);
  }

  await browser.close();
})();
