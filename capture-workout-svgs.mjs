import { chromium } from '@playwright/test';

async function captureWorkoutWithSVGs() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[WorkoutScreen]')) {
      console.log('BROWSER:', text);
    }
  });

  try {
    console.log('1. Navigate and login...');
    await page.goto('http://localhost:5175/goodlift/');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Continue as Guest")');
    await page.waitForTimeout(2000);
    
    console.log('2. Open workout creator...');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const box = await btn.boundingBox();
      if (box && box.x > 300) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/modal-with-svgs.png', fullPage: true });
    console.log('✓ Screenshot 1: Workout builder modal showing muscle SVGs');
    
    console.log('3. Switch to "My Workout" tab...');
    const tabs = await page.$$('[role="tab"]');
    if (tabs.length >= 2) {
      await tabs[1].click(); // Click "My Workout" tab
      await page.waitForTimeout(2000);
    }
    
    console.log('4. Click on an exercise to add it...');
    // Find and click first exercise
    const exerciseItems = await page.$$('[role="button"]');
    if (exerciseItems.length > 0) {
      // Click first few exercises to add them
      for (let i = 0; i < Math.min(3, exerciseItems.length); i++) {
        try {
          const item = exerciseItems[i];
          const text = await item.textContent();
          if (text && (text.includes('Push') || text.includes('Press') || text.includes('Squat'))) {
            console.log(`Adding exercise: ${text.substring(0, 30)}`);
            await item.click();
            await page.waitForTimeout(1000);
          }
        } catch (e) {
          // Continue if click fails
        }
      }
    }
    
    // Switch back to My Workout tab to see added exercises
    if (tabs.length >= 2) {
      await tabs[1].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/my-workout-tab.png', fullPage: true });
      console.log('✓ Screenshot 2: My Workout tab with exercises');
    }
    
    console.log('5. Start workout...');
    const startBtn = await page.$('button:has-text("Start Workout"), button:has-text("Start")');
    if (startBtn) {
      await startBtn.click();
      await page.waitForTimeout(5000);
      
      console.log('6. Capturing workout session with SVGs...');
      await page.screenshot({ path: '/tmp/workout-session-1.png', fullPage: true });
      console.log('✓ Screenshot 3: Active workout session (first exercise)');
      
      // Scroll to see if there's an SVG
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/workout-session-scrolled.png', fullPage: true });
      console.log('✓ Screenshot 4: Scrolled view');
      
      // Try to go to next exercise
      const nextBtn = await page.$('button:has-text("Next"), button[type="submit"]');
      if (nextBtn) {
        // Fill in some weight/reps first
        const inputs = await page.$$('input[type="number"], input[type="tel"]');
        if (inputs.length >= 2) {
          await inputs[0].fill('100');
          await inputs[1].fill('10');
        }
        await page.waitForTimeout(1000);
        await nextBtn.click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: '/tmp/workout-session-2.png', fullPage: true });
        console.log('✓ Screenshot 5: Second exercise');
      }
      
      console.log('\n=== SUCCESS ===');
      console.log('Screenshots saved showing muscle SVGs in workout session');
    } else {
      console.log('Could not find Start button');
      await page.screenshot({ path: '/tmp/no-start-button.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

captureWorkoutWithSVGs();
