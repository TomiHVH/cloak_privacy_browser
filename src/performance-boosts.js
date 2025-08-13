import { FONT_STACK } from './config.js';

export class PerformanceBoosts {
  constructor() {
    this.isEnabled = true;
    this.prefetchEnabled = true;
    this.prerenderEnabled = true;
    this.http3Enabled = false;
    this.lazyImagesEnabled = true;
    this.intersectionObserver = null;
    this.prefetchQueue = new Set();
    this.prerenderQueue = new Set();
    this.performanceMetrics = {
      pageLoadTime: 0,
      domContentLoaded: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0
    };
    this.heuristics = {
      linkHoverDelay: 100,
      scrollThreshold: 0.8,
      viewportThreshold: 0.1,
      maxPrefetchConcurrent: 3,
      maxPrerenderConcurrent: 1
    };
    this.activePrefetches = 0;
    this.activePrerenders = 0;
  }

  async init() {
    if (!this.isEnabled) return false;

    try {
      // Initialize performance monitoring
      this.initPerformanceMonitoring();
      
      // Initialize intersection observer for lazy loading
      this.initIntersectionObserver();
      
      // Initialize prefetch heuristics
      this.initPrefetchHeuristics();
      
      // Initialize HTTP/3 detection
      this.initHttp3Detection();
      
      // Initialize resource hints
      this.initResourceHints();
      
      console.log('Performance Boosts initialized successfully');
      return true;
    } catch (error) {
      console.error('Performance Boosts initialization failed:', error);
      return false;
    }
  }

  initPerformanceMonitoring() {
    // Monitor page load performance
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.performanceMetrics.firstContentfulPaint = entry.startTime;
          });
        });
        fcpObserver.observe({ entryTypes: ['first-contentful-paint'] });
      } catch (e) {
        // FCP not supported
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.performanceMetrics.largestContentfulPaint = entry.startTime;
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.performanceMetrics.cumulativeLayoutShift += entry.value;
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }
    }

    // DOM Content Loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.performanceMetrics.domContentLoaded = performance.now();
      });
    } else {
      this.performanceMetrics.domContentLoaded = performance.now();
    }

    // Page Load Complete
    window.addEventListener('load', () => {
      this.performanceMetrics.pageLoadTime = performance.now();
      this.analyzePerformance();
    });
  }

  initIntersectionObserver() {
    if (!('IntersectionObserver' in window) || !this.lazyImagesEnabled) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadLazyImage(entry.target);
            this.intersectionObserver.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: this.heuristics.viewportThreshold
      }
    );

    // Observe existing lazy images
    this.observeLazyImages();
  }

  observeLazyImages() {
    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    lazyImages.forEach(img => {
      this.intersectionObserver.observe(img);
    });
  }

  loadLazyImage(img) {
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
    
    // Add loading animation
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease';
    
    img.onload = () => {
      img.style.opacity = '1';
    };
  }

  initPrefetchHeuristics() {
    if (!this.prefetchEnabled) return;

    // Prefetch on link hover
    document.addEventListener('mouseover', (event) => {
      const link = event.target.closest('a');
      if (link && this.shouldPrefetch(link.href)) {
        this.schedulePrefetch(link.href);
      }
    });

    // Prefetch on scroll (near bottom)
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.handleScrollPrefetch();
      }, 150);
    });

    // Prefetch visible links
    this.prefetchVisibleLinks();
  }

  shouldPrefetch(url) {
    if (!url || this.prefetchQueue.has(url)) return false;
    
    try {
      const urlObj = new URL(url);
      // Only prefetch same-origin links
      if (urlObj.origin !== window.location.origin) return false;
      
      // Don't prefetch if already at max concurrent
      if (this.activePrefetches >= this.heuristics.maxPrefetchConcurrent) return false;
      
      return true;
    } catch (e) {
      return false;
    }
  }

  schedulePrefetch(url) {
    if (this.prefetchQueue.has(url)) return;
    
    this.prefetchQueue.add(url);
    
    setTimeout(() => {
      this.executePrefetch(url);
    }, this.heuristics.linkHoverDelay);
  }

  async executePrefetch(url) {
    if (this.activePrefetches >= this.heuristics.maxPrefetchConcurrent) {
      return;
    }

    try {
      this.activePrefetches++;
      
      // Create prefetch link
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      
      document.head.appendChild(link);
      
      // Wait for prefetch to complete
      await new Promise((resolve, reject) => {
        link.onload = resolve;
        link.onerror = reject;
        
        // Timeout after 5 seconds
        setTimeout(resolve, 5000);
      });
      
      console.log(`Prefetched: ${url}`);
    } catch (error) {
      console.warn(`Prefetch failed for ${url}:`, error);
    } finally {
      this.activePrefetches--;
      this.prefetchQueue.delete(url);
    }
  }

  handleScrollPrefetch() {
    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // If near bottom, prefetch next page links
    if (scrollTop + windowHeight >= documentHeight * this.heuristics.scrollThreshold) {
      this.prefetchVisibleLinks();
    }
  }

  prefetchVisibleLinks() {
    const links = document.querySelectorAll('a[href]');
    const visibleLinks = Array.from(links).filter(link => {
      const rect = link.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });

    visibleLinks.slice(0, 3).forEach(link => {
      if (this.shouldPrefetch(link.href)) {
        this.schedulePrefetch(link.href);
      }
    });
  }

  initHttp3Detection() {
    if (!('connection' in navigator)) return;

    const connection = navigator.connection;
    
    // Check if HTTP/3 is supported
    if (connection.effectiveType === '4g' || connection.effectiveType === '5g') {
      this.http3Enabled = true;
    }

    // Monitor connection changes
    connection.addEventListener('change', () => {
      this.updateHttp3Status();
    });
  }

  updateHttp3Status() {
    const connection = navigator.connection;
    if (connection) {
      this.http3Enabled = connection.effectiveType === '4g' || connection.effectiveType === '5g';
    }
  }

  async toggleHttp3() {
    if (!('connection' in navigator)) {
      console.warn('Network Information API not supported');
      return false;
    }

    try {
      // This is a simplified toggle - in reality, HTTP/3 support depends on the server
      this.http3Enabled = !this.http3Enabled;
      
      if (this.http3Enabled) {
        // Attempt to establish HTTP/3 connection
        await this.testHttp3Connection();
      }
      
      return this.http3Enabled;
    } catch (error) {
      console.error('HTTP/3 toggle failed:', error);
      this.http3Enabled = false;
      return false;
    }
  }

  async testHttp3Connection() {
    try {
      // Test connection with a simple request
      const response = await fetch('/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      // Check if response indicates HTTP/3
      const altSvc = response.headers.get('alt-svc');
      if (altSvc && altSvc.includes('h3')) {
        console.log('HTTP/3 connection established');
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('HTTP/3 test failed:', error);
      return false;
    }
  }

  initResourceHints() {
    // Add DNS prefetch for external domains
    this.addDnsPrefetch();
    
    // Add preconnect for critical resources
    this.addPreconnect();
  }

  addDnsPrefetch() {
    const externalDomains = new Set();
    
    // Find external domains from links and images
    document.querySelectorAll('a[href], img[src]').forEach(element => {
      try {
        const url = new URL(element.href || element.src);
        if (url.origin !== window.location.origin) {
          externalDomains.add(url.origin);
        }
      } catch (e) {
        // Invalid URL
      }
    });

    // Add DNS prefetch links
    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  addPreconnect() {
    const criticalDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net'
    ];

    criticalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  analyzePerformance() {
    const metrics = this.performanceMetrics;
    
    // Performance score calculation
    let score = 100;
    
    // Penalize slow page load
    if (metrics.pageLoadTime > 3000) score -= 20;
    if (metrics.pageLoadTime > 5000) score -= 30;
    
    // Penalize slow FCP
    if (metrics.firstContentfulPaint > 2000) score -= 15;
    if (metrics.firstContentfulPaint > 4000) score -= 25;
    
    // Penalize slow LCP
    if (metrics.largestContentfulPaint > 2500) score -= 15;
    if (metrics.largestContentfulPaint > 4000) score -= 25;
    
    // Penalize layout shifts
    if (metrics.cumulativeLayoutShift > 0.1) score -= 10;
    if (metrics.cumulativeLayoutShift > 0.25) score -= 20;
    
    score = Math.max(0, score);
    
    console.log('Performance Score:', score);
    console.log('Performance Metrics:', metrics);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, score);
    console.log('Performance Recommendations:', recommendations);
    
    return { score, metrics, recommendations };
  }

  generateRecommendations(metrics, score) {
    const recommendations = [];
    
    if (score < 70) {
      recommendations.push('Critical performance issues detected');
    }
    
    if (metrics.pageLoadTime > 3000) {
      recommendations.push('Page load time is slow - consider optimizing resources');
    }
    
    if (metrics.firstContentfulPaint > 2000) {
      recommendations.push('First contentful paint is slow - optimize critical rendering path');
    }
    
    if (metrics.largestContentfulPaint > 2500) {
      recommendations.push('Largest contentful paint is slow - optimize main content');
    }
    
    if (metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Layout shifts detected - fix element sizing and positioning');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is good - keep up the good work!');
    }
    
    return recommendations;
  }

  // Lazy load images with Intersection Observer
  lazyLoadImages() {
    if (!this.lazyImagesEnabled || !this.intersectionObserver) return;
    
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      this.intersectionObserver.observe(img);
    });
  }

  // Preload critical resources
  preloadCriticalResources() {
    const criticalResources = [
      { href: '/css/critical.css', as: 'style' },
      { href: '/js/critical.js', as: 'script' },
      { href: '/fonts/main.woff2', as: 'font', crossOrigin: 'anonymous' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.crossOrigin) {
        link.crossOrigin = resource.crossOrigin;
      }
      document.head.appendChild(link);
    });
  }

  // Optimize images
  optimizeImages() {
    if (!this.lazyImagesEnabled) return;
    
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading="lazy" to images below the fold
      if (img.getBoundingClientRect().top > window.innerHeight) {
        img.loading = 'lazy';
      }
      
      // Add decoding="async" for better performance
      img.decoding = 'async';
    });
  }

  // Get performance statistics
  getPerformanceStats() {
    return {
      enabled: this.isEnabled,
      prefetch: {
        enabled: this.prefetchEnabled,
        active: this.activePrefetches,
        queued: this.prefetchQueue.size
      },
      prerender: {
        enabled: this.prerenderEnabled,
        active: this.activePrerenders,
        queued: this.prerenderQueue.size
      },
      http3: {
        enabled: this.http3Enabled,
        supported: 'connection' in navigator
      },
      lazyImages: {
        enabled: this.lazyImagesEnabled,
        observer: !!this.intersectionObserver
      },
      metrics: this.performanceMetrics
    };
  }

  // Toggle features
  toggleFeature(feature) {
    switch (feature) {
      case 'prefetch':
        this.prefetchEnabled = !this.prefetchEnabled;
        if (this.prefetchEnabled) {
          this.initPrefetchHeuristics();
        }
        break;
      case 'prerender':
        this.prerenderEnabled = !this.prerenderEnabled;
        break;
      case 'lazyImages':
        this.lazyImagesEnabled = !this.lazyImagesEnabled;
        if (this.lazyImagesEnabled) {
          this.initIntersectionObserver();
        }
        break;
      case 'http3':
        this.toggleHttp3();
        break;
      default:
        console.warn(`Unknown feature: ${feature}`);
        return false;
    }
    
    return true;
  }

  // Cleanup
  dispose() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    
    this.prefetchQueue.clear();
    this.prerenderQueue.clear();
    this.activePrefetches = 0;
    this.activePrerenders = 0;
  }
}
