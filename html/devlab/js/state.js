// === GLOBAL STATE MANAGEMENT ===

export const state = {
    currentLang: 'ru',
    currentTheme: 'dark',
    currentCategory: 'workspace',
    focusedServiceIndex: -1,
    allServiceLinks: [],

    // Sidebar
    sidebarWidth: 300,
    sidebarCollapsed: false,

    // Settings (defaults must exist or render.js produces `undefined`)
    nebulaOpacity: 0.3,
    particleDensity: 80,
    iconHue: '200',
    iconSat: '80%',
    iconLight: '60%',
    cardsPerRow: 3,

    // Bookmarks list of service keys
    bookmarks: [],

    // OTEL metrics update interval in milliseconds (default 30s, range 5000-180000)
    updateInterval: 30000,

    // Tree controls
    treeSort: 'default',
    currentView: 'home',
    cardOrder: {},  // { categoryKey: [serviceKey, serviceKey, ...] }

    // Detail panel
    detailService: null,   // service key currently open in detail panel
    detailTab: 'logs',     // active tab in detail panel

    // Recently visited services (for quick-switch)
    recentServices: [],    // array of service keys, most recent first

    // Service notes: { serviceKey: "note text" }
    serviceNotes: {},

    // Health timeline period in days
    healthPeriod: 7
};

// State change listeners
const listeners = new Set();

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function setState(updates) {
    Object.assign(state, updates);
    persistState(updates);
    listeners.forEach(listener => listener(state));
}

export function getState() {
    return { ...state };
}

// Persistence map: state-key -> localStorage-key
const PERSIST_MAP = {
    currentTheme: 'theme',
    currentLang: 'lang',
    sidebarWidth: 'sidebar-width',
    sidebarCollapsed: 'sidebar-collapsed',
    nebulaOpacity: 'nebula-opacity',
    particleDensity: 'particle-density',
    iconHue: 'icon-hue',
    iconSat: 'icon-sat',
    iconLight: 'icon-light',
    updateInterval: 'update-interval',
    cardsPerRow: 'cards-per-row',
    bookmarks: 'bookmarks',
    treeSort: 'tree-sort',
    currentView: 'last-view',
    cardOrder: 'card-order',
    recentServices: 'recent-services',
    serviceNotes: 'service-notes',
    healthPeriod: 'health-period'
};

function persistState(updates) {
    try {
        for (const k of Object.keys(updates)) {
            const lsKey = PERSIST_MAP[k];
            if (lsKey === undefined) continue;
            const v = updates[k];
            localStorage.setItem(lsKey, (typeof v === 'object') ? JSON.stringify(v) : String(v));
        }
    } catch (e) { /* ignore quota / privacy mode */ }
}

// Initialize state from localStorage
export function loadState() {
    const get = (k, def) => {
        const v = localStorage.getItem(k);
        return v === null ? def : v;
    };

    const savedTheme = get('theme', 'dark');
    const savedLang = get('lang', 'ru');
    const savedWidth = parseInt(get('sidebar-width', '300'), 10);
    const savedCollapsed = get('sidebar-collapsed', 'false') === 'true';
    const savedNebula = parseFloat(get('nebula-opacity', '0.3'));
    const savedDensity = parseInt(get('particle-density', '80'), 10);
    const savedHue = get('icon-hue', '200');
    const savedSat = get('icon-sat', '80%');
    const savedLight = get('icon-light', '60%');
    const savedInterval = parseInt(get('update-interval', '30000'), 10);
    const savedCardsPerRow = parseInt(get('cards-per-row', '3'), 10);
    let savedBookmarks = [];
    try { savedBookmarks = JSON.parse(get('bookmarks', '[]') || '[]'); } catch(_) {}
    const savedSort  = get('tree-sort', 'default');
    let savedView    = get('last-view', 'home');
    if (savedView === 'down') savedView = 'alerts';
    let savedOrder = {};
    try { savedOrder = JSON.parse(get('card-order', '{}') || '{}') || {}; } catch(_) {}
    let savedRecent = [];
    try { savedRecent = JSON.parse(get('recent-services', '[]') || '[]'); } catch(_) {}
    let savedNotes = {};
    try { savedNotes = JSON.parse(get('service-notes', '{}') || '{}'); } catch(_) {}
    const savedHealthPeriod = parseInt(get('health-period', '7'), 10);

    Object.assign(state, {
        currentTheme: savedTheme,
        currentLang: savedLang,
        sidebarWidth: Number.isFinite(savedWidth) ? savedWidth : 300,
        sidebarCollapsed: savedCollapsed,
        nebulaOpacity: Number.isFinite(savedNebula) ? savedNebula : 0.3,
        particleDensity: Number.isFinite(savedDensity) ? savedDensity : 80,
        iconHue: savedHue,
        iconSat: savedSat,
        iconLight: savedLight,
        updateInterval: (savedInterval >= 5000 && savedInterval <= 180000) ? savedInterval : 30000,
        cardsPerRow: (savedCardsPerRow >= 1 && savedCardsPerRow <= 5) ? savedCardsPerRow : 3,
        bookmarks: Array.isArray(savedBookmarks) ? savedBookmarks : [],
        treeSort: ['default','alpha','count'].includes(savedSort) ? savedSort : 'default',
        currentView: savedView,
        cardOrder: savedOrder,
        recentServices: Array.isArray(savedRecent) ? savedRecent.slice(0, 10) : [],
        serviceNotes: (savedNotes && typeof savedNotes === 'object') ? savedNotes : {},
        healthPeriod: [1,3,7,14,30].includes(savedHealthPeriod) ? savedHealthPeriod : 7
    });

    document.body.dataset.theme = savedTheme;
    document.documentElement.style.setProperty('--nebula-opacity', state.nebulaOpacity);
    document.documentElement.style.setProperty('--particle-density', state.particleDensity);
    document.documentElement.style.setProperty('--icon-color-hue', state.iconHue);
    document.documentElement.style.setProperty('--icon-color-sat', state.iconSat);
    document.documentElement.style.setProperty('--icon-color-light', state.iconLight);
    document.documentElement.style.setProperty('--cards-per-row', state.cardsPerRow);
}
