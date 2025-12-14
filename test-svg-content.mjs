import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Navigate to check a specific SVG
  console.log('Checking SVG content...');
  const response = await page.goto('http://localhost:4173/goodlift/svg-muscles/archer-push-up.svg');
  const content = await response.text();
  
  console.log('Status:', response.status());
  console.log('Content-Type:', response.headers()['content-type']);
  console.log('Content length:', content.length);
  console.log('First 500 chars:', content.substring(0, 500));

  await browser.close();
})();
