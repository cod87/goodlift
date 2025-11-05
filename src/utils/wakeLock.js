/**
 * Wake Lock API Utility
 * Manages screen wake lock to prevent phone screen from sleeping during active sessions
 */

class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.isSupported = 'wakeLock' in navigator;
  }

  /**
   * Check if Wake Lock API is supported
   * @returns {boolean} True if supported
   */
  isWakeLockSupported() {
    return this.isSupported;
  }

  /**
   * Request a wake lock
   * @returns {Promise<boolean>} True if successful
   */
  async requestWakeLock() {
    if (!this.isSupported) {
      console.warn('Wake Lock API is not supported in this browser');
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock acquired');

      // Handle wake lock release (e.g., when tab becomes hidden)
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
      });

      return true;
    } catch (err) {
      console.error(`Failed to acquire wake lock: ${err.name}, ${err.message}`);
      return false;
    }
  }

  /**
   * Release the current wake lock
   * @returns {Promise<void>}
   */
  async releaseWakeLock() {
    if (this.wakeLock !== null) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('Wake Lock manually released');
      } catch (err) {
        console.error(`Failed to release wake lock: ${err.message}`);
      }
    }
  }

  /**
   * Check if wake lock is currently active
   * @returns {boolean} True if active
   */
  isActive() {
    return this.wakeLock !== null && !this.wakeLock.released;
  }

  /**
   * Re-acquire wake lock when page becomes visible again
   * Useful for handling page visibility changes
   */
  async reacquireOnVisibilityChange() {
    if (!this.isSupported) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && this.wakeLock !== null && this.wakeLock.released) {
        await this.requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Return cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }
}

// Create singleton instance
const wakeLockManager = new WakeLockManager();

export default wakeLockManager;

// Export helper functions for convenience
export const requestWakeLock = () => wakeLockManager.requestWakeLock();
export const releaseWakeLock = () => wakeLockManager.releaseWakeLock();
export const isWakeLockActive = () => wakeLockManager.isActive();
export const isWakeLockSupported = () => wakeLockManager.isWakeLockSupported();
