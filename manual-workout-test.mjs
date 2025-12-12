import { chromium } from '@playwright/test';

async function testWorkout() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  
  // Capture all console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[WorkoutScreen]') || text.includes('primaryMuscle') || text.includes('demoImageSrc')) {
      console.log('BROWSER:', text);
    }
  });

  try {
    console.log('1. Navigate to app...');
    await page.goto('http://localhost:5175/goodlift/');
    await page.waitForTimeout(3000);
    
    console.log('2. Continue as guest...');
    await page.click('button:has-text("Continue as Guest")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/step1-logged-in.png', fullPage: true });
    
    console.log('3. Finding + button...');
    // Try to find the + button by looking at all buttons and their positions
    const allButtons = await page.$$('button');
    console.log(`Found ${allButtons.length} buttons total`);
    
    // Click the green + button (likely in top right corner)
    let foundAdd = false;
    for (let i = 0; i < allButtons.length; i++) {
      const btn = allButtons[i];
      const box = await btn.boundingBox();
      if (box && box.x > 300) { // Button on the right side
        console.log(`Button ${i} at x=${box.x}, clicking...`);
        await btn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/step2-after-add-click.png', fullPage: true });
        foundAdd = true;
        break;
      }
    }
    
    if (!foundAdd) {
      console.log('Could not find + button');
      await page.screenshot({ path: '/tmp/error-no-add-button.png', fullPage: true });
      await browser.close();
      return;
    }
    
    console.log('4. Looking for Generate button...');
    const generateBtn = await page.$('button:has-text("Generate")');
    if (generateBtn) {
      console.log('Clicking Generate...');
      await generateBtn.click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/tmp/step3-generated-workout.png', fullPage: true });
      
      console.log('5. Looking for Start button...');
      const startBtn = await page.$('button:has-text("Start")');
      if (startBtn) {
        console.log('Clicking Start Workout...');
        await startBtn.click();
        await page.waitForTimeout(5000);
        
        console.log('6. IN WORKOUT SESSION!');
        await page.screenshot({ path: '/tmp/step4-workout-active.png', fullPage: true });
        
        // Wait to let everything render
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/step5-workout-detail.png', fullPage: true });
        
        console.log('\nWorkout session screenshots captured!');
        console.log('Check /tmp/step4-workout-active.png and step5-workout-detail.png');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testWorkout();
