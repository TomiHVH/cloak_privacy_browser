import { FONT_STACK } from './config.js';

// Theme management system
export class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.currentFontScale = 1;
    this.currentFontWeight = 600;
    this.currentDensity = 'compact';
    
    this.themes = {
      dark: {
        bar: '#0f0f0f',
        text: '#f5f5f5',
        input: '#151515',
        button: '#1a1a1a',
        active: '#232323',
        error: '#ff4444',
        success: '#44ff44',
        warning: '#ffaa00'
      },
      light: {
        bar: '#f5f5f5',
        text: '#333',
        input: '#ffffff',
        button: '#e6e6e6',
        active: '#dcdcdc',
        error: '#cc0000',
        success: '#00cc00',
        warning: '#cc6600'
      }
    };
  }

  // Get current theme object
  getCurrentTheme() {
    return this.themes[this.currentTheme];
  }

  // Get current theme name
  getCurrentThemeName() {
    return this.currentTheme;
  }

  // Toggle between dark and light themes
  toggleTheme() {
    const oldTheme = this.currentTheme;
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mb_theme', this.currentTheme);
    
    // Return the old theme for transition effects
    return oldTheme;
  }

  // Set specific theme
  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = themeName;
      localStorage.setItem('mb_theme', themeName);
      return true;
    }
    return false;
  }

  // Get font scale
  getFontScale() {
    return this.currentFontScale;
  }

  // Set font scale
  setFontScale(scale) {
    this.currentFontScale = Math.min(1.3, Math.max(0.9, scale));
    localStorage.setItem('mb_font_scale', this.currentFontScale.toString());
  }

  // Get font weight
  getFontWeight() {
    return this.currentFontWeight;
  }

  // Set font weight
  setFontWeight(weight) {
    this.currentFontWeight = Math.min(800, Math.max(400, weight));
    localStorage.setItem('mb_font_weight', this.currentFontWeight.toString());
  }

  // Get density setting
  getDensity() {
    return this.currentDensity;
  }

  // Set density setting
  setDensity(density) {
    if (density === 'compact' || density === 'comfortable') {
      this.currentDensity = density;
      localStorage.setItem('mb_density', density);
    }
  }

  // Get padding height based on density
  getPad() {
    return this.currentDensity === 'compact' ? 44 : 52;
  }

  // Load theme preferences from localStorage
  loadPreferences() {
    try {
      const savedTheme = localStorage.getItem('mb_theme');
      if (savedTheme && this.themes[savedTheme]) {
        this.currentTheme = savedTheme;
      }
      
      const fs = parseFloat(localStorage.getItem('mb_font_scale'));
      if (!isNaN(fs)) {
        this.currentFontScale = Math.min(1.3, Math.max(0.9, fs));
      }
      
      const fw = parseInt(localStorage.getItem('mb_font_weight'), 10);
      if (!isNaN(fw)) {
        this.currentFontWeight = Math.min(800, Math.max(400, fw));
      }
      
      const dens = localStorage.getItem('mb_density');
      if (dens === 'compact' || dens === 'comfortable') {
        this.currentDensity = dens;
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }
  }

  // Generate CSS for the current theme
  generateThemeCSS() {
    const theme = this.getCurrentTheme();
    const pad = this.getPad();
    
    return `
      /* Top bar styling to match minimal dark browser look */
      #bar{height:${pad}px;display:flex;flex-direction:column;gap:6px;align-items:stretch;padding:6px 8px 8px;background:${theme.bar};color:${theme.text};font:${14*this.currentFontScale}px ${FONT_STACK};font-weight:${this.currentFontWeight};pointer-events:auto;border-bottom:1px solid ${theme.active};box-shadow:none;transition:all 0.3s ease;z-index:2147483647;position:relative}
      #row-top{display:flex;align-items:center;gap:10px;margin:0 0 1px 0;visibility:visible;opacity:1}
      #row-bottom{display:flex;align-items:center;gap:8px;visibility:visible;opacity:1}
      
      /* Tabs: compact, subtle rounded corners, hover/active states */
      #tabs{position:relative;display:flex;gap:10px;overflow-x:auto;max-width:70vw;padding:0 6px 2px;scroll-behavior:smooth;contain:layout paint;visibility:visible;opacity:1}
      #tab-indicator{position:absolute;bottom:-2px;height:2px;background:${theme.text};left:0;width:0;transition:left 240ms cubic-bezier(0.22, 1, 0.36, 1), width 240ms cubic-bezier(0.22, 1, 0.36, 1)}
      .tab{display:flex;gap:8px;align-items:center;padding:${this.currentDensity==='compact'?'8px 10px 6px':'10px 12px 8px'};border-radius:4px;background:${theme.button};cursor:pointer;white-space:nowrap;user-select:none;font-family:${FONT_STACK};font-weight:${this.currentFontWeight};border-bottom:2px solid transparent;color:${theme.text}CC;transition:background 320ms cubic-bezier(0.22, 1, 0.36, 1), color 320ms cubic-bezier(0.22, 1, 0.36, 1);will-change:transform}
      .tab.active{background:${theme.active};color:${theme.text}}
      .tab:hover{background:${theme.active};border-bottom-color:${theme.text}AA;transform:translateY(-1px)}
      .tab.dragging{opacity:0.6}
      .tab-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;max-width:22ch}
      .tab-favicon{width:14px;height:14px;flex-shrink:0;opacity:.9}
      .tab-close{opacity:0;cursor:pointer;padding:0 4px;border-radius:4px;transition:opacity 220ms ease}
      .tab:hover .tab-close{opacity:.9}
      .tab-close:hover{background:${theme.active}}

      /* Address bar and buttons */
      #url{flex:1;min-width:320px;padding:${this.currentDensity==='compact'?'6px 8px':'8px 10px'};border-radius:6px;border:1px solid ${theme.active};background:${theme.input};color:${theme.text};transition:all 0.15s ease;font-family:${FONT_STACK};font-weight:${this.currentFontWeight}}
      #url:focus{border-color:${theme.text};outline:none}
      button{padding:${this.currentDensity==='compact'?'6px 8px':'8px 10px'};border-radius:6px;border:1px solid ${theme.active};background:${theme.button};color:${theme.text};cursor:pointer;transition:background 0.15s ease,font-weight 0.15s ease;font-family:${FONT_STACK};font-weight:${Math.min(800,this.currentFontWeight)};display:inline-block;visibility:visible;opacity:1}
      button:hover{background:${theme.active}}
      button:disabled{opacity:0.5;cursor:not-allowed}
      .bookmark-btn.bookmarked{color:#ffd700}
      .nav-btn{font-size:16px;padding:4px 8px;display:inline-block;visibility:visible;opacity:1}

      #loading-indicator{display:none;width:16px;height:16px;border:2px solid transparent;border-top:2px solid ${theme.text};border-radius:50%;animation:spin 1s linear infinite}
      @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      .error-message{color:${theme.error};font-size:12px;margin-top:4px}
      .success-message{color:${theme.success};font-size:12px;margin-top:4px}
      .menu-btn{position:relative}
      .menu-dropdown{position:absolute;top:100%;right:0;background:${theme.bar};border:1px solid ${theme.active};border-radius:8px;padding:8px 0;min-width:200px;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:none;z-index:1000}
      .menu-dropdown.show{display:block}
      .menu-item{padding:8px 16px;cursor:pointer;transition:background 0.2s ease}
      .menu-item:hover{background:${theme.active}}
      .menu-separator{height:1px;background:${theme.active};margin:4px 0}
      
      /* Smooth scrolling for all elements */
      html{scroll-behavior:smooth}
      body{scroll-behavior:smooth}
      *{scroll-behavior:smooth}
      
      /* Custom scrollbar styling for better UX */
      ::-webkit-scrollbar{width:8px;height:8px}
      ::-webkit-scrollbar-track{background:${theme.button}40;border-radius:4px}
      ::-webkit-scrollbar-thumb{background:${theme.active}80;border-radius:4px;transition:background 0.2s ease}
      ::-webkit-scrollbar-thumb:hover{background:${theme.active}}
      ::-webkit-scrollbar-corner{background:${theme.button}40}
      
      /* Firefox scrollbar styling */
      *{scrollbar-width:thin;scrollbar-color:${theme.active}80 ${theme.button}40}
      
      /* Smooth scrolling for tab container */
      #tabs::-webkit-scrollbar{height:6px}
      #tabs::-webkit-scrollbar-track{background:transparent}
      #tabs::-webkit-scrollbar-thumb{background:${theme.active}60;border-radius:3px}
      #tabs::-webkit-scrollbar-thumb:hover{background:${theme.active}}

      /* Start overlay */
      #start-overlay{display:none}
    `;
  }

  // Get preferences object for saving
  getPreferences() {
    return {
      theme: this.currentTheme,
      fontScale: this.currentFontScale,
      fontWeight: this.currentFontWeight,
      density: this.currentDensity
    };
  }
}
