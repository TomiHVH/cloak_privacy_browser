/**
 * Audio Fingerprint Protection Module for Cloak Browser
 * 
 * This module prevents audio fingerprinting by randomizing audio output
 * and providing consistent but fake audio fingerprints across sessions.
 * 
 * Features:
 * - Audio API fingerprinting prevention
 * - Audio context randomization
 * - Oscillator frequency variation
 * - Audio buffer manipulation
 * - Web Audio API protection
 */

class AudioFingerprintProtection {
    constructor() {
        this.enabled = false;
        this.randomizationLevel = 'medium'; // low, medium, high
        this.fakeFingerprint = '';
        this.originalMethods = new Map();
        this.audioContexts = new Set();
        this.fakeAudioData = new Map();
        
        // Initialize fake fingerprint
        this.generateFakeFingerprint();
        
        // Load settings
        this.loadSettings();
    }

    /**
     * Initialize audio fingerprint protection
     */
    init() {
        console.log('🎵 Audio Fingerprint Protection: Initializing...');
        if (this.enabled) {
            this.applyProtection();
        }
    }

    /**
     * Generate a consistent fake audio fingerprint
     */
    generateFakeFingerprint() {
        // Create a deterministic but fake fingerprint
        const fakeData = [
            'Audio Fingerprint Protection Active',
            'Cloak Browser Audio Security',
            'Privacy First Audio System',
            'Anti-Audio-Fingerprinting Enabled'
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
     * Apply audio fingerprint protection
     */
    applyProtection() {
        if (!this.enabled) return;

        // Protect AudioContext
        this.protectAudioContext();
        
        // Protect OscillatorNode
        this.protectOscillatorNode();
        
        // Protect AudioBuffer
        this.protectAudioBuffer();
        
        // Protect AnalyserNode
        this.protectAnalyserNode();
        
        console.log('🎵 Audio fingerprint protection applied');
    }

    /**
     * Protect AudioContext API
     */
    protectAudioContext() {
        // Store original AudioContext constructor
        if (!this.originalMethods.has('AudioContext')) {
            this.originalMethods.set('AudioContext', window.AudioContext || window.webkitAudioContext);
        }

        // Override AudioContext constructor
        const OriginalAudioContext = this.originalMethods.get('AudioContext');
        window.AudioContext = function(contextOptions) {
            const audioContext = new OriginalAudioContext(contextOptions);
            this.protectAudioContextInstance(audioContext);
            return audioContext;
        };
        window.AudioContext.prototype = OriginalAudioContext.prototype;

        // Also protect webkitAudioContext if it exists
        if (window.webkitAudioContext) {
            window.webkitAudioContext = window.AudioContext;
        }
    }

    /**
     * Protect individual AudioContext instance
     */
    protectAudioContextInstance(audioContext) {
        this.audioContexts.add(audioContext);

        // Override createOscillator
        if (!this.originalMethods.has('createOscillator')) {
            this.originalMethods.set('createOscillator', audioContext.createOscillator);
        }

        audioContext.createOscillator = () => {
            const oscillator = this.originalMethods.get('createOscillator').call(audioContext);
            this.protectOscillator(oscillator);
            return oscillator;
        };

        // Override createAnalyser
        if (!this.originalMethods.has('createAnalyser')) {
            this.originalMethods.set('createAnalyser', audioContext.createAnalyser);
        }

        audioContext.createAnalyser = () => {
            const analyser = this.originalMethods.get('createAnalyser').call(audioContext);
            this.protectAnalyser(analyser);
            return analyser;
        };

        // Override createBuffer
        if (!this.originalMethods.has('createBuffer')) {
            this.originalMethods.set('createBuffer', audioContext.createBuffer);
        }

        audioContext.createBuffer = (numberOfChannels, length, sampleRate) => {
            const buffer = this.originalMethods.get('createBuffer').call(audioContext, numberOfChannels, length, sampleRate);
            this.protectBuffer(buffer);
            return buffer;
        };

        // Override getChannelData
        if (!this.originalMethods.has('getChannelData')) {
            this.originalMethods.set('getChannelData', AudioBuffer.prototype.getChannelData);
        }

        AudioBuffer.prototype.getChannelData = function(channel) {
            const data = this.originalMethods.get('getChannelData').call(this, channel);
            
            if (window.audioFingerprintProtection && window.audioFingerprintProtection.enabled) {
                return window.audioFingerprintProtection.modifyAudioData(data);
            }
            
            return data;
        };
    }

    /**
     * Protect OscillatorNode
     */
    protectOscillatorNode() {
        // Override frequency setter
        if (!this.originalMethods.has('oscillatorFrequency')) {
            this.originalMethods.set('oscillatorFrequency', Object.getOwnPropertyDescriptor(AudioParam.prototype, 'value'));
        }

        // Override frequency.value setter
        Object.defineProperty(AudioParam.prototype, 'value', {
            set: function(value) {
                if (window.audioFingerprintProtection && window.audioFingerprintProtection.enabled) {
                    // Add subtle randomization to frequency
                    const randomFactor = 1 + (Math.random() - 0.5) * 0.001; // 0.05% variation
                    value = value * randomFactor;
                }
                this.originalMethods.get('oscillatorFrequency').set.call(this, value);
            },
            get: function() {
                return this.originalMethods.get('oscillatorFrequency').get.call(this);
            }
        });
    }

    /**
     * Protect individual Oscillator
     */
    protectOscillator(oscillator) {
        // Override start method
        if (!this.originalMethods.has('oscillatorStart')) {
            this.originalMethods.set('oscillatorStart', oscillator.start);
        }

        oscillator.start = (when, offset, duration) => {
            if (this.enabled && this.randomizationLevel === 'high') {
                // Add subtle timing randomization
                const randomOffset = (Math.random() - 0.5) * 0.001; // ±0.5ms
                when = when ? when + randomOffset : undefined;
            }
            return this.originalMethods.get('oscillatorStart').call(oscillator, when, offset, duration);
        };
    }

    /**
     * Protect AudioBuffer
     */
    protectBuffer(buffer) {
        // Override copyFromChannel
        if (!this.originalMethods.has('copyFromChannel')) {
            this.originalMethods.set('copyFromChannel', buffer.copyFromChannel);
        }

        buffer.copyFromChannel = (destination, channelNumber, startInChannel) => {
            const result = this.originalMethods.get('copyFromChannel').call(buffer, destination, channelNumber, startInChannel);
            
            if (this.enabled && this.randomizationLevel === 'high') {
                // Modify the destination data slightly
                this.modifyAudioData(destination);
            }
            
            return result;
        };
    }

    /**
     * Protect AnalyserNode
     */
    protectAnalyser(analyser) {
        // Override getByteFrequencyData
        if (!this.originalMethods.has('getByteFrequencyData')) {
            this.originalMethods.set('getByteFrequencyData', analyser.getByteFrequencyData);
        }

        analyser.getByteFrequencyData = (array) => {
            const result = this.originalMethods.get('getByteFrequencyData').call(analyser, array);
            
            if (this.enabled && this.randomizationLevel !== 'low') {
                // Add subtle noise to frequency data
                this.addNoiseToArray(array);
            }
            
            return result;
        };

        // Override getByteTimeDomainData
        if (!this.originalMethods.has('getByteTimeDomainData')) {
            this.originalMethods.set('getByteTimeDomainData', analyser.getByteTimeDomainData);
        }

        analyser.getByteTimeDomainData = (array) => {
            const result = this.originalMethods.get('getByteTimeDomainData').call(analyser, array);
            
            if (this.enabled && this.randomizationLevel !== 'low') {
                // Add subtle noise to time domain data
                this.addNoiseToArray(array);
            }
            
            return result;
        };
    }

    /**
     * Modify audio data to prevent fingerprinting
     */
    modifyAudioData(data) {
        if (this.randomizationLevel === 'low') {
            return data;
        }

        const modifiedData = new Float32Array(data);
        
        // Add subtle noise to prevent exact fingerprinting
        for (let i = 0; i < modifiedData.length; i++) {
            if (this.randomizationLevel === 'high') {
                // High level: more noise
                const noise = (Math.random() - 0.5) * 0.0001;
                modifiedData[i] += noise;
            } else {
                // Medium level: minimal noise
                const noise = (Math.random() - 0.5) * 0.00001;
                modifiedData[i] += noise;
            }
        }
        
        return modifiedData;
    }

    /**
     * Add noise to byte arrays
     */
    addNoiseToArray(array) {
        for (let i = 0; i < array.length; i++) {
            if (this.randomizationLevel === 'high') {
                // High level: more noise
                const noise = Math.floor((Math.random() - 0.5) * 2);
                array[i] = Math.max(0, Math.min(255, array[i] + noise));
            } else {
                // Medium level: minimal noise
                const noise = Math.floor((Math.random() - 0.5) * 0.5);
                array[i] = Math.max(0, Math.min(255, array[i] + noise));
            }
        }
    }

    /**
     * Create fake audio fingerprint
     */
    createFakeAudioFingerprint() {
        const fakeCanvas = document.createElement('canvas');
        fakeCanvas.width = 100;
        fakeCanvas.height = 100;
        
        const ctx = fakeCanvas.getContext('2d');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('Audio Protected', 10, 50);
        
        return fakeCanvas.toDataURL();
    }

    /**
     * Test audio fingerprint protection
     */
    testProtection() {
        const results = {
            enabled: this.enabled,
            randomizationLevel: this.randomizationLevel,
            tests: [],
            recommendations: []
        };

        // Test 1: AudioContext creation
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            results.tests.push({
                name: 'AudioContext Creation',
                status: 'success',
                message: 'AudioContext created successfully'
            });
            
            audioContext.close();
        } catch (error) {
            results.tests.push({
                name: 'AudioContext Creation',
                status: 'error',
                message: 'Failed to create AudioContext: ' + error.message
            });
        }

        // Test 2: Oscillator creation
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            
            results.tests.push({
                name: 'Oscillator Creation',
                status: 'success',
                message: 'Oscillator created successfully'
            });
            
            oscillator.disconnect();
            audioContext.close();
        } catch (error) {
            results.tests.push({
                name: 'Oscillator Creation',
                status: 'error',
                message: 'Failed to create oscillator: ' + error.message
            });
        }

        // Test 3: Audio buffer manipulation
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const buffer = audioContext.createBuffer(1, 1024, 44100);
            const channelData = buffer.getChannelData(0);
            
            results.tests.push({
                name: 'Audio Buffer',
                status: 'success',
                message: 'Audio buffer created and accessed successfully'
            });
            
            audioContext.close();
        } catch (error) {
            results.tests.push({
                name: 'Audio Buffer',
                status: 'error',
                message: 'Failed to create audio buffer: ' + error.message
            });
        }

        // Add recommendations
        if (!this.enabled) {
            results.recommendations.push('Enable audio fingerprint protection for enhanced privacy');
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
            protectedAudioContexts: this.audioContexts.size,
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
        console.log('🎵 Audio fingerprint protection enabled');
    }

    /**
     * Disable protection
     */
    disable() {
        this.enabled = false;
        this.restoreOriginalMethods();
        this.saveSettings();
        console.log('🎵 Audio fingerprint protection disabled');
    }

    /**
     * Restore original methods
     */
    restoreOriginalMethods() {
        // Restore AudioContext
        if (this.originalMethods.has('AudioContext')) {
            window.AudioContext = this.originalMethods.get('AudioContext');
            if (window.webkitAudioContext) {
                window.webkitAudioContext = window.AudioContext;
            }
        }

        // Restore AudioParam value setter
        if (this.originalMethods.has('oscillatorFrequency')) {
            Object.defineProperty(AudioParam.prototype, 'value', this.originalMethods.get('oscillatorFrequency'));
        }

        // Restore AudioBuffer methods
        if (this.originalMethods.has('copyFromChannel')) {
            AudioBuffer.prototype.copyFromChannel = this.originalMethods.get('copyFromChannel');
        }

        if (this.originalMethods.has('getChannelData')) {
            AudioBuffer.prototype.getChannelData = this.originalMethods.get('getChannelData');
        }

        // Restore AnalyserNode methods
        this.audioContexts.forEach(audioContext => {
            if (this.originalMethods.has('createOscillator')) {
                audioContext.createOscillator = this.originalMethods.get('createOscillator');
            }
            if (this.originalMethods.has('createAnalyser')) {
                audioContext.createAnalyser = this.originalMethods.get('createAnalyser');
            }
            if (this.originalMethods.has('createBuffer')) {
                audioContext.createBuffer = this.originalMethods.get('createBuffer');
            }
        });
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
            localStorage.setItem('cb_audio_protection', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving audio protection settings:', error);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('cb_audio_protection');
            if (saved) {
                const settings = JSON.parse(saved);
                this.enabled = settings.enabled || false;
                this.randomizationLevel = settings.randomizationLevel || 'medium';
            }
        } catch (error) {
            console.error('Error loading audio protection settings:', error);
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
        console.log('🎵 Audio protection settings reset to defaults');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioFingerprintProtection;
} else {
    // Browser environment
    window.AudioFingerprintProtection = AudioFingerprintProtection;
}
