import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log('=== Testing Workout Builder ===');
  
  // Navigate to main app
  await page.goto('http://localhost:4173/goodlift/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Click "Continue as Guest"
  try {
    await page.click('text=Continue as Guest');
    console.log('Clicked Continue as Guest');
    await page.waitForTimeout(3000);
    
    // Take screenshot after login
    await page.screenshot({ path: '/tmp/after-guest-login.png' });
    console.log('After login screenshot: /tmp/after-guest-login.png');
    
    // Try to find and click Work tab
    const workButton = page.locator('[role="button"]:has-text("Work")').or(page.locator('button:has-text("Work")')).or(page.locator('text=Work')).first();
    await workButton.click();
    console.log('Clicked Work tab');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: '/tmp/work-tab.png', fullPage: true });
    console.log('Work tab screenshot: /tmp/work-tab.png');
    
    // Try to find create workout or similar button
    const createButton = page.locator('text=/create.*workout|new.*workout|add.*workout|build/i').first();
    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      console.log('Clicked create workout');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: '/tmp/workout-builder.png', fullPage: true });
      console.log('Workout builder screenshot: /tmp/workout-builder.png');
    } else {
      console.log('Create workout button not found');
    }
    
  } catch (e) {
    console.log('Error:', e.message);
    await page.screenshot({ path: '/tmp/error-state.png' });
  }

  await browser.close();
})();
