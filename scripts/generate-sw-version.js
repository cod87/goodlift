#!/usr/bin/env node

/**
 * Generate Service Worker Version File
 * 
 * This script creates a version.js file with the current build timestamp
 * to ensure the service worker cache is updated on every deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the current timestamp
const buildTimestamp = Date.now();
const buildDate = new Date(buildTimestamp).toISOString();

// Create version file content
const versionContent = `// Auto-generated service worker version
// Generated at: ${buildDate}
const SW_VERSION = '${buildTimestamp}';
const SW_BUILD_DATE = '${buildDate}';

// Export for service worker
if (typeof self !== 'undefined') {
  self.SW_VERSION = SW_VERSION;
  self.SW_BUILD_DATE = SW_BUILD_DATE;
}
`;

// Write to public folder (will be copied to build)
const publicPath = path.join(__dirname, '../public/sw-version.js');
fs.writeFileSync(publicPath, versionContent, 'utf8');

console.log('✅ Service worker version file generated');
console.log('   Version:', buildTimestamp);
console.log('   Build Date:', buildDate);
console.log('   File:', publicPath);
