import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log('=== Testing Workout Builder Images ===');
  
  await page.goto('http://localhost:4173/goodlift/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Continue as guest
  await page.click('text=Continue as Guest');
  await page.waitForTimeout(2000);
  
  // Click Work tab
  await page.click('text=Work');
  await page.waitForTimeout(1000);
  
  // Click the + button
  const plusButton = page.locator('button').filter({ hasText: '+' }).first();
  await plusButton.click();
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '/tmp/workout-builder-modal.png', fullPage: true });
  console.log('Workout builder modal: /tmp/workout-builder-modal.png');
  
  // Try to add an exercise
  const addExerciseBtn = page.locator('button').filter({ hasText: /add.*exercise/i }).first();
  if (await addExerciseBtn.isVisible({ timeout: 3000 })) {
    await addExerciseBtn.click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/tmp/exercise-picker-modal.png', fullPage: true });
    console.log('Exercise picker: /tmp/exercise-picker-modal.png');
  } else {
    // Maybe exercises are already visible
    await page.screenshot({ path: '/tmp/builder-state.png', fullPage: true });
    console.log('Builder state: /tmp/builder-state.png');
  }

  await browser.close();
})();
