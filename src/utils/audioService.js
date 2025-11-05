/**
 * Audio Service Utility
 * Manages sound effects across the app using Web Audio API
 */

class AudioService {
  constructor() {
    this.audioContext = null;
    this.isMuted = this.loadMutePreference();
    this.sounds = {};
    this.initAudioContext();
  }

  /**
   * Initialize Audio Context (lazily)
   */
  initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported', e);
      }
    }
  }

  /**
   * Load mute preference from localStorage
   * @returns {boolean} Muted state
   */
  loadMutePreference() {
    try {
      const stored = localStorage.getItem('audioMuted');
      return stored === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Save mute preference to localStorage
   */
  saveMutePreference() {
    try {
      localStorage.setItem('audioMuted', this.isMuted.toString());
    } catch (e) {
      console.warn('Could not save mute preference', e);
    }
  }

  /**
   * Toggle mute state
   * @returns {boolean} New mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.saveMutePreference();
    return this.isMuted;
  }

  /**
   * Set mute state
   * @param {boolean} muted - Whether to mute
   */
  setMuted(muted) {
    this.isMuted = muted;
    this.saveMutePreference();
  }

  /**
   * Get current mute state
   * @returns {boolean} Current mute state
   */
  isMutedState() {
    return this.isMuted;
  }

  /**
   * Generate a beep sound using Web Audio API
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in milliseconds
   * @param {number} volume - Volume (0 to 1)
   */
  playBeep(frequency = 800, duration = 200, volume = 0.3) {
    if (this.isMuted) return;
    if (!this.audioContext) {
      this.initAudioContext();
      if (!this.audioContext) return;
    }

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration / 1000
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (e) {
      console.warn('Could not play beep', e);
    }
  }

  /**
   * Play a high-pitched beep (for work period start)
   */
  playHighBeep() {
    this.playBeep(1000, 300, 0.4);
  }

  /**
   * Play a low-pitched beep (for rest period start)
   */
  playLowBeep() {
    this.playBeep(400, 300, 0.4);
  }

  /**
   * Play a chime/bell sound (for completion)
   * Creates a pleasant two-tone chime
   */
  playChime() {
    if (this.isMuted) return;
    if (!this.audioContext) {
      this.initAudioContext();
      if (!this.audioContext) return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // First tone
      this.playBeep(800, 200, 0.3);
      
      // Second tone (slightly delayed)
      setTimeout(() => {
        this.playBeep(1000, 400, 0.25);
      }, 150);
    } catch (e) {
      console.warn('Could not play chime', e);
    }
  }

  /**
   * Play a triple beep pattern (for countdown)
   */
  playCountdownBeep() {
    if (this.isMuted) return;
    
    this.playBeep(600, 150, 0.3);
    setTimeout(() => this.playBeep(600, 150, 0.3), 200);
    setTimeout(() => this.playBeep(600, 150, 0.3), 400);
  }

  /**
   * Play completion fanfare (more elaborate success sound)
   */
  playCompletionFanfare() {
    if (this.isMuted) return;
    if (!this.audioContext) {
      this.initAudioContext();
      if (!this.audioContext) return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Ascending tones for completion
      const notes = [523, 659, 784, 1047]; // C, E, G, C (major chord)
      notes.forEach((freq, index) => {
        setTimeout(() => {
          this.playBeep(freq, 300, 0.25);
        }, index * 150);
      });
    } catch (e) {
      console.warn('Could not play completion fanfare', e);
    }
  }

  /**
   * Play a transition beep (for moving between stretches/exercises)
   */
  playTransitionBeep() {
    if (this.isMuted) return;
    this.playBeep(700, 200, 0.3);
  }
}

// Create singleton instance
const audioService = new AudioService();

export default audioService;

// Export convenience functions
export const playHighBeep = () => audioService.playHighBeep();
export const playLowBeep = () => audioService.playLowBeep();
export const playChime = () => audioService.playChime();
export const playCompletionFanfare = () => audioService.playCompletionFanfare();
export const playTransitionBeep = () => audioService.playTransitionBeep();
export const playCountdownBeep = () => audioService.playCountdownBeep();
export const toggleAudioMute = () => audioService.toggleMute();
export const setAudioMuted = (muted) => audioService.setMuted(muted);
export const isAudioMuted = () => audioService.isMutedState();
