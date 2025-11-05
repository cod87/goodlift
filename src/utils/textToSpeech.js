/**
 * Text-to-Speech Utility
 * Manages speech synthesis for announcing stretch names and other content
 */

class TextToSpeechService {
  constructor() {
    this.isSupported = 'speechSynthesis' in window;
    this.isEnabled = this.loadTTSPreference();
    this.currentUtterance = null;
  }

  /**
   * Check if Text-to-Speech is supported
   * @returns {boolean} True if supported
   */
  isTTSSupported() {
    return this.isSupported;
  }

  /**
   * Load TTS enabled preference from localStorage
   * @returns {boolean} Enabled state (default true)
   */
  loadTTSPreference() {
    try {
      const stored = localStorage.getItem('ttsEnabled');
      // Default to true if not set
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  }

  /**
   * Save TTS preference to localStorage
   */
  saveTTSPreference() {
    try {
      localStorage.setItem('ttsEnabled', this.isEnabled.toString());
    } catch (e) {
      console.warn('Could not save TTS preference', e);
    }
  }

  /**
   * Toggle TTS enabled state
   * @returns {boolean} New enabled state
   */
  toggleTTS() {
    this.isEnabled = !this.isEnabled;
    this.saveTTSPreference();
    
    // Stop any current speech
    if (!this.isEnabled && this.isSupported) {
      window.speechSynthesis.cancel();
    }
    
    return this.isEnabled;
  }

  /**
   * Set TTS enabled state
   * @param {boolean} enabled - Whether to enable TTS
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    this.saveTTSPreference();
    
    // Stop any current speech if disabling
    if (!enabled && this.isSupported) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Get current TTS enabled state
   * @returns {boolean} Current enabled state
   */
  isEnabledState() {
    return this.isEnabled;
  }

  /**
   * Speak the given text
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   * @param {number} options.rate - Speech rate (0.1 to 10, default 1)
   * @param {number} options.pitch - Speech pitch (0 to 2, default 1)
   * @param {number} options.volume - Speech volume (0 to 1, default 1)
   * @param {string} options.lang - Language (default 'en-US')
   * @returns {Promise<void>}
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        console.warn('Speech Synthesis not supported in this browser');
        reject(new Error('Speech Synthesis not supported'));
        return;
      }

      if (!this.isEnabled) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set options with defaults
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      utterance.lang = options.lang || 'en-US';

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.currentUtterance = null;
        reject(event);
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Announce stretch/exercise name
   * @param {string} name - Name of the stretch/exercise
   */
  async announceExercise(name) {
    try {
      await this.speak(name, { rate: 0.9 });
    } catch (e) {
      console.warn('Could not announce exercise:', e);
    }
  }

  /**
   * Announce a simple message
   * @param {string} message - Message to announce
   */
  async announceMessage(message) {
    try {
      await this.speak(message, { rate: 1 });
    } catch (e) {
      console.warn('Could not announce message:', e);
    }
  }

  /**
   * Stop any currently playing speech
   */
  stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Pause current speech
   */
  pause() {
    if (this.isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (this.isSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   * @returns {boolean} True if speaking
   */
  isSpeaking() {
    return this.isSupported && window.speechSynthesis.speaking;
  }
}

// Create singleton instance
const ttsService = new TextToSpeechService();

export default ttsService;

// Export convenience functions
export const speakText = (text, options) => ttsService.speak(text, options);
export const announceExercise = (name) => ttsService.announceExercise(name);
export const announceMessage = (message) => ttsService.announceMessage(message);
export const stopSpeech = () => ttsService.stop();
export const pauseSpeech = () => ttsService.pause();
export const resumeSpeech = () => ttsService.resume();
export const toggleTTS = () => ttsService.toggleTTS();
export const setTTSEnabled = (enabled) => ttsService.setEnabled(enabled);
export const isTTSEnabled = () => ttsService.isEnabledState();
export const isTTSSupported = () => ttsService.isTTSSupported();
export const isSpeaking = () => ttsService.isSpeaking();
