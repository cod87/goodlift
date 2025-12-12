import { chromium } from '@playwright/test';
import { readdir } from 'fs/promises';

async function captureWorkoutScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to the app...');
    await page.goto('http://localhost:5174/goodlift/', { waitUntil: 'networkidle' });
    
    // Wait for app to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of login page
    console.log('Taking screenshot of login page...');
    await page.screenshot({ path: '/tmp/01-login-page.png', fullPage: true });
    
    // Click "Continue as Guest"
    try {
      console.log('Clicking Continue as Guest...');
      await page.click('button:has-text("Continue as Guest")', { timeout: 5000 });
      await page.waitForTimeout(3000);
      console.log('Taking screenshot after guest login...');
      await page.screenshot({ path: '/tmp/02-after-guest-login.png', fullPage: true });
    } catch (e) {
      console.log('Could not click guest button:', e.message);
    }
    
    // Try to navigate to Strength tab (first tab)
    try {
      console.log('Clicking Strength tab...');
      const tabs = await page.$$('[role="tab"]');
      if (tabs.length > 0) {
        await tabs[0].click();
        await page.waitForTimeout(3000);
        console.log('Taking screenshot of Strength tab...');
        await page.screenshot({ path: '/tmp/03-strength-tab.png', fullPage: true });
      }
    } catch (e) {
      console.log('Could not click Strength tab:', e.message);
    }
    
    // Click the "+" button to create a workout
    try {
      console.log('Clicking + button to create workout...');
      await page.click('button[aria-label="Create workout"], button:has-text("+")');
      await page.waitForTimeout(3000);
      console.log('Taking screenshot of workout creation modal...');
      await page.screenshot({ path: '/tmp/04-workout-creation-modal.png', fullPage: true });
      
      // Click "Generate Workout" or similar button
      const generateButton = await page.$('button:has-text("Generate")');
      if (generateButton) {
        console.log('Clicking Generate Workout...');
        await generateButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/05-after-generate.png', fullPage: true });
      }
      
      // Look for "Start Workout" button
      const startButton = await page.$('button:has-text("Start Workout"), button:has-text("Start")');
      if (startButton) {
        console.log('Clicking Start Workout...');
        await startButton.click();
        await page.waitForTimeout(3000);
        console.log('Taking screenshot of active workout session...');
        await page.screenshot({ path: '/tmp/06-workout-session.png', fullPage: true });
        
        // Wait a bit more and take another screenshot
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/07-workout-session-2.png', fullPage: true });
      }
      
    } catch (e) {
      console.log('Error in workout flow:', e.message);
      // Try to take a screenshot of current state
      try {
        await page.screenshot({ path: '/tmp/error-state.png', fullPage: true });
      } catch (e2) {
        console.log('Could not take error screenshot');
      }
    }
    
    console.log('\nScreenshots saved to /tmp/');
    const screenshots = (await readdir('/tmp')).filter(f => f.endsWith('.png'));
    screenshots.forEach(f => console.log(`  - /tmp/${f}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

captureWorkoutScreenshots().catch(console.error);
