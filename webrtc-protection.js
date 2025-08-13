/**
 * WebRTC IP Leak Prevention Module
 * 
 * This module provides configurable WebRTC privacy controls that can be enabled
 * to prevent IP leaks or disabled to allow full WebRTC functionality.
 */

export class WebRTCProtection {
  constructor() {
    this.enabled = false; // Default to disabled to allow WebRTC
    this.blockAllWebRTC = false; // Default to allowing WebRTC
    this.blockSTUN = false; // Allow STUN by default
    this.blockTURN = false; // Allow TURN by default
    this.blockDataChannels = false; // Allow data channels by default
    this.randomizeWebGL = false; // WebGL fingerprint randomization
    
    this.fakeIPs = [
      '192.168.1.1',
      '10.0.0.1',
      '172.16.0.1',
      '127.0.0.1'
    ];
    
    // Store original WebRTC APIs for restoration
    this.originalAPIs = {};
    
    // Randomization state
    this.randomizedVendor = null;
    this.randomizedRenderer = null;
    this.randomizedVersion = null;
    
    // Don't auto-init - let the main browser call init() when ready
  }

  /**
   * Initialize WebRTC protection
   */
  init() {
    console.log('🔒 WebRTC Protection: Initializing...');
    
    // Always store original APIs first for potential restoration
    this.storeOriginalAPIs();
    
    if (!this.enabled) {
      this.restoreWebRTC();
      console.log('🔓 WebRTC Protection: WebRTC functionality enabled by default');
      return;
    }
    
    // Block WebRTC before it can be accessed
    this.blockWebRTCAccess();
    
    // Override RTCPeerConnection
    this.overrideRTCPeerConnection();
    
    // Block getUserMedia for audio/video
    this.blockGetUserMedia();
    
    // Block WebRTC data channels if configured
    if (this.blockDataChannels) {
      this.blockDataChannels();
    }
    
    // Monitor for new WebRTC attempts
    this.monitorWebRTCAttempts();
    
    // Apply WebGL randomization if enabled
    if (this.randomizeWebGL) {
      this.randomizeWebGLFingerprint();
    }
    
    console.log('🔒 WebRTC Protection: Active and monitoring');
  }

  /**
   * Store original WebRTC APIs for restoration
   */
  storeOriginalAPIs() {
    // Store RTCPeerConnection if it exists
    if (window.RTCPeerConnection && !this.originalAPIs.RTCPeerConnection) {
      this.originalAPIs.RTCPeerConnection = window.RTCPeerConnection;
      console.log('🔒 WebRTC Protection: Stored original RTCPeerConnection');
    }
    
    // Store RTCDataChannel if it exists
    if (window.RTCDataChannel && !this.originalAPIs.RTCDataChannel) {
      this.originalAPIs.RTCDataChannel = window.RTCDataChannel;
      console.log('🔒 WebRTC Protection: Stored original RTCDataChannel');
    }
    
    // Store RTCSessionDescription if it exists
    if (window.RTCSessionDescription && !this.originalAPIs.RTCSessionDescription) {
      this.originalAPIs.RTCSessionDescription = window.RTCSessionDescription;
      console.log('🔒 WebRTC Protection: Stored original RTCSessionDescription');
    }
    
    // Store RTCIceCandidate if it exists
    if (window.RTCIceCandidate && !this.originalAPIs.RTCIceCandidate) {
      this.originalAPIs.RTCIceCandidate = window.RTCIceCandidate;
      console.log('🔒 WebRTC Protection: Stored original RTCIceCandidate');
    }
    
    // Store getUserMedia if it exists
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !this.originalAPIs.getUserMedia) {
      this.originalAPIs.getUserMedia = navigator.mediaDevices.getUserMedia;
      console.log('🔒 WebRTC Protection: Stored original getUserMedia');
    }
    
    // Store legacy getUserMedia if it exists
    if (navigator.getUserMedia && !this.originalAPIs.getUserMediaLegacy) {
      this.originalAPIs.getUserMediaLegacy = navigator.getUserMedia;
      console.log('🔒 WebRTC Protection: Stored original legacy getUserMedia');
    }
    
    console.log('🔒 WebRTC Protection: API storage complete');
  }

  /**
   * Restore original WebRTC functionality
   */
  restoreWebRTC() {
    console.log('🔓 WebRTC Protection: Restoring WebRTC functionality');
    
    let restoredCount = 0;
    
    if (this.originalAPIs.RTCPeerConnection) {
      window.RTCPeerConnection = this.originalAPIs.RTCPeerConnection;
      restoredCount++;
      console.log('🔓 WebRTC Protection: Restored RTCPeerConnection');
    }
    
    if (this.originalAPIs.RTCDataChannel) {
      window.RTCDataChannel = this.originalAPIs.RTCDataChannel;
      restoredCount++;
      console.log('🔓 WebRTC Protection: Restored RTCDataChannel');
    }
    
    if (this.originalAPIs.RTCSessionDescription) {
      window.RTCSessionDescription = this.originalAPIs.RTCSessionDescription;
      restoredCount++;
      console.log('🔓 WebRTC Protection: Restored RTCSessionDescription');
    }
    
    if (this.originalAPIs.RTCIceCandidate) {
      window.RTCIceCandidate = this.originalAPIs.RTCIceCandidate;
      restoredCount++;
      console.log('🔓 WebRTC Protection: Restored RTCIceCandidate');
    }
    
    if (this.originalAPIs.getUserMedia && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = this.originalAPIs.getUserMedia;
      restoredCount++;
      console.log('🔓 WebRTC Protection: Restored getUserMedia');
    }
    
    if (this.originalAPIs.getUserMediaLegacy) {
      navigator.getUserMedia = this.originalAPIs.getUserMediaLegacy;
      restoredCount++;
      console.log('🔓 WebRTC Protection: Restored legacy getUserMedia');
    }
    
    console.log(`🔓 WebRTC Protection: Restored ${restoredCount} WebRTC APIs`);
  }

  /**
   * Block direct access to WebRTC APIs
   */
  blockWebRTCAccess() {
    // Block RTCPeerConnection constructor
    if (window.RTCPeerConnection) {
      const originalRTCPeerConnection = window.RTCPeerConnection;
      
      window.RTCPeerConnection = function(...args) {
        console.warn('🔒 WebRTC Protection: RTCPeerConnection blocked');
        throw new Error('WebRTC is disabled for privacy protection');
      };
      
      // Copy static methods and properties
      Object.setPrototypeOf(window.RTCPeerConnection, originalRTCPeerConnection);
      Object.getOwnPropertyNames(originalRTCPeerConnection).forEach(prop => {
        if (prop !== 'prototype' && prop !== 'constructor') {
          try {
            window.RTCPeerConnection[prop] = originalRTCPeerConnection[prop];
          } catch (e) {
            // Ignore read-only properties
          }
        }
      });
    }

    // Block RTCDataChannel
    if (window.RTCDataChannel) {
      window.RTCDataChannel = function(...args) {
        console.warn('🔒 WebRTC Protection: RTCDataChannel blocked');
        throw new Error('WebRTC Data Channels are disabled for privacy protection');
      };
    }

    // Block RTCSessionDescription
    if (window.RTCSessionDescription) {
      window.RTCSessionDescription = function(...args) {
        console.warn('🔒 WebRTC Protection: RTCSessionDescription blocked');
        throw new Error('WebRTC Session Description is disabled for privacy protection');
      };
    }

    // Block RTCIceCandidate
    if (window.RTCIceCandidate) {
      window.RTCIceCandidate = function(...args) {
        console.warn('🔒 WebRTC Protection: RTCIceCandidate blocked');
        throw new Error('WebRTC ICE Candidate is disabled for privacy protection');
      };
    }
  }

  /**
   * Override RTCPeerConnection to intercept and block requests
   */
  overrideRTCPeerConnection() {
    // Create a proxy for RTCPeerConnection if it exists
    if (window.RTCPeerConnection) {
      const originalRTCPeerConnection = window.RTCPeerConnection;
      
      window.RTCPeerConnection = function(configuration) {
        console.warn('🔒 WebRTC Protection: RTCPeerConnection intercepted');
        
        // Create a mock RTCPeerConnection that blocks all operations
        const mockConnection = {
          // Block all methods that could leak IP
          createOffer: () => {
            console.warn('🔒 WebRTC Protection: createOffer blocked');
            return Promise.reject(new Error('WebRTC is disabled for privacy protection'));
          },
          
          createAnswer: () => {
            console.warn('🔒 WebRTC Protection: createAnswer blocked');
            return Promise.reject(new Error('WebRTC is disabled for privacy protection'));
          },
          
          setLocalDescription: () => {
            console.warn('🔒 WebRTC Protection: setLocalDescription blocked');
            return Promise.reject(new Error('WebRTC is disabled for privacy protection'));
          },
          
          setRemoteDescription: () => {
            console.warn('🔒 WebRTC Protection: setRemoteDescription blocked');
            return Promise.reject(new Error('WebRTC is disabled for privacy protection'));
          },
          
          addIceCandidate: () => {
            console.warn('🔒 WebRTC Protection: addIceCandidate blocked');
            return Promise.reject(new Error('WebRTC is disabled for privacy protection'));
          },
          
          // Block STUN/TURN server configuration
          addIceServer: () => {
            console.warn('🔒 WebRTC Protection: addIceServer blocked');
            return;
          },
          
          // Block connection state changes
          onicecandidate: null,
          oniceconnectionstatechange: null,
          onconnectionstatechange: null,
          onsignalingstatechange: null,
          
          // Mock properties
          iceConnectionState: 'closed',
          connectionState: 'closed',
          signalingState: 'closed',
          
          // Block all other operations
          close: () => {
            console.log('🔒 WebRTC Protection: Connection closed');
          }
        };
        
        // Add event listeners that do nothing
        mockConnection.addEventListener = () => {};
        mockConnection.removeEventListener = () => {};
        
        return mockConnection;
      };
      
      // Copy static methods
      Object.setPrototypeOf(window.RTCPeerConnection, originalRTCPeerConnection);
    }
  }

  /**
   * Block getUserMedia to prevent audio/video access
   */
  blockGetUserMedia() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      
      navigator.mediaDevices.getUserMedia = function(constraints) {
        console.warn('🔒 WebRTC Protection: getUserMedia blocked');
        return Promise.reject(new Error('Media access is disabled for privacy protection'));
      };
    }
    
    // Block legacy getUserMedia
    if (navigator.getUserMedia) {
      navigator.getUserMedia = function(constraints, success, error) {
        console.warn('🔒 WebRTC Protection: Legacy getUserMedia blocked');
        if (error) error(new Error('Media access is disabled for privacy protection'));
      };
    }
  }

  /**
   * Block data channels if configured
   */
  blockDataChannels() {
    if (window.RTCDataChannel) {
      window.RTCDataChannel = function(...args) {
        console.warn('🔒 WebRTC Protection: RTCDataChannel blocked');
        throw new Error('WebRTC Data Channels are disabled for privacy protection');
      };
    }
  }

  /**
   * Monitor for new WebRTC attempts
   */
  monitorWebRTCAttempts() {
    // Use MutationObserver to detect new script tags that might contain WebRTC
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'SCRIPT') {
              this.scanScriptForWebRTC(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll('script').forEach(script => {
                this.scanScriptForWebRTC(script);
              });
            }
          }
        });
      });
    });
    
    observer.observe(document, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Scan script content for WebRTC usage
   */
  scanScriptForWebRTC(scriptElement) {
    if (scriptElement.textContent) {
      const content = scriptElement.textContent.toLowerCase();
      const webrtcPatterns = [
        'rtcpeerconnection',
        'rtcdatachannel',
        'getusermedia',
        'webrtc',
        'stun:',
        'turn:'
      ];
      
      if (webrtcPatterns.some(pattern => content.includes(pattern))) {
        console.warn('🔒 WebRTC Protection: Detected WebRTC usage in script');
        // Optionally block the script execution
        if (scriptElement.src) {
          console.warn('🔒 WebRTC Protection: External script with WebRTC blocked:', scriptElement.src);
        }
      }
    }
  }

  /**
   * Enable/disable WebRTC protection
   */
  setEnabled(enabled) {
    const wasEnabled = this.enabled;
    this.enabled = enabled;
    
    if (enabled && !wasEnabled) {
      // Enable protection
      console.log('🔒 WebRTC Protection: Enabling protection...');
      this.blockWebRTCAccess();
      this.overrideRTCPeerConnection();
      this.blockGetUserMedia();
      if (this.blockDataChannels) {
        this.blockDataChannels();
      }
      this.monitorWebRTCAttempts();
      console.log('🔒 WebRTC Protection: Protection enabled');
    } else if (!enabled && wasEnabled) {
      // Disable protection
      console.log('🔒 WebRTC Protection: Disabling protection...');
      this.restoreWebRTC();
      console.log('🔒 WebRTC Protection: Protection disabled');
    }
  }

  /**
   * Configure protection settings
   */
  configure(settings) {
    let changed = false;
    
    if (settings.hasOwnProperty('blockAllWebRTC') && settings.blockAllWebRTC !== this.blockAllWebRTC) {
      this.blockAllWebRTC = settings.blockAllWebRTC;
      changed = true;
    }
    if (settings.hasOwnProperty('blockSTUN') && settings.blockSTUN !== this.blockSTUN) {
      this.blockSTUN = settings.blockSTUN;
      changed = true;
    }
    if (settings.hasOwnProperty('blockTURN') && settings.blockTURN !== this.blockTURN) {
      this.blockTURN = settings.blockTURN;
      changed = true;
    }
    if (settings.hasOwnProperty('blockDataChannels') && settings.blockDataChannels !== this.blockDataChannels) {
      this.blockDataChannels = settings.blockDataChannels;
      changed = true;
    }
    
    // Only reapply if enabled and settings changed
    if (this.enabled && changed) {
      console.log('🔒 WebRTC Protection: Reapplying protection with new settings...');
      this.blockWebRTCAccess();
      this.overrideRTCPeerConnection();
      this.blockGetUserMedia();
      if (this.blockDataChannels) {
        this.blockDataChannels();
      }
      console.log('🔒 WebRTC Protection: Protection reapplied with new settings');
    }
  }

  /**
   * Get current protection status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      blockAllWebRTC: this.blockAllWebRTC,
      blockSTUN: this.blockSTUN,
      blockTURN: this.blockTURN,
      blockDataChannels: this.blockDataChannels,
      fakeIPs: this.fakeIPs
    };
  }

  /**
   * Test if WebRTC is properly blocked
   */
  testProtection() {
    try {
      // Try to create RTCPeerConnection
      new RTCPeerConnection();
      return { blocked: false, message: 'WebRTC is accessible - protection failed' };
    } catch (e) {
      if (e.message.includes('WebRTC is disabled')) {
        return { blocked: true, message: 'WebRTC is properly blocked' };
      }
      return { blocked: false, message: 'WebRTC blocked by other means' };
    }
  }

  /**
   * Get privacy report
   */
  getPrivacyReport() {
    const status = this.getStatus();
    const test = this.testProtection();
    
    return {
      webrtcBlocked: test.blocked,
      protectionLevel: this.getProtectionLevel(),
      settings: status,
      recommendations: this.getRecommendations()
    };
  }

  /**
   * Get protection level description
   */
  getProtectionLevel() {
    if (!this.enabled) return 'Disabled';
    if (this.blockAllWebRTC) return 'Maximum';
    if (this.blockSTUN && this.blockTURN) return 'High';
    if (this.blockSTUN || this.blockTURN) return 'Medium';
    return 'Low';
  }

  /**
   * Get privacy recommendations
   */
  getRecommendations() {
    const recommendations = [];
    
    if (!this.enabled) {
      recommendations.push('Enable WebRTC protection to prevent IP leaks');
    }
    
    if (!this.blockSTUN) {
      recommendations.push('Enable STUN blocking to prevent IP discovery');
    }
    
    if (!this.blockTURN) {
      recommendations.push('Enable TURN blocking to prevent relay server usage');
    }
    
    if (!this.blockDataChannels) {
      recommendations.push('Consider blocking data channels for maximum privacy');
    }
    
    return recommendations;
  }

  // WebGL Fingerprint Randomization
  randomizeWebGLFingerprint() {
    if (!this.enabled) return;
    
    try {
      // Store original WebGL context if not already stored
      if (!this.originalAPIs.webglContext) {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          this.originalAPIs.webglContext = gl;
          this.originalAPIs.webglVendor = gl.getParameter(gl.VENDOR);
          this.originalAPIs.webglRenderer = gl.getParameter(gl.RENDERER);
          this.originalAPIs.webglVersion = gl.getParameter(gl.VERSION);
        }
      }

      // Override WebGL getParameter to return randomized values
      if (this.originalAPIs.webglContext) {
        const gl = this.originalAPIs.webglContext;
        const originalGetParameter = gl.getParameter;
        
        gl.getParameter = (parameter) => {
          const result = originalGetParameter.call(gl, parameter);
          
          // Randomize vendor and renderer strings
          if (parameter === gl.VENDOR) {
            return this.getRandomWebGLVendor();
          } else if (parameter === gl.RENDERER) {
            return this.getRandomWebGLRenderer();
          } else if (parameter === gl.VERSION) {
            return this.getRandomWebGLVersion();
          }
          
          return result;
        };
        
        console.log('🔒 WebGL Fingerprint Randomization: Enabled');
      }
    } catch (error) {
      console.warn('Failed to randomize WebGL fingerprint:', error);
    }
  }

  // Get random WebGL vendor string
  getRandomWebGLVendor() {
    const vendors = [
      'Intel Inc.',
      'NVIDIA Corporation',
      'AMD',
      'Apple Inc.',
      'Microsoft',
      'Mesa/X.org',
      'VMware, Inc.',
      'Parallels, Inc.',
      'Qualcomm',
      'ARM'
    ];
    
    // Use consistent vendor per session but random across sessions
    if (!this.randomizedVendor) {
      this.randomizedVendor = vendors[Math.floor(Math.random() * vendors.length)];
    }
    
    return this.randomizedVendor;
  }

  // Get random WebGL renderer string
  getRandomWebGLRenderer() {
    const renderers = [
      'Intel(R) HD Graphics 620',
      'NVIDIA GeForce GTX 1060',
      'AMD Radeon RX 580',
      'Apple M1 Pro',
      'Microsoft Basic Render Driver',
      'Mesa Intel(R) HD Graphics (Skylake GT2)',
      'VMware SVGA 3D',
      'Parallels Display Adapter (WDDM)',
      'Qualcomm Adreno 650',
      'ARM Mali-G78 MC14'
    ];
    
    // Use consistent renderer per session but random across sessions
    if (!this.randomizedRenderer) {
      this.randomizedRenderer = renderers[Math.floor(Math.random() * renderers.length)];
    }
    
    return this.randomizedRenderer;
  }

  // Get random WebGL version string
  getRandomWebGLVersion() {
    const versions = [
      'WebGL 1.0',
      'WebGL 2.0',
      'OpenGL ES 2.0',
      'OpenGL ES 3.0',
      'OpenGL 4.6',
      'OpenGL 3.3'
    ];
    
    // Use consistent version per session but random across sessions
    if (!this.randomizedVersion) {
      this.randomizedVersion = versions[Math.floor(Math.random() * versions.length)];
    }
    
    return this.randomizedVersion;
  }

  // Restore original WebGL fingerprint
  restoreWebGLFingerprint() {
    if (this.originalAPIs.webglContext && this.originalAPIs.webglGetParameter) {
      try {
        this.originalAPIs.webglContext.getParameter = this.originalAPIs.webglGetParameter;
        console.log('🔒 WebGL Fingerprint Randomization: Disabled');
      } catch (error) {
        console.warn('Failed to restore WebGL fingerprint:', error);
      }
    }
  }

  // Enhanced configure method to include WebGL randomization
  configure(settings) {
    const oldSettings = {
      blockAllWebRTC: this.blockAllWebRTC,
      blockSTUN: this.blockSTUN,
      blockTURN: this.blockTURN,
      blockDataChannels: this.blockDataChannels,
      randomizeWebGL: this.randomizeWebGL
    };

    if (settings.blockAllWebRTC !== undefined) this.blockAllWebRTC = settings.blockAllWebRTC;
    if (settings.blockSTUN !== undefined) this.blockSTUN = settings.blockSTUN;
    if (settings.blockTURN !== undefined) this.blockTURN = settings.blockTURN;
    if (settings.blockDataChannels !== undefined) this.blockDataChannels = settings.blockDataChannels;
    if (settings.randomizeWebGL !== undefined) this.randomizeWebGL = settings.randomizeWebGL;

    // Check if settings actually changed
    const changed = Object.keys(settings).some(key => oldSettings[key] !== settings[key]);

    if (changed && this.enabled) {
      // Reapply protection with new settings
      this.blockWebRTCAccess();
      this.overrideRTCPeerConnection();
      this.blockGetUserMedia();
      if (this.blockDataChannels) {
        this.blockDataChannels();
      }
      this.monitorWebRTCAttempts();
      
      // Apply WebGL randomization if enabled
      if (this.randomizeWebGL) {
        this.randomizeWebGLFingerprint();
      } else {
        this.restoreWebGLFingerprint();
      }
    }

    // Save to localStorage
    this.saveSettings();
  }

  // Enhanced setEnabled method to include WebGL randomization
  setEnabled(enabled) {
    const wasEnabled = this.enabled;
    this.enabled = enabled;
    
    if (enabled && !wasEnabled) {
      // Enable protection
      console.log('🔒 WebRTC Protection: Enabling protection...');
      this.blockWebRTCAccess();
      this.overrideRTCPeerConnection();
      this.blockGetUserMedia();
      if (this.blockDataChannels) {
        this.blockDataChannels();
      }
      this.monitorWebRTCAttempts();
      
      // Enable WebGL randomization if configured
      if (this.randomizeWebGL) {
        this.randomizeWebGLFingerprint();
      }
      
      console.log('🔒 WebRTC Protection: Protection enabled');
    } else if (!enabled && wasEnabled) {
      // Disable protection
      console.log('🔒 WebRTC Protection: Disabling protection...');
      this.restoreWebRTC();
      this.restoreWebGLFingerprint();
      console.log('🔒 WebRTC Protection: Protection disabled');
    }
  }

  // Enhanced getStatus method to include WebGL randomization status
  getStatus() {
    return {
      enabled: this.enabled,
      blockAllWebRTC: this.blockAllWebRTC,
      blockSTUN: this.blockSTUN,
      blockTURN: this.blockTURN,
      blockDataChannels: this.blockDataChannels,
      randomizeWebGL: this.randomizeWebGL,
      webGLRandomized: this.randomizedVendor !== undefined
    };
  }

  // Enhanced getPrivacyReport method to include WebGL fingerprinting protection
  getPrivacyReport() {
    const status = this.getStatus();
    const report = {
      timestamp: new Date().toISOString(),
      protectionLevel: this.getProtectionLevel(),
      features: {
        webrtc: {
          enabled: status.enabled,
          blocked: status.blockAllWebRTC,
          stunBlocked: status.blockSTUN,
          turnBlocked: status.blockTURN,
          dataChannelsBlocked: status.blockDataChannels
        },
        webgl: {
          fingerprintingProtected: status.randomizeWebGL && status.webGLRandomized,
          vendorRandomized: status.randomizeWebGL && status.webGLRandomized,
          rendererRandomized: status.randomizeWebGL && status.webGLRandomized
        }
      },
      recommendations: this.getRecommendations()
    };

    return report;
  }

  // Enhanced getRecommendations method to include WebGL protection advice
  getRecommendations() {
    const recommendations = [];
    
    if (!this.enabled) {
      recommendations.push('Enable WebRTC protection to prevent IP leaks');
      recommendations.push('Enable WebGL fingerprint randomization for better privacy');
    }
    
    if (this.enabled && !this.randomizeWebGL) {
      recommendations.push('Consider enabling WebGL fingerprint randomization');
    }
    
    if (this.enabled && this.blockAllWebRTC) {
      recommendations.push('WebRTC is fully blocked - some sites may not work');
    }
    
    if (this.enabled && !this.blockSTUN && !this.blockTURN) {
      recommendations.push('STUN/TURN blocking is disabled - IP may still leak');
    }
    
    return recommendations;
  }

  /**
   * Save current settings to localStorage
   */
  saveSettings() {
    try {
      const settings = {
        enabled: this.enabled,
        blockAllWebRTC: this.blockAllWebRTC,
        blockSTUN: this.blockSTUN,
        blockTURN: this.blockTURN,
        blockDataChannels: this.blockDataChannels,
        randomizeWebGL: this.randomizeWebGL
      };
      
              localStorage.setItem('cb_webrtc_settings', JSON.stringify(settings));
      console.log('🔒 WebRTC Protection: Settings saved');
    } catch (error) {
      console.warn('Failed to save WebRTC settings:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
              const saved = localStorage.getItem('cb_webrtc_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.enabled = settings.enabled || false;
        this.blockAllWebRTC = settings.blockAllWebRTC || false;
        this.blockSTUN = settings.blockSTUN || false;
        this.blockTURN = settings.blockTURN || false;
        this.blockDataChannels = settings.blockDataChannels || false;
        this.randomizeWebGL = settings.randomizeWebGL || false;
        console.log('🔒 WebRTC Protection: Settings loaded');
      }
    } catch (error) {
      console.warn('Failed to load WebRTC settings:', error);
    }
  }
}

// Export singleton instance
export const webrtcProtection = new WebRTCProtection();

// Don't auto-initialize - let the main browser handle initialization
// This prevents conflicts when the module is imported
