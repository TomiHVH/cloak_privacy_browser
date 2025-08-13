/**
 * Canvas Fingerprint Protection Module for Cloak Browser
 * 
 * This module prevents canvas fingerprinting by randomizing canvas output
 * and providing consistent but fake canvas fingerprints across sessions.
 * 
 * Features:
 * - Canvas API fingerprinting prevention
 * - Consistent fake fingerprints across sessions
 * - Text rendering randomization
 * - Image data manipulation
 * - WebGL canvas protection
 */

class CanvasFingerprintProtection {
    constructor() {
        this.enabled = false;
        this.randomizationLevel = 'medium'; // low, medium, high
        this.fakeFingerprint = '';
        this.originalMethods = new Map();
        this.canvasCache = new Map();
        this.textCache = new Map();
        
        // Initialize fake fingerprint
        this.generateFakeFingerprint();
        
        // Load settings
        this.loadSettings();
    }

    /**
     * Initialize canvas fingerprint protection
     */
    init() {
        console.log('🎨 Canvas Fingerprint Protection: Initializing...');
        if (this.enabled) {
            this.applyProtection();
        }
    }

    /**
     * Generate a consistent fake canvas fingerprint
     */
    generateFakeFingerprint() {
        // Create a deterministic but fake fingerprint
        const fakeData = [
            'Canvas Fingerprint Protection Active',
            'Cloak Browser Security',
            'Privacy First Browser',
            'Anti-Fingerprinting Enabled'
        ];
        
        // Combine and hash to create consistent fingerprint
        const combined = fakeData.join('|');
        this.fakeFingerprint = this.simpleHash(combined);
    }

    /**
     * Simple hash function for consistent fingerprint generation
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Apply canvas fingerprint protection
     */
    applyProtection() {
        if (!this.enabled) return;

        // Protect HTML5 Canvas
        this.protectHTML5Canvas();
        
        // Protect WebGL Canvas
        this.protectWebGLCanvas();
        
        // Protect OffscreenCanvas
        this.protectOffscreenCanvas();
        
        console.log('🎨 Canvas fingerprint protection applied');
    }

    /**
     * Protect HTML5 Canvas API
     */
    protectHTML5Canvas() {
        // Store original methods
        if (!this.originalMethods.has('getContext')) {
            this.originalMethods.set('getContext', HTMLCanvasElement.prototype.getContext);
        }

        // Override getContext to intercept canvas creation
        HTMLCanvasElement.prototype.getContext = (contextType, contextAttributes) => {
            const context = this.originalMethods.get('getContext').call(this, contextType, contextAttributes);
            
            if (contextType === '2d') {
                this.protect2DContext(context);
            } else if (contextType === 'webgl' || contextType === 'webgl2') {
                this.protectWebGLContext(context);
            }
            
            return context;
        };

        // Override toDataURL
        if (!this.originalMethods.has('toDataURL')) {
            this.originalMethods.set('toDataURL', HTMLCanvasElement.prototype.toDataURL);
        }
        
        HTMLCanvasElement.prototype.toDataURL = (type, quality) => {
            if (this.enabled) {
                return this.getFakeDataURL(type, quality);
            }
            return this.originalMethods.get('toDataURL').call(this, type, quality);
        };

        // Override toBlob
        if (!this.originalMethods.has('toBlob')) {
            this.originalMethods.set('toBlob', HTMLCanvasElement.prototype.toBlob);
        }
        
        HTMLCanvasElement.prototype.toBlob = (callback, type, quality) => {
            if (this.enabled) {
                this.createFakeBlob(callback, type, quality);
                return;
            }
            return this.originalMethods.get('toBlob').call(this, callback, type, quality);
        };
    }

    /**
     * Protect 2D Canvas Context
     */
    protect2DContext(context) {
        // Override fillText to add subtle randomization
        if (!this.originalMethods.has('fillText')) {
            this.originalMethods.set('fillText', context.fillText);
        }
        
        context.fillText = (text, x, y, maxWidth) => {
            if (this.enabled && this.randomizationLevel !== 'low') {
                // Add subtle position randomization
                const randomX = x + (Math.random() - 0.5) * 0.1;
                const randomY = y + (Math.random() - 0.5) * 0.1;
                return this.originalMethods.get('fillText').call(context, text, randomX, randomY, maxWidth);
            }
            return this.originalMethods.get('fillText').call(context, text, x, y, maxWidth);
        };

        // Override getImageData to return modified data
        if (!this.originalMethods.has('getImageData')) {
            this.originalMethods.set('getImageData', context.getImageData);
        }
        
        context.getImageData = (sx, sy, sw, sh) => {
            const imageData = this.originalMethods.get('getImageData').call(context, sx, sy, sw, sh);
            
            if (this.enabled && this.randomizationLevel === 'high') {
                return this.modifyImageData(imageData);
            }
            
            return imageData;
        };
    }

    /**
     * Protect WebGL Context
     */
    protectWebGLContext(context) {
        // Override getParameter to return fake values
        if (!this.originalMethods.has('getParameter')) {
            this.originalMethods.set('getParameter', context.getParameter);
        }
        
        context.getParameter = (parameter) => {
            if (this.enabled) {
                const fakeValue = this.getFakeWebGLParameter(parameter);
                if (fakeValue !== null) {
                    return fakeValue;
                }
            }
            return this.originalMethods.get('getParameter').call(context, parameter);
        };
    }

    /**
     * Protect OffscreenCanvas
     */
    protectOffscreenCanvas() {
        if (typeof OffscreenCanvas !== 'undefined') {
            // Store original methods
            if (!this.originalMethods.has('offscreenGetContext')) {
                this.originalMethods.set('offscreenGetContext', OffscreenCanvas.prototype.getContext);
            }

            // Override getContext
            OffscreenCanvas.prototype.getContext = (contextType, contextAttributes) => {
                const context = this.originalMethods.get('offscreenGetContext').call(this, contextType, contextAttributes);
                
                if (contextType === '2d') {
                    this.protect2DContext(context);
                } else if (contextType === 'webgl' || contextType === 'webgl2') {
                    this.protectWebGLContext(context);
                }
                
                return context;
            };
        }
    }

    /**
     * Get fake WebGL parameter values
     */
    getFakeWebGLParameter(parameter) {
        const fakeParams = {
            // Vendor and renderer (commonly used for fingerprinting)
            0x1F00: 'Cloak Browser Graphics', // VENDOR
            0x1F01: 'Privacy Enhanced Renderer', // RENDERER
            0x1F02: '1.0.0', // VERSION
            
            // Extensions (commonly checked)
            0x1F03: ['WEBGL_debug_renderer_info', 'WEBGL_depth_texture', 'WEBGL_lose_context'], // EXTENSIONS
            
            // Other parameters
            0x8B8C: 'Cloak Browser Shader', // SHADING_LANGUAGE_VERSION
        };

        return fakeParams[parameter] || null;
    }

    /**
     * Modify image data to prevent fingerprinting
     */
    modifyImageData(imageData) {
        const data = imageData.data;
        const modifiedData = new Uint8ClampedArray(data);
        
        // Add subtle noise to prevent exact fingerprinting
        for (let i = 0; i < data.length; i += 4) {
            // Only modify alpha channel slightly to maintain visual appearance
            if (i % 4 === 3 && data[i] > 0) {
                const noise = (Math.random() - 0.5) * 2;
                modifiedData[i] = Math.max(0, Math.min(255, data[i] + noise));
            }
        }
        
        return new ImageData(modifiedData, imageData.width, imageData.height);
    }

    /**
     * Get fake data URL
     */
    getFakeDataURL(type, quality) {
        // Return a consistent fake data URL
        const fakeCanvas = document.createElement('canvas');
        fakeCanvas.width = 100;
        fakeCanvas.height = 100;
        
        const ctx = fakeCanvas.getContext('2d');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('Protected', 10, 50);
        
        return fakeCanvas.toDataURL(type, quality);
    }

    /**
     * Create fake blob
     */
    createFakeBlob(callback, type, quality) {
        const fakeCanvas = document.createElement('canvas');
        fakeCanvas.width = 100;
        fakeCanvas.height = 100;
        
        const ctx = fakeCanvas.getContext('2d');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('Protected', 10, 50);
        
        fakeCanvas.toBlob(callback, type, quality);
    }

    /**
     * Test canvas fingerprint protection
     */
    testProtection() {
        const results = {
            enabled: this.enabled,
            randomizationLevel: this.randomizationLevel,
            tests: [],
            recommendations: []
        };

        // Test 1: Canvas creation
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            
            results.tests.push({
                name: 'Canvas Creation',
                status: 'success',
                message: 'Canvas created successfully'
            });
        } catch (error) {
            results.tests.push({
                name: 'Canvas Creation',
                status: 'error',
                message: 'Failed to create canvas: ' + error.message
            });
        }

        // Test 2: Text rendering
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.font = '16px Arial';
            ctx.fillText('Test Text', 10, 20);
            
            results.tests.push({
                name: 'Text Rendering',
                status: 'success',
                message: 'Text rendered successfully'
            });
        } catch (error) {
            results.tests.push({
                name: 'Text Rendering',
                status: 'error',
                message: 'Failed to render text: ' + error.message
            });
        }

        // Test 3: Image data manipulation
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, 10, 10);
            
            results.tests.push({
                name: 'Image Data',
                status: 'success',
                message: 'Image data retrieved successfully'
            });
        } catch (error) {
            results.tests.push({
                name: 'Image Data',
                status: 'error',
                message: 'Failed to get image data: ' + error.message
            });
        }

        // Add recommendations
        if (!this.enabled) {
            results.recommendations.push('Enable canvas fingerprint protection for enhanced privacy');
        }
        
        if (this.randomizationLevel === 'low') {
            results.recommendations.push('Consider increasing randomization level for better protection');
        }

        return results;
    }

    /**
     * Get protection status
     */
    getStatus() {
        return {
            enabled: this.enabled,
            randomizationLevel: this.randomizationLevel,
            fakeFingerprint: this.fakeFingerprint,
            protectedAPIs: Array.from(this.originalMethods.keys())
        };
    }

    /**
     * Enable protection
     */
    enable() {
        this.enabled = true;
        this.applyProtection();
        this.saveSettings();
        console.log('🎨 Canvas fingerprint protection enabled');
    }

    /**
     * Disable protection
     */
    disable() {
        this.enabled = false;
        this.restoreOriginalMethods();
        this.saveSettings();
        console.log('🎨 Canvas fingerprint protection disabled');
    }

    /**
     * Restore original methods
     */
    restoreOriginalMethods() {
        for (const [methodName, originalMethod] of this.originalMethods) {
            if (methodName === 'getContext') {
                HTMLCanvasElement.prototype.getContext = originalMethod;
            } else if (methodName === 'toDataURL') {
                HTMLCanvasElement.prototype.toDataURL = originalMethod;
            } else if (methodName === 'toBlob') {
                HTMLCanvasElement.prototype.toBlob = originalMethod;
            } else if (methodName === 'fillText') {
                // Restore for all 2D contexts
                const canvases = document.querySelectorAll('canvas');
                canvases.forEach(canvas => {
                    const ctx = canvas.getContext('2d');
                    if (ctx && ctx.fillText === this.originalMethods.get('fillText')) {
                        ctx.fillText = originalMethod;
                    }
                });
            }
        }
    }

    /**
     * Configure protection settings
     */
    configure(settings) {
        if (settings.enabled !== undefined) {
            this.enabled = settings.enabled;
        }
        
        if (settings.randomizationLevel !== undefined) {
            this.randomizationLevel = settings.randomizationLevel;
        }
        
        if (this.enabled) {
            this.applyProtection();
        } else {
            this.restoreOriginalMethods();
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
                randomizationLevel: this.randomizationLevel
            };
            localStorage.setItem('cb_canvas_protection', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving canvas protection settings:', error);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('cb_canvas_protection');
            if (saved) {
                const settings = JSON.parse(saved);
                this.enabled = settings.enabled || false;
                this.randomizationLevel = settings.randomizationLevel || 'medium';
            }
        } catch (error) {
            console.error('Error loading canvas protection settings:', error);
        }
    }

    /**
     * Reset to default settings
     */
    resetToDefaults() {
        this.enabled = false;
        this.randomizationLevel = 'medium';
        this.restoreOriginalMethods();
        this.saveSettings();
        console.log('🎨 Canvas protection settings reset to defaults');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasFingerprintProtection;
} else {
    // Browser environment
    window.CanvasFingerprintProtection = CanvasFingerprintProtection;
}
