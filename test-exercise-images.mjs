import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Capture image load errors
  const imageErrors = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'image') {
      if (response.status() !== 200) {
        imageErrors.push({ url: response.url(), status: response.status() });
      }
    }
  });

  console.log('=== Testing Exercise Images in Workout Builder ===');
  
  await page.goto('http://localhost:4173/goodlift/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Continue as guest
  await page.click('text=Continue as Guest');
  await page.waitForTimeout(2000);
  
  // Click Work tab
  await page.click('text=Work');
  await page.waitForTimeout(1000);
  
  // Click the + button to create a workout
  await page.click('button:has-text("+")').catch(() => page.click('[aria-label="Add workout"]')).catch(() => page.click('.MuiFab-root'));
  console.log('Clicked + button');
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '/tmp/workout-modal-opened.png', fullPage: true });
  console.log('Modal opened screenshot: /tmp/workout-modal-opened.png');
  
  // Try to click on "Add Exercise" or similar
  const addExerciseBtn = page.locator('text=/add.*exercise/i').first();
  if (await addExerciseBtn.isVisible({ timeout: 2000 })) {
    await addExerciseBtn.click();
    console.log('Clicked Add Exercise');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/tmp/exercise-picker.png', fullPage: true });
    console.log('Exercise picker screenshot: /tmp/exercise-picker.png');
  }
  
  // Check for failed images
  if (imageErrors.length > 0) {
    console.log('\n=== Image Load Errors ===');
    imageErrors.forEach(({ url, status }) => console.log(`${status}: ${url}`));
  } else {
    console.log('\n=== No Image Load Errors ===');
  }

  await browser.close();
})();
