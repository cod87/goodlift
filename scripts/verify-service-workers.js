#!/usr/bin/env node

/**
 * CI Check: Verify Service Worker Build Output
 * 
 * This script verifies that both service workers are properly
 * copied to the build output directory after running npm run build.
 * 
 * Run this as part of CI/CD pipeline after build step.
 * 
 * Usage: node scripts/verify-service-workers.js
 * Exit code: 0 = success, 1 = failure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BUILD_DIR = path.join(__dirname, '../docs');
const REQUIRED_FILES = [
  'service-worker.js',
  'firebase-messaging-sw.js',
  'sw-version.js',
  'index.html',
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

/**
 * Check if a file exists
 */
function fileExists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch (error) {
    return false;
  }
}

/**
 * Get file size in KB
 */
function getFileSize(filepath) {
  try {
    const stats = fs.statSync(filepath);
    return (stats.size / 1024).toFixed(2);
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Check if service worker contains specific patterns
 */
function checkServiceWorkerContent(filepath, patterns) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const results = {};
    
    for (const [name, pattern] of Object.entries(patterns)) {
      results[name] = pattern.test(content);
    }
    
    return results;
  } catch (error) {
    console.error(`Error reading ${filepath}:`, error.message);
    return null;
  }
}

/**
 * Main verification function
 */
function verifyServiceWorkers() {
  logSection('Service Worker Build Verification');
  
  let allPassed = true;
  const results = {
    filesExist: {},
    pwaSW: {},
    fcmSW: {},
  };

  // Check 1: Verify build directory exists
  log('Checking build directory...', 'blue');
  if (!fs.existsSync(BUILD_DIR)) {
    log(`❌ Build directory not found: ${BUILD_DIR}`, 'red');
    log('   Run "npm run build" first', 'yellow');
    return false;
  }
  log(`✅ Build directory exists: ${BUILD_DIR}`, 'green');

  // Check 2: Verify required files exist
  console.log('\n' + '-'.repeat(60));
  log('Checking required files...', 'blue');
  
  for (const file of REQUIRED_FILES) {
    const filepath = path.join(BUILD_DIR, file);
    const exists = fileExists(filepath);
    const size = exists ? getFileSize(filepath) : 'N/A';
    
    results.filesExist[file] = exists;
    
    if (exists) {
      log(`✅ ${file} (${size} KB)`, 'green');
    } else {
      log(`❌ ${file} - NOT FOUND`, 'red');
      allPassed = false;
    }
  }

  // Check 3: Verify PWA service worker content
  console.log('\n' + '-'.repeat(60));
  log('Analyzing PWA service worker (service-worker.js)...', 'blue');
  
  const pwaSWPath = path.join(BUILD_DIR, 'service-worker.js');
  if (results.filesExist['service-worker.js']) {
    const pwaSWPatterns = {
      hasInstallListener: /addEventListener\s*\(\s*['"]install['"]/,
      hasActivateListener: /addEventListener\s*\(\s*['"]activate['"]/,
      hasFetchListener: /addEventListener\s*\(\s*['"]fetch['"]/,
      hasCacheName: /CACHE_NAME/,
      noPushListener: /addEventListener\s*\(\s*['"]push['"]/,
      noNotificationClickListener: /addEventListener\s*\(\s*['"]notificationclick['"]/,
    };
    
    const pwaSWContent = checkServiceWorkerContent(pwaSWPath, pwaSWPatterns);
    
    if (pwaSWContent) {
      results.pwaSW = pwaSWContent;
      
      // Check expected patterns
      if (pwaSWContent.hasInstallListener) {
        log('✅ Has install event listener', 'green');
      } else {
        log('❌ Missing install event listener', 'red');
        allPassed = false;
      }
      
      if (pwaSWContent.hasActivateListener) {
        log('✅ Has activate event listener', 'green');
      } else {
        log('❌ Missing activate event listener', 'red');
        allPassed = false;
      }
      
      if (pwaSWContent.hasFetchListener) {
        log('✅ Has fetch event listener', 'green');
      } else {
        log('❌ Missing fetch event listener', 'red');
        allPassed = false;
      }
      
      if (pwaSWContent.hasCacheName) {
        log('✅ Has cache name defined', 'green');
      } else {
        log('❌ Missing cache name', 'red');
        allPassed = false;
      }
      
      // Check unwanted patterns (should NOT exist)
      if (!pwaSWContent.noPushListener) {
        log('✅ No push event listener (correct)', 'green');
      } else {
        log('❌ Has push event listener (should not have)', 'red');
        log('   Push notifications should be handled by firebase-messaging-sw.js', 'yellow');
        allPassed = false;
      }
      
      if (!pwaSWContent.noNotificationClickListener) {
        log('✅ No notificationclick listener (correct)', 'green');
      } else {
        log('❌ Has notificationclick listener (should not have)', 'red');
        log('   Notification clicks should be handled by firebase-messaging-sw.js', 'yellow');
        allPassed = false;
      }
    }
  }

  // Check 4: Verify Firebase Messaging service worker content
  console.log('\n' + '-'.repeat(60));
  log('Analyzing FCM service worker (firebase-messaging-sw.js)...', 'blue');
  
  const fcmSWPath = path.join(BUILD_DIR, 'firebase-messaging-sw.js');
  if (results.filesExist['firebase-messaging-sw.js']) {
    const fcmSWPatterns = {
      hasImportScripts: /importScripts/,
      hasFirebaseInit: /firebase\.initializeApp/,
      hasMessagingInstance: /firebase\.messaging\(\)/,
      hasBackgroundMessageHandler: /onBackgroundMessage/,
      hasNotificationClickListener: /addEventListener\s*\(\s*['"]notificationclick['"]/,
      noFetchListener: /addEventListener\s*\(\s*['"]fetch['"]/,
    };
    
    const fcmSWContent = checkServiceWorkerContent(fcmSWPath, fcmSWPatterns);
    
    if (fcmSWContent) {
      results.fcmSW = fcmSWContent;
      
      // Check expected patterns
      if (fcmSWContent.hasImportScripts) {
        log('✅ Has importScripts for Firebase SDK', 'green');
      } else {
        log('❌ Missing importScripts', 'red');
        allPassed = false;
      }
      
      if (fcmSWContent.hasFirebaseInit) {
        log('✅ Has Firebase initialization', 'green');
      } else {
        log('❌ Missing Firebase initialization', 'red');
        allPassed = false;
      }
      
      if (fcmSWContent.hasMessagingInstance) {
        log('✅ Has Firebase Messaging instance', 'green');
      } else {
        log('❌ Missing Firebase Messaging instance', 'red');
        allPassed = false;
      }
      
      if (fcmSWContent.hasBackgroundMessageHandler) {
        log('✅ Has background message handler', 'green');
      } else {
        log('❌ Missing background message handler', 'red');
        allPassed = false;
      }
      
      if (fcmSWContent.hasNotificationClickListener) {
        log('✅ Has notificationclick listener', 'green');
      } else {
        log('⚠️  Missing notificationclick listener (optional)', 'yellow');
      }
      
      // Check unwanted patterns (should NOT exist)
      if (!fcmSWContent.noFetchListener) {
        log('✅ No fetch event listener (correct)', 'green');
      } else {
        log('❌ Has fetch event listener (should not have)', 'red');
        log('   Fetch events should be handled by service-worker.js', 'yellow');
        allPassed = false;
      }
    }
  }

  // Check 5: Verify index.html has service worker registration
  console.log('\n' + '-'.repeat(60));
  log('Checking index.html for service worker registration...', 'blue');
  
  const indexPath = path.join(BUILD_DIR, 'index.html');
  if (results.filesExist['index.html']) {
    try {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const hasSWRegistration = /navigator\.serviceWorker\.register/.test(indexContent);
      const hasSWComment = /Service Worker Registration/.test(indexContent);
      
      if (hasSWRegistration) {
        log('✅ Has service worker registration code', 'green');
      } else {
        log('❌ Missing service worker registration', 'red');
        allPassed = false;
      }
      
      if (hasSWComment) {
        log('✅ Has service worker documentation comments', 'green');
      } else {
        log('⚠️  Missing documentation comments', 'yellow');
      }
    } catch (error) {
      log(`❌ Error reading index.html: ${error.message}`, 'red');
      allPassed = false;
    }
  }

  // Summary
  logSection('Verification Summary');
  
  if (allPassed) {
    log('🎉 All checks passed!', 'green');
    log('\nService workers are properly configured:', 'green');
    log('  • PWA service worker handles caching and offline', 'green');
    log('  • FCM service worker handles push notifications', 'green');
    log('  • No conflicts between service workers', 'green');
    log('\nReady for deployment! ✅', 'green');
    return true;
  } else {
    log('❌ Some checks failed', 'red');
    log('\nPlease fix the issues above before deploying.', 'yellow');
    log('Run "npm run build" and verify the service worker files.', 'yellow');
    return false;
  }
}

// Run verification
try {
  const success = verifyServiceWorkers();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('\n' + '='.repeat(60));
  log('❌ Verification script error:', 'red');
  console.error(error);
  console.error('='.repeat(60));
  process.exit(1);
}
