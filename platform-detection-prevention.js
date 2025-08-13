/**
 * Platform Detection Prevention Module
 * 
 * This module prevents websites from detecting your operating system, browser version,
 * and other platform-specific information that can be used for fingerprinting and
 * targeted attacks.
 */

export class PlatformDetectionPrevention {
  constructor() {
    this.enabled = false;
    
    // Spoofed platform information
    this.spoofedPlatform = 'Win32';
    this.spoofedUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.spoofedLanguage = 'en-US';
    this.spoofedLanguages = ['en-US', 'en'];
    this.spoofedTimezone = 'America/New_York';
    this.spoofedTimezoneOffset = -300; // -5 hours in minutes
    
    // Store original platform APIs
    this.originalAPIs = {};
    
    // Available platforms to spoof
    this.availablePlatforms = [
      'Win32', 'MacIntel', 'Linux x86_64', 'Linux armv7l', 'Linux aarch64'
    ];
    
    // Available user agents to spoof
    this.availableUserAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0'
    ];
    
    // Don't auto-init - let the main browser call init() when ready
  }

  /**
   * Initialize platform detection prevention
   */
  init() {
    console.log('🔒 Platform Detection Prevention: Initializing...');
    
    // Store original platform APIs
    this.storeOriginalAPIs();
    
    if (this.enabled) {
      this.applyPlatformSpoofing();
      console.log('🔒 Platform Detection Prevention: Active and protecting platform information');
    } else {
      console.log('🔓 Platform Detection Prevention: Disabled - platform information visible');
    }
  }

  /**
   * Store original platform APIs for restoration
   */
  storeOriginalAPIs() {
    // Store navigator.platform
    if (navigator.platform && !this.originalAPIs.platform) {
      this.originalAPIs.platform = navigator.platform;
      console.log('🔒 Platform Detection Prevention: Stored original navigator.platform');
    }
    
    // Store navigator.userAgent
    if (navigator.userAgent && !this.originalAPIs.userAgent) {
      this.originalAPIs.userAgent = navigator.userAgent;
      console.log('🔒 Platform Detection Prevention: Stored original navigator.userAgent');
    }
    
    // Store navigator.language
    if (navigator.language && !this.originalAPIs.language) {
      this.originalAPIs.language = navigator.language;
    }
    
    // Store navigator.languages
    if (navigator.languages && !this.originalAPIs.languages) {
      this.originalAPIs.languages = [...navigator.languages];
    }
    
    // Store Intl.DateTimeFormat().resolvedOptions().timeZone
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone && !this.originalAPIs.timezone) {
        this.originalAPIs.timezone = timezone;
      }
    } catch (e) {
      // Timezone detection might not be available
    }
    
    console.log('🔒 Platform Detection Prevention: API storage complete');
  }

  /**
   * Apply platform spoofing
   */
  applyPlatformSpoofing() {
    if (!this.enabled) return;
    
    try {
      // Override navigator.platform
      Object.defineProperty(navigator, 'platform', {
        value: this.spoofedPlatform,
        writable: false,
        configurable: false
      });
      
      // Override navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        value: this.spoofedUserAgent,
        writable: false,
        configurable: false
      });
      
      // Override navigator.language
      Object.defineProperty(navigator, 'language', {
        value: this.spoofedLanguage,
        writable: false,
        configurable: false
      });
      
      // Override navigator.languages
      Object.defineProperty(navigator, 'languages', {
        value: this.spoofedLanguages,
        writable: false,
        configurable: false
      });
      
      // Override timezone detection
      this.overrideTimezoneDetection();
      
      // Override other platform detection methods
      this.overrideAdditionalDetection();
      
      console.log('🔒 Platform Detection Prevention: Applied successfully');
    } catch (error) {
      console.warn('Failed to apply platform spoofing:', error);
    }
  }

  /**
   * Override timezone detection
   */
  overrideTimezoneDetection() {
    try {
      // Override Intl.DateTimeFormat().resolvedOptions().timeZone
      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
      
      Intl.DateTimeFormat.prototype.resolvedOptions = function() {
        const options = originalResolvedOptions.call(this);
        if (options.timeZone) {
          options.timeZone = this.spoofedTimezone;
        }
        return options;
      }.bind(this);
      
      // Override Date.prototype.getTimezoneOffset
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      
      Date.prototype.getTimezoneOffset = function() {
        return this.spoofedTimezoneOffset;
      }.bind(this);
      
    } catch (error) {
      console.warn('Failed to override timezone detection:', error);
    }
  }

  /**
   * Override additional platform detection methods
   */
  overrideAdditionalDetection() {
    try {
      // Override screen properties that can reveal platform
      if (screen) {
        // Spoof screen color depth to common values
        Object.defineProperty(screen, 'colorDepth', {
          value: 24,
          writable: false,
          configurable: false
        });
        
        Object.defineProperty(screen, 'pixelDepth', {
          value: 24,
          writable: false,
          configurable: false
        });
      }
      
      // Override hardware concurrency to common values
      if (navigator.hardwareConcurrency) {
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          value: 8,
          writable: false,
          configurable: false
        });
      }
      
      // Override device memory to common values
      if (navigator.deviceMemory) {
        Object.defineProperty(navigator, 'deviceMemory', {
          value: 8,
          writable: false,
          configurable: false
        });
      }
      
    } catch (error) {
      console.warn('Failed to override additional detection methods:', error);
    }
  }

  /**
   * Restore original platform information
   */
  restorePlatformInfo() {
    try {
      // Restore navigator.platform
      if (this.originalAPIs.platform) {
        Object.defineProperty(navigator, 'platform', {
          value: this.originalAPIs.platform,
          writable: true,
          configurable: true
        });
      }
      
      // Restore navigator.userAgent
      if (this.originalAPIs.userAgent) {
        Object.defineProperty(navigator, 'userAgent', {
          value: this.originalAPIs.userAgent,
          writable: true,
          configurable: true
        });
      }
      
      // Restore navigator.language
      if (this.originalAPIs.language) {
        Object.defineProperty(navigator, 'language', {
          value: this.originalAPIs.language,
          writable: true,
          configurable: true
        });
      }
      
      // Restore navigator.languages
      if (this.originalAPIs.languages) {
        Object.defineProperty(navigator, 'languages', {
          value: this.originalAPIs.languages,
          writable: true,
          configurable: true
        });
      }
      
      console.log('🔓 Platform Detection Prevention: Restored original platform info');
    } catch (error) {
      console.warn('Failed to restore platform info:', error);
    }
  }

  /**
   * Configure platform spoofing settings
   */
  configure(settings) {
    if (settings.platform !== undefined) {
      this.spoofedPlatform = settings.platform;
    }
    if (settings.userAgent !== undefined) {
      this.spoofedUserAgent = settings.userAgent;
    }
    if (settings.language !== undefined) {
      this.spoofedLanguage = settings.language;
    }
    if (settings.languages !== undefined) {
      this.spoofedLanguages = settings.languages;
    }
    if (settings.timezone !== undefined) {
      this.spoofedTimezone = settings.timezone;
    }
    if (settings.timezoneOffset !== undefined) {
      this.spoofedTimezoneOffset = settings.timezoneOffset;
    }
    
    // Reapply if enabled
    if (this.enabled) {
      this.applyPlatformSpoofing();
    }
    
    // Save settings
    this.saveSettings();
  }

  /**
   * Enable/disable platform detection prevention
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (enabled) {
      this.applyPlatformSpoofing();
      console.log('🔒 Platform Detection Prevention: Enabled');
    } else {
      this.restorePlatformInfo();
      console.log('🔓 Platform Detection Prevention: Disabled');
    }
    
    // Save settings
    this.saveSettings();
  }

  /**
   * Get current spoofing status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      platform: this.spoofedPlatform,
      userAgent: this.spoofedUserAgent,
      language: this.spoofedLanguage,
      languages: this.spoofedLanguages,
      timezone: this.spoofedTimezone,
      timezoneOffset: this.spoofedTimezoneOffset
    };
  }

  /**
   * Get available spoofing options
   */
  getAvailableOptions() {
    return {
      platforms: this.availablePlatforms,
      userAgents: this.availableUserAgents
    };
  }

  /**
   * Test if platform detection is working
   */
  testDetection() {
    try {
      const detectedPlatform = navigator.platform;
      const detectedUserAgent = navigator.userAgent;
      const detectedLanguage = navigator.language;
      
      const isSpoofed = 
        detectedPlatform === this.spoofedPlatform &&
        detectedUserAgent === this.spoofedUserAgent &&
        detectedLanguage === this.spoofedLanguage;
      
      return {
        spoofed: isSpoofed,
        detected: {
          platform: detectedPlatform,
          userAgent: detectedUserAgent,
          language: detectedLanguage
        },
        expected: {
          platform: this.spoofedPlatform,
          userAgent: this.spoofedUserAgent,
          language: this.spoofedLanguage
        }
      };
    } catch (error) {
      return {
        spoofed: false,
        error: error.message
      };
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      const settings = {
        enabled: this.enabled,
        platform: this.spoofedPlatform,
        userAgent: this.spoofedUserAgent,
        language: this.spoofedLanguage,
        languages: this.spoofedLanguages,
        timezone: this.spoofedTimezone,
        timezoneOffset: this.spoofedTimezoneOffset
      };
      
              localStorage.setItem('cb_platform_prevention', JSON.stringify(settings));
      console.log('🔒 Platform Detection Prevention: Settings saved');
    } catch (error) {
      console.warn('Failed to save platform prevention settings:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
              const saved = localStorage.getItem('cb_platform_prevention');
      if (saved) {
        const settings = JSON.parse(saved);
        this.enabled = settings.enabled || false;
        this.spoofedPlatform = settings.platform || 'Win32';
        this.spoofedUserAgent = settings.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.spoofedLanguage = settings.language || 'en-US';
        this.spoofedLanguages = settings.languages || ['en-US', 'en'];
        this.spoofedTimezone = settings.timezone || 'America/New_York';
        this.spoofedTimezoneOffset = settings.timezoneOffset || -300;
        console.log('🔒 Platform Detection Prevention: Settings loaded');
      }
    } catch (error) {
      console.warn('Failed to load platform prevention settings:', error);
    }
  }
}

// Export singleton instance
export const platformDetectionPrevention = new PlatformDetectionPrevention();

// Don't auto-initialize - let the main browser handle initialization
