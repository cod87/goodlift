const { chromium } = require('playwright');

async function testWorkoutImages() {
  console.log('🧪 Testing workout session image rendering...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('exercise') || msg.text().includes('image') || msg.text().includes('svg')) {
      console.log('🖥️  Browser:', msg.text());
    }
  });
  
  try {
    console.log('📱 Loading app...');
    await page.goto('http://localhost:5173/goodlift/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Try to start a workout
    console.log('🏋️  Looking for workout start button...');
    
    // Look for various possible buttons
    const selectors = [
      'button:has-text("Start")',
      'button:has-text("Workout")',
      'button:has-text("Quick")',
      'text=/start.*workout|begin/i',
      '[role="button"]:has-text("Full Body")',
      '[role="button"]:has-text("Upper Body")',
    ];
    
    let started = false;
    for (const selector of selectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found button: ${selector}`);
          await button.click();
          await page.waitForTimeout(2000);
          started = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!started) {
      console.log('⚠️  Could not find start button, trying guest mode...');
      try {
        const guestBtn = page.locator('text=/guest|continue.*guest|skip/i').first();
        if (await guestBtn.isVisible({ timeout: 2000 })) {
          await guestBtn.click();
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        console.log('⚠️  No guest mode found');
      }
    }
    
    // Take screenshot of current state
    await page.screenshot({ path: '/tmp/test-workout-1-home.png', fullPage: true });
    console.log('📸 Screenshot 1: /tmp/test-workout-1-home.png');
    
    // Check for exercise images
    const images = await page.locator('img').all();
    console.log(`\n🖼️  Found ${images.length} total img elements`);
    
    for (let i = 0; i < Math.min(images.length, 10); i++) {
      const src = await images[i].getAttribute('src');
      const alt = await images[i].getAttribute('alt');
      console.log(`   [${i}] src: ${src?.substring(0, 80) || 'none'}`);
      console.log(`       alt: ${alt || 'none'}`);
    }
    
    // Check specifically for svg-muscles or demos images
    const svgImages = await page.locator('img[src*="svg-muscles"]').all();
    const demoImages = await page.locator('img[src*="demos"]').all();
    console.log(`\n🎯 SVG muscle images: ${svgImages.length}`);
    console.log(`🎯 Demo images: ${demoImages.length}`);
    
    // Get page text to understand state
    const bodyText = await page.locator('body').textContent();
    console.log(`\n📝 Page contains: ${bodyText.substring(0, 300)}...`);
    
    await page.screenshot({ path: '/tmp/test-workout-2-final.png', fullPage: true });
    console.log('\n📸 Screenshot 2: /tmp/test-workout-2-final.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/test-workout-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testWorkoutImages().catch(console.error);
