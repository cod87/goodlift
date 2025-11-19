/**
 * Browser and Platform Detection Utility
 * 
 * Provides comprehensive detection for browser type, platform, and push notification support.
 * Especially important for Safari/iOS which has limited push notification support.
 */

/**
 * Detect the current browser
 * @returns {Object} Browser information
 */
export function detectBrowser() {
  const ua = navigator.userAgent;
  const vendor = navigator.vendor || '';
  
  // Safari detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua) && /apple/i.test(vendor);
  
  // iOS detection (includes iPadOS 13+ which reports as Mac)
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Chrome detection
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(vendor) && !/Edge/.test(ua);
  
  // Firefox detection
  const isFirefox = /Firefox/.test(ua);
  
  // Edge detection
  const isEdge = /Edg/.test(ua);
  
  // Opera detection
  const isOpera = /OPR/.test(ua);
  
  // Brave detection (harder to detect, uses Chrome UA)
  const isBrave = navigator.brave?.isBrave?.name === 'isBrave';
  
  return {
    isSafari,
    isIOS,
    isChrome,
    isFirefox,
    isEdge,
    isOpera,
    isBrave,
    userAgent: ua,
    vendor,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints
  };
}

/**
 * Check if push notifications are supported in the current browser
 * @returns {Object} Support status with detailed information
 */
export function checkPushNotificationSupport() {
  const browser = detectBrowser();
  const support = {
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    notification: 'Notification' in window,
    messaging: null, // Will be set by Firebase check
    browser,
    isFullySupported: false,
    warnings: [],
    errors: []
  };
  
  // Check for full support
  support.isFullySupported = support.serviceWorker && 
    support.pushManager && 
    support.notification;
  
  // Safari/iOS specific checks
  if (browser.isSafari || browser.isIOS) {
    if (browser.isIOS && parseFloat(navigator.userAgent.match(/OS (\d+)_/)?.[1]) < 16) {
      support.errors.push('iOS version too old for push notifications (requires iOS 16.4+)');
      support.isFullySupported = false;
    } else if (browser.isIOS) {
      support.warnings.push('iOS/Safari push notifications have limited support and require explicit user action');
      support.warnings.push('Push notifications may not work in standalone mode (added to home screen)');
    }
    
    if (browser.isSafari && !browser.isIOS) {
      support.warnings.push('Safari desktop push notifications require macOS 13+ (Ventura or later)');
    }
  }
  
  // Check individual features
  if (!support.serviceWorker) {
    support.errors.push('Service Workers are not supported in this browser');
  }
  
  if (!support.pushManager) {
    support.errors.push('Push Manager API is not supported in this browser');
  }
  
  if (!support.notification) {
    support.errors.push('Notification API is not supported in this browser');
  }
  
  // Check if running in secure context (required for service workers)
  if (!window.isSecureContext && location.hostname !== 'localhost') {
    support.errors.push('Push notifications require HTTPS (secure context)');
    support.isFullySupported = false;
  }
  
  return support;
}

/**
 * Get detailed browser and support information as a formatted string
 * @returns {string} Formatted browser information
 */
export function getBrowserInfoString() {
  const browser = detectBrowser();
  const support = checkPushNotificationSupport();
  
  let info = '=== Browser Information ===\n';
  
  if (browser.isChrome) info += 'Browser: Google Chrome\n';
  else if (browser.isFirefox) info += 'Browser: Mozilla Firefox\n';
  else if (browser.isEdge) info += 'Browser: Microsoft Edge\n';
  else if (browser.isSafari) info += 'Browser: Safari\n';
  else if (browser.isOpera) info += 'Browser: Opera\n';
  else if (browser.isBrave) info += 'Browser: Brave\n';
  else info += 'Browser: Unknown\n';
  
  if (browser.isIOS) {
    info += 'Platform: iOS\n';
    const version = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    if (version) {
      info += `iOS Version: ${version[1]}.${version[2]}\n`;
    }
  } else {
    info += `Platform: ${browser.platform}\n`;
  }
  
  info += `\n=== Push Notification Support ===\n`;
  info += `Service Worker: ${support.serviceWorker ? '✅ Supported' : '❌ Not Supported'}\n`;
  info += `Push Manager: ${support.pushManager ? '✅ Supported' : '❌ Not Supported'}\n`;
  info += `Notification API: ${support.notification ? '✅ Supported' : '❌ Not Supported'}\n`;
  info += `Secure Context: ${window.isSecureContext ? '✅ Yes' : '❌ No'}\n`;
  info += `Fully Supported: ${support.isFullySupported ? '✅ Yes' : '❌ No'}\n`;
  
  if (support.warnings.length > 0) {
    info += `\n⚠️  Warnings:\n`;
    support.warnings.forEach(warning => {
      info += `  - ${warning}\n`;
    });
  }
  
  if (support.errors.length > 0) {
    info += `\n❌ Errors:\n`;
    support.errors.forEach(error => {
      info += `  - ${error}\n`;
    });
  }
  
  return info;
}

/**
 * Log browser and push notification support information to console
 */
export function logBrowserInfo() {
  console.log('[Browser Detection]\n' + getBrowserInfoString());
}
