import { KEY, MAX_TABS, MAX_BOOKMARKS, MAX_HISTORY } from './config.js';

// Storage management system
export class StorageManager {
  constructor() {
    this.storageQueue = [];
    this.storageTimeout = null;
    this.refreshLoopDetected = false;
    this.refreshLoopCount = 0;
  }

  // Check if localStorage is available
  canUseLocalStorage() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Save state to localStorage with debouncing
  saveToStorage(state) {
    if (!this.canUseLocalStorage()) return;
    
    // Prevent storage operations during refresh loops
    if (this.refreshLoopDetected) {
      console.warn('Skipping storage save due to detected refresh loop');
      return;
    }
    
    // Prevent duplicate saves of the same state
    const stateKey = JSON.stringify(state);
    if (this.storageQueue.length > 0) {
      const lastState = this.storageQueue[this.storageQueue.length - 1];
      if (JSON.stringify(lastState) === stateKey) {
        return; // Skip duplicate saves
      }
    }
    
    this.storageQueue.push(state);
    if (this.storageTimeout) clearTimeout(this.storageTimeout);
    this.storageTimeout = setTimeout(() => {
      const latestState = this.storageQueue[this.storageQueue.length - 1];
      this.storageQueue = [];
      try {
        localStorage.setItem('cb_tabs', JSON.stringify(latestState));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }, 100);
  }

  // Load state from localStorage
  loadFromStorage() {
    if (!this.canUseLocalStorage()) return null;
    try {
      const stored = localStorage.getItem('cb_tabs');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return null;
  }

  // Load bookmarks from localStorage
  loadBookmarks() {
    if (!this.canUseLocalStorage()) return [];
    try {
      const stored = localStorage.getItem('cb_bookmarks');
      if (stored) {
        const bookmarks = JSON.parse(stored);
        return Array.isArray(bookmarks) ? bookmarks.slice(0, MAX_BOOKMARKS) : [];
      }
    } catch (error) {
      console.warn('Failed to load bookmarks:', error);
    }
    return [];
  }

  // Save bookmarks to localStorage
  saveBookmarks(bookmarks) {
    if (!this.canUseLocalStorage()) return;
    try {
      localStorage.setItem('cb_bookmarks', JSON.stringify(bookmarks.slice(0, MAX_BOOKMARKS)));
    } catch (error) {
      console.warn('Failed to save bookmarks:', error);
    }
  }

  // Load history from localStorage
  loadHistory() {
    if (!this.canUseLocalStorage()) return [];
    try {
      const stored = localStorage.getItem('cb_history');
      if (stored) {
        const history = JSON.parse(stored);
        return Array.isArray(history) ? history.slice(0, MAX_HISTORY) : [];
      }
    } catch (error) {
      console.warn('Failed to load history:', error);
    }
    return [];
  }

  // Save history to localStorage
  saveHistory(history) {
    if (!this.canUseLocalStorage()) return;
    try {
      localStorage.setItem('cb_history', JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch (error) {
      console.warn('Failed to save history:', error);
    }
  }

  // Load downloads from localStorage
  loadDownloads() {
    if (!this.canUseLocalStorage()) return [];
    try {
      const stored = localStorage.getItem('cb_downloads');
      if (stored) {
        const downloads = JSON.parse(stored);
        return Array.isArray(downloads) ? downloads : [];
      }
    } catch (error) {
      console.warn('Failed to load downloads:', error);
    }
    return [];
  }

  // Save downloads to localStorage
  saveDownloads(downloads) {
    if (!this.canUseLocalStorage()) return;
    try {
      localStorage.setItem('cb_downloads', JSON.stringify(downloads.slice(-200)));
    } catch (error) {
      console.warn('Failed to save downloads:', error);
    }
  }

  // Load HTTP cache from localStorage
  loadHttpCache() {
    if (!this.canUseLocalStorage()) return new Map();
    try {
      const stored = localStorage.getItem('cb_http_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        return new Map(cacheData);
      }
    } catch (error) {
      console.warn('Failed to load HTTP cache:', error);
    }
    return new Map();
  }

  // Save HTTP cache to localStorage
  saveHttpCache(cache) {
    if (!this.canUseLocalStorage()) return;
    try {
      const cacheArray = Array.from(cache.entries());
      localStorage.setItem('cb_http_cache', JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Failed to save HTTP cache:', error);
    }
  }

  // Load site controls from localStorage
  loadSiteControls() {
    if (!this.canUseLocalStorage()) return {};
    try {
      const stored = localStorage.getItem('cb_site_controls');
      if (stored) {
        const controls = JSON.parse(stored);
        return typeof controls === 'object' ? controls : {};
      }
    } catch (error) {
      console.warn('Failed to load site controls:', error);
    }
    return {};
  }

  // Save site controls to localStorage
  saveSiteControls(controls) {
    if (!this.canUseLocalStorage()) return;
    try {
      localStorage.setItem('cb_site_controls', JSON.stringify(controls));
    } catch (error) {
      console.warn('Failed to save site controls:', error);
    }
  }

  // Load user preferences from localStorage
  loadPreferences() {
    if (!this.canUseLocalStorage()) return {};
    try {
      const prefs = {};
      
      const theme = localStorage.getItem('cb_theme');
      if (theme) prefs.theme = theme;
      
      const fontScale = parseFloat(localStorage.getItem('cb_font_scale'));
      if (!isNaN(fontScale)) prefs.fontScale = fontScale;
      
      const fontWeight = parseInt(localStorage.getItem('cb_font_weight'), 10);
      if (!isNaN(fontWeight)) prefs.fontWeight = fontWeight;
      
      const density = localStorage.getItem('cb_density');
      if (density) prefs.density = density;
      
      const engine = localStorage.getItem('cb_search_engine');
      if (engine) prefs.engine = engine;
      
      const home = localStorage.getItem('cb_home');
      if (home) prefs.home = home;
      
      const startup = localStorage.getItem('cb_startup');
      if (startup) prefs.startup = startup;
      
      const httpsOnly = localStorage.getItem('cb_https_only');
      if (httpsOnly !== null) prefs.httpsOnly = httpsOnly !== '0';
      
      const blockTrackers = localStorage.getItem('cb_block_trackers');
      if (blockTrackers !== null) prefs.blockTrackers = blockTrackers !== '0';
      
      const web3Enabled = localStorage.getItem('cb_web3_enabled');
      if (web3Enabled !== null) prefs.web3Enabled = web3Enabled === '1';
      
      const web3RpcUrl = localStorage.getItem('cb_web3_rpc');
      if (web3RpcUrl) prefs.web3RpcUrl = web3RpcUrl;
      
      const web3ChainId = localStorage.getItem('cb_web3_chain');
      if (web3ChainId) prefs.web3ChainId = web3ChainId;
      
      const ipfsGateway = localStorage.getItem('cb_ipfs_gateway');
      if (ipfsGateway) prefs.ipfsGateway = ipfsGateway;
      
      // WebRTC Protection preferences (default to disabled to allow WebRTC)
      const webrtcProtectionEnabled = localStorage.getItem('cb_webrtc_protection');
      prefs.webrtcProtectionEnabled = webrtcProtectionEnabled !== null ? webrtcProtectionEnabled === '1' : false;
      
      const blockSTUN = localStorage.getItem('cb_block_stun');
      prefs.blockSTUN = blockSTUN !== null ? blockSTUN === '1' : false;
      
      const blockTURN = localStorage.getItem('cb_block_turn');
      prefs.blockTURN = blockTURN !== null ? blockTURN === '1' : false;
      
              const blockDataChannels = localStorage.getItem('cb_block_datachannels');
        prefs.blockDataChannels = blockDataChannels !== null ? blockDataChannels === '1' : false;
        
        // WebGL Fingerprint Randomization preference
        const randomizeWebGL = localStorage.getItem('cb_randomize_webgl');
        prefs.randomizeWebGL = randomizeWebGL !== null ? randomizeWebGL === '1' : false;
        
        // Connection Spoofing preferences
        const connectionSpoofingEnabled = localStorage.getItem('cb_connection_spoofing');
        prefs.connectionSpoofingEnabled = connectionSpoofingEnabled !== null ? connectionSpoofingEnabled === '1' : false;
        
        const spoofConnectionType = localStorage.getItem('cb_spoof_connection_type');
        if (spoofConnectionType) prefs.spoofConnectionType = spoofConnectionType;
        
        const spoofEffectiveType = localStorage.getItem('cb_spoof_effective_type');
        if (spoofEffectiveType) prefs.spoofEffectiveType = spoofEffectiveType;
        
        const spoofDownlink = localStorage.getItem('cb_spoof_downlink');
        if (spoofDownlink) prefs.spoofDownlink = parseInt(spoofDownlink) || 10;
        
        const spoofRtt = localStorage.getItem('cb_spoof_rtt');
        if (spoofRtt) prefs.spoofRtt = parseInt(spoofRtt) || 50;
        
        // Platform Detection Prevention preferences
        const platformDetectionPreventionEnabled = localStorage.getItem('cb_platform_prevention');
        prefs.platformDetectionPreventionEnabled = platformDetectionPreventionEnabled !== null ? platformDetectionPreventionEnabled === '1' : false;
        
        const spoofPlatform = localStorage.getItem('cb_spoof_platform');
        if (spoofPlatform) prefs.spoofPlatform = spoofPlatform;
        
        const spoofUserAgent = localStorage.getItem('cb_spoof_user_agent');
        if (spoofUserAgent) prefs.spoofUserAgent = spoofUserAgent;
        
        const spoofTimezone = localStorage.getItem('cb_spoof_timezone');
        if (spoofTimezone) prefs.spoofTimezone = spoofTimezone;
        
        return prefs;
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      return {};
    }
  }

  // Save user preferences to localStorage
  savePreferences(prefs) {
    if (!this.canUseLocalStorage()) return;
    try {
      Object.entries(prefs).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          localStorage.setItem(`cb_${key}`, value.toString());
        }
      });
    } catch (error) {
      console.warn('Failed to save preferences:', error);
    }
  }

  // Refresh loop detection
  detectRefreshLoop() {
    const now = Date.now();
    if (now - this.lastStateUpdate < 1000) { // Less than 1 second
      this.refreshLoopCount++;
      if (this.refreshLoopCount >= 5) {
        this.refreshLoopDetected = true;
        console.warn('Refresh loop detected, preventing further updates');
        return true;
      }
    } else {
      this.refreshLoopCount = 0;
    }
    this.lastStateUpdate = now;
    return false;
  }

  // Reset refresh loop detection
  resetRefreshLoopDetection() {
    this.refreshLoopDetected = false;
    this.refreshLoopCount = 0;
    this.lastStateUpdate = 0;
  }

  // Check if refresh loop is detected
  isRefreshLoopDetected() {
    return this.refreshLoopDetected;
  }
}
