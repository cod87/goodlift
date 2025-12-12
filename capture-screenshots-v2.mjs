import { chromium } from '@playwright/test';
import { readdir } from 'fs/promises';

async function captureWorkoutScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone-like mobile viewport
  });
  const page = await context.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('[WorkoutScreen]')) {
      console.log('BROWSER CONSOLE:', text);
    }
  });

  try {
    console.log('Navigating to the app...');
    await page.goto('http://localhost:5174/goodlift/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('Clicking Continue as Guest...');
    await page.click('button:has-text("Continue as Guest")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/01-after-guest-login.png', fullPage: true });
    
    console.log('Clicking Strength tab...');
    const tabs = await page.$$('[role="tab"]');
    if (tabs.length > 0) {
      await tabs[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/02-strength-tab.png', fullPage: true });
    }
    
    console.log('Looking for + button...');
    // Find the green + button
    const buttons = await page.$$('button');
    let addButton = null;
    for (const btn of buttons) {
      const box = await btn.boundingBox();
      if (box && box.x > 1200) { // Button is on the right side
        addButton = btn;
        break;
      }
    }
    
    if (addButton) {
      console.log('Clicking + button...');
      await addButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/tmp/03-workout-modal.png', fullPage: true });
      
      // Click "Generate" button
      console.log('Looking for Generate button...');
      const generateBtn = await page.$('button:has-text("Generate")');
      if (generateBtn) {
        console.log('Clicking Generate Workout...');
        await generateBtn.click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: '/tmp/04-after-generate.png', fullPage: true });
        
        // Look for Start button
        console.log('Looking for Start button...');
        const startBtn = await page.$('button:has-text("Start Workout"), button:has-text("Start")');
        if (startBtn) {
          console.log('Clicking Start Workout...');
          await startBtn.click();
          await page.waitForTimeout(5000);
          
          console.log('=== IN WORKOUT SESSION ===');
          await page.screenshot({ path: '/tmp/05-workout-session.png', fullPage: true });
          
          // Wait to capture console logs
          await page.waitForTimeout(3000);
          await page.screenshot({ path: '/tmp/06-workout-session-detail.png', fullPage: true });
          
          console.log('\n=== Console logs from workout session ===');
          const workoutLogs = consoleLogs.filter(log => log.includes('[WorkoutScreen]'));
          if (workoutLogs.length > 0) {
            workoutLogs.forEach(log => console.log(log));
          } else {
            console.log('No [WorkoutScreen] logs found');
            console.log('All console logs:', consoleLogs.slice(-20));
          }
        }
      }
    }
    
    console.log('\nScreenshots saved to /tmp/');
    const screenshots = (await readdir('/tmp')).filter(f => f.endsWith('.png'));
    screenshots.forEach(f => console.log(`  - /tmp/${f}`));
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: '/tmp/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

captureWorkoutScreenshots().catch(console.error);
