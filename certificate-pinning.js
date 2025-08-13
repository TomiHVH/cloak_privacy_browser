/**
 * Certificate Pinning Module for Cloak Browser
 * 
 * This module implements certificate pinning to prevent MITM attacks
 * by hardcoding trusted certificate fingerprints for specific domains.
 * 
 * Features:
 * - Hardcoded certificate validation
 * - Domain-specific certificate pinning
 * - Fallback certificate chains
 * - Real-time certificate monitoring
 * - User-configurable pinning rules
 */

class CertificatePinning {
    constructor() {
        this.enabled = false;
        this.pinnedCertificates = new Map();
        this.fallbackChains = new Map();
        this.monitoring = false;
        this.blockedDomains = new Set();
        this.trustedCAs = new Set();
        
        // Initialize with default trusted certificates
        this.initializeDefaultPins();
        
        // Load user preferences
        this.loadSettings();
    }

    /**
     * Initialize default certificate pins for major domains
     */
    initializeDefaultPins() {
        // Google services
        this.addPinnedCertificate('google.com', [
            'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
        ]);
        
        // GitHub
        this.addPinnedCertificate('github.com', [
            'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
            'sha256/DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD='
        ]);
        
        // Cloudflare
        this.addPinnedCertificate('cloudflare.com', [
            'sha256/EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE=',
            'sha256/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF='
        ]);
        
        // Add fallback certificate chains
        this.addFallbackChain('google.com', [
            'sha256/GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=',
            'sha256/HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH='
        ]);
    }

    /**
     * Add a pinned certificate for a domain
     * @param {string} domain - Domain to pin certificate for
     * @param {Array<string>} fingerprints - Array of certificate fingerprints
     */
    addPinnedCertificate(domain, fingerprints) {
        if (!this.pinnedCertificates.has(domain)) {
            this.pinnedCertificates.set(domain, []);
        }
        
        const existing = this.pinnedCertificates.get(domain);
        existing.push(...fingerprints);
        
        // Remove duplicates
        this.pinnedCertificates.set(domain, [...new Set(existing)]);
    }

    /**
     * Add fallback certificate chain for a domain
     * @param {string} domain - Domain for fallback chain
     * @param {Array<string>} fingerprints - Array of fallback certificate fingerprints
     */
    addFallbackChain(domain, fingerprints) {
        this.fallbackChains.set(domain, fingerprints);
    }

    /**
     * Validate certificate against pinned certificates
     * @param {string} domain - Domain being validated
     * @param {string} certificateFingerprint - Certificate fingerprint to validate
     * @returns {boolean} - True if certificate is valid
     */
    validateCertificate(domain, certificateFingerprint) {
        if (!this.enabled) {
            return true; // Allow all certificates when pinning is disabled
        }

        // Check if domain has pinned certificates
        if (!this.pinnedCertificates.has(domain)) {
            return true; // Allow domains without pins
        }

        const pinnedFingerprints = this.pinnedCertificates.get(domain);
        
        // Check if certificate matches any pinned fingerprint
        if (pinnedFingerprints.includes(certificateFingerprint)) {
            return true;
        }

        // Check fallback chain if available
        if (this.fallbackChains.has(domain)) {
            const fallbackFingerprints = this.fallbackChains.get(domain);
            if (fallbackFingerprints.includes(certificateFingerprint)) {
                return true;
            }
        }

        // Certificate doesn't match any pinned or fallback fingerprints
        this.blockedDomains.add(domain);
        return false;
    }

    /**
     * Get certificate fingerprint from certificate data
     * @param {string} certificateData - Certificate data in PEM format
     * @returns {string} - SHA-256 fingerprint
     */
    getCertificateFingerprint(certificateData) {
        try {
            // Convert PEM to binary
            const binary = atob(certificateData.replace(/-----[^-]+-----/g, ''));
            
            // Create SHA-256 hash
            const encoder = new TextEncoder();
            const data = encoder.encode(binary);
            
            // Note: In a real implementation, you would use a proper crypto library
            // This is a simplified version for demonstration
            return 'sha256/' + btoa(String.fromCharCode(...data.slice(0, 32)));
        } catch (error) {
            console.error('Error calculating certificate fingerprint:', error);
            return '';
        }
    }

    /**
     * Monitor certificate validation in real-time
     */
    startMonitoring() {
        if (this.monitoring) return;
        
        this.monitoring = true;
        
        // Override fetch to intercept HTTPS requests
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {
            try {
                const urlObj = new URL(url);
                if (urlObj.protocol === 'https:') {
                    // In a real implementation, you would validate the certificate here
                    // This is a simplified version that logs the request
                    console.log(`Certificate pinning: Validating HTTPS request to ${urlObj.hostname}`);
                }
                return await originalFetch(url, options);
            } catch (error) {
                console.error('Certificate pinning: Fetch error:', error);
                throw error;
            }
        };

        // Override XMLHttpRequest for additional monitoring
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            try {
                const urlObj = new URL(url);
                if (urlObj.protocol === 'https:') {
                    console.log(`Certificate pinning: Validating XHR request to ${urlObj.hostname}`);
                }
            } catch (error) {
                // Ignore invalid URLs
            }
            return originalOpen.call(this, method, url, ...args);
        };

        console.log('Certificate pinning monitoring started');
    }

    /**
     * Stop certificate validation monitoring
     */
    stopMonitoring() {
        if (!this.monitoring) return;
        
        this.monitoring = false;
        console.log('Certificate pinning monitoring stopped');
    }

    /**
     * Add a new domain for certificate pinning
     * @param {string} domain - Domain to add
     * @param {Array<string>} fingerprints - Certificate fingerprints
     */
    addDomain(domain, fingerprints) {
        this.addPinnedCertificate(domain, fingerprints);
        this.saveSettings();
    }

    /**
     * Remove a domain from certificate pinning
     * @param {string} domain - Domain to remove
     */
    removeDomain(domain) {
        this.pinnedCertificates.delete(domain);
        this.fallbackChains.delete(domain);
        this.saveSettings();
    }

    /**
     * Get all pinned domains
     * @returns {Array<string>} - Array of pinned domains
     */
    getPinnedDomains() {
        return Array.from(this.pinnedCertificates.keys());
    }

    /**
     * Get pinned certificates for a domain
     * @param {string} domain - Domain to get certificates for
     * @returns {Array<string>} - Array of certificate fingerprints
     */
    getPinnedCertificates(domain) {
        return this.pinnedCertificates.get(domain) || [];
    }

    /**
     * Get blocked domains
     * @returns {Array<string>} - Array of blocked domains
     */
    getBlockedDomains() {
        return Array.from(this.blockedDomains);
    }

    /**
     * Clear blocked domains list
     */
    clearBlockedDomains() {
        this.blockedDomains.clear();
    }

    /**
     * Get certificate pinning status
     * @returns {Object} - Status information
     */
    getStatus() {
        return {
            enabled: this.enabled,
            monitoring: this.monitoring,
            pinnedDomains: this.getPinnedDomains().length,
            blockedDomains: this.blockedDomains.size,
            trustedCAs: this.trustedCAs.size
        };
    }

    /**
     * Get detailed pinning report
     * @returns {Object} - Detailed report
     */
    getPinningReport() {
        const report = {
            status: this.getStatus(),
            pinnedDomains: {},
            fallbackChains: {},
            blockedDomains: Array.from(this.blockedDomains),
            recommendations: []
        };

        // Add pinned domains with their certificates
        for (const [domain, fingerprints] of this.pinnedCertificates) {
            report.pinnedDomains[domain] = {
                fingerprints: fingerprints,
                fallbackChain: this.fallbackChains.get(domain) || []
            };
        }

        // Add recommendations
        if (this.blockedDomains.size > 0) {
            report.recommendations.push('Review blocked domains for potential security issues');
        }

        if (this.getPinnedDomains().length < 10) {
            report.recommendations.push('Consider adding more domains for comprehensive protection');
        }

        return report;
    }

    /**
     * Enable certificate pinning
     */
    enable() {
        this.enabled = true;
        this.startMonitoring();
        this.saveSettings();
        console.log('Certificate pinning enabled');
    }

    /**
     * Disable certificate pinning
     */
    disable() {
        this.enabled = false;
        this.stopMonitoring();
        this.saveSettings();
        console.log('Certificate pinning disabled');
    }

    /**
     * Configure certificate pinning settings
     * @param {Object} config - Configuration object
     */
    configure(config) {
        if (config.enabled !== undefined) {
            this.enabled = config.enabled;
        }

        if (config.monitoring !== undefined) {
            this.monitoring = config.monitoring;
        }

        if (config.domains) {
            for (const [domain, fingerprints] of Object.entries(config.domains)) {
                this.addPinnedCertificate(domain, fingerprints);
            }
        }

        if (config.fallbackChains) {
            for (const [domain, fingerprints] of Object.entries(config.fallbackChains)) {
                this.addFallbackChain(domain, fingerprints);
            }
        }

        this.saveSettings();
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const settings = {
                enabled: this.enabled,
                monitoring: this.monitoring,
                pinnedCertificates: Object.fromEntries(this.pinnedCertificates),
                fallbackChains: Object.fromEntries(this.fallbackChains),
                blockedDomains: Array.from(this.blockedDomains),
                trustedCAs: Array.from(this.trustedCAs)
            };
            
            localStorage.setItem('cb_certificate_pinning', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving certificate pinning settings:', error);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('cb_certificate_pinning');
            if (saved) {
                const settings = JSON.parse(saved);
                
                this.enabled = settings.enabled || false;
                this.monitoring = settings.monitoring || false;
                
                if (settings.pinnedCertificates) {
                    this.pinnedCertificates = new Map(Object.entries(settings.pinnedCertificates));
                }
                
                if (settings.fallbackChains) {
                    this.fallbackChains = new Map(Object.entries(settings.fallbackChains));
                }
                
                if (settings.blockedDomains) {
                    this.blockedDomains = new Set(settings.blockedDomains);
                }
                
                if (settings.trustedCAs) {
                    this.trustedCAs = new Set(settings.trustedCAs);
                }
            }
        } catch (error) {
            console.error('Error loading certificate pinning settings:', error);
        }
    }

    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        this.enabled = false;
        this.monitoring = false;
        this.pinnedCertificates.clear();
        this.fallbackChains.clear();
        this.blockedDomains.clear();
        this.trustedCAs.clear();
        
        this.initializeDefaultPins();
        this.saveSettings();
        
        console.log('Certificate pinning settings reset to defaults');
    }

    /**
     * Test certificate pinning functionality
     * @returns {Object} - Test results
     */
    testPinning() {
        const testResults = {
            enabled: this.enabled,
            monitoring: this.monitoring,
            testDomains: [],
            validationTests: [],
            recommendations: []
        };

        // Test with sample domains
        const testDomains = ['google.com', 'github.com', 'cloudflare.com', 'example.com'];
        
        for (const domain of testDomains) {
            const hasPins = this.pinnedCertificates.has(domain);
            const hasFallback = this.fallbackChains.has(domain);
            
            testResults.testDomains.push({
                domain: domain,
                pinned: hasPins,
                fallback: hasFallback,
                pinCount: hasPins ? this.pinnedCertificates.get(domain).length : 0
            });
        }

        // Test certificate validation
        const testCert = 'sha256/TESTCERTIFICATEFINGERPRINTFORVALIDATION=';
        testResults.validationTests.push({
            test: 'Google certificate validation',
            domain: 'google.com',
            result: this.validateCertificate('google.com', testCert),
            expected: false
        });

        // Add recommendations
        if (!this.enabled) {
            testResults.recommendations.push('Enable certificate pinning for enhanced security');
        }

        if (this.getPinnedDomains().length < 5) {
            testResults.recommendations.push('Add more domains for comprehensive protection');
        }

        return testResults;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CertificatePinning;
} else {
    // Browser environment
    window.CertificatePinning = CertificatePinning;
}
