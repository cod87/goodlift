import { chromium } from '@playwright/test';

async function quickWorkout() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    await page.goto('http://localhost:5175/goodlift/');
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("Continue as Guest")');
    await page.waitForTimeout(2000);
    
    // Click "Quick Start" or similar
    const quickStart = await page.$('button:has-text("Quick Start"), button:has-text("Start Workout")');
    if (quickStart) {
      console.log('Clicking Quick Start...');
      await quickStart.click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/tmp/workout-active.png', fullPage: true });
      console.log('✓ Captured active workout screenshot');
      return;
    }
    
    // Otherwise try the standard flow
    console.log('Trying standard flow...');
    await page.click('text=Strength');
    await page.waitForTimeout(2000);
    
    // Look for any "Start" or "Generate" buttons
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text && (text.includes('Generate') || text.includes('Random'))) {
        console.log(`Clicking: ${text}`);
        await btn.click();
        await page.waitForTimeout(5000);
        
        // Look for Start Workout
        const startBtn = await page.$('button:has-text("Start Workout"), button:has-text("Start")');
        if (startBtn) {
          await startBtn.click();
          await page.waitForTimeout(5000);
          await page.screenshot({ path: '/tmp/workout-session-main.png', fullPage: true });
          console.log('✓ Captured workout session!');
          
          // Scroll down to see muscle SVG
          await page.evaluate(() => window.scrollTo(0, 400));
          await page.waitForTimeout(1000);
          await page.screenshot({ path: '/tmp/workout-session-svg-view.png', fullPage: true });
          console.log('✓ Captured scrolled view with SVG!');
        }
        break;
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

quickWorkout();
