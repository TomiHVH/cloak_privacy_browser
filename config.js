// Configuration and constants for minimal browser
export const KEY = 'MB:5:'; // window.name fallback
export const PAD = 52;      // reserved top space for the bar
export const MAX_TABS = 30;
export const MAX_BOOKMARKS = 100;
export const MAX_HISTORY = 1000;

// Performance optimizations
export const RENDER_THROTTLE = 16; // ~60fps
export const STATE_UPDATE_THROTTLE = 2000; // 2 seconds between state updates
export const MAX_REFRESH_LOOPS = 5;

// Security: Enhanced URL validation patterns
export const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:', 'ftp:', 'mailto:', 'tel:'];
export const ALLOWED_PROTOCOLS = ['http:', 'https:', 'ipfs:', 'ipns:'];

// Minimalistic sans-serif font stack used across the browser UI
export const FONT_STACK = "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', ui-sans-serif, system-ui, -apple-system, sans-serif";

// Default user preferences
export const DEFAULT_PREFERENCES = {
  theme: 'dark',
  fontScale: 1,
  fontWeight: 600,
  density: 'compact', // 'compact' | 'comfortable'
  engine: 'duckduckgo',
  home: 'about:blank',
  startup: 'restore', // 'restore' | 'home'
  httpsOnly: true,
  blockTrackers: true,
  web3Enabled: false,
  web3RpcUrl: 'https://cloudflare-eth.com',
  web3ChainId: '0x1', // Ethereum mainnet
  ipfsGateway: 'https://cloudflare-ipfs.com'
};

// Search engine configurations
export const SEARCH_ENGINES = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  brave: 'https://search.brave.com/search?q='
};

// Search engine shortcuts
export const SEARCH_SHORTCUTS = {
  'g': 'https://www.google.com/search?q=',
  'y': 'https://www.youtube.com/results?search_query=',
  'w': 'https://wikipedia.org/wiki/',
  'd': 'https://duckduckgo.com/?q=',
  'gh': 'https://github.com/search?q=',
  'r': 'https://reddit.com/search?q=',
  't': 'https://x.com/search?q=',
  'ud': 'https://www.urbandictionary.com/define.php?term=',
  'a': 'https://www.amazon.com/s?k=',
  'n': 'https://news.ycombinator.com/from?site=',
  's': 'https://stackoverflow.com/search?q='
};

// Search engine fallbacks
export const SEARCH_ENGINE_FALLBACKS = [
  'https://www.google.com',
  'https://search.brave.com',
  'https://www.bing.com'
];

// Basic tracker blocklist (hostname substrings)
export const TRACKER_SNIPPETS = [
  'doubleclick.net', 'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
  'facebook.net', 'connect.facebook.net', 'adsystem.com', 'adservice.google.com', 'scorecardresearch.com',
  'taboola.com', 'outbrain.com', 'hotjar.com', 'quantserve.com', 'analytics.', 'metrics.'
];
