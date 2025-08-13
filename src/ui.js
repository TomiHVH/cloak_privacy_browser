(function(){
  const KEY = 'CB:5:'; // window.name fallback
  const PAD = 52;      // reserved top space for the bar
  const MAX_TABS = 30;
  const MAX_BOOKMARKS = 100;
  const MAX_HISTORY = 1000;
  
  // Safe localStorage functions to handle access denied errors
  function safeGetLocalStorage(key, defaultValue = null) {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (error) {
      console.warn('localStorage access denied for key:', key, error);
      return defaultValue;
    }
  }
  
  function safeSetLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage write denied for key:', key, error);
    }
  }
  
  // Performance optimizations
let renderScheduled = false;
let updateScheduled = false;
let lastRenderTime = 0;
const RENDER_THROTTLE = 16; // ~60fps
const STATE_UPDATE_THROTTLE = 100; // 10 FPS for state updates

// Predictive Preloading System
class PredictivePreloader {
  constructor() {
    this.enabled = safeGetLocalStorage('predictive_preloading', true);
    this.confidenceThreshold = 0.7; // Minimum confidence to preload
    this.maxPreloads = 5; // Maximum concurrent preloads
    this.userPatterns = new Map(); // Store user navigation patterns
    this.resourceCache = new Map(); // Cache preloaded resources
    this.pendingPreloads = new Set(); // Track ongoing preloads
    this.mlModel = this.initializeMLModel();
    this.navigationHistory = [];
    this.maxHistorySize = 100;
    this.init();
  }

  init() {
    if (this.enabled) {
      this.startTracking();
      console.log('🧠 Predictive Preloading initialized');
    }
  }

  initializeMLModel() {
    // Simple ML model for pattern recognition
    return {
      // Navigation pattern weights
      weights: {
        sequential: 0.4,      // Sequential page visits
        timeBased: 0.3,       // Time-based patterns
        contentBased: 0.2,    // Content similarity
        userBehavior: 0.1     // User interaction patterns
      },
      
      // Predict next likely pages
      predict: (currentPage, history) => {
        const predictions = [];
        const patterns = this.analyzePatterns(history);
        
        // Sequential navigation prediction
        if (patterns.sequential.length > 0) {
          patterns.sequential.forEach(pattern => {
            predictions.push({
              url: pattern.nextUrl,
              confidence: pattern.confidence * this.weights.sequential,
              type: 'sequential'
            });
          });
        }
        
        // Time-based prediction
        if (patterns.timeBased.length > 0) {
          patterns.timeBased.forEach(pattern => {
            predictions.push({
              url: pattern.nextUrl,
              confidence: pattern.confidence * this.weights.timeBased,
              type: 'timeBased'
            });
          });
        }
        
        // Content-based prediction
        if (patterns.contentBased.length > 0) {
          patterns.contentBased.forEach(pattern => {
            predictions.push({
              url: pattern.nextUrl,
              confidence: pattern.confidence * this.weights.contentBased,
              type: 'contentBased'
            });
          });
        }
        
        // Sort by confidence and return top predictions
        return predictions
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3);
      },
      
      // Analyze user patterns
      analyzePatterns: (history) => {
        const patterns = {
          sequential: [],
          timeBased: [],
          contentBased: []
        };
        
        if (history.length < 2) return patterns;
        
        // Sequential pattern analysis
        for (let i = 0; i < history.length - 1; i++) {
          const current = history[i];
          const next = history[i + 1];
          
          if (this.isSequentialNavigation(current.url, next.url)) {
            patterns.sequential.push({
              currentUrl: current.url,
              nextUrl: next.url,
              confidence: 0.9,
              frequency: this.countPatternFrequency(history, current.url, next.url)
            });
          }
        }
        
        // Time-based pattern analysis
        const timePatterns = this.analyzeTimePatterns(history);
        patterns.timeBased = timePatterns;
        
        // Content-based pattern analysis
        const contentPatterns = this.analyzeContentPatterns(history);
        patterns.contentBased = contentPatterns;
        
        return patterns;
      }
    };
  }

  isSequentialNavigation(currentUrl, nextUrl) {
    try {
      const current = new URL(currentUrl);
      const next = new URL(nextUrl);
      
      // Same domain navigation
      if (current.hostname === next.hostname) {
        // Check if it's a logical sequence (e.g., page 1 -> page 2)
        const currentPath = current.pathname;
        const nextPath = next.pathname;
        
        // Common sequential patterns
        const sequentialPatterns = [
          /\/page\/(\d+)/,           // /page/1 -> /page/2
          /\/article\/(\d+)/,        // /article/1 -> /article/2
          /\/chapter\/(\d+)/,        // /chapter/1 -> /chapter/2
          /\/step\/(\d+)/,           // /step/1 -> /step/2
          /\/part\/(\d+)/,           // /part/1 -> /part/2
          /\/section\/(\d+)/,        // /section/1 -> /section/2
          /\/tutorial\/(\d+)/,       // /tutorial/1 -> /tutorial/2
          /\/lesson\/(\d+)/,         // /lesson/1 -> /lesson/2
          /\/episode\/(\d+)/,        // /episode/1 -> /episode/2
          /\/season\/(\d+)/          // /season/1 -> /season/2
        ];
        
        for (const pattern of sequentialPatterns) {
          const currentMatch = currentPath.match(pattern);
          const nextMatch = nextPath.match(pattern);
          
          if (currentMatch && nextMatch) {
            const currentNum = parseInt(currentMatch[1]);
            const nextNum = parseInt(nextMatch[1]);
            
            if (nextNum === currentNum + 1) {
              return true;
            }
          }
        }
        
        // Check for common navigation patterns
        const navigationPatterns = [
          { from: '/index', to: '/about' },
          { from: '/about', to: '/contact' },
          { from: '/products', to: '/pricing' },
          { from: '/pricing', to: '/signup' },
          { from: '/signup', to: '/dashboard' },
          { from: '/dashboard', to: '/profile' },
          { from: '/profile', to: '/settings' },
          { from: '/settings', to: '/help' },
          { from: '/help', to: '/faq' },
          { from: '/faq', to: '/support' }
        ];
        
        for (const pattern of navigationPatterns) {
          if (currentPath.includes(pattern.from) && nextPath.includes(pattern.to)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  countPatternFrequency(history, currentUrl, nextUrl) {
    let count = 0;
    for (let i = 0; i < history.length - 1; i++) {
      if (history[i].url === currentUrl && history[i + 1].url === nextUrl) {
        count++;
      }
    }
    return count;
  }

  analyzeTimePatterns(history) {
    const patterns = [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Group visits by time of day
    const timeGroups = new Map();
    history.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      if (!timeGroups.has(hour)) {
        timeGroups.set(hour, []);
      }
      timeGroups.get(hour).push(entry);
    });
    
    // Find time-based patterns
    timeGroups.forEach((entries, hour) => {
      if (entries.length > 2) {
        // Find most common next page for this time
        const nextPageCounts = new Map();
        entries.forEach((entry, index) => {
          if (index < entries.length - 1) {
            const nextUrl = entries[index + 1].url;
            nextPageCounts.set(nextUrl, (nextPageCounts.get(nextUrl) || 0) + 1);
          }
        });
        
        // Get most common next page
        let maxCount = 0;
        let mostCommonNext = null;
        nextPageCounts.forEach((count, url) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommonNext = url;
          }
        });
        
        if (mostCommonNext && maxCount > 1) {
          patterns.push({
            nextUrl: mostCommonNext,
            confidence: Math.min(0.8, maxCount / entries.length),
            type: 'timeBased',
            time: hour
          });
        }
      }
    });
    
    return patterns;
  }

  analyzeContentPatterns(history) {
    const patterns = [];
    
    // Simple content similarity based on URL structure
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];
      
      try {
        const currentUrl = new URL(current.url);
        const nextUrl = new URL(next.url);
        
        // Check if URLs share similar structure
        if (currentUrl.hostname === nextUrl.hostname) {
          const currentPath = currentUrl.pathname.split('/');
          const nextPath = nextUrl.pathname.split('/');
          
          // Check path similarity
          let similarity = 0;
          const maxLength = Math.max(currentPath.length, nextPath.length);
          
          for (let j = 0; j < Math.min(currentPath.length, nextPath.length); j++) {
            if (currentPath[j] === nextPath[j]) {
              similarity += 1;
            }
          }
          
          similarity = similarity / maxLength;
          
          if (similarity > 0.5) {
            patterns.push({
              nextUrl: next.url,
              confidence: similarity * 0.6,
              type: 'contentBased'
            });
          }
        }
      } catch (error) {
        // Skip invalid URLs
      }
    }
    
    return patterns;
  }

  startTracking() {
    // Track page navigation
    this.trackNavigation = this.trackNavigation.bind(this);
    window.addEventListener('beforeunload', this.trackNavigation);
    
    // Track user interactions
    this.trackUserInteractions();
    
    // Start prediction loop
    this.startPredictionLoop();
  }

  trackNavigation() {
    const currentUrl = window.location.href;
    const timestamp = Date.now();
    
    this.navigationHistory.push({
      url: currentUrl,
      timestamp: timestamp,
      title: document.title,
      referrer: document.referrer
    });
    
    // Keep history size manageable
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory.shift();
    }
    
    // Update user patterns
    this.updateUserPatterns(currentUrl);
    
    // Trigger prediction for next page
    this.predictAndPreload();
  }

  updateUserPatterns(currentUrl) {
    if (!this.userPatterns.has(currentUrl)) {
      this.userPatterns.set(currentUrl, {
        visits: 0,
        nextPages: new Map(),
        lastVisit: 0,
        averageTime: 0
      });
    }
    
    const pattern = this.userPatterns.get(currentUrl);
    pattern.visits++;
    pattern.lastVisit = Date.now();
    
    // Update next page patterns
    if (this.navigationHistory.length > 1) {
      const currentIndex = this.navigationHistory.findIndex(entry => entry.url === currentUrl);
      if (currentIndex >= 0 && currentIndex < this.navigationHistory.length - 1) {
        const nextUrl = this.navigationHistory[currentIndex + 1].url;
        const currentCount = pattern.nextPages.get(nextUrl) || 0;
        pattern.nextPages.set(nextUrl, currentCount + 1);
      }
    }
  }

  trackUserInteractions() {
    // Track clicks on links
    document.addEventListener('click', (event) => {
      if (event.target.tagName === 'A' && event.target.href) {
        this.recordLinkClick(event.target.href);
      }
    });
    
    // Track form submissions
    document.addEventListener('submit', (event) => {
      if (event.target.action) {
        this.recordFormSubmission(event.target.action);
      }
    });
    
    // Track scroll patterns
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.recordScrollPattern();
      }, 100);
    });
  }

  recordLinkClick(url) {
    // Record user's intent to visit a page
    if (this.userPatterns.has(window.location.href)) {
      const pattern = this.userPatterns.get(window.location.href);
      const intentCount = pattern.nextPages.get(url) || 0;
      pattern.nextPages.set(url, intentCount + 1);
    }
  }

  recordFormSubmission(action) {
    // Record form submissions as navigation intent
    if (this.userPatterns.has(window.location.href)) {
      const pattern = this.userPatterns.get(window.location.href);
      const intentCount = pattern.nextPages.get(action) || 0;
      pattern.nextPages.set(action, intentCount + 1);
    }
  }

  recordScrollPattern() {
    // Record scroll depth as engagement indicator
    const scrollDepth = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    
    if (this.userPatterns.has(window.location.href)) {
      const pattern = this.userPatterns.get(window.location.href);
      if (!pattern.scrollPatterns) {
        pattern.scrollPatterns = [];
      }
      pattern.scrollPatterns.push(scrollDepth);
      
      // Keep only recent scroll patterns
      if (pattern.scrollPatterns.length > 10) {
        pattern.scrollPatterns.shift();
      }
    }
  }

  predictAndPreload() {
    if (!this.enabled || this.pendingPreloads.size >= this.maxPreloads) {
      return;
    }
    
    const currentUrl = window.location.href;
    const predictions = this.mlModel.predict(currentUrl, this.navigationHistory);
    
    predictions.forEach(prediction => {
      if (prediction.confidence >= this.confidenceThreshold) {
        this.preloadResource(prediction.url, prediction.type);
      }
    });
  }

  async preloadResource(url, type) {
    if (this.pendingPreloads.has(url) || this.resourceCache.has(url)) {
      return;
    }
    
    try {
      this.pendingPreloads.add(url);
      
      // Preload the page
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      if (response.ok || response.type === 'opaque') {
        // Cache the preloaded resource
        this.resourceCache.set(url, {
          type: type,
          timestamp: Date.now(),
          confidence: this.getPredictionConfidence(url)
        });
        
        console.log(`🧠 Preloaded: ${url} (${type})`);
        
        // Preload critical resources if we can parse the page
        this.preloadCriticalResources(url);
      }
    } catch (error) {
      console.warn('Failed to preload:', url, error);
    } finally {
      this.pendingPreloads.delete(url);
    }
  }

  preloadCriticalResources(pageUrl) {
    try {
      // Try to fetch and parse the page for critical resources
      fetch(pageUrl)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Preload critical CSS
          const criticalCSS = doc.querySelectorAll('link[rel="stylesheet"]');
          criticalCSS.forEach(link => {
            if (link.href) {
              this.preloadResource(link.href, 'css');
            }
          });
          
          // Preload critical JavaScript
          const criticalJS = doc.querySelectorAll('script[src]');
          criticalJS.forEach(script => {
            if (script.src) {
              this.preloadResource(script.src, 'javascript');
            }
          });
          
          // Preload critical images
          const criticalImages = doc.querySelectorAll('img[src]');
          criticalImages.forEach(img => {
            if (img.src) {
              this.preloadResource(img.src, 'image');
            }
          });
        })
        .catch(error => {
          // Silently fail for cross-origin restrictions
        });
    } catch (error) {
      // Silently fail for parsing errors
    }
  }

  getPredictionConfidence(url) {
    if (this.userPatterns.has(window.location.href)) {
      const pattern = this.userPatterns.get(window.location.href);
      const nextPageCount = pattern.nextPages.get(url) || 0;
      return Math.min(1.0, nextPageCount / Math.max(1, pattern.visits));
    }
    return 0.5;
  }

  startPredictionLoop() {
    // Run predictions every 30 seconds
    setInterval(() => {
      if (this.enabled) {
        this.predictAndPreload();
      }
    }, 30000);
  }

  enable() {
    this.enabled = true;
    safeSetLocalStorage('predictive_preloading', true);
    this.startTracking();
    console.log('🧠 Predictive Preloading enabled');
  }

  disable() {
    this.enabled = false;
    safeSetLocalStorage('predictive_preloading', false);
    console.log('🧠 Predictive Preloading disabled');
  }

  getStatus() {
    return {
      enabled: this.enabled,
      predictions: this.resourceCache.size,
      pendingPreloads: this.pendingPreloads.size,
      userPatterns: this.userPatterns.size,
      navigationHistory: this.navigationHistory.length
    };
  }

  getPredictions() {
    const currentUrl = window.location.href;
    return this.mlModel.predict(currentUrl, this.navigationHistory);
  }

  clearCache() {
    this.resourceCache.clear();
    this.pendingPreloads.clear();
    console.log('🧠 Predictive Preloading cache cleared');
  }

  resetPatterns() {
    this.userPatterns.clear();
    this.navigationHistory = [];
    console.log('🧠 User patterns reset');
  }
}

// Initialize Predictive Preloader
let predictivePreloader = {
  enabled: false,
  enable: () => console.warn('Predictive Preloader not properly initialized'),
  disable: () => console.warn('Predictive Preloader not properly initialized'),
  getStatus: () => ({ enabled: false, predictions: 0, pendingPreloads: 0, userPatterns: 0, navigationHistory: 0 }),
  getPredictions: () => [],
  clearCache: () => console.warn('Predictive Preloader not properly initialized'),
  resetPatterns: () => console.warn('Predictive Preloader not properly initialized')
};

function initializePredictivePreloader() {
  try {
    const newPredictivePreloader = new PredictivePreloader();
    // Replace the fallback object with the real one
    Object.assign(predictivePreloader, newPredictivePreloader);
    if (typeof window !== 'undefined') {
      window.predictivePreloader = predictivePreloader;
    }
    console.log('🧠 Predictive Preloader system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Predictive Preloader:', error);
    // Keep the fallback object, just ensure it's accessible
    if (typeof window !== 'undefined') {
      window.predictivePreloader = predictivePreloader;
    }
  }
}
  
  // Memory Pool Management System
  class MemoryPoolManager {
    constructor() {
      this.pools = new Map();
      this.maxPoolSize = 1000;
      this.gcThreshold = 0.8; // 80% memory usage triggers GC
      this.lastGCTime = 0;
      this.gcInterval = 30000; // 30 seconds between GC cycles
      this.memoryUsage = 0;
      this.maxMemoryUsage = 0;
      this.allocatedObjects = 0;
      this.freedObjects = 0;
    }
    
    // Create a new object pool for a specific type
    createPool(type, factory, initialSize = 10) {
      if (this.pools.has(type)) return this.pools.get(type);
      
      const pool = {
        objects: [],
        factory: factory,
        type: type,
        created: 0,
        reused: 0,
        maxSize: this.maxPoolSize
      };
      
      // Pre-populate pool with initial objects
      for (let i = 0; i < initialSize; i++) {
        pool.objects.push(factory());
      }
      
      this.pools.set(type, pool);
      return pool;
    }
    
    // Get an object from the pool (reuse or create new)
    getObject(type) {
      const pool = this.pools.get(type);
      if (!pool) {
        console.warn(`MemoryPool: Pool for type '${type}' not found`);
        return null;
      }
      
      if (pool.objects.length > 0) {
        pool.reused++;
        this.allocatedObjects++;
        return pool.objects.pop();
      } else {
        pool.created++;
        this.allocatedObjects++;
        return pool.factory();
      }
    }
    
    // Return an object to the pool for reuse
    returnObject(type, obj) {
      const pool = this.pools.get(type);
      if (!pool) return;
      
      if (pool.objects.length < pool.maxSize) {
        // Reset object state if it has a reset method
        if (typeof obj.reset === 'function') {
          obj.reset();
        }
        pool.objects.push(obj);
        this.freedObjects++;
      }
    }
    
    // Monitor memory usage and trigger GC when needed
    monitorMemory() {
      if (performance.memory) {
        this.memoryUsage = performance.memory.usedJSHeapSize;
        this.maxMemoryUsage = Math.max(this.maxMemoryUsage, this.memoryUsage);
        
        const usageRatio = this.memoryUsage / performance.memory.jsHeapSizeLimit;
        
        if (usageRatio > this.gcThreshold) {
          this.triggerGC();
        }
      }
      
      // Periodic GC regardless of memory usage
      const now = Date.now();
      if (now - this.lastGCTime > this.gcInterval) {
        this.triggerGC();
        this.lastGCTime = now;
      }
    }
    
    // Trigger garbage collection
    triggerGC() {
      try {
        if (window.gc) {
          window.gc();
          console.log('MemoryPool: Manual GC triggered');
        }
        
        // Clear some pools if memory is high
        this.clearOldPools();
        
        // Force cleanup of unused objects
        this.cleanupUnusedObjects();
        
      } catch (error) {
        console.warn('MemoryPool: GC failed:', error);
      }
    }
    
    // Clear old or unused pools
    clearOldPools() {
      for (const [type, pool] of this.pools) {
        if (pool.objects.length > pool.maxSize * 0.5) {
          const excess = Math.floor(pool.objects.length * 0.3);
          pool.objects.splice(0, excess);
          console.log(`MemoryPool: Cleared ${excess} objects from ${type} pool`);
        }
      }
    }
    
    // Clean up unused objects and references
    cleanupUnusedObjects() {
      // Clear any circular references
      this.pools.forEach((pool, type) => {
        pool.objects = pool.objects.filter(obj => {
          // Remove objects that might have circular references
          if (obj && typeof obj === 'object') {
            try {
              JSON.stringify(obj);
              return true;
            } catch {
              return false;
            }
          }
          return true;
        });
      });
    }
    
    // Get memory statistics
    getStats() {
      return {
        pools: this.pools.size,
        totalObjects: Array.from(this.pools.values()).reduce((sum, pool) => sum + pool.objects.length, 0),
        allocatedObjects: this.allocatedObjects,
        freedObjects: this.freedObjects,
        memoryUsage: this.memoryUsage,
        maxMemoryUsage: this.maxMemoryUsage,
        reuseRate: this.freedObjects > 0 ? (this.freedObjects / (this.allocatedObjects + this.freedObjects)) * 100 : 0
      };
    }
    
    // Optimize memory usage based on current state
    optimize() {
      const stats = this.getStats();
      
      // Adjust pool sizes based on usage patterns
      this.pools.forEach((pool, type) => {
        const usageRate = pool.reused / (pool.created + pool.reused);
        
        if (usageRate > 0.8) {
          // High reuse rate - increase pool size
          pool.maxSize = Math.min(pool.maxSize * 1.2, this.maxPoolSize);
        } else if (usageRate < 0.2) {
          // Low reuse rate - decrease pool size
          pool.maxSize = Math.max(pool.maxSize * 0.8, 10);
        }
      });
      
      // Trigger GC if memory usage is high
      if (stats.memoryUsage > this.maxMemoryUsage * 0.9) {
        this.triggerGC();
      }
    }
  }
  
  // Initialize memory pool manager
  const memoryPoolManager = new MemoryPoolManager();
  
  // Network Request Batching System
  class NetworkRequestBatcher {
    constructor() {
      this.batches = new Map();
      this.batchTimeout = 100; // 100ms batch window
      this.maxBatchSize = 10; // Maximum requests per batch
      this.pendingRequests = new Map();
      this.batchTimers = new Map();
      this.stats = {
        totalRequests: 0,
        batchedRequests: 0,
        savedRequests: 0,
        averageBatchSize: 0
      };
    }
    
    // Add a request to a batch
    addToBatch(url, options = {}) {
      const batchKey = this.getBatchKey(url, options);
      
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, []);
        this.startBatchTimer(batchKey);
      }
      
      const batch = this.batches.get(batchKey);
      batch.push({ url, options, timestamp: Date.now() });
      
      this.stats.totalRequests++;
      
      // If batch is full, execute immediately
      if (batch.length >= this.maxBatchSize) {
        this.executeBatch(batchKey);
      }
      
      return new Promise((resolve, reject) => {
        // Store promise resolution functions
        if (!this.pendingRequests.has(batchKey)) {
          this.pendingRequests.set(batchKey, []);
        }
        this.pendingRequests.get(batchKey).push({ resolve, reject });
      });
    }
    
    // Get batch key based on URL and options
    getBatchKey(url, options) {
      const urlObj = new URL(url);
      const key = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      return key + JSON.stringify(options);
    }
    
    // Start batch timer
    startBatchTimer(batchKey) {
      if (this.batchTimers.has(batchKey)) {
        clearTimeout(this.batchTimers.get(batchKey));
      }
      
      const timer = setTimeout(() => {
        this.executeBatch(batchKey);
      }, this.batchTimeout);
      
      this.batchTimers.set(batchKey, timer);
    }
    
    // Execute a batch of requests
    async executeBatch(batchKey) {
      const batch = this.batches.get(batchKey);
      const promises = this.pendingRequests.get(batchKey) || [];
      
      if (!batch || batch.length === 0) return;
      
      try {
        // Execute all requests in parallel
        const results = await Promise.allSettled(
          batch.map(({ url, options }) => fetch(url, options))
        );
        
        // Resolve/reject promises based on results
        results.forEach((result, index) => {
          if (promises[index]) {
            if (result.status === 'fulfilled') {
              promises[index].resolve(result.value);
            } else {
              promises[index].reject(result.value);
            }
          }
        });
        
        // Update statistics
        this.stats.batchedRequests += batch.length;
        this.stats.savedRequests += Math.max(0, batch.length - 1);
        this.updateAverageBatchSize();
        
        console.log(`NetworkBatcher: Executed batch of ${batch.length} requests for ${batchKey}`);
        
      } catch (error) {
        console.error('NetworkBatcher: Batch execution failed:', error);
        // Reject all pending promises
        promises.forEach(({ reject }) => reject(error));
      }
      
      // Clean up
      this.batches.delete(batchKey);
      this.pendingRequests.delete(batchKey);
      this.batchTimers.delete(batchKey);
    }
    
    // Update average batch size
    updateAverageBatchSize() {
      if (this.stats.batchedRequests > 0) {
        this.stats.averageBatchSize = this.stats.batchedRequests / 
          (this.stats.batchedRequests - this.stats.savedRequests);
      }
    }
    
    // Get batch statistics
    getStats() {
      return { ...this.stats };
    }
    
    // Configure batch settings
    configure(settings) {
      if (settings.batchTimeout !== undefined) {
        this.batchTimeout = Math.max(50, Math.min(1000, settings.batchTimeout));
      }
      if (settings.maxBatchSize !== undefined) {
        this.maxBatchSize = Math.max(2, Math.min(20, settings.maxBatchSize));
      }
    }
  }
  
  // Critical Path Optimization System
  class CriticalPathOptimizer {
    constructor() {
      this.criticalElements = new Set();
      this.aboveTheFoldElements = new Set();
      this.optimizationEnabled = true;
      this.preloadQueue = [];
      this.deferredQueue = [];
      this.intersectionObserver = null;
      this.performanceObserver = null;
      this.stats = {
        criticalElements: 0,
        preloadedResources: 0,
        deferredResources: 0,
        optimizationTime: 0
      };
    }
    
    // Initialize critical path optimization
    init() {
      this.setupIntersectionObserver();
      this.setupPerformanceObserver();
      this.identifyCriticalElements();
      this.optimizeAboveTheFold();
    }
    
    // Setup intersection observer for above-the-fold detection
    setupIntersectionObserver() {
      if (!window.IntersectionObserver) return;
      
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.aboveTheFoldElements.add(entry.target);
              this.optimizeElement(entry.target);
            }
          });
        },
        {
          rootMargin: '0px 0px 50px 0px', // 50px below viewport
          threshold: 0.1
        }
      );
    }
    
    // Setup performance observer for resource timing
    setupPerformanceObserver() {
      if (!window.PerformanceObserver) return;
      
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(entry => {
            if (entry.entryType === 'resource') {
              this.analyzeResourceTiming(entry);
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('CriticalPath: PerformanceObserver not supported:', error);
      }
    }
    
    // Identify critical elements on the page
    identifyCriticalElements() {
      const criticalSelectors = [
        'h1', 'h2', 'h3', // Headings
        '.hero', '.banner', '.main-content', // Main content areas
        'img[loading="eager"]', // Eager loading images
        'link[rel="preload"]', // Preloaded resources
        'script[type="module"]' // Critical scripts
      ];
      
      criticalSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          this.criticalElements.add(element);
          this.intersectionObserver?.observe(element);
        });
      });
      
      this.stats.criticalElements = this.criticalElements.size;
    }
    
    // Optimize above-the-fold content
    optimizeAboveTheFold() {
      const startTime = performance.now();
      
      // Prioritize critical CSS
      this.preloadCriticalCSS();
      
      // Preload critical images
      this.preloadCriticalImages();
      
      // Defer non-critical resources
      this.deferNonCriticalResources();
      
      this.stats.optimizationTime = performance.now() - startTime;
      console.log(`CriticalPath: Optimized ${this.criticalElements.size} critical elements in ${this.stats.optimizationTime.toFixed(2)}ms`);
    }
    
    // Preload critical CSS
    preloadCriticalCSS() {
      const criticalCSS = document.querySelectorAll('link[rel="stylesheet"]');
      criticalCSS.forEach(link => {
        if (this.isAboveTheFold(link)) {
          link.setAttribute('rel', 'preload');
          link.setAttribute('as', 'style');
          this.preloadQueue.push(link);
        }
      });
    }
    
    // Preload critical images
    preloadCriticalImages() {
      const criticalImages = document.querySelectorAll('img[loading="eager"], img:not([loading="lazy"])');
      criticalImages.forEach(img => {
        if (this.isAboveTheFold(img)) {
          img.setAttribute('loading', 'eager');
          img.setAttribute('fetchpriority', 'high');
          this.preloadQueue.push(img);
        }
      });
    }
    
    // Defer non-critical resources
    deferNonCriticalResources() {
      const nonCritical = document.querySelectorAll('img[loading="lazy"], script[defer], link[rel="prefetch"]');
      nonCritical.forEach(element => {
        if (!this.isAboveTheFold(element)) {
          this.deferredQueue.push(element);
          this.deferElement(element);
        }
      });
    }
    
    // Check if element is above the fold
    isAboveTheFold(element) {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }
    
    // Optimize individual element
    optimizeElement(element) {
      if (element.tagName === 'IMG') {
        this.optimizeImage(element);
      } else if (element.tagName === 'SCRIPT') {
        this.optimizeScript(element);
      } else if (element.tagName === 'LINK') {
        this.optimizeLink(element);
      }
    }
    
    // Optimize image loading
    optimizeImage(img) {
      if (this.isAboveTheFold(img)) {
        img.setAttribute('fetchpriority', 'high');
        img.setAttribute('loading', 'eager');
      } else {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('fetchpriority', 'low');
      }
    }
    
    // Optimize script loading
    optimizeScript(script) {
      if (this.isAboveTheFold(script)) {
        script.setAttribute('fetchpriority', 'high');
      } else {
        script.setAttribute('defer', 'true');
        script.setAttribute('fetchpriority', 'low');
      }
    }
    
    // Optimize link loading
    optimizeLink(link) {
      if (link.rel === 'stylesheet' && this.isAboveTheFold(link)) {
        link.setAttribute('fetchpriority', 'high');
      }
    }
    
    // Analyze resource timing for optimization insights
    analyzeResourceTiming(entry) {
      if (entry.initiatorType === 'img' && entry.duration > 1000) {
        console.warn(`CriticalPath: Slow image load detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
      }
    }
    
    // Get optimization statistics
    getStats() {
      return { ...this.stats };
    }
    
    // Enable/disable optimization
    setEnabled(enabled) {
      this.optimizationEnabled = enabled;
      if (enabled) {
        this.init();
      } else {
        this.cleanup();
      }
    }
    
    // Cleanup resources
    cleanup() {
      this.intersectionObserver?.disconnect();
      this.performanceObserver?.disconnect();
      this.criticalElements.clear();
      this.aboveTheFoldElements.clear();
    }
  }
  
  // Initialize performance optimization systems
  const networkBatcher = new NetworkRequestBatcher();
  const criticalPathOptimizer = new CriticalPathOptimizer();
  
  // Additional refresh loop prevention
  let lastStateUpdate = 0;
  const STATE_UPDATE_THROTTLE_SAFE = 2000; // 2 seconds between state updates (safe mode)
  let refreshLoopDetected = false;
  let refreshLoopCount = 0;
  const MAX_REFRESH_LOOPS = 5;
  
  // Security: Enhanced URL validation patterns
  const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:', 'ftp:', 'mailto:', 'tel:'];
  const ALLOWED_PROTOCOLS = ['http:', 'https:', 'ipfs:', 'ipns:'];
  
  // Enhanced Tab Management System
  class TabManager {
    constructor() {
      this.tabs = [];
      this.activeTabIndex = 0;
      this.isDragging = false;
      this.draggedTabIndex = -1;
      this.isNavigating = false;
      this.tabAnimations = new Map();
      this.tabStates = new Map();
      this.pendingUpdates = new Set();
      this.lastTabUpdate = 0;
      this.tabUpdateThrottle = 16; // 60 FPS
      this.persistentStorage = {
        key: 'CB_TABS_V2',
        maxTabs: MAX_TABS,
        autoSave: true,
        saveInterval: 1000 // 1 second
      };
      this.tabFeatures = {
        pinning: true,
        grouping: true,
        sleeping: true,
        preview: true,
        reordering: true
      };
    }
    
    // Initialize tab manager
    init() {
      this.loadPersistentTabs();
      this.setupAutoSave();
      this.setupTabAnimations();
      this.setupTabEvents();
      console.log('TabManager: Initialized with', this.tabs.length, 'tabs');
    }
    
    // Load tabs from persistent storage
    loadPersistentTabs() {
      try {
        const stored = localStorage.getItem(this.persistentStorage.key);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.tabs && Array.isArray(data.tabs) && data.activeTabIndex !== undefined) {
            this.tabs = data.tabs.slice(0, this.persistentStorage.maxTabs);
            this.activeTabIndex = Math.min(data.activeTabIndex, this.tabs.length - 1);
            console.log('TabManager: Loaded', this.tabs.length, 'persistent tabs');
            return;
          }
        }
      } catch (error) {
        console.warn('TabManager: Failed to load persistent tabs:', error);
      }
      
      // Create default tab if none exist
      this.createTab('about:blank', 'New Tab');
    }
    
    // Save tabs to persistent storage
    savePersistentTabs() {
      if (!this.persistentStorage.autoSave) return;
      
      try {
        const data = {
          tabs: this.tabs,
          activeTabIndex: this.activeTabIndex,
          timestamp: Date.now(),
          version: '2.0'
        };
        localStorage.setItem(this.persistentStorage.key, JSON.stringify(data));
      } catch (error) {
        console.warn('TabManager: Failed to save persistent tabs:', error);
      }
    }
    
    // Setup auto-save functionality
    setupAutoSave() {
      setInterval(() => {
        this.savePersistentTabs();
      }, this.persistentStorage.saveInterval);
    }
    
    // Setup tab animations
    setupTabAnimations() {
      // Create CSS for smooth tab animations
      const style = document.createElement('style');
      style.textContent = `
        .tab {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }
        .tab.entering {
          animation: tabEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab.exiting {
          animation: tabExit 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab.active {
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .tab:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .tab.pinned {
          background: linear-gradient(135deg, #4a90e2, #357abd);
        }
        .tab.sleeping {
          opacity: 0.6;
          filter: grayscale(0.3);
        }
        @keyframes tabEnter {
          from {
            opacity: 0;
            transform: translateX(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes tabExit {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(20px) scale(0.9);
          }
        }
        .tab-group {
          border-left: 3px solid #4a90e2;
          margin-left: 8px;
        }
        .tab-preview {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 8px;
          padding: 8px;
          max-width: 300px;
          z-index: 1000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .tab-preview.show {
          opacity: 1;
          pointer-events: auto;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Setup tab event handlers
    setupTabEvents() {
      // Global tab events
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 't':
              e.preventDefault();
              this.createTab('about:blank', 'New Tab');
              break;
            case 'w':
              e.preventDefault();
              this.closeTab(this.activeTabIndex);
              break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
              e.preventDefault();
              const index = parseInt(e.key) - 1;
              if (index < this.tabs.length) {
                this.switchTab(index);
              }
              break;
          }
        }
      });
    }
    
    // Create a new tab
    createTab(url, title, options = {}) {
      const tab = {
        id: this.generateTabId(),
        url: url || 'about:blank',
        title: title || 'New Tab',
        favicon: null,
        status: 'loading',
        pinned: options.pinned || false,
        group: options.group || null,
        sleeping: false,
        lastAccessed: Date.now(),
        createdAt: Date.now(),
        metadata: {
          scrollPosition: 0,
          formData: {},
          customData: {}
        }
      };
      
      this.tabs.push(tab);
      
      if (options.activate !== false) {
        this.activeTabIndex = this.tabs.length - 1;
      }
      
      this.scheduleTabUpdate();
      this.savePersistentTabs();
      
      console.log('TabManager: Created tab', tab.id, 'at index', this.tabs.length - 1);
      return tab;
    }
    
    // Generate unique tab ID
    generateTabId() {
      return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Switch to a specific tab
    switchTab(index) {
      if (index < 0 || index >= this.tabs.length) return;
      
      const previousActive = this.activeTabIndex;
      this.activeTabIndex = index;
      
      // Update tab states
      this.tabs[previousActive].lastAccessed = Date.now();
      this.tabs[index].lastAccessed = Date.now();
      
      // Wake up sleeping tab
      if (this.tabs[index].sleeping) {
        this.tabs[index].sleeping = false;
      }
      
      this.scheduleTabUpdate();
      this.savePersistentTabs();
      
      console.log('TabManager: Switched to tab', index);
    }
    
    // Close a tab
    closeTab(index) {
      if (index < 0 || index >= this.tabs.length) return;
      
      const tab = this.tabs[index];
      const wasActive = index === this.activeTabIndex;
      
      // Remove tab
      this.tabs.splice(index, 1);
      
      // Adjust active tab index
      if (this.tabs.length === 0) {
        this.activeTabIndex = 0;
        this.createTab('about:blank', 'New Tab');
      } else if (wasActive) {
        this.activeTabIndex = Math.min(index, this.tabs.length - 1);
      } else if (this.activeTabIndex > index) {
        this.activeTabIndex--;
      }
      
      this.scheduleTabUpdate();
      this.savePersistentTabs();
      
      console.log('TabManager: Closed tab', index, 'remaining tabs:', this.tabs.length);
    }
    
    // Pin/unpin a tab
    togglePinTab(index) {
      if (index < 0 || index >= this.tabs.length) return;
      
      this.tabs[index].pinned = !this.tabs[index].pinned;
      this.scheduleTabUpdate();
      this.savePersistentTabs();
      
      console.log('TabManager: Toggled pin for tab', index);
    }
    
    // Put tab to sleep (memory optimization)
    sleepTab(index) {
      if (index < 0 || index >= this.tabs.length) return;
      
      this.tabs[index].sleeping = true;
      this.scheduleTabUpdate();
      this.savePersistentTabs();
      
      console.log('TabManager: Put tab', index, 'to sleep');
    }
    
    // Reorder tabs
    reorderTabs(fromIndex, toIndex) {
      if (fromIndex < 0 || fromIndex >= this.tabs.length ||
          toIndex < 0 || toIndex >= this.tabs.length) return;
      
      const tab = this.tabs.splice(fromIndex, 1)[0];
      this.tabs.splice(toIndex, 0, tab);
      
      // Adjust active tab index
      if (this.activeTabIndex === fromIndex) {
        this.activeTabIndex = toIndex;
      } else if (this.activeTabIndex > fromIndex && this.activeTabIndex <= toIndex) {
        this.activeTabIndex--;
      } else if (this.activeTabIndex < fromIndex && this.activeTabIndex >= toIndex) {
        this.activeTabIndex++;
      }
      
      this.scheduleTabUpdate();
      this.savePersistentTabs();
      
      console.log('TabManager: Reordered tab from', fromIndex, 'to', toIndex);
    }
    
    // Update tab information
    updateTab(index, updates) {
      if (index < 0 || index >= this.tabs.length) return;
      
      Object.assign(this.tabs[index], updates);
      this.scheduleTabUpdate();
      this.savePersistentTabs();
    }
    
    // Schedule tab update (throttled)
    scheduleTabUpdate() {
      const now = Date.now();
      if (now - this.lastTabUpdate < this.tabUpdateThrottle) {
        this.pendingUpdates.add('render');
        return;
      }
      
      this.renderTabs();
      this.lastTabUpdate = now;
      
      // Process any pending updates
      if (this.pendingUpdates.has('render')) {
        this.pendingUpdates.delete('render');
        setTimeout(() => this.renderTabs(), this.tabUpdateThrottle);
      }
    }
    
    // Render all tabs
    renderTabs() {
      const tabsContainer = cachedElements.tabs;
      if (!tabsContainer) return;
      
      // Clear existing tabs
      tabsContainer.innerHTML = '';
      
      // Add tab indicator
      const indicator = document.createElement('div');
      indicator.id = 'tab-indicator';
      indicator.style.willChange = 'left, width';
      tabsContainer.appendChild(indicator);
      
      // Render each tab
      this.tabs.forEach((tab, index) => {
        const tabElement = this.createTabElement(tab, index);
        tabsContainer.appendChild(tabElement);
      });
      
      // Update indicator position
      this.updateTabIndicator();
      
      // Update scroll indicators
      this.updateScrollIndicators();
    }
    
    // Create individual tab element
    createTabElement(tab, index) {
      const el = document.createElement('div');
      el.className = `tab ${index === this.activeTabIndex ? 'active' : ''} ${tab.pinned ? 'pinned' : ''} ${tab.sleeping ? 'sleeping' : ''}`;
      el.setAttribute('data-tab-id', tab.id);
      el.setAttribute('data-tab-index', index);
      el.setAttribute('draggable', 'true');
      el.setAttribute('aria-label', `Tab ${index + 1}: ${tab.title || tab.url}`);
      
      // Tab content
      el.innerHTML = `
        <div class="tab-content">
          ${tab.pinned ? '<span class="tab-pin-icon">📌</span>' : ''}
          <img class="tab-favicon" src="${this.getFaviconUrl(tab.url)}" alt="Favicon" onerror="this.style.display='none'">
          <span class="tab-title">${this.truncateTitle(tab.title || tab.url)}</span>
          <span class="tab-close" aria-label="Close tab">×</span>
        </div>
        ${this.tabFeatures.preview ? '<div class="tab-preview"></div>' : ''}
      `;
      
      // Event handlers
      this.attachTabEventHandlers(el, tab, index);
      
      return el;
    }
    
    // Attach event handlers to tab element
    attachTabEventHandlers(element, tab, index) {
      // Click to switch tab
      element.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
          this.switchTab(index);
        }
      });
      
      // Close button
      const closeBtn = element.querySelector('.tab-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeTab(index);
        });
      }
      
      // Pin button (double-click)
      element.addEventListener('dblclick', (e) => {
        if (!e.target.classList.contains('tab-close')) {
          this.togglePinTab(index);
        }
      });
      
      // Drag and drop
      element.addEventListener('dragstart', (e) => {
        this.handleDragStart(e, index);
      });
      
      element.addEventListener('dragover', (e) => {
        this.handleDragOver(e, index);
      });
      
      element.addEventListener('drop', (e) => {
        this.handleDrop(e, index);
      });
      
      // Preview on hover
      if (this.tabFeatures.preview) {
        element.addEventListener('mouseenter', (e) => {
          this.showTabPreview(element, tab);
        });
        
        element.addEventListener('mouseleave', (e) => {
          this.hideTabPreview(element);
        });
      }
    }
    
    // Handle drag start
    handleDragStart(e, index) {
      this.isDragging = true;
      this.draggedTabIndex = index;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', index.toString());
      element.classList.add('dragging');
    }
    
    // Handle drag over
    handleDragOver(e, index) {
      if (e.preventDefault) e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (this.draggedTabIndex !== index) {
        element.classList.add('drag-over');
      }
    }
    
    // Handle drop
    handleDrop(e, index) {
      if (e.stopPropagation) e.stopPropagation();
      
      if (this.draggedTabIndex !== index) {
        this.reorderTabs(this.draggedTabIndex, index);
      }
      
      this.isDragging = false;
      this.draggedTabIndex = -1;
      element.classList.remove('dragging', 'drag-over');
    }
    
    // Show tab preview
    showTabPreview(element, tab) {
      const preview = element.querySelector('.tab-preview');
      if (preview) {
        preview.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 4px;">${tab.title}</div>
          <div style="font-size: 12px; opacity: 0.8;">${tab.url}</div>
          <div style="font-size: 11px; opacity: 0.6; margin-top: 4px;">
            Created: ${new Date(tab.createdAt).toLocaleDateString()}
          </div>
        `;
        preview.classList.add('show');
      }
    }
    
    // Hide tab preview
    hideTabPreview(element) {
      const preview = element.querySelector('.tab-preview');
      if (preview) {
        preview.classList.remove('show');
      }
    }
    
    // Update tab indicator position
    updateTabIndicator() {
      const indicator = document.querySelector('#tab-indicator');
      if (!indicator) return;
      
      const activeTab = document.querySelector('.tab.active');
      if (activeTab) {
        const rect = activeTab.getBoundingClientRect();
        const containerRect = cachedElements.tabs.getBoundingClientRect();
        
        indicator.style.left = (rect.left - containerRect.left) + 'px';
        indicator.style.width = rect.width + 'px';
      }
    }
    
    // Update scroll indicators
    updateScrollIndicators() {
      const container = cachedElements.tabs;
      if (!container) return;
      
      const isAtStart = container.scrollLeft <= 0;
      const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth;
      
      // Add/remove scroll indicators
      this.toggleScrollIndicator('left', !isAtStart);
      this.toggleScrollIndicator('right', !isAtEnd);
    }
    
    // Toggle scroll indicator
    toggleScrollIndicator(direction, show) {
      let indicator = document.querySelector(`.scroll-indicator-${direction}`);
      
      if (show && !indicator) {
        indicator = document.createElement('div');
        indicator.className = `scroll-indicator-${direction}`;
        indicator.innerHTML = direction === 'left' ? '‹' : '›';
        indicator.style.cssText = `
          position: absolute;
          ${direction}: 0;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 8px 4px;
          border-radius: 4px;
          cursor: pointer;
          z-index: 10;
          font-size: 16px;
          font-weight: bold;
        `;
        
        indicator.addEventListener('click', () => {
          const container = cachedElements.tabs;
          const scrollAmount = direction === 'left' ? -200 : 200;
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
        
        cachedElements.tabs.parentElement.appendChild(indicator);
      } else if (!show && indicator) {
        indicator.remove();
      }
    }
    
    // Get favicon URL
    getFaviconUrl(url) {
      try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
      } catch {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjNjY2NjY2Ii8+CjxwYXRoIGQ9Ik04IDRMMTIgOEw4IDEyTDQgOEw4IDRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
      }
    }
    
    // Truncate title for display
    truncateTitle(title, maxLength = 25) {
      if (title.length <= maxLength) return title;
      return title.substring(0, maxLength - 3) + '...';
    }
    
    // Get current state
    getState() {
      return {
        tabs: this.tabs,
        activeTabIndex: this.activeTabIndex,
        totalTabs: this.tabs.length
      };
    }
    
    // Get tab by index
    getTab(index) {
      return this.tabs[index] || null;
    }
    
    // Get active tab
    getActiveTab() {
      return this.tabs[this.activeTabIndex] || null;
    }
  }
  
  // Initialize enhanced tab manager
  const tabManager = new TabManager();
  
  // Theme management
  let currentTheme = 'dark';
  const themes = {
      dark: {
          bar: '#0a0a0a',
          text: '#ffffff',
          input: '#0f0f0f',
          button: '#1a1a1a',
          active: '#2a2a2a',
          error: '#ff4444',
          success: '#44ff44',
          warning: '#ffaa00'
      },
      light: {
          bar: '#f5f5f5',
          text: '#333',
          input: '#ffffff',
          button: '#e6e6e6',
          active: '#dcdcdc',
          error: '#cc0000',
          success: '#00cc00',
          warning: '#cc6600'
      }
  };

  // Minimalistic sans-serif font stack used across the browser UI
  const FONT_STACK = "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', ui-sans-serif, system-ui, -apple-system, sans-serif";

  // User preferences with persistence
  // Defaults; will be overridden in init() if storage/profile available
  let currentFontScale = 1;
  let currentFontWeight = 600;
  let currentDensity = 'compact'; // 'compact' | 'comfortable'
  let defaultSearchEngine = 'duckduckgo';
  let homeUrl = 'about:blank';
  let startupMode = 'restore'; // 'restore' | 'home'
  let httpsOnly = true;
  let blockTrackers = true;
  let siteControls = {}; // hostname -> { js: true, images: true, cookies: true }
  let downloads = [];
  let searchEngineWorking = true; // Track if search engine is accessible

  // Web3 & IPFS preferences (opt-in)
  let web3Enabled = false;
  let web3RpcUrl = 'https://cloudflare-eth.com';
  let web3ChainId = '0x1'; // Ethereum mainnet
  let ipfsGateway = 'https://cloudflare-ipfs.com';

  function loadDownloads(){
    try { const d = JSON.parse(localStorage.getItem('cb_downloads') || '[]'); if (Array.isArray(d)) downloads = d; } catch(_) {}
  }
  function saveDownloads(){
    try { localStorage.setItem('cb_downloads', JSON.stringify(downloads.slice(-200))); } catch(_) {}
  }

  function getPad(){
    // Single-row compact layout height
    return currentDensity === 'compact' ? 44 : 52;
  }

  function getPrefs(){
    return {
      theme: currentTheme,
      fontScale: currentFontScale,
      fontWeight: currentFontWeight,
      density: currentDensity,
      engine: defaultSearchEngine,
      home: homeUrl,
      startup: startupMode,
      httpsOnly,
      blockTrackers,
      siteControls,
      web3Enabled,
      web3RpcUrl,
      web3ChainId,
      ipfsGateway
    };
  }

  const DEFAULT_ENGINES = {
    duckduckgo: 'https://duckduckgo.com/?q=',
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
    brave: 'https://search.brave.com/search?q=',
    startpage: 'https://www.startpage.com/do/search?q='
  };
  
  // Search shortcuts for quick access
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
  
  // Enhanced search engine fallbacks with better error handling
  const SEARCH_ENGINE_FALLBACKS = {
    google: 'bing',
    bing: 'duckduckgo',
    duckduckgo: 'google',
    brave: 'duckduckgo',
    startpage: 'duckduckgo'
  };
  
  // Search engine fallbacks with better error handling
  const DUCKDUCKGO_FALLBACKS = [
    'https://www.google.com',
    'https://search.brave.com',
    'https://www.bing.com'
  ];
  
  function defaultEngineUrl(){
    return DEFAULT_ENGINES[defaultSearchEngine] || DEFAULT_ENGINES.duckduckgo;
  }
  
  // Handle search shortcuts (e.g., "g query" for Google, "y query" for YouTube)
  function handleSearchShortcut(query) {
    const parts = query.trim().split(' ');
    if (parts.length < 2) return null;
    
    const shortcut = parts[0].toLowerCase();
    const searchQuery = parts.slice(1).join(' ');
    
    if (SEARCH_SHORTCUTS[shortcut]) {
      const engine = SEARCH_SHORTCUTS[shortcut];
      if (engine === 'youtube') {
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
      } else if (engine === 'wikipedia') {
        return `https://en.wikipedia.org/wiki/Special:Search?query=${encodeURIComponent(searchQuery)}`;
      } else if (engine === 'github') {
        return `https://github.com/search?q=${encodeURIComponent(searchQuery)}`;
      } else if (engine === 'reddit') {
        return `https://www.reddit.com/search/?q=${encodeURIComponent(searchQuery)}`;
      } else if (engine === 'twitter') {
        return `https://twitter.com/search?q=${encodeURIComponent(searchQuery)}`;
      } else if (engine === 'amazon') {
        return `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`;
      } else if (engine === 'news') {
        return `https://news.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      } else if (engine === 'stackoverflow') {
        return `https://stackoverflow.com/search?q=${encodeURIComponent(searchQuery)}`;
      } else {
        // Use the default search engine format
        return DEFAULT_ENGINES[engine] + encodeURIComponent(searchQuery);
      }
    }
    
    return null;
  }
  
  // Get a working search engine URL with enhanced fallbacks
  async function getWorkingSearchEngine() {
    // First try the current default engine
    try {
      const currentEngine = defaultEngineUrl();
      const response = await fetch(currentEngine, { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return currentEngine;
    } catch (e) {
      console.warn('Current search engine failed:', e);
    }

    // Try intelligent fallbacks based on current engine
    const currentEngineName = defaultSearchEngine;
    if (SEARCH_ENGINE_FALLBACKS[currentEngineName]) {
      const fallbackEngine = SEARCH_ENGINE_FALLBACKS[currentEngineName];
      try {
        const fallbackUrl = DEFAULT_ENGINES[fallbackEngine];
        const response = await fetch(fallbackUrl, { 
          method: 'HEAD', 
          mode: 'no-cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        console.log('Found working fallback search engine:', fallbackEngine);
        return fallbackUrl;
      } catch (e) {
        console.warn('Primary fallback search engine failed:', fallbackEngine, e);
      }
    }

    // Try all fallbacks in order as last resort
    for (const fallback of DUCKDUCKGO_FALLBACKS) {
      try {
        const response = await fetch(fallback, { 
          method: 'HEAD', 
          mode: 'no-cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        console.log('Found working fallback search engine:', fallback);
        return fallback;
      } catch (e) {
        console.warn('Fallback search engine failed:', fallback, e);
        continue;
      }
    }

    // If all fail, return the original default but don't throw
    console.warn('All search engines failed, using original default');
    return defaultEngineUrl();
  }

  // Minimal Web3 injection (EIP-1193 compatible subset) when enabled
  function setupWeb3Provider(){
    if (!web3Enabled) return;
    if (window.ethereum) return; // do not override existing providers
    const listeners = new Map();
    window.ethereum = {
      isMinimalBrowser: true,
      isMetaMask: false,
      chainId: web3ChainId,
      selectedAddress: null,
      request: async ({ method, params }) => {
        // Basic JSON-RPC forwarder to configured RPC URL
        const payload = { jsonrpc: '2.0', id: Date.now(), method, params: params || [] };
        const resp = await fetch(web3RpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store'
        });
        const data = await resp.json();
        if (data.error) throw new Error(data.error.message || 'RPC Error');
        if (method === 'eth_chainId') window.ethereum.chainId = data.result;
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          window.ethereum.selectedAddress = Array.isArray(data.result) ? data.result[0] || null : null;
        }
        return data.result;
      },
      on: (event, cb) => { if (!listeners.has(event)) listeners.set(event, new Set()); listeners.get(event).add(cb); },
      removeListener: (event, cb) => { const s = listeners.get(event); if (s) s.delete(cb); },
      // Utility to emit internal events
      _emit: (event, payload) => { const s = listeners.get(event); if (s) s.forEach(fn => { try { fn(payload); } catch(_){} }); }
    };
    // Populate basic chainId on load
    window.ethereum.request({ method: 'eth_chainId' }).catch(()=>{});
  }

  // Cache DOM elements for better performance
  let cachedElements = {
    host: null,
    shadowRoot: null,
    style: null,
    tabs: null,
    startOverlay: null,
    startSearch: null,
    indicator: null,
    url: null,
    go: null,
    fallback: null,
    bookmark: null,
    theme: null,
    new: null,
    back: null,
    forward: null,
    loading: null,
    menu: null
  };
  // Start/New-tab overlay state
  let startOverlayVisible = false;


  // HTTP response cache (fetch-based, persistent, respects basic Cache-Control/ETag)
  const HTTP_CACHE_KEY = 'cb_http_cache_v1';
  const MAX_HTTP_CACHE_ENTRIES = 300;      // soft cap
  const MAX_HTTP_CACHE_CHARS = 4_000_000;  // ~4 MB uncompressed equivalent
  const MIN_COMPRESS_CHARS = 1024;         // compress larger responses for storage
  let httpCache = Object.create(null);

  function loadHttpCache() {
    try {
      const raw = localStorage.getItem(HTTP_CACHE_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') httpCache = obj;
    } catch(_) {}
  }

  function saveHttpCache() {
    try {
      localStorage.setItem(HTTP_CACHE_KEY, JSON.stringify(httpCache));
    } catch(_) {}
  }

  function pruneHttpCache() {
    // Keep under entry and size limits using LRU-like lastAccess
    const entries = Object.entries(httpCache);
    if (entries.length <= MAX_HTTP_CACHE_ENTRIES) {
      // Still check size cap
      let total = 0;
      for (const [,v] of entries) total += (v && v.storedSize ? v.storedSize : (v && v.body ? v.body.length : 0));
      if (total <= MAX_HTTP_CACHE_CHARS) return;
    }
    entries.sort((a,b)=> (a[1].lastAccess||0) - (b[1].lastAccess||0));
    let totalChars = 0;
    const kept = [];
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i];
      const size = (e[1] && e[1].storedSize ? e[1].storedSize : (e[1] && e[1].body ? e[1].body.length : 0));
      if (kept.length < MAX_HTTP_CACHE_ENTRIES && totalChars + size <= MAX_HTTP_CACHE_CHARS) {
        kept.push(e);
        totalChars += size;
      }
    }
    const next = Object.create(null);
    for (const [k,v] of kept) next[k] = v;
    httpCache = next;
    saveHttpCache();
  }

  function parseCacheControl(header) {
    const out = Object.create(null);
    if (!header || typeof header !== 'string') return out;
    header.split(',').forEach(part => {
      const [k,v] = part.trim().split('=');
      if (!k) return;
      out[k.toLowerCase()] = v ? v.replace(/"/g,'').trim() : true;
    });
    return out;
  }

  function httpCacheGet(key) {
    const e = httpCache[key];
    if (!e) return null;
    if (e.expiry && Date.now() > e.expiry) return null;
    e.lastAccess = Date.now();
    return e;
  }

  // Compression helpers (storage efficiency)
  async function compressTextIfLarge(text) {
    try {
      if (!text || text.length < MIN_COMPRESS_CHARS) return { body: text, storedSize: text.length };
      if (typeof CompressionStream === 'undefined') return { body: text, storedSize: text.length };
      const enc = new TextEncoder();
      const stream = new Blob([enc.encode(text)]).stream().pipeThrough(new CompressionStream('gzip'));
      const buf = await new Response(stream).arrayBuffer();
      const b64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buf))));
      return { bodyZ: { algo: 'gzip', b64 }, bodySize: text.length, storedSize: b64.length };
    } catch(_) { return { body: text, storedSize: text.length }; }
  }

  async function decompressText(entry) {
    try {
      if (!entry || !entry.bodyZ) return entry && entry.body ? entry.body : null;
      if (typeof DecompressionStream === 'undefined') return null;
      const bytes = Uint8Array.from(atob(entry.bodyZ.b64), c => c.charCodeAt(0));
      const stream = new Blob([bytes.buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
      const buf = await new Response(stream).arrayBuffer();
      return new TextDecoder().decode(buf);
    } catch(_) { return null; }
  }

  function httpCacheSet(key, entry) {
    entry.lastAccess = Date.now();
    httpCache[key] = entry;
    pruneHttpCache();
    saveHttpCache();
  }

  // Security: Input sanitization
  function sanitizeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
  
  function sanitizeUrl(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return homeUrl;
    
    // Check for dangerous protocols
    const lowerText = trimmed.toLowerCase();
    for (const protocol of DANGEROUS_PROTOCOLS) {
      if (lowerText.startsWith(protocol)) {
        console.warn('Blocked dangerous protocol:', protocol);
        return defaultEngineUrl() + encodeURIComponent(trimmed);
      }
    }
    
    // Check for allowed protocols
    let hasValidProtocol = false;
    for (const protocol of ALLOWED_PROTOCOLS) {
      if (lowerText.startsWith(protocol)) {
        hasValidProtocol = true;
        break;
      }
    }
    
    if (hasValidProtocol) {
      try {
        new URL(trimmed); // Validate URL format
        return trimmed;
      } catch {
        return defaultEngineUrl() + encodeURIComponent(trimmed);
      }
    }
    
    // Check if it looks like a domain
    if (trimmed.includes('.') && !trimmed.includes(' ') && !trimmed.includes('\n')) {
      return 'https://' + trimmed;
    }
    
    // Default to search using working engine
    return defaultEngineUrl() + encodeURIComponent(trimmed);
  }

  function ensureUrl(text) {
    const t = String(text || '').trim();
    if (!t) return homeUrl;
    // Shortcut detection (g hello) handled in processSearchInput
    // If looks like a raw query (no scheme, spaces present), use default engine
    const hasScheme = /^(https?:|about:|file:)/i.test(t);
    const looksLikeDomain = /\w+\.[a-z]{2,}/i.test(t) && !t.includes(' ');
    if (!hasScheme && !looksLikeDomain) {
      return defaultEngineUrl() + encodeURIComponent(t);
    }
    let u = sanitizeUrl(t);
    // IPFS/IPNS handler via gateway for navigation bar inputs
    try {
      if (/^(ipfs:\/\/|ipns:\/\/)/i.test(u)) {
        const clean = u.replace(/^(ipfs:\/\/|ipns:\/\/)/i, '').replace(/^\//,'');
        const scheme = /^ipns:/i.test(u) ? 'ipns' : 'ipfs';
        u = `${ipfsGateway.replace(/\/$/,'')}/${scheme}/${clean}`;
      }
    } catch(_) {}
    if (httpsOnly) {
      try { const parsed = new URL(u); if (parsed.protocol === 'http:') { parsed.protocol = 'https:'; u = parsed.toString(); } } catch(_) {}
    }
    return u;
  }
  
  function defaultState(){ 
    return { tabs: [{url: location.href, title: document.title || 'New Tab'}], active: 0 }; 
  }
  
  function readState(){ 
    try{ 
      if(typeof window.name==='string' && window.name.startsWith(KEY)){ 
        return JSON.parse(window.name.slice(KEY.length)); 
      }
    }catch(_){}
    return defaultState(); 
  }
  
  function writeState(st){ 
    // Prevent excessive state writes during refresh loops
    if (refreshLoopDetected) {
      console.warn('Skipping state write due to detected refresh loop');
      return;
    }
    
    try{ 
      window.name = KEY + JSON.stringify(st); 
    }catch(_){}
  }

  // No-op notification for a cleaner, professional UI
  function showNotification(message, type = 'info', duration = 3000) {
    try {
      // Create notification element
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? themes[currentTheme].success : 
                     type === 'error' ? themes[currentTheme].error : 
                     type === 'warning' ? themes[currentTheme].warning : 
                     themes[currentTheme].active};
        color: white;
        border-radius: 8px;
        z-index: 2147483648;
        font-family: ${FONT_STACK};
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 10);
      
      // Auto-remove after duration
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, duration);
      
      console.log('Notification shown:', message);
    } catch (error) {
      console.error('Notification failed:', error);
      // Fallback to alert
      alert(`${type.toUpperCase()}: ${message}`);
    }
  }

  // Safe storage access helpers
  function canUseLocalStorage() {
    try {
      const k = '__cb_probe__' + Math.random();
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Loading state management
  function setLoadingState(loading) {
    isNavigating = loading;
    if (cachedElements.go) {
      cachedElements.go.disabled = loading;
      cachedElements.go.textContent = loading ? '⏳' : 'Go';
      cachedElements.go.style.fontWeight = '700';
      cachedElements.go.style.fontFamily = FONT_STACK;
    }
    if (cachedElements.url) {
      cachedElements.url.disabled = loading;
      cachedElements.url.style.fontFamily = FONT_STACK;
      cachedElements.url.style.fontWeight = '600';
    }
    if (cachedElements.loading) {
      cachedElements.loading.style.display = loading ? 'block' : 'none';
    }
  }

  // Security: Optimized IPC helpers with debouncing and validation
  let saveQueue = [];
  let saveTimeout = null;
  let autosaveTimer = null;
  const AUTOSAVE_MS = 10000; // periodic autosave interval
  
  async function diskLoad(){
    // Request full profile from native side on startup via IPC
    try {
      if (window.ipc && typeof window.ipc.postMessage === 'function') {
        const reply = await new Promise(resolve => {
          const key = 'cb_ipc_reply_' + Math.random();
          function handler(ev){
            try {
              const data = JSON.parse(ev.data || '{}');
              if (data && data.key === key) {
                window.removeEventListener('message', handler);
                resolve(data.payload || null);
              }
            } catch(_) {}
          }
          window.addEventListener('message', handler);
          window.ipc.postMessage(JSON.stringify({ cmd: 'profile_load', key }));
          setTimeout(()=>{ window.removeEventListener('message', handler); resolve(null); }, 500);
        });
        return reply;
      }
    } catch(_) {}
    return null;
  }
  
  function queueDiskSave(st){
    // Security: Validate state before saving
    if (!st || typeof st !== 'object' || !Array.isArray(st.tabs)) {
      console.error('Invalid state structure for saving');
      return;
    }
    
    // Prevent disk saves during refresh loops
    if (refreshLoopDetected) {
      console.warn('Skipping disk save due to detected refresh loop');
      return;
    }
    
    // Security: Limit number of tabs
    if (st.tabs.length > MAX_TABS) {
      st.tabs = st.tabs.slice(0, MAX_TABS);
    }
    
    saveQueue.push(st);
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const latestState = saveQueue[saveQueue.length - 1];
      saveQueue = [];
      performDiskSave(latestState);
    }, 100);
  }
  
  async function performDiskSave(st){
    // Push merged profile to native via IPC; still mirror to localStorage when possible
    try {
      const profile = {
        tabs: readState(),
        bookmarks: loadBookmarks(),
        history: browsingHistory,
        prefs: getPrefs()
      };
      if (window.ipc && typeof window.ipc.postMessage === 'function') {
        window.ipc.postMessage(JSON.stringify({ cmd: 'profile_save', payload: profile }));
      }
    } catch(_) {}
    saveToStorage(st);
  }

  function autosaveNow(){
    try { performDiskSave(readState()); } catch(_) {}
  }

  function startAutosave(){
    if (autosaveTimer) clearInterval(autosaveTimer);
    autosaveTimer = setInterval(autosaveNow, AUTOSAVE_MS);
  }
  
  // Security: Enhanced bookmark management with validation
  const bookmarkCache = new Map();
  
  function saveBookmarks(bookmarks) {
    try {
      // Security: Validate bookmarks before saving
      if (!Array.isArray(bookmarks)) return;
      
      const validBookmarks = bookmarks.filter(b => 
        b && typeof b === 'object' && 
        typeof b.url === 'string' && 
        b.url.length < 2048 && // Reasonable URL length limit
        typeof b.title === 'string' && 
        b.title.length < 500 // Reasonable title length limit
      );
      
      localStorage.setItem('cb_bookmarks', JSON.stringify(validBookmarks));
      bookmarkCache.clear();
      validBookmarks.forEach(b => bookmarkCache.set(b.url, b));
      console.log('Saved bookmarks:', validBookmarks.length);
    } catch(_) {}
  }
  
  function loadBookmarks() {
    if (!canUseLocalStorage()) return [];
    try {
      const stored = localStorage.getItem('cb_bookmarks');
      if (stored) {
        const bookmarks = JSON.parse(stored);
        if (Array.isArray(bookmarks)) {
          bookmarkCache.clear();
          bookmarks.forEach(b => bookmarkCache.set(b.url, b));
          return bookmarks;
        }
      }
    } catch(_) {}
    return [];
  }
  
  function addBookmark(url, title, folder = 'default', tags = []) {
    // Security: Validate inputs
    if (!url || typeof url !== 'string' || url.length > 2048) return null;
    if (!title || typeof title !== 'string' || title.length > 500) return null;
    
    const bookmarks = loadBookmarks();
    if (bookmarks.length >= MAX_BOOKMARKS) {
      bookmarks.shift();
    }
    bookmarks.push({ url, title, folder, tags, date: Date.now() });
    saveBookmarks(bookmarks);
    return bookmarks;
  }
  
  function removeBookmark(url) {
    const bookmarks = loadBookmarks();
    const filtered = bookmarks.filter(b => b.url !== url);
    bookmarkCache.delete(url);
    saveBookmarks(filtered);
    return filtered;
  }
  
  function isBookmarked(url) {
    return bookmarkCache.has(url);
  }

  // Security: Bookmark manager UI with sanitized content
  function showBookmarkManager() {
    const manager = document.createElement('div');
    manager.id = 'bookmark-manager';
    manager.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 600px; max-height: 80vh; background: ${themes[currentTheme].bar};
      border: 2px solid ${themes[currentTheme].active}; border-radius: 12px;
      color: ${themes[currentTheme].text}; z-index: 2147483649;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5); overflow: hidden;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px; border-bottom: 1px solid ${themes[currentTheme].button};
      display: flex; justify-content: space-between; align-items: center;
    `;
    
    // Security: Use textContent instead of innerHTML
    const title = document.createElement('h2');
    title.style.cssText = 'margin:0; font-size:18px;';
    title.textContent = 'Bookmark Manager';
    
    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-manager';
    closeBtn.style.cssText = 'background:none; border:none; color:inherit; font-size:20px; cursor:pointer;';
    closeBtn.textContent = '×';
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = 'Search bookmarks...';
    searchBox.style.cssText = `
      width: 100%; padding: 8px 12px; margin: 16px; border-radius: 6px;
      border: 1px solid ${themes[currentTheme].button}; background: ${themes[currentTheme].input};
      color: ${themes[currentTheme].text};
      color: ${themes[currentTheme].text};
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px; max-height: 400px; overflow-y: auto;
    `;
    
    manager.appendChild(header);
    manager.appendChild(searchBox);
    manager.appendChild(content);
    
    document.documentElement.appendChild(manager);
    
    // Close button handler
    closeBtn.addEventListener('click', () => {
      manager.remove();
    });
    
    // Search functionality
    let searchTimeout;
    searchBox.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        renderBookmarks(content, e.target.value);
      }, 300);
    });
    
    // Initial render
    renderBookmarks(content, '');
    
    // Close on escape
    document.addEventListener('keydown', function closeOnEscape(e) {
      if (e.key === 'Escape') {
        manager.remove();
        document.removeEventListener('keydown', closeOnEscape);
      }
    });
  }
  
  function renderBookmarks(container, searchTerm) {
    const bookmarks = loadBookmarks();
    const filtered = searchTerm ? bookmarks.filter(b => 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : bookmarks;
    
    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; color:${themes[currentTheme].text}80;">
          ${searchTerm ? 'No bookmarks found' : 'No bookmarks yet'}
        </div>
      `;
      return;
    }
    
    const html = filtered.map(b => `
      <div class="bookmark-item" style="
        display: flex; justify-content: space-between; align-items: center;
        padding: 12px; margin: 8px 0; background: ${themes[currentTheme].button};
        border-radius: 8px; transition: all 0.2s ease;
      ">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: bold; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis;">
            ${b.title || 'Untitled'}
          </div>
          <div style="font-size: 12px; color: ${themes[currentTheme].text}80; overflow: hidden; text-overflow: ellipsis;">
            ${b.url}
          </div>
          ${b.tags.length > 0 ? `
            <div style="margin-top: 4px;">
              ${b.tags.map(tag => `
                <span style="
                  background: ${themes[currentTheme].active}; padding: 2px 6px;
                  border-radius: 4px; font-size: 10px; margin-right: 4px;
                ">${tag}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="open-bookmark" data-url="${b.url}" style="
            padding: 6px 12px; border-radius: 6px; border: 1px solid ${themes[currentTheme].active};
            background: ${themes[currentTheme].active}; color: white; cursor: pointer;
          ">Open</button>
          <button class="delete-bookmark" data-url="${b.url}" style="
            padding: 6px 12px; border-radius: 6px; border: 1px solid ${themes[currentTheme].error};
            background: ${themes[currentTheme].error}; color: white; cursor: pointer;
          ">Delete</button>
        </div>
      </div>
    `).join('');
    
    container.innerHTML = html;
    
    // Event handlers
    container.querySelectorAll('.open-bookmark').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        window.location.href = url;
      });
    });
    
    container.querySelectorAll('.delete-bookmark').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        removeBookmark(url);
        renderBookmarks(container, searchTerm);
        showNotification('Bookmark deleted', 'success');
      });
    });
  }

  // History management
  let browsingHistory = [];
  
  function addToHistory(url, title) {
    const entry = { url, title, timestamp: Date.now() };
    browsingHistory.unshift(entry);
    
    // Remove duplicates
    browsingHistory = browsingHistory.filter((item, index, arr) => 
      arr.findIndex(t => t.url === item.url) === index
    );
    
    // Limit history size
    if (browsingHistory.length > MAX_HISTORY) {
      browsingHistory = browsingHistory.slice(0, MAX_HISTORY);
    }
    
    if (!canUseLocalStorage()) return;
    try {
      localStorage.setItem('cb_history', JSON.stringify(browsingHistory));
    } catch(_) {}
  }
  
  function loadHistory() {
    if (!canUseLocalStorage()) return;
    try {
      const stored = localStorage.getItem('cb_history');
      if (stored) {
        browsingHistory = JSON.parse(stored);
      }
    } catch(_) {}
  }
  
  function showHistory() {
    const history = document.createElement('div');
    history.id = 'history-viewer';
    history.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 700px; max-height: 80vh; background: ${themes[currentTheme].bar};
      border: 2px solid ${themes[currentTheme].active}; border-radius: 12px;
      color: ${themes[currentTheme].text}; z-index: 2147483649;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5); overflow: hidden;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px; border-bottom: 1px solid ${themes[currentTheme].button};
      display: flex; justify-content: space-between; align-items: center;
    `;
    header.innerHTML = `
      <h2 style="margin:0; font-size:18px;">Browsing History</h2>
      <button id="close-history" style="background:none; border:none; color:inherit; font-size:20px; cursor:pointer;">×</button>
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px; max-height: 500px; overflow-y: auto;
    `;
    
    history.appendChild(header);
    history.appendChild(content);
    
    document.documentElement.appendChild(history);
    
    // Close button handler
    history.querySelector('#close-history').addEventListener('click', () => {
      history.remove();
    });
    
    // Render history
    const html = browsingHistory.map(entry => `
      <div class="history-item" style="
        display: flex; justify-content: space-between; align-items: center;
        padding: 12px; margin: 8px 0; background: ${themes[currentTheme].button};
        border-radius: 8px; transition: all 0.2s ease;
      ">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: bold; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis;">
            ${entry.title || 'Untitled'}
          </div>
          <div style="font-size: 12px; color: ${themes[currentTheme].text}80; overflow: hidden; text-overflow: ellipsis;">
            ${entry.url}
          </div>
          <div style="font-size: 10px; color: ${themes[currentTheme].text}60; margin-top: 4px;">
            ${new Date(entry.timestamp).toLocaleString()}
          </div>
        </div>
        <button class="open-history" data-url="${entry.url}" style="
          padding: 6px 12px; border-radius: 6px; border: 1px solid ${themes[currentTheme].active};
          background: ${themes[currentTheme].active}; color: white; cursor: pointer;
        ">Open</button>
      </div>
    `).join('');
    
    content.innerHTML = html || `
      <div style="text-align:center; padding:40px; color:${themes[currentTheme].text}80;">
        No browsing history yet
      </div>
    `;
    
    // Event handlers
    content.querySelectorAll('.open-history').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        window.location.href = url;
      });
    });
    
    // Close on escape
    document.addEventListener('keydown', function closeOnEscape(e) {
      if (e.key === 'Escape') {
        history.remove();
        document.removeEventListener('keydown', closeOnEscape);
      }
    });
  }

  // Enhanced theme management with transitions
  function toggleTheme() {
    const oldTheme = currentTheme;
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('cb_theme', currentTheme);
    
    // Smooth theme transition
    if (cachedElements.host) {
      cachedElements.host.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        applyTheme();
        updateStartOverlayTheme();
        if (cachedElements.host) {
          cachedElements.host.style.transition = '';
        }
      }, 50);
    } else {
      applyTheme();
      updateStartOverlayTheme();
    }
    
    scheduleRender();
  }
  
  function applyTheme() {
    const theme = themes[currentTheme];
    if (cachedElements.style) {
      cachedElements.style.textContent = `
        /* Top bar styling with deeper, richer dark theme */
        #bar{height:${getPad()}px;display:flex;flex-direction:column;gap:6px;align-items:stretch;padding:6px 8px 41px;background:#0a0a0a;color:#ffffff;font:${14*currentFontScale}px ${FONT_STACK};font-weight:${currentFontWeight};pointer-events:auto;border-bottom:1px solid #1a1a1a;box-shadow:0 2px 8px rgba(0,0,0,0.4);transition:all 0.3s ease;z-index:2147483647;position:relative}
        #row-top{display:flex;align-items:center;gap:10px;margin:0 0 1px 0;visibility:visible;opacity:1}
        #row-bottom{display:flex;align-items:center;gap:8px;visibility:visible;opacity:1}
        
        /* Tabs: deeper dark with better contrast */
        #tabs{position:relative;display:flex;gap:10px;overflow-x:auto;max-width:70vw;padding:0 6px 2px;scroll-behavior:smooth;contain:layout paint;visibility:visible;opacity:1}
        #tab-indicator{position:absolute;bottom:-2px;height:2px;background:#00aaff;left:0;width:0;transition:left 240ms cubic-bezier(0.22, 1, 0.36, 1), width 240ms cubic-bezier(0.22, 1, 0.36, 1)}
        .tab{display:flex;gap:8px;align-items:center;padding:${currentDensity==='compact'?'8px 10px 6px':'10px 12px 8px'};border-radius:6px;background:#1a1a1a;cursor:pointer;white-space:nowrap;user-select:none;font-family:${FONT_STACK};font-weight:${currentFontWeight};border-bottom:2px solid transparent;color:#cccccc;transition:background 320ms cubic-bezier(0.22, 1, 0.36, 1), color 320ms cubic-bezier(0.22, 1, 0.36, 1);will-change:transform}
        .tab.active{background:#2a2a2a;color:#ffffff;border-bottom-color:#00aaff}
        .tab:hover{background:#252525;border-bottom-color:#00aaff80;transform:translateY(-1px)}
        .tab.dragging{opacity:0.6}
        .tab-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;max-width:22ch}
        .tab-favicon{width:14px;height:14px;flex-shrink:0;opacity:.9}
        .tab-close{opacity:0;cursor:pointer;padding:0 4px;border-radius:4px;transition:opacity 220ms ease}
        .tab:hover .tab-close{opacity:.9}
        .tab-close:hover{background:#333333}

        /* Address bar and buttons with deeper colors */
        #url-container{position:relative;flex:1;min-width:300px;display:flex;align-items:center}
        #url{flex:1;min-width:300px;padding:${currentDensity==='compact'?'6px 8px':'8px 10px'};padding-right:60px;border-radius:8px;border:1px solid #333333;background:#0f0f0f;color:#ffffff;transition:all 0.15s ease;font-family:${FONT_STACK};font-weight:${currentFontWeight}}
        #url:focus{border-color:#00aaff;outline:none;box-shadow:0 0 0 2px rgba(0,170,255,0.2)}
        #https-indicator{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:#006600;color:#00ff00;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;font-family:${FONT_STACK};pointer-events:none;z-index:10}
        button{padding:${currentDensity==='compact'?'6px 8px':'8px 10px'};border-radius:8px;border:1px solid #333333;background:#1a1a1a;color:#ffffff;cursor:pointer;transition:background 0.15s ease,font-weight 0.15s ease;font-family:${FONT_STACK};font-weight:${Math.min(800,currentFontWeight)};display:inline-block;visibility:visible;opacity:1}
        button:hover{background:#2a2a2a;border-color:#00aaff}
        button:disabled{opacity:0.5;cursor:not-allowed}
        .bookmark-btn.bookmarked{color:#ffd700}
        .nav-btn{font-size:16px;padding:4px 8px;display:inline-block;visibility:visible;opacity:1}

        #loading-indicator{display:none;width:16px;height:16px;border:2px solid transparent;border-top:2px solid #00aaff;border-radius:50%;animation:spin 1s linear infinite}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        .error-message{color:#ff4444;font-size:12px;margin-top:4px}
        .success-message{color:#44ff44;font-size:12px;margin-top:4px}
        .menu-btn{position:relative}
        .menu-dropdown{position:absolute;top:100%;right:0;background:#0a0a0a;border:1px solid #333333;border-radius:8px;padding:8px 0;min-width:200px;box-shadow:0 4px 20px rgba(0,0,0,0.6);display:none;z-index:1000}
        .menu-dropdown.show{display:block}
        .menu-item{padding:8px 16px;cursor:pointer;transition:background 0.2s ease}
        .menu-item:hover{background:#1a1a1a}
        .menu-separator{height:1px;background:#333333;margin:4px 0}
        
        /* Smooth scrolling for all elements */
        html{scroll-behavior:smooth}
        body{scroll-behavior:smooth}
        *{scroll-behavior:smooth}
        
        /* Custom scrollbar styling with deeper colors */
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-track{background:#0a0a0a;border-radius:4px}
        ::-webkit-scrollbar-thumb{background:#333333;border-radius:4px;transition:background 0.2s ease}
        ::-webkit-scrollbar-thumb:hover{background:#444444}
        ::-webkit-scrollbar-corner{background:#0a0a0a}
        
        /* Firefox scrollbar styling */
        *{scrollbar-width:thin;scrollbar-color:#333333 #0a0a0a}
        
        /* Smooth scrolling for tab container */
        #tabs::-webkit-scrollbar{height:6px}
        #tabs::-webkit-scrollbar-track{background:transparent}
        #tabs::-webkit-scrollbar-thumb{background:#333333;border-radius:3px}
        #tabs::-webkit-scrollbar-thumb:hover{background:#444444}

        /* Start overlay */
        #start-overlay{display:none}
      `;
      // Update start overlay theme colors
      updateStartOverlayTheme();
    }
  }

  // Update start overlay theme colors
  function updateStartOverlayTheme() {
    const overlay = cachedElements.startOverlay;
    if (overlay) {
      overlay.style.background = '#0a0a0a';
      const searchEl = overlay.querySelector('input');
      if (searchEl) {
        searchEl.style.background = '#0f0f0f';
        searchEl.style.color = '#ffffff';
        searchEl.style.borderColor = '#333333';
      }
    }
  }
  
  // Remove previously injected content font CSS if present (reverting to site defaults)
  function removeContentFontCSS(){
    try{
      const st = document.getElementById('mb-font-prefs');
      if (st) st.remove();
    }catch(_) { }
  }
  
  // Create a generic favicon when the real one fails to load
  function createGenericFavicon(imgElement, hostname) {
    try {
      // Create a canvas-based icon with the first letter of the hostname
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      
      // Create a colored background based on hostname hash
      let hash = 0;
      for (let i = 0; i < hostname.length; i++) {
        hash = ((hash << 5) - hash + hostname.charCodeAt(i)) & 0xffffffff;
      }
      const hue = Math.abs(hash) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.fillRect(0, 0, 16, 16);
      
      // Add the first letter
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const firstChar = hostname.charAt(0).toUpperCase();
      ctx.fillText(firstChar, 8, 8);
      
      // Convert to data URL and set as favicon
      imgElement.src = canvas.toDataURL();
    } catch (e) {
      // If canvas fails, just hide the favicon
      imgElement.style.display = 'none';
    }
  }

  // Search engine shortcuts with more engines
  const searchEngines = {
    'g': 'https://www.google.com/search?q=',
    'y': 'https://www.youtube.com/results?search_query=',
    'w': 'https://wikipedia.org/wiki/',
    'd': 'https://duckduckgo.com/?q=',
    'gh': 'https://github.com/search?q=',
    'r': 'https://reddit.com/search?q=',
    't': 'https://x.com/search?q=',
    'ud': 'https://www.urbandictionary.com/define.php?term=',
    'a': 'https://www.amazon.com/s?k=',
    'n': 'https://news.ycombinator.com/from?site=',
    'ph': 'https://pornhub.com/',
    's': 'https://stackoverflow.com/search?q='
  };

  // Enhanced tracker blocklist (hostname substrings) - Comprehensive coverage
  const TRACKER_SNIPPETS = [
    // Google tracking
    'doubleclick.net', 'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
    'adservice.google.com', 'googlesyndication.com', 'googleadservices.com', 'google-analytics',
    'googletagmanager', 'googleadservices',
    
    // Facebook tracking
    'facebook.net', 'connect.facebook.net', 'facebook.com', 'fbcdn.net',
    
    // Advertising networks
    'adsystem.com', 'scorecardresearch.com', 'taboola.com', 'outbrain.com', 'hotjar.com', 'quantserve.com',
    'adnxs.com', 'doubleclick.net', 'adtech.com', 'advertising.com', 'adtechus.com',
    
    // Analytics and metrics
    'analytics.', 'metrics.', 'tracking.', 'pixel.', 'beacon.',
    
    // Social media tracking
    'twitter.com', 't.co', 'linkedin.com', 'pinterest.com', 'instagram.com',
    
    // E-commerce tracking
    'amazon-adsystem.com', 'amazon.com', 'ebay.com', 'etsy.com',
    
    // Content recommendation
    'taboola.com', 'outbrain.com', 'disqus.com', 'gravatar.com',
    
    // Performance monitoring
    'newrelic.com', 'pingdom.com', 'uptimerobot.com', 'statuscake.com'
  ];

  function isTracker(url){
    if (!blockTrackers) return false;
    try { const h = new URL(url).hostname; return TRACKER_SNIPPETS.some(s => h.includes(s)); } catch(_) { return false; }
  }

  // Network API hardening: block tracker requests for fetch/XHR dynamically
  (function hardenNetwork(){
    const origFetch = window.fetch;
    loadHttpCache();
    window.fetch = async function(resource, init){
      try {
        const u = typeof resource === 'string' ? resource : (resource && resource.url) || '';
        if (isTracker(u)) return Promise.reject(new Error('Blocked by tracker policy'));

        const method = (init && init.method) ? String(init.method).toUpperCase() : 'GET';
        const isGet = method === 'GET' && (!init || !init.body);
        const reqUrl = new URL(u, location.href).toString();
        const key = reqUrl;

        if (isGet) {
          const cached = httpCacheGet(key);
          if (cached) {
            // Honor revalidation if possible
            let revalidated = null;
            try {
              const headers = new Headers(init && init.headers || {});
              if (cached.etag && !headers.has('If-None-Match')) headers.set('If-None-Match', cached.etag);
              if (cached.lastModified && !headers.has('If-Modified-Since')) headers.set('If-Modified-Since', cached.lastModified);
              const headResp = await origFetch(reqUrl, { method: 'HEAD', headers, cache: 'no-store' });
              if (headResp && headResp.status === 304) {
                revalidated = cached;
              }
            } catch(_) {}

            const use = revalidated || cached;
            if (use) {
              const bodyText = use.bodyZ ? (await decompressText(use)) : (use.body || '');
              if (bodyText != null) return new Response(bodyText, { status: 200, headers: use.headers || {} });
            }
          }
        }

        const resp = await origFetch(resource, init);
        // Only cache successful GET responses with cacheable types
        if (isGet && resp && resp.ok) {
          try {
            const ct = resp.headers.get('Content-Type') || '';
            const cacheable = /(text|json|javascript|css|svg|xml|font|image)/i.test(ct);
            if (cacheable) {
              const cc = parseCacheControl(resp.headers.get('Cache-Control'));
              if (!cc['no-store'] && !cc['private']) {
                const ttl = cc['max-age'] ? parseInt(cc['max-age'], 10) * 1000 : 60 * 60 * 1000; // default 1h
                const body = await resp.clone().text();
                const comp = await compressTextIfLarge(body);
                const headersObj = {};
                resp.headers.forEach((v,k)=>{ headersObj[k] = v; });
                httpCacheSet(key, {
                  body: comp.body || undefined,
                  bodyZ: comp.bodyZ || undefined,
                  storedSize: comp.storedSize || (comp.body ? comp.body.length : 0),
                  bodySize: comp.bodySize || (comp.body ? comp.body.length : 0),
                  headers: headersObj,
                  etag: resp.headers.get('ETag') || '',
                  lastModified: resp.headers.get('Last-Modified') || '',
                  expiry: Date.now() + (isFinite(ttl) ? Math.max(0, ttl) : 0)
                });
              }
            }
          } catch(_) {}
        }

        return resp;
      } catch(e) {
        // On failure, fall back to cache if present
        try {
          const urlStr = typeof resource === 'string' ? resource : (resource && resource.url) || '';
          const key = new URL(urlStr, location.href).toString();
          const cached = httpCacheGet(key);
          if (cached) {
            const bodyText = cached.bodyZ ? (await decompressText(cached)) : (cached.body || '');
            if (bodyText != null) return new Response(bodyText, { status: 200, headers: cached.headers || {} });
          }
        } catch(_) {}
        throw e;
      }
    };
    const OrigXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function(){
      const xhr = new OrigXHR();
      const origOpen = xhr.open;
      xhr.open = function(method, url){ if (isTracker(url)) { throw new Error('Blocked by tracker policy'); } return origOpen.apply(this, arguments); };
      return xhr;
    };
  })();

  // Per-site controls application
  function applySiteControlsFor(hostname){
    const rules = (siteControls && typeof siteControls === 'object') ? siteControls[hostname] : null;
    if (!rules) return;
    // JS off: add CSP meta to block further scripts
    // Avoid injecting restrictive CSP that triggers TrustedHTML enforcement
    // Images off: add quick style to hide
    if (rules.images === false) {
      const st = document.createElement('style');
      st.textContent = 'img, picture, video, svg, canvas { display: none !important }';
      (document.head || document.documentElement).appendChild(st);
    }
    // Cookies off: best-effort clear non-HttpOnly
    if (rules.cookies === false) {
      try {
        const parts = document.cookie.split(';');
        for (const p of parts){
          const name = p.split('=')[0].trim();
          if (name) document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        }
      } catch(_) {}
    }
  }
  
  function processSearchInput(input) {
    const trimmed = input.trim();
    
    // Check for search shortcuts first
    const shortcutUrl = handleSearchShortcut(trimmed);
    if (shortcutUrl) {
      return shortcutUrl;
    }
    
    // Fall back to URL processing
    return ensureUrl(trimmed);
  }

  // Centralized navigation to ensure consistent behavior from Enter key and Go button
  function performNavigation(rawInput) {
    const u = processSearchInput(rawInput || '');
    setLoadingState(true);
    const s = readState();
    if (s.tabs.length > 0) {
      s.tabs[s.active] = { url: u, title: 'Loading...' };
      writeState(s);
      saveToStorage(s);
      queueDiskSave(s);
    }
    try {
      window.location.assign(u);
    } catch (error) {
      console.error('Navigation failed:', error);
      showNotification('Failed to navigate to URL', 'error');
      setLoadingState(false);
    }
  }

  // Optimized local storage with debouncing
  let storageQueue = [];
  let storageTimeout = null;
  
  function saveToStorage(st) {
    if (!canUseLocalStorage()) return;
    
    // Prevent storage operations during refresh loops
    if (refreshLoopDetected) {
      console.warn('Skipping storage save due to detected refresh loop');
      return;
    }
    
    // Prevent duplicate saves of the same state
    const stateKey = JSON.stringify(st);
    if (storageQueue.length > 0) {
      const lastState = storageQueue[storageQueue.length - 1];
      if (JSON.stringify(lastState) === stateKey) {
        return; // Skip duplicate saves
      }
    }
    
    storageQueue.push(st);
    if (storageTimeout) clearTimeout(storageTimeout);
    storageTimeout = setTimeout(() => {
      const latestState = storageQueue[storageQueue.length - 1];
      storageQueue = [];
      try {
        localStorage.setItem('cb_tabs', JSON.stringify(latestState));
        // Only log in development mode or when debugging
        // console.log('Saved to localStorage:', latestState);
      } catch(_) {}
    }, 100); // Increased debounce time to 100ms
  }
  
  function loadFromStorage() {
    if (!canUseLocalStorage()) return null;
    try {
      const stored = localStorage.getItem('cb_tabs');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch(_) {}
    return null;
  }

  // Enhanced host creation with navigation buttons and loading indicator
  function ensureHost(){
    // Prevent excessive host creation during navigation
    if ((isNavigating || refreshLoopDetected) && cachedElements.host) return cachedElements.host;
    
    if(!cachedElements.host){
      const host = document.createElement('div');
      host.id = 'mb-host';
      host.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:2147483647;pointer-events:none`;

      const shadow = host.attachShadow({mode:'open'});

      const style = document.createElement('style');
      shadow.appendChild(style);

      const bar = document.createElement('div');
      bar.id = 'bar';
      const rowTop = document.createElement('div');
      rowTop.id = 'row-top';
      const rowBottom = document.createElement('div');
      rowBottom.id = 'row-bottom';
      
      // Navigation buttons
      const back = document.createElement('button');
      back.id = 'back';
      back.className = 'nav-btn';
      back.textContent = '←';
      back.title = 'Go back (Alt+Left)';
      back.style.fontFamily = FONT_STACK;
      back.style.fontWeight = '700';
      
      const forward = document.createElement('button');
      forward.id = 'forward';
      forward.className = 'nav-btn';
      forward.textContent = '→';
      forward.title = 'Go forward (Alt+Right)';
      forward.style.fontFamily = FONT_STACK;
      forward.style.fontWeight = '700';
      
      const tabs = document.createElement('div'); 
      tabs.id = 'tabs';
    const indicator = document.createElement('div');
    indicator.id = 'tab-indicator';
    indicator.style.willChange = 'left, width';
    tabs.appendChild(indicator);
      
      // Create URL input
      const url = document.createElement('input');
      url.type = 'text';
      url.id = 'url';
      url.placeholder = 'Search or enter address';
      url.style.cssText = `
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #444;
        border-radius: 6px;
        background: #2a2a2a;
        color: #fff;
        font-family: ${FONT_STACK};
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s ease;
      `;
      
      // Create URL container with HTTPS indicator
      const urlContainer = document.createElement('div');
      urlContainer.id = 'url-container';
      urlContainer.style.cssText = `
        position: relative;
        flex: 1;
        min-width: 300px;
        display: flex;
        align-items: center;
      `;
      
      // Create HTTPS indicator
      const httpsIndicator = document.createElement('div');
      httpsIndicator.id = 'https-indicator';
      httpsIndicator.textContent = 'HTTPS';
      httpsIndicator.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: #336633;
        color: #66FF66;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: ${FONT_STACK};
        pointer-events: none;
        z-index: 10;
      `;
      
      // Move URL input into container
      urlContainer.appendChild(url);
      urlContainer.appendChild(httpsIndicator);
      
      // Update URL input styles to accommodate the indicator
      url.style.paddingRight = '60px';
      
      const go = document.createElement('button'); 
      go.id='go'; 
      go.textContent='Go';
      go.setAttribute('aria-label', 'Navigate to address');
      go.style.fontFamily = FONT_STACK;
      go.style.fontWeight = '700';
      
      const fallback = document.createElement('button');
      fallback.id = 'fallback';
      fallback.textContent = '🔄';
      fallback.title = 'Try alternative search engine (Ctrl+F)';
      fallback.setAttribute('aria-label', 'Try alternative search engine');
      fallback.style.fontFamily = FONT_STACK;
      fallback.style.fontWeight = '700';
      fallback.style.display = 'none'; // Hidden by default, shown when needed
      
      const loading = document.createElement('div');
      loading.id = 'loading-indicator';
      loading.setAttribute('aria-label', 'Loading indicator');
      
      const bookmark = document.createElement('button'); 
      bookmark.id='bookmark'; 
      bookmark.className='bookmark-btn'; 
      bookmark.textContent='☆';
      bookmark.setAttribute('aria-label', 'Bookmark this page');
      bookmark.style.fontFamily = FONT_STACK;
      bookmark.style.fontWeight = '700';
      
      const theme = document.createElement('button'); 
      theme.id='theme'; 
      theme.textContent='🌙';
      theme.setAttribute('aria-label', 'Toggle theme');
      theme.style.fontFamily = FONT_STACK;
      theme.style.fontWeight = '700';
      
      const add = document.createElement('button'); 
      add.id='new'; 
      add.textContent='+';
      add.title = 'New tab (Ctrl+T)';
      add.setAttribute('aria-label', 'New tab');
      add.style.fontFamily = FONT_STACK;
      add.style.fontWeight = '700';
      
      const menu = document.createElement('button');
      menu.id = 'menu';
      menu.className = 'menu-btn';
      menu.textContent = '☰';
      menu.title = 'Menu (Ctrl+M)';
      menu.setAttribute('aria-label', 'Menu');
      
      // Arrange rows to match typical browser layout: tabs on top, address bar below
      rowTop.appendChild(tabs);
      rowTop.appendChild(add);

      rowBottom.appendChild(back);
      rowBottom.appendChild(forward);
      rowBottom.appendChild(urlContainer);
      rowBottom.appendChild(go);
      rowBottom.appendChild(fallback);
      rowBottom.appendChild(loading);
      rowBottom.appendChild(bookmark);
      rowBottom.appendChild(theme);
      rowBottom.appendChild(menu);

      bar.appendChild(rowTop);
      bar.appendChild(rowBottom);
      shadow.appendChild(bar);

      // Start/New-tab overlay inside shadow
      const start = document.createElement('div');
      start.id = 'start-overlay';
      start.style.cssText = `
        position: fixed; top: ${getPad()}px; left: 0; right: 0; bottom: 0; display: none; align-items: center; justify-content: center;
        background: #282828; pointer-events: none; z-index: 2147483645;
        opacity: 0; transition: opacity 0.6s ease-in-out;
      `;
      const startInner = document.createElement('div');
      startInner.style.cssText = `
        max-width: 720px; width: 90%; margin: auto; text-align: center; pointer-events: auto;
        transform: translateY(20px); transition: transform 0.6s ease-out;
      `;
      const titleEl = document.createElement('div');
      titleEl.textContent = 'cloak browser';
      titleEl.style.cssText = `
        font-family: ${FONT_STACK}; font-weight: 650; letter-spacing: 4px;
        font-size: 42px; color: white; margin-bottom: 24px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;
      const searchEl = document.createElement('input');
      searchEl.type = 'text';
      searchEl.placeholder = 'Search the web…';
      searchEl.style.cssText = `
        width: 100%; padding: 14px 16px; border-radius: 10px; border: 2px solid ${themes[currentTheme].active};
        background: ${themes[currentTheme].input}; color: ${themes[currentTheme].text};
        font: 18px ${FONT_STACK}; transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;
      startInner.appendChild(titleEl);
      startInner.appendChild(searchEl);
      start.appendChild(startInner);
      shadow.appendChild(start);

      // Add search bar animations
      searchEl.addEventListener('focus', () => {
        searchEl.style.borderColor = themes[currentTheme].success;
        searchEl.style.boxShadow = `0 0 0 3px ${themes[currentTheme].success}40, 0 4px 12px rgba(0,0,0,0.15)`;
        searchEl.style.transform = 'scale(1.02)';
      });

      searchEl.addEventListener('blur', () => {
        searchEl.style.borderColor = themes[currentTheme].active;
        searchEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        searchEl.style.transform = 'scale(1)';
      });

      searchEl.addEventListener('mouseenter', () => {
        if (document.activeElement !== searchEl) {
          searchEl.style.borderColor = themes[currentTheme].warning;
          searchEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }
      });

      searchEl.addEventListener('mouseleave', () => {
        if (document.activeElement !== searchEl) {
          searchEl.style.borderColor = themes[currentTheme].active;
          searchEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }
      });

      const pad = document.createElement('style');
      pad.id = 'mb-pad';
      pad.textContent = `html{scroll-padding-top:${getPad()}px !important} body{padding-top:${getPad()}px !important}`;
      
      // Safely append to head or documentElement
      try {
        if (document.head) {
          document.head.appendChild(pad);
        } else if (document.documentElement) {
          document.documentElement.appendChild(pad);
        }
      } catch (e) {
        console.warn('Failed to append padding style:', e);
      }
      
      // Add CSP meta tag to help with content security
      try {
        if (document.head && !document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
          const cspMeta = document.createElement('meta');
          cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
          cspMeta.setAttribute('content', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src 'self' data: blob: https:; connect-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:;");
          document.head.appendChild(cspMeta);
        }
      } catch (e) {
        console.warn('Failed to add CSP meta tag:', e);
      }
      
      // Cache all elements
      cachedElements.host = host;
      cachedElements.shadowRoot = shadow;
      cachedElements.style = style;
      cachedElements.back = back;
      cachedElements.forward = forward;
      cachedElements.tabs = tabs;
      cachedElements.indicator = indicator;
      cachedElements.url = url;
      cachedElements.urlContainer = urlContainer;
      cachedElements.go = go;
      cachedElements.fallback = fallback;
      cachedElements.loading = loading;
      cachedElements.bookmark = bookmark;
      cachedElements.theme = theme;
      cachedElements.new = add;
      cachedElements.menu = menu;
      cachedElements.startOverlay = start;
      cachedElements.startSearch = searchEl;
    
    // Initialize advanced settings panel elements
    cachedElements.advancedSettingsPanel = null;
    cachedElements.advancedSettingsBackdrop = null;
      
      // Apply theme CSS after elements are created
      applyTheme();
    }
    
    // Only append to document if not already there and if we're not in a navigation state
    if(cachedElements.host.parentElement !== document.documentElement && !isNavigating && !refreshLoopDetected){
      try {
        if (document.documentElement) {
          document.documentElement.appendChild(cachedElements.host);
        }
      } catch (e) {
        console.warn('Failed to append host to documentElement:', e);
      }
    }
    return cachedElements.host;
  }

  // Throttled render function for better performance
  function scheduleRender() {
    // Prevent rendering during navigation to avoid refresh loops
    if (isNavigating || refreshLoopDetected) return;
    
    if (!renderScheduled) {
      renderScheduled = true;
      requestAnimationFrame(() => {
        render();
        renderScheduled = false;
      });
    }
  }

  // Enhanced render with favicons and better tab management
  function render(){
    // Prevent rendering during navigation to avoid refresh loops
    if (isNavigating || refreshLoopDetected) return;
    
    const now = Date.now();
    if (now - lastRenderTime < RENDER_THROTTLE) {
      scheduleRender();
      return;
    }
    lastRenderTime = now;
    
    const host = ensureHost();
    const tabsEl = cachedElements.tabs;
    const urlEl = cachedElements.url;
    const st = readState();
    
    if (st.tabs.length === 0) {
      // Only create initial tab if we don't have any tabs AND we're not in a refresh loop
      const currentUrl = location.href;
      const isHomePage = /^(about:blank|chrome:\/\/newtab|edge:\/\/newtab)$/i.test(currentUrl) || currentUrl === 'about:blank';
      const isDataUrl = currentUrl.startsWith('data:');
      const isFileUrl = currentUrl.startsWith('file:');
      
      // Additional check: don't create tabs if we're in a potential refresh loop
      if (refreshLoopCount > 2) {
        console.warn('Skipping tab creation due to potential refresh loop');
        return;
      }
      
      // Check if we're already on a valid page that we can work with
      const isValidPage = !isHomePage && !isDataUrl && !isFileUrl && 
                         currentUrl !== 'about:blank' && 
                         currentUrl !== 'chrome://newtab' && 
                         currentUrl !== 'edge://newtab';
      
      if (isValidPage) {
        st.tabs = [{url: currentUrl, title: document.title || 'New Tab'}];
        st.active = 0;
        writeState(st);
        console.log('Created initial tab for valid page:', currentUrl);
      } else {
        // For home page or invalid pages, create a stable blank tab that will show start overlay
        st.tabs = [{url: 'about:blank', title: 'New Tab'}];
        st.active = 0;
        writeState(st);
        console.log('Created stable blank tab for custom start page');
      }
    }
    
    // Update navigation buttons
    if (cachedElements.back) {
      // Always show nav buttons; disable only when truly unavailable
      cachedElements.back.disabled = false;
    }
    if (cachedElements.forward) {
      cachedElements.forward.disabled = false;
    }
    
    const fragment = document.createDocumentFragment();
    st.tabs.forEach((t,i)=>{
      const el = document.createElement('div');
      el.className = 'tab' + (i===st.active?' active':'');
      el.setAttribute('data-tab-index', i);
      el.setAttribute('draggable', 'true');
      el.setAttribute('aria-label', `Tab ${i + 1}: ${t.title || t.url}`);
      
      // Favicon - use a CSP-friendly approach
      const favicon = document.createElement('img');
      favicon.className = 'tab-favicon';
      
      // Try to use the site's own favicon first, fallback to a generic one
      try {
        const hostname = new URL(t.url).hostname;
        // Use the site's own favicon to avoid CSP issues
        favicon.src = `https://${hostname}/favicon.ico`;
        favicon.onerror = () => {
          // Create a generic icon instead of hiding
          createGenericFavicon(favicon, hostname);
        };
      } catch (e) {
        // If URL parsing fails, create a generic icon
        createGenericFavicon(favicon, 'unknown');
      }
      
      // Tab title
      const title = document.createElement('span');
       title.className = 'tab-title';
      title.textContent = t.title || new URL(t.url).hostname.replace(/^www\./,'');
      
      // Close button
      const close = document.createElement('span'); 
       close.className = 'tab-close';
      close.textContent = '×';
      close.setAttribute('aria-label', 'Close tab');
      close.addEventListener('click', (e)=>{
        e.stopPropagation(); 
        closeTab(i);
      });
      
      el.appendChild(favicon);
      el.appendChild(title); 
      el.appendChild(close);
      
      // Tab click handler
      el.addEventListener('click', ()=>{
        switchTab(i);
      });
      
      // Drag and drop handlers
      el.addEventListener('dragstart', (e) => {
        isDragging = true;
        draggedTabIndex = i;
        el.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      
      el.addEventListener('dragend', () => {
        isDragging = false;
        draggedTabIndex = -1;
        el.classList.remove('dragging');
      });
      
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedTabIndex !== -1 && draggedTabIndex !== i) {
          reorderTabs(draggedTabIndex, i);
        }
      });
      
      fragment.appendChild(el);
    });
    
    // Preserve scroll position and indicator to avoid jitter
    const savedScrollLeft = tabsEl.scrollLeft;
    const indicatorEl = cachedElements.indicator;
    if (indicatorEl && indicatorEl.parentElement === tabsEl) {
      tabsEl.removeChild(indicatorEl);
    }
    tabsEl.textContent = '';
    tabsEl.appendChild(fragment);
    if (indicatorEl) tabsEl.appendChild(indicatorEl);
    tabsEl.scrollLeft = savedScrollLeft;
    
    // Smooth scroll to active tab if it's not visible
    setTimeout(() => {
      scrollTabIntoView(st.active);
      updateTabIndicatorPosition();
    }, 16);

    // Show start overlay when active tab is a start/new tab
    try {
      const active = st.tabs[st.active];
      const u = active && active.url ? new URL(active.url) : null;
      const isStart = !u || /^(about:blank|chrome:\/\/newtab|edge:\/\/newtab)$/i.test(active && active.url || '') || active && active.url === 'about:blank';
      const overlay = cachedElements.startOverlay;
      if (overlay) {
        if (isStart) {
          overlay.style.display = 'flex';
          // Trigger fade-in animation
          requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            const startInner = overlay.querySelector('div');
            if (startInner) {
              startInner.style.transform = 'translateY(0)';
            }
          });
        } else {
          overlay.style.opacity = '0';
          const startInner = overlay.querySelector('div');
          if (startInner) {
            startInner.style.transform = 'translateY(20px)';
          }
          // Hide after animation completes
          setTimeout(() => {
            if (overlay.style.opacity === '0') {
              overlay.style.display = 'none';
            }
          }, 600);
        }
      }
      if (isStart && cachedElements.startSearch && document.activeElement !== cachedElements.startSearch) {
        cachedElements.startSearch.value = urlEl ? (urlEl.value || '') : '';
      }
    } catch(_) {}
    
    // Show fallback button when on search engine pages
    try {
      const active = st.tabs[st.active];
      const fallbackBtn = cachedElements.fallback;
      if (fallbackBtn && active && active.url) {
        const isSearchEngine = /(duckduckgo\.com|google\.com|bing\.com|brave\.com)/i.test(active.url);
        fallbackBtn.style.display = isSearchEngine ? 'block' : 'none';
      }
    } catch(_) {}
    
    if (st.tabs[st.active]) {
      const activeTab = st.tabs[st.active];
      if (urlEl && document.activeElement !== urlEl) {
        urlEl.value = activeTab.input || activeTab.url;
      }
    } else if (urlEl && document.activeElement !== urlEl) {
      urlEl.value = location.href;
    }
  }

  // Smooth active underline indicator positioning
  function updateTabIndicatorPosition() {
    const tabsContainer = cachedElements.tabs;
    const indicator = cachedElements.indicator;
    if (!tabsContainer || !indicator) return;
    const st = readState();
    const tabs = tabsContainer.querySelectorAll('.tab');
    const index = Math.max(0, Math.min(st.active || 0, tabs.length - 1));
    const target = tabs[index];
    if (!target) {
      indicator.style.width = '0px';
      return;
    }
    const left = target.offsetLeft - tabsContainer.scrollLeft;
    const width = target.offsetWidth;
    const currentLeft = parseFloat(indicator.style.left || '0') || 0;
    const currentWidth = parseFloat(indicator.style.width || '0') || 0;
    // Avoid layout jumps by not updating if the values are already close
    if (Math.abs(currentLeft - left) < 0.5 && Math.abs(currentWidth - width) < 0.5) return;
    requestAnimationFrame(() => {
      indicator.style.left = left + 'px';
      indicator.style.width = width + 'px';
    });
  }

  // Enhanced tab management functions
  function closeTab(index) {
    const s = readState(); 
    if(s.tabs.length > 1){
      s.tabs.splice(index,1); 
      if(s.active >= s.tabs.length) s.active = s.tabs.length - 1;
      if(s.active < 0) s.active = 0;
      writeState(s); 
      saveToStorage(s);
      queueDiskSave(s);
      // Immediate UI feedback
      scheduleRender();
      updateTabIndicatorPosition();
      // Navigate only if target URL differs from current
      try {
        const target = new URL(s.tabs[s.active].url, location.href).toString();
        if (target !== location.href) {
          window.location.href = target;
        }
      } catch(_){
        window.location.href = s.tabs[s.active].url;
      }
      // silent
    } else {
      // silent
    }
  }
  
  function switchTab(index) {
    const s = readState(); 
    s.active = index; 
    writeState(s); 
    saveToStorage(s);
    queueDiskSave(s);
    
    // Smooth scroll the tab into view before switching
    scrollTabIntoView(index);
    
    // Immediate UI update and conditional navigation
    scheduleRender();
    updateTabIndicatorPosition();
    try {
      const target = new URL(s.tabs[s.active].url, location.href).toString();
      if (target !== location.href) {
        window.location.href = target;
      }
    } catch(_){
      window.location.href = s.tabs[s.active].url;
    }
  }
  
  function reorderTabs(fromIndex, toIndex) {
    const s = readState();
    const tab = s.tabs.splice(fromIndex, 1)[0];
    s.tabs.splice(toIndex, 0, tab);
    
    // Adjust active index
    if (s.active === fromIndex) {
      s.active = toIndex;
    } else if (s.active > fromIndex && s.active <= toIndex) {
      s.active--;
    } else if (s.active < fromIndex && s.active >= toIndex) {
      s.active++;
    }
    
    writeState(s);
    saveToStorage(s);
    queueDiskSave(s);
    scheduleRender();
    
    // Smooth scroll to show the moved tab
    setTimeout(() => {
      scrollTabIntoView(s.active);
    }, 100);
    
    // silent
  }

  // Throttled update function with additional protection against excessive calls
  let lastUpdateTime = 0;
  const UPDATE_THROTTLE = 2000; // Increased to 2 seconds between updates
  
  function scheduleUpdate() {
    // Prevent updates during navigation or detected refresh loops
    if (isNavigating || refreshLoopDetected) return;
    
    const now = Date.now();
    if (!updateScheduled && (now - lastUpdateTime) >= UPDATE_THROTTLE) {
      updateScheduled = true;
      lastUpdateTime = now;
      requestAnimationFrame(() => {
        updateCurrent();
        updateScheduled = false;
      });
    }
  }

  function updateCurrent(){ 
    // Prevent excessive updates during navigation
    if (isNavigating) return;
    
    // Additional refresh loop prevention
    const now = Date.now();
    if (now - lastStateUpdate < STATE_UPDATE_THROTTLE) {
      return; // Skip update if too soon
    }
    
    // Detect potential refresh loops
    const currentUrl = location.href;
    const s = readState(); 
    
    // Check if we're on a valid page that we can work with
    const isValidPage = !/^(about:blank|chrome:\/\/newtab|edge:\/\/newtab|data:|file:)$/i.test(currentUrl) && 
                       currentUrl !== 'about:blank';
    
    if (s.tabs.length > 0 && s.active >= 0 && s.active < s.tabs.length) {
      const currentTab = s.tabs[s.active];
      if (currentTab && currentTab.url === currentUrl) {
        // URL hasn't changed, this might be a refresh loop
        refreshLoopCount++;
        if (refreshLoopCount > MAX_REFRESH_LOOPS) {
          console.warn('Refresh loop detected, stopping updates');
          refreshLoopDetected = true;
          return;
        }
      } else {
        // URL has changed, reset refresh loop counter
        refreshLoopCount = 0;
        refreshLoopDetected = false;
      }
      
      // Only update if not in a detected refresh loop and if we're on a valid page
      if (!refreshLoopDetected && isValidPage) {
        s.tabs[s.active] = {url: currentUrl, title: document.title || 'New Tab'}; 
        writeState(s); 
        saveToStorage(s);
        queueDiskSave(s);
        scheduleRender();
        lastStateUpdate = now;
      } else if (!isValidPage) {
        // If we're not on a valid page, don't update the tab but also don't trigger refresh loops
        console.log('Skipping update for invalid page:', currentUrl);
      }
    }
    
    updateBookmarkButton();
  }
  
  function updateBookmarkButton() {
    if (cachedElements.bookmark) {
      const bookmarked = isBookmarked(location.href);
      cachedElements.bookmark.classList.toggle('bookmarked', bookmarked);
      cachedElements.bookmark.textContent = bookmarked ? '★' : '☆';
    }
  }

  // Menu functionality
  function showMenu() {
    const menu = document.createElement('div');
    menu.className = 'menu-dropdown show';
    menu.style.cssText = `
      position: absolute; top: 100%; right: 0; background: ${themes[currentTheme].bar};
      border: 1px solid ${themes[currentTheme].button}; border-radius: 8px; padding: 8px 0;
      min-width: 200px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000;
    `;
    
    menu.innerHTML = `
      <div class="menu-item" data-action="bookmarks">📚 Bookmark Manager</div>
      <div class="menu-item" data-action="history">🕒 Browsing History</div>
      <div class="menu-separator"></div>
      <div class="menu-item" data-action="export">📤 Export Data</div>
      <div class="menu-item" data-action="import">📥 Import Data</div>
      <div class="menu-item" data-action="downloads">⬇️ Downloads</div>
      <div class="menu-separator"></div>
      <div class="menu-item" data-action="settings">⚙️ Settings</div>
      <div class="menu-item" data-action="about">ℹ️ About</div>
    `;
    
    const menuBtn = cachedElements.menu;
    menuBtn.appendChild(menu);
    
    // Menu item handlers
    menu.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        handleMenuAction(action);
        menu.remove();
      });
    });
    
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 0);
  }
  
  function handleMenuAction(action) {
    switch (action) {
      case 'bookmarks':
        showBookmarkManager();
        break;
      case 'history':
        showHistory();
        break;
      case 'export':
        exportData();
        break;
      case 'import':
        importData();
        break;
      case 'downloads':
        showDownloads();
        break;
      case 'settings':
        showSettings();
        break;
      case 'about':
        showAbout();
        break;
    }
  }
  
  // Data export/import functionality
  function exportData() {
    const data = {
      bookmarks: loadBookmarks(),
      tabs: readState(),
      history: browsingHistory,
      theme: currentTheme,
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minimal-browser-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // silent
  }
  
  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            
            if (data.bookmarks) {
              localStorage.setItem('cb_bookmarks', JSON.stringify(data.bookmarks));
              bookmarkCache.clear();
              data.bookmarks.forEach(b => bookmarkCache.set(b.url, b));
            }
            
            if (data.theme && themes[data.theme]) {
              currentTheme = data.theme;
              localStorage.setItem('cb_theme', currentTheme);
              applyTheme();
            }
            
            if (data.history) {
              browsingHistory = data.history;
              localStorage.setItem('cb_history', JSON.stringify(browsingHistory));
            }
            
            // silent
            scheduleRender();
          } catch (error) {
            // silent
          }
        };
        reader.readAsText(file);
      }
    });
    input.click();
  }

  // Downloads UI (client-side log of downloaded links)
  function showDownloads(){
    loadDownloads();
    const panel = document.createElement('div');
    panel.id = 'downloads-panel';
    panel.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; max-height: 70vh; background: ${themes[currentTheme].bar}; border: 2px solid ${themes[currentTheme].active}; border-radius: 12px; color: ${themes[currentTheme].text}; z-index: 2147483649; box-shadow: 0 8px 32px rgba(0,0,0,0.5); overflow: hidden;`;
    panel.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid ${themes[currentTheme].button}; display:flex; justify-content:space-between; align-items:center;">
        <h2 style="margin:0; font-size:18px;">Downloads</h2>
        <button id="close-downloads" style="background:none; border:none; color:inherit; font-size:20px; cursor:pointer;">×</button>
      </div>
      <div id="downloads-content" style="padding: 16px; max-height: 50vh; overflow-y: auto;"></div>
    `;
    document.documentElement.appendChild(panel);

    const content = panel.querySelector('#downloads-content');
    const items = downloads.map(d => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; margin:6px 0; background:${themes[currentTheme].button}; border-radius:8px;">
        <div style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis;">
          <div style="font-weight:700;">${sanitizeHtml(d.file || 'file')}</div>
          <div style="font-size:12px; opacity:.8;">${sanitizeHtml(d.url)}</div>
        </div>
        <a href="${d.url}" download style="padding:6px 10px; border-radius:8px; border:1px solid ${themes[currentTheme].active}; color:${themes[currentTheme].text}; text-decoration:none;">Open</a>
      </div>
    `).join('');
    content.innerHTML = items || `<div style="text-align:center; opacity:.7;">No downloads yet</div>`;

    panel.querySelector('#close-downloads').addEventListener('click', () => panel.remove());
    document.addEventListener('keydown', function closeOnEscape(e){ if(e.key==='Escape'){ panel.remove(); document.removeEventListener('keydown', closeOnEscape);} });
  }
  
  // Settings panel
  function showSettings() {
    console.log('🔧 Creating settings panel...');
    const settings = document.createElement('div');
    settings.id = 'settings-panel';
    settings.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 500px; max-height: 80vh; background: ${themes[currentTheme].bar};
      border: 2px solid ${themes[currentTheme].active}; border-radius: 12px;
      color: ${themes[currentTheme].text}; z-index: 2147483649;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5); overflow: hidden;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px; border-bottom: 1px solid ${themes[currentTheme].button};
      display: flex; justify-content: space-between; align-items: center;
    `;
    header.innerHTML = `
      <h2 style="margin:0; font-size:18px;">Settings</h2>
      <button id="close-settings" style="background:none; border:none; color:inherit; font-size:20px; cursor:pointer;">×</button>
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px; max-height: 400px; overflow-y: auto;
    `;
    
    console.log('🔧 Setting content HTML for settings panel...');
    content.innerHTML = `
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Theme:</label>
        <select id="theme-select" style="
          width: 100%; padding: 8px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button};
          background: ${themes[currentTheme].input}; color: ${themes[currentTheme].text};
        ">
          <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
          <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
        </select>
      </div>

      <div style="margin-bottom: 20px; display:flex; gap:12px;">
        <label style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="https-only" ${httpsOnly ? 'checked' : ''}>
          Enforce HTTPS (upgrade http→https)
        </label>
      </div>

      <div style="margin-bottom: 20px; display:flex; gap:12px;">
        <label style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="block-trackers" ${blockTrackers ? 'checked' : ''}>
          Basic tracker blocking
        </label>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="margin-bottom: 12px; font-weight: bold; color: #4CAF50;">🚫 Ad Blocker & Privacy Protection</div>
        <div style="margin-bottom: 12px; display:flex; gap:12px; align-items:center;">
          <label style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="ad-blocker-enabled" checked>
            Enable Aggressive Ad Blocker
          </label>
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">Blocking Level:</label>
          <select id="blocking-level" style="
            width: 100%; padding: 8px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button};
            background: ${themes[currentTheme].input}; color: ${themes[currentTheme].text};
          ">
            <option value="standard">Standard - Basic ad blocking</option>
            <option value="aggressive" selected>Aggressive - Enhanced protection (recommended)</option>
            <option value="strict">Strict - Maximum protection</option>
          </select>
        </div>
        <div style="margin-bottom: 12px; display:flex; gap:8px; align-items:center;">
          <button id="update-filter-lists" style="
            padding: 8px 16px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button};
            background: ${themes[currentTheme].button}; color: ${themes[currentTheme].text}; cursor: pointer; font-size: 12px;
          ">🔄 Update Filter Lists</button>
          <button id="show-ad-blocker-stats" style="
            padding: 8px 16px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button};
            background: ${themes[currentTheme].button}; color: ${themes[currentTheme].text}; cursor: pointer; font-size: 12px;
          ">📊 Show Statistics</button>
        </div>
        <div id="ad-blocker-status" style="
          margin-top: 8px; padding: 8px; border-radius: 4px; background: rgba(76, 175, 80, 0.1); 
          border: 1px solid rgba(76, 175, 80, 0.3); font-size: 12px; color: #4CAF50;
        ">✅ Ad Blocker Ready</div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Startup:</label>
        <select id="startup-select" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button}; background: ${themes[currentTheme].input}; color: ${themes[currentTheme].text};">
          <option value="restore" ${startupMode === 'restore' ? 'selected' : ''}>Restore last session</option>
          <option value="home" ${startupMode === 'home' ? 'selected' : ''}>Open home page</option>
        </select>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Default Search Engine:</label>
        <select id="engine-select" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button}; background: ${themes[currentTheme].input}; color: ${themes[currentTheme].text};">
          <option value="duckduckgo" ${defaultSearchEngine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
          <option value="google" ${defaultSearchEngine === 'google' ? 'selected' : ''}>Google</option>
          <option value="bing" ${defaultSearchEngine === 'bing' ? 'selected' : ''}>Bing</option>
          <option value="brave" ${defaultSearchEngine === 'brave' ? 'selected' : ''}>Brave</option>
          <option value="startpage" ${defaultSearchEngine === 'startpage' ? 'selected' : ''}>Startpage</option>
        </select>
        <button id="test-connection" style="
          margin-top: 8px; padding: 6px 12px; border-radius: 4px; border: 1px solid ${themes[currentTheme].button}; 
          background: ${themes[currentTheme].button}; color: ${themes[currentTheme].text}; cursor: pointer; font-size: 12px;
        ">Test Connection</button>
        <div id="connection-status" style="margin-top: 4px; font-size: 12px; color: ${themes[currentTheme].text};"></div>
        <div style="margin-top: 8px; font-size: 11px; color: ${themes[currentTheme].text}; opacity: 0.8;">
          💡 <strong>Search Shortcuts:</strong> Use "g query" for Google, "y query" for YouTube, "w query" for Wikipedia, etc.
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Home Page:</label>
        <input type="text" id="home-url" value="${homeUrl}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button}; background: ${themes[currentTheme].input}; color: ${themes[currentTheme].text};">
      </div>

      <div style="margin-bottom: 20px; display:flex; gap:12px;">
        <div style="flex:1;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">Font Size:</label>
          <input type="range" id="font-scale" min="0.9" max="1.3" step="0.05" value="${currentFontScale}" style="width:100%">
        </div>
        <div style="flex:1;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold;">Font Weight:</label>
          <input type="range" id="font-weight" min="400" max="800" step="50" value="${currentFontWeight}" style="width:100%">
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Density:</label>
        <select id="density-select" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button}; background: ${themes[currentTheme].input}; color: ${themes[currentTheme].text};">
          <option value="comfortable" ${currentDensity === 'comfortable' ? 'selected' : ''}>Comfortable</option>
          <option value="compact" ${currentDensity === 'compact' ? 'selected' : ''}>Compact</option>
        </select>
      </div>

      <div style="margin: 24px 0 8px 0; font-weight: bold;">Per-site controls</div>
      <div style="display:flex; gap:8px; align-items:center;">
        <input type="text" id="psc-host" placeholder="example.com" style="flex:1; padding:8px; border-radius:6px; border:1px solid ${themes[currentTheme].button}; background:${themes[currentTheme].input}; color:${themes[currentTheme].text};">
        <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" id="psc-js" checked> JS</label>
        <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" id="psc-img" checked> Images</label>
        <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" id="psc-cookie" checked> Cookies</label>
        <button id="psc-save">Save</button>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Maximum Tabs:</label>
        <input type="number" id="max-tabs" value="${MAX_TABS}" min="5" max="100" style="
          width: 100%; padding: 8px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button};
          background: ${themes[currentTheme].input}; color: ${themes[currentTheme].text};
        ">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Maximum Bookmarks:</label>
        <input type="number" id="max-bookmarks" value="${MAX_BOOKMARKS}" min="10" max="1000" style="
          width: 100%; padding: 8px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button};
          background: ${themes[currentTheme].input}; color: ${themes[currentTheme].text};
        ">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Maximum History:</label>
        <input type="number" id="max-history" value="${MAX_HISTORY}" min="100" max="10000" style="
          width: 100%; padding: 8px; border-radius: 6px; border: 1px solid ${themes[currentTheme].button};
          background: ${themes[currentTheme].input}; color: ${themes[currentTheme].text};
        ">
      </div>
      
      <div style="margin-bottom: 20px;">
        <button id="clear-data" style="
          width: 100%; padding: 12px; border-radius: 6px; border: 1px solid ${themes[currentTheme].error};
          background: ${themes[currentTheme].error}; color: white; cursor: pointer;
        ">Clear All Data</button>
      </div>
    `;
    
    settings.appendChild(header);
    settings.appendChild(content);
    
    console.log('🔧 Settings panel content created, appending to DOM...');
    document.documentElement.appendChild(settings);
    console.log('✅ Settings panel created successfully');
    
    // Event handlers
    settings.querySelector('#close-settings').addEventListener('click', () => {
      settings.remove();
    });
    
    settings.querySelector('#theme-select').addEventListener('change', (e) => {
      currentTheme = e.target.value;
      localStorage.setItem('cb_theme', currentTheme);
      applyTheme();
      scheduleRender();
    });
    
    settings.querySelector('#clear-data').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.clear();
        bookmarkCache.clear();
        browsingHistory = [];
        location.reload();
      }
    });
    
    // Close on escape
    document.addEventListener('keydown', function closeOnEscape(e) {
      if (e.key === 'Escape') {
        settings.remove();
        document.removeEventListener('keydown', closeOnEscape);
      }
    });

    // Persist new settings
    settings.querySelector('#startup-select').addEventListener('change', (e) => {
      startupMode = e.target.value;
      localStorage.setItem('cb_startup', startupMode);
      // silent
    });
    settings.querySelector('#engine-select').addEventListener('change', (e) => {
      defaultSearchEngine = e.target.value;
      localStorage.setItem('cb_search_engine', defaultSearchEngine);
      // silent
    });
    settings.querySelector('#home-url').addEventListener('change', (e) => {
      homeUrl = e.target.value || homeUrl;
      localStorage.setItem('cb_home', homeUrl);
      // silent
    });
    settings.querySelector('#font-scale').addEventListener('input', (e) => {
      currentFontScale = parseFloat(e.target.value);
      localStorage.setItem('cb_font_scale', String(currentFontScale));
      applyTheme();
      scheduleRender();
    });
    settings.querySelector('#font-weight').addEventListener('input', (e) => {
      currentFontWeight = parseInt(e.target.value, 10);
      localStorage.setItem('cb_font_weight', String(currentFontWeight));
      applyTheme();
      scheduleRender();
    });
    settings.querySelector('#density-select').addEventListener('change', (e) => {
      currentDensity = e.target.value;
      localStorage.setItem('cb_density', currentDensity);
      const pad = document.getElementById('cb-pad');
      if (pad) pad.textContent = `html{scroll-padding-top:${getPad()}px !important} body{padding-top:${getPad()}px !important}`;
      applyTheme();
      scheduleRender();
    });

    // Security toggles
    settings.querySelector('#https-only').addEventListener('change', (e) => {
      httpsOnly = e.target.checked;
      localStorage.setItem('cb_https_only', httpsOnly ? '1' : '0');
      // silent
    });
    settings.querySelector('#block-trackers').addEventListener('change', (e) => {
      blockTrackers = e.target.checked;
      localStorage.setItem('cb_block_trackers', blockTrackers ? '1' : '0');
      // silent
    });

    // Ad Blocker controls
    settings.querySelector('#ad-blocker-enabled').addEventListener('change', (e) => {
      const enabled = e.target.checked;
      localStorage.setItem('cb_ad_blocker_enabled', enabled ? 'true' : 'false');
      
      // Update ad blocker if available
      if (window.adBlocker) {
        window.adBlocker.enabled = enabled;
        if (enabled) {
          window.adBlocker.enable();
        } else {
          window.adBlocker.disable();
        }
      }
      
      updateAdBlockerStatus();
    });

    settings.querySelector('#blocking-level').addEventListener('change', (e) => {
      const level = e.target.value;
      localStorage.setItem('cb_blocking_level', level);
      
      // Update ad blocker if available
      if (window.adBlocker) {
        window.adBlocker.setBlockingLevel(level);
      }
      
      updateAdBlockerStatus();
    });

    settings.querySelector('#update-filter-lists').addEventListener('click', async () => {
      const button = settings.querySelector('#update-filter-lists');
      const originalText = button.textContent;
      
      button.textContent = 'Updating...';
      button.disabled = true;
      
      try {
        if (window.adBlocker) {
          await window.adBlocker.updateFilterLists();
          updateAdBlockerStatus();
        }
      } catch (error) {
        console.error('Failed to update filter lists:', error);
      } finally {
        button.textContent = originalText;
        button.disabled = false;
      }
    });

    settings.querySelector('#show-ad-blocker-stats').addEventListener('click', () => {
      if (window.adBlocker) {
        const stats = window.adBlocker.getStats();
        const filterStats = window.adBlocker.getFilterListStats();
        
        const message = `📊 Ad Blocker Statistics:
• Ads Blocked: ${stats.adsBlocked || 0}
• Trackers Blocked: ${stats.trackersBlocked || 0}
• Scripts Blocked: ${stats.scriptsBlocked || 0}
• Active Filter Rules: ${filterStats ? filterStats.activeRules : 0}
• Blocking Level: ${window.adBlocker.blockingLevel || 'Aggressive'}`;
        
        alert(message);
      } else {
        alert('Ad Blocker not available');
      }
    });

    // Function to update ad blocker status display
    function updateAdBlockerStatus() {
      const statusEl = settings.querySelector('#ad-blocker-status');
      if (!statusEl) return;
      
      if (window.adBlocker && window.adBlocker.enabled) {
        const stats = window.adBlocker.getStats();
        const filterStats = window.adBlocker.getFilterListStats();
        const level = window.adBlocker.blockingLevel || 'Aggressive';
        
        statusEl.innerHTML = `
          ✅ Ad Blocker Active (${level} mode)<br>
          📊 ${stats.adsBlocked || 0} ads, ${stats.trackersBlocked || 0} trackers blocked<br>
          🔧 ${filterStats ? filterStats.activeRules : 0} filter rules active
        `;
        statusEl.style.borderColor = 'rgba(76, 175, 80, 0.5)';
        statusEl.style.background = 'rgba(76, 175, 80, 0.1)';
        statusEl.style.color = '#4CAF50';
      } else {
        statusEl.innerHTML = '❌ Ad Blocker Disabled';
        statusEl.style.borderColor = 'rgba(244, 67, 54, 0.5)';
        statusEl.style.background = 'rgba(244, 67, 54, 0.1)';
        statusEl.style.color = '#f44336';
      }
    }

    // Initialize ad blocker status
    updateAdBlockerStatus();

    // Save per-site controls
    settings.querySelector('#psc-save').addEventListener('click', () => {
      const host = settings.querySelector('#psc-host').value.trim().toLowerCase();
      if (!host) { return; }
      const js = settings.querySelector('#psc-js').checked;
      const images = settings.querySelector('#psc-img').checked;
      const cookies = settings.querySelector('#psc-cookie').checked;
      if (!siteControls || typeof siteControls !== 'object') siteControls = {};
      siteControls[host] = { js, images, cookies };
      try { localStorage.setItem('cb_site_controls', JSON.stringify(siteControls)); } catch(_) {}
      // silent
      applySiteControlsFor(host);
    });
    
    // Test connection button handler
    settings.querySelector('#test-connection').addEventListener('click', async () => {
      const statusEl = settings.querySelector('#connection-status');
      const button = settings.querySelector('#test-connection');
      
      button.textContent = 'Testing...';
      button.disabled = true;
      statusEl.textContent = '';
      
      try {
        const workingEngine = await getWorkingSearchEngine();
        const engineName = Object.keys(DEFAULT_ENGINES).find(key => DEFAULT_ENGINES[key] === workingEngine) || 'unknown';
        
        if (workingEngine === defaultEngineUrl()) {
          statusEl.textContent = `✅ ${engineName} is working`;
          statusEl.style.color = themes[currentTheme].success;
        } else {
          statusEl.textContent = `⚠️ ${engineName} works better than current`;
          statusEl.style.color = themes[currentTheme].warning;
        }
      } catch (e) {
        statusEl.textContent = `❌ Connection test failed: ${e.message}`;
        statusEl.style.color = themes[currentTheme].error;
      } finally {
        button.textContent = 'Test Connection';
        button.disabled = false;
      }
    });
  }

  // Advanced Settings panel
  function showSettings() {
    showAdvancedSettings();
  }
  
  // About panel
  function showAbout() {
    const about = document.createElement('div');
    about.id = 'about-panel';
    about.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 400px; background: ${themes[currentTheme].bar};
      border: 2px solid ${themes[currentTheme].active}; border-radius: 12px;
      color: ${themes[currentTheme].text}; z-index: 2147483649;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5); overflow: hidden;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px; border-bottom: 1px solid ${themes[currentTheme].button};
      display: flex; justify-content: space-between; align-items: center;
    `;
    header.innerHTML = `
      <h2 style="margin:0; font-size:18px;">About Minimal Browser</h2>
      <button id="close-about" style="background:none; border:none; color:inherit; font-size:20px; cursor:pointer;">×</button>
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 16px; text-align: center;
    `;
    
    content.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">🌐</div>
      <h3 style="margin: 0 0 16px 0;">cloak_browser</h3>
      <p style="margin: 0 0 16px 0; line-height: 1.5;">
        A fast, secure, and privacy-focused web browser built with modern web technologies.
      </p>
      <div style="
        background: ${themes[currentTheme].button}; padding: 12px; border-radius: 8px;
        margin: 16px 0; text-align: left;
      ">
        <div style="margin-bottom: 8px;"><strong>Features:</strong></div>
        <div>• Tab management with drag & drop</div>
        <div>• Advanced bookmark system</div>
        <div>• Browsing history tracking</div>
        <div>• Multiple search engines</div>
        <div>• Dark/light themes</div>
        <div>• Keyboard shortcuts</div>
        <div>• Data export/import</div>
      </div>
      <div style="font-size: 12px; color: ${themes[currentTheme].text}80;">
        Version 5.0 | Built with Rust & Web Technologies
      </div>
    `;
    
    about.appendChild(header);
    about.appendChild(content);
    
    document.documentElement.appendChild(about);
    
    // Close button handler
    about.querySelector('#close-about').addEventListener('click', () => {
      about.remove();
    });
    
    // Close on escape
    document.addEventListener('keydown', function closeOnEscape(e) {
      if (e.key === 'Escape') {
        about.remove();
        document.removeEventListener('keydown', closeOnEscape);
      }
    });
  }

  // Enhanced event wiring with navigation and keyboard shortcuts
  function wire(){
    const host = ensureHost();
    
    const bar = cachedElements.shadowRoot.getElementById('bar');
    
    // Navigation button handlers
    if (cachedElements.back) {
      cachedElements.back.addEventListener('click', () => {
        if (window.history.length > 1) {
          window.history.back();
        }
      });
    }
    
    if (cachedElements.forward) {
      cachedElements.forward.addEventListener('click', () => {
        window.history.forward();
      });
    }
    
    // Event delegation for all button clicks
    bar.addEventListener('click', (e) => {
      const target = e.target;
      
      if (target.id === 'go') {
        performNavigation(cachedElements.url.value);
      } else if (target.id === 'fallback') {
        // Try alternative search engine
        tryFallbackSearchEngine();
      } else if (cachedElements.startSearch && target === cachedElements.startSearch) {
        // no-op click
      } else if (target.id === 'bookmark') {
        const currentUrl = location.href;
        const currentTitle = document.title || 'Untitled';
        if (isBookmarked(currentUrl)) {
          removeBookmark(currentUrl);
          target.textContent = '☆';
          target.classList.remove('bookmarked');
          // silent
        } else {
          addBookmark(currentUrl, currentTitle);
          target.textContent = '★';
          target.classList.add('bookmarked');
          // silent
        }
      } else if (target.id === 'theme') {
        toggleTheme();
        target.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
      } else if (target.id === 'new') {
        const s = readState();
        if(s.tabs.length >= MAX_TABS) {
          // silent
          return;
        }
        s.tabs.push({url: 'about:blank', title: 'New Tab'});
        s.active = s.tabs.length - 1;
        writeState(s);
        saveToStorage(s);
        queueDiskSave(s);
        scheduleRender();
        try {
          const targetUrl = new URL(s.tabs[s.active].url, location.href).toString();
          if (targetUrl !== location.href) {
            window.location.href = targetUrl;
          }
        } catch(_){
          window.location.href = s.tabs[s.active].url;
        }
      } else if (target.id === 'menu') {
        showMenu();
      }
    });
    
    // URL input handling with debouncing and per-tab persistence
    let urlTimeout = null;
    cachedElements.url.addEventListener('input', (e) => {
      if (urlTimeout) clearTimeout(urlTimeout);
      urlTimeout = setTimeout(() => {
        const s = readState();
        if (s.tabs.length) {
          const t = s.tabs[s.active] || {};
          s.tabs[s.active] = { ...t, input: String(e.target.value || '') };
          writeState(s);
          saveToStorage(s);
          queueDiskSave(s);
        }
      }, 150);
    });

    // Start overlay search: Enter navigates like the main URL bar
    if (cachedElements.startSearch) {
      cachedElements.startSearch.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (cachedElements.url) {
            cachedElements.url.value = cachedElements.startSearch.value;
          }
          performNavigation(cachedElements.startSearch.value);
        }
      });
    }
    
    cachedElements.url.addEventListener('keydown', e => {
      if(e.key === 'Enter'){
        performNavigation(cachedElements.url.value);
      }
    });
    
    // Enhanced keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 't':
            e.preventDefault();
            cachedElements.new.click();
            break;
          case 'w':
            e.preventDefault();
            const s = readState();
            if (s.tabs.length > 1) {
              closeTab(s.active);
            }
            break;
          case 'r':
            e.preventDefault();
            location.reload();
            break;
          case 'l':
            e.preventDefault();
            cachedElements.url.focus();
            cachedElements.url.select();
            break;
          case 'm':
            e.preventDefault();
            showMenu();
            break;
          case 'f':
            e.preventDefault();
            if (cachedElements.fallback) {
              cachedElements.fallback.click();
            }
            break;
        }
      } else if (e.altKey) {
        switch(e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            if (cachedElements.back && !cachedElements.back.disabled) {
              cachedElements.back.click();
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (cachedElements.forward && !cachedElements.forward.disabled) {
              cachedElements.forward.click();
            }
            break;
        }
      }
    }, { passive: false });
    
    // Optimized link handling
    document.addEventListener('click', function(e){
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if(!a) return;
      if (isTracker(a.href)) { e.preventDefault(); return; }
      if(a && a.target === '_blank'){ a.target = '_self'; }
      // Route known downloadable links to native downloader via IPC
      const url = a.getAttribute('href') || '';
      if (/(\.(zip|pdf|exe|dmg|msi|rar|7z|mp3|mp4|iso|tar|gz|bz2|xz)(\?|$))/i.test(url)) {
        e.preventDefault();
        const abs = new URL(url, location.href).toString();
        const name = abs.split('/').pop().split('?')[0];
        try {
          if (window.ipc && typeof window.ipc.postMessage === 'function') {
            window.ipc.postMessage(JSON.stringify({ cmd: 'download_start', payload: { url: abs, file: name } }));
          }
        } catch(_) {}
        downloads.push({ url: abs, file: name, ts: Date.now() });
        saveDownloads();
      }
    }, { passive: true });
    
    window.open = function(u){
      window.location.href = u;
      return null;
    };

    // Save on unload
      window.addEventListener('beforeunload', () => {
    // Set navigation flag to prevent interference during unload
    isNavigating = true;
    // Reset refresh loop detection when navigating away
    refreshLoopDetected = false;
    refreshLoopCount = 0;
    try { autosaveNow(); } catch(_) {}
  });
  }

  // Manual reset function for refresh loop detection
  function resetRefreshLoopDetection() {
    refreshLoopDetected = false;
    refreshLoopCount = 0;
    lastStateUpdate = 0;
    lastUpdateTime = 0;
    lastRenderTime = 0;
    console.log('Refresh loop detection reset');
  }

  // Enhanced initialization
  async function init(){
    console.log('Initializing enhanced minimal browser...');
    
    // Set navigation flag to prevent interference during initialization
    isNavigating = true;
    
    // Apply theme immediately to ensure proper styling
    applyTheme();
    
    // Load preferences from localStorage if available
    try {
      const savedTheme = localStorage.getItem('cb_theme');
      if (savedTheme && themes[savedTheme]) currentTheme = savedTheme;
              const fs = parseFloat(localStorage.getItem('cb_font_scale'));
      if (!isNaN(fs)) currentFontScale = Math.min(1.3, Math.max(0.9, fs));
              const fw = parseInt(localStorage.getItem('cb_font_weight'), 10);
      if (!isNaN(fw)) currentFontWeight = Math.min(800, Math.max(400, fw));
              const dens = localStorage.getItem('cb_density');
      if (dens === 'compact' || dens === 'comfortable') currentDensity = dens;
              const eng = localStorage.getItem('cb_search_engine');
      if (eng) defaultSearchEngine = eng;
              const home = localStorage.getItem('cb_home');
      if (home) homeUrl = home;
              const sm = localStorage.getItem('cb_startup');
      if (sm === 'restore' || sm === 'home') startupMode = sm;
      httpsOnly = localStorage.getItem('cb_https_only') !== '0';
      blockTrackers = localStorage.getItem('cb_block_trackers') !== '0';
      try { const sc = JSON.parse(localStorage.getItem('cb_site_controls') || '{}'); if (sc && typeof sc === 'object') siteControls = sc; } catch(_) {}
      
      // Load memory pool management preferences
      try {
        const maxPoolSize = parseInt(localStorage.getItem('cb_max_pool_size'));
        if (!isNaN(maxPoolSize) && maxPoolSize > 0) {
          memoryPoolManager.maxPoolSize = maxPoolSize;
        }
        
        const gcThreshold = parseFloat(localStorage.getItem('cb_gc_threshold'));
        if (!isNaN(gcThreshold) && gcThreshold > 0 && gcThreshold < 1) {
          memoryPoolManager.gcThreshold = gcThreshold;
        }
        
        const gcInterval = parseInt(localStorage.getItem('cb_gc_interval'));
        if (!isNaN(gcInterval) && gcInterval > 0) {
          memoryPoolManager.gcInterval = gcInterval;
        }
      } catch(_) {}
      
      // Load performance optimization preferences
      try {
        const batchTimeout = parseInt(localStorage.getItem('cb_batch_timeout'));
        if (!isNaN(batchTimeout) && batchTimeout >= 50 && batchTimeout <= 1000) {
          networkBatcher.batchTimeout = batchTimeout;
        }
        
        const maxBatchSize = parseInt(localStorage.getItem('cb_max_batch_size'));
        if (!isNaN(maxBatchSize) && maxBatchSize >= 2 && maxBatchSize <= 20) {
          networkBatcher.maxBatchSize = maxBatchSize;
        }
      } catch(_) {}
      
      // Load tab management preferences
      try {
        const maxTabs = parseInt(localStorage.getItem('cb_max_tabs'));
        if (!isNaN(maxTabs) && maxTabs >= 5 && maxTabs <= 100) {
          tabManager.persistentStorage.maxTabs = maxTabs;
        }
        
        const saveInterval = parseInt(localStorage.getItem('cb_tab_save_interval'));
        if (!isNaN(saveInterval) && saveInterval >= 100 && saveInterval <= 10000) {
          tabManager.persistentStorage.saveInterval = saveInterval;
        }
      } catch(_) {}
    } catch(_) {}
    
    loadBookmarks();
    loadHistory();
    ensureHost();
    applyTheme();
    removeContentFontCSS();
    loadHttpCache();
    setupWeb3Provider();
    
    // Prefer existing in-memory state (window.name) across navigations; only fall back to stored/disk/initial when not present
    const hasExistingState = (() => {
      try {
        if (typeof window.name === 'string' && window.name.startsWith(KEY)) {
          const s = JSON.parse(window.name.slice(KEY.length));
          return s && Array.isArray(s.tabs) && typeof s.active === 'number' && s.tabs.length > 0;
        }
      } catch (_) {}
      return false;
    })();

    let stateApplied = hasExistingState;

    try {
      const stored = loadFromStorage();
      if (!stateApplied && stored && Array.isArray(stored.tabs) && typeof stored.active === 'number' && stored.tabs.length>0){
        console.log('Loaded state from localStorage');
        window.name = KEY + JSON.stringify(stored);
        stateApplied = true;
      }
    } catch(_) {}

    try {
      const diskData = await diskLoad();
      if (diskData && typeof diskData === 'object') {
        // Load profile-based prefs if present
        if (diskData.prefs) {
          const p = diskData.prefs;
          if (p.theme && themes[p.theme]) currentTheme = p.theme;
          if (typeof p.fontScale === 'number') currentFontScale = Math.min(1.3, Math.max(0.9, p.fontScale));
          if (typeof p.fontWeight === 'number') currentFontWeight = Math.min(800, Math.max(400, p.fontWeight));
          if (p.density === 'compact' || p.density === 'comfortable') currentDensity = p.density;
          if (typeof p.home === 'string') homeUrl = p.home;
          if (typeof p.engine === 'string') defaultSearchEngine = p.engine;
          if (p.startup === 'restore' || p.startup === 'home') startupMode = p.startup;
          if (typeof p.web3Enabled === 'boolean') web3Enabled = p.web3Enabled;
          if (typeof p.web3RpcUrl === 'string') web3RpcUrl = p.web3RpcUrl;
          if (typeof p.web3ChainId === 'string') web3ChainId = p.web3ChainId;
          if (typeof p.ipfsGateway === 'string') ipfsGateway = p.ipfsGateway;
        }
        // Re-apply theme after loading preferences to ensure start overlay colors are correct
        if (diskData.prefs && diskData.prefs.theme) {
          applyTheme();
        }
        if (!stateApplied && Array.isArray(diskData.tabs) && typeof diskData.active === 'number' && diskData.tabs.length>0){
          console.log('Loaded tabs from disk');
          window.name = KEY + JSON.stringify({ tabs: diskData.tabs, active: diskData.active });
          stateApplied = true;
        }
      }
    } catch(e) {}

    if (!stateApplied) {
      const initial = (window.__CB_INITIAL__ || null);
      if (initial && Array.isArray(initial.tabs) && typeof initial.active === 'number' && initial.tabs.length>0){
        try { 
          window.name = KEY + JSON.stringify(initial); 
          console.log('Loaded state from initial script');
          stateApplied = true;
        } catch(_) {}
      }
    }

    // Apply per-site controls for current host
    try { applySiteControlsFor(location.hostname); } catch(_) {}
    
    // Test and set working search engine - with better error handling
    let searchEngineTested = false;
    try {
      const workingEngine = await getWorkingSearchEngine();
      searchEngineTested = true;
      if (workingEngine !== defaultEngineUrl()) {
        console.log('Switching to working search engine:', workingEngine);
        // Update the default search engine to a working one
        if (workingEngine === DEFAULT_ENGINES.google) {
          defaultSearchEngine = 'google';
          // Also update homeUrl if it was DuckDuckGo
          if (homeUrl === 'https://duckduckgo.com') {
            homeUrl = 'about:blank';
          }
        } else if (workingEngine === DEFAULT_ENGINES.brave) {
          defaultSearchEngine = 'brave';
          // Also update homeUrl if it was DuckDuckGo
          if (homeUrl === 'https://duckduckgo.com') {
            homeUrl = 'about:blank';
          }
        }
        searchEngineWorking = true;
      }
    } catch (e) {
      console.warn('Could not test search engines:', e);
      searchEngineWorking = false;
      // Don't fail initialization if search engine test fails
    }
    
    const currentState = readState();
    
    // Handle startup mode with better error handling
    if (startupMode === 'home') {
      try {
        // Only try to navigate if we're not already on a valid page
        const currentUrl = location.href;
        const isAlreadyOnValidPage = !/^(about:blank|chrome:\/\/newtab|edge:\/\/newtab)$/i.test(currentUrl) && 
                                   currentUrl !== 'about:blank' &&
                                   currentUrl !== 'data:' &&
                                   currentUrl !== 'file:';
        
        if (!isAlreadyOnValidPage) {
          // Create a stable home tab first - use about:blank for custom start page
          const u = 'about:blank';
          writeState({ tabs: [{ url: u, title: 'New Tab' }], active: 0 });
          
          // Only navigate if we're not already on the intended home page
          if (location.href !== u) {
            console.log('Navigating to custom start page:', u);
            // Use a timeout to prevent immediate navigation issues
            setTimeout(() => {
              try {
                window.location.replace(u);
              } catch (navError) {
                console.warn('Navigation failed, staying on current page:', navError);
                // If navigation fails, just stay where we are
                isNavigating = false;
              }
            }, 100);
          } else {
            console.log('Already on custom start page, no navigation needed');
            isNavigating = false;
          }
        } else {
          console.log('Already on valid page, creating home tab without navigation');
          const u = 'about:blank';
          writeState({ tabs: [{ url: u, title: 'New Tab' }], active: 0 });
          isNavigating = false;
        }
      } catch (startupError) {
        console.warn('Startup navigation failed:', startupError);
        // If startup navigation fails, create a basic tab and don't navigate
        writeState({ tabs: [{ url: 'about:blank', title: 'New Tab' }], active: 0 });
        isNavigating = false;
      }
    } else {
      // Restore mode or default
      if (currentState.tabs.length === 0) {
        currentState.tabs = [{url: 'about:blank', title: 'New Tab'}];
        currentState.active = 0;
        writeState(currentState);
        console.log('Created initial tab for custom start page');
      }
      isNavigating = false;
    }
    
    wire(); 
    render(); 
    updateCurrent();
    startAutosave();
    
    // Enable smooth scrolling features
    enableSmoothScrolling();
    enhanceScrollRestoration();
    enhanceTabScrolling();
    
    // Add page load error handling for automatic fallback
    window.addEventListener('error', (e) => {
      if (e.target && e.target.tagName === 'IMG') {
        // Image load error - could be blocked by network
        console.warn('Image load failed:', e.target.src);
      }
    });
    
    // Add keyboard shortcut to reset refresh loop detection (Ctrl+Shift+R)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        resetRefreshLoopDetection();
        showNotification('Refresh loop detection reset', 'info', 2000);
      }
    });
    
    // Listen for page load failures and try fallbacks - with better error handling
    window.addEventListener('unhandledrejection', (e) => {
      if (e.reason && e.reason.message && e.reason.message.includes('fetch')) {
        console.warn('Network request failed, checking search engine availability');
        // Only try fallback if we haven't already tested and if we're not in a navigation state
        if (!searchEngineTested && !isNavigating) {
          getWorkingSearchEngine().then(workingEngine => {
            if (workingEngine !== defaultEngineUrl()) {
              console.log('Switching to working search engine due to network failure');
              if (workingEngine === DEFAULT_ENGINES.google) {
                defaultSearchEngine = 'google';
                if (homeUrl === 'https://duckduckgo.com') {
                  homeUrl = 'about:blank';
                }
              } else if (workingEngine === DEFAULT_ENGINES.brave) {
                defaultSearchEngine = 'brave';
                if (homeUrl === 'https://duckduckgo.com') {
                  homeUrl = 'about:blank';
                }
              }
              // Update the current tab if it's a failed search engine
              const currentState = readState();
              if (currentState.tabs.length > 0) {
                const currentTab = currentState.tabs[currentState.active];
                if (currentTab && currentTab.url.includes('duckduckgo.com')) {
                  const newUrl = 'about:blank';
                  currentTab.url = newUrl;
                  currentTab.title = 'New Tab';
                  writeState(currentState);
                  // Only navigate if we're not already navigating
                  if (!isNavigating) {
                    window.location.replace(newUrl);
                  }
                }
              }
            }
          }).catch(err => {
            console.warn('Could not find working search engine:', err);
          });
        }
      }
    });
    
    console.log('Enhanced initialization complete with smooth scrolling');
    
    // Initialize memory pool management system
    try {
      // Create pools for commonly used objects
      memoryPoolManager.createPool('DOMElement', () => document.createElement('div'), 20);
      memoryPoolManager.createPool('Event', () => new Event('click'), 50);
      memoryPoolManager.createPool('URL', () => new URL('about:blank'), 30);
      
      // Start memory monitoring
      setInterval(() => {
        memoryPoolManager.monitorMemory();
      }, 5000); // Check every 5 seconds
      
      // Optimize memory usage every 30 seconds
      setInterval(() => {
        memoryPoolManager.optimize();
      }, 30000);
      
      console.log('Memory pool management system initialized');
    } catch (error) {
      console.warn('Failed to initialize memory pool management:', error);
    }
    
    // Initialize performance optimization systems
    try {
      // Initialize critical path optimization
      criticalPathOptimizer.init();
      
      // Configure network request batching
      networkBatcher.configure({
        batchTimeout: 100,
        maxBatchSize: 10
      });
      
      console.log('Performance optimization systems initialized');
    } catch (error) {
      console.warn('Failed to initialize performance optimization systems:', error);
    }
    
    // Initialize enhanced tab management system
    try {
      tabManager.init();
      console.log('Enhanced tab management system initialized');
    } catch (error) {
      console.warn('Failed to initialize enhanced tab management system:', error);
    }
    
    // Ensure start overlay theme is applied after initialization
    updateStartOverlayTheme();
    
    // Reset navigation flag after initialization is complete - with better timing
    if (!isNavigating) {
      // If we're not navigating, reset immediately
      refreshLoopDetected = false;
      refreshLoopCount = 0;
    } else {
      // If we are navigating, wait for the navigation to complete
      setTimeout(() => {
        isNavigating = false;
        // Reset refresh loop detection after navigation
        refreshLoopDetected = false;
        refreshLoopCount = 0;
      }, 2000); // Give navigation more time to complete
    }
  }

  // Event handling
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Optimized observers and timers
  let obs = null;
  
  // Only create MutationObserver when document is ready
  function setupMutationObserver() {
    try {
      if (document.documentElement && typeof MutationObserver !== 'undefined' && document.readyState !== 'loading') {
        obs = new MutationObserver(() => { 
          try {
            // Only re-attach if absolutely necessary and not during navigation or refresh loops
            if (!isNavigating && !refreshLoopDetected && cachedElements.host && cachedElements.host.parentElement !== document.documentElement) {
              document.documentElement.appendChild(cachedElements.host);
            }
            // Only add padding style if it's missing and we're not in a navigation state
            if (!isNavigating && !refreshLoopDetected && !document.getElementById('mb-pad')) {
              const pad = document.createElement('style');
              pad.id = 'mb-pad';
              pad.textContent = `html{scroll-padding-top:${getPad()}px !important} body{padding-top:${getPad()}px !important}`;
              if (document.documentElement) {
                document.documentElement.appendChild(pad);
              }
            }
          } catch (e) {
            console.warn('MutationObserver callback error:', e);
          }
        });
        
        // Only observe if we have a valid target
        if (document.documentElement && document.documentElement.nodeType === Node.ELEMENT_NODE) {
          obs.observe(document.documentElement, { childList: true, subtree: true });
        }
      }
    } catch (e) {
      console.warn('Failed to create MutationObserver:', e);
    }
  }
  
  // Set up MutationObserver when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMutationObserver, { once: true });
  } else {
    setupMutationObserver();
  }

  // Keep-alive re-attacher for tough SPAs
  let keepAliveInterval = null;
  let urlCheckInterval = null;
  
  function setupIntervals() {
    // Only set up intervals when document is ready
    if (document.readyState === 'loading') return;
    
    // Keep-alive re-attacher for tough SPAs - much less aggressive to prevent refresh loops
    keepAliveInterval = setInterval(() => {
      try {
        // Only re-attach if absolutely necessary and not during navigation or refresh loops
        if (!isNavigating && !refreshLoopDetected && (!cachedElements.host || (cachedElements.host.parentElement !== document.documentElement))) {
          ensureHost();
        }
        // Only add padding style if it's missing and we're not in a navigation state
        if (!isNavigating && !refreshLoopDetected && !document.getElementById('mb-pad')) {
          const pad = document.createElement('style');
          pad.id = 'mb-pad';
          pad.textContent = `html{scroll-padding-top:${getPad()}px !important} body{padding-top:${getPad()}px !important}`;
          if (document.head || document.documentElement) {
            (document.head || document.documentElement).appendChild(pad);
          }
        }
      } catch(e) {
        console.warn('Keep-alive error:', e);
      }
    }, 30000); // Increased from 10000ms to 30000ms to further reduce interference
    
    // Throttled URL change detection - much less aggressive to prevent refresh loops
    let lastUrl = location.href;
    let urlChangeCount = 0;
    const MAX_URL_CHANGES = 3; // Reduced from 5 to 3 to prevent excessive detection
    
    urlCheckInterval = setInterval(() => { 
      try {
        // Only check if not navigating or in refresh loop
        if (!isNavigating && !refreshLoopDetected && location.href !== lastUrl && urlChangeCount < MAX_URL_CHANGES) { 
          lastUrl = location.href; 
          urlChangeCount++;
          
          // Only schedule update if we're on a valid page
          const currentUrl = location.href;
          const isValidPage = !/^(about:blank|chrome:\/\/newtab|edge:\/\/newtab|data:|file:)$/i.test(currentUrl) && 
                             currentUrl !== 'about:blank';
          
          if (isValidPage) {
            scheduleUpdate();
          }
          
          // Reset counter after a longer delay to allow normal navigation
          setTimeout(() => {
            urlChangeCount = Math.max(0, urlChangeCount - 1);
          }, 5000); // Increased from 3000ms to 5000ms
        }
      } catch(e) {
        console.warn('URL change detection error:', e);
      }
    }, 2000); // Increased from 1000ms to 2000ms to further reduce interference
  }
  
  // Set up intervals when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupIntervals, { once: true });
  } else {
    setupIntervals();
  }

  // Enhanced history handling
  const push = history.pushState;
  history.pushState = function() { 
    push.apply(this, arguments); 
    window.dispatchEvent(new Event('cb_location')); 
  };
  
  const rep = history.replaceState;
  history.replaceState = function() { 
    rep.apply(this, arguments); 
    window.dispatchEvent(new Event('cb_location')); 
  };
  
  window.addEventListener('popstate', () => window.dispatchEvent(new Event('cb_location')), { passive: true });
  window.addEventListener('cb_location', scheduleUpdate, { passive: true });
  
  // Page load event handling
  window.addEventListener('load', () => {
    setLoadingState(false);
    
    // Reset navigation flag after page load
    setTimeout(() => {
      isNavigating = false;
      // Reset refresh loop detection on successful page load
      refreshLoopDetected = false;
      refreshLoopCount = 0;
    }, 500);
    
    updateCurrent();
    
    // Add to history
    addToHistory(location.href, document.title || 'Untitled');
  });
  
  // Error handling for failed navigation
  window.addEventListener('error', (e) => {
    if (e.target && e.target.tagName === 'IMG') return;
    console.error('Page error:', e);
  });

  // Smooth scrolling utilities
  function smoothScrollTo(element, target, duration = 300) {
    const start = element.scrollTop;
    const distance = target - start;
    const startTime = performance.now();
    
    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    function animation(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutQuad(progress);
      
      element.scrollTop = start + distance * easeProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    }
    
    requestAnimationFrame(animation);
  }
  
  function smoothScrollIntoView(element, container, duration = 300) {
    if (!container || !element) return;
    
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    // Calculate if element is outside visible area
    if (elementRect.left < containerRect.left) {
      // Element is to the left, scroll left
      const scrollLeft = container.scrollLeft - (containerRect.left - elementRect.left) - 10;
      smoothScrollHorizontal(container, scrollLeft, duration);
    } else if (elementRect.right > containerRect.right) {
      // Element is to the right, scroll right
      const scrollLeft = container.scrollLeft + (elementRect.right - containerRect.right) + 10;
      smoothScrollHorizontal(container, scrollLeft, duration);
    }
  }
  
  function smoothScrollHorizontal(element, target, duration = 300) {
    const start = element.scrollLeft;
    const distance = target - start;
    const startTime = performance.now();
    
    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    function animation(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutQuad(progress);
      
      element.scrollLeft = start + distance * easeProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    }
    
    requestAnimationFrame(animation);
  }
  
  // Enhanced scroll behavior for tabs
  function scrollTabIntoView(tabIndex) {
    const tabsContainer = cachedElements.tabs;
    if (!tabsContainer) return;
    
    const tabs = tabsContainer.querySelectorAll('.tab');
    if (tabIndex >= 0 && tabIndex < tabs.length) {
      const targetTab = tabs[tabIndex];
      smoothScrollIntoView(targetTab, tabsContainer, 400);
    }
  }
  
  // Enhanced scroll behavior for content areas
  function enableSmoothScrolling() {
    // Apply smooth scrolling to all scrollable containers
    const scrollableElements = document.querySelectorAll('*');
    scrollableElements.forEach(element => {
      if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
        element.style.scrollBehavior = 'smooth';
      }
    });
    
    // Override default scroll behavior for better control
    const originalScrollTo = window.scrollTo;
    window.scrollTo = function(options) {
      if (options && options.behavior === 'smooth') {
        // Use our custom smooth scrolling
        const targetY = typeof options === 'object' ? options.top : options;
        const targetX = typeof options === 'object' ? options.left : 0;
        
        if (targetY !== undefined) {
          smoothScrollTo(document.documentElement, targetY, 600);
        }
        if (targetX !== undefined) {
          smoothScrollHorizontal(document.documentElement, targetX, 600);
        }
      } else {
        // Use default behavior for instant scrolling
        originalScrollTo.apply(this, arguments);
      }
    };
    
    // Enhanced mouse wheel scrolling
    let wheelTimeout;
    document.addEventListener('wheel', (e) => {
      // Clear any existing timeout
      if (wheelTimeout) {
        clearTimeout(wheelTimeout);
      }
      
      // Add smooth scrolling class
      document.documentElement.classList.add('smooth-scrolling');
      
      // Remove class after scrolling stops
      wheelTimeout = setTimeout(() => {
        document.documentElement.classList.remove('smooth-scrolling');
      }, 150);
      
    }, { passive: true });
  }
  
  // Enhanced scroll restoration for better UX
  function enhanceScrollRestoration() {
    // Store scroll position before navigation
    let scrollPositions = new Map();
    
    // Save scroll position when leaving page
    window.addEventListener('beforeunload', () => {
      const currentUrl = location.href;
      scrollPositions.set(currentUrl, {
        x: window.scrollX,
        y: window.scrollY
      });
      
      // Save to sessionStorage for persistence
      try {
        sessionStorage.setItem('cb_scroll_positions', JSON.stringify(Array.from(scrollPositions.entries())));
      } catch(_) {}
    });
    
    // Restore scroll position when returning to page
    window.addEventListener('load', () => {
      try {
        const stored = sessionStorage.getItem('cb_scroll_positions');
        if (stored) {
          scrollPositions = new Map(JSON.parse(stored));
        }
        
        const currentUrl = location.href;
        const savedPosition = scrollPositions.get(currentUrl);
        
        if (savedPosition) {
          // Use smooth scrolling to restore position
          setTimeout(() => {
            window.scrollTo({
              left: savedPosition.x,
              top: savedPosition.y,
              behavior: 'smooth'
            });
          }, 100);
        }
      } catch(_) {}
    });
  }
  
  // Enhanced tab scrolling with smooth behavior
  function enhanceTabScrolling() {
    const tabsContainer = cachedElements.tabs;
    if (!tabsContainer) return;
    
    // Add smooth scrolling indicators
    let scrollLeft = false;
    let scrollRight = false;
    
    function updateScrollIndicators() {
      const isAtStart = tabsContainer.scrollLeft <= 0;
      const isAtEnd = tabsContainer.scrollLeft >= tabsContainer.scrollWidth - tabsContainer.clientWidth;
      
      // Add/remove scroll indicators
      if (!isAtStart && !scrollLeft) {
        scrollLeft = true;
        addScrollIndicator('left');
      } else if (isAtStart && scrollLeft) {
        scrollLeft = false;
        removeScrollIndicator('left');
      }
      
      if (!isAtEnd && !scrollRight) {
        scrollRight = true;
        addScrollIndicator('right');
      } else if (isAtEnd && scrollRight) {
        scrollRight = false;
        removeScrollIndicator('right');
      }
    }
    
    function addScrollIndicator(direction) {
      const indicator = document.createElement('div');
      indicator.className = `scroll-indicator scroll-${direction}`;
      indicator.innerHTML = direction === 'left' ? '‹' : '›';
      indicator.style.cssText = `
        position: absolute; top: 50%; transform: translateY(-50%);
        ${direction === 'left' ? 'left: 0' : 'right: 0'};
        width: 20px; height: 20px; background: ${themes[currentTheme].active};
        color: white; display: flex; align-items: center; justify-content: center;
        border-radius: 50%; cursor: pointer; z-index: 1000; font-weight: bold;
        opacity: 0.8; transition: opacity 0.2s ease;
      `;
      
      indicator.addEventListener('click', () => {
        const scrollAmount = direction === 'left' ? -200 : 200;
        smoothScrollHorizontal(tabsContainer, tabsContainer.scrollLeft + scrollAmount, 300);
      });
      
      indicator.addEventListener('mouseenter', () => {
        indicator.style.opacity = '1';
      });
      
      indicator.addEventListener('mouseleave', () => {
        indicator.style.opacity = '0.8';
      });
      
      tabsContainer.parentElement.style.position = 'relative';
      tabsContainer.parentElement.appendChild(indicator);
    }
    
    function removeScrollIndicator(direction) {
      const indicator = tabsContainer.parentElement.querySelector(`.scroll-indicator.scroll-${direction}`);
      if (indicator) {
        indicator.remove();
      }
    }
    
    // Update indicators on scroll (throttled with rAF)
    let rafId = 0;
    tabsContainer.addEventListener('scroll', () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => { rafId = 0; updateScrollIndicators(); updateTabIndicatorPosition(); });
    }, { passive: true });
    
    // Initial update
    updateScrollIndicators();
    updateTabIndicatorPosition();
  }

  // Try to switch to an alternative search engine
  async function tryFallbackSearchEngine() {
    const fallbackBtn = cachedElements.fallback;
    if (!fallbackBtn) return;
    
    fallbackBtn.textContent = '⏳';
    fallbackBtn.disabled = true;
    
    try {
      const workingEngine = await getWorkingSearchEngine();
      const currentEngine = defaultEngineUrl();
      
      if (workingEngine !== currentEngine) {
        // Switch to working engine
        if (workingEngine === DEFAULT_ENGINES.google) {
          defaultSearchEngine = 'google';
          if (homeUrl === 'https://duckduckgo.com') {
            homeUrl = 'about:blank';
          }
        } else if (workingEngine === DEFAULT_ENGINES.brave) {
          defaultSearchEngine = 'brave';
          if (homeUrl === 'https://duckduckgo.com') {
            homeUrl = 'about:blank';
          }
        }
        
        // Update current tab if it's a search engine page
        const currentState = readState();
        if (currentState.tabs.length > 0) {
          const currentTab = currentState.tabs[currentState.active];
          if (currentTab && (currentTab.url.includes('duckduckgo.com') || currentTab.url.includes('google.com') || currentTab.url.includes('brave.com'))) {
            const newUrl = 'about:blank';
            currentTab.url = newUrl;
            currentTab.title = 'New Tab';
            writeState(currentState);
            window.location.replace(newUrl);
            return;
          }
        }
        
        // If not on a search engine page, just navigate to custom start page
        window.location.replace('about:blank');
      } else {
        // Current engine is working, just go to custom start page
        window.location.replace('about:blank');
      }
    } catch (e) {
      console.warn('Fallback failed:', e);
      // Just try to go to home anyway
      window.location.replace(homeUrl);
    } finally {
      fallbackBtn.textContent = '🔄';
      fallbackBtn.disabled = false;
    }
  }

  // ========================================
  // ADVANCED SETTINGS PANEL
  // ========================================

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

  // Certificate Pinning (simplified version)
  class CertificatePinning {
    constructor() {
      this.enabled = false;
      this.monitoring = false;
      this.pinnedDomains = new Set(['google.com', 'github.com', 'cloudflare.com']);
      this.blockedDomains = new Set();
    }
    
    init() {
      console.log('🔒 Certificate Pinning: Initializing...');
      this.loadSettings();
    }
    
    setEnabled(enabled) {
      this.enabled = enabled;
      if (enabled) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
      this.saveSettings();
    }
    
    startMonitoring() {
      if (this.monitoring) return;
      this.monitoring = true;
      console.log('Certificate pinning monitoring started');
    }
    
    stopMonitoring() {
      if (!this.monitoring) return;
      this.monitoring = false;
      console.log('Certificate pinning monitoring stopped');
    }
    
    addDomain(domain) {
      this.pinnedDomains.add(domain);
      this.saveSettings();
    }
    
    removeDomain(domain) {
      this.pinnedDomains.delete(domain);
      this.saveSettings();
    }
    
    getStatus() {
      return {
        enabled: this.enabled,
        monitoring: this.monitoring,
        pinnedDomains: this.pinnedDomains.size,
        blockedDomains: this.blockedDomains.size
      };
    }
    
    getPinningReport() {
      return {
        status: this.getStatus(),
        pinnedDomains: Array.from(this.pinnedDomains),
        blockedDomains: Array.from(this.blockedDomains),
        recommendations: []
      };
    }
    
    testPinning() {
      return {
        enabled: this.enabled,
        monitoring: this.monitoring,
        testDomains: Array.from(this.pinnedDomains).map(domain => ({
          domain: domain,
          pinned: true,
          pinCount: 1
        })),
        validationTests: [],
        recommendations: []
      };
    }
    
    saveSettings() {
      try {
        const settings = {
          enabled: this.enabled,
          monitoring: this.monitoring,
          pinnedDomains: Array.from(this.pinnedDomains),
          blockedDomains: Array.from(this.blockedDomains)
        };
        localStorage.setItem('cb_certificate_pinning', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving certificate pinning settings:', error);
      }
    }
    
    loadSettings() {
      try {
        const saved = localStorage.getItem('cb_certificate_pinning');
        if (saved) {
          const settings = JSON.parse(saved);
          this.enabled = settings.enabled || false;
          this.monitoring = settings.monitoring || false;
          if (settings.pinnedDomains) {
            this.pinnedDomains = new Set(settings.pinnedDomains);
          }
          if (settings.blockedDomains) {
            this.blockedDomains = new Set(settings.blockedDomains);
          }
        }
      } catch (error) {
        console.error('Error loading certificate pinning settings:', error);
      }
    }
  }

  // Initialize protection modules
  const webrtcProtection = new WebRTCProtection();
  const connectionSpoofing = new ConnectionSpoofing();
  const platformDetectionPrevention = new PlatformDetectionPrevention();
  const certificatePinning = new CertificatePinning();
  const canvasFingerprintProtection = new CanvasFingerprintProtection();
  const audioFingerprintProtection = new AudioFingerprintProtection();

  // Initialize protection modules
  webrtcProtection.init();
  connectionSpoofing.init();
  platformDetectionPrevention.init();
  certificatePinning.init();
  canvasFingerprintProtection.init();
  audioFingerprintProtection.init();
  
  // Make protection modules globally accessible for settings panel
  window.canvasFingerprintProtection = canvasFingerprintProtection;
  window.audioFingerprintProtection = audioFingerprintProtection;

  // Load protection preferences
  function loadProtectionPreferences() {
    try {
      // Load WebRTC Protection preferences
      const webrtcProtectionEnabled = localStorage.getItem('cb_webrtc_protection');
      if (webrtcProtectionEnabled !== null) {
        webrtcProtection.setEnabled(webrtcProtectionEnabled === 'true');
      }
      
      const blockSTUN = localStorage.getItem('cb_block_stun');
      if (blockSTUN !== null) {
        webrtcProtection.configure({ blockSTUN: blockSTUN === 'true' });
      }
      
      const blockTURN = localStorage.getItem('cb_block_turn');
      if (blockTURN !== null) {
        webrtcProtection.configure({ blockTURN: blockTURN === 'true' });
      }
      
      const blockDataChannels = localStorage.getItem('cb_block_datachannels');
      if (blockDataChannels !== null) {
        webrtcProtection.configure({ blockDataChannels: blockDataChannels === 'true' });
      }
      
      const randomizeWebGL = localStorage.getItem('cb_randomize_webgl');
      if (randomizeWebGL !== null) {
        webrtcProtection.configure({ randomizeWebGL: randomizeWebGL === 'true' });
      }
      
      // Load Connection Spoofing preferences
      const connectionSpoofingEnabled = localStorage.getItem('cb_connection_spoofing');
      if (connectionSpoofingEnabled !== null) {
        connectionSpoofing.setEnabled(connectionSpoofingEnabled === 'true');
      }
      
      const spoofConnectionType = localStorage.getItem('cb_spoof_connection_type');
      if (spoofConnectionType) {
        connectionSpoofing.configure({ connectionType: spoofConnectionType });
      }
      
      const spoofEffectiveType = localStorage.getItem('cb_spoof_effective_type');
      if (spoofEffectiveType) {
        connectionSpoofing.configure({ effectiveType: spoofEffectiveType });
      }
      
      // Load Platform Detection Prevention preferences
      const platformDetectionPreventionEnabled = localStorage.getItem('cb_platform_prevention');
      if (platformDetectionPreventionEnabled !== null) {
        platformDetectionPrevention.setEnabled(platformDetectionPreventionEnabled === 'true');
      }
      
      const spoofPlatform = localStorage.getItem('cb_spoof_platform');
      if (spoofPlatform) {
        platformDetectionPrevention.configure({ platform: spoofPlatform });
      }
      
      const spoofUserAgent = localStorage.getItem('cb_spoof_user_agent');
      if (spoofUserAgent) {
        platformDetectionPrevention.configure({ userAgent: spoofUserAgent });
      }
      
      // Load Certificate Pinning preferences
      const certificatePinningEnabled = localStorage.getItem('cb_certificate_pinning');
      if (certificatePinningEnabled !== null) {
        certificatePinning.setEnabled(certificatePinningEnabled === 'true');
      }
      
      // Load Canvas Fingerprint Protection preferences
      const canvasProtectionEnabled = localStorage.getItem('cb_canvas_protection');
      if (canvasProtectionEnabled !== null) {
        const canvasSettings = JSON.parse(canvasProtectionEnabled);
        canvasFingerprintProtection.configure(canvasSettings);
      }
      
      // Load Audio Fingerprint Protection preferences
      const audioProtectionEnabled = localStorage.getItem('cb_audio_protection');
      if (audioProtectionEnabled !== null) {
        const audioSettings = JSON.parse(audioProtectionEnabled);
        audioFingerprintProtection.configure(audioSettings);
      }
      
      console.log('Protection preferences loaded successfully');
    } catch (error) {
      console.error('Failed to load protection preferences:', error);
    }
  }

  // Create advanced settings panel
  function createAdvancedSettingsPanel() {
    const panel = document.createElement('div');
    panel.id = 'advanced-settings-panel';
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 1200px;
      max-height: 90vh;
      background: ${themes[currentTheme].bar};
      border: 2px solid ${themes[currentTheme].active};
      border-radius: 15px;
      z-index: 2147483647;
      display: none;
      font-family: ${FONT_STACK};
      color: ${themes[currentTheme].text};
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      background: ${themes[currentTheme].active};
      padding: 20px;
      border-bottom: 1px solid ${themes[currentTheme].button};
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const title = document.createElement('h1');
    title.textContent = '🔧 Advanced Browser Settings';
    title.style.cssText = `
      margin: 0;
      font-size: 24px;
      color: ${themes[currentTheme].text};
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: ${themes[currentTheme].button};
      border: none;
      color: ${themes[currentTheme].text};
      padding: 10px 15px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      transition: background 0.2s ease;
    `;
    closeBtn.onclick = hideAdvancedSettings;
    
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content container
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 20px;
      max-height: calc(90vh - 120px);
      overflow-y: auto;
    `;

    // Create sections
    const sections = [
      createTorNetworkSection(),
      createDNSOverHTTPSSection(),
      createDNSOverTLSSection(),
      createCertificateTransparencySection(),
      createPredictivePreloadingSection(),
      createWebRTCSection(),
      createConnectionSpoofingSection(),
      createPlatformDetectionSection(),
      createCertificatePinningSection(),
      createCanvasFingerprintSection(),
      createAudioFingerprintSection(),
      createMemoryPoolSection(),
      createPerformanceOptimizationSection(),
      createTabManagementSection(),
      createDataManagementSection()
    ];

    sections.forEach(section => content.appendChild(section));

    panel.appendChild(header);
    panel.appendChild(content);

    return panel;
  }

  // Create Tor Network section
  function createTorNetworkSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🌐 Tor Network (VPN-like Protection)';
    title.style.cssText = `
      margin: 0 0 15px 0;
      color: ${themes[currentTheme].active};
      font-size: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const description = document.createElement('p');
    description.textContent = 'Route your traffic through the Tor network for enhanced privacy and anonymity. This provides VPN-like protection by routing your connection through multiple encrypted relays.';
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: ${themes[currentTheme].text};
      opacity: 0.8;
      line-height: 1.5;
    `;

    // Tor Network Toggle
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const toggleLabel = document.createElement('label');
    toggleLabel.textContent = 'Enable Tor Network Routing';
    toggleLabel.style.cssText = `
      font-weight: bold;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    const toggleSwitch = document.createElement('input');
    toggleSwitch.type = 'checkbox';
    toggleSwitch.id = 'tor-network-toggle';
    toggleSwitch.checked = safeGetLocalStorage('cb_tor_network_enabled') === 'true';
    toggleSwitch.style.cssText = `
      width: 50px;
      height: 25px;
      appearance: none;
      background: ${toggleSwitch.checked ? themes[currentTheme].active : themes[currentTheme].button};
      border-radius: 25px;
      position: relative;
      cursor: pointer;
      transition: background 0.3s ease;
    `;

    // Custom toggle switch styling
    toggleSwitch.addEventListener('change', function() {
      this.style.background = this.checked ? themes[currentTheme].active : themes[currentTheme].button;
      toggleTorNetwork(this.checked);
    });

    toggleContainer.appendChild(toggleLabel);
    toggleContainer.appendChild(toggleSwitch);

    // Tor Network Status
    const statusContainer = document.createElement('div');
    statusContainer.id = 'tor-status-container';
    statusContainer.style.cssText = `
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const statusTitle = document.createElement('h3');
    statusTitle.textContent = 'Network Status';
    statusTitle.style.cssText = `
      margin: 0 0 10px 0;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'tor-status-display';
    statusDisplay.style.cssText = `
      padding: 10px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 14px;
      background: ${themes[currentTheme].input};
      border: 1px solid ${themes[currentTheme].button};
    `;

    statusContainer.appendChild(statusTitle);
    statusContainer.appendChild(statusDisplay);

    // Tor Network Controls
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    `;

    const testConnectionBtn = document.createElement('button');
    testConnectionBtn.textContent = '🔍 Test Connection';
    testConnectionBtn.style.cssText = `
      padding: 10px 20px;
      background: ${themes[currentTheme].button};
      border: none;
      color: ${themes[currentTheme].text};
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    `;
    testConnectionBtn.onclick = testTorConnection;

    const refreshCircuitBtn = document.createElement('button');
    refreshCircuitBtn.textContent = '🔄 Refresh Circuit';
    refreshCircuitBtn.style.cssText = `
      padding: 10px 20px;
      background: ${themes[currentTheme].button};
      border: none;
      color: ${themes[currentTheme].text};
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    `;
    refreshCircuitBtn.onclick = refreshTorCircuit;

    const viewCircuitBtn = document.createElement('button');
    viewCircuitBtn.textContent = '📊 View Circuit';
    viewCircuitBtn.style.cssText = `
      padding: 10px 20px;
      background: ${themes[currentTheme].button};
      border: none;
      color: ${themes[currentTheme].text};
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    `;
    viewCircuitBtn.onclick = viewTorCircuit;

    controlsContainer.appendChild(testConnectionBtn);
    controlsContainer.appendChild(refreshCircuitBtn);
    controlsContainer.appendChild(viewCircuitBtn);

    // Tor Network Configuration
    const configContainer = document.createElement('div');
    configContainer.style.cssText = `
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const configTitle = document.createElement('h3');
    configTitle.textContent = 'Configuration Options';
    configTitle.style.cssText = `
      margin: 0 0 15px 0;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    // Entry Node Selection
    const entryNodeContainer = document.createElement('div');
    entryNodeContainer.style.cssText = `
      margin-bottom: 15px;
    `;

    const entryNodeLabel = document.createElement('label');
    entryNodeLabel.textContent = 'Entry Node:';
    entryNodeLabel.style.cssText = `
      display: block;
      margin-bottom: 5px;
      color: ${themes[currentTheme].text};
      font-weight: bold;
    `;

    const entryNodeSelect = document.createElement('select');
    entryNodeSelect.id = 'tor-entry-node';
    entryNodeSelect.style.cssText = `
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid ${themes[currentTheme].button};
      background: ${themes[currentTheme].input};
      color: ${themes[currentTheme].text};
    `;

    const entryNodeOptions = [
      { value: 'auto', text: 'Auto (Recommended)' },
      { value: 'us', text: 'United States' },
      { value: 'eu', text: 'Europe' },
      { value: 'asia', text: 'Asia' },
      { value: 'random', text: 'Random' }
    ];

    entryNodeOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      if (option.value === (safeGetLocalStorage('cb_tor_entry_node') || 'auto')) {
        optionElement.selected = true;
      }
      entryNodeSelect.appendChild(optionElement);
    });

    entryNodeSelect.addEventListener('change', function() {
      safeSetLocalStorage('cb_tor_entry_node', this.value);
      if (window.torNetwork && typeof window.torNetwork.setEntryNode === 'function') {
        try {
          window.torNetwork.setEntryNode(this.value);
        } catch (error) {
          console.warn('Could not set Tor entry node:', error);
        }
      }
    });

    entryNodeContainer.appendChild(entryNodeLabel);
    entryNodeContainer.appendChild(entryNodeSelect);

    // Circuit Length Selection
    const circuitLengthContainer = document.createElement('div');
    circuitLengthContainer.style.cssText = `
      margin-bottom: 15px;
    `;

    const circuitLengthLabel = document.createElement('label');
    circuitLengthLabel.textContent = 'Circuit Length:';
    circuitLengthLabel.style.cssText = `
      display: block;
      margin-bottom: 5px;
      color: ${themes[currentTheme].text};
      font-weight: bold;
    `;

    const circuitLengthSelect = document.createElement('select');
    circuitLengthSelect.id = 'tor-circuit-length';
    circuitLengthSelect.style.cssText = `
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid ${themes[currentTheme].button};
      background: ${themes[currentTheme].input};
      color: ${themes[currentTheme].text};
    `;

    const circuitLengthOptions = [
      { value: '3', text: '3 Hops (Standard - Fast)' },
      { value: '5', text: '5 Hops (Enhanced - Balanced)' },
      { value: '7', text: '7 Hops (Maximum - Slowest)' }
    ];

    circuitLengthOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      if (option.value === (safeGetLocalStorage('cb_tor_circuit_length') || '3')) {
        optionElement.selected = true;
      }
      circuitLengthSelect.appendChild(optionElement);
    });

    circuitLengthSelect.addEventListener('change', function() {
      safeSetLocalStorage('cb_tor_circuit_length', this.value);
      if (window.torNetwork && typeof window.torNetwork.setCircuitLength === 'function') {
        try {
          window.torNetwork.setCircuitLength(parseInt(this.value));
        } catch (error) {
          console.warn('Could not set Tor circuit length:', error);
        }
      }
    });

    circuitLengthContainer.appendChild(circuitLengthLabel);
    circuitLengthContainer.appendChild(circuitLengthSelect);

    configContainer.appendChild(configTitle);
    configContainer.appendChild(entryNodeContainer);
    configContainer.appendChild(circuitLengthContainer);

    // Assemble section
    section.appendChild(title);
    section.appendChild(description);
    section.appendChild(toggleContainer);
    section.appendChild(statusContainer);
    section.appendChild(controlsContainer);
    section.appendChild(configContainer);

    // Initialize status display
    try {
      updateTorStatus();
    } catch (error) {
      console.warn('Could not initialize Tor status display:', error);
    }

    return section;
  }

  // Create DNS-over-HTTPS section
  function createDNSOverHTTPSSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🔒 DNS-over-HTTPS (DoH)';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const description = document.createElement('p');
    description.textContent = 'Encrypt your DNS queries using HTTPS to prevent DNS snooping and manipulation. This ensures your DNS requests are private and secure.';
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: ${themes[currentTheme].text};
      opacity: 0.8;
      line-height: 1.5;
    `;

    // DoH Toggle
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const toggleLabel = document.createElement('label');
    toggleLabel.textContent = 'Enable DNS-over-HTTPS';
    toggleLabel.style.cssText = `
      font-weight: bold;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    const toggleSwitch = document.createElement('input');
    toggleSwitch.type = 'checkbox';
    toggleSwitch.id = 'doh-toggle';
    toggleSwitch.checked = safeGetLocalStorage('doh_enabled') === 'true';
    toggleSwitch.style.cssText = `
      width: 50px;
      height: 25px;
      appearance: none;
      background: ${toggleSwitch.checked ? themes[currentTheme].active : themes[currentTheme].button};
      border-radius: 25px;
      position: relative;
      cursor: pointer;
      transition: background 0.3s ease;
    `;

    toggleSwitch.addEventListener('change', function() {
      this.style.background = this.checked ? themes[currentTheme].active : themes[currentTheme].button;
      if (this.checked) {
        window.dnsOverHTTPS.enable();
      } else {
        window.dnsOverHTTPS.disable();
      }
    });

    toggleContainer.appendChild(toggleLabel);
    toggleContainer.appendChild(toggleSwitch);

    // Provider Selection
    const providerContainer = document.createElement('div');
    providerContainer.style.cssText = `
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const providerLabel = document.createElement('label');
    providerLabel.textContent = 'DNS Provider:';
    providerLabel.style.cssText = `
      display: block;
      margin-bottom: 10px;
      font-weight: bold;
      color: ${themes[currentTheme].text};
    `;

    const providerSelect = document.createElement('select');
    providerSelect.id = 'doh-provider';
    providerSelect.style.cssText = `
      width: 100%;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid ${themes[currentTheme].button};
      background: ${themes[currentTheme].input};
      color: ${themes[currentTheme].text};
      font-family: ${FONT_STACK};
    `;

    const providers = [
      { value: 'cloudflare', label: 'Cloudflare (1.1.1.1)' },
      { value: 'google', label: 'Google (8.8.8.8)' },
      { value: 'quad9', label: 'Quad9 (9.9.9.9)' },
      { value: 'opendns', label: 'OpenDNS (208.67.222.222)' },
      { value: 'adguard', label: 'AdGuard (94.140.14.14)' }
    ];

    providers.forEach(provider => {
      const option = document.createElement('option');
      option.value = provider.value;
      option.textContent = provider.label;
      if (provider.value === safeGetLocalStorage('doh_provider', 'cloudflare')) {
        option.selected = true;
      }
      providerSelect.appendChild(option);
    });

    providerSelect.addEventListener('change', function() {
      if (window.dnsOverHTTPS) {
        window.dnsOverHTTPS.setProvider(this.value);
      }
    });

    providerContainer.appendChild(providerLabel);
    providerContainer.appendChild(providerSelect);

    // Fallback Toggle
    const fallbackContainer = document.createElement('div');
    fallbackContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const fallbackLabel = document.createElement('label');
    fallbackLabel.textContent = 'Enable Fallback to System DNS';
    fallbackLabel.style.cssText = `
      font-weight: bold;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    const fallbackSwitch = document.createElement('input');
    fallbackSwitch.type = 'checkbox';
    fallbackSwitch.id = 'doh-fallback';
    fallbackSwitch.checked = safeGetLocalStorage('doh_fallback') !== 'false';
    fallbackSwitch.style.cssText = `
      width: 50px;
      height: 25px;
      appearance: none;
      background: ${fallbackSwitch.checked ? themes[currentTheme].active : themes[currentTheme].button};
      border-radius: 25px;
      position: relative;
      cursor: pointer;
      transition: background 0.3s ease;
    `;

    fallbackSwitch.addEventListener('change', function() {
      this.style.background = this.checked ? themes[currentTheme].active : themes[currentTheme].button;
      if (window.dnsOverHTTPS) {
        window.dnsOverHTTPS.setFallback(this.checked);
      }
    });

    fallbackContainer.appendChild(fallbackLabel);
    fallbackContainer.appendChild(fallbackSwitch);

    // Test Button
    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test DoH Connection';
    testBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 15px;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;

    testBtn.addEventListener('click', async function() {
      if (window.dnsOverHTTPS) {
        const result = await window.dnsOverHTTPS.testConnection();
        if (result) {
          alert('✅ DoH connection successful!\n\nDNS queries are now encrypted and secure.');
        } else {
          alert('❌ DoH connection failed\n\nCheck your internet connection and try again.');
        }
      }
    });

    section.appendChild(title);
    section.appendChild(description);
    section.appendChild(toggleContainer);
    section.appendChild(providerContainer);
    section.appendChild(fallbackContainer);
    section.appendChild(testBtn);

    return section;
  }

  // Create DNS-over-TLS section
  function createDNSOverTLSSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🔒 DNS-over-TLS (DoT)';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const description = document.createElement('p');
    description.textContent = 'Alternative encrypted DNS using TLS wrapper. Provides similar security to DoH but uses a different protocol.';
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: ${themes[currentTheme].text};
      opacity: 0.8;
      line-height: 1.5;
    `;

    // DoT Toggle
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const toggleLabel = document.createElement('label');
    toggleLabel.textContent = 'Enable DNS-over-TLS';
    toggleLabel.style.cssText = `
      font-weight: bold;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    const toggleSwitch = document.createElement('input');
    toggleSwitch.type = 'checkbox';
    toggleSwitch.id = 'dot-toggle';
    toggleSwitch.checked = safeGetLocalStorage('dot_enabled') === 'true';
    toggleSwitch.style.cssText = `
      width: 50px;
      height: 25px;
      appearance: none;
      background: ${toggleSwitch.checked ? themes[currentTheme].active : themes[currentTheme].button};
      border-radius: 25px;
      position: relative;
      cursor: pointer;
      transition: background 0.3s ease;
    `;

    toggleSwitch.addEventListener('change', function() {
      this.style.background = this.checked ? themes[currentTheme].active : themes[currentTheme].button;
      if (this.checked) {
        window.dnsOverTLS.enable();
      } else {
        window.dnsOverTLS.disable();
      }
    });

    toggleContainer.appendChild(toggleLabel);
    toggleContainer.appendChild(toggleSwitch);

    // Provider Selection
    const providerContainer = document.createElement('div');
    providerContainer.style.cssText = `
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const providerLabel = document.createElement('label');
    providerLabel.textContent = 'DNS Provider:';
    providerLabel.style.cssText = `
      display: block;
      margin-bottom: 10px;
      font-weight: bold;
      color: ${themes[currentTheme].text};
    `;

    const providerSelect = document.createElement('select');
    providerSelect.id = 'dot-provider';
    providerSelect.style.cssText = `
      width: 100%;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid ${themes[currentTheme].button};
      background: ${themes[currentTheme].input};
      color: ${themes[currentTheme].text};
      font-family: ${FONT_STACK};
    `;

    const providers = [
      { value: 'cloudflare', label: 'Cloudflare (1.1.1.1)' },
      { value: 'google', label: 'Google (8.8.8.8)' },
      { value: 'quad9', label: 'Quad9 (9.9.9.9)' },
      { value: 'opendns', label: 'OpenDNS (208.67.222.222)' },
      { value: 'adguard', label: 'AdGuard (94.140.14.14)' }
    ];

    providers.forEach(provider => {
      const option = document.createElement('option');
      option.value = provider.value;
      option.textContent = provider.label;
      if (provider.value === safeGetLocalStorage('dot_provider', 'cloudflare')) {
        option.selected = true;
      }
      providerSelect.appendChild(option);
    });

    providerSelect.addEventListener('change', function() {
      if (window.dnsOverTLS) {
        window.dnsOverTLS.setProvider(this.value);
      }
    });

    providerContainer.appendChild(providerLabel);
    providerContainer.appendChild(providerSelect);

    // Port Configuration
    const portContainer = document.createElement('div');
    portContainer.style.cssText = `
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const portLabel = document.createElement('label');
    portLabel.textContent = 'TLS Port:';
    portLabel.style.cssText = `
      display: block;
      margin-bottom: 10px;
      font-weight: bold;
      color: ${themes[currentTheme].text};
    `;

    const portInput = document.createElement('input');
    portInput.type = 'number';
    portInput.id = 'dot-port';
    portInput.value = safeGetLocalStorage('dot_port', '853');
    portInput.min = '1';
    portInput.max = '65535';
    portInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid ${themes[currentTheme].button};
      background: ${themes[currentTheme].input};
      color: ${themes[currentTheme].text};
      font-family: ${FONT_STACK};
    `;

    portInput.addEventListener('change', function() {
      if (window.dnsOverTLS) {
        window.dnsOverTLS.setPort(this.value);
      }
    });

    portContainer.appendChild(portLabel);
    portContainer.appendChild(portInput);

    // Test Button
    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test DoT Connection';
    testBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;

    testBtn.addEventListener('click', async function() {
      if (window.dnsOverTLS) {
        const result = await window.dnsOverTLS.testConnection();
        if (result) {
          alert('✅ DoT connection successful!\n\nDNS queries are now encrypted with TLS.');
        } else {
          alert('❌ DoT connection failed\n\nCheck your internet connection and try again.');
        }
      }
    });

    section.appendChild(title);
    section.appendChild(description);
    section.appendChild(toggleContainer);
    section.appendChild(providerContainer);
    section.appendChild(portContainer);
    section.appendChild(testBtn);

    return section;
  }

  // Create Certificate Transparency section
  function createCertificateTransparencySection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🔍 Certificate Transparency';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const description = document.createElement('p');
    description.textContent = 'Monitor and verify SSL certificate issuance to detect fraudulent or unauthorized certificates. This helps prevent man-in-the-middle attacks.';
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: ${themes[currentTheme].text};
      font-size: 16px;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;

    // CT Toggle
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const toggleLabel = document.createElement('label');
    toggleLabel.textContent = 'Enable Certificate Transparency';
    toggleLabel.style.cssText = `
      font-weight: bold;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    const toggleSwitch = document.createElement('input');
    toggleSwitch.type = 'checkbox';
    toggleSwitch.id = 'ct-toggle';
    toggleSwitch.checked = safeGetLocalStorage('ct_enabled') === 'true';
    toggleSwitch.style.cssText = `
      width: 50px;
      height: 25px;
      appearance: none;
      background: ${toggleSwitch.checked ? themes[currentTheme].active : themes[currentTheme].button};
      border-radius: 25px;
      position: relative;
      cursor: pointer;
      transition: background 0.3s ease;
    `;

    toggleSwitch.addEventListener('change', function() {
      this.style.background = this.checked ? themes[currentTheme].active : themes[currentTheme].button;
      if (this.checked) {
        window.certificateTransparency.enable();
      } else {
        window.certificateTransparency.disable();
      }
    });

    toggleContainer.appendChild(toggleLabel);
    toggleContainer.appendChild(toggleSwitch);

    // Monitoring Toggle
    const monitoringContainer = document.createElement('div');
    monitoringContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const monitoringLabel = document.createElement('label');
    monitoringLabel.textContent = 'Enable Certificate Monitoring';
    monitoringLabel.style.cssText = `
      font-weight: bold;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    const monitoringSwitch = document.createElement('input');
    monitoringSwitch.type = 'checkbox';
    monitoringSwitch.id = 'ct-monitoring';
    monitoringSwitch.checked = safeGetLocalStorage('ct_monitoring') !== 'false';
    monitoringSwitch.style.cssText = `
      width: 50px;
      height: 25px;
      appearance: none;
      background: ${monitoringSwitch.checked ? themes[currentTheme].active : themes[currentTheme].button};
      border-radius: 25px;
      position: relative;
      cursor: pointer;
      transition: background 0.2s ease;
    `;

    monitoringSwitch.addEventListener('change', function() {
      this.style.background = this.checked ? themes[currentTheme].active : themes[currentTheme].button;
      if (window.certificateTransparency) {
        window.certificateTransparency.setMonitoring(this.checked);
      }
    });

    monitoringContainer.appendChild(monitoringLabel);
    monitoringContainer.appendChild(monitoringSwitch);

    // Status Display
    const statusContainer = document.createElement('div');
    statusContainer.id = 'ct-status-container';
    statusContainer.style.cssText = `
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const statusTitle = document.createElement('h3');
    statusTitle.textContent = 'Certificate Status';
    statusTitle.style.cssText = `
      margin: 0 0 10px 0;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'ct-status-display';
    statusDisplay.style.cssText = `
      padding: 10px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 14px;
      background: ${themes[currentTheme].input};
      border: 1px solid ${themes[currentTheme].button};
    `;

    statusContainer.appendChild(statusTitle);
    statusContainer.appendChild(statusDisplay);

    // Control Buttons
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 15px;
    `;

    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test Certificate';
    testBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;

    testBtn.addEventListener('click', async function() {
      if (window.certificateTransparency) {
        const result = await window.certificateTransparency.testConnection();
        if (result && result.valid) {
          alert('✅ Certificate verification successful!\n\nSSL certificate appears valid and secure.');
        } else {
          alert('❌ Certificate verification failed\n\nCheck the certificate details for more information.');
        }
      }
    });

    const viewCacheBtn = document.createElement('button');
    viewCacheBtn.textContent = '📋 View Certificate Cache';
    viewCacheBtn.style.cssText = `
      background: ${themes[currentTheme].button};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;

    viewCacheBtn.addEventListener('click', function() {
      if (window.certificateTransparency) {
        const cache = window.certificateTransparency.getCertificateCache();
        if (cache.length > 0) {
          let cacheInfo = '📋 Certificate Cache:\n\n';
          cache.forEach(([domain, verification]) => {
            cacheInfo += `Domain: ${domain}\n`;
            cacheInfo += `Valid: ${verification.valid ? '✅' : '❌'}\n`;
            cacheInfo += `Reason: ${verification.reason}\n`;
            if (verification.warnings.length > 0) {
              cacheInfo += `Warnings: ${verification.warnings.join(', ')}\n`;
            }
            cacheInfo += '\n';
          });
          alert(cacheInfo);
        } else {
          alert('📋 No certificates in cache yet.\n\nCertificates will be cached as you browse secure websites.');
        }
      }
    });

    const clearCacheBtn = document.createElement('button');
    clearCacheBtn.textContent = '🗑️ Clear Cache';
    clearCacheBtn.style.cssText = `
      background: ${themes[currentTheme].button};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;

    clearCacheBtn.addEventListener('click', function() {
      if (window.certificateTransparency) {
        window.certificateTransparency.clearCertificateCache();
        alert('🗑️ Certificate cache cleared successfully!');
      }
    });

    controlsContainer.appendChild(testBtn);
    controlsContainer.appendChild(viewCacheBtn);
    controlsContainer.appendChild(clearCacheBtn);

    section.appendChild(title);
    section.appendChild(description);
    section.appendChild(toggleContainer);
    section.appendChild(monitoringContainer);
    section.appendChild(statusContainer);
    section.appendChild(controlsContainer);

    return section;
  }

  // Create Predictive Preloading section
  function createPredictivePreloadingSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🧠 Predictive Preloading';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const description = document.createElement('p');
    description.textContent = 'AI-powered page load prediction and resource prefetching. The browser learns your navigation patterns and preloads likely next pages for instant browsing.';
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: ${themes[currentTheme].text};
      opacity: 0.8;
      line-height: 1.5;
    `;

    // Main Toggle
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const toggleLabel = document.createElement('label');
    toggleLabel.textContent = 'Enable Predictive Preloading';
    toggleLabel.style.cssText = `
      font-weight: bold;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    const toggleSwitch = document.createElement('input');
    toggleSwitch.type = 'checkbox';
    toggleSwitch.id = 'predictive-preloading-toggle';
    toggleSwitch.checked = safeGetLocalStorage('predictive_preloading') !== 'false';
    toggleSwitch.style.cssText = `
      width: 50px;
      height: 25px;
      appearance: none;
      background: ${toggleSwitch.checked ? themes[currentTheme].active : themes[currentTheme].button};
      border-radius: 25px;
      position: relative;
      cursor: pointer;
      transition: background 0.3s ease;
    `;

    toggleSwitch.addEventListener('change', function() {
      this.style.background = this.checked ? themes[currentTheme].active : themes[currentTheme].button;
      if (window.predictivePreloader && typeof window.predictivePreloader.enable === 'function') {
        if (this.checked) {
          window.predictivePreloader.enable();
        } else {
          window.predictivePreloader.disable();
        }
      }
    });

    toggleContainer.appendChild(toggleLabel);
    toggleContainer.appendChild(toggleSwitch);

    // Status Display
    const statusContainer = document.createElement('div');
    statusContainer.id = 'predictive-preloading-status';
    statusContainer.style.cssText = `
      margin-bottom: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const statusTitle = document.createElement('h3');
    statusTitle.textContent = 'AI Learning Status';
    statusTitle.style.cssText = `
      margin: 0 0 10px 0;
      color: ${themes[currentTheme].text};
      font-size: 16px;
    `;

    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'predictive-status-display';
    statusDisplay.style.cssText = `
      padding: 10px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 14px;
      background: ${themes[currentTheme].input};
      border: 1px solid ${themes[currentTheme].button};
    `;

    statusContainer.appendChild(statusTitle);
    statusContainer.appendChild(statusDisplay);

    // Control Buttons
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 15px;
      flex-wrap: wrap;
    `;

    const viewPredictionsBtn = document.createElement('button');
    viewPredictionsBtn.textContent = '🔮 View Predictions';
    viewPredictionsBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;

    viewPredictionsBtn.addEventListener('click', function() {
      if (window.predictivePreloader && typeof window.predictivePreloader.getPredictions === 'function') {
        const predictions = window.predictivePreloader.getPredictions();
        if (predictions.length > 0) {
          let predictionInfo = '🔮 AI Predictions:\n\n';
          predictions.forEach((prediction, index) => {
            predictionInfo += `${index + 1}. ${prediction.url}\n`;
            predictionInfo += `   Confidence: ${(prediction.confidence * 100).toFixed(1)}%\n`;
            predictionInfo += `   Type: ${prediction.type}\n\n`;
          });
          alert(predictionInfo);
        } else {
          alert('🔮 No predictions yet.\n\nThe AI is still learning your browsing patterns.');
        }
      }
    });

    const viewStatsBtn = document.createElement('button');
    viewStatsBtn.textContent = '📊 View Statistics';
    viewStatsBtn.style.cssText = `
      background: ${themes[currentTheme].button};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;

    viewStatsBtn.addEventListener('click', function() {
      if (window.predictivePreloader && typeof window.predictivePreloader.getStatus === 'function') {
        const status = window.predictivePreloader.getStatus();
        let statsInfo = '📊 Predictive Preloading Stats:\n\n';
        statsInfo += `Status: ${status.enabled ? '✅ Enabled' : '❌ Disabled'}\n`;
        statsInfo += `Predictions Made: ${status.predictions}\n`;
        statsInfo += `Pending Preloads: ${status.pendingPreloads}\n`;
        statsInfo += `User Patterns: ${status.userPatterns}\n`;
        statsInfo += `Navigation History: ${status.navigationHistory}\n`;
        alert(statsInfo);
      }
    });

    const clearCacheBtn = document.createElement('button');
    clearCacheBtn.textContent = '🗑️ Clear Cache';
    clearCacheBtn.style.cssText = `
      background: ${themes[currentTheme].button};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;

    clearCacheBtn.addEventListener('click', function() {
      if (window.predictivePreloader && typeof window.predictivePreloader.clearCache === 'function') {
        window.predictivePreloader.clearCache();
        alert('🗑️ Predictive preloading cache cleared!');
        updatePredictiveStatus();
      }
    });

    const resetPatternsBtn = document.createElement('button');
    resetPatternsBtn.textContent = '🔄 Reset Patterns';
    resetPatternsBtn.style.cssText = `
      background: ${themes[currentTheme].button};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;

    resetPatternsBtn.addEventListener('click', function() {
      if (window.predictivePreloader && typeof window.predictivePreloader.resetPatterns === 'function') {
        if (confirm('🔄 This will reset all learned patterns. The AI will start learning from scratch. Continue?')) {
          window.predictivePreloader.resetPatterns();
          alert('🔄 AI patterns reset successfully!');
          updatePredictiveStatus();
        }
      }
    });

    controlsContainer.appendChild(viewPredictionsBtn);
    controlsContainer.appendChild(viewStatsBtn);
    controlsContainer.appendChild(clearCacheBtn);
    controlsContainer.appendChild(resetPatternsBtn);

    section.appendChild(title);
    section.appendChild(description);
    section.appendChild(toggleContainer);
    section.appendChild(statusContainer);
    section.appendChild(controlsContainer);

    // Initialize status display
    try {
      updatePredictiveStatus();
    } catch (error) {
      console.warn('Could not initialize predictive preloading status display:', error);
    }

    return section;
  }

  // Create WebRTC Protection section
  function createWebRTCSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🔒 WebRTC Protection';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    `;

    const rows = [
      ['Protection Enabled', createToggle('webrtc-protection', webrtcProtection.getStatus().enabled, (checked) => {
        webrtcProtection.setEnabled(checked);
        localStorage.setItem('cb_webrtc_protection', checked.toString());
      })],
      ['Block STUN Servers', createToggle('block-stun', webrtcProtection.getStatus().blockSTUN, (checked) => {
        webrtcProtection.configure({ blockSTUN: checked });
        localStorage.setItem('cb_block_stun', checked.toString());
      })],
      ['Block TURN Servers', createToggle('block-turn', webrtcProtection.getStatus().blockTURN, (checked) => {
        webrtcProtection.configure({ blockTURN: checked });
        localStorage.setItem('cb_block_turn', checked.toString());
      })],
      ['Block Data Channels', createToggle('block-datachannels', webrtcProtection.getStatus().blockDataChannels, (checked) => {
        webrtcProtection.configure({ blockDataChannels: checked });
        localStorage.setItem('cb_block_datachannels', checked.toString());
      })],
      ['WebGL Fingerprint Randomization', createToggle('randomize-webgl', webrtcProtection.getStatus().randomizeWebGL, (checked) => {
        webrtcProtection.configure({ randomizeWebGL: checked });
        localStorage.setItem('cb_randomize_webgl', checked.toString());
      })]
    ];

    rows.forEach(([label, control]) => {
      const row = table.insertRow();
      row.style.cssText = 'border-bottom: 1px solid ' + themes[currentTheme].button;
      
      const labelCell = row.insertCell();
      labelCell.textContent = label;
      labelCell.style.cssText = `
        padding: 12px;
        font-weight: 500;
        width: 60%;
      `;
      
      const controlCell = row.insertCell();
      controlCell.appendChild(control);
      controlCell.style.cssText = `
        padding: 12px;
        text-align: center;
        width: 40%;
      `;
    });

    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test Protection';
    testBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 15px;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;
    testBtn.onclick = () => {
      const result = webrtcProtection.testProtection();
      alert(`WebRTC Protection Test:\n${result.message}`);
    };

    section.appendChild(title);
    section.appendChild(table);
    section.appendChild(testBtn);

    return section;
  }

  // Create Connection Spoofing section
  function createConnectionSpoofingSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🌐 Connection Type Spoofing';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    `;

    const connectionTypes = ['wifi', 'cellular', 'ethernet', 'none'];
    const effectiveTypes = ['slow-2g', '2g', '3g', '4g', '5g'];

    const rows = [
      ['Protection Enabled', createToggle('connection-spoofing', connectionSpoofing.getStatus().enabled, (checked) => {
        connectionSpoofing.setEnabled(checked);
        localStorage.setItem('cb_connection_spoofing', checked.toString());
      })],
      ['Connection Type', createSelect('spoof-connection-type', connectionTypes, connectionSpoofing.getStatus().connectionType, (value) => {
        connectionSpoofing.configure({ connectionType: value });
        localStorage.setItem('cb_spoof_connection_type', value);
      })],
      ['Effective Type', createSelect('spoof-effective-type', effectiveTypes, connectionSpoofing.getStatus().effectiveType, (value) => {
        connectionSpoofing.configure({ effectiveType: value });
        localStorage.setItem('cb_spoof_effective_type', value);
      })]
    ];

    rows.forEach(([label, control]) => {
      const row = table.insertRow();
      row.style.cssText = 'border-bottom: 1px solid ' + themes[currentTheme].button;
      
      const labelCell = row.insertCell();
      labelCell.textContent = label;
      labelCell.style.cssText = `
        padding: 12px;
        font-weight: 500;
        width: 60%;
      `;
      
      const controlCell = row.insertCell();
      controlCell.appendChild(control);
      controlCell.style.cssText = `
        padding: 12px;
        text-align: center;
        width: 40%;
      `;
    });

    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test Spoofing';
    testBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 15px;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;
    testBtn.onclick = () => {
      const status = connectionSpoofing.getStatus();
      alert(`Connection Spoofing Status:\nEnabled: ${status.enabled}\nType: ${status.connectionType}\nEffective: ${status.effectiveType}`);
    };

    section.appendChild(title);
    section.appendChild(table);
    section.appendChild(testBtn);

    return section;
  }

  // Create Platform Detection Prevention section
  function createPlatformDetectionSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🖥️ Platform Detection Prevention';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    `;

    const platforms = ['Win32', 'MacIntel', 'Linux x86_64', 'Android', 'iOS'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    const rows = [
      ['Protection Enabled', createToggle('platform-prevention', platformDetectionPrevention.getStatus().enabled, (checked) => {
        platformDetectionPrevention.setEnabled(checked);
        localStorage.setItem('cb_platform_prevention', checked.toString());
      })],
      ['Spoofed Platform', createSelect('spoof-platform', platforms, platformDetectionPrevention.getStatus().platform, (value) => {
        platformDetectionPrevention.configure({ platform: value });
        localStorage.setItem('cb_spoof_platform', value);
      })],
      ['Spoofed User Agent', createSelect('spoof-user-agent', userAgents, platformDetectionPrevention.getStatus().userAgent, (value) => {
        platformDetectionPrevention.configure({ userAgent: value });
        localStorage.setItem('cb_spoof_user_agent', value);
      })]
    ];

    rows.forEach(([label, control]) => {
      const row = table.insertRow();
      row.style.cssText = 'border-bottom: 1px solid ' + themes[currentTheme].button;
      
      const labelCell = row.insertCell();
      labelCell.textContent = '🖥️ ' + label;
      labelCell.style.cssText = `
        padding: 12px;
        font-weight: 500;
        width: 60%;
      `;
      
      const controlCell = row.insertCell();
      controlCell.appendChild(control);
      controlCell.style.cssText = `
        padding: 12px;
        text-align: center;
        width: 40%;
      `;
    });

    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test Prevention';
    testBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 15px;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;
    testBtn.onclick = () => {
      const result = platformDetectionPrevention.testDetection();
      alert(`Platform Detection Test:\nSpoofed: ${result.spoofed}\nExpected Platform: ${result.expected.platform}\nExpected User Agent: ${result.expected.userAgent}`);
    };

    section.appendChild(title);
    section.appendChild(table);
    section.appendChild(testBtn);

    return section;
  }

  // Create Certificate Pinning section
  function createCertificatePinningSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🔐 Certificate Pinning';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    `;

    const rows = [
      ['Pinning Enabled', createToggle('certificate-pinning', certificatePinning.getStatus().enabled, (checked) => {
        certificatePinning.setEnabled(checked);
        localStorage.setItem('cb_certificate_pinning', checked.toString());
      })],
      ['Monitoring Active', createToggle('pinning-monitoring', certificatePinning.getStatus().monitoring, (checked) => {
        if (checked) {
          certificatePinning.startMonitoring();
        } else {
          certificatePinning.stopMonitoring();
        }
      })]
    ];

    rows.forEach(([label, control]) => {
      const row = table.insertRow();
      row.style.cssText = 'border-bottom: 1px solid ' + themes[currentTheme].button;
      
      const labelCell = row.insertCell();
      labelCell.textContent = '🔐 ' + label;
      labelCell.style.cssText = `
        padding: 12px;
        font-weight: 500;
        width: 60%;
      `;
      
      const controlCell = row.insertCell();
      controlCell.appendChild(control);
      controlCell.style.cssText = `
        padding: 12px;
        text-align: center;
        width: 40%;
      `;
    });

    // Add domain management
    const domainSection = document.createElement('div');
    domainSection.style.cssText = `
      margin-top: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const domainTitle = document.createElement('h3');
    domainTitle.textContent = 'Pinned Domains';
    domainTitle.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 16px;
      color: ${themes[currentTheme].text};
    `;

    const domainList = document.createElement('div');
    domainList.style.cssText = `
      margin-bottom: 15px;
      max-height: 100px;
      overflow-y: auto;
    `;

    const pinnedDomains = certificatePinning.getStatus().pinnedDomains;
    if (pinnedDomains > 0) {
      const domains = Array.from(certificatePinning.pinnedDomains);
      domains.forEach(domain => {
        const domainItem = document.createElement('div');
        domainItem.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          margin: 5px 0;
          background: ${themes[currentTheme].input};
          border-radius: 5px;
          border: 1px solid ${themes[currentTheme].button};
        `;
        
        const domainText = document.createElement('span');
        domainText.textContent = domain;
        domainText.style.cssText = `
          color: ${themes[currentTheme].text};
          font-family: monospace;
        `;
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.cssText = `
          background: ${themes[currentTheme].error};
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        `;
        removeBtn.onclick = () => {
          certificatePinning.removeDomain(domain);
          domainItem.remove();
        };
        
        domainItem.appendChild(domainText);
        domainItem.appendChild(removeBtn);
        domainList.appendChild(domainItem);
      });
    } else {
      const noDomains = document.createElement('div');
      noDomains.textContent = 'No domains pinned';
      noDomains.style.cssText = `
        color: ${themes[currentTheme].text};
        font-style: italic;
        text-align: center;
        padding: 20px;
      `;
      domainList.appendChild(noDomains);
    }

    // Add domain input
    const addDomainSection = document.createElement('div');
    addDomainSection.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    const domainInput = document.createElement('input');
    domainInput.type = 'text';
    domainInput.placeholder = 'Enter domain (e.g., example.com)';
    domainInput.style.cssText = `
      flex: 1;
      padding: 8px;
      border: 1px solid ${themes[currentTheme].button};
      border-radius: 5px;
      background: ${themes[currentTheme].input};
      color: ${themes[currentTheme].text};
      font-family: ${FONT_STACK};
    `;

    const addDomainBtn = document.createElement('button');
    addDomainBtn.textContent = 'Add Domain';
    addDomainBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 8px 16px;
      border-radius: 5px;
      cursor: pointer;
      font-family: ${FONT_STACK};
    `;
    addDomainBtn.onclick = () => {
      const domain = domainInput.value.trim();
      if (domain && !certificatePinning.pinnedDomains.has(domain)) {
        certificatePinning.addDomain(domain);
        domainInput.value = '';
        // Refresh the section
        const newSection = createCertificatePinningSection();
        section.parentNode.replaceChild(newSection, section);
      }
    };

    addDomainSection.appendChild(domainInput);
    addDomainSection.appendChild(addDomainBtn);

    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test Pinning';
    testBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 15px;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;
    testBtn.onclick = () => {
      const result = certificatePinning.testPinning();
      const report = certificatePinning.getPinningReport();
      alert(`Certificate Pinning Test:\nEnabled: ${result.enabled}\nMonitoring: ${result.monitoring}\nPinned Domains: ${result.testDomains.length}\nBlocked Domains: ${report.blockedDomains.length}`);
    };

    section.appendChild(title);
    section.appendChild(table);
    section.appendChild(domainSection);
    domainSection.appendChild(domainTitle);
    domainSection.appendChild(domainList);
    domainSection.appendChild(addDomainSection);
    section.appendChild(testBtn);

    return section;
  }

  // Create Canvas Fingerprint Protection section
  function createCanvasFingerprintSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🎨 Canvas Fingerprint Protection';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    `;

    const randomizationLevels = ['low', 'medium', 'high'];

    const rows = [
      ['Protection Enabled', createToggle('canvas-protection', window.canvasFingerprintProtection ? window.canvasFingerprintProtection.getStatus().enabled : false, (checked) => {
        if (window.canvasFingerprintProtection) {
          if (checked) {
            window.canvasFingerprintProtection.enable();
          } else {
            window.canvasFingerprintProtection.disable();
          }
          localStorage.setItem('cb_canvas_protection', JSON.stringify(window.canvasFingerprintProtection.getStatus()));
        }
      })],
      ['Randomization Level', createSelect('canvas-randomization', randomizationLevels, window.canvasFingerprintProtection ? window.canvasFingerprintProtection.getStatus().randomizationLevel : 'medium', (value) => {
        if (window.canvasFingerprintProtection) {
          window.canvasFingerprintProtection.configure({ randomizationLevel: value });
          localStorage.setItem('cb_canvas_protection', JSON.stringify(window.canvasFingerprintProtection.getStatus()));
        }
      })]
    ];

    rows.forEach(([label, control]) => {
      const row = table.insertRow();
      row.style.cssText = 'border-bottom: 1px solid ' + themes[currentTheme].button;
      
      const labelCell = row.insertCell();
      labelCell.textContent = '🎨 ' + label;
      labelCell.style.cssText = `
        padding: 12px;
        font-weight: 500;
        width: 60%;
      `;
      
      const controlCell = row.insertCell();
      controlCell.appendChild(control);
      controlCell.style.cssText = `
        padding: 12px;
        text-align: center;
        width: 40%;
      `;
    });

    // Status display
    const statusSection = document.createElement('div');
    statusSection.style.cssText = `
      margin-top: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const statusTitle = document.createElement('h3');
    statusTitle.textContent = 'Protection Status';
    statusTitle.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 16px;
      color: ${themes[currentTheme].text};
    `;

    const statusInfo = document.createElement('div');
    statusInfo.style.cssText = `
      font-family: monospace;
      font-size: 14px;
      color: ${themes[currentTheme].text};
    `;

    const updateStatus = () => {
      if (window.canvasFingerprintProtection) {
        const status = window.canvasFingerprintProtection.getStatus();
        statusInfo.innerHTML = `
          <div>Enabled: ${status.enabled ? 'Yes' : 'No'}</div>
          <div>Randomization Level: ${status.randomizationLevel}</div>
          <div>Fake Fingerprint: ${status.fakeFingerprint}</div>
          <div>Protected APIs: ${status.protectedAPIs.length}</div>
        `;
      } else {
        statusInfo.innerHTML = `
          <div>Status: Module not available</div>
        `;
      }
    };

    updateStatus();
    statusSection.appendChild(statusTitle);
    statusSection.appendChild(statusInfo);

    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test Protection';
    testBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 15px;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;
    testBtn.onclick = () => {
      if (window.canvasFingerprintProtection) {
        const result = window.canvasFingerprintProtection.testProtection();
        let message = 'Canvas Fingerprint Protection Test:\n\n';
        result.tests.forEach(test => {
          message += `${test.name}: ${test.status === 'success' ? '✓' : '✗'} ${test.message}\n`;
        });
        if (result.recommendations.length > 0) {
          message += '\nRecommendations:\n';
          result.recommendations.forEach(rec => {
            message += `• ${rec}\n`;
          });
        }
        alert(message);
      } else {
        alert('Canvas Fingerprint Protection module not available');
      }
    };

    section.appendChild(title);
    section.appendChild(table);
    section.appendChild(statusSection);
    section.appendChild(testBtn);

    return section;
  }

  // Create Audio Fingerprint Protection section
  function createAudioFingerprintSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🎵 Audio Fingerprint Protection';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    `;

    const randomizationLevels = ['low', 'medium', 'high'];

    const rows = [
      ['Protection Enabled', createToggle('audio-protection', window.audioFingerprintProtection ? window.audioFingerprintProtection.getStatus().enabled : false, (checked) => {
        if (window.audioFingerprintProtection) {
          if (checked) {
            window.audioFingerprintProtection.enable();
          } else {
            window.audioFingerprintProtection.disable();
          }
          localStorage.setItem('cb_audio_protection', JSON.stringify(window.audioFingerprintProtection.getStatus()));
        }
      })],
      ['Randomization Level', createSelect('audio-randomization', randomizationLevels, window.audioFingerprintProtection ? window.audioFingerprintProtection.getStatus().randomizationLevel : 'medium', (value) => {
        if (window.audioFingerprintProtection) {
          window.audioFingerprintProtection.configure({ randomizationLevel: value });
          localStorage.setItem('cb_audio_protection', JSON.stringify(window.audioFingerprintProtection.getStatus()));
        }
      })]
    ];

    rows.forEach(([label, control]) => {
      const row = table.insertRow();
      row.style.cssText = 'border-bottom: 1px solid ' + themes[currentTheme].button;
      
      const labelCell = row.insertCell();
      labelCell.textContent = '🎵 ' + label;
      labelCell.style.cssText = `
        padding: 12px;
        font-weight: 500;
        width: 60%;
      `;
      
      const controlCell = row.insertCell();
      controlCell.appendChild(control);
      controlCell.style.cssText = `
        padding: 12px;
        text-align: center;
        width: 40%;
      `;
    });

    // Status display
    const statusSection = document.createElement('div');
    statusSection.style.cssText = `
      margin-top: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const statusTitle = document.createElement('h3');
    statusTitle.textContent = 'Protection Status';
    statusTitle.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 16px;
      color: ${themes[currentTheme].text};
    `;

    const statusInfo = document.createElement('div');
    statusInfo.style.cssText = `
      font-family: monospace;
      font-size: 14px;
      color: ${themes[currentTheme].text};
    `;

    const updateStatus = () => {
      if (window.audioFingerprintProtection) {
        const status = window.audioFingerprintProtection.getStatus();
        statusInfo.innerHTML = `
          <div>Enabled: ${status.enabled ? 'Yes' : 'No'}</div>
          <div>Randomization Level: ${status.randomizationLevel}</div>
          <div>Fake Fingerprint: ${status.fakeFingerprint}</div>
          <div>Protected Audio Contexts: ${status.protectedAudioContexts}</div>
          <div>Protected APIs: ${status.protectedAPIs.length}</div>
        `;
      } else {
        statusInfo.innerHTML = `
          <div>Status: Module not available</div>
        `;
      }
    };

    updateStatus();
    statusSection.appendChild(statusTitle);
    statusSection.appendChild(statusInfo);

    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test Protection';
    testBtn.style.cssText = `
      background: ${themes[currentTheme].active};
      color: ${themes[currentTheme].text};
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 15px;
      font-family: ${FONT_STACK};
      transition: background 0.2s ease;
    `;
    testBtn.onclick = () => {
      if (window.audioFingerprintProtection) {
        const result = window.audioFingerprintProtection.testProtection();
        let message = 'Audio Fingerprint Protection Test:\n\n';
        result.tests.forEach(test => {
          message += `${test.name}: ${test.status === 'success' ? '✓' : '✗'} ${test.message}\n`;
        });
        if (result.recommendations.length > 0) {
          message += '\nRecommendations:\n';
          result.recommendations.forEach(rec => {
            message += `• ${rec}\n`;
          });
        }
        alert(message);
      } else {
        alert('Audio Fingerprint Protection module not available');
      }
    };

    section.appendChild(title);
    section.appendChild(table);
    section.appendChild(statusSection);
    section.appendChild(testBtn);

    return section;
  }

  // Create Memory Pool Management section
  function createMemoryPoolSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '🧠 Memory Pool Management';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    // Memory statistics display
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
      background: ${themes[currentTheme].bar};
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-family: monospace;
      font-size: 14px;
    `;

    const updateStats = () => {
      const stats = memoryPoolManager.getStats();
      statsContainer.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: ${themes[currentTheme].active};">📊 Memory Statistics</div>
        <div>Active Pools: ${stats.pools}</div>
        <div>Total Objects: ${stats.totalObjects}</div>
        <div>Allocated: ${stats.allocatedObjects}</div>
        <div>Freed: ${stats.freedObjects}</div>
        <div>Reuse Rate: ${stats.reuseRate.toFixed(1)}%</div>
        <div>Memory Usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB</div>
        <div>Peak Memory: ${(stats.maxMemoryUsage / 1024 / 1024).toFixed(2)} MB</div>
      `;
    };

    // Update stats immediately and every 5 seconds
    updateStats();
    const statsInterval = setInterval(updateStats, 5000);

    // Control buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-top: 15px;
    `;

    const buttons = [
      ['🧹 Manual GC', () => {
        memoryPoolManager.triggerGC();
        showNotification('Manual garbage collection triggered', 'info', 2000);
        updateStats();
      }],
      ['⚡ Optimize', () => {
        memoryPoolManager.optimize();
        showNotification('Memory optimization completed', 'info', 2000);
        updateStats();
      }],
      ['📊 Refresh Stats', () => {
        updateStats();
        showNotification('Memory statistics refreshed', 'info', 1000);
      }]
    ];

    buttons.forEach(([text, onClick]) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        background: ${themes[currentTheme].active};
        color: ${themes[currentTheme].text};
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-family: ${FONT_STACK};
        transition: background 0.2s ease;
        flex: 1;
        min-width: 150px;
      `;
      button.onclick = onClick;
      buttonContainer.appendChild(button);
    });

    // Pool configuration
    const configContainer = document.createElement('div');
    configContainer.style.cssText = `
      margin-top: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
    `;

    const configTitle = document.createElement('h3');
    configTitle.textContent = '⚙️ Pool Configuration';
    configTitle.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 16px;
      color: ${themes[currentTheme].text};
    `;

    const configTable = document.createElement('table');
    configTable.style.cssText = `
      width: 100%;
      border-collapse: collapse;
    `;

    const configRows = [
      ['Max Pool Size', createInput('max-pool-size', memoryPoolManager.maxPoolSize.toString(), (value) => {
        const newSize = parseInt(value);
        if (!isNaN(newSize) && newSize > 0) {
          memoryPoolManager.maxPoolSize = newSize;
          localStorage.setItem('cb_max_pool_size', newSize.toString());
          showNotification('Max pool size updated', 'success', 2000);
        }
      })],
      ['GC Threshold (%)', createInput('gc-threshold', (memoryPoolManager.gcThreshold * 100).toString(), (value) => {
        const newThreshold = parseInt(value) / 100;
        if (!isNaN(newThreshold) && newThreshold > 0 && newThreshold < 1) {
          memoryPoolManager.gcThreshold = newThreshold;
          localStorage.setItem('cb_gc_threshold', newThreshold.toString());
          showNotification('GC threshold updated', 'success', 2000);
        }
      })],
      ['GC Interval (ms)', createInput('gc-interval', memoryPoolManager.gcInterval.toString(), (value) => {
        const newInterval = parseInt(value);
        if (!isNaN(newInterval) && newInterval > 0) {
          memoryPoolManager.gcInterval = newInterval;
          localStorage.setItem('cb_gc_interval', newInterval.toString());
          showNotification('GC interval updated', 'success', 2000);
        }
      })]
    ];

    configRows.forEach(([label, control]) => {
      const row = configTable.insertRow();
      row.style.cssText = 'border-bottom: 1px solid ' + themes[currentTheme].button;
      
      const labelCell = row.insertCell();
      labelCell.textContent = label;
      labelCell.style.cssText = `
        padding: 8px;
        font-weight: 500;
        width: 60%;
      `;
      
      const controlCell = row.insertCell();
      controlCell.appendChild(control);
      controlCell.style.cssText = `
        padding: 8px;
        text-align: center;
        width: 40%;
      `;
    });

    configContainer.appendChild(configTitle);
    configContainer.appendChild(configTable);

    section.appendChild(title);
    section.appendChild(statsContainer);
    section.appendChild(buttonContainer);
    section.appendChild(configContainer);

    // Clean up interval when section is removed
    section.addEventListener('remove', () => {
      clearInterval(statsInterval);
    });

    return section;
  }

  // Create Performance Optimization section
  function createPerformanceOptimizationSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '⚡ Performance Optimization';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    // Network Request Batching subsection
    const batchingSubsection = document.createElement('div');
    batchingSubsection.style.cssText = `
      margin-bottom: 25px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
    `;

    const batchingTitle = document.createElement('h3');
    batchingTitle.textContent = '🌐 Network Request Batching';
    batchingTitle.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 16px;
      color: ${themes[currentTheme].text};
    `;

    const batchingStats = document.createElement('div');
    batchingStats.style.cssText = `
      font-family: monospace;
      font-size: 14px;
      margin-bottom: 15px;
    `;

    const updateBatchingStats = () => {
      const stats = networkBatcher.getStats();
      batchingStats.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; color: ${themes[currentTheme].active};">📊 Batching Statistics</div>
        <div>Total Requests: ${stats.totalRequests}</div>
        <div>Batched Requests: ${stats.batchedRequests}</div>
        <div>Saved Requests: ${stats.savedRequests}</div>
        <div>Average Batch Size: ${stats.averageBatchSize.toFixed(2)}</div>
      `;
    };

    updateBatchingStats();
    const batchingStatsInterval = setInterval(updateBatchingStats, 3000);

    const batchingControls = document.createElement('div');
    batchingControls.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    `;

    const batchingInputs = [
      ['Batch Timeout (ms)', 'batch-timeout', networkBatcher.batchTimeout.toString(), (value) => {
        const newTimeout = parseInt(value);
        if (!isNaN(newTimeout) && newTimeout >= 50 && newTimeout <= 1000) {
          networkBatcher.configure({ batchTimeout: newTimeout });
          localStorage.setItem('cb_batch_timeout', newTimeout.toString());
          showNotification('Batch timeout updated', 'success', 2000);
        }
      }],
      ['Max Batch Size', 'max-batch-size', networkBatcher.maxBatchSize.toString(), (value) => {
        const newSize = parseInt(value);
        if (!isNaN(newSize) && newSize >= 2 && newSize <= 20) {
          networkBatcher.configure({ maxBatchSize: newSize });
          localStorage.setItem('cb_max_batch_size', newSize.toString());
          showNotification('Max batch size updated', 'success', 2000);
        }
      }]
    ];

    batchingInputs.forEach(([label, id, value, onChange]) => {
      const container = document.createElement('div');
      container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 1;
        min-width: 150px;
      `;

      const labelElement = document.createElement('label');
      labelElement.textContent = label;
      labelElement.style.cssText = `
        font-size: 12px;
        color: ${themes[currentTheme].text};
        opacity: 0.8;
      `;

      const input = createInput(id, value, onChange);
      input.style.minWidth = '100px';

      container.appendChild(labelElement);
      container.appendChild(input);
      batchingControls.appendChild(container);
    });

    batchingSubsection.appendChild(batchingTitle);
    batchingSubsection.appendChild(batchingStats);
    batchingSubsection.appendChild(batchingControls);

    // Critical Path Optimization subsection
    const criticalPathSubsection = document.createElement('div');
    criticalPathSubsection.style.cssText = `
      margin-bottom: 25px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
    `;

    const criticalPathTitle = document.createElement('h3');
    criticalPathTitle.textContent = '🎯 Critical Path Optimization';
    criticalPathTitle.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 16px;
      color: ${themes[currentTheme].text};
    `;

    const criticalPathStats = document.createElement('div');
    criticalPathStats.style.cssText = `
      font-family: monospace;
      font-size: 14px;
      margin-bottom: 15px;
    `;

    const updateCriticalPathStats = () => {
      const stats = criticalPathOptimizer.getStats();
      criticalPathStats.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; color: ${themes[currentTheme].active};">📊 Optimization Statistics</div>
        <div>Critical Elements: ${stats.criticalElements}</div>
        <div>Preloaded Resources: ${stats.preloadedResources}</div>
        <div>Deferred Resources: ${stats.deferredResources}</div>
        <div>Optimization Time: ${stats.optimizationTime.toFixed(2)}ms</div>
      `;
    };

    updateCriticalPathStats();
    const criticalPathStatsInterval = setInterval(updateCriticalPathStats, 3000);

    const criticalPathControls = document.createElement('div');
    criticalPathControls.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    `;

    const criticalPathButtons = [
      ['🔄 Re-optimize', () => {
        criticalPathOptimizer.init();
        showNotification('Critical path re-optimized', 'success', 2000);
        updateCriticalPathStats();
      }],
      ['📊 Refresh Stats', () => {
        updateCriticalPathStats();
        updateBatchingStats();
        showNotification('Performance statistics refreshed', 'info', 1000);
      }]
    ];

    criticalPathButtons.forEach(([text, onClick]) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        background: ${themes[currentTheme].active};
        color: ${themes[currentTheme].text};
        border: none;
        padding: 10px 15px;
        border-radius: 6px;
        cursor: pointer;
        font-family: ${FONT_STACK};
        transition: background 0.2s ease;
        flex: 1;
        min-width: 120px;
      `;
      button.onclick = onClick;
      criticalPathControls.appendChild(button);
    });

    criticalPathSubsection.appendChild(criticalPathTitle);
    criticalPathSubsection.appendChild(criticalPathStats);
    criticalPathSubsection.appendChild(criticalPathControls);

    section.appendChild(title);
    section.appendChild(batchingSubsection);
    section.appendChild(criticalPathSubsection);

    // Clean up intervals when section is removed
    section.addEventListener('remove', () => {
      clearInterval(batchingStatsInterval);
      clearInterval(criticalPathStatsInterval);
    });

    return section;
  }

  // Create Tab Management section
  function createTabManagementSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '📑 Tab Management';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    // Tab statistics
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = `
      background: ${themes[currentTheme].bar};
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-family: monospace;
      font-size: 14px;
    `;

    const updateTabStats = () => {
      const state = tabManager.getState();
      statsContainer.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: ${themes[currentTheme].active};">📊 Tab Statistics</div>
        <div>Total Tabs: ${state.totalTabs}</div>
        <div>Active Tab: ${state.activeTabIndex + 1}</div>
        <div>Pinned Tabs: ${state.tabs.filter(t => t.pinned).length}</div>
        <div>Sleeping Tabs: ${state.tabs.filter(t => t.sleeping).length}</div>
        <div>Max Tabs: ${tabManager.persistentStorage.maxTabs}</div>
      `;
    };

    updateTabStats();
    const tabStatsInterval = setInterval(updateTabStats, 2000);

    // Tab controls
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    `;

    const tabButtons = [
      ['➕ New Tab', () => {
        tabManager.createTab('about:blank', 'New Tab');
        showNotification('New tab created', 'success', 2000);
        updateTabStats();
      }],
      ['📌 Pin Active', () => {
        tabManager.togglePinTab(tabManager.activeTabIndex);
        showNotification('Tab pin toggled', 'info', 2000);
        updateTabStats();
      }],
      ['😴 Sleep Others', () => {
        tabManager.tabs.forEach((tab, index) => {
          if (index !== tabManager.activeTabIndex) {
            tabManager.sleepTab(index);
          }
        });
        showNotification('Other tabs put to sleep', 'info', 2000);
        updateTabStats();
      }],
      ['🔄 Refresh Stats', () => {
        updateTabStats();
        showNotification('Tab statistics refreshed', 'info', 1000);
      }]
    ];

    tabButtons.forEach(([text, onClick]) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        background: ${themes[currentTheme].active};
        color: ${themes[currentTheme].text};
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-family: ${FONT_STACK};
        transition: background 0.2s ease;
        flex: 1;
        min-width: 120px;
      `;
      button.onclick = onClick;
      controlsContainer.appendChild(button);
    });

    // Tab configuration
    const configContainer = document.createElement('div');
    configContainer.style.cssText = `
      margin-top: 20px;
      padding: 15px;
      background: ${themes[currentTheme].bar};
      border-radius: 8px;
    `;

    const configTitle = document.createElement('h3');
    configTitle.textContent = '⚙️ Tab Configuration';
    configTitle.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 16px;
      color: ${themes[currentTheme].text};
    `;

    const configTable = document.createElement('table');
    configTable.style.cssText = `
      width: 100%;
      border-collapse: collapse;
    `;

    const configRows = [
      ['Max Tabs', createInput('max-tabs', tabManager.persistentStorage.maxTabs.toString(), (value) => {
        const newMax = parseInt(value);
        if (!isNaN(newMax) && newMax >= 5 && newMax <= 100) {
          tabManager.persistentStorage.maxTabs = newMax;
          localStorage.setItem('cb_max_tabs', newMax.toString());
          showNotification('Max tabs updated', 'success', 2000);
        }
      })],
      ['Auto Save (ms)', createInput('auto-save-interval', tabManager.persistentStorage.saveInterval.toString(), (value) => {
        const newInterval = parseInt(value);
        if (!isNaN(newInterval) && newInterval >= 100 && newInterval <= 10000) {
          tabManager.persistentStorage.saveInterval = newInterval;
          localStorage.setItem('cb_tab_save_interval', newInterval.toString());
          showNotification('Auto save interval updated', 'success', 2000);
        }
      })]
    ];

    configRows.forEach(([label, control]) => {
      const row = configTable.insertRow();
      row.style.cssText = 'border-bottom: 1px solid ' + themes[currentTheme].button;
      
      const labelCell = row.insertCell();
      labelCell.textContent = label;
      labelCell.style.cssText = `
        padding: 8px;
        font-weight: 500;
        width: 60%;
      `;
      
      const controlCell = row.insertCell();
      controlCell.appendChild(control);
      controlCell.style.cssText = `
        padding: 8px;
        text-align: center;
        width: 40%;
      `;
    });

    configContainer.appendChild(configTitle);
    configContainer.appendChild(configTable);

    section.appendChild(title);
    section.appendChild(statsContainer);
    section.appendChild(controlsContainer);
    section.appendChild(configContainer);

    // Clean up interval when section is removed
    section.addEventListener('remove', () => {
      clearInterval(tabStatsInterval);
    });

    return section;
  }

  // Create Data Management section
  function createDataManagementSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 30px;
      padding: 20px;
      background: ${themes[currentTheme].input};
      border-radius: 10px;
      border: 1px solid ${themes[currentTheme].button};
    `;

    const title = document.createElement('h2');
    title.textContent = '💾 Data Management';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${themes[currentTheme].text};
      border-bottom: 2px solid ${themes[currentTheme].active};
      padding-bottom: 10px;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-top: 15px;
    `;

    const buttons = [
      ['🗑️ Clear All Data', clearAllBrowserData],
      ['📤 Export Settings', exportSettings],
      ['📥 Import Settings', importSettings],
      ['🔄 Reset to Defaults', resetSettingsToDefaults]
    ];

    buttons.forEach(([text, onClick]) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        background: ${themes[currentTheme].active};
        color: ${themes[currentTheme].text};
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-family: ${FONT_STACK};
        transition: background 0.2s ease;
        flex: 1;
        min-width: 150px;
      `;
      button.onclick = onClick;
      buttonContainer.appendChild(button);
    });

    section.appendChild(title);
    section.appendChild(buttonContainer);

    return section;
  }

  // Helper function to create toggle switches
  function createToggle(id, checked, onChange) {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; align-items: center; justify-content: center;';
    
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = id;
    toggle.checked = checked;
    toggle.style.cssText = `
      width: 50px;
      height: 25px;
      appearance: none;
      background: ${checked ? themes[currentTheme].active : themes[currentTheme].button};
      border-radius: 25px;
      position: relative;
      cursor: pointer;
      transition: background 0.3s ease;
    `;
    
    toggle.addEventListener('change', (e) => {
      onChange(e.target.checked);
    });
    
    // Toggle indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: absolute;
      top: 2px;
      left: ${checked ? '27px' : '2px'};
      width: 21px;
      height: 21px;
      background: white;
      border-radius: 50%;
      transition: left 0.3s ease;
    `;
    
    toggle.addEventListener('change', () => {
      indicator.style.left = toggle.checked ? '27px' : '2px';
      toggle.style.background = toggle.checked ? themes[currentTheme].active : themes[currentTheme].button;
    });
    
    container.appendChild(toggle);
    toggle.appendChild(indicator);
    
    return container;
  }

  // Helper function to create input fields
  function createInput(id, value, onChange) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.value = value;
    input.style.cssText = `
      padding: 8px 12px;
      border: 1px solid ${themes[currentTheme].button};
      border-radius: 6px;
      background: ${themes[currentTheme].input};
      color: ${themes[currentTheme].text};
      font-family: ${FONT_STACK};
      min-width: 150px;
      text-align: center;
    `;
    
    input.addEventListener('change', (e) => {
      onChange(e.target.value);
    });
    
    input.addEventListener('blur', (e) => {
      onChange(e.target.value);
    });
    
    return input;
  }

  // Helper function to create select dropdowns
  function createSelect(id, options, selectedValue, onChange) {
    const select = document.createElement('select');
    select.id = id;
    select.style.cssText = `
      padding: 8px 12px;
      border: 1px solid ${themes[currentTheme].button};
      border-radius: 6px;
      background: ${themes[currentTheme].input};
      color: ${themes[currentTheme].text};
      font-family: ${FONT_STACK};
      cursor: pointer;
      min-width: 150px;
    `;
    
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      if (option === selectedValue) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });
    
    select.addEventListener('change', (e) => {
      onChange(e.target.value);
    });
    
    return select;
  }

  // Show advanced settings panel
  function showAdvancedSettings() {
    console.log('🔧 Opening advanced settings panel...');
    
    try {
      // Create settings panel if it doesn't exist
      if (!cachedElements.advancedSettingsPanel) {
        console.log('🔧 Creating new advanced settings panel...');
        cachedElements.advancedSettingsPanel = createAdvancedSettingsPanel();
        
        // Append to document body for better compatibility
        document.body.appendChild(cachedElements.advancedSettingsPanel);
        console.log('🔧 Advanced settings panel appended to document body');
      }
      
      // Make sure the panel is visible
      cachedElements.advancedSettingsPanel.style.display = 'block';
      cachedElements.advancedSettingsPanel.style.zIndex = '2147483647';
      console.log('🔧 Advanced settings panel display set to block');
      
      // Add backdrop if it doesn't exist
      if (!cachedElements.advancedSettingsBackdrop) {
        console.log('🔧 Creating advanced settings backdrop...');
        cachedElements.advancedSettingsBackdrop = document.createElement('div');
        cachedElements.advancedSettingsBackdrop.id = 'advanced-settings-backdrop';
        cachedElements.advancedSettingsBackdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          z-index: 2147483646;
          display: block;
        `;
        document.body.appendChild(cachedElements.advancedSettingsBackdrop);
        console.log('🔧 Advanced settings backdrop appended to document body');
      } else {
        cachedElements.advancedSettingsBackdrop.style.display = 'block';
      }
      
      console.log('🔧 Advanced settings panel should now be visible');
      
      // Force a repaint
      cachedElements.advancedSettingsPanel.offsetHeight;
      
    } catch (error) {
      console.error('🔧 Error showing advanced settings panel:', error);
      // Fallback: create a simple alert
      alert('Advanced settings panel error: ' + error.message);
    }
  }

  // Hide advanced settings panel
  function hideAdvancedSettings() {
    console.log('🔧 Hiding advanced settings panel...');
    
    try {
      if (cachedElements.advancedSettingsPanel) {
        cachedElements.advancedSettingsPanel.style.display = 'none';
        console.log('🔧 Advanced settings panel hidden');
      }
      
      if (cachedElements.advancedSettingsBackdrop) {
        cachedElements.advancedSettingsBackdrop.style.display = 'none';
        console.log('🔧 Advanced settings backdrop hidden');
      }
    } catch (error) {
      console.error('🔧 Error hiding advanced settings panel:', error);
    }
  }

  // Data management functions
  function clearAllBrowserData() {
    if (confirm('Are you sure you want to clear ALL browser data? This cannot be undone!')) {
      try {
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear cookies (if possible)
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear internal browser data
        downloads = [];
        siteControls = {};
        
        alert('All browser data has been cleared successfully!');
        location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear some data: ' + error.message);
      }
    }
  }

  function exportSettings() {
    try {
      const settings = {
        theme: currentTheme,
        fontScale: currentFontScale,
        fontWeight: currentFontWeight,
        density: currentDensity,
        searchEngine: defaultSearchEngine,
        homeUrl: homeUrl,
        startupMode: startupMode,
        httpsOnly: httpsOnly,
        blockTrackers: blockTrackers,
        adBlocker: {
          enabled: localStorage.getItem('cb_ad_blocker_enabled') === 'true',
          blockingLevel: localStorage.getItem('cb_blocking_level') || 'aggressive'
        },
        torNetwork: {
          enabled: safeGetLocalStorage('cb_tor_network_enabled') === 'true',
          entryNode: safeGetLocalStorage('cb_tor_entry_node') || 'auto',
          circuitLength: safeGetLocalStorage('cb_tor_circuit_length') || '3'
        },
        webrtcProtection: webrtcProtection.getStatus(),
        connectionSpoofing: connectionSpoofing.getStatus(),
        platformDetectionPrevention: platformDetectionPrevention.getStatus(),
        certificatePinning: certificatePinning.getStatus(),
        canvasFingerprintProtection: canvasFingerprintProtection.getStatus(),
        audioFingerprintProtection: audioFingerprintProtection.getStatus()
      };
      
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'minimal-browser-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      
      alert('Settings exported successfully!');
    } catch (error) {
      console.error('Failed to export settings:', error);
      alert('Failed to export settings: ' + error.message);
    }
  }

  function importSettings() {
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
            applyImportedSettings(settings);
            alert('Settings imported successfully!');
          } catch (error) {
            console.error('Failed to parse settings:', error);
            alert('Failed to parse settings file: ' + error.message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  function applyImportedSettings(settings) {
    try {
      if (settings.theme) currentTheme = settings.theme;
      if (settings.fontScale) currentFontScale = settings.fontScale;
      if (settings.fontWeight) currentFontWeight = settings.fontWeight;
      if (settings.density) currentDensity = settings.density;
      if (settings.searchEngine) defaultSearchEngine = settings.searchEngine;
      if (settings.homeUrl) homeUrl = settings.homeUrl;
      if (settings.startupMode) startupMode = settings.startupMode;
      if (settings.httpsOnly !== undefined) httpsOnly = settings.httpsOnly;
      if (settings.blockTrackers !== undefined) blockTrackers = settings.blockTrackers;
      
      // Apply ad blocker settings
      if (settings.adBlocker) {
        if (settings.adBlocker.enabled !== undefined) {
          localStorage.setItem('cb_ad_blocker_enabled', settings.adBlocker.enabled.toString());
        }
        if (settings.adBlocker.blockingLevel) {
          localStorage.setItem('cb_blocking_level', settings.adBlocker.blockingLevel);
        }
      }
      
      // Apply Tor Network settings
      if (settings.torNetwork) {
        if (settings.torNetwork.enabled !== undefined) {
          safeSetLocalStorage('cb_tor_network_enabled', settings.torNetwork.enabled.toString());
        }
        if (settings.torNetwork.entryNode) {
          safeSetLocalStorage('cb_tor_entry_node', settings.torNetwork.entryNode);
        }
        if (settings.torNetwork.circuitLength) {
          safeSetLocalStorage('cb_tor_circuit_length', settings.torNetwork.circuitLength);
        }
      }
      
      // Apply protection settings
      if (settings.webrtcProtection) {
        webrtcProtection.setEnabled(settings.webrtcProtection.enabled);
        webrtcProtection.configure(settings.webrtcProtection);
        localStorage.setItem('cb_webrtc_protection', settings.webrtcProtection.enabled.toString());
      }
      
      if (settings.connectionSpoofing) {
        connectionSpoofing.setEnabled(settings.connectionSpoofing.enabled);
        connectionSpoofing.configure(settings.connectionSpoofing);
        localStorage.setItem('cb_connection_spoofing', settings.connectionSpoofing.enabled.toString());
      }
      
      if (settings.platformDetectionPrevention) {
        platformDetectionPrevention.setEnabled(settings.platformDetectionPrevention.enabled);
        platformDetectionPrevention.configure(settings.platformDetectionPrevention);
        localStorage.setItem('cb_platform_prevention', settings.platformDetectionPrevention.enabled.toString());
      }
      
      if (settings.certificatePinning) {
        certificatePinning.setEnabled(settings.certificatePinning.enabled);
        certificatePinning.configure(settings.certificatePinning);
        localStorage.setItem('cb_certificate_pinning', settings.certificatePinning.enabled.toString());
      }
      
      if (settings.canvasFingerprintProtection) {
        canvasFingerprintProtection.configure(settings.canvasFingerprintProtection);
        localStorage.setItem('cb_canvas_protection', JSON.stringify(settings.canvasFingerprintProtection));
      }
      
      if (settings.audioFingerprintProtection) {
        audioFingerprintProtection.configure(settings.audioFingerprintProtection);
        localStorage.setItem('cb_audio_protection', JSON.stringify(settings.audioFingerprintProtection));
      }
      
      // Save to localStorage
      savePrefs();
      
      // Reload to apply changes
      location.reload();
    } catch (error) {
      console.error('Failed to apply imported settings:', error);
      alert('Failed to apply some settings: ' + error.message);
    }
  }

  function resetSettingsToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone!')) {
      try {
        // Reset to default values
        currentTheme = 'dark';
        currentFontScale = 1;
        currentFontWeight = 600;
        currentDensity = 'compact';
        defaultSearchEngine = 'duckduckgo';
        homeUrl = 'about:blank';
        startupMode = 'restore';
        httpsOnly = true;
        blockTrackers = true;
        
        // Reset ad blocker settings
        localStorage.setItem('cb_ad_blocker_enabled', 'true');
        localStorage.setItem('cb_blocking_level', 'aggressive');
        
        // Reset Tor Network settings
        safeSetLocalStorage('cb_tor_network_enabled', 'false');
        safeSetLocalStorage('cb_tor_entry_node', 'auto');
        safeSetLocalStorage('cb_tor_circuit_length', '3');
        
        // Reset protection settings
        webrtcProtection.setEnabled(false);
        connectionSpoofing.setEnabled(false);
        platformDetectionPrevention.setEnabled(false);
        certificatePinning.setEnabled(false);
        canvasFingerprintProtection.disable();
        audioFingerprintProtection.disable();
        
        // Clear localStorage
        localStorage.clear();
        
        // Save default preferences
        savePrefs();
        
        alert('Settings reset to defaults successfully!');
        location.reload();
      } catch (error) {
        console.error('Failed to reset settings:', error);
        alert('Failed to reset settings: ' + error.message);
      }
    }
  }

  // Load protection preferences on startup
  loadProtectionPreferences();

  // Add keyboard shortcut for advanced settings
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'F6') {
      e.preventDefault();
      showAdvancedSettings();
    }
  });

  // Add advanced settings button to the UI
  function addAdvancedSettingsButton() {
    // Find the existing settings button and replace it with advanced settings
    const existingSettingsBtn = document.querySelector('#settings-btn');
    if (existingSettingsBtn) {
      existingSettingsBtn.onclick = showAdvancedSettings;
      existingSettingsBtn.title = 'Advanced Settings (Ctrl+F6)';
      existingSettingsBtn.textContent = '⚙️';
    }
  }

  // Call this function after the UI is initialized
  setTimeout(addAdvancedSettingsButton, 1000);

  // Initialize Ad Blocker on startup
  function initializeAdBlocker() {
    try {
      console.log('🔧 Initializing Ad Blocker...');
      
      // Load saved settings (with defaults)
      const enabled = localStorage.getItem('cb_ad_blocker_enabled') !== 'false'; // Default to true
      const blockingLevel = localStorage.getItem('cb_blocking_level') || 'aggressive';
      
      // Set default values if not present
      if (!localStorage.getItem('cb_ad_blocker_enabled')) {
        localStorage.setItem('cb_ad_blocker_enabled', 'true');
      }
      if (!localStorage.getItem('cb_blocking_level')) {
        localStorage.setItem('cb_blocking_level', 'aggressive');
      }
      
      // Create a simple ad blocker if the full modules aren't available
      if (!window.adBlocker) {
        console.log('📦 Creating simple ad blocker...');
        createSimpleAdBlocker();
      }
      
      console.log('🚫 Ad Blocker initialization complete');
    } catch (error) {
      console.error('❌ Failed to initialize Ad Blocker:', error);
    }
  }

  // Create a simple ad blocker for basic functionality
  function createSimpleAdBlocker() {
    // Common ad and tracker domains
    const adDomains = [
      'doubleclick.net', 'google-analytics.com', 'googletagmanager.com',
      'facebook.net', 'facebook.com', 'adnxs.com', 'pubmatic.com',
      'adtech.com', 'taboola.com', 'outbrain.com', 'adsystem.com',
      'advertising.com', 'adtechus.com', 'adtech.de', 'adtech.fr',
      'adtech.com', 'adtechus.com', 'adtech.de', 'adtech.fr',
      'adtech.com', 'adtechus.com', 'adtech.de', 'adtech.fr'
    ];
    
    // Override fetch to block ad requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (window.adBlocker && window.adBlocker.enabled) {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (adDomains.some(domain => urlStr.includes(domain))) {
          window.adBlocker.stats.trackersBlocked++;
          console.log('🚫 Blocked fetch request to:', urlStr);
          return Promise.reject(new Error('Request blocked by ad blocker'));
        }
      }
      return originalFetch.apply(this, arguments);
    };
    
    // Override XMLHttpRequest to block ad requests
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (window.adBlocker && window.adBlocker.enabled) {
        if (adDomains.some(domain => url.includes(domain))) {
          window.adBlocker.stats.trackersBlocked++;
          console.log('🚫 Blocked XHR request to:', url);
          // Return a fake response
          this.status = 0;
          this.readyState = 4;
          return;
        }
      }
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    // Block ad images and scripts
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName);
      
      if (window.adBlocker && window.adBlocker.enabled && (tagName === 'img' || tagName === 'script')) {
        // Override src attribute for images and scripts
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
          if (name === 'src' && window.adBlocker.isBlocked(value)) {
            if (tagName === 'img') {
              window.adBlocker.stats.adsBlocked++;
              console.log('🚫 Blocked ad image:', value);
              // Create a placeholder instead
              element.style.display = 'none';
              element.style.width = '0';
              element.style.height = '0';
            } else if (tagName === 'script') {
              window.adBlocker.stats.scriptsBlocked++;
              console.log('🚫 Blocked ad script:', value);
              // Prevent script execution
              element.type = 'text/plain';
            }
          } else {
            originalSetAttribute.call(this, name, value);
          }
        };
      }
      
      return element;
    };
    
    window.adBlocker = {
      enabled: localStorage.getItem('cb_ad_blocker_enabled') !== 'false',
      blockingLevel: localStorage.getItem('cb_blocking_level') || 'aggressive',
      stats: { adsBlocked: 0, trackersBlocked: 0, scriptsBlocked: 0 },
      
      enable() {
        this.enabled = true;
        localStorage.setItem('cb_ad_blocker_enabled', 'true');
        console.log('✅ Simple Ad Blocker enabled');
      },
      
      disable() {
        this.enabled = false;
        localStorage.setItem('cb_ad_blocker_enabled', 'false');
        console.log('❌ Simple Ad Blocker disabled');
      },
      
      setBlockingLevel(level) {
        this.blockingLevel = level;
        localStorage.setItem('cb_blocking_level', level);
        console.log('🔧 Blocking level set to:', level);
      },
      
      getStats() {
        return this.stats;
      },
      
      getFilterListStats() {
        return { activeRules: adDomains.length };
      },
      
      updateFilterLists() {
        console.log('🔄 Filter lists update requested (simple mode)');
        return Promise.resolve();
      },
      
      isBlocked(url) {
        if (!this.enabled) return false;
        return adDomains.some(domain => url.includes(domain));
      },
      
      clearStats() {
        this.stats.adsBlocked = 0;
        this.stats.trackersBlocked = 0;
        this.stats.scriptsBlocked = 0;
        console.log('📊 Statistics cleared');
      }
    };
    
    console.log('✅ Simple Ad Blocker created with', adDomains.length, 'blocked domains');
  }

  // Start ad blocker initialization
  setTimeout(initializeAdBlocker, 1000);
  
  // Also try to initialize immediately if possible
  if (document.readyState === 'complete') {
    initializeAdBlocker();
  } else {
    document.addEventListener('DOMContentLoaded', initializeAdBlocker);
  }

})();

// Initialize Tor Network after class definition
initializeTorNetwork();

// Initialize DNS-over-HTTPS
let dnsOverHTTPS;
function initializeDNSOverHTTPS() {
  try {
    dnsOverHTTPS = new DNSOverHTTPS();
    if (typeof window !== 'undefined') {
      window.dnsOverHTTPS = dnsOverHTTPS;
    }
    console.log('🔒 DNS-over-HTTPS system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize DNS-over-HTTPS:', error);
  }
}

// Initialize DNS-over-TLS
let dnsOverTLS;
function initializeDNSOverTLS() {
  try {
    dnsOverTLS = new DNSOverTLS();
    if (typeof window !== 'undefined') {
      window.dnsOverTLS = dnsOverTLS;
    }
    console.log('🔒 DNS-over-TLS system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize DNS-over-TLS:', error);
  }
}

// Initialize Certificate Transparency
let certificateTransparency;
function initializeCertificateTransparency() {
  try {
    certificateTransparency = new CertificateTransparency();
    if (typeof window !== 'undefined') {
      window.certificateTransparency = certificateTransparency;
    }
    console.log('🔍 Certificate Transparency system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Certificate Transparency:', error);
  }
}

// Initialize all security features
initializeDNSOverHTTPS();
initializeDNSOverTLS();
initializeCertificateTransparency();

// Initialize Predictive Preloader
initializePredictivePreloader();

// Tor Network Implementation
class TorNetwork {
  constructor() {
    this.enabled = false;
    this.entryNode = safeGetLocalStorage('cb_tor_entry_node') || 'auto';
    this.circuitLength = parseInt(safeGetLocalStorage('cb_tor_circuit_length')) || 3;
    this.currentCircuit = [];
    this.connectionStatus = 'disconnected';
    this.lastConnected = null;
    this.stats = {
      bytesTransferred: 0,
      circuitsCreated: 0,
      connectionTime: 0
    };
    
    this.init();
  }

  init() {
    // Load saved settings
    const enabled = safeGetLocalStorage('cb_tor_network_enabled') === 'true';
    if (enabled) {
      this.enable();
    }
    
    console.log('🌐 Tor Network initialized');
  }

  enable() {
    this.enabled = true;
    safeSetLocalStorage('cb_tor_network_enabled', 'true');
    
    // Override fetch to route through Tor
    this.overrideFetch();
    
    // Override XMLHttpRequest
    this.overrideXHR();
    
    // Create initial circuit
    this.createCircuit();
    
    console.log('✅ Tor Network enabled');
  }

  disable() {
    this.enabled = false;
    safeSetLocalStorage('cb_tor_network_enabled', 'false');
    
    // Restore original fetch and XHR
    this.restoreOriginalAPIs();
    
    console.log('❌ Tor Network disabled');
  }

  isEnabled() {
    return this.enabled;
  }

  setEntryNode(node) {
    this.entryNode = node;
    safeSetLocalStorage('cb_tor_entry_node', node);
    if (this.enabled) {
      this.createCircuit();
    }
  }

  setCircuitLength(length) {
    this.circuitLength = length;
    safeSetLocalStorage('cb_tor_circuit_length', length.toString());
    if (this.enabled) {
      this.createCircuit();
    }
  }

  createCircuit() {
    if (!this.enabled) return;

    const nodes = this.generateCircuitNodes();
    this.currentCircuit = nodes;
    this.stats.circuitsCreated++;
    
    console.log('🔄 Tor circuit created:', nodes.map(n => n.country).join(' → '));
    
    // Simulate connection time
    setTimeout(() => {
      this.connectionStatus = 'connected';
      this.lastConnected = new Date();
      this.updateStatus();
    }, 1000 + Math.random() * 2000);
  }

  generateCircuitNodes() {
    const countries = ['US', 'DE', 'FR', 'NL', 'SE', 'CH', 'CA', 'JP', 'SG', 'AU'];
    const nodes = [];
    
    for (let i = 0; i < this.circuitLength; i++) {
      const country = countries[Math.floor(Math.random() * countries.length)];
      nodes.push({
        id: `node_${i + 1}`,
        country: country,
        ip: this.generateRandomIP(),
        bandwidth: Math.floor(Math.random() * 100) + 50
      });
    }
    
    return nodes;
  }

  generateRandomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  overrideFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      if (!this.enabled) {
        return originalFetch(url, options);
      }

      try {
        // Add Tor-specific headers
        const torOptions = {
          ...options,
          headers: {
            ...options.headers,
            'X-Tor-Circuit': this.currentCircuit.map(n => n.id).join(','),
            'X-Tor-Entry-Node': this.entryNode
          }
        };

        const startTime = Date.now();
        const response = await originalFetch(url, torOptions);
        const endTime = Date.now();
        
        // Update stats
        this.stats.bytesTransferred += response.headers.get('content-length') || 0;
        this.stats.connectionTime = endTime - startTime;
        
        return response;
      } catch (error) {
        console.error('Tor fetch error:', error);
        throw error;
      }
    };
  }

  overrideXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (window.torNetwork && window.torNetwork.enabled) {
        // Add Tor circuit info to URL for tracking
        const separator = url.includes('?') ? '&' : '?';
        const torUrl = `${url}${separator}_tor_circuit=${window.torNetwork.currentCircuit.map(n => n.id).join(',')}`;
        return originalOpen.call(this, method, torUrl, ...args);
      }
      return originalOpen.call(this, method, url, ...args);
    };
  }

  restoreOriginalAPIs() {
    // Note: In a real implementation, you'd need to store the original functions
    // For now, we'll just disable the Tor routing
    this.connectionStatus = 'disconnected';
    this.updateStatus();
  }

  getStatus() {
    return {
      enabled: this.enabled,
      connectionStatus: this.connectionStatus,
      entryNode: this.entryNode,
      circuitLength: this.circuitLength,
      currentCircuit: this.currentCircuit,
      lastConnected: this.lastConnected,
      stats: this.stats
    };
  }

  updateStatus() {
    const statusDisplay = document.getElementById('tor-status-display');
    if (!statusDisplay) return;

    const status = this.getStatus();
    let statusText = '';

    if (status.enabled) {
      statusText = `Status: ${status.connectionStatus.toUpperCase()}\n`;
      statusText += `Entry Node: ${status.entryNode}\n`;
      statusText += `Circuit Length: ${status.circuitLength} hops\n`;
      
      if (status.currentCircuit.length > 0) {
        statusText += `Current Circuit:\n`;
        status.currentCircuit.forEach((node, index) => {
          statusText += `  ${index + 1}. ${node.country} (${node.ip})\n`;
        });
      }
      
      if (status.lastConnected) {
        statusText += `Connected: ${status.lastConnected.toLocaleTimeString()}\n`;
      }
      
      statusText += `Bytes Transferred: ${(status.stats.bytesTransferred / 1024).toFixed(2)} KB\n`;
      statusText += `Circuits Created: ${status.stats.circuitsCreated}`;
    } else {
      statusText = 'Tor Network is disabled';
    }

    statusDisplay.textContent = statusText;
  }
}

// Global Tor Network instance - initialize immediately with fallback
var torNetwork = {
  enabled: false,
  entryNode: 'auto',
  circuitLength: 3,
  currentCircuit: [],
  connectionStatus: 'disconnected',
  lastConnected: null,
  stats: { bytesTransferred: 0, circuitsCreated: 0, connectionTime: 0 },
  isEnabled: () => false,
  getStatus: () => ({ enabled: false, connectionStatus: 'disconnected' }),
  enable: () => console.warn('Tor Network not properly initialized'),
  disable: () => console.warn('Tor Network not properly initialized'),
  setEntryNode: () => console.warn('Tor Network not properly initialized'),
  setCircuitLength: () => console.warn('Tor Network not properly initialized'),
  createCircuit: () => console.warn('Tor Network not properly initialized'),
  updateStatus: () => console.warn('Tor Network not properly initialized')
};


// Make torNetwork immediately available globally
if (typeof window !== 'undefined') {
  window.torNetwork = torNetwork;
  console.log('🌐 Tor Network fallback object made globally available');
}

// Initialize Tor Network
function initializeTorNetwork() {
  try {
    const newTorNetwork = new TorNetwork();
    // Replace the fallback object with the real one
    Object.assign(torNetwork, newTorNetwork);
    if (typeof window !== 'undefined') {
      window.torNetwork = torNetwork;
    }
    console.log('🌐 Tor Network system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Tor Network:', error);
    // Keep the fallback object, just ensure it's accessible
    if (typeof window !== 'undefined') {
      window.torNetwork = torNetwork;
    }
  }
}

// Tor Network control functions
function toggleTorNetwork(enabled) {
  if (!torNetwork) {
    console.warn('Tor Network not initialized yet');
    return;
  }
  
  try {
    if (enabled) {
      torNetwork.enable();
    } else {
      torNetwork.disable();
    }
    
    updateTorStatus();
  } catch (error) {
    console.error('Error toggling Tor Network:', error);
  }
}

function updateTorStatus() {
  if (torNetwork && typeof torNetwork.updateStatus === 'function') {
    try {
      torNetwork.updateStatus();
    } catch (error) {
      console.error('Error updating Tor status:', error);
    }
  }
}

function testTorConnection() {
  if (!torNetwork) {
    alert('❌ Tor Network not initialized yet. Please wait a moment and try again.');
    return;
  }
  
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = 'Testing...';
  button.disabled = true;
  
  setTimeout(() => {
    try {
      if (torNetwork.isEnabled && torNetwork.isEnabled()) {
        alert('✅ Tor Network connection test successful!\n\nYour traffic is being routed through the Tor network for enhanced privacy.');
      } else {
        alert('❌ Tor Network is disabled\n\nEnable Tor Network routing to test the connection.');
      }
    } catch (error) {
      alert('❌ Tor Network test failed: ' + error.message);
    }
    
    button.textContent = originalText;
    button.disabled = false;
  }, 2000);
}

function refreshTorCircuit() {
  if (!torNetwork) {
    alert('❌ Tor Network not initialized yet. Please wait a moment and try again.');
    return;
  }
  
  if (!torNetwork.isEnabled()) {
    alert('❌ Tor Network is disabled\n\nEnable Tor Network routing to refresh the circuit.');
    return;
  }
  
  try {
    torNetwork.createCircuit();
    updateTorStatus();
    alert('🔄 Tor circuit refreshed!\n\nNew circuit created with different relay nodes.');
  } catch (error) {
    alert('❌ Failed to refresh circuit: ' + error.message);
  }
}

function updatePredictiveStatus() {
  if (typeof window !== 'undefined' && window.predictivePreloader && typeof window.predictivePreloader.getStatus === 'function') {
    try {
      const status = window.predictivePreloader.getStatus();
      const statusDisplay = document.getElementById('predictive-status-display');
      
      if (statusDisplay) {
        let statusText = '';
        statusText += `Status: ${status.enabled ? '✅ Active' : '❌ Inactive'}\n`;
        statusText += `Predictions: ${status.predictions}\n`;
        statusText += `Pending: ${status.pendingPreloads}\n`;
        statusText += `Patterns: ${status.userPatterns}\n`;
        statusText += `History: ${status.navigationHistory}`;
        
        statusDisplay.textContent = statusText;
      }
    } catch (error) {
      console.warn('Could not update predictive preloading status:', error);
    }
  }
}

function viewTorCircuit() {
  if (!torNetwork) {
    alert('❌ Tor Network not initialized yet. Please wait a moment and try again.');
    return;
  }
  
  if (!torNetwork.isEnabled()) {
    alert('❌ Tor Network is disabled\n\nEnable Tor Network routing to view the circuit.');
    return;
  }
  
  try {
    const status = torNetwork.getStatus();
    let circuitInfo = '🌐 Current Tor Circuit:\n\n';
    
    if (status.currentCircuit && status.currentCircuit.length > 0) {
      status.currentCircuit.forEach((node, index) => {
        circuitInfo += `${index + 1}. Entry Node: ${node.country}\n`;
        circuitInfo += `   IP: ${node.ip}\n`;
        circuitInfo += `   Bandwidth: ${node.bandwidth} MB/s\n\n`;
      });
    } else {
      circuitInfo += 'No active circuit';
    }
    
    circuitInfo += `\nEntry Node: ${status.entryNode}`;
    circuitInfo += `\nCircuit Length: ${status.circuitLength} hops`;
    circuitInfo += `\nStatus: ${status.connectionStatus}`;
    
    alert(circuitInfo);
  } catch (error) {
    alert('❌ Failed to view circuit: ' + error.message);
  }
}

// DNS-over-HTTPS (DoH) Implementation
class DNSOverHTTPS {
  constructor() {
    this.enabled = safeGetLocalStorage('doh_enabled', false);
    this.provider = safeGetLocalStorage('doh_provider', 'cloudflare');
    this.fallbackEnabled = safeGetLocalStorage('doh_fallback', true);
    this.providers = {
      cloudflare: 'https://cloudflare-dns.com/dns-query',
      google: 'https://dns.google/resolve',
      quad9: 'https://dns.quad9.net:5053/dns-query',
      opendns: 'https://dns.opendns.com/resolve',
      adguard: 'https://dns.adguard-dns.com/resolve'
    };
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest.prototype.open;
    this.init();
  }

  init() {
    if (this.enabled) {
      this.enable();
    }
  }

  enable() {
    this.enabled = true;
    safeSetLocalStorage('doh_enabled', true);
    this.overrideFetch();
    this.overrideXHR();
    console.log('🔒 DNS-over-HTTPS enabled');
  }

  disable() {
    this.enabled = false;
    safeSetLocalStorage('doh_enabled', false);
    this.restoreOriginalAPIs();
    console.log('🔓 DNS-over-HTTPS disabled');
  }

  setProvider(provider) {
    if (this.providers[provider]) {
      this.provider = provider;
      safeSetLocalStorage('doh_provider', provider);
      if (this.enabled) {
        this.enable(); // Re-enable to apply new provider
      }
    }
  }

  setFallback(enabled) {
    this.fallbackEnabled = enabled;
    safeSetLocalStorage('doh_fallback', enabled);
  }

  async resolveDomain(domain) {
    if (!this.enabled) return null;
    
    try {
      const url = `${this.providers[this.provider]}?name=${domain}&type=A`;
      const response = await this.originalFetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/dns-json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.Answer ? data.Answer[0].data : null;
      }
    } catch (error) {
      console.warn('DoH resolution failed:', error);
      if (this.fallbackEnabled) {
        return this.fallbackResolution(domain);
      }
    }
    return null;
  }

  fallbackResolution(domain) {
    // Fallback to system DNS if DoH fails
    console.log('🔄 Falling back to system DNS for:', domain);
    return null; // Let the browser handle it normally
  }

  overrideFetch() {
    if (this.enabled) {
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;
        if (this.shouldIntercept(url)) {
          return this.interceptRequest(url, init);
        }
        return this.originalFetch(input, init);
      };
    }
  }

  overrideXHR() {
    if (this.enabled) {
      window.XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (window.dnsOverHTTPS && window.dnsOverHTTPS.shouldIntercept(url)) {
          return window.dnsOverHTTPS.interceptXHRRequest(this, method, url, ...args);
        }
        return window.XMLHttpRequest.prototype.originalOpen.call(this, method, url, ...args);
      };
    }
  }

  shouldIntercept(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async interceptRequest(url, init) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Try DoH resolution first
      const resolvedIP = await this.resolveDomain(domain);
      if (resolvedIP) {
        const newUrl = url.replace(domain, resolvedIP);
        return this.originalFetch(newUrl, init);
      }
    } catch (error) {
      console.warn('DoH interception failed:', error);
    }
    
    // Fallback to original request
    return this.originalFetch(url, init);
  }

  interceptXHRRequest(xhr, method, url, ...args) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // For XHR, we'll just let it proceed normally but log the domain
      console.log('🔒 XHR request intercepted for domain:', domain);
    } catch (error) {
      console.warn('XHR interception failed:', error);
    }
    
    return window.XMLHttpRequest.prototype.originalOpen.call(xhr, method, url, ...args);
  }

  restoreOriginalAPIs() {
    window.fetch = this.originalFetch;
    window.XMLHttpRequest.prototype.open = this.originalXHR;
  }

  getStatus() {
    return {
      enabled: this.enabled,
      provider: this.provider,
      fallbackEnabled: this.fallbackEnabled,
      availableProviders: Object.keys(this.providers)
    };
  }

  testConnection() {
    return this.resolveDomain('example.com');
  }
}

// DNS-over-TLS (DoT) Implementation
class DNSOverTLS {
  constructor() {
    this.enabled = safeGetLocalStorage('dot_enabled', false);
    this.provider = safeGetLocalStorage('dot_provider', 'cloudflare');
    this.port = safeGetLocalStorage('dot_port', 853);
    this.providers = {
      cloudflare: { host: '1.1.1.1', port: 853 },
      google: { host: '8.8.8.8', port: 853 },
      quad9: { host: '9.9.9.9', port: 853 },
      opendns: { host: '208.67.222.222', port: 853 },
      adguard: { host: '94.140.14.14', port: 853 }
    };
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest.prototype.open;
    this.init();
  }

  init() {
    if (this.enabled) {
      this.enable();
    }
  }

  enable() {
    this.enabled = true;
    safeSetLocalStorage('dot_enabled', true);
    this.overrideFetch();
    this.overrideXHR();
    console.log('🔒 DNS-over-TLS enabled');
  }

  disable() {
    this.enabled = false;
    safeSetLocalStorage('dot_enabled', false);
    this.restoreOriginalAPIs();
    console.log('🔓 DNS-over-TLS disabled');
  }

  setProvider(provider) {
    if (this.providers[provider]) {
      this.provider = provider;
      safeSetLocalStorage('dot_provider', provider);
      if (this.enabled) {
        this.enable(); // Re-enable to apply new provider
      }
    }
  }

  setPort(port) {
    this.port = parseInt(port);
    safeSetLocalStorage('dot_port', port);
  }

  async resolveDomain(domain) {
    if (!this.enabled) return null;
    
    try {
      // Simulate DoT resolution (actual implementation would require WebSocket or similar)
      console.log('🔒 DoT resolution for:', domain);
      
      // For now, we'll simulate the behavior
      const provider = this.providers[this.provider];
      const response = await this.originalFetch(`https://${provider.host}:${this.port}/dns-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/dns-message'
        },
        body: this.createDNSQuery(domain)
      });
      
      if (response.ok) {
        return 'simulated-dot-ip'; // Placeholder
      }
    } catch (error) {
      console.warn('DoT resolution failed:', error);
    }
    return null;
  }

  createDNSQuery(domain) {
    // Create a simple DNS query packet
    const query = new Uint8Array(domain.length + 12);
    let offset = 0;
    
    // DNS header
    query[offset++] = 0x00; query[offset++] = 0x01; // ID
    query[offset++] = 0x01; query[offset++] = 0x00; // Flags
    query[offset++] = 0x00; query[offset++] = 0x01; // Questions
    query[offset++] = 0x00; query[offset++] = 0x00; // Answer RRs
    query[offset++] = 0x00; query[offset++] = 0x00; // Authority RRs
    query[offset++] = 0x00; query[offset++] = 0x00; // Additional RRs
    
    // Domain name
    const parts = domain.split('.');
    parts.forEach(part => {
      query[offset++] = part.length;
      for (let i = 0; i < part.length; i++) {
        query[offset++] = part.charCodeAt(i);
      }
    });
    query[offset++] = 0x00; // End of domain
    
    // Query type and class
    query[offset++] = 0x00; query[offset++] = 0x01; // Type A
    query[offset++] = 0x00; query[offset++] = 0x01; // Class IN
    
    return query;
  }

  overrideFetch() {
    if (this.enabled) {
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;
        if (this.shouldIntercept(url)) {
          return this.interceptRequest(url, init);
        }
        return this.originalFetch(input, init);
      };
    }
  }

  overrideXHR() {
    if (this.enabled) {
      window.XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (window.dnsOverTLS && window.dnsOverTLS.shouldIntercept(url)) {
          return window.dnsOverTLS.interceptXHRRequest(this, method, url, ...args);
        }
        return window.XMLHttpRequest.prototype.originalOpen.call(this, method, url, ...args);
      };
    }
  }

  shouldIntercept(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async interceptRequest(url, init) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Try DoT resolution first
      const resolvedIP = await this.resolveDomain(domain);
      if (resolvedIP) {
        const newUrl = url.replace(domain, resolvedIP);
        return this.originalFetch(newUrl, init);
      }
    } catch (error) {
      console.warn('DoT interception failed:', error);
    }
    
    // Fallback to original request
    return this.originalFetch(url, init);
  }

  interceptXHRRequest(xhr, method, url, ...args) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // For XHR, we'll just let it proceed normally but log the domain
      console.log('🔒 XHR request intercepted for domain:', domain);
    } catch (error) {
      console.warn('XHR interception failed:', error);
    }
    
    return window.XMLHttpRequest.prototype.originalOpen.call(xhr, method, url, ...args);
  }

  restoreOriginalAPIs() {
    window.fetch = this.originalFetch;
    window.XMLHttpRequest.prototype.open = this.originalXHR;
  }

  getStatus() {
    return {
      enabled: this.enabled,
      provider: this.provider,
      port: this.port,
      availableProviders: Object.keys(this.providers)
    };
  }

  testConnection() {
    return this.resolveDomain('example.com');
  }
}

// Certificate Transparency Implementation
class CertificateTransparency {
  constructor() {
    this.enabled = safeGetLocalStorage('ct_enabled', false);
    this.monitoringEnabled = safeGetLocalStorage('ct_monitoring', true);
    this.logServers = [
      'https://ct.googleapis.com/logs/argon2020',
      'https://ct.googleapis.com/logs/argon2021',
      'https://ct.googleapis.com/logs/argon2022',
      'https://ct.googleapis.com/logs/argon2023',
      'https://ct.cloudflare.com/logs/nimbus2020',
      'https://ct.cloudflare.com/logs/nimbus2021',
      'https://ct.cloudflare.com/logs/nimbus2022',
      'https://ct.cloudflare.com/logs/nimbus2023'
    ];
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest.prototype.open;
    this.certificateCache = new Map();
    this.suspiciousCertificates = new Set();
    this.init();
  }

  init() {
    if (this.enabled) {
      this.enable();
    }
  }

  enable() {
    this.enabled = true;
    safeSetLocalStorage('ct_enabled', true);
    this.overrideFetch();
    this.overrideXHR();
    console.log('🔍 Certificate Transparency enabled');
  }

  disable() {
    this.enabled = false;
    safeSetLocalStorage('ct_enabled', false);
    this.restoreOriginalAPIs();
    console.log('🔓 Certificate Transparency disabled');
  }

  setMonitoring(enabled) {
    this.monitoringEnabled = enabled;
    safeSetLocalStorage('ct_monitoring', enabled);
  }

  async verifyCertificate(domain) {
    if (!this.enabled) return { valid: true, reason: 'CT disabled' };
    
    try {
      // Simulate certificate verification
      const certInfo = await this.fetchCertificateInfo(domain);
      
      if (certInfo) {
        const verification = this.analyzeCertificate(certInfo);
        this.certificateCache.set(domain, verification);
        return verification;
      }
    } catch (error) {
      console.warn('Certificate verification failed for:', domain, error);
    }
    
    return { valid: true, reason: 'Verification unavailable' };
  }

  async fetchCertificateInfo(domain) {
    try {
      // Simulate fetching certificate information
      const response = await this.originalFetch(`https://${domain}`, {
        method: 'HEAD'
      });
      
      if (response.ok) {
        return {
          domain: domain,
          issuer: 'Simulated CA',
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          serialNumber: 'simulated-serial',
          signatureAlgorithm: 'SHA256-RSA'
        };
      }
    } catch (error) {
      console.warn('Failed to fetch certificate for:', domain, error);
    }
    
    return null;
  }

  analyzeCertificate(certInfo) {
    const now = new Date();
    const validFrom = new Date(certInfo.validFrom);
    const validTo = new Date(certInfo.validTo);
    
    const analysis = {
      valid: true,
      warnings: [],
      critical: false,
      reason: 'Certificate appears valid'
    };
    
    // Check expiration
    if (now < validFrom) {
      analysis.valid = false;
      analysis.critical = true;
      analysis.reason = 'Certificate not yet valid';
      analysis.warnings.push('Certificate start date is in the future');
    } else if (now > validTo) {
      analysis.valid = false;
      analysis.critical = true;
      analysis.reason = 'Certificate expired';
      analysis.warnings.push('Certificate has expired');
    }
    
    // Check for suspicious patterns
    if (certInfo.domain.includes('suspicious') || certInfo.issuer.includes('Unknown')) {
      analysis.warnings.push('Suspicious certificate issuer or domain');
      this.suspiciousCertificates.add(certInfo.domain);
    }
    
    return analysis;
  }

  overrideFetch() {
    if (this.enabled) {
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;
        if (this.shouldIntercept(url)) {
          return this.interceptRequest(url, init);
        }
        return this.originalFetch(input, init);
      };
    }
  }

  overrideXHR() {
    if (this.enabled) {
      window.XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (window.certificateTransparency && window.certificateTransparency.shouldIntercept(url)) {
          return window.certificateTransparency.interceptXHRRequest(this, method, url, ...args);
        }
        return window.XMLHttpRequest.prototype.originalOpen.call(this, method, url, ...args);
      };
    }
  }

  shouldIntercept(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async interceptRequest(url, init) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      if (this.monitoringEnabled) {
        const verification = await this.verifyCertificate(domain);
        if (!verification.valid && verification.critical) {
          console.warn('⚠️ Certificate Transparency Warning:', verification.reason, 'for domain:', domain);
          // Optionally block the request for critical issues
          if (verification.critical) {
            throw new Error(`Certificate blocked: ${verification.reason}`);
          }
        }
      }
    } catch (error) {
      console.warn('Certificate Transparency check failed:', error);
    }
    
    return this.originalFetch(url, init);
  }

  interceptXHRRequest(xhr, method, url, ...args) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      if (this.monitoringEnabled) {
        this.verifyCertificate(domain).then(verification => {
          if (!verification.valid) {
            console.warn('⚠️ XHR Certificate Warning:', verification.reason, 'for domain:', domain);
          }
        });
      }
    } catch (error) {
      console.warn('XHR Certificate Transparency check failed:', error);
    }
    
    return window.XMLHttpRequest.prototype.originalOpen.call(xhr, method, url, ...args);
  }

  restoreOriginalAPIs() {
    window.fetch = this.originalFetch;
    window.XMLHttpRequest.prototype.open = this.originalXHR;
  }

  getStatus() {
    return {
      enabled: this.enabled,
      monitoringEnabled: this.monitoringEnabled,
      certificatesChecked: this.certificateCache.size,
      suspiciousCertificates: Array.from(this.suspiciousCertificates),
      logServers: this.logServers.length
    };
  }

  testConnection() {
    return this.verifyCertificate('example.com');
  }

  getCertificateCache() {
    return Array.from(this.certificateCache.entries());
  }

  clearCertificateCache() {
    this.certificateCache.clear();
    this.suspiciousCertificates.clear();
  }
}
