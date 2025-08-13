/**
 * Connection Type Spoofing Module
 * 
 * This module prevents websites from detecting your actual network connection type,
 * bandwidth, and other network characteristics that could be used for fingerprinting
 * and location tracking.
 */

export class ConnectionSpoofing {
  constructor() {
    this.enabled = false;
    this.spoofConnectionType = 'wifi'; // Default to WiFi
    this.spoofEffectiveType = '4g'; // Default to 4G
    this.spoofDownlink = 10; // Default to 10 Mbps
    this.spoofRtt = 50; // Default to 50ms RTT
    
    // Store original network APIs
    this.originalAPIs = {};
    
    // Available connection types to spoof
    this.availableConnectionTypes = [
      'wifi', 'ethernet', 'cellular', 'bluetooth', 'none'
    ];
    
    // Available effective types to spoof
    this.availableEffectiveTypes = [
      'slow-2g', '2g', '3g', '4g', '5g'
    ];
    
    // Don't auto-init - let the main browser call init() when ready
  }

  /**
   * Initialize connection spoofing
   */
  init() {
    console.log('🔒 Connection Spoofing: Initializing...');
    
    // Store original network APIs
    this.storeOriginalAPIs();
    
    if (this.enabled) {
      this.applyConnectionSpoofing();
      console.log('🔒 Connection Spoofing: Active and protecting network information');
    } else {
      console.log('🔓 Connection Spoofing: Disabled - network information visible');
    }
  }

  /**
   * Store original network APIs for restoration
   */
  storeOriginalAPIs() {
    // Store navigator.connection if it exists
    if (navigator.connection && !this.originalAPIs.connection) {
      this.originalAPIs.connection = navigator.connection;
      console.log('🔒 Connection Spoofing: Stored original navigator.connection');
    }
    
    // Store navigator.connection.effectiveType if it exists
    if (navigator.connection && navigator.connection.effectiveType && !this.originalAPIs.effectiveType) {
      this.originalAPIs.effectiveType = navigator.connection.effectiveType;
    }
    
    // Store navigator.connection.downlink if it exists
    if (navigator.connection && navigator.connection.downlink && !this.originalAPIs.downlink) {
      this.originalAPIs.downlink = navigator.connection.downlink;
    }
    
    // Store navigator.connection.rtt if it exists
    if (navigator.connection && navigator.connection.rtt && !this.originalAPIs.rtt) {
      this.originalAPIs.rtt = navigator.connection.rtt;
    }
    
    // Store navigator.connection.type if it exists
    if (navigator.connection && navigator.connection.type && !this.originalAPIs.type) {
      this.originalAPIs.type = navigator.connection.type;
    }
    
    console.log('🔒 Connection Spoofing: API storage complete');
  }

  /**
   * Apply connection spoofing
   */
  applyConnectionSpoofing() {
    if (!this.enabled) return;
    
    try {
      // Create a spoofed connection object
      const spoofedConnection = this.createSpoofedConnection();
      
      // Override navigator.connection
      Object.defineProperty(navigator, 'connection', {
        value: spoofedConnection,
        writable: false,
        configurable: false
      });
      
      // Override connection properties individually for better compatibility
      if (navigator.connection) {
        Object.defineProperty(navigator.connection, 'type', {
          value: this.spoofConnectionType,
          writable: false,
          configurable: false
        });
        
        Object.defineProperty(navigator.connection, 'effectiveType', {
          value: this.spoofEffectiveType,
          writable: false,
          configurable: false
        });
        
        Object.defineProperty(navigator.connection, 'downlink', {
          value: this.spoofDownlink,
          writable: false,
          configurable: false
        });
        
        Object.defineProperty(navigator.connection, 'rtt', {
          value: this.spoofRtt,
          writable: false,
          configurable: false
        });
      }
      
      console.log('🔒 Connection Spoofing: Applied successfully');
    } catch (error) {
      console.warn('Failed to apply connection spoofing:', error);
    }
  }

  /**
   * Create a spoofed connection object
   */
  createSpoofedConnection() {
    const spoofedConnection = {
      type: this.spoofConnectionType,
      effectiveType: this.spoofEffectiveType,
      downlink: this.spoofDownlink,
      rtt: this.spoofRtt,
      
      // Add event listeners that do nothing
      addEventListener: () => {},
      removeEventListener: () => {},
      
      // Mock properties
      saveData: false,
      metered: false
    };
    
    // Make properties non-writable
    Object.defineProperties(spoofedConnection, {
      type: { writable: false, configurable: false },
      effectiveType: { writable: false, configurable: false },
      downlink: { writable: false, configurable: false },
      rtt: { writable: false, configurable: false },
      saveData: { writable: false, configurable: false },
      metered: { writable: false, configurable: false }
    });
    
    return spoofedConnection;
  }

  /**
   * Restore original connection information
   */
  restoreConnectionInfo() {
    try {
      if (this.originalAPIs.connection) {
        Object.defineProperty(navigator, 'connection', {
          value: this.originalAPIs.connection,
          writable: true,
          configurable: true
        });
        console.log('🔓 Connection Spoofing: Restored original connection info');
      }
    } catch (error) {
      console.warn('Failed to restore connection info:', error);
    }
  }

  /**
   * Configure connection spoofing settings
   */
  configure(settings) {
    if (settings.connectionType !== undefined) {
      this.spoofConnectionType = settings.connectionType;
    }
    if (settings.effectiveType !== undefined) {
      this.spoofEffectiveType = settings.effectiveType;
    }
    if (settings.downlink !== undefined) {
      this.spoofDownlink = settings.downlink;
    }
    if (settings.rtt !== undefined) {
      this.spoofRtt = settings.rtt;
    }
    
    // Reapply if enabled
    if (this.enabled) {
      this.applyConnectionSpoofing();
    }
    
    // Save settings
    this.saveSettings();
  }

  /**
   * Enable/disable connection spoofing
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (enabled) {
      this.applyConnectionSpoofing();
      console.log('🔒 Connection Spoofing: Enabled');
    } else {
      this.restoreConnectionInfo();
      console.log('🔓 Connection Spoofing: Disabled');
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
      connectionType: this.spoofConnectionType,
      effectiveType: this.spoofEffectiveType,
      downlink: this.spoofDownlink,
      rtt: this.spoofRtt
    };
  }

  /**
   * Get available spoofing options
   */
  getAvailableOptions() {
    return {
      connectionTypes: this.availableConnectionTypes,
      effectiveTypes: this.availableEffectiveTypes
    };
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      const settings = {
        enabled: this.enabled,
        connectionType: this.spoofConnectionType,
        effectiveType: this.spoofEffectiveType,
        downlink: this.spoofDownlink,
        rtt: this.spoofRtt
      };
      
              localStorage.setItem('cb_connection_spoofing', JSON.stringify(settings));
      console.log('🔒 Connection Spoofing: Settings saved');
    } catch (error) {
      console.warn('Failed to save connection spoofing settings:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
              const saved = localStorage.getItem('cb_connection_spoofing');
      if (saved) {
        const settings = JSON.parse(saved);
        this.enabled = settings.enabled || false;
        this.spoofConnectionType = settings.connectionType || 'wifi';
        this.spoofEffectiveType = settings.effectiveType || '4g';
        this.spoofDownlink = settings.downlink || 10;
        this.spoofRtt = settings.rtt || 50;
        console.log('🔒 Connection Spoofing: Settings loaded');
      }
    } catch (error) {
      console.warn('Failed to load connection spoofing settings:', error);
    }
  }
}

// Export singleton instance
export const connectionSpoofing = new ConnectionSpoofing();

// Don't auto-initialize - let the main browser handle initialization
