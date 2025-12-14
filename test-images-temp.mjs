import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Capture network requests
  const imageRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('.webp') || url.includes('.svg')) {
      imageRequests.push(url);
    }
  });

  const imageResponses = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('.webp') || url.includes('.svg')) {
      imageResponses.push({ url, status: response.status() });
    }
  });

  // Navigate to the verification page
  console.log('Navigating to verification page...');
  await page.goto('http://localhost:4173/goodlift/verify-exercise-images.html', { waitUntil: 'networkidle' });
  
  // Wait a bit for images to load
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/verify-page.png', fullPage: true });
  console.log('Screenshot saved: /tmp/verify-page.png');
  
  // Print diagnostics
  console.log('\n=== Image Requests ===');
  imageRequests.forEach(url => console.log(url));
  
  console.log('\n=== Image Responses ===');
  imageResponses.forEach(({ url, status }) => console.log(`${status}: ${url}`));
  
  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));

  await browser.close();
})();
