import { FONT_STACK } from './config.js';

// Custom start page functionality
export class StartPage {
  constructor(themeManager) {
    this.themeManager = themeManager;
    this.overlay = null;
    this.searchInput = null;
    this.isVisible = false;
  }

  // Create the start page overlay
  createStartOverlay() {
    const start = document.createElement('div');
    start.id = 'start-overlay';
    
    const pad = this.themeManager.getPad();
    const theme = this.themeManager.getCurrentTheme();
    
    start.style.cssText = `
      position: fixed; top: ${pad}px; left: 0; right: 0; bottom: 0; display: none; align-items: center; justify-content: center;
      background: ${theme.bar}; pointer-events: none; z-index: 2147483645;
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
      font-family: ${FONT_STACK}; font-weight: 800; letter-spacing: 6px;
      font-size: 42px; color: white; margin-bottom: 24px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;

    const searchEl = document.createElement('input');
    searchEl.type = 'text';
    searchEl.placeholder = 'Search the web…';
    searchEl.style.cssText = `
      width: 100%; padding: 14px 16px; border-radius: 10px; border: 2px solid ${theme.active};
      background: ${theme.input}; color: ${theme.text}; font: 18px ${FONT_STACK}; transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    startInner.appendChild(titleEl);
    startInner.appendChild(searchEl);
    start.appendChild(startInner);

    // Add search bar animations
    this.addSearchAnimations(searchEl);

    this.overlay = start;
    this.searchInput = searchEl;
    
    return start;
  }

  // Add animations to the search bar
  addSearchAnimations(searchEl) {
    const theme = this.themeManager.getCurrentTheme();
    
    searchEl.addEventListener('focus', () => {
      searchEl.style.borderColor = theme.success;
      searchEl.style.boxShadow = `0 0 0 3px ${theme.success}40, 0 4px 12px rgba(0,0,0,0.15)`;
      searchEl.style.transform = 'scale(1.02)';
    });

    searchEl.addEventListener('blur', () => {
      searchEl.style.borderColor = theme.active;
      searchEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      searchEl.style.transform = 'scale(1)';
    });

    searchEl.addEventListener('mouseenter', () => {
      if (document.activeElement !== searchEl) {
        searchEl.style.borderColor = theme.warning;
        searchEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }
    });

    searchEl.addEventListener('mouseleave', () => {
      if (document.activeElement !== searchEl) {
        searchEl.style.borderColor = theme.active;
        searchEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }
    });
  }

  // Show the start page with fade-in animation
  show() {
    if (!this.overlay) return;
    
    this.overlay.style.display = 'flex';
    this.isVisible = true;
    
    // Trigger fade-in animation
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
      const startInner = this.overlay.querySelector('div');
      if (startInner) {
        startInner.style.transform = 'translateY(0)';
      }
    });
  }

  // Hide the start page with fade-out animation
  hide() {
    if (!this.overlay) return;
    
    this.overlay.style.opacity = '0';
    this.isVisible = false;
    
    const startInner = this.overlay.querySelector('div');
    if (startInner) {
      startInner.style.transform = 'translateY(20px)';
    }
    
    // Hide after animation completes
    setTimeout(() => {
      if (this.overlay.style.opacity === '0') {
        this.overlay.style.display = 'none';
      }
    }, 600);
  }

  // Update theme colors when theme changes
  updateTheme() {
    if (!this.overlay) return;
    
    const theme = this.themeManager.getCurrentTheme();
    this.overlay.style.background = theme.bar;
    
    if (this.searchInput) {
      this.searchInput.style.background = theme.input;
      this.searchInput.style.color = theme.text;
      this.searchInput.style.borderColor = theme.active;
    }
  }

  // Check if start page should be visible
  shouldShow(url) {
    return !url || /^(about:blank|chrome:\/\/newtab|edge:\/\/newtab)$/i.test(url) || url === 'about:blank';
  }

  // Get the search input element
  getSearchInput() {
    return this.searchInput;
  }

  // Check if start page is currently visible
  isStartPageVisible() {
    return this.isVisible;
  }

  // Set search input value
  setSearchValue(value) {
    if (this.searchInput) {
      this.searchInput.value = value || '';
    }
  }
}
