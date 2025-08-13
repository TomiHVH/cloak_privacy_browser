import { browser } from './ui-modular.js';

// Bootstrap the modular browser
async function bootstrap() {
  try {
    await browser.init();
    console.log('Modular browser initialized successfully');
  } catch (error) {
    console.error('Failed to initialize modular browser:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// Export for global access if needed
window.MinimalBrowser = browser;
