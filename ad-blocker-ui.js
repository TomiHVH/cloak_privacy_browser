e/**
 * Ad Blocker UI Manager
 * Provides a comprehensive user interface for managing ad blocking and filter lists
 * Integrated with both the aggressive ad blocker and filter list manager
 */

class AdBlockerUI {
    constructor() {
        this.adBlocker = null;
        this.filterListManager = null;
        this.uiContainer = null;
        this.isVisible = false;
        
        this.init();
    }

    async init() {
        // Wait for ad blocker to be available
        if (typeof window !== 'undefined' && window.adBlocker) {
            this.adBlocker = window.adBlocker;
        }
        
        if (typeof window !== 'undefined' && window.filterListManager) {
            this.filterListManager = window.filterListManager;
        }
        
        this.createUI();
        this.setupEventListeners();
        console.log('🔧 Ad Blocker UI initialized');
    }

    createUI() {
        // Create main container
        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'ad-blocker-ui';
        this.uiContainer.className = 'ad-blocker-ui';
        this.uiContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90vw;
            max-width: 800px;
            max-height: 90vh;
            background: #1a1a1a;
            border: 2px solid #333;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            z-index: 10000;
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #fff;
            overflow: hidden;
        `;

        this.uiContainer.innerHTML = `
            <div class="ad-blocker-header" style="
                background: linear-gradient(135deg, #2d2d2d, #1a1a1a);
                padding: 20px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #fff;">
                        🚫 Ad Blocker & Privacy Protection
                    </h2>
                    <p style="margin: 5px 0 0 0; color: #ccc; font-size: 14px;">
                        Comprehensive ad and tracker blocking powered by high-quality filter lists
                    </p>
                </div>
                <button id="ad-blocker-close" style="
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 5px;
                    transition: background 0.2s;
                ">&times;</button>
            </div>
            
            <div class="ad-blocker-content" style="
                padding: 20px;
                max-height: calc(90vh - 140px);
                overflow-y: auto;
            ">
                <!-- Status Overview -->
                <div class="status-overview" style="
                    background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    border: 1px solid #333;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #4CAF50; font-size: 18px;">
                        📊 Protection Status
                    </h3>
                    <div class="status-grid" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                    ">
                        <div class="status-item" style="
                            background: rgba(255,255,255,0.05);
                            padding: 15px;
                            border-radius: 6px;
                            text-align: center;
                        ">
                            <div class="status-value" id="ads-blocked-count" style="
                                font-size: 24px;
                                font-weight: bold;
                                color: #4CAF50;
                            ">0</div>
                            <div class="status-label" style="color: #ccc; font-size: 12px;">
                                Ads Blocked
                            </div>
                        </div>
                        <div class="status-item" style="
                            background: rgba(255,255,255,0.05);
                            padding: 15px;
                            border-radius: 6px;
                            text-align: center;
                        ">
                            <div class="status-value" id="trackers-blocked-count" style="
                                font-size: 24px;
                                font-weight: bold;
                                color: #FF9800;
                            ">0</div>
                            <div class="status-label" style="color: #ccc; font-size: 12px;">
                                Trackers Blocked
                            </div>
                        </div>
                        <div class="status-item" style="
                            background: rgba(255,255,255,0.05);
                            padding: 15px;
                            border-radius: 6px;
                            text-align: center;
                        ">
                            <div class="status-value" id="filter-rules-count" style="
                                font-size: 24px;
                                font-weight: bold;
                                color: #2196F3;
                            ">0</div>
                            <div class="status-label" style="color: #ccc; font-size: 12px;">
                                Active Filter Rules
                            </div>
                        </div>
                        <div class="status-item" style="
                            background: rgba(255,255,255,0.05);
                            padding: 15px;
                            border-radius: 6px;
                            text-align: center;
                        ">
                            <div class="status-value" id="blocking-level" style="
                                font-size: 24px;
                                font-weight: bold;
                                color: #9C27B0;
                            ">Aggressive</div>
                            <div class="status-label" style="color: #ccc; font-size: 12px;">
                                Blocking Level
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Controls -->
                <div class="quick-controls" style="
                    background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    border: 1px solid #333;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #4CAF50; font-size: 18px;">
                        ⚡ Quick Controls
                    </h3>
                    <div class="control-buttons" style="
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    ">
                        <button id="toggle-ad-blocker" class="control-btn" style="
                            background: linear-gradient(135deg, #4CAF50, #45a049);
                            border: none;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.2s;
                        ">Enable Ad Blocker</button>
                        
                        <button id="update-filter-lists" class="control-btn" style="
                            background: linear-gradient(135deg, #2196F3, #1976D2);
                            border: none;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.2s;
                        ">Update Filter Lists</button>
                        
                        <button id="clear-stats" class="control-btn" style="
                            background: linear-gradient(135deg, #FF9800, #F57C00);
                            border: none;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.2s;
                        ">Clear Statistics</button>
                        
                        <button id="test-blocking" class="control-btn" style="
                            background: linear-gradient(135deg, #9C27B0, #7B1FA2);
                            border: none;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.2s;
                        ">Test Blocking</button>
                    </div>
                </div>

                <!-- Filter Lists Management -->
                <div class="filter-lists" style="
                    background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    border: 1px solid #333;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #4CAF50; font-size: 18px;">
                        📋 Filter Lists Management
                    </h3>
                    <div class="filter-lists-container" id="filter-lists-container" style="
                        max-height: 300px;
                        overflow-y: auto;
                    ">
                        <div style="color: #ccc; text-align: center; padding: 20px;">
                            Loading filter lists...
                        </div>
                    </div>
                </div>

                <!-- Advanced Settings -->
                <div class="advanced-settings" style="
                    background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                    border-radius: 8px;
                    padding: 20px;
                    border: 1px solid #333;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #4CAF50; font-size: 18px;">
                        ⚙️ Advanced Settings
                    </h3>
                    <div class="settings-grid" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 15px;
                    ">
                        <div class="setting-item">
                            <label style="display: block; margin-bottom: 5px; color: #ccc;">
                                Blocking Level:
                            </label>
                            <select id="blocking-level-select" style="
                                width: 100%;
                                padding: 8px;
                                border-radius: 4px;
                                border: 1px solid #333;
                                background: #2a2a2a;
                                color: #fff;
                            ">
                                <option value="standard">Standard</option>
                                <option value="aggressive" selected>Aggressive</option>
                                <option value="strict">Strict</option>
                            </select>
                        </div>
                        
                        <div class="setting-item">
                            <label style="display: block; margin-bottom: 5px; color: #ccc;">
                                Auto-update Filter Lists:
                            </label>
                            <input type="checkbox" id="auto-update-filter-lists" checked style="
                                transform: scale(1.2;
                                margin-left: 10px;
                            ">
                        </div>
                        
                        <div class="setting-item">
                            <label style="display: block; margin-bottom: 5px; color: #ccc;">
                                Show Blocking Notifications:
                            </label>
                            <input type="checkbox" id="show-blocking-notifications" checked style="
                                transform: scale(1.2;
                                margin-left: 10px;
                            ">
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(this.uiContainer);
        
        // Add CSS for hover effects
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .control-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
            
            .status-item:hover {
                background: rgba(255,255,255,0.1) !important;
                transform: translateY(-2px);
                transition: all 0.2s;
            }
            
            .filter-list-item {
                background: rgba(255,255,255,0.05);
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 10px;
                border: 1px solid #333;
                transition: all 0.2s;
            }
            
            .filter-list-item:hover {
                background: rgba(255,255,255,0.1);
                border-color: #4CAF50;
            }
            
            .filter-list-item.enabled {
                border-left: 4px solid #4CAF50;
            }
            
            .filter-list-item.disabled {
                border-left: 4px solid #f44336;
                opacity: 0.7;
            }
            
            .filter-list-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .filter-list-name {
                font-weight: 600;
                color: #fff;
            }
            
            .filter-list-toggle {
                background: #4CAF50;
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .filter-list-toggle.disabled {
                background: #f44336;
            }
            
            .filter-list-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #ccc;
            }
            
            .filter-list-description {
                color: #999;
                font-size: 11px;
                margin-top: 5px;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Close button
        const closeBtn = this.uiContainer.querySelector('#ad-blocker-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Toggle ad blocker
        const toggleBtn = this.uiContainer.querySelector('#toggle-ad-blocker');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleAdBlocker());
        }

        // Update filter lists
        const updateBtn = this.uiContainer.querySelector('#update-filter-lists');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updateFilterLists());
        }

        // Clear stats
        const clearBtn = this.uiContainer.querySelector('#clear-stats');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearStats());
        }

        // Test blocking
        const testBtn = this.uiContainer.querySelector('#test-blocking');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testBlocking());
        }

        // Blocking level select
        const levelSelect = this.uiContainer.querySelector('#blocking-level-select');
        if (levelSelect) {
            levelSelect.addEventListener('change', (e) => this.setBlockingLevel(e.target.value));
        }

        // Auto-update checkbox
        const autoUpdateCheckbox = this.uiContainer.querySelector('#auto-update-filter-lists');
        if (autoUpdateCheckbox) {
            autoUpdateCheckbox.addEventListener('change', (e) => this.setAutoUpdate(e.target.checked));
        }

        // Show notifications checkbox
        const notificationsCheckbox = this.uiContainer.querySelector('#show-blocking-notifications');
        if (notificationsCheckbox) {
            notificationsCheckbox.addEventListener('change', (e) => this.setShowNotifications(e.target.checked));
        }

        // Close on outside click
        this.uiContainer.addEventListener('click', (e) => {
            if (e.target === this.uiContainer) {
                this.hide();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    show() {
        this.uiContainer.style.display = 'block';
        this.isVisible = true;
        this.updateUI();
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.uiContainer.style.display = 'none';
        this.isVisible = false;
        document.body.style.overflow = '';
    }

    async updateUI() {
        if (!this.adBlocker) return;

        // Update status counts
        const stats = this.adBlocker.getStats();
        
        const adsBlockedCount = this.uiContainer.querySelector('#ads-blocked-count');
        if (adsBlockedCount) {
            adsBlockedCount.textContent = stats.adsBlocked || 0;
        }

        const trackersBlockedCount = this.uiContainer.querySelector('#trackers-blocked-count');
        if (trackersBlockedCount) {
            trackersBlockedCount.textContent = stats.trackersBlocked || 0;
        }

        const filterRulesCount = this.uiContainer.querySelector('#filter-rules-count');
        if (filterRulesCount) {
            const filterStats = this.adBlocker.getFilterListStats();
            filterRulesCount.textContent = filterStats ? filterStats.activeRules : 0;
        }

        const blockingLevel = this.uiContainer.querySelector('#blocking-level');
        if (blockingLevel) {
            blockingLevel.textContent = this.adBlocker.blockingLevel || 'Aggressive';
        }

        // Update toggle button
        const toggleBtn = this.uiContainer.querySelector('#toggle-ad-blocker');
        if (toggleBtn) {
            if (this.adBlocker.enabled) {
                toggleBtn.textContent = 'Disable Ad Blocker';
                toggleBtn.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
            } else {
                toggleBtn.textContent = 'Enable Ad Blocker';
                toggleBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            }
        }

        // Update blocking level select
        const levelSelect = this.uiContainer.querySelector('#blocking-level-select');
        if (levelSelect) {
            levelSelect.value = this.adBlocker.blockingLevel || 'aggressive';
        }

        // Update filter lists
        await this.updateFilterListsUI();
    }

    async updateFilterListsUI() {
        const container = this.uiContainer.querySelector('#filter-lists-container');
        if (!container) return;

        try {
            const filterLists = this.adBlocker.getFilterLists();
            
            if (filterLists.length === 0) {
                container.innerHTML = '<div style="color: #ccc; text-align: center; padding: 20px;">No filter lists available</div>';
                return;
            }

            container.innerHTML = filterLists.map(filterList => `
                <div class="filter-list-item ${filterList.enabled ? 'enabled' : 'disabled'}">
                    <div class="filter-list-header">
                        <div class="filter-list-name">${filterList.name}</div>
                        <button class="filter-list-toggle ${filterList.enabled ? '' : 'disabled'}" 
                                data-id="${filterList.id}" 
                                onclick="window.adBlockerUI.toggleFilterList('${filterList.id}')">
                            ${filterList.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>
                    <div class="filter-list-description">${filterList.description}</div>
                    <div class="filter-list-info">
                        <span>Category: ${filterList.category}</span>
                        <span>Priority: ${filterList.priority}</span>
                        <span>Rules: ${filterList.ruleCount}</span>
                    </div>
                    <div class="filter-list-info">
                        <span>Last Updated: ${filterList.lastUpdated ? new Date(filterList.lastUpdated).toLocaleString() : 'Never'}</span>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            container.innerHTML = '<div style="color: #f44336; text-align: center; padding: 20px;">Error loading filter lists</div>';
        }
    }

    toggleAdBlocker() {
        if (!this.adBlocker) return;

        if (this.adBlocker.enabled) {
            this.adBlocker.disable();
        } else {
            this.adBlocker.enable();
        }

        this.updateUI();
    }

    async updateFilterLists() {
        if (!this.adBlocker) return;

        try {
            await this.adBlocker.updateFilterLists();
            this.updateUI();
            this.showNotification('Filter lists updated successfully!', 'success');
        } catch (e) {
            this.showNotification('Failed to update filter lists', 'error');
        }
    }

    clearStats() {
        if (!this.adBlocker) return;

        this.adBlocker.clearStats();
        this.updateUI();
        this.showNotification('Statistics cleared!', 'success');
    }

    testBlocking() {
        // Test with known ad/tracker domains
        const testUrls = [
            'https://doubleclick.net/test',
            'https://google-analytics.com/test',
            'https://facebook.net/test',
            'https://googletagmanager.com/test'
        ];

        let blockedCount = 0;
        testUrls.forEach(url => {
            if (this.adBlocker && this.adBlocker.isBlocked(url)) {
                blockedCount++;
            }
        });

        const message = `Blocking test completed: ${blockedCount}/${testUrls.length} test URLs blocked`;
        this.showNotification(message, blockedCount === testUrls.length ? 'success' : 'warning');
    }

    setBlockingLevel(level) {
        if (!this.adBlocker) return;

        this.adBlocker.setBlockingLevel(level);
        this.updateUI();
        this.showNotification(`Blocking level set to: ${level}`, 'success');
    }

    setAutoUpdate(enabled) {
        // Save setting to localStorage
        localStorage.setItem('ad_blocker_auto_update', enabled);
        this.showNotification(`Auto-update ${enabled ? 'enabled' : 'disabled'}`, 'info');
    }

    setShowNotifications(enabled) {
        // Save setting to localStorage
        localStorage.setItem('ad_blocker_show_notifications', enabled);
        this.showNotification(`Notifications ${enabled ? 'enabled' : 'disabled'}`, 'info');
    }

    toggleFilterList(id) {
        if (!this.adBlocker) return;

        const filterList = this.adBlocker.getFilterLists().find(fl => fl.id === id);
        if (!filterList) return;

        if (filterList.enabled) {
            this.adBlocker.disableFilterList(id);
        } else {
            this.adBlocker.enableFilterList(id);
        }

        this.updateFilterListsUI();
        this.showNotification(`${filterList.name} ${filterList.enabled ? 'enabled' : 'disabled'}`, 'success');
    }

    showNotification(message, type = 'info') {
        const showNotifications = localStorage.getItem('ad_blocker_show_notifications') !== 'false';
        if (!showNotifications) return;

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 10001;
            max-width: 300px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Export for global access
    static getInstance() {
        if (!AdBlockerUI.instance) {
            AdBlockerUI.instance = new AdBlockerUI();
        }
        return AdBlockerUI.instance;
    }
}

// Initialize and export
const adBlockerUI = AdBlockerUI.getInstance();

// Make available globally
if (typeof window !== 'undefined') {
    window.adBlockerUI = adBlockerUI;
}

export default adBlockerUI;
