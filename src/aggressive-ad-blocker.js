/**
 * Aggressive Ad & Tracker Blocker
 * Mimics Brave browser's aggressive blocking capabilities
 * Blocks ads, trackers, and unwanted content at multiple levels
 * Now integrated with comprehensive filter lists from yokoffing/filterlists
 */

class AggressiveAdBlocker {
    constructor() {
        this.enabled = true;
        this.blockingLevel = 'aggressive'; // 'standard', 'aggressive', 'strict'
        this.blockedRequests = new Set();
        this.blockedDomains = new Set();
        this.whitelistedDomains = new Set();
        this.stats = {
            adsBlocked: 0,
            trackersBlocked: 0,
            scriptsBlocked: 0,
            requestsBlocked: 0,
            totalRequests: 0
        };
        
        // Integration with filter list manager
        this.filterListManager = null;
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupFilterListIntegration();
        this.setupBlocking();
        this.setupMutationObserver();
        this.setupNetworkBlocking();
        this.setupScriptBlocking();
        this.setupStyleBlocking();
        this.setupElementBlocking();
        this.setupPerformanceMonitoring();
        
        console.log('🔒 Aggressive Ad Blocker initialized with filter list integration');
    }

    async setupFilterListIntegration() {
        try {
            // Import and initialize filter list manager
            if (typeof window !== 'undefined' && window.filterListManager) {
                this.filterListManager = window.filterListManager;
                console.log('✅ Filter List Manager integration active');
            } else {
                // Fallback: try to import dynamically
                try {
                    const module = await import('./filter-lists.js');
                    this.filterListManager = module.default;
                    console.log('✅ Filter List Manager imported and integrated');
                } catch (e) {
                    console.warn('⚠️ Filter List Manager not available, using built-in blocking only');
                }
            }
        } catch (e) {
            console.warn('⚠️ Filter List Manager integration failed:', e);
        }
    }

    loadSettings() {
        try {
            const settings = localStorage.getItem('aggressive_ad_blocker_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.enabled = parsed.enabled !== false;
                this.blockingLevel = parsed.blockingLevel || 'aggressive';
                this.whitelistedDomains = new Set(parsed.whitelistedDomains || []);
            }
        } catch (e) {
            console.warn('Failed to load ad blocker settings:', e);
        }
    }

    saveSettings() {
        try {
            const settings = {
                enabled: this.enabled,
                blockingLevel: this.blockingLevel,
                whitelistedDomains: Array.from(this.whitelistedDomains)
            };
            localStorage.setItem('aggressive_ad_blocker_settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save ad blocker settings:', e);
        }
    }

    // Enhanced blocking logic with filter list integration
    isBlocked(url, type = 'request') {
        if (!this.enabled) return false;
        
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            const pathname = urlObj.pathname.toLowerCase();
            
            // Check whitelist first
            if (this.whitelistedDomains.has(hostname)) return false;
            
            // Check filter list manager first (highest priority)
            if (this.filterListManager && this.filterListManager.isBlocked(url, type)) {
                this.stats.requestsBlocked++;
                this.stats.trackersBlocked++;
                return true;
            }
            
            // Fall back to built-in blocking logic
            if (this.blockingLevel === 'strict') {
                return this.isStrictlyBlocked(hostname, pathname, type);
            } else if (this.blockingLevel === 'aggressive') {
                return this.isAggressivelyBlocked(hostname, pathname, type);
            } else {
                return this.isStandardBlocked(hostname, pathname, type);
            }
        } catch (e) {
            return false;
        }
    }

    // Comprehensive blocklists based on Brave's approach
    getBlockLists() {
        const baseLists = {
            // Ad networks and services
            adNetworks: [
                'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
                'adservice.google.com', 'adnxs.com', 'adtech.com', 'advertising.com',
                'adtechus.com', 'adsystem.com', 'amazon-adsystem.com', 'amazon.com',
                'taboola.com', 'outbrain.com', 'mgid.com', 'adform.net', 'criteo.com',
                'pubmatic.com', 'rubiconproject.com', 'openx.net', 'appnexus.com',
                'moatads.com', 'adsrvr.org', 'advertising.com', 'adtech.com',
                'adtechus.com', 'adtech.com', 'adtechus.com', 'adtech.com',
                'adtechus.com', 'adtech.com', 'adtechus.com', 'adtech.com'
            ],
            
            // Analytics and tracking
            analytics: [
                'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
                'facebook.net', 'connect.facebook.net', 'facebook.com', 'fbcdn.net',
                'twitter.com', 't.co', 'linkedin.com', 'pinterest.com', 'instagram.com',
                'hotjar.com', 'crazyegg.com', 'fullstory.com', 'mixpanel.com',
                'amplitude.com', 'segment.com', 'heap.com', 'kissmetrics.com',
                'optimizely.com', 'vwo.com', 'abtasty.com', 'convert.com',
                'newrelic.com', 'datadog.com', 'sentry.io', 'logrocket.com',
                'rollbar.com', 'bugsnag.com', 'airbrake.io', 'raygun.com'
            ],
            
            // Social media trackers
            socialMedia: [
                'facebook.net', 'connect.facebook.net', 'facebook.com', 'fbcdn.net',
                'twitter.com', 't.co', 'linkedin.com', 'pinterest.com', 'instagram.com',
                'snapchat.com', 'tiktok.com', 'reddit.com', 'discord.com',
                'telegram.org', 'whatsapp.com', 'viber.com', 'line.me',
                'wechat.com', 'qq.com', 'weibo.com', 'vk.com'
            ],
            
            // E-commerce tracking
            ecommerce: [
                'amazon-adsystem.com', 'amazon.com', 'ebay.com', 'etsy.com',
                'shopify.com', 'woocommerce.com', 'magento.com', 'prestashop.com',
                'opencart.com', 'oscommerce.com', 'zen-cart.com', 'cubecart.com'
            ],
            
            // Content recommendation
            contentRecommendation: [
                'taboola.com', 'outbrain.com', 'mgid.com', 'content.ad',
                'disqus.com', 'gravatar.com', 'addthis.com', 'sharethis.com',
                'addtoany.com', 'socialsharekit.com', 'socialitejs.com'
            ],
            
            // Performance monitoring
            performanceMonitoring: [
                'newrelic.com', 'datadog.com', 'sentry.io', 'logrocket.com',
                'rollbar.com', 'bugsnag.com', 'airbrake.io', 'raygun.com',
                'pingdom.com', 'uptimerobot.com', 'statuscake.com', 'pingdom.com'
            ],
            
            // User behavior tracking
            userBehavior: [
                'hotjar.com', 'crazyegg.com', 'fullstory.com', 'mixpanel.com',
                'amplitude.com', 'segment.com', 'heap.com', 'kissmetrics.com',
                'optimizely.com', 'vwo.com', 'abtasty.com', 'convert.com',
                'googleoptimize.com', 'optimizely.com', 'vwo.com', 'abtasty.com'
            ],
            
            // Marketing automation
            marketingAutomation: [
                'hubspot.com', 'marketo.com', 'pardot.com', 'salesforce.com',
                'mailchimp.com', 'constantcontact.com', 'aweber.com', 'getresponse.com',
                'convertkit.com', 'drip.com', 'activecampaign.com', 'klaviyo.com'
            ],
            
            // Cryptocurrency mining
            cryptoMining: [
                'coinhive.com', 'cryptoloot.com', 'coinimp.com', 'minero.cc',
                'coin-hive.com', 'crypto-loot.com', 'coin-imp.com', 'minero.cc',
                'coinhive.net', 'cryptoloot.net', 'coinimp.net', 'minero.net'
            ],
            
            // Malware and phishing
            malware: [
                'malware.com', 'phishing.com', 'scam.com', 'fake.com',
                'virus.com', 'trojan.com', 'worm.com', 'spyware.com',
                'adware.com', 'ransomware.com', 'keylogger.com', 'backdoor.com'
            ]
        };

        // Additional aggressive patterns
        const aggressivePatterns = [
            '*://*.ads.*', '*://*.ad.*', '*://*.tracking.*', '*://*.tracker.*',
            '*://*.analytics.*', '*://*.metrics.*', '*://*.pixel.*', '*://*.beacon.*',
            '*://*.telemetry.*', '*://*.spy.*', '*://*.monitor.*', '*://*.log.*',
            '*://*.collect.*', '*://*.gather.*', '*://*.harvest.*', '*://*.mine.*'
        ];

        return { baseLists, aggressivePatterns };
    }

    isStandardBlocked(hostname, pathname, type) {
        const { baseLists } = this.getBlockLists();
        const allPatterns = [
            ...baseLists.adNetworks,
            ...baseLists.analytics,
            ...baseLists.socialMedia
        ];
        
        return allPatterns.some(pattern => hostname.includes(pattern));
    }

    isAggressivelyBlocked(hostname, pathname, type) {
        const { baseLists } = this.getBlockLists();
        const allPatterns = [
            ...baseLists.adNetworks,
            ...baseLists.analytics,
            ...baseLists.socialMedia,
            ...baseLists.ecommerce,
            ...baseLists.contentRecommendation,
            ...baseLists.performanceMonitoring,
            ...baseLists.userBehavior
        ];
        
        // Additional aggressive checks
        const aggressiveChecks = [
            hostname.includes('ads') || hostname.includes('ad'),
            hostname.includes('tracking') || hostname.includes('tracker'),
            hostname.includes('analytics') || hostname.includes('metrics'),
            hostname.includes('pixel') || hostname.includes('beacon'),
            hostname.includes('telemetry') || hostname.includes('spy'),
            hostname.includes('monitor') || hostname.includes('log'),
            hostname.includes('collect') || hostname.includes('gather'),
            hostname.includes('harvest') || hostname.includes('mine'),
            pathname.includes('/ads/') || pathname.includes('/ad/'),
            pathname.includes('/tracking/') || pathname.includes('/tracker/'),
            pathname.includes('/analytics/') || pathname.includes('/metrics/'),
            pathname.includes('/pixel/') || pathname.includes('/beacon/'),
            pathname.includes('/telemetry/') || pathname.includes('/spy/'),
            pathname.includes('/monitor/') || pathname.includes('/log/'),
            pathname.includes('/collect/') || pathname.includes('/gather/'),
            pathname.includes('/harvest/') || pathname.includes('/mine/')
        ];
        
        return allPatterns.some(pattern => hostname.includes(pattern)) || 
               aggressiveChecks.some(check => check);
    }

    isStrictlyBlocked(hostname, pathname, type) {
        const { baseLists } = this.getBlockLists();
        const allPatterns = [
            ...baseLists.adNetworks,
            ...baseLists.analytics,
            ...baseLists.socialMedia,
            ...baseLists.ecommerce,
            ...baseLists.contentRecommendation,
            ...baseLists.performanceMonitoring,
            ...baseLists.userBehavior,
            ...baseLists.marketingAutomation,
            ...baseLists.cryptoMining,
            ...baseLists.malware
        ];
        
        // Strict checks include all aggressive checks plus more
        const strictChecks = [
            ...this.isAggressivelyBlocked(hostname, pathname, type),
            hostname.includes('cdn') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('static') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('assets') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('js') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('css') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('img') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('image') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('video') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('audio') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('font') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('api') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('service') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('widget') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('plugin') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('extension') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('addon') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('module') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('library') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('framework') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('toolkit') && (hostname.includes('ads') || hostname.includes('tracking')),
            hostname.includes('sdk') && (hostname.includes('ads') || hostname.includes('tracking'))
        ];
        
        return allPatterns.some(pattern => hostname.includes(pattern)) || 
               strictChecks.some(check => check);
    }

    setupBlocking() {
        // Override fetch API
        const originalFetch = window.fetch;
        window.fetch = async (resource, init) => {
            const url = typeof resource === 'string' ? resource : resource.url;
            
            if (this.isBlocked(url, 'fetch')) {
                this.blockedRequests.add(url);
                this.stats.requestsBlocked++;
                this.stats.adsBlocked++;
                console.log(`🚫 Ad Blocker: Blocked fetch request to ${url}`);
                return new Response('', { status: 0, statusText: 'Blocked by Ad Blocker' });
            }
            
            this.stats.totalRequests++;
            return originalFetch(resource, init);
        };

        // Override XMLHttpRequest
        const OriginalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new OriginalXHR();
            const originalOpen = xhr.open;
            
            xhr.open = function(method, url) {
                if (this.isBlocked(url, 'xhr')) {
                    this.blockedRequests.add(url);
                    this.stats.requestsBlocked++;
                    this.stats.adsBlocked++;
                    console.log(`🚫 Ad Blocker: Blocked XHR request to ${url}`);
                    throw new Error('Blocked by Ad Blocker');
                }
                return originalOpen.apply(this, arguments);
            }.bind(this);
            
            return xhr;
        }.bind(this);

        // Override Image constructor
        const OriginalImage = window.Image;
        window.Image = function() {
            const img = new OriginalImage();
            const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
            
            Object.defineProperty(img, 'src', {
                set: function(value) {
                    if (this.isBlocked(value, 'image')) {
                        this.blockedRequests.add(value);
                        this.stats.adsBlocked++;
                        console.log(`🚫 Ad Blocker: Blocked image load from ${value}`);
                        return;
                    }
                    return originalSrc.set.call(this, value);
                }.bind(this),
                get: originalSrc.get
            });
            
            return img;
        }.bind(this);

        // Override script loading
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            
            if (tagName.toLowerCase() === 'script') {
                const originalSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
                
                Object.defineProperty(element, 'src', {
                    set: function(value) {
                        if (this.isBlocked(value, 'script')) {
                            this.blockedRequests.add(value);
                            this.stats.scriptsBlocked++;
                            this.stats.adsBlocked++;
                            console.log(`🚫 Ad Blocker: Blocked script load from ${value}`);
                            return;
                        }
                        return originalSrc.set.call(this, value);
                    }.bind(this),
                    get: originalSrc.get
                });
            }
            
            return element;
        }.bind(this);
    }

    setupMutationObserver() {
        // Watch for dynamically added content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.processNewElement(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    processNewElement(element) {
        // Remove ad-related elements
        const adSelectors = [
            '[class*="ad"]', '[class*="ads"]', '[class*="advertisement"]',
            '[id*="ad"]', '[id*="ads"]', '[id*="advertisement"]',
            '[data-ad]', '[data-ads]', '[data-advertisement]',
            '[class*="sponsor"]', '[class*="sponsored"]',
            '[id*="sponsor"]', '[id*="sponsored"]',
            '[class*="banner"]', '[id*="banner"]',
            '[class*="popup"]', '[id*="popup"]',
            '[class*="overlay"]', '[id*="overlay"]',
            '[class*="modal"]', '[id*="modal"]',
            '[class*="lightbox"]', '[id*="lightbox"]',
            '[class*="tooltip"]', '[id*="tooltip"]',
            '[class*="notification"]', '[id*="notification"]',
            '[class*="alert"]', '[id*="alert"]',
            '[class*="message"]', '[id*="message"]',
            '[class*="info"]', '[id*="info"]',
            '[class*="warning"]', '[id*="warning"]',
            '[class*="error"]', '[id*="error"]',
            '[class*="success"]', '[id*="success"]'
        ];

        adSelectors.forEach(selector => {
            const elements = element.querySelectorAll ? element.querySelectorAll(selector) : [];
            elements.forEach(el => {
                if (this.shouldBlockElement(el)) {
                    el.remove();
                    this.stats.adsBlocked++;
                }
            });
        });

        // Process iframes
        const iframes = element.querySelectorAll ? element.querySelectorAll('iframe') : [];
        iframes.forEach(iframe => {
            if (this.shouldBlockIframe(iframe)) {
                iframe.remove();
                this.stats.adsBlocked++;
            }
        });
    }

    shouldBlockElement(element) {
        const text = element.textContent || '';
        const className = element.className || '';
        const id = element.id || '';
        
        const adKeywords = [
            'ad', 'ads', 'advertisement', 'sponsor', 'sponsored',
            'banner', 'popup', 'overlay', 'modal', 'lightbox',
            'tooltip', 'notification', 'alert', 'message', 'info',
            'warning', 'error', 'success', 'promo', 'promotion',
            'offer', 'deal', 'discount', 'sale', 'clearance',
            'limited', 'exclusive', 'special', 'premium', 'vip'
        ];
        
        return adKeywords.some(keyword => 
            text.toLowerCase().includes(keyword) ||
            className.toLowerCase().includes(keyword) ||
            id.toLowerCase().includes(keyword)
        );
    }

    shouldBlockIframe(iframe) {
        try {
            const src = iframe.src || '';
            if (!src) return false;
            
            return this.isBlocked(src, 'iframe');
        } catch (e) {
            return false;
        }
    }

    setupNetworkBlocking() {
        // Block WebSocket connections to tracking domains
        const OriginalWebSocket = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            if (this.isBlocked(url, 'websocket')) {
                this.blockedRequests.add(url);
                this.stats.requestsBlocked++;
                this.stats.trackersBlocked++;
                console.log(`🚫 Ad Blocker: Blocked WebSocket connection to ${url}`);
                throw new Error('Blocked by Ad Blocker');
            }
            return new OriginalWebSocket(url, protocols);
        }.bind(this);

        // Block EventSource connections
        if (window.EventSource) {
            const OriginalEventSource = window.EventSource;
            window.EventSource = function(url, eventSourceInitDict) {
                if (this.isBlocked(url, 'eventsource')) {
                    this.blockedRequests.add(url);
                    this.stats.requestsBlocked++;
                    this.stats.trackersBlocked++;
                    console.log(`🚫 Ad Blocker: Blocked EventSource connection to ${url}`);
                    throw new Error('Blocked by Ad Blocker');
                }
                return new OriginalEventSource(url, eventSourceInitDict);
            }.bind(this);
        }
    }

    setupScriptBlocking() {
        // Block inline scripts with ad-related content
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.textContent && this.containsAdContent(script.textContent)) {
                script.remove();
                this.stats.scriptsBlocked++;
                this.stats.adsBlocked++;
            }
        });
    }

    containsAdContent(content) {
        const adPatterns = [
            /google_ad|googlead|adsense|adwords|doubleclick/i,
            /facebook\.net|fbcdn\.net|connect\.facebook/i,
            /googletagmanager|googletagservices|google-analytics/i,
            /taboola|outbrain|mgid|content\.ad/i,
            /hotjar|crazyegg|fullstory|mixpanel/i,
            /newrelic|datadog|sentry|logrocket/i,
            /amazon-adsystem|amazon\.com/i,
            /adnxs|adtech|advertising|pubmatic/i
        ];
        
        return adPatterns.some(pattern => pattern.test(content));
    }

    setupStyleBlocking() {
        // Remove ad-related styles
        const styles = document.querySelectorAll('style');
        styles.forEach(style => {
            if (style.textContent && this.containsAdStyles(style.textContent)) {
                style.remove();
                this.stats.adsBlocked++;
            }
        });
    }

    containsAdStyles(content) {
        const adStylePatterns = [
            /\.ad\b|\.ads\b|\.advertisement\b/i,
            /\.sponsor\b|\.sponsored\b/i,
            /\.banner\b|\.popup\b|\.overlay\b/i,
            /\.modal\b|\.lightbox\b|\.tooltip\b/i,
            /\.notification\b|\.alert\b|\.message\b/i,
            /\.info\b|\.warning\b|\.error\b|\.success\b/i
        ];
        
        return adStylePatterns.some(pattern => pattern.test(content));
    }

    setupElementBlocking() {
        // Remove existing ad elements
        const adElements = document.querySelectorAll([
            '[class*="ad"]', '[class*="ads"]', '[class*="advertisement"]',
            '[id*="ad"]', '[id*="ads"]', '[id*="advertisement"]',
            '[data-ad]', '[data-ads]', '[data-advertisement]',
            'iframe[src*="doubleclick"]', 'iframe[src*="googleadservices"]',
            'iframe[src*="googlesyndication"]', 'iframe[src*="adnxs"]',
            'iframe[src*="adtech"]', 'iframe[src*="advertising"]'
        ].join(', '));

        adElements.forEach(element => {
            if (this.shouldBlockElement(element)) {
                element.remove();
                this.stats.adsBlocked++;
            }
        });
    }

    setupPerformanceMonitoring() {
        // Monitor for performance impact
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        if (this.isBlocked(entry.name, 'performance')) {
                            this.stats.requestsBlocked++;
                        }
                        this.stats.totalRequests++;
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
        }
    }

    // Enhanced public API methods with filter list integration
    enable() {
        this.enabled = true;
        this.saveSettings();
        console.log('🔒 Ad Blocker enabled');
    }

    disable() {
        this.enabled = false;
        this.saveSettings();
        console.log('🔓 Ad Blocker disabled');
    }

    setBlockingLevel(level) {
        if (['standard', 'aggressive', 'strict'].includes(level)) {
            this.blockingLevel = level;
            this.saveSettings();
            console.log(`🔒 Ad Blocker level set to: ${level}`);
        }
    }

    addWhitelist(domain) {
        this.whitelistedDomains.add(domain);
        this.saveSettings();
        console.log(`✅ Whitelisted domain: ${domain}`);
    }

    removeWhitelist(domain) {
        this.whitelistedDomains.delete(domain);
        this.saveSettings();
        console.log(`❌ Removed whitelist for: ${domain}`);
    }

    // New methods for filter list integration
    async updateFilterLists() {
        if (this.filterListManager) {
            await this.filterListManager.updateAllFilterLists();
            console.log('✅ Filter lists updated');
        }
    }

    getFilterListStats() {
        if (this.filterListManager) {
            return this.filterListManager.getStats();
        }
        return null;
    }

    getFilterLists() {
        if (this.filterListManager) {
            return this.filterListManager.getFilterLists();
        }
        return [];
    }

    enableFilterList(id) {
        if (this.filterListManager) {
            this.filterListManager.enableFilterList(id);
        }
    }

    disableFilterList(id) {
        if (this.filterListManager) {
            this.filterListManager.disableFilterList(id);
        }
    }

    getStats() {
        const baseStats = { ...this.stats };
        
        // Include filter list stats if available
        if (this.filterListManager) {
            const filterStats = this.filterListManager.getStats();
            baseStats.filterListRules = filterStats.totalRules;
            baseStats.activeFilterRules = filterStats.activeRules;
            baseStats.filterListBlocked = filterStats.blockedRequests;
        }
        
        return baseStats;
    }

    getBlockedRequests() {
        return Array.from(this.blockedRequests);
    }

    getBlockedDomains() {
        return Array.from(this.blockedDomains);
    }

    getWhitelistedDomains() {
        return Array.from(this.whitelistedDomains);
    }

    clearStats() {
        this.stats = {
            adsBlocked: 0,
            trackersBlocked: 0,
            scriptsBlocked: 0,
            requestsBlocked: 0,
            totalRequests: 0
        };
        this.blockedRequests.clear();
        this.blockedDomains.clear();
        
        if (this.filterListManager) {
            this.filterListManager.clearStats();
        }
        
        console.log('📊 Ad Blocker stats cleared');
    }

    // Export for global access
    static getInstance() {
        if (!AggressiveAdBlocker.instance) {
            AggressiveAdBlocker.instance = new AggressiveAdBlocker();
        }
        return AggressiveAdBlocker.instance;
    }
}

// Initialize and export
const adBlocker = AggressiveAdBlocker.getInstance();

// Make available globally
if (typeof window !== 'undefined') {
    window.adBlocker = adBlocker;
}

export default adBlocker;
