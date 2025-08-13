/**
 * Comprehensive Filter List Manager
 * Integrates high-quality filter lists from yokoffing/filterlists repository
 * Provides Brave-level ad and tracker blocking capabilities
 */

class FilterListManager {
    constructor() {
        this.enabled = true;
        this.filterLists = new Map();
        this.blockedPatterns = new Set();
        this.whitelistedPatterns = new Set();
        this.stats = {
            totalRules: 0,
            activeRules: 0,
            blockedRequests: 0,
            lastUpdated: null
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.initializeFilterLists();
        this.setupAutoUpdate();
        console.log('🔒 Filter List Manager initialized');
    }

    loadSettings() {
        try {
            const settings = localStorage.getItem('filter_list_manager_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.enabled = parsed.enabled !== false;
                this.whitelistedPatterns = new Set(parsed.whitelistedPatterns || []);
            }
        } catch (e) {
            console.warn('Failed to load filter list settings:', e);
        }
    }

    saveSettings() {
        try {
            const settings = {
                enabled: this.enabled,
                whitelistedPatterns: Array.from(this.whitelistedPatterns)
            };
            localStorage.setItem('filter_list_manager_settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save filter list settings:', e);
        }
    }

    // Initialize comprehensive filter lists based on yokoffing/filterlists
    async initializeFilterLists() {
        // Core ad blocking lists (EasyList + AdGuard)
        await this.addFilterList('easylist', {
            name: 'EasyList (Optimized)',
            description: 'Primary filter list that removes most adverts from web pages',
            url: 'https://easylist.to/easylist/easylist.txt',
            category: 'ads',
            priority: 'high',
            enabled: true
        });

        await this.addFilterList('adguard-base', {
            name: 'AdGuard Base Filter',
            description: 'Comprehensive ad blocking filter',
            url: 'https://filters.adtidy.org/extension/chromium/filters/2.txt',
            category: 'ads',
            priority: 'high',
            enabled: true
        });

        await this.addFilterList('adguard-mobile-ads', {
            name: 'AdGuard Mobile Ads Filter',
            description: 'Mobile-optimized ad blocking',
            url: 'https://filters.adtidy.org/extension/chromium/filters/11.txt',
            category: 'ads',
            priority: 'medium',
            enabled: true
        });

        // Privacy and tracking protection
        await this.addFilterList('adguard-tracking', {
            name: 'AdGuard Tracking Protection',
            description: 'Comprehensive tracking protection',
            url: 'https://filters.adtidy.org/extension/chromium/filters/3.txt',
            category: 'privacy',
            priority: 'high',
            enabled: true
        });

        await this.addFilterList('easylist-privacy', {
            name: 'EasyPrivacy',
            description: 'Comprehensive tracking protection',
            url: 'https://easylist.to/easylist/easyprivacy.txt',
            category: 'privacy',
            priority: 'high',
            enabled: true
        });

        // Annoyance blocking
        await this.addFilterList('fanboy-annoyances', {
            name: 'Fanboy Annoyances',
            description: 'Blocks notifications, social widgets, cookie notices, chat widgets',
            url: 'https://easylist.to/easylist/fanboy-annoyance.txt',
            category: 'annoyances',
            priority: 'medium',
            enabled: true
        });

        await this.addFilterList('adguard-annoyances', {
            name: 'AdGuard Annoyances',
            description: 'Cookie notices, popups, mobile app banners, widgets',
            url: 'https://filters.adtidy.org/extension/chromium/filters/17.txt',
            category: 'annoyances',
            priority: 'medium',
            enabled: true
        });

        await this.addFilterList('adguard-social', {
            name: 'AdGuard Social Media Filter',
            description: 'Blocks social media buttons and widgets',
            url: 'https://filters.adtidy.org/extension/chromium/filters/4.txt',
            category: 'annoyances',
            priority: 'medium',
            enabled: true
        });

        // Enhanced site protection
        await this.addFilterList('enhanced-site-protection', {
            name: 'Enhanced Site Protection',
            description: 'Additional protection for vulnerable sites',
            url: 'https://raw.githubusercontent.com/yokoffing/filterlists/main/enhanced_site_protection.txt',
            category: 'security',
            priority: 'high',
            enabled: true
        });

        // Privacy essentials
        await this.addFilterList('privacy-essentials', {
            name: 'Privacy Essentials',
            description: 'Essential privacy protection rules',
            url: 'https://raw.githubusercontent.com/yokoffing/filterlists/main/privacy_essentials.txt',
            category: 'privacy',
            priority: 'high',
            enabled: true
        });

        // Block third-party fonts
        await this.addFilterList('block-third-party-fonts', {
            name: 'Block Third-Party Fonts',
            description: 'Prevents font-based tracking',
            url: 'https://raw.githubusercontent.com/yokoffing/filterlists/main/block_third_party_fonts.txt',
            category: 'privacy',
            priority: 'medium',
            enabled: true
        });

        // Clean reading experience
        await this.addFilterList('clean-reading', {
            name: 'Clean Reading Experience',
            description: 'Removes distractions for better reading',
            url: 'https://raw.githubusercontent.com/yokoffing/filterlists/main/clean_reading_experience.txt',
            category: 'annoyances',
            priority: 'low',
            enabled: true
        });

        // Click2Load for embedded content
        await this.addFilterList('click2load', {
            name: 'Click2Load',
            description: 'Replaces embedded content with click-to-load buttons',
            url: 'https://raw.githubusercontent.com/yokoffing/filterlists/main/click2load.txt',
            category: 'privacy',
            priority: 'medium',
            enabled: true
        });

        // Anti-paywall filters
        await this.addFilterList('anti-paywall', {
            name: 'Anti-Paywall Filters',
            description: 'Bypasses paywalls and subscription prompts',
            url: 'https://raw.githubusercontent.com/yokoffing/filterlists/main/antipaywall_filters_without_element_hiding.txt',
            category: 'annoyances',
            priority: 'low',
            enabled: false // Disabled by default due to potential legal concerns
        });

        // Personal filters
        await this.addFilterList('personal', {
            name: 'Personal Filters',
            description: 'Custom personal blocking rules',
            url: 'https://raw.githubusercontent.com/yokoffing/filterlists/main/personal.txt',
            category: 'custom',
            priority: 'low',
            enabled: true
        });

        // Combined annoyances
        await this.addFilterList('combined-annoyances', {
            name: 'Combined Annoyances',
            description: 'Comprehensive annoyance blocking',
            url: 'https://raw.githubusercontent.com/yokoffing/filterlists/main/combined_annoyances_without_element_hiding',
            category: 'annoyances',
            priority: 'medium',
            enabled: true
        });

        console.log(`✅ Initialized ${this.filterLists.size} filter lists`);
        this.updateStats();
    }

    async addFilterList(id, config) {
        try {
            const filterList = {
                id,
                ...config,
                rules: new Set(),
                lastUpdated: null,
                enabled: config.enabled
            };

            if (filterList.enabled) {
                await this.updateFilterList(filterList);
            }

            this.filterLists.set(id, filterList);
        } catch (e) {
            console.warn(`Failed to add filter list ${id}:`, e);
        }
    }

    async updateFilterList(filterList) {
        try {
            console.log(`🔄 Updating filter list: ${filterList.name}`);
            
            const response = await fetch(filterList.url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const content = await response.text();
            const rules = this.parseFilterRules(content);
            
            filterList.rules = new Set(rules);
            filterList.lastUpdated = new Date();
            
            console.log(`✅ Updated ${filterList.name}: ${rules.length} rules`);
            this.updateStats();
        } catch (e) {
            console.warn(`Failed to update filter list ${filterList.name}:`, e);
        }
    }

    parseFilterRules(content) {
        const lines = content.split('\n');
        const rules = [];

        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip comments and empty lines
            if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('[')) {
                continue;
            }

            // Parse different rule types
            if (trimmed.startsWith('||')) {
                // Domain blocking rule
                const domain = trimmed.substring(2);
                if (domain && !domain.includes(' ')) {
                    rules.push(domain);
                }
            } else if (trimmed.startsWith('|')) {
                // URL blocking rule
                const url = trimmed.substring(1);
                if (url && !url.includes(' ')) {
                    rules.push(url);
                }
            } else if (trimmed.includes('*')) {
                // Wildcard rule
                rules.push(trimmed);
            } else if (!trimmed.includes(' ') && !trimmed.includes('#')) {
                // Simple domain rule
                rules.push(trimmed);
            }
        }

        return rules;
    }

    isBlocked(url, type = 'request') {
        if (!this.enabled) return false;

        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            const fullUrl = url.toLowerCase();

            // Check whitelist first
            if (this.isWhitelisted(hostname, fullUrl)) {
                return false;
            }

            // Check all enabled filter lists
            for (const [id, filterList] of this.filterLists) {
                if (!filterList.enabled) continue;

                if (this.matchesFilterRules(hostname, fullUrl, filterList.rules)) {
                    this.stats.blockedRequests++;
                    return true;
                }
            }

            return false;
        } catch (e) {
            return false;
        }
    }

    matchesFilterRules(hostname, fullUrl, rules) {
        for (const rule of rules) {
            if (this.matchesRule(hostname, fullUrl, rule)) {
                return true;
            }
        }
        return false;
    }

    matchesRule(hostname, fullUrl, rule) {
        // Domain blocking rules (||domain.com)
        if (rule.startsWith('||')) {
            const domain = rule.substring(2);
            if (hostname === domain || hostname.endsWith('.' + domain)) {
                return true;
            }
        }
        
        // URL blocking rules (|https://...)
        if (rule.startsWith('|')) {
            const urlPattern = rule.substring(1);
            if (fullUrl.includes(urlPattern)) {
                return true;
            }
        }
        
        // Wildcard rules (*.domain.com)
        if (rule.includes('*')) {
            const pattern = rule.replace(/\*/g, '.*');
            try {
                const regex = new RegExp(pattern);
                if (regex.test(hostname) || regex.test(fullUrl)) {
                    return true;
                }
            } catch (e) {
                // Invalid regex, skip
            }
        }
        
        // Simple domain rules
        if (hostname === rule || fullUrl.includes(rule)) {
            return true;
        }

        return false;
    }

    isWhitelisted(hostname, fullUrl) {
        for (const pattern of this.whitelistedPatterns) {
            if (hostname.includes(pattern) || fullUrl.includes(pattern)) {
                return true;
            }
        }
        return false;
    }

    addWhitelist(pattern) {
        this.whitelistedPatterns.add(pattern);
        this.saveSettings();
        console.log(`✅ Whitelisted pattern: ${pattern}`);
    }

    removeWhitelist(pattern) {
        this.whitelistedPatterns.delete(pattern);
        this.saveSettings();
        console.log(`❌ Removed whitelist for: ${pattern}`);
    }

    enableFilterList(id) {
        const filterList = this.filterLists.get(id);
        if (filterList) {
            filterList.enabled = true;
            this.updateFilterList(filterList);
            console.log(`✅ Enabled filter list: ${filterList.name}`);
        }
    }

    disableFilterList(id) {
        const filterList = this.filterLists.get(id);
        if (filterList) {
            filterList.enabled = false;
            console.log(`❌ Disabled filter list: ${filterList.name}`);
        }
    }

    async updateAllFilterLists() {
        console.log('🔄 Updating all filter lists...');
        const promises = [];
        
        for (const [id, filterList] of this.filterLists) {
            if (filterList.enabled) {
                promises.push(this.updateFilterList(filterList));
            }
        }
        
        await Promise.allSettled(promises);
        console.log('✅ All filter lists updated');
    }

    setupAutoUpdate() {
        // Auto-update filter lists every 24 hours
        setInterval(() => {
            this.updateAllFilterLists();
        }, 24 * 60 * 60 * 1000);
    }

    updateStats() {
        let totalRules = 0;
        let activeRules = 0;
        
        for (const [id, filterList] of this.filterLists) {
            totalRules += filterList.rules.size;
            if (filterList.enabled) {
                activeRules += filterList.rules.size;
            }
        }
        
        this.stats.totalRules = totalRules;
        this.stats.activeRules = activeRules;
        this.stats.lastUpdated = new Date();
    }

    getStats() {
        return { ...this.stats };
    }

    getFilterLists() {
        return Array.from(this.filterLists.values()).map(filterList => ({
            id: filterList.id,
            name: filterList.name,
            description: filterList.description,
            category: filterList.category,
            priority: filterList.priority,
            enabled: filterList.enabled,
            ruleCount: filterList.rules.size,
            lastUpdated: filterList.lastUpdated
        }));
    }

    getFilterList(id) {
        return this.filterLists.get(id);
    }

    enable() {
        this.enabled = true;
        this.saveSettings();
        console.log('🔒 Filter List Manager enabled');
    }

    disable() {
        this.enabled = false;
        this.saveSettings();
        console.log('🔓 Filter List Manager disabled');
    }

    clearStats() {
        this.stats.blockedRequests = 0;
        console.log('📊 Filter List Manager stats cleared');
    }

    // Export for global access
    static getInstance() {
        if (!FilterListManager.instance) {
            FilterListManager.instance = new FilterListManager();
        }
        return FilterListManager.instance;
    }
}

// Initialize and export
const filterListManager = FilterListManager.getInstance();

// Make available globally
if (typeof window !== 'undefined') {
    window.filterListManager = filterListManager;
}

export default filterListManager;
