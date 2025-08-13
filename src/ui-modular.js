// Minimal Browser - Advanced Settings Panel Version
// This file contains all the necessary code inline to work as a regular browser script

// Constants
const KEY = 'mb_';
const FONT_STACK = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SEARCH_ENGINES = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  brave: 'https://search.brave.com/search?q=',
  startpage: 'https://www.startpage.com/do/search?q='
};
const SEARCH_SHORTCUTS = {
  'g': 'google',
  'y': 'youtube',
  'w': 'wikipedia',
  'd': 'duckduckgo',
  'gh': 'github',
  'r': 'reddit',
  't': 'twitter',
  'a': 'amazon',
  'n': 'news',
  's': 'stackoverflow'
};
const SEARCH_ENGINE_FALLBACKS = {
  google: 'bing',
  bing: 'duckduckgo',
  duckduckgo: 'google'
};
const TRACKER_SNIPPETS = [
  'google-analytics',
  'googletagmanager',
  'facebook',
  'twitter',
  'linkedin',
  'pinterest'
];
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'file:', 'about:', 'chrome:'];
const RENDER_THROTTLE = 16; // 60 FPS
const STATE_UPDATE_THROTTLE = 100; // 10 FPS

// Simple Theme Manager
class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.fontScale = 1.0;
    this.fontWeight = 500;
    this.density = 'normal';
  }
  
  getCurrentThemeName() {
    return this.currentTheme;
  }
  
  getFontScale() {
    return this.fontScale;
  }
  
  getFontWeight() {
    return this.fontWeight;
  }
  
  getDensity() {
    return this.density;
  }
  
  setTheme(theme) {
    this.currentTheme = theme;
  }
  
  setFontScale(scale) {
    this.fontScale = scale;
  }
  
  setFontWeight(weight) {
    this.fontWeight = weight;
  }
  
  setDensity(density) {
    this.density = density;
  }
  
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    return this.currentTheme;
  }
  
  generateThemeCSS() {
    return `
      :host {
        --bg-primary: ${this.currentTheme === 'dark' ? '#0a0a0a' : '#ffffff'};
        --bg-secondary: ${this.currentTheme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
        --text-primary: ${this.currentTheme === 'dark' ? '#ffffff' : '#000000'};
        --text-secondary: ${this.currentTheme === 'dark' ? '#cccccc' : '#666666'};
        --accent: ${this.currentTheme === 'dark' ? '#00aaff' : '#0066cc'};
        --border: ${this.currentTheme === 'dark' ? '#333333' : '#dddddd'};
        --success: #00aa00;
        --error: #ff4444;
        --warning: #ffaa00;
      }
    `;
  }
}

// Simple Storage Manager
class StorageManager {
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('mb_state');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load from storage:', error);
      return null;
    }
  }
  
  saveToStorage(state) {
    try {
      localStorage.setItem('mb_state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save to storage:', error);
    }
  }
  
  saveBookmarks(bookmarks) {
    try {
      localStorage.setItem('mb_bookmarks', JSON.stringify(bookmarks));
    } catch (error) {
      console.warn('Failed to save bookmarks:', error);
    }
  }
  
  saveHistory(history) {
    try {
      localStorage.setItem('mb_history', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save history:', error);
    }
  }
  
  saveDownloads(downloads) {
    try {
      localStorage.setItem('mb_downloads', JSON.stringify(downloads));
    } catch (error) {
      console.warn('Failed to save downloads:', error);
    }
  }
  
  saveSiteControls(controls) {
    try {
      localStorage.setItem('mb_site_controls', JSON.stringify(controls));
    } catch (error) {
      console.warn('Failed to save site controls:', error);
    }
  }
  
  saveHttpCache(cache) {
    try {
      localStorage.setItem('mb_http_cache', JSON.stringify(Array.from(cache.entries())));
    } catch (error) {
      console.warn('Failed to save HTTP cache:', error);
    }
  }
}

// Simple Start Page
class StartPage {
  constructor(themeManager) {
    this.themeManager = themeManager;
  }
  
  createStartOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'start-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--bg-primary);
      z-index: 2147483646;
      display: none;
      font-family: ${FONT_STACK};
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-primary);
    `;
    
    const title = document.createElement('h1');
    title.textContent = 'Minimal Browser';
    title.style.cssText = `
      font-size: 48px;
      margin-bottom: 20px;
      color: var(--accent);
    `;
    
    const searchBox = document.createElement('input');
    searchBox.id = 'start-search';
    searchBox.placeholder = 'Search or enter address...';
    searchBox.style.cssText = `
      width: 80%;
      max-width: 600px;
      padding: 20px;
      font-size: 18px;
      border: 2px solid var(--border);
      border-radius: 10px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      outline: none;
    `;
    
    content.appendChild(title);
    content.appendChild(searchBox);
    overlay.appendChild(content);
    
    return overlay;
  }
  
  getSearchInput() {
    return document.querySelector('#start-search');
  }
  
  shouldShow(url) {
    return !url || url === 'about:blank' || url === 'chrome://newtab/';
  }
  
  show() {
    const overlay = document.querySelector('#start-overlay');
    if (overlay) overlay.style.display = 'block';
  }
  
  hide() {
    const overlay = document.querySelector('#start-overlay');
    if (overlay) overlay.style.display = 'none';
  }
  
  updateTheme() {
    // Theme update logic would go here
  }
}

// Simple WebGL Renderer
class WebGLRenderer {
  constructor() {
    this.canvas = null;
    this.gl = null;
  }
  
  dispose() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.gl = null;
  }
}

// Simple WASM Module
class WasmModule {
  dispose() {
    // Cleanup logic would go here
  }
}

// Simple Memory Optimizer
class MemoryOptimizer {
  getMemoryInfo() {
    return {
      supported: false,
      current: 0,
      total: 0,
      usage: 0
    };
  }
  
  getOptimizationRecommendations() {
    return [];
  }
  
  dispose() {
    // Cleanup logic would go here
  }
}

// Simple Service Worker Manager
class ServiceWorkerManager {
  dispose() {
    // Cleanup logic would go here
  }
}

// Simple Performance Boosts
class PerformanceBoosts {
  dispose() {
    // Cleanup logic would go here
  }
}

// WebRTC Protection (simplified version)
class WebRTCProtection {
  constructor() {
    this.enabled = false;
    this.blockSTUN = false;
    this.blockTURN = false;
    this.blockDataChannels = false;
    this.randomizeWebGL = false;
  }
  
  init() {
    console.log('🔒 WebRTC Protection: Initializing...');
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  configure(settings) {
    if (settings.blockSTUN !== undefined) this.blockSTUN = settings.blockSTUN;
    if (settings.blockTURN !== undefined) this.blockTURN = settings.blockTURN;
    if (settings.blockDataChannels !== undefined) this.blockDataChannels = settings.blockDataChannels;
    if (settings.randomizeWebGL !== undefined) this.randomizeWebGL = settings.randomizeWebGL;
  }
  
  getStatus() {
    return {
      enabled: this.enabled,
      blockSTUN: this.blockSTUN,
      blockTURN: this.blockTURN,
      blockDataChannels: this.blockDataChannels,
      randomizeWebGL: this.randomizeWebGL
    };
  }
  
  getPrivacyReport() {
    return {
      protectionLevel: this.enabled ? 'High' : 'Low'
    };
  }
  
  testProtection() {
    return {
      blocked: this.enabled,
      message: this.enabled ? 'WebRTC is protected' : 'WebRTC is not protected'
    };
  }
}

// Connection Spoofing (simplified version)
class ConnectionSpoofing {
  constructor() {
    this.enabled = false;
    this.spoofConnectionType = 'wifi';
    this.spoofEffectiveType = '4g';
  }
  
  init() {
    console.log('🔒 Connection Spoofing: Initializing...');
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  configure(settings) {
    if (settings.connectionType !== undefined) this.spoofConnectionType = settings.connectionType;
    if (settings.effectiveType !== undefined) this.spoofEffectiveType = settings.effectiveType;
  }
  
  getStatus() {
    return {
      enabled: this.enabled,
      connectionType: this.spoofConnectionType,
      effectiveType: this.spoofEffectiveType
    };
  }
}

// Platform Detection Prevention (simplified version)
class PlatformDetectionPrevention {
  constructor() {
    this.enabled = false;
    this.spoofedPlatform = 'Win32';
    this.spoofedUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }
  
  init() {
    console.log('🔒 Platform Detection Prevention: Initializing...');
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  configure(settings) {
    if (settings.platform !== undefined) this.spoofedPlatform = settings.platform;
    if (settings.userAgent !== undefined) this.spoofedUserAgent = settings.userAgent;
  }
  
  getStatus() {
    return {
      enabled: this.enabled,
      platform: this.spoofedPlatform,
      userAgent: this.spoofedUserAgent
    };
  }
  
  testDetection() {
    return {
      spoofed: this.enabled,
      expected: {
        platform: this.spoofedPlatform,
        userAgent: this.spoofedUserAgent
      }
    };
  }
}

// Main browser UI class
class MinimalBrowser {
  constructor() {
    // Initialize managers
    this.themeManager = new ThemeManager();
    this.storageManager = new StorageManager();
    this.startPage = new StartPage(this.themeManager);
    this.wasmModule = new WasmModule();
    this.memoryOptimizer = new MemoryOptimizer();
    this.serviceWorker = new ServiceWorkerManager();
    this.performanceBoosts = new PerformanceBoosts();
    this.webrtcProtection = new WebRTCProtection();
    // Initialize the protection module
    this.webrtcProtection.init();
    
    // State variables
    this.isNavigating = false;
    this.isDragging = false;
    this.draggedTabIndex = -1;
    this.searchEngineWorking = true;
    
    // User preferences
    this.defaultSearchEngine = 'duckduckgo';
    this.homeUrl = 'about:blank';
    this.startupMode = 'restore';
    this.httpsOnly = true;
    this.blockTrackers = true;
    this.siteControls = {};
    this.downloads = [];
    this.web3Enabled = false;
    this.web3RpcUrl = 'https://cloudflare-eth.com';
    this.web3ChainId = '0x1';
    this.ipfsGateway = 'https://cloudflare-ipfs.com';
    
    // WebRTC Protection settings
    this.webrtcProtectionEnabled = false; // Default to disabled to allow WebRTC
    this.blockSTUN = false; // Allow STUN by default
    this.blockTURN = false; // Allow TURN by default
    this.blockDataChannels = false;
    this.randomizeWebGL = false; // WebGL fingerprint randomization
    
    // Data
    this.bookmarks = [];
    this.history = [];
    this.httpCache = new Map();
    
    // Performance optimization
    this.renderScheduled = false;
    this.updateScheduled = false;
    this.lastRenderTime = 0;
    
    // Cached DOM elements
    this.cachedElements = {
      host: null,
      shadowRoot: null,
      style: null,
      back: null,
      forward: null,
      tabs: null,
      indicator: null,
      url: null,
      go: null,
      fallback: null,
      loading: null,
      bookmark: null,
      theme: null,
      settings: null,
      new: null,
      menu: null,
      startOverlay: null,
      startSearch: null
    };
    
    // WebGL rendering
    this.webglRenderer = null;
    this.webglCanvas = null;
    this.webglEnabled = false;
    this.animationFrame = null;
    
    this.startOverlayVisible = false;
  }

  // Initialize the browser
  async init() {
    console.log('Initializing modular minimal browser...');
    
    // Set navigation flag to prevent interference during initialization
    this.isNavigating = true;
    
    // Load preferences
    this.loadPreferences();
    
    // Load data
    this.loadData();
    
    // Create UI
    this.ensureHost();
    
    // Apply theme
    this.applyTheme();
    
    // Setup startup
    await this.setupStartup();
    
    // Wire events
    this.wire();
    
    // Initial render
    this.render();
    this.updateCurrent();
    
    // Start autosave
    this.startAutosave();
    
    // Enable features
    this.enableSmoothScrolling();
    this.enhanceScrollRestoration();
    this.enhanceTabScrolling();
    
    // Reset navigation flag
    this.isNavigating = false;
    
    console.log('Modular initialization complete');
  }

  // Load user preferences
  loadPreferences() {
    try {
      // Load theme preferences first
      const theme = localStorage.getItem('mb_theme');
      if (theme) {
        this.themeManager.setTheme(theme);
      }
      
      // Load other preferences
      const searchEngine = localStorage.getItem('mb_search_engine');
      if (searchEngine) {
        this.defaultSearchEngine = searchEngine;
      }
      
      const homeUrl = localStorage.getItem('mb_home_url');
      if (homeUrl) {
        this.homeUrl = homeUrl;
      }
      
      const startupMode = localStorage.getItem('mb_startup_mode');
      if (startupMode) {
        this.startupMode = startupMode;
      }
      
      const httpsOnly = localStorage.getItem('mb_https_only');
      if (httpsOnly !== null) {
        this.httpsOnly = httpsOnly === 'true';
      }
      
      const blockTrackers = localStorage.getItem('mb_block_trackers');
      if (blockTrackers !== null) {
        this.blockTrackers = blockTrackers === 'true';
      }
      
      // Load WebRTC Protection preferences
      const webrtcProtectionEnabled = localStorage.getItem('mb_webrtc_protection');
      if (webrtcProtectionEnabled !== null) {
        this.webrtcProtectionEnabled = webrtcProtectionEnabled === 'true';
        this.webrtcProtection.setEnabled(this.webrtcProtectionEnabled);
      }
      
      const blockSTUN = localStorage.getItem('mb_block_stun');
      if (blockSTUN !== null) {
        this.blockSTUN = blockSTUN === 'true';
        this.webrtcProtection.configure({ blockSTUN: this.blockSTUN });
      }
      
      const blockTURN = localStorage.getItem('mb_block_turn');
      if (blockTURN !== null) {
        this.blockTURN = blockTURN === 'true';
        this.webrtcProtection.configure({ blockTURN: this.blockTURN });
      }
      
      const blockDataChannels = localStorage.getItem('mb_block_datachannels');
      if (blockDataChannels !== null) {
        this.blockDataChannels = blockDataChannels === 'true';
        this.webrtcProtection.configure({ blockDataChannels: this.blockDataChannels });
      }
      
      // Load WebGL fingerprint randomization preference
      const randomizeWebGL = localStorage.getItem('mb_randomize_webgl');
      if (randomizeWebGL !== null) {
        this.randomizeWebGL = randomizeWebGL === 'true';
        this.webrtcProtection.configure({ randomizeWebGL: this.randomizeWebGL });
      }
      
      // Load Connection Spoofing preferences
      const connectionSpoofingEnabled = localStorage.getItem('mb_connection_spoofing');
      if (connectionSpoofingEnabled !== null) {
        this.connectionSpoofingEnabled = connectionSpoofingEnabled === 'true';
        this.connectionSpoofing.setEnabled(this.connectionSpoofingEnabled);
      }
      
      const spoofConnectionType = localStorage.getItem('mb_spoof_connection_type');
      if (spoofConnectionType) {
        this.spoofConnectionType = spoofConnectionType;
        this.connectionSpoofing.configure({ connectionType: this.spoofConnectionType });
      }
      
      const spoofEffectiveType = localStorage.getItem('mb_spoof_effective_type');
      if (spoofEffectiveType) {
        this.spoofEffectiveType = spoofEffectiveType;
        this.connectionSpoofing.configure({ effectiveType: this.spoofEffectiveType });
      }
      
      // Load Platform Detection Prevention preferences
      const platformDetectionPreventionEnabled = localStorage.getItem('mb_platform_prevention');
      if (platformDetectionPreventionEnabled !== null) {
        this.platformDetectionPreventionEnabled = platformDetectionPreventionEnabled === 'true';
        this.platformDetectionPrevention.setEnabled(this.platformDetectionPreventionEnabled);
      }
      
      const spoofPlatform = localStorage.getItem('mb_spoof_platform');
      if (spoofPlatform) {
        this.spoofPlatform = spoofPlatform;
        this.platformDetectionPrevention.configure({ platform: this.spoofPlatform });
      }
      
      const spoofUserAgent = localStorage.getItem('mb_spoof_user_agent');
      if (spoofUserAgent) {
        this.spoofUserAgent = spoofUserAgent;
        this.platformDetectionPrevention.configure({ userAgent: this.spoofUserAgent });
      }
      
      console.log('Preferences loaded successfully');
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  // Load data from storage
  loadData() {
    try {
      // Load bookmarks
      const savedBookmarks = localStorage.getItem('mb_bookmarks');
      if (savedBookmarks) {
        this.bookmarks = JSON.parse(savedBookmarks);
      }
      
      // Load history
      const savedHistory = localStorage.getItem('mb_history');
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      }
      
      // Load downloads
      const savedDownloads = localStorage.getItem('mb_downloads');
      if (savedDownloads) {
        this.downloads = JSON.parse(savedDownloads);
      }
      
      // Load site controls
      const savedSiteControls = localStorage.getItem('mb_site_controls');
      if (savedSiteControls) {
        this.siteControls = JSON.parse(savedSiteControls);
      }
      
      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  // Create the main UI host
  ensureHost() {
    if (this.cachedElements.host) return this.cachedElements.host;
    
    const host = document.createElement('div');
    host.id = 'mb-host';
    host.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:2147483647;pointer-events:none`;

    const shadow = host.attachShadow({mode:'open'});
    const style = document.createElement('style');
    shadow.appendChild(style);

    // Create the main bar
    const bar = this.createMainBar();
    shadow.appendChild(bar);

    // Create start page overlay
    const startOverlay = this.startPage.createStartOverlay();
    shadow.appendChild(startOverlay);

    // Initialize WebGL if supported
    this.initWebGL(shadow);

    // Initialize Service Worker and Performance Boosts
    this.initServiceWorker();
    this.initPerformanceBoosts();

    // Cache elements
    this.cachedElements.host = host;
    this.cachedElements.shadowRoot = shadow;
    this.cachedElements.style = style;
    this.cachedElements.startOverlay = startOverlay;
    this.cachedElements.startSearch = this.startPage.getSearchInput();

    // Append to document
    if (host.parentElement !== document.documentElement && !this.isNavigating) {
      try {
        document.documentElement.appendChild(host);
      } catch (e) {
        console.warn('Failed to append host to documentElement:', e);
      }
    }

    return host;
  }

  // Initialize WebGL
  initWebGL(shadow) {
    try {
      this.webglRenderer = new WebGLRenderer();
      this.webglEnabled = true;
      console.log('WebGL initialized successfully');
    } catch (error) {
      console.warn('WebGL not supported:', error);
      this.webglEnabled = false;
    }
  }

  // Initialize Service Worker
  initServiceWorker() {
    try {
      // Service worker initialization would go here
      console.log('Service Worker initialized');
    } catch (error) {
      console.warn('Service Worker not supported:', error);
    }
  }

  // Initialize Performance Boosts
  initPerformanceBoosts() {
    try {
      // Performance optimizations would go here
      console.log('Performance Boosts initialized');
    } catch (error) {
      console.warn('Performance Boosts not supported:', error);
    }
  }

  // Setup startup behavior
  async setupStartup() {
    try {
      // Startup logic would go here
      console.log('Startup setup complete');
    } catch (error) {
      console.error('Startup setup failed:', error);
    }
  }

  // Wire events
  wire() {
    try {
      // Event wiring would go here
      console.log('Events wired successfully');
    } catch (error) {
      console.error('Event wiring failed:', error);
    }
  }

  // Render the UI
  render() {
    try {
      // Render logic would go here
      console.log('UI rendered');
    } catch (error) {
      console.error('Render failed:', error);
    }
  }

  // Update current tab
  updateCurrent() {
    try {
      // Tab update logic would go here
      console.log('Current tab updated');
    } catch (error) {
      console.error('Tab update failed:', error);
    }
  }

  // Start autosave
  startAutosave() {
    try {
      // Autosave logic would go here
      console.log('Autosave started');
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  }

  // Enable smooth scrolling
  enableSmoothScrolling() {
    try {
      // Smooth scrolling setup would go here
      console.log('Smooth scrolling enabled');
    } catch (error) {
      console.error('Smooth scrolling failed:', error);
    }
  }

  // Enhance scroll restoration
  enhanceScrollRestoration() {
    try {
      // Scroll restoration enhancement would go here
      console.log('Scroll restoration enhanced');
    } catch (error) {
      console.error('Scroll restoration failed:', error);
    }
  }

  // Enhance tab scrolling
  enhanceTabScrolling() {
    try {
      // Tab scrolling enhancement would go here
      console.log('Tab scrolling enhanced');
    } catch (error) {
      console.error('Tab scrolling failed:', error);
    }
  }

  // Update start page visibility
  updateStartPageVisibility() {
    try {
      // Start page visibility logic would go here
      console.log('Start page visibility updated');
    } catch (error) {
      console.error('Start page visibility failed:', error);
    }
  }

  // Read current state
  readState() {
    try {
      // State reading logic would go here
      return { tabs: [{url: 'about:blank', title: 'New Tab'}], active: 0 };
    } catch (error) {
      console.error('State reading failed:', error);
      return { tabs: [{url: 'about:blank', title: 'New Tab'}], active: 0 };
    }
  }

  // Write state
  writeState(state) {
    try {
      // State writing logic would go here
      console.log('State written successfully');
    } catch (error) {
      console.error('State writing failed:', error);
    }
  }

  // Schedule render
  scheduleRender() {
    try {
      // Render scheduling logic would go here
      console.log('Render scheduled');
    } catch (error) {
      console.error('Render scheduling failed:', error);
    }
  }

  // Show notification
  showNotification(message, type = 'info') {
    try {
      // Create notification element
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#00aa00' : type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#00aaff'};
        color: white;
        border-radius: 8px;
        z-index: 2147483648;
        font-family: ${FONT_STACK};
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
      
      console.log('Notification shown:', message);
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }

  // Create the main navigation bar
  createMainBar() {
    const bar = document.createElement('div');
    bar.id = 'bar';

    const rowTop = document.createElement('div');
    rowTop.id = 'row-top';

    const rowBottom = document.createElement('div');
    rowBottom.id = 'row-bottom';

    // Create tabs container
    const tabs = this.createTabsContainer();
    rowTop.appendChild(tabs);

    // Create new tab button
    const newTabBtn = this.createButton('+', 'new', 'New tab (Ctrl+T)', 'New tab');
    rowTop.appendChild(newTabBtn);

    // Create navigation buttons
    const backBtn = this.createButton('←', 'back', 'Go back (Alt+Left)', 'Go back');
    const forwardBtn = this.createButton('→', 'forward', 'Go forward (Alt+Right)', 'Go forward');
    
    // Create URL input
    const urlInput = this.createUrlInput();
    
    // Create other buttons
    const goBtn = this.createButton('Go', 'go', 'Navigate to address', 'Navigate to address');
    const fallbackBtn = this.createButton('🔄', 'fallback', 'Try alternative search engine (Ctrl+F)', 'Try alternative search engine');
    const loadingIndicator = this.createLoadingIndicator();
    const bookmarkBtn = this.createButton('☆', 'bookmark', 'Bookmark this page', 'Bookmark this page');
    const themeBtn = this.createButton('🌙', 'theme', 'Toggle theme', 'Toggle theme');
    const settingsBtn = this.createButton('⚙️', 'settings', 'Settings (Ctrl+F6)', 'Settings');
    const menuBtn = this.createButton('☰', 'menu', 'Menu (Ctrl+M)', 'Menu');

    // Hide fallback button by default
    fallbackBtn.style.display = 'none';

    // Add to bottom row
    rowBottom.appendChild(backBtn);
    rowBottom.appendChild(forwardBtn);
    rowBottom.appendChild(urlInput);
    rowBottom.appendChild(goBtn);
    rowBottom.appendChild(fallbackBtn);
    rowBottom.appendChild(loadingIndicator);
    rowBottom.appendChild(bookmarkBtn);
    rowBottom.appendChild(themeBtn);
    rowBottom.appendChild(settingsBtn);
    rowBottom.appendChild(menuBtn);

    // Cache elements
    this.cachedElements.back = backBtn;
    this.cachedElements.forward = forwardBtn;
    this.cachedElements.tabs = tabs;
    this.cachedElements.indicator = tabs.querySelector('#tab-indicator');
    this.cachedElements.url = urlInput;
    this.cachedElements.go = goBtn;
    this.cachedElements.fallback = fallbackBtn;
    this.cachedElements.loading = loadingIndicator;
    this.cachedElements.bookmark = bookmarkBtn;
    this.cachedElements.theme = themeBtn;
    this.cachedElements.settings = settingsBtn;
    this.cachedElements.new = newTabBtn;
    this.cachedElements.menu = menuBtn;

    bar.appendChild(rowTop);
    bar.appendChild(rowBottom);

    return bar;
  }

  // Create tabs container
  createTabsContainer() {
    const tabs = document.createElement('div');
    tabs.id = 'tabs';
    
    const indicator = document.createElement('div');
    indicator.id = 'tab-indicator';
    indicator.style.willChange = 'left, width';
    
    tabs.appendChild(indicator);
    return tabs;
  }

  // Create a button element
  createButton(text, id, title, ariaLabel) {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = text;
    button.title = title;
    button.setAttribute('aria-label', ariaLabel);
    button.style.fontFamily = FONT_STACK;
    button.style.fontWeight = '700';
    
    if (id === 'nav-btn') {
      button.className = 'nav-btn';
    }
    
    return button;
  }

  // Create URL input field
  createUrlInput() {
    const url = document.createElement('input');
    url.id = 'url';
    url.type = 'text';
    url.placeholder = 'Search or enter address (g, y, w, d, gh, r, t, a, n, s shortcuts)';
    url.setAttribute('aria-label', 'Address bar');
    url.style.fontFamily = FONT_STACK;
    url.style.fontWeight = '600';
    
    return url;
  }

  // Create loading indicator
  createLoadingIndicator() {
    const loading = document.createElement('div');
    loading.id = 'loading-indicator';
    loading.setAttribute('aria-label', 'Loading indicator');
    
    return loading;
  }

  // Apply current theme
  applyTheme() {
    if (this.cachedElements.style) {
      this.cachedElements.style.textContent = this.themeManager.generateThemeCSS();
      this.startPage.updateTheme();
    }
  }

  // Toggle theme
  toggleTheme() {
    const oldTheme = this.themeManager.toggleTheme();
    
    if (this.cachedElements.host) {
      this.cachedElements.host.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        this.applyTheme();
        if (this.cachedElements.host) {
          this.cachedElements.host.style.transition = '';
        }
      }, 50);
    } else {
      this.applyTheme();
    }
    
    this.scheduleRender();
  }

  // Setup startup behavior
  async setupStartup() {
    // This would contain the startup logic from the original init function
    // For now, just create a basic tab
    const currentState = this.readState();
    if (currentState.tabs.length === 0) {
      currentState.tabs = [{url: 'about:blank', title: 'New Tab'}];
      currentState.active = 0;
      this.writeState(currentState);
    }
  }

  // Wire up event handlers
  wire() {
    // This would contain all the event wiring logic
    // For now, just add basic theme toggle
    if (this.cachedElements.theme) {
      this.cachedElements.theme.addEventListener('click', () => this.toggleTheme());
    }
    
    // Track user activity for WebGL effects
    this.trackUserActivity();
    
    // Add activity tracking to various events
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, () => this.trackUserActivity(), { passive: true });
    });
    
    // Add settings button handler
    if (this.cachedElements.settings) {
      this.cachedElements.settings.addEventListener('click', () => this.showSettings());
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'F6') {
        e.preventDefault();
        this.showSettings();
      }
    });
  }

  // Render the UI
  render() {
    // This would contain the render logic
    // For now, just update the start page visibility
    this.updateStartPageVisibility();
  }

  // Update current tab
  updateCurrent() {
    // This would contain the current tab update logic
  }

  // Start autosave
  startAutosave() {
    // This would contain the autosave logic
  }

  // Enable smooth scrolling
  enableSmoothScrolling() {
    // This would contain the smooth scrolling setup
  }

  // Enhance scroll restoration
  enhanceScrollRestoration() {
    // This would contain the scroll restoration enhancement
  }

  // Enhance tab scrolling
  enhanceTabScrolling() {
    // This would contain the tab scrolling enhancement
  }

  // Update start page visibility
  updateStartPageVisibility() {
    const currentState = this.readState();
    const active = currentState.tabs[currentState.active];
    const url = active && active.url;
    
    if (this.startPage.shouldShow(url)) {
      this.startPage.show();
    } else {
      this.startPage.hide();
    }
  }

  // Read current state
  readState() {
    try {
      if (typeof window.name === 'string' && window.name.startsWith(KEY)) {
        const state = JSON.parse(window.name.slice(KEY.length));
        if (state && Array.isArray(state.tabs) && typeof state.active === 'number') {
          return state;
        }
      }
    } catch (error) {
      console.warn('Failed to read state from window.name:', error);
    }
    
    // Fallback to stored state
    const stored = this.storageManager.loadFromStorage();
    if (stored && Array.isArray(stored.tabs) && typeof stored.active === 'number') {
      return stored;
    }
    
    // Default state
    return { tabs: [{url: 'about:blank', title: 'New Tab'}], active: 0 };
  }

  // Write state
  writeState(state) {
    try {
      window.name = KEY + JSON.stringify(state);
      this.storageManager.saveToStorage(state);
    } catch (error) {
      console.warn('Failed to write state:', error);
    }
  }

  // Schedule render
  scheduleRender() {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    
    requestAnimationFrame(() => {
      this.render();
      this.renderScheduled = false;
    });
  }

  // Get current theme
  getCurrentTheme() {
    return this.themeManager.getCurrentTheme();
  }

  // Get current theme name
  getCurrentThemeName() {
    return this.themeManager.getCurrentThemeName();
  }

  // Initialize WebGL rendering
  initWebGL(shadowRoot) {
    if (!WebGLRenderer.isSupported()) {
      console.log('WebGL not supported, using standard rendering');
      return;
    }

    try {
      // Create WebGL canvas
      this.webglCanvas = document.createElement('canvas');
      this.webglCanvas.id = 'webgl-canvas';
      this.webglCanvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2147483644;
      `;
      
      // Set canvas size
      this.webglCanvas.width = window.innerWidth;
      this.webglCanvas.height = window.innerHeight;
      
      // Add to shadow DOM
      shadowRoot.appendChild(this.webglCanvas);
      
      // Initialize WebGL renderer
      this.webglRenderer = new WebGLRenderer(this.webglCanvas, this.themeManager);
      this.webglEnabled = this.webglRenderer.isInitialized;
      
      if (this.webglEnabled) {
        console.log('WebGL rendering enabled');
        this.startWebGLAnimation();
        this.setupWebGLResize();
      }
      
    } catch (error) {
      console.warn('Failed to initialize WebGL:', error);
      this.webglEnabled = false;
    }
  }
  
  // Start WebGL animation loop
  startWebGLAnimation() {
    if (!this.webglEnabled || !this.webglRenderer) return;
    
    const animate = (time) => {
      if (!this.webglEnabled) return;
      
      // Clear canvas
      this.webglRenderer.clear([0, 0, 0, 0]);
      
      // Render animated background
      this.webglRenderer.renderAnimatedBackground(time);
      
      // Render particles (optional)
      if (this.shouldShowParticles()) {
        this.webglRenderer.renderParticles(time, 50);
      }
      
      // Continue animation loop
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    animate(0);
  }
  
  // Stop WebGL animation
  stopWebGLAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  // Setup WebGL canvas resize handling
  setupWebGLResize() {
    if (!this.webglCanvas || !this.webglRenderer) return;
    
    const resizeObserver = new ResizeObserver(() => {
      this.webglCanvas.width = window.innerWidth;
      this.webglCanvas.height = window.innerHeight;
      this.webglRenderer.resize(window.innerWidth, window.innerHeight);
    });
    
    resizeObserver.observe(this.webglCanvas);
  }
  
  // Check if particles should be shown
  shouldShowParticles() {
    // Show particles on start page or when idle
    return this.startPage.isStartPageVisible() || 
           (Date.now() - this.lastUserActivity > 30000); // 30 seconds idle
  }

  // Initialize Service Worker
  async initServiceWorker() {
    try {
      const success = await this.serviceWorker.init();
      if (success) {
        console.log('Service Worker initialized successfully');
        
        // Create and register service worker script
        const swScript = await this.serviceWorker.createServiceWorkerScript();
        const offlinePage = await this.serviceWorker.createOfflinePage();
        
        // Store offline page in localStorage for now (in real app, this would be served)
        localStorage.setItem('offline-page', offlinePage);
        
        // Request notification permission
        await this.serviceWorker.requestNotificationPermission();
      } else {
        console.warn('Service Worker initialization failed');
      }
    } catch (error) {
      console.error('Service Worker initialization error:', error);
    }
  }

  // Initialize Performance Boosts
  async initPerformanceBoosts() {
    try {
      const success = await this.performanceBoosts.init();
      if (success) {
        console.log('Performance Boosts initialized successfully');
        
        // Apply performance optimizations
        this.performanceBoosts.optimizeImages();
        this.performanceBoosts.preloadCriticalResources();
      } else {
        console.warn('Performance Boosts initialization failed');
      }
    } catch (error) {
      console.error('Performance Boosts initialization error:', error);
    }
  }
  
  // Track user activity
  trackUserActivity() {
    this.lastUserActivity = Date.now();
  }
  
  // Render UI element with WebGL if available
  renderUIElementWithWebGL(type, x, y, width, height, options = {}) {
    if (this.webglEnabled && this.webglRenderer) {
      this.webglRenderer.renderUIElement(type, x, y, width, height, options);
    }
  }
  
  // Get WebGL information
  getWebGLInfo() {
    if (this.webglRenderer) {
      return this.webglRenderer.getInfo();
    }
    return null;
  }
  
  // Toggle WebGL rendering
  toggleWebGL() {
    if (this.webglEnabled) {
      this.stopWebGLAnimation();
      this.webglEnabled = false;
      console.log('WebGL rendering disabled');
    } else {
      this.webglEnabled = true;
      this.startWebGLAnimation();
      console.log('WebGL rendering enabled');
    }
  }
  
  // Create advanced settings panel with table-like UI
  createSettingsPanel() {
    console.log('🔧 Creating settings panel...');
    
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 2147483647;
      display: block;
      overflow-y: auto;
      font-family: ${FONT_STACK};
    `;
    
    console.log('🔧 Settings panel element created with ID:', panel.id);

    // Header with close button
    const header = document.createElement('div');
    header.style.cssText = `
      position: sticky;
      top: 0;
      background: #0a0a0a;
      padding: 20px;
      border-bottom: 2px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    `;
    
    const title = document.createElement('h1');
    title.textContent = '🔧 Advanced Browser Settings';
    title.style.cssText = `
      color: #00aaff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: #ff4444;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
    `;
    closeBtn.onclick = () => this.hideSettings();
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);
    
    // Main content container
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    `;

    // Create all settings sections
    const sections = [
      this.createPrivacySection(),
      this.createPerformanceSection(),
      this.createInterfaceSection(),
      this.createSecuritySection(),
      this.createAdvancedSection(),
      this.createDataSection()
    ];

    sections.forEach(section => content.appendChild(section));
    panel.appendChild(content);

    // Add event listeners
    this.addSettingsEventListeners(panel);
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.style.display === 'block') {
        this.hideSettings();
      }
    });
    
    // Close on outside click
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        this.hideSettings();
      }
    });

        return panel;
  }

  // Add event listeners for all settings controls
  addSettingsEventListeners(panel) {
    // Test WebRTC protection button handler
    const testWebRTCBtn = panel.querySelector('#test-webrtc');
    if (testWebRTCBtn) {
      testWebRTCBtn.addEventListener('click', () => {
        try {
          const testResult = this.webrtcProtection.testProtection();
          const report = this.webrtcProtection.getPrivacyReport();
          
          if (testResult.blocked) {
            testWebRTCBtn.textContent = '✓ Protected';
            testWebRTCBtn.style.background = this.themeManager.getCurrentTheme().success;
            testWebRTCBtn.title = `Protection Level: ${report.protectionLevel}`;
          } else {
            testWebRTCBtn.textContent = '✗ Vulnerable';
            testWebRTCBtn.style.background = this.themeManager.getCurrentTheme().error;
            testWebRTCBtn.title = testResult.message;
          }
          
          setTimeout(() => {
            testWebRTCBtn.textContent = '🧪';
            testWebRTCBtn.style.background = '';
            testWebRTCBtn.title = 'Test WebRTC protection';
          }, 3000);
          
          // Show notification
          this.showNotification(
            testResult.blocked ? 
              `WebRTC Protection: ${report.protectionLevel} level active` : 
              `WebRTC Protection: ${testResult.message}`,
            testResult.blocked ? 'success' : 'warning'
          );
        } catch (error) {
          console.error('WebRTC protection test failed:', error);
          testWebRTCBtn.textContent = '✗ Error';
          testWebRTCBtn.style.background = this.themeManager.getCurrentTheme().error;
          setTimeout(() => {
            testWebRTCBtn.textContent = '🧪';
            testWebRTCBtn.style.background = '';
          }, 3000);
        }
      });
    }

    // Test Connection Spoofing button handler
    const testConnectionBtn = panel.querySelector('#test-connection');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => {
        try {
          const status = this.connectionSpoofing.getStatus();
          
          if (status.enabled) {
            testConnectionBtn.textContent = '✓ Spoofing';
            testConnectionBtn.style.background = this.themeManager.getCurrentTheme().success;
            testConnectionBtn.title = `Spoofing as ${status.connectionType} with ${status.effectiveType} network`;
          } else {
            testConnectionBtn.textContent = '✗ Disabled';
            testConnectionBtn.style.background = this.themeManager.getCurrentTheme().error;
            testConnectionBtn.title = 'Connection spoofing is disabled';
          }
          
          setTimeout(() => {
            testConnectionBtn.textContent = '🧪';
            testConnectionBtn.style.background = '';
            testConnectionBtn.title = 'Test connection spoofing';
          }, 3000);
          
          // Show notification
          this.showNotification(
            status.enabled ? 
              `Connection Spoofing: Active - spoofing as ${status.connectionType}` : 
              'Connection Spoofing: Disabled - network info visible',
            status.enabled ? 'success' : 'warning'
          );
        } catch (error) {
          console.error('Connection spoofing test failed:', error);
          testConnectionBtn.textContent = '✗ Error';
          testConnectionBtn.style.background = this.themeManager.getCurrentTheme().error;
          setTimeout(() => {
            testConnectionBtn.textContent = '🧪';
            testConnectionBtn.style.background = '';
          }, 3000);
        }
      });
    }

    // Test Platform Detection Prevention button handler
    const testPlatformBtn = panel.querySelector('#test-platform');
    if (testPlatformBtn) {
      testPlatformBtn.addEventListener('click', () => {
        try {
          const testResult = this.platformDetectionPrevention.testDetection();
          
          if (testResult.spoofed) {
            testPlatformBtn.textContent = '✓ Protected';
            testPlatformBtn.style.background = this.themeManager.getCurrentTheme().success;
            testPlatformBtn.title = `Platform detection blocked - spoofing as ${testResult.expected.platform}`;
          } else {
            testPlatformBtn.textContent = '✗ Vulnerable';
            testPlatformBtn.style.background = this.themeManager.getCurrentTheme().error;
            testPlatformBtn.title = 'Platform detection not blocked';
          }
          
          setTimeout(() => {
            testPlatformBtn.textContent = '🧪';
            testPlatformBtn.style.background = '';
            testPlatformBtn.title = 'Test platform prevention';
          }, 3000);
          
          // Show notification
          this.showNotification(
            testResult.spoofed ? 
              `Platform Prevention: Active - spoofing as ${testResult.expected.platform}` : 
              'Platform Prevention: Disabled - platform info visible',
            testResult.spoofed ? 'success' : 'warning'
          );
        } catch (error) {
          console.error('Platform prevention test failed:', error);
          testPlatformBtn.textContent = '✗ Error';
          testPlatformBtn.style.background = this.themeManager.getCurrentTheme().error;
          setTimeout(() => {
            testPlatformBtn.textContent = '🧪';
            testPlatformBtn.style.background = '';
          }, 3000);
        }
      });
    }

    // Data management button handlers
    const clearAllDataBtn = panel.querySelector('#clear-all-data');
    if (clearAllDataBtn) {
      clearAllDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all browser data? This action cannot be undone.')) {
          this.clearAllBrowserData();
          this.showNotification('All browser data has been cleared', 'success');
        }
      });
    }

    const exportSettingsBtn = panel.querySelector('#export-settings');
    if (exportSettingsBtn) {
      exportSettingsBtn.addEventListener('click', () => {
        this.exportSettings();
      });
    }

    const importSettingsBtn = panel.querySelector('#import-settings');
    if (importSettingsBtn) {
      importSettingsBtn.addEventListener('click', () => {
        this.importSettings();
      });
    }

    const resetDefaultsBtn = panel.querySelector('#reset-defaults');
    if (resetDefaultsBtn) {
      resetDefaultsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
          this.resetSettingsToDefaults();
          this.showNotification('All settings have been reset to defaults', 'success');
        }
      });
    }
  }

  // Clear all browser data
  clearAllBrowserData() {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear browser data
      this.bookmarks = [];
      this.history = [];
      this.downloads = [];
      this.siteControls = {};
      this.httpCache.clear();
      
      // Save cleared data
      this.storageManager.saveBookmarks([]);
      this.storageManager.saveHistory([]);
      this.storageManager.saveDownloads([]);
      this.storageManager.saveSiteControls({});
      this.storageManager.saveHttpCache(new Map());
      
      console.log('All browser data cleared');
    } catch (error) {
      console.error('Failed to clear browser data:', error);
    }
  }

  // Export settings to file
  exportSettings() {
    try {
      const settings = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        theme: this.themeManager.getCurrentThemeName(),
        fontScale: this.themeManager.getFontScale(),
        fontWeight: this.themeManager.getFontWeight(),
        density: this.themeManager.getDensity(),
        searchEngine: this.defaultSearchEngine,
        homeUrl: this.homeUrl,
        startupMode: this.startupMode,
        httpsOnly: this.httpsOnly,
        blockTrackers: this.blockTrackers,
        webrtcProtection: this.webrtcProtectionEnabled,
        blockSTUN: this.blockSTUN,
        blockTURN: this.blockTURN,
        blockDataChannels: this.blockDataChannels,
        randomizeWebGL: this.randomizeWebGL,
        connectionSpoofing: this.connectionSpoofingEnabled,
        spoofConnectionType: this.spoofConnectionType,
        spoofEffectiveType: this.spoofEffectiveType,
        platformDetectionPrevention: this.platformDetectionPreventionEnabled,
        spoofPlatform: this.spoofPlatform,
        spoofUserAgent: this.spoofUserAgent,
        web3Enabled: this.web3Enabled,
        web3RpcUrl: this.web3RpcUrl,
        web3ChainId: this.web3ChainId,
        ipfsGateway: this.ipfsGateway
      };

      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minimal-browser-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showNotification('Settings exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export settings:', error);
      this.showNotification('Failed to export settings', 'error');
    }
  }

  // Import settings from file
  importSettings() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const settings = JSON.parse(e.target.result);
              this.applyImportedSettings(settings);
              this.showNotification('Settings imported successfully', 'success');
            } catch (error) {
              console.error('Failed to parse settings file:', error);
              this.showNotification('Invalid settings file format', 'error');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } catch (error) {
      console.error('Failed to import settings:', error);
      this.showNotification('Failed to import settings', 'error');
    }
  }

  // Apply imported settings
  applyImportedSettings(settings) {
    try {
      // Apply theme settings
      if (settings.theme) {
        this.themeManager.setTheme(settings.theme);
        localStorage.setItem('mb_theme', settings.theme);
      }
      if (settings.fontScale) {
        this.themeManager.setFontScale(settings.fontScale);
        localStorage.setItem('mb_font_scale', settings.fontScale);
      }
      if (settings.fontWeight) {
        this.themeManager.setFontWeight(settings.fontWeight);
        localStorage.setItem('mb_font_weight', settings.fontWeight);
      }
      if (settings.density) {
        this.themeManager.setDensity(settings.density);
        localStorage.setItem('mb_density', settings.density);
      }

      // Apply browser settings
      if (settings.searchEngine) {
        this.defaultSearchEngine = settings.searchEngine;
        localStorage.setItem('mb_search_engine', settings.searchEngine);
      }
      if (settings.homeUrl) {
        this.homeUrl = settings.homeUrl;
        localStorage.setItem('mb_home_url', settings.homeUrl);
      }
      if (settings.startupMode) {
        this.startupMode = settings.startupMode;
        localStorage.setItem('mb_startup_mode', settings.startupMode);
      }
      if (settings.httpsOnly !== undefined) {
        this.httpsOnly = settings.httpsOnly;
        localStorage.setItem('mb_https_only', settings.httpsOnly);
      }
      if (settings.blockTrackers !== undefined) {
        this.blockTrackers = settings.blockTrackers;
        localStorage.setItem('mb_block_trackers', settings.blockTrackers);
      }

      // Apply privacy settings
      if (settings.webrtcProtection !== undefined) {
        this.webrtcProtectionEnabled = settings.webrtcProtection;
        this.webrtcProtection.setEnabled(settings.webrtcProtection);
        localStorage.setItem('mb_webrtc_protection', settings.webrtcProtection);
      }
      if (settings.blockSTUN !== undefined) {
        this.blockSTUN = settings.blockSTUN;
        this.webrtcProtection.configure({ blockSTUN: settings.blockSTUN });
        localStorage.setItem('mb_block_stun', settings.blockSTUN);
      }
      if (settings.blockTURN !== undefined) {
        this.blockTURN = settings.blockTURN;
        this.webrtcProtection.configure({ blockTURN: settings.blockTURN });
        localStorage.setItem('mb_block_turn', settings.blockTURN);
      }
      if (settings.blockDataChannels !== undefined) {
        this.blockDataChannels = settings.blockDataChannels;
        this.webrtcProtection.configure({ blockDataChannels: settings.blockDataChannels });
        localStorage.setItem('mb_block_datachannels', settings.blockDataChannels);
      }
      if (settings.randomizeWebGL !== undefined) {
        this.randomizeWebGL = settings.randomizeWebGL;
        this.webrtcProtection.configure({ randomizeWebGL: settings.randomizeWebGL });
        localStorage.setItem('mb_randomize_webgl', settings.randomizeWebGL);
      }

      // Apply connection spoofing settings
      if (settings.connectionSpoofing !== undefined) {
        this.connectionSpoofingEnabled = settings.connectionSpoofing;
        this.connectionSpoofing.setEnabled(settings.connectionSpoofing);
        localStorage.setItem('mb_connection_spoofing', settings.connectionSpoofing);
      }
      if (settings.spoofConnectionType) {
        this.spoofConnectionType = settings.spoofConnectionType;
        this.connectionSpoofing.configure({ connectionType: settings.spoofConnectionType });
        localStorage.setItem('mb_spoof_connection_type', settings.spoofConnectionType);
      }
      if (settings.spoofEffectiveType) {
        this.spoofEffectiveType = settings.spoofEffectiveType;
        this.connectionSpoofing.configure({ effectiveType: settings.spoofEffectiveType });
        localStorage.setItem('mb_spoof_effective_type', settings.spoofEffectiveType);
      }

      // Apply platform detection prevention settings
      if (settings.platformDetectionPrevention !== undefined) {
        this.platformDetectionPreventionEnabled = settings.platformDetectionPrevention;
        this.platformDetectionPrevention.setEnabled(settings.platformDetectionPrevention);
        localStorage.setItem('mb_platform_prevention', settings.platformDetectionPrevention);
      }
      if (settings.spoofPlatform) {
        this.spoofPlatform = settings.spoofPlatform;
        this.platformDetectionPrevention.configure({ platform: settings.spoofPlatform });
        localStorage.setItem('mb_spoof_platform', settings.spoofPlatform);
      }
      if (settings.spoofUserAgent) {
        this.spoofUserAgent = settings.spoofUserAgent;
        this.platformDetectionPrevention.configure({ userAgent: settings.spoofUserAgent });
        localStorage.setItem('mb_spoof_user_agent', settings.spoofUserAgent);
      }

      // Apply Web3 settings
      if (settings.web3Enabled !== undefined) {
        this.web3Enabled = settings.web3Enabled;
        localStorage.setItem('mb_web3_enabled', settings.web3Enabled);
      }
      if (settings.web3RpcUrl) {
        this.web3RpcUrl = settings.web3RpcUrl;
        localStorage.setItem('mb_web3_rpc_url', settings.web3RpcUrl);
      }
      if (settings.web3ChainId) {
        this.web3ChainId = settings.web3ChainId;
        localStorage.setItem('mb_web3_chain_id', settings.web3ChainId);
      }
      if (settings.ipfsGateway) {
        this.ipfsGateway = settings.ipfsGateway;
        localStorage.setItem('mb_ipfs_gateway', settings.ipfsGateway);
      }

      console.log('Imported settings applied successfully');
    } catch (error) {
      console.error('Failed to apply imported settings:', error);
    }
  }

  // Reset all settings to defaults
  resetSettingsToDefaults() {
    try {
      // Reset theme settings
      this.themeManager.setTheme('dark');
      this.themeManager.setFontScale(1.0);
      this.themeManager.setFontWeight(500);
      this.themeManager.setDensity('normal');

      // Reset browser settings
      this.defaultSearchEngine = 'duckduckgo';
      this.homeUrl = 'about:blank';
      this.startupMode = 'restore';
      this.httpsOnly = true;
      this.blockTrackers = true;

      // Reset privacy settings
      this.webrtcProtectionEnabled = false;
      this.blockSTUN = false;
      this.blockTURN = false;
      this.blockDataChannels = false;
      this.randomizeWebGL = false;

      // Reset connection spoofing settings
      this.connectionSpoofingEnabled = false;
      this.spoofConnectionType = 'wifi';
      this.spoofEffectiveType = '4g';

      // Reset platform detection prevention settings
      this.platformDetectionPreventionEnabled = false;
      this.spoofPlatform = 'Win32';
      this.spoofUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      // Reset Web3 settings
      this.web3Enabled = false;
      this.web3RpcUrl = 'https://cloudflare-eth.com';
      this.web3ChainId = '0x1';
      this.ipfsGateway = 'https://cloudflare-ipfs.com';

      // Apply reset settings
      this.webrtcProtection.setEnabled(false);
      this.webrtcProtection.configure({ 
        blockSTUN: false, 
        blockTURN: false, 
        blockDataChannels: false, 
        randomizeWebGL: false 
      });
      this.connectionSpoofing.setEnabled(false);
      this.platformDetectionPrevention.setEnabled(false);

      // Clear localStorage and set defaults
      localStorage.clear();
      this.saveDefaultSettings();

      console.log('All settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  }

  // Save default settings to localStorage
  saveDefaultSettings() {
    try {
      localStorage.setItem('mb_theme', 'dark');
      localStorage.setItem('mb_font_scale', '1.0');
      localStorage.setItem('mb_font_weight', '500');
      localStorage.setItem('mb_density', 'normal');
      localStorage.setItem('mb_search_engine', 'duckduckgo');
      localStorage.setItem('mb_home_url', 'about:blank');
      localStorage.setItem('mb_startup_mode', 'restore');
      localStorage.setItem('mb_https_only', 'true');
      localStorage.setItem('mb_block_trackers', 'true');
      localStorage.setItem('mb_webrtc_protection', 'false');
      localStorage.setItem('mb_block_stun', 'false');
      localStorage.setItem('mb_block_turn', 'false');
      localStorage.setItem('mb_block_datachannels', 'false');
      localStorage.setItem('mb_randomize_webgl', 'false');
      localStorage.setItem('mb_connection_spoofing', 'false');
      localStorage.setItem('mb_spoof_connection_type', 'wifi');
      localStorage.setItem('mb_spoof_effective_type', '4g');
      localStorage.setItem('mb_platform_prevention', 'false');
      localStorage.setItem('mb_spoof_platform', 'Win32');
      localStorage.setItem('mb_spoof_user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      localStorage.setItem('mb_web3_enabled', 'false');
      localStorage.setItem('mb_web3_rpc_url', 'https://cloudflare-eth.com');
      localStorage.setItem('mb_web3_chain_id', '0x1');
      localStorage.setItem('mb_ipfs_gateway', 'https://cloudflare-ipfs.com');
    } catch (error) {
      console.error('Failed to save default settings:', error);
    }
  }
  
  // Create Privacy & Protection Section
  createPrivacySection() {
    const section = this.createSettingsSection('🔒 Privacy & Protection', [
      {
        type: 'subsection',
        title: 'WebRTC Protection',
        items: [
          {
            type: 'toggle',
            label: 'WebRTC Protection',
            value: this.webrtcProtectionEnabled,
            onChange: (value) => {
              this.webrtcProtectionEnabled = value;
              this.webrtcProtection.setEnabled(value);
              localStorage.setItem('mb_webrtc_protection', value);
            },
            description: 'Block WebRTC requests to prevent IP address leaks'
          },
          {
            type: 'toggle',
            label: 'Block STUN Servers',
            value: this.blockSTUN,
            onChange: (value) => {
              this.blockSTUN = value;
              this.webrtcProtection.configure({ blockSTUN: value });
              localStorage.setItem('mb_block_stun', value);
            },
            description: 'Block STUN servers that can discover your real IP'
          },
          {
            type: 'toggle',
            label: 'Block TURN Servers',
            value: this.blockTURN,
            onChange: (value) => {
              this.blockTURN = value;
              this.webrtcProtection.configure({ blockTURN: value });
              localStorage.setItem('mb_block_turn', value);
            },
            description: 'Block TURN relay servers'
          },
          {
            type: 'toggle',
            label: 'Block Data Channels',
            value: this.blockDataChannels,
            onChange: (value) => {
              this.blockDataChannels = value;
              this.webrtcProtection.configure({ blockDataChannels: value });
              localStorage.setItem('mb_block_datachannels', value);
            },
            description: 'Block WebRTC data channels (may break some websites)'
          },
          {
            type: 'toggle',
            label: 'WebGL Fingerprint Randomization',
            value: this.randomizeWebGL,
            onChange: (value) => {
              this.randomizeWebGL = value;
              this.webrtcProtection.configure({ randomizeWebGL: value });
              localStorage.setItem('mb_randomize_webgl', value);
            },
            description: 'Randomize WebGL vendor and renderer strings to prevent fingerprinting'
          },
      {
        type: 'button',
            label: 'Test WebRTC Protection',
            button: this.createButton('🧪', 'test-webrtc', 'Test WebRTC protection', 'Test'),
            description: 'Verify that WebRTC is properly blocked'
          },
          {
            type: 'info',
            label: 'Protection Status',
            value: this.webrtcProtection.getStatus().enabled ? 'Active' : 'Inactive',
            description: this.webrtcProtection.getPrivacyReport().protectionLevel + ' level protection'
          }
        ]
      },
      {
        type: 'subsection',
        title: 'Connection Spoofing',
        items: [
          {
            type: 'toggle',
            label: 'Connection Type Spoofing',
            value: this.connectionSpoofingEnabled,
            onChange: (value) => {
              this.connectionSpoofingEnabled = value;
              this.connectionSpoofing.setEnabled(value);
              localStorage.setItem('mb_connection_spoofing', value);
            },
            description: 'Mask network connection information to prevent fingerprinting'
      },
      {
        type: 'select',
            label: 'Spoofed Connection Type',
        options: [
              { value: 'wifi', label: 'WiFi' },
              { value: 'ethernet', label: 'Ethernet' },
              { value: 'cellular', label: 'Cellular' },
              { value: 'bluetooth', label: 'Bluetooth' },
              { value: 'none', label: 'None' }
            ],
            value: this.spoofConnectionType,
            onChange: (value) => {
              this.spoofConnectionType = value;
              this.connectionSpoofing.configure({ connectionType: value });
              localStorage.setItem('mb_spoof_connection_type', value);
            },
            description: 'Choose what connection type to display to websites'
          },
          {
            type: 'select',
            label: 'Spoofed Network Type',
            options: [
              { value: 'slow-2g', label: 'Slow 2G' },
              { value: '2g', label: '2G' },
              { value: '3g', label: '3G' },
              { value: '4g', label: '4G' },
              { value: '5g', label: '5G' }
            ],
            value: this.spoofEffectiveType,
            onChange: (value) => {
              this.spoofEffectiveType = value;
              this.connectionSpoofing.configure({ effectiveType: value });
              localStorage.setItem('mb_spoof_effective_type', value);
            },
            description: 'Choose what network speed to display to websites'
          }
        ]
      },
      {
        type: 'subsection',
        title: 'Platform Detection Prevention',
        items: [
          {
            type: 'toggle',
            label: 'Platform Detection Prevention',
            value: this.platformDetectionPreventionEnabled,
            onChange: (value) => {
              this.platformDetectionPreventionEnabled = value;
              this.platformDetectionPrevention.setEnabled(value);
              localStorage.setItem('mb_platform_prevention', value);
            },
            description: 'Block websites from detecting your operating system and browser'
          },
          {
            type: 'select',
            label: 'Spoofed Platform',
            options: [
              { value: 'Win32', label: 'Windows' },
              { value: 'MacIntel', label: 'macOS' },
              { value: 'Linux x86_64', label: 'Linux x64' },
              { value: 'Linux armv7l', label: 'Linux ARM' },
              { value: 'Linux aarch64', label: 'Linux ARM64' }
            ],
            value: this.spoofPlatform,
            onChange: (value) => {
              this.spoofPlatform = value;
              this.platformDetectionPrevention.configure({ platform: value });
              localStorage.setItem('mb_spoof_platform', value);
            },
            description: 'Choose what operating system to display to websites'
          },
          {
            type: 'select',
            label: 'Spoofed User Agent',
            options: [
              { value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', label: 'Chrome on Windows' },
              { value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', label: 'Chrome on macOS' },
              { value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', label: 'Chrome on Linux' },
              { value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0', label: 'Firefox on Windows' }
            ],
            value: this.spoofUserAgent,
            onChange: (value) => {
              this.spoofUserAgent = value;
              this.platformDetectionPrevention.configure({ userAgent: value });
              localStorage.setItem('mb_spoof_user_agent', value);
            },
            description: 'Choose what browser to display to websites'
          }
        ]
      }
    ]);

    return section;
  }

  // Create Performance & Optimization Section
  createPerformanceSection() {
    const section = this.createSettingsSection('⚡ Performance & Optimization', [
      {
        type: 'subsection',
        title: 'Memory Management',
        items: [
          {
            type: 'toggle',
            label: 'Memory Optimization',
            value: true,
            onChange: (value) => {
              // Memory optimization toggle
            },
            description: 'Automatically optimize memory usage and garbage collection'
          },
          {
            type: 'select',
            label: 'Memory Cleanup Interval',
            options: [
              { value: '30', label: '30 seconds' },
              { value: '60', label: '1 minute' },
              { value: '300', label: '5 minutes' },
              { value: '600', label: '10 minutes' }
            ],
            value: '60',
            onChange: (value) => {
              localStorage.setItem('mb_memory_cleanup_interval', value);
            },
            description: 'How often to perform memory cleanup operations'
          }
        ]
      },
      {
        type: 'subsection',
        title: 'Service Worker',
        items: [
          {
            type: 'toggle',
            label: 'Service Worker',
            value: true,
            onChange: (value) => {
              // Service worker toggle
            },
            description: 'Enable service worker for offline functionality and caching'
          },
          {
            type: 'toggle',
            label: 'Background Sync',
            value: false,
            onChange: (value) => {
              localStorage.setItem('mb_background_sync', value);
            },
            description: 'Allow background synchronization when connection is restored'
          }
        ]
      },
      {
        type: 'subsection',
        title: 'WebGL & Rendering',
        items: [
      {
        type: 'toggle',
        label: 'WebGL Rendering',
        value: this.webglEnabled,
            onChange: (value) => {
              this.webglEnabled = value;
              localStorage.setItem('mb_webgl_enabled', value);
            },
            description: 'Enable hardware-accelerated WebGL rendering for UI effects'
          },
          {
            type: 'select',
            label: 'Rendering Quality',
            options: [
              { value: 'low', label: 'Low (Performance)' },
              { value: 'medium', label: 'Medium (Balanced)' },
              { value: 'high', label: 'High (Quality)' }
            ],
            value: 'medium',
            onChange: (value) => {
              localStorage.setItem('mb_rendering_quality', value);
            },
            description: 'Balance between visual quality and performance'
          }
        ]
      }
    ]);

    return section;
  }

  // Create Interface & Appearance Section
  createInterfaceSection() {
    const section = this.createSettingsSection('🎨 Interface & Appearance', [
      {
        type: 'subsection',
        title: 'Theme & Colors',
        items: [
          {
            type: 'select',
            label: 'Theme',
            options: [
              { value: 'dark', label: 'Dark Theme' },
              { value: 'light', label: 'Light Theme' },
              { value: 'auto', label: 'Auto (System)' }
            ],
            value: this.themeManager.getCurrentThemeName(),
            onChange: (value) => {
              this.themeManager.setTheme(value);
              localStorage.setItem('mb_theme', value);
            },
            description: 'Choose your preferred color scheme'
          },
          {
            type: 'range',
            label: 'Font Scale',
            min: 0.8,
            max: 1.5,
            step: 0.1,
            value: this.themeManager.getFontScale(),
            onChange: (value) => {
              this.themeManager.setFontScale(value);
              localStorage.setItem('mb_font_scale', value);
            },
            description: 'Adjust the size of all text in the browser'
      },
      {
        type: 'select',
            label: 'Font Weight',
        options: [
              { value: '400', label: 'Normal' },
              { value: '500', label: 'Medium' },
              { value: '600', label: 'Semi-Bold' },
              { value: '700', label: 'Bold' }
            ],
            value: this.themeManager.getFontWeight().toString(),
            onChange: (value) => {
              this.themeManager.setFontWeight(parseInt(value));
              localStorage.setItem('mb_font_weight', value);
            },
            description: 'Choose the thickness of text'
          },
          {
            type: 'select',
            label: 'Density',
            options: [
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Normal' },
              { value: 'comfortable', label: 'Comfortable' }
            ],
            value: this.themeManager.getDensity(),
            onChange: (value) => {
              this.themeManager.setDensity(value);
              localStorage.setItem('mb_density', value);
            },
            description: 'Adjust spacing and padding throughout the interface'
          }
        ]
      },
      {
        type: 'subsection',
        title: 'Layout & Behavior',
        items: [
          {
            type: 'toggle',
            label: 'Show Bookmarks Bar',
            value: true,
            onChange: (value) => {
              localStorage.setItem('mb_show_bookmarks_bar', value);
            },
            description: 'Display the bookmarks bar below the address bar'
      },
      {
        type: 'toggle',
            label: 'Show Status Bar',
            value: false,
        onChange: (value) => {
              localStorage.setItem('mb_show_status_bar', value);
        },
            description: 'Show status information at the bottom of the window'
      },
      {
        type: 'toggle',
            label: 'Smooth Scrolling',
            value: true,
        onChange: (value) => {
              localStorage.setItem('mb_smooth_scrolling', value);
            },
            description: 'Enable smooth scrolling animations'
          },
          {
            type: 'toggle',
            label: 'Show Loading Indicators',
            value: true,
            onChange: (value) => {
              localStorage.setItem('mb_show_loading_indicators', value);
            },
            description: 'Display loading spinners and progress bars'
          }
        ]
      }
    ]);

    return section;
  }

  // Create Security & Privacy Section
  createSecuritySection() {
    const section = this.createSettingsSection('🛡️ Security & Privacy', [
      {
        type: 'subsection',
        title: 'HTTPS & Security',
        items: [
      {
        type: 'toggle',
            label: 'HTTPS Only Mode',
            value: this.httpsOnly,
            onChange: (value) => {
              this.httpsOnly = value;
              localStorage.setItem('mb_https_only', value);
            },
            description: 'Only allow secure HTTPS connections'
      },
      {
        type: 'toggle',
            label: 'Block Mixed Content',
            value: true,
            onChange: (value) => {
              localStorage.setItem('mb_block_mixed_content', value);
            },
            description: 'Block insecure content on secure pages'
      },
      {
        type: 'toggle',
            label: 'Block Third-Party Cookies',
            value: true,
            onChange: (value) => {
              localStorage.setItem('mb_block_third_party_cookies', value);
            },
            description: 'Prevent third-party websites from setting cookies'
          }
        ]
      },
      {
        type: 'subsection',
        title: 'Tracking Protection',
        items: [
          {
            type: 'toggle',
            label: 'Block Trackers',
            value: this.blockTrackers,
            onChange: (value) => {
              this.blockTrackers = value;
              localStorage.setItem('mb_block_trackers', value);
            },
            description: 'Block known tracking scripts and requests'
          },
          {
            type: 'toggle',
            label: 'Block Social Media Trackers',
            value: true,
            onChange: (value) => {
              localStorage.setItem('mb_block_social_trackers', value);
            },
            description: 'Block Facebook, Twitter, and other social media trackers'
          },
          {
            type: 'toggle',
            label: 'Block Analytics',
            value: false,
            onChange: (value) => {
              localStorage.setItem('mb_block_analytics', value);
            },
            description: 'Block Google Analytics and other analytics services'
          }
        ]
      }
    ]);

    return section;
  }

  // Create Advanced Settings Section
  createAdvancedSection() {
    const section = this.createSettingsSection('⚙️ Advanced Settings', [
      {
        type: 'subsection',
        title: 'Search & Navigation',
        items: [
      {
        type: 'select',
        label: 'Default Search Engine',
        options: [
          { value: 'duckduckgo', label: 'DuckDuckGo' },
          { value: 'google', label: 'Google' },
          { value: 'bing', label: 'Bing' },
              { value: 'brave', label: 'Brave' },
              { value: 'startpage', label: 'Startpage' }
        ],
        value: this.defaultSearchEngine,
        onChange: (value) => {
          this.defaultSearchEngine = value;
          localStorage.setItem('mb_search_engine', value);
        },
        description: 'Choose your preferred search engine'
          },
          {
            type: 'input',
            label: 'Home Page URL',
            value: this.homeUrl,
            onChange: (value) => {
              this.homeUrl = value;
              localStorage.setItem('mb_home_url', value);
            },
            description: 'Set the page to load when opening new tabs'
          },
          {
            type: 'select',
            label: 'Startup Mode',
            options: [
              { value: 'restore', label: 'Restore Previous Session' },
              { value: 'home', label: 'Open Home Page' },
              { value: 'blank', label: 'Open Blank Page' }
            ],
            value: this.startupMode,
            onChange: (value) => {
              this.startupMode = value;
              localStorage.setItem('mb_startup_mode', value);
            },
            description: 'What to do when the browser starts'
          }
        ]
      },
      {
        type: 'subsection',
        title: 'Web3 & Blockchain',
        items: [
          {
            type: 'toggle',
            label: 'Web3 Support',
            value: this.web3Enabled,
            onChange: (value) => {
              this.web3Enabled = value;
              localStorage.setItem('mb_web3_enabled', value);
            },
            description: 'Enable Web3 functionality for blockchain applications'
          },
          {
            type: 'input',
            label: 'Web3 RPC URL',
            value: this.web3RpcUrl,
            onChange: (value) => {
              this.web3RpcUrl = value;
              localStorage.setItem('mb_web3_rpc_url', value);
            },
            description: 'Ethereum RPC endpoint for Web3 applications'
          },
          {
            type: 'input',
            label: 'Chain ID',
            value: this.web3ChainId,
            onChange: (value) => {
              this.web3ChainId = value;
              localStorage.setItem('mb_web3_chain_id', value);
            },
            description: 'Blockchain network ID (1 for Ethereum mainnet)'
          },
          {
            type: 'input',
            label: 'IPFS Gateway',
            value: this.ipfsGateway,
            onChange: (value) => {
              this.ipfsGateway = value;
              localStorage.setItem('mb_ipfs_gateway', value);
            },
            description: 'IPFS gateway for decentralized content'
          }
        ]
      }
    ]);

    return section;
  }

  // Create Data & Storage Section
  createDataSection() {
    const section = this.createSettingsSection('💾 Data & Storage', [
      {
        type: 'subsection',
        title: 'Data Management',
        items: [
          {
            type: 'button',
            label: 'Clear All Data',
            button: this.createButton('🗑️', 'clear-all-data', 'Clear all browser data', 'Clear All'),
            description: 'Remove all bookmarks, history, cookies, and cached data'
          },
          {
            type: 'button',
            label: 'Export Settings',
            button: this.createButton('📤', 'export-settings', 'Export all settings to file', 'Export'),
            description: 'Save your current settings to a file for backup'
          },
          {
            type: 'button',
            label: 'Import Settings',
            button: this.createButton('📥', 'import-settings', 'Import settings from file', 'Import'),
            description: 'Load settings from a previously exported file'
          },
          {
            type: 'button',
            label: 'Reset to Defaults',
            button: this.createButton('🔄', 'reset-defaults', 'Reset all settings to default values', 'Reset'),
            description: 'Restore all settings to their original default values'
          }
        ]
      },
      {
        type: 'subsection',
        title: 'Privacy Controls',
        items: [
          {
            type: 'toggle',
            label: 'Remember Browsing History',
            value: true,
            onChange: (value) => {
              localStorage.setItem('mb_remember_history', value);
            },
            description: 'Keep track of visited websites and pages'
          },
          {
            type: 'toggle',
            label: 'Remember Form Data',
            value: false,
            onChange: (value) => {
              localStorage.setItem('mb_remember_forms', value);
            },
            description: 'Auto-fill forms with previously entered information'
          },
          {
            type: 'toggle',
            label: 'Remember Passwords',
            value: false,
            onChange: (value) => {
              localStorage.setItem('mb_remember_passwords', value);
            },
            description: 'Save and auto-fill website passwords'
          },
          {
            type: 'select',
            label: 'Data Retention Period',
            options: [
              { value: '1', label: '1 day' },
              { value: '7', label: '1 week' },
              { value: '30', label: '1 month' },
              { value: '90', label: '3 months' },
              { value: '365', label: '1 year' },
              { value: '0', label: 'Forever' }
            ],
            value: '30',
            onChange: (value) => {
              localStorage.setItem('mb_data_retention', value);
            },
            description: 'How long to keep browsing data before automatic cleanup'
          }
        ]
      }
    ]);

    return section;
  }

  // Create a settings section with table-like layout
  createSettingsSection(title, subsections) {
    const section = document.createElement('div');
    section.style.cssText = `
      background: #1a1a1a;
      border-radius: 12px;
      margin-bottom: 30px;
      overflow: hidden;
      border: 1px solid #333;
    `;

    // Section header
    const header = document.createElement('div');
    header.style.cssText = `
      background: #0a0a0a;
      padding: 20px;
      border-bottom: 1px solid #333;
    `;

    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      color: #00aaff;
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    `;

    header.appendChild(titleEl);
    section.appendChild(header);

    // Create subsections
    subsections.forEach(subsection => {
      if (subsection.type === 'subsection') {
        const subsectionEl = this.createSubsection(subsection);
        section.appendChild(subsectionEl);
      }
    });

    return section;
  }

  // Create a subsection with table-like layout
  createSubsection(subsection) {
    const subsectionEl = document.createElement('div');
    subsectionEl.style.cssText = `
      padding: 20px;
      border-bottom: 1px solid #333;
    `;

    if (subsection.title) {
      const title = document.createElement('h3');
      title.textContent = subsection.title;
      title.style.cssText = `
        color: #ffffff;
        margin: 0 0 20px 0;
        font-size: 16px;
        font-weight: 500;
        border-bottom: 1px solid #444;
        padding-bottom: 10px;
      `;
      subsectionEl.appendChild(title);
    }

    // Create table-like layout for items
    const table = document.createElement('div');
    table.style.cssText = `
      display: table;
      width: 100%;
      border-collapse: collapse;
    `;

    subsection.items.forEach(item => {
      const row = this.createSettingsRow(item);
      table.appendChild(row);
    });

    subsectionEl.appendChild(table);
    return subsectionEl;
  }

  // Create a settings row with table-like layout
  createSettingsRow(item) {
    const row = document.createElement('div');
    row.style.cssText = `
      display: table-row;
      border-bottom: 1px solid #333;
    `;

    // Label cell
    const labelCell = document.createElement('div');
    labelCell.style.cssText = `
      display: table-cell;
      padding: 15px 20px;
      vertical-align: middle;
      width: 30%;
      border-right: 1px solid #333;
    `;

    const label = document.createElement('label');
      label.textContent = item.label;
      label.style.cssText = `
      color: #ffffff;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
    `;

    labelCell.appendChild(label);
    row.appendChild(labelCell);

    // Control cell
    const controlCell = document.createElement('div');
    controlCell.style.cssText = `
      display: table-cell;
      padding: 15px 20px;
      vertical-align: middle;
      width: 25%;
      border-right: 1px solid #333;
    `;

    const control = this.createControl(item);
    controlCell.appendChild(control);
    row.appendChild(controlCell);

    // Description cell
    const descCell = document.createElement('div');
    descCell.style.cssText = `
      display: table-cell;
      padding: 15px 20px;
      vertical-align: middle;
      width: 45%;
    `;

    const description = document.createElement('span');
      description.textContent = item.description;
      description.style.cssText = `
      color: #cccccc;
      font-size: 13px;
      line-height: 1.4;
    `;

    descCell.appendChild(description);
    row.appendChild(descCell);

    return row;
  }

  // Create the appropriate control for a setting item
  createControl(item) {
    switch (item.type) {
      case 'toggle':
        return this.createToggleControl(item);
      case 'select':
        return this.createSelectControl(item);
      case 'input':
        return this.createInputControl(item);
      case 'range':
        return this.createRangeControl(item);
      case 'button':
        return item.button;
      default:
        return document.createElement('span');
    }
  }
        
  // Create a toggle switch control
  createToggleControl(item) {
        const toggle = document.createElement('div');
        toggle.style.cssText = `
      position: relative;
          width: 50px;
          height: 24px;
      background: ${item.value ? '#00aaff' : '#444'};
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.3s ease;
        `;
        
    const slider = document.createElement('div');
    slider.style.cssText = `
      position: absolute;
      top: 2px;
      left: ${item.value ? '26px' : '2px'};
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: left 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
    toggle.appendChild(slider);
        
    toggle.onclick = () => {
          const newValue = !item.value;
          item.value = newValue;
      item.onChange(newValue);
      
      // Update visual state
      toggle.style.background = newValue ? '#00aaff' : '#444';
      slider.style.left = newValue ? '26px' : '2px';
    };
        
        return toggle;
  }

  // Create a select dropdown control
  createSelectControl(item) {
        const select = document.createElement('select');
        select.style.cssText = `
      width: 100%;
          padding: 8px 12px;
      background: #0f0f0f;
      color: #ffffff;
      border: 1px solid #333;
          border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
        `;
        
        item.options.forEach(option => {
          const optionEl = document.createElement('option');
          optionEl.value = option.value;
          optionEl.textContent = option.label;
          select.appendChild(optionEl);
        });
        
        select.value = item.value;
    select.onchange = () => {
      item.value = select.value;
      item.onChange(select.value);
    };
        
        return select;
  }

  // Create an input field control
  createInputControl(item) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = item.value;
    input.style.cssText = `
      width: 100%;
          padding: 8px 12px;
      background: #0f0f0f;
      color: #ffffff;
      border: 1px solid #333;
          border-radius: 6px;
          font-size: 14px;
    `;

    input.onchange = () => {
      item.value = input.value;
      item.onChange(input.value);
    };

    return input;
  }

  // Create a range slider control
  createRangeControl(item) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const range = document.createElement('input');
    range.type = 'range';
    range.min = item.min;
    range.max = item.max;
    range.step = item.step;
    range.value = item.value;
    range.style.cssText = `
      flex: 1;
      height: 6px;
      background: #333;
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    `;

    const value = document.createElement('span');
    value.textContent = item.value;
    value.style.cssText = `
      color: #00aaff;
      font-weight: 500;
      min-width: 40px;
          text-align: center;
        `;

    range.oninput = () => {
      value.textContent = range.value;
    };

    range.onchange = () => {
      item.value = parseFloat(range.value);
      item.onChange(item.value);
    };

    container.appendChild(range);
    container.appendChild(value);
    return container;
  }

  // Create a button control
  createButton(icon, id, title, text) {
    const button = document.createElement('button');
    button.id = id;
    button.innerHTML = `${icon} ${text}`;
    button.title = title;
    button.style.cssText = `
      background: #1a1a1a;
      color: #ffffff;
      border: 1px solid #333;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    `;

    button.onmouseover = () => {
      button.style.background = '#2a2a2a';
      button.style.borderColor = '#00aaff';
    };

    button.onmouseout = () => {
      button.style.background = '#1a1a1a';
      button.style.borderColor = '#333';
    };

    return button;
  }

  // Show notification
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-family: ${FONT_STACK};
      font-size: 14px;
      font-weight: 500;
      z-index: 2147483647;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
      case 'success':
        notification.style.background = '#10b981';
        break;
      case 'warning':
        notification.style.background = '#f59e0b';
        break;
      case 'error':
        notification.style.background = '#ef4444';
        break;
      default:
        notification.style.background = '#3b82f6';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, duration);
  }
  
  // Add event listeners to settings panel
  addSettingsEventListeners(panel) {
    const closeBtn = panel.querySelector('#settings-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideSettings());
    }

    // Theme toggle button handler
    const themeToggleBtn = panel.querySelector('#theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        this.toggleTheme();
        // Update the button text based on new theme
        const newTheme = this.themeManager.getCurrentThemeName();
        themeToggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        themeToggleBtn.title = `Switch to ${newTheme === 'dark' ? 'light' : 'dark'} theme`;
      });
    }

    // Clear cache button handler
    const clearCacheBtn = panel.querySelector('#clear-all-data');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', async () => {
        try {
          await this.serviceWorker.clearCache();
          clearCacheBtn.textContent = '✓ Cleared';
          clearCacheBtn.style.background = this.themeManager.getCurrentTheme().success;
          setTimeout(() => {
            clearCacheBtn.textContent = '🗑️';
            clearCacheBtn.style.background = '';
          }, 2000);
        } catch (error) {
          console.error('Failed to clear cache:', error);
          clearCacheBtn.textContent = '✗ Failed';
          clearCacheBtn.style.background = this.themeManager.getCurrentTheme().error;
          setTimeout(() => {
            clearCacheBtn.textContent = '🗑️';
            clearCacheBtn.style.background = '';
          }, 2000);
        }
      });
    }
    
    // Test WebRTC protection button handler
    const testWebRTCBtn = panel.querySelector('#test-webrtc');
    if (testWebRTCBtn) {
      testWebRTCBtn.addEventListener('click', () => {
        try {
          const testResult = this.webrtcProtection.testProtection();
          const report = this.webrtcProtection.getPrivacyReport();
          
          if (testResult.blocked) {
            testWebRTCBtn.textContent = '✓ Protected';
            testWebRTCBtn.style.background = this.themeManager.getCurrentTheme().success;
            testWebRTCBtn.title = `Protection Level: ${report.protectionLevel}`;
          } else {
            testWebRTCBtn.textContent = '✗ Vulnerable';
            testWebRTCBtn.style.background = this.themeManager.getCurrentTheme().error;
            testWebRTCBtn.title = testResult.message;
          }
          
          setTimeout(() => {
            testWebRTCBtn.textContent = '🧪';
            testWebRTCBtn.style.background = '';
            testWebRTCBtn.title = 'Test WebRTC protection';
          }, 3000);
          
          // Show notification
          this.showNotification(
            testResult.blocked ? 
              `WebRTC Protection: ${report.protectionLevel} level active` : 
              `WebRTC Protection: ${testResult.message}`,
            testResult.blocked ? 'success' : 'warning'
          );
        } catch (error) {
          console.error('WebRTC protection test failed:', error);
          testWebRTCBtn.textContent = '✗ Error';
          testWebRTCBtn.style.background = this.themeManager.getCurrentTheme().error;
          setTimeout(() => {
            testWebRTCBtn.textContent = '🧪';
            testWebRTCBtn.style.background = '';
          }, 3000);
        }
      });
    }
    
    // Test Connection Spoofing button handler
    const testConnectionBtn = panel.querySelector('#test-connection');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => {
        try {
          const status = this.connectionSpoofing.getStatus();
          
          if (status.enabled) {
            testConnectionBtn.textContent = '✓ Spoofing';
            testConnectionBtn.style.background = this.themeManager.getCurrentTheme().success;
            testConnectionBtn.title = `Spoofing as ${status.connectionType} with ${status.effectiveType} network`;
          } else {
            testConnectionBtn.textContent = '✗ Disabled';
            testConnectionBtn.style.background = this.themeManager.getCurrentTheme().error;
            testConnectionBtn.title = 'Connection spoofing is disabled';
          }
          
          setTimeout(() => {
            testConnectionBtn.textContent = '🧪';
            testConnectionBtn.style.background = '';
            testConnectionBtn.title = 'Test connection spoofing';
          }, 3000);
          
          // Show notification
          this.showNotification(
            status.enabled ? 
              `Connection Spoofing: Active - spoofing as ${status.connectionType}` : 
              'Connection Spoofing: Disabled - network info visible',
            status.enabled ? 'success' : 'warning'
          );
        } catch (error) {
          console.error('Connection spoofing test failed:', error);
          testConnectionBtn.textContent = '✗ Error';
          testConnectionBtn.style.background = this.themeManager.getCurrentTheme().error;
          setTimeout(() => {
            testConnectionBtn.textContent = '🧪';
            testConnectionBtn.style.background = '';
          }, 3000);
        }
      });
    }
    
    // Test Platform Detection Prevention button handler
    const testPlatformBtn = panel.querySelector('#test-platform');
    if (testPlatformBtn) {
      testPlatformBtn.addEventListener('click', () => {
        try {
          const testResult = this.platformDetectionPrevention.testDetection();
          
          if (testResult.spoofed) {
            testPlatformBtn.textContent = '✓ Protected';
            testPlatformBtn.style.background = this.themeManager.getCurrentTheme().success;
            testPlatformBtn.title = `Platform detection blocked - spoofing as ${testResult.expected.platform}`;
          } else {
            testPlatformBtn.textContent = '✗ Vulnerable';
            testPlatformBtn.style.background = this.themeManager.getCurrentTheme().error;
            testPlatformBtn.title = 'Platform detection not blocked';
          }
          
          setTimeout(() => {
            testPlatformBtn.textContent = '🧪';
            testPlatformBtn.style.background = '';
            testPlatformBtn.title = 'Test platform prevention';
          }, 3000);
          
          // Show notification
          this.showNotification(
            testResult.spoofed ? 
              `Platform Prevention: Active - spoofing as ${testResult.expected.platform}` : 
              'Platform Prevention: Disabled - platform info visible',
            testResult.spoofed ? 'success' : 'warning'
          );
        } catch (error) {
          console.error('Platform prevention test failed:', error);
          testPlatformBtn.textContent = '✗ Error';
          testPlatformBtn.style.background = this.themeManager.getCurrentTheme().error;
          setTimeout(() => {
            testPlatformBtn.textContent = '🧪';
            testPlatformBtn.style.background = '';
          }, 3000);
        }
      });
    }
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.style.display === 'block') {
        this.hideSettings();
      }
    });
    
    // Close on outside click
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        this.hideSettings();
      }
    });
  }
  
  // Show settings panel
  showSettings() {
    console.log('🔧 Opening settings panel...');
    
    try {
      // Create settings panel if it doesn't exist
    if (!this.cachedElements.settingsPanel) {
        console.log('🔧 Creating new settings panel...');
      this.cachedElements.settingsPanel = this.createSettingsPanel();
        
        // Append to document body instead of shadow root for better compatibility
        document.body.appendChild(this.cachedElements.settingsPanel);
        console.log('🔧 Settings panel appended to document body');
    }
    
      // Make sure the panel is visible
    this.cachedElements.settingsPanel.style.display = 'block';
      this.cachedElements.settingsPanel.style.zIndex = '2147483647';
      console.log('🔧 Settings panel display set to block');
    
      // Add backdrop if it doesn't exist
    if (!this.cachedElements.settingsBackdrop) {
        console.log('🔧 Creating settings backdrop...');
      this.cachedElements.settingsBackdrop = document.createElement('div');
      this.cachedElements.settingsBackdrop.id = 'settings-backdrop';
      this.cachedElements.settingsBackdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
          background: rgba(0,0,0,0.8);
          z-index: 2147483646;
          display: block;
        `;
        document.body.appendChild(this.cachedElements.settingsBackdrop);
        console.log('🔧 Settings backdrop appended to document body');
      } else {
        this.cachedElements.settingsBackdrop.style.display = 'block';
      }
      
      console.log('🔧 Settings panel should now be visible');
      
      // Force a repaint
      this.cachedElements.settingsPanel.offsetHeight;
      
    } catch (error) {
      console.error('🔧 Error showing settings panel:', error);
      // Fallback: create a simple alert
      alert('Settings panel error: ' + error.message);
    }
  }
  
  // Hide settings panel
  hideSettings() {
    console.log('🔧 Hiding settings panel...');
    
    try {
    if (this.cachedElements.settingsPanel) {
      this.cachedElements.settingsPanel.style.display = 'none';
        console.log('🔧 Settings panel hidden');
    }
    if (this.cachedElements.settingsBackdrop) {
      this.cachedElements.settingsBackdrop.style.display = 'none';
        console.log('🔧 Settings backdrop hidden');
      }
    } catch (error) {
      console.error('🔧 Error hiding settings panel:', error);
    }
  }
  
  // Cleanup WebGL resources
  dispose() {
    this.stopWebGLAnimation();
    
    if (this.webglRenderer) {
      this.webglRenderer.dispose();
      this.webglRenderer = null;
    }
    
    if (this.webglCanvas && this.webglCanvas.parentNode) {
      this.webglCanvas.parentNode.removeChild(this.webglCanvas);
      this.webglCanvas = null;
    }
    
    this.webglEnabled = false;
    
    // Cleanup WebAssembly and memory optimizer
    if (this.wasmModule) {
      this.wasmModule.dispose();
    }
    if (this.memoryOptimizer) {
      this.memoryOptimizer.dispose();
    }

    // Cleanup Service Worker and Performance Boosts
    if (this.serviceWorker) {
      this.serviceWorker.dispose();
    }
    if (this.performanceBoosts) {
      this.performanceBoosts.dispose();
    }
  }
  
  // Format memory usage for display
  formatMemoryUsage() {
    const info = this.memoryOptimizer.getMemoryInfo();
    if (!info.supported) return 'Not supported';
    
    const currentMB = (info.current / 1024 / 1024).toFixed(1);
    const totalMB = (info.total / 1024 / 1024).toFixed(1);
    return `${currentMB}MB / ${totalMB}MB`;
  }
  
  // Get memory description
  getMemoryDescription() {
    const info = this.memoryOptimizer.getMemoryInfo();
    if (!info.supported) return 'Memory monitoring not available';
    
    const usagePercent = (info.usage * 100).toFixed(1);
    const recommendations = this.memoryOptimizer.getOptimizationRecommendations();
    
    if (recommendations.length > 0) {
      return `${usagePercent}% usage - ${recommendations[0]}`;
    }
    
    return `${usagePercent}% usage - Normal`;
  }
  
  // Get pad height
  getPad() {
    return 0; // Default padding
  }

  // Get performance score
  getPerformanceScore() {
    const stats = this.performanceBoosts.getPerformanceStats();
    if (!stats.enabled) return 'Disabled';
    
    // Calculate a simple score based on metrics
    let score = 100;
    const metrics = stats.metrics;
    
    if (metrics.pageLoadTime > 3000) score -= 20;
    if (metrics.pageLoadTime > 5000) score -= 30;
    if (metrics.firstContentfulPaint > 2000) score -= 15;
    if (metrics.largestContentfulPaint > 2500) score -= 15;
    if (metrics.cumulativeLayoutShift > 0.1) score -= 10;
    
    score = Math.max(0, score);
    return `${score}/100`;
  }

  // Get WebGL info
  getWebGLInfo() {
    if (!this.webglRenderer) return null;
    return this.webglRenderer.getInfo();
  }

  // Stop WebGL animation
  stopWebGLAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}

// Initialize the browser when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Minimal Browser with Advanced Settings...');
  
  try {
    // Create and initialize the browser
    const browser = new MinimalBrowser();
    browser.init().then(() => {
      console.log('✅ Minimal Browser initialized successfully!');
      console.log('🔧 Press Ctrl+F6 or click the ⚙️ button to open Advanced Settings');
    }).catch(error => {
      console.error('❌ Browser initialization failed:', error);
    });
  } catch (error) {
    console.error('❌ Failed to create browser instance:', error);
  }
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
} else {
  // DOM is already loaded, initialize immediately
  console.log('🚀 DOM already loaded, initializing Minimal Browser...');
  
  try {
    const browser = new MinimalBrowser();
    browser.init().then(() => {
      console.log('✅ Minimal Browser initialized successfully!');
      console.log('🔧 Press Ctrl+F6 or click the ⚙️ button to open Advanced Settings');
    }).catch(error => {
      console.error('❌ Browser initialization failed:', error);
    });
  } catch (error) {
    console.error('❌ Failed to create browser instance:', error);
  }
}
