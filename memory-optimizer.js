import { FONT_STACK } from './config.js';

// Memory Optimization Module for Reduced Memory Footprint
export class MemoryOptimizer {
  constructor() {
    this.isInitialized = false;
    this.memoryThresholds = {
      critical: 50 * 1024 * 1024,    // 50MB
      warning: 100 * 1024 * 1024,    // 100MB
      normal: 200 * 1024 * 1024      // 200MB
    };
    
    this.optimizationStrategies = {
      aggressive: {
        gcInterval: 1000,           // 1 second
        memoryCheckInterval: 500,   // 500ms
        cleanupThreshold: 0.7       // 70% memory usage
      },
      balanced: {
        gcInterval: 5000,           // 5 seconds
        memoryCheckInterval: 2000,  // 2 seconds
        cleanupThreshold: 0.8       // 80% memory usage
      },
      conservative: {
        gcInterval: 10000,          // 10 seconds
        memoryCheckInterval: 5000,  // 5 seconds
        cleanupThreshold: 0.9       // 90% memory usage
      }
    };
    
    this.currentStrategy = 'balanced';
    this.memoryUsage = {
      current: 0,
      peak: 0,
      average: 0,
      samples: []
    };
    
    this.cleanupTasks = new Map();
    this.weakReferences = new WeakMap();
    this.objectPools = new Map();
    
    this.init();
  }
  
  // Initialize memory optimizer
  init() {
    try {
      // Check if performance.memory is available
      if (performance.memory) {
        this.memoryUsage.current = performance.memory.usedJSHeapSize;
        this.memoryUsage.peak = performance.memory.usedJSHeapSize;
      }
      
      // Start memory monitoring
      this.startMemoryMonitoring();
      
      // Start garbage collection optimization
      this.startGCOptimization();
      
      // Initialize object pools
      this.initializeObjectPools();
      
      this.isInitialized = true;
      console.log('Memory optimizer initialized successfully');
      
    } catch (error) {
      console.warn('Failed to initialize memory optimizer:', error);
    }
  }
  
  // Start memory usage monitoring
  startMemoryMonitoring() {
    const checkMemory = () => {
      if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        
        this.memoryUsage.current = used;
        this.memoryUsage.peak = Math.max(this.memoryUsage.peak, used);
        
        // Add to samples for average calculation
        this.memoryUsage.samples.push(used);
        if (this.memoryUsage.samples.length > 100) {
          this.memoryUsage.samples.shift();
        }
        
        this.memoryUsage.average = this.memoryUsage.samples.reduce((a, b) => a + b, 0) / this.memoryUsage.samples.length;
        
        // Check if memory usage exceeds thresholds
        this.checkMemoryThresholds(used, total);
      }
    };
    
    // Check memory immediately
    checkMemory();
    
    // Set up periodic checking
    const strategy = this.optimizationStrategies[this.currentStrategy];
    setInterval(checkMemory, strategy.memoryCheckInterval);
  }
  
  // Check memory thresholds and trigger optimizations
  checkMemoryThresholds(used, total) {
    const usageRatio = used / total;
    const strategy = this.optimizationStrategies[this.currentStrategy];
    
    if (usageRatio > strategy.cleanupThreshold) {
      console.warn(`Memory usage high (${(usageRatio * 100).toFixed(1)}%), triggering cleanup`);
      this.triggerMemoryCleanup();
    }
    
    if (used > this.memoryThresholds.critical) {
      console.error(`Critical memory usage: ${(used / 1024 / 1024).toFixed(1)}MB`);
      this.emergencyCleanup();
    } else if (used > this.memoryThresholds.warning) {
      console.warn(`High memory usage: ${(used / 1024 / 1024).toFixed(1)}MB`);
      this.aggressiveCleanup();
    }
  }
  
  // Start garbage collection optimization
  startGCOptimization() {
    const strategy = this.optimizationStrategies[this.currentStrategy];
    
    // Periodic garbage collection hints
    setInterval(() => {
      if (this.shouldTriggerGC()) {
        this.suggestGC();
      }
    }, strategy.gcInterval);
    
    // Monitor for memory pressure
    if ('memory' in performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.includes('memory')) {
            this.handleMemoryPressure(entry);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['measure'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }
  
  // Check if garbage collection should be triggered
  shouldTriggerGC() {
    if (!performance.memory) return false;
    
    const used = performance.memory.usedJSHeapSize;
    const total = performance.memory.totalJSHeapSize;
    const ratio = used / total;
    
    return ratio > 0.8; // Trigger GC if memory usage > 80%
  }
  
  // Suggest garbage collection
  suggestGC() {
    try {
      // Use different GC strategies based on browser support
      if (window.gc) {
        // Chrome with --js-flags="--expose-gc"
        window.gc();
      } else if (window.performance && window.performance.memory) {
        // Force memory cleanup by creating and dropping large objects
        this.forceMemoryCleanup();
      }
    } catch (error) {
      console.warn('Failed to trigger garbage collection:', error);
    }
  }
  
  // Force memory cleanup by manipulating memory pressure
  forceMemoryCleanup() {
    // Create temporary large objects to trigger GC
    const tempArrays = [];
    for (let i = 0; i < 10; i++) {
      tempArrays.push(new Array(100000).fill(0));
    }
    
    // Clear references immediately
    tempArrays.length = 0;
    
    // Force a small delay to allow GC to run
    setTimeout(() => {
      // This timeout allows the GC to potentially run
    }, 100);
  }
  
  // Initialize object pools for frequently created/destroyed objects
  initializeObjectPools() {
    // DOM element pool
    this.objectPools.set('domElements', {
      pool: [],
      maxSize: 100,
      create: () => document.createElement('div'),
      reset: (element) => {
        element.innerHTML = '';
        element.className = '';
        element.style.cssText = '';
        element.removeAttribute('id');
        return element;
      }
    });
    
    // Array pool
    this.objectPools.set('arrays', {
      pool: [],
      maxSize: 200,
      create: () => [],
      reset: (array) => {
        array.length = 0;
        return array;
      }
    });
    
    // Object pool
    this.objectPools.set('objects', {
      pool: [],
      maxSize: 150,
      create: () => ({}),
      reset: (obj) => {
        for (const key in obj) {
          delete obj[key];
        }
        return obj;
      }
    });
  }
  
  // Get object from pool
  getFromPool(type) {
    const pool = this.objectPools.get(type);
    if (!pool) return null;
    
    if (pool.pool.length > 0) {
      const obj = pool.pool.pop();
      return pool.reset(obj);
    }
    
    return pool.create();
  }
  
  // Return object to pool
  returnToPool(type, obj) {
    const pool = this.objectPools.get(type);
    if (!pool || !obj) return;
    
    if (pool.pool.length < pool.maxSize) {
      pool.pool.push(obj);
    }
  }
  
  // Create weak reference for memory-efficient caching
  createWeakReference(key, value) {
    this.weakReferences.set(key, value);
  }
  
  // Get weak reference
  getWeakReference(key) {
    return this.weakReferences.get(key);
  }
  
  // Register cleanup task
  registerCleanupTask(id, task, priority = 'normal') {
    this.cleanupTasks.set(id, { task, priority, timestamp: Date.now() });
  }
  
  // Unregister cleanup task
  unregisterCleanupTask(id) {
    this.cleanupTasks.delete(id);
  }
  
  // Trigger memory cleanup
  triggerMemoryCleanup() {
    const tasks = Array.from(this.cleanupTasks.values())
      .sort((a, b) => {
        // Sort by priority and timestamp
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });
    
    // Execute cleanup tasks
    for (const { task } of tasks) {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    }
    
    // Clear completed tasks
    this.cleanupTasks.clear();
  }
  
  // Aggressive memory cleanup
  aggressiveCleanup() {
    // Clear object pools
    for (const [type, pool] of this.objectPools) {
      pool.pool.length = 0;
    }
    
    // Clear weak references
    this.weakReferences = new WeakMap();
    
    // Force cleanup
    this.triggerMemoryCleanup();
    this.suggestGC();
  }
  
  // Emergency memory cleanup
  emergencyCleanup() {
    console.error('Emergency memory cleanup triggered');
    
    // Aggressive cleanup
    this.aggressiveCleanup();
    
    // Clear all caches
    if (window.caches) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Clear localStorage if memory is critical
    if (performance.memory && performance.memory.usedJSHeapSize > this.memoryThresholds.critical * 1.5) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.warn('Failed to clear storage:', error);
      }
    }
  }
  
  // Handle memory pressure events
  handleMemoryPressure(entry) {
    if (entry.name.includes('memory-pressure')) {
      console.warn('Memory pressure detected, triggering cleanup');
      this.triggerMemoryCleanup();
    }
  }
  
  // Set optimization strategy
  setStrategy(strategy) {
    if (this.optimizationStrategies[strategy]) {
      this.currentStrategy = strategy;
      console.log(`Memory optimization strategy changed to: ${strategy}`);
    }
  }
  
  // Get memory usage information
  getMemoryInfo() {
    if (!performance.memory) {
      return { supported: false };
    }
    
    const used = performance.memory.usedJSHeapSize;
    const total = performance.memory.totalJSHeapSize;
    const limit = performance.memory.jsHeapSizeLimit;
    
    return {
      supported: true,
      current: used,
      total: total,
      limit: limit,
      usage: used / total,
      peak: this.memoryUsage.peak,
      average: this.memoryUsage.average,
      strategy: this.currentStrategy,
      thresholds: this.memoryThresholds
    };
  }
  
  // Get optimization recommendations
  getOptimizationRecommendations() {
    const info = this.getMemoryInfo();
    const recommendations = [];
    
    if (!info.supported) {
      recommendations.push('Performance.memory not supported in this browser');
      return recommendations;
    }
    
    if (info.usage > 0.9) {
      recommendations.push('Memory usage critical - consider aggressive cleanup');
    } else if (info.usage > 0.8) {
      recommendations.push('Memory usage high - consider balanced cleanup');
    }
    
    if (info.current > this.memoryThresholds.warning) {
      recommendations.push('Memory usage exceeds warning threshold');
    }
    
    if (this.memoryUsage.samples.length > 50) {
      const recentSamples = this.memoryUsage.samples.slice(-10);
      const trend = recentSamples[recentSamples.length - 1] - recentSamples[0];
      
      if (trend > 10 * 1024 * 1024) { // 10MB increase
        recommendations.push('Memory usage trending upward - check for memory leaks');
      }
    }
    
    return recommendations;
  }
  
  // Optimize DOM operations
  optimizeDOMOperations() {
    // Batch DOM updates
    const batchUpdates = [];
    
    return {
      addUpdate: (updateFn) => {
        batchUpdates.push(updateFn);
      },
      
      flush: () => {
        if (batchUpdates.length === 0) return;
        
        // Use requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
          for (const update of batchUpdates) {
            try {
              update();
            } catch (error) {
              console.warn('Batch update failed:', error);
            }
          }
          batchUpdates.length = 0;
        });
      }
    };
  }
  
  // Memory-efficient event handling
  createEventManager() {
    const listeners = new WeakMap();
    
    return {
      addListener: (element, event, handler, options = {}) => {
        if (!listeners.has(element)) {
          listeners.set(element, new Map());
        }
        
        const elementListeners = listeners.get(element);
        if (!elementListeners.has(event)) {
          elementListeners.set(event, []);
        }
        
        elementListeners.get(event).push(handler);
        element.addEventListener(event, handler, options);
      },
      
      removeListener: (element, event, handler) => {
        const elementListeners = listeners.get(element);
        if (elementListeners && elementListeners.has(event)) {
          const handlers = elementListeners.get(event);
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
            element.removeEventListener(event, handler);
          }
        }
      },
      
      clear: (element) => {
        const elementListeners = listeners.get(element);
        if (elementListeners) {
          for (const [event, handlers] of elementListeners) {
            for (const handler of handlers) {
              element.removeEventListener(event, handler);
            }
          }
          listeners.delete(element);
        }
      }
    };
  }
  
  // Cleanup resources
  dispose() {
    // Clear all object pools
    for (const [type, pool] of this.objectPools) {
      pool.pool.length = 0;
    }
    this.objectPools.clear();
    
    // Clear weak references
    this.weakReferences = new WeakMap();
    
    // Clear cleanup tasks
    this.cleanupTasks.clear();
    
    // Clear memory usage data
    this.memoryUsage.samples.length = 0;
    
    this.isInitialized = false;
  }
}
