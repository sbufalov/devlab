import {
    services, categories, translations, topNavLinks, keyboardShortcuts,
    categoryInfo, homeInfo, serviceGroups
} from './config.js';
import { state, setState } from './state.js';
import { openDetailPanel } from './detail-panel.js';
import { fetchActivities, renderActivityItem } from './activities.js';
import { fetchHealthTimeline, renderHealthTimeline } from './health-timeline.js';

// ---------------------------------------------------------------------------
// Sort categories according to state.treeSort. The order is computed every
// render so changes to the dropdown re-render the tree.
// ---------------------------------------------------------------------------
export function sortedCategories() {
    const arr = categories.slice();
    if (state.treeSort === 'alpha') {
        const lang = state.currentLang;
        arr.sort((a, b) => {
            const la = (translations[lang][`tab-${a.key}`] || a.label).toLowerCase();
            const lb = (translations[lang][`tab-${b.key}`] || b.label).toLowerCase();
            return la.localeCompare(lb);
        });
    } else if (state.treeSort === 'count') {
        arr.sort((a, b) => categoryServiceList(b.key).length - categoryServiceList(a.key).length);
    }
    return arr;
}


// === RENDER BREADCRUMBS ===
export function renderBreadcrumbs() {
    const el = document.getElementById('breadcrumbs');
    if (!el) return;
    const lang = state.currentLang;
    const view = state.currentView || 'home';

    const crumbs = [
        { key: 'home', label: translations[lang]['tab-home'] || 'Home' }
    ];

    if (view === 'alerts') {
        crumbs.push({ key: 'alerts', label: translations[lang]['tab-alerts'] || 'Alerts' });
    } else if (view === 'bookmarks') {
        crumbs.push({ key: 'bookmarks', label: translations[lang]['tab-bookmarks'] || 'Bookmarks' });
    } else if (view === 'activities') {
        crumbs.push({ key: 'activities', label: translations[lang]['tab-activities'] || 'Activities' });
    } else if (view !== 'home') {
        const cat = categories.find(c => c.key === view);
        if (cat) {
            crumbs.push({ key: view, label: translations[lang][`tab-${view}`] || cat.label });
        }
    }

    if (state.detailService) {
        const svc = Object.values(services).flat().find(s => s.key === state.detailService);
        if (svc) crumbs.push({ key: `detail:${svc.key}`, label: svc.name });
    }

    el.innerHTML = crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return isLast
            ? `<span class="bc-current">${c.label}</span>`
            : `<a class="bc-link" data-view="${c.key}" href="#">${c.label}</a><span class="bc-sep">›</span>`;
    }).join('');
}

export function categoryServiceList(key) {
    return services[key] || [];
}

// === RENDER HEADER ===
export function renderHeader() {
    const header = document.getElementById('header');

    const navLinks = topNavLinks.map(link => {
        const labelHTML = link.label.startsWith('nav-')
            ? `<span data-i18n="${link.label}"></span>`
            : `<span>${link.label}</span>`;
        const iconHTML = link.icon
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${link.icon}</svg>`
            : '';
        return `<a href="${link.href}" class="nav-link">${iconHTML}${labelHTML}</a>`;
    }).join('');

    header.innerHTML = `
        <div class="logo">
            <svg class="logo-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            <span class="logo-text">Semantec</span>
        </div>

        <div class="header-controls">
            <div class="header-search-wrap">
                <svg class="header-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input type="text" class="header-search-input" id="header-search-input" placeholder="Search…" autocomplete="off" aria-label="Search services">
                <span class="kbd header-search-hint">/</span>
                <div class="header-search-dropdown" id="header-search-dropdown"></div>
            </div>

            <nav>${navLinks}</nav>

            <div class="control-group">
                <button class="toggle-btn" id="theme-toggle" aria-label="Toggle theme">
                    <svg class="theme-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    <svg class="theme-icon sun-icon" style="display: none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    <svg class="theme-icon system-icon" style="display: none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <span class="theme-label" data-i18n="theme-${state.currentTheme}">${state.currentTheme === 'system' ? 'Auto' : (state.currentTheme === 'dark' ? 'Dark' : 'Light')}</span>
                </button>

                <button class="toggle-btn" id="lang-toggle" aria-label="Toggle language">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <span class="lang-label">${state.currentLang.toUpperCase()}</span>
                </button>

                <button class="toggle-btn" id="help-btn" aria-label="Keyboard shortcuts">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
                        <line x1="6" y1="10" x2="6" y2="10"></line>
                        <line x1="10" y1="10" x2="10" y2="10"></line>
                        <line x1="14" y1="10" x2="14" y2="10"></line>
                        <line x1="18" y1="10" x2="18" y2="10"></line>
                        <line x1="6" y1="14" x2="6" y2="14"></line>
                        <line x1="18" y1="14" x2="18" y2="14"></line>
                        <line x1="9" y1="14" x2="15" y2="14"></line>
                    </svg>
                </button>

                <!-- Settings dropdown, far-right, icon-only -->
                <div class="dropdown-container header-settings">
                    <button class="toggle-btn toggle-btn--icon" id="settings-trigger" type="button" aria-label="Settings" aria-haspopup="menu" aria-expanded="false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </button>
                    ${renderSettingsPanelHTML()}
                </div>
            </div>
        </div>
    `;

    applyTranslations();
}

// Internal helper: settings dropdown content (now mounted in the header)
function renderSettingsPanelHTML() {
    return `
        <div class="settings-panel" id="settings-panel" role="menu">
            <div class="setting-group">
                <label class="setting-label" data-i18n="color-scheme">Icon Color Scheme</label>
                <div class="contrast-hint" id="contrast-hint" hidden></div>
                <div class="color-scheme-picker color-scheme-picker--compact">
                    <!-- Row 1: Theme accent + cool half of the wheel (well-spaced) -->
                    <button type="button" class="color-option theme" data-hue="187" data-sat="100%" data-light="50%" style="background:hsl(187,100%,50%)" title="Theme (cyan)"></button>
                    <button type="button" class="color-option"       data-hue="210" data-sat="90%"  data-light="62%" style="background:hsl(210,90%,62%)"  title="Sky"></button>
                    <button type="button" class="color-option"       data-hue="240" data-sat="80%"  data-light="68%" style="background:hsl(240,80%,68%)"  title="Indigo"></button>
                    <button type="button" class="color-option"       data-hue="270" data-sat="80%"  data-light="65%" style="background:hsl(270,80%,65%)"  title="Violet"></button>
                    <button type="button" class="color-option"       data-hue="305" data-sat="75%"  data-light="62%" style="background:hsl(305,75%,62%)"  title="Magenta"></button>

                    <!-- Row 2: Warm half (well-spaced) -->
                    <button type="button" class="color-option"       data-hue="340" data-sat="85%"  data-light="62%" style="background:hsl(340,85%,62%)"  title="Pink"></button>
                    <button type="button" class="color-option"       data-hue="6"   data-sat="85%"  data-light="60%" style="background:hsl(6,85%,60%)"    title="Red"></button>
                    <button type="button" class="color-option"       data-hue="28"  data-sat="90%"  data-light="58%" style="background:hsl(28,90%,58%)"   title="Orange"></button>
                    <button type="button" class="color-option"       data-hue="48"  data-sat="90%"  data-light="55%" style="background:hsl(48,90%,55%)"   title="Amber"></button>
                    <button type="button" class="color-option"       data-hue="80"  data-sat="65%"  data-light="55%" style="background:hsl(80,65%,55%)"   title="Olive"></button>

                    <!-- Row 3: Greens, teals, and monochrome -->
                    <button type="button" class="color-option"       data-hue="125" data-sat="65%"  data-light="50%" style="background:hsl(125,65%,50%)"  title="Green"></button>
                    <button type="button" class="color-option"       data-hue="155" data-sat="70%"  data-light="48%" style="background:hsl(155,70%,48%)"  title="Emerald"></button>
                    <button type="button" class="color-option"       data-hue="172" data-sat="80%"  data-light="42%" style="background:hsl(172,80%,42%)"  title="Teal"></button>
                    <button type="button" class="color-option"       data-hue="100" data-sat="50%"  data-light="80%" style="background:hsl(100,50%,80%)"  title="Mint"></button>
                    <button type="button" class="color-option mono"  data-hue="0"   data-sat="0%"   data-light="100%" title="Monochrome"></button>
                </div>
            </div>

            <div class="setting-group">
                <label class="setting-label" data-i18n="nebula-intensity">Nebula Intensity</label>
                <div class="slider-control">
                    <input type="range" id="nebula-slider" min="0" max="100" value="${state.nebulaOpacity * 100}" step="5">
                    <span class="slider-value"><span id="nebula-value">${state.nebulaOpacity * 100}</span>%</span>
                </div>
            </div>

            <div class="setting-group">
                <label class="setting-label" data-i18n="particle-density">Particle Density</label>
                <div class="slider-control">
                    <input type="range" id="density-slider" min="20" max="200" value="${state.particleDensity}" step="10">
                    <span class="slider-value"><span id="density-value">${state.particleDensity}</span> particles</span>
                </div>
            </div>

            <div class="setting-group">
                <label class="setting-label" data-i18n="update-interval">Metrics Update Interval</label>
                <div class="slider-control">
                    <input type="range" id="interval-slider" min="5000" max="180000" value="${state.updateInterval}" step="5000">
                    <span class="slider-value"><span id="interval-value">${state.updateInterval / 1000}</span> seconds</span>
                </div>
            </div>

            <div class="setting-group">
                <label class="setting-label" data-i18n="cards-per-row">Cards Per Row</label>
                <div class="slider-control">
                    <input type="range" id="cards-slider" min="1" max="5" value="${state.cardsPerRow}" step="1">
                    <span class="slider-value"><span id="cards-value">${state.cardsPerRow}</span> cards</span>
                </div>
            </div>
        </div>
    `;
}

// === RENDER FOOTER ===
export function renderFooter() {
    const footer = document.getElementById('footer');

    footer.innerHTML = `
        <div class="footer-copy">&copy; 2026 Semantec Inc. <span data-i18n="footer-text"></span></div>

        <div class="sys-info">
            <span class="sys-info-item" title="DNS server">
                <span class="sys-info-key">DNS</span>
                <span class="sys-info-value">CoreDNS</span>
            </span>
            <span class="sys-info-item" title="Reverse proxy">
                <span class="sys-info-key">Proxy</span>
                <span class="sys-info-value">Caddy</span>
            </span>
            <span class="sys-info-item" title="Network range">
                <span class="sys-info-key">Network</span>
                <span class="sys-info-value">192.168.0.0/24</span>
            </span>
            <span class="sys-info-item sys-info-item--uptime"
                  id="footer-uptime"
                  data-i18n-title="uptime-tooltip"
                  title="Average service availability over the last 24 hours">
                <span class="sys-info-key" data-i18n="uptime-label">Uptime</span>
                <span class="sys-info-value" id="footer-uptime-value">—</span>
            </span>
        </div>
    `;

    applyTranslations();
}

// === RENDER MODAL ===
export function renderModal() {
    const shortcutList = document.getElementById('shortcut-list');

    shortcutList.innerHTML = keyboardShortcuts.map(shortcut => `
        <div class="shortcut-item">
            <span data-i18n="${shortcut.action}"></span>
            <span class="kbd">${shortcut.key}</span>
        </div>
    `).join('');

    applyTranslations();
}

// === RENDER SIDEBAR ===
export function renderSidebar() {
    const sidebarContent = document.getElementById('sidebar-content');
    const sidebarCompact = document.getElementById('sidebar-compact');

    const activeView = state.currentView || 'home';

    // ----- Tree menu (sort + expand/collapse) -----
    const treeMenu = `
        <div class="tree-menu">
            <div class="tree-menu-group">
                <button class="tree-menu-btn" id="tree-expand-all" type="button" title="Expand all categories" aria-label="Expand all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9"></polyline>
                        <line x1="3" y1="4" x2="21" y2="4"></line>
                        <line x1="3" y1="20" x2="21" y2="20"></line>
                    </svg>
                </button>
                <button class="tree-menu-btn" id="tree-collapse-all" type="button" title="Collapse all categories" aria-label="Collapse all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="18 15 12 9 6 15"></polyline>
                        <line x1="3" y1="4" x2="21" y2="4"></line>
                        <line x1="3" y1="20" x2="21" y2="20"></line>
                    </svg>
                </button>
            </div>

            <div class="dropdown-container">
                <button class="tree-menu-btn tree-sort-btn" id="tree-sort-btn" type="button" aria-haspopup="menu" aria-expanded="false">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <line x1="3" y1="6"  x2="13" y2="6"></line>
                        <line x1="3" y1="12" x2="11" y2="12"></line>
                        <line x1="3" y1="18" x2="9"  y2="18"></line>
                        <polyline points="17 8 17 18 21 14"></polyline>
                        <line x1="17" y1="8" x2="13" y2="12"></line>
                    </svg>
                    <span class="tree-sort-label" data-i18n="sort-${state.treeSort}">${state.treeSort}</span>
                </button>
                <div class="tree-sort-menu" id="tree-sort-menu" role="menu">
                    <button type="button" role="menuitemradio" data-sort="default" class="${state.treeSort==='default'?'active':''}" data-i18n="sort-default">Default order</button>
                    <button type="button" role="menuitemradio" data-sort="alpha"   class="${state.treeSort==='alpha'  ?'active':''}" data-i18n="sort-alpha">Alphabetical</button>
                    <button type="button" role="menuitemradio" data-sort="count"   class="${state.treeSort==='count'  ?'active':''}" data-i18n="sort-count">By service count</button>
                </div>
            </div>
        </div>
    `;

    // ----- Home Page node (always first) -----
    const homeNode = `
        <div class="nav-home ${activeView === 'home' ? 'active' : ''}"
             data-view="home"
             data-hotkey="0"
             role="treeitem"
             tabindex="0"
             aria-label="Home Page">
            <svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 12l9-9 9 9"></path>
                <path d="M5 10v10h14V10"></path>
                <path d="M9 20v-6h6v6"></path>
            </svg>
            <span class="category-label" data-i18n="tab-home">Home</span>
        </div>
    `;

    // ----- Activities node -----
    const activitiesNode = `
        <div class="nav-home nav-activities ${activeView === 'activities' ? 'active' : ''}"
             data-view="activities"
             role="treeitem"
             tabindex="0"
             aria-label="Activities">
            <svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            <span class="category-label" data-i18n="tab-activities">Activities</span>
        </div>
    `;

    // ----- Alerts node (always second; uses same .nav-home base style) -----
    const alertsNode = `
        <div class="nav-home nav-alerts ${activeView === 'alerts' ? 'active' : ''}"
             data-view="alerts"
             data-hotkey="A"
             role="treeitem"
             tabindex="0"
             aria-label="Alerts">
            <svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span class="category-label" data-i18n="tab-alerts">Alerts</span>
        </div>
    `;

    // ----- Bookmarks node (always third) -----
    const bookmarksNode = `
        <div class="nav-home nav-bookmarks ${activeView === 'bookmarks' ? 'active' : ''}"
             data-view="bookmarks"
             data-hotkey="B"
             role="treeitem"
             tabindex="0"
             aria-label="Bookmarks">
            <svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="category-label" data-i18n="tab-bookmarks">Bookmarks</span>
        </div>
    `;

    // ----- Categories -----
    const cats = sortedCategories();
    const categoryHTML = cats.map((cat, idx) => {
        const serviceList = categoryServiceList(cat.key);
        const isActive = cat.key === activeView;
        const hotkey = idx < 9 ? String(idx + 1) : '';

        const linkHTML = serviceList.map((svc) => `
            <button type="button"
               class="service-link"
               data-service="${svc.key}"
               data-category="${cat.key}"
               data-href="${svc.instance || ''}"
               role="treeitem"
               tabindex="-1"
               title="${svc.name}">
                <span class="service-link-label">${svc.name}</span>
                <span class="service-status" aria-hidden="true"></span>
            </button>
        `).join('');

        return `
            <div class="nav-category" data-category="${cat.key}" role="group">
                <div class="category-header ${isActive ? 'expanded active' : ''}"
                     role="treeitem"
                     tabindex="0"
                     aria-expanded="${isActive ? 'true' : 'false'}"
                     data-category="${cat.key}"
                     data-hotkey="${hotkey}">
                    <svg class="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        ${cat.icon}
                    </svg>
                    <span class="category-label" data-i18n="tab-${cat.key}">${cat.label}</span>
                    <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
                <div class="service-links ${isActive ? 'open' : ''}" role="group">
                    <div class="service-links-inner">
                        ${linkHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    sidebarContent.innerHTML = `
        <div class="sidebar-header">
            <div class="search-container">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input type="text" class="search-input" placeholder="Search services... (S)" id="search-input" aria-label="Search services">
            </div>
            <button class="sidebar-toggle" id="sidebar-toggle-inline" type="button"
                    aria-label="Collapse sidebar" title="Toggle sidebar (H)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
        </div>

        ${treeMenu}

        <nav class="nav-tree" id="nav-tree" role="tree" aria-label="Services">
            ${homeNode}
            ${alertsNode}
            ${activitiesNode}
            ${bookmarksNode}
            ${categoryHTML}
        </nav>
    `;

    // Compact sidebar: Home + Alerts + category icons (no counts)
    const compactHTML = [
        `<button class="compact-category compact-home ${activeView === 'home' ? 'active' : ''}"
                 data-view="home" title="Home Page" aria-label="Home Page" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 12l9-9 9 9"></path>
                <path d="M5 10v10h14V10"></path>
                <path d="M9 20v-6h6v6"></path>
            </svg>
        </button>`,
        `<button class="compact-category compact-activities ${activeView === 'activities' ? 'active' : ''}"
                 data-view="activities" title="Activities" aria-label="Activities" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
        </button>`,
        `<button class="compact-category compact-alerts ${activeView === 'alerts' ? 'active' : ''}"
                 data-view="alerts" title="Alerts (A)" aria-label="Alerts" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        </button>`,
        `<button class="compact-category compact-bookmarks ${activeView === 'bookmarks' ? 'active' : ''}"
                 data-view="bookmarks" title="Bookmarks (B)" aria-label="Bookmarks" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>`,
        ...cats.map((cat, idx) => `
            <button class="compact-category ${cat.key === activeView ? 'active' : ''}"
                    data-category="${cat.key}"
                    title="${cat.label}${idx < 9 ? ' (' + (idx + 1) + ')' : ''}"
                    aria-label="${cat.label}"
                    type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    ${cat.icon}
                </svg>
            </button>
        `)
    ].join('');

    sidebarCompact.innerHTML = compactHTML;
    applyTranslations();
}

// === RENDER MAIN CONTENT ===
// Switches between the Home page and a category's cards
export function renderMain() {
    const view = state.currentView || 'home';
    renderBreadcrumbs();
    if (view === 'home') {
        renderHomePage();
    } else if (view === 'alerts') {
        renderAlertsPage();
    } else if (view === 'bookmarks') {
        renderBookmarksPage();
    } else if (view === 'activities') {
        renderActivitiesPage();
    } else {
        renderCategoryHeader(view);
        renderCards(view);
    }
}

const ALERTS_ICON_SVG = `
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
`;

function renderAlertsPage() {
    const hdr  = document.getElementById('main-header');
    const grid = document.getElementById('services-grid');
    const lang = state.currentLang;

    const title = translations[lang]['alerts-title'] || 'Alerts & Health';
    hdr.innerHTML = `
        <div class="page-header category-header-card">
            <div class="page-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    ${ALERTS_ICON_SVG}
                </svg>
            </div>
            <div class="page-header-text">
                <h1>${title}</h1>
                <p class="cta-text" data-i18n="alerts-subtitle">${
                    lang === 'ru'
                        ? 'Сводка здоровья инфраструктуры в режиме реального времени.'
                        : 'Real-time health snapshot of the infrastructure.'
                }</p>
            </div>
        </div>`;

    grid.classList.remove('home-grid');
    grid.classList.add('alerts-grid');
    grid.innerHTML = `
        <section class="alerts-section alerts-section--down" id="alerts-down">
            <header>
                <span class="alerts-pill alerts-pill--down" aria-hidden="true">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                        <line x1="12" y1="2" x2="12" y2="12"></line>
                    </svg>
                </span>
                <div class="service-title-group">
                    <h3 data-i18n="alerts-down-heading">Services Down</h3>
                    <div class="service-subtitle" data-i18n="alerts-down-subtitle">Early Detection of Unhealthy Services</div>
                </div>
                <span class="alerts-count" id="alerts-down-count">0</span>
            </header>
            <div class="alerts-body"></div>
        </section>

        <section class="alerts-section alerts-section--otel" id="alerts-otel">
            <header>
                <span class="alerts-pill alerts-pill--warn" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                </span>
                <div class="service-title-group">
                    <h3 data-i18n="alerts-otel-heading">Active Alerts</h3>
                    <div class="service-subtitle" data-i18n="alerts-otel-subtitle">Monitor Services via OTel & AlertManager</div>
                </div>
                <span class="alerts-count" id="alerts-otel-count">—</span>
            </header>
            <div class="alerts-body">
                <p class="alerts-loading" data-i18n="alerts-loading">Loading…</p>
            </div>
        </section>

        <section class="alerts-section alerts-section--top" id="alerts-top">
            <header>
                <span class="alerts-pill alerts-pill--info" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                </span>
                <div class="service-title-group">
                    <h3 data-i18n="alerts-top-heading">Resource Monitoring</h3>
                    <div class="service-subtitle" data-i18n="alerts-top-subtitle">Full CPU, RAM and NVMe usage statistics across all services</div>
                </div>
            </header>
            <div class="alerts-body">
                ${renderResourceTable()}
            </div>
        </section>
    `;

    // Health Timeline section
    const htSection = document.createElement('section');
    htSection.className = 'alerts-section alerts-section--ht';
    htSection.id = 'alerts-health-timeline';
    htSection.innerHTML = `
        <header>
            <span class="alerts-pill alerts-pill--info" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </span>
            <div class="service-title-group">
                <h3 data-i18n="health-timeline-title">Uptime History</h3>
                <div class="service-subtitle" data-i18n="health-timeline-subtitle">Service availability timeline over the selected period</div>
            </div>
            <div class="ht-period-control">
                <input type="range" id="ht-period-slider" min="1" max="30" value="${state.healthPeriod || 7}" step="1">
                <span class="ht-period-label"><span id="ht-period-value">${state.healthPeriod || 7}</span>d</span>
            </div>
        </header>
        <div class="alerts-body" id="ht-body">
            <div class="detail-loading">Loading…</div>
        </div>
    `;
    grid.appendChild(htSection);

    // Load health timeline
    const htBody = document.getElementById('ht-body');
    const htSlider = document.getElementById('ht-period-slider');
    const htValue = document.getElementById('ht-period-value');

    async function loadHealthTimeline(days) {
        htBody.innerHTML = '<div class="detail-loading">Loading…</div>';
        const timelines = await fetchHealthTimeline(days);
        renderHealthTimeline(timelines, htBody);
    }

    htSlider.addEventListener('input', (e) => {
        const days = parseInt(e.target.value, 10);
        htValue.textContent = days;
        setState({ healthPeriod: days });
    });
    htSlider.addEventListener('change', (e) => {
        loadHealthTimeline(parseInt(e.target.value, 10));
    });

    loadHealthTimeline(state.healthPeriod || 7);

    paintAlertsDown();
    setupResourceTableStatsListener();
    initTableEvents();
    updateResourceTableContent();
    paintAlertsOtel();

    applyTranslations();
}

// --- Build the full resource monitoring table ---
function renderResourceTable() {
    const lang = state.currentLang;
    const sortState = window.__resSortState || {};
    const filterState = window.__resFilterState || {};

    const columns = [
        { key: 'category',      label: 'th-category',        sortable: true },
        { key: 'service',       label: 'th-service',         sortable: true },
        { key: 'dockerCpu',     label: 'th-docker-cpu',      sortable: true, numeric: true },
        { key: 'systemCpu',     label: 'th-system-cpu',      sortable: true, numeric: true },
        { key: 'dockerRam',     label: 'th-docker-ram',      sortable: true, numeric: true },
        { key: 'systemRam',     label: 'th-system-ram',      sortable: true, numeric: true },
        { key: 'nvmeReadGB',    label: 'th-nvme-read-gb',    sortable: true, numeric: true },
        { key: 'nvmeWriteGB',   label: 'th-nvme-write-gb',   sortable: true, numeric: true }
    ];

    const headerHTML = columns.map(col => {
        const labelText = translations[lang][col.label] || col.label;
        const isSortedAsc = sortState.column === col.key && sortState.direction === 'asc';
        const isSortedDesc = sortState.column === col.key && sortState.direction === 'desc';
        const filterVal = filterState[col.key] || '';

        return `
            <th class="res-th" data-column="${col.key}" data-sortable="${col.sortable}">
                <div class="th-inner">
                    <div class="th-top-row">
                        <span class="th-label">${labelText}</span>
                        ${col.sortable ? `
                        <div class="sort-stacked">
                            <button class="sort-btn ${isSortedAsc ? 'active' : ''}" data-dir="asc" title="Sort ascending" aria-label="Sort ascending">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg>
                            </button>
                            <button class="sort-btn ${isSortedDesc ? 'active' : ''}" data-dir="desc" title="Sort descending" aria-label="Sort descending">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                        </div>` : ''}
                    </div>
                    <div class="th-bottom-row">
                        <input type="text" class="filter-input" value="${escapeHtml(filterVal)}" placeholder="…" data-filter="${col.key}" aria-label="Filter ${labelText}" autocomplete="off">
                    </div>
                </div>
            </th>`;
    }).join('');

    return `
        <div class="res-table-wrap">
            <table class="res-table" id="resource-table" role="grid" aria-label="Resource monitoring table">
                <thead>
                    <tr class="res-header-row">
                        ${headerHTML}
                    </tr>
                </thead>
                <tbody id="res-table-body">
                    <tr class="res-empty-row">
                        <td colspan="${columns.length}">
                            <span class="res-empty-msg">${translations[lang]['alerts-loading'] || 'Loading…'}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// --- 1) Down services ---
export function paintAlertsDown() {
    const lang = state.currentLang;
    const map  = window.__serviceStatus || {};
    const down = [];
    for (const [catKey, list] of Object.entries(services)) {
        for (const svc of list) {
            if (map[svc.key] === 'down') down.push({ svc, catKey });
        }
    }

    const root  = document.getElementById('alerts-down');
    if (!root) return;
    const body  = root.querySelector('.alerts-body');
    const count = root.querySelector('#alerts-down-count');
    count.textContent = down.length;
    root.classList.toggle('alerts-section--empty', down.length === 0);

    if (down.length === 0) {
        body.innerHTML = `<p class="alerts-empty" data-i18n="alerts-down-empty">${
            translations[lang]['alerts-down-empty'] || 'All services are healthy.'
        }</p>`;
        return;
    }

    body.innerHTML = '';
    const cards = document.createElement('div');
    cards.className = 'alerts-cards';
    down.forEach(({ svc, catKey }) => cards.appendChild(makeServiceCard(svc, catKey)));
    body.appendChild(cards);
}

// --- 2) OTel/VMAlert firing alerts ---
export async function paintAlertsOtel() {
    const root = document.getElementById('alerts-otel');
    if (!root) return;
    const body  = root.querySelector('.alerts-body');
    const count = root.querySelector('#alerts-otel-count');
    const lang  = state.currentLang;

    let alerts = [];
    try {
        const mod = await import('./api.js');
        alerts = await mod.fetchAlerts();
    } catch (_) { alerts = []; }

    if (state.currentView !== 'alerts' || !document.getElementById('alerts-otel')) return;

    count.textContent = alerts.length;
    root.classList.toggle('alerts-section--empty', alerts.length === 0);

    if (alerts.length === 0) {
        body.innerHTML = `<p class="alerts-empty" data-i18n="alerts-otel-empty">${
            translations[lang]['alerts-otel-empty'] || 'No active alerts.'
        }</p>`;
        return;
    }

    body.innerHTML = '<ul class="alerts-list">' + alerts.map(a => {
        const sev = ['critical','error','warning','info'].includes(a.severity) ? a.severity : 'warning';
        return `
            <li class="alert-row alert-row--${sev}">
                <span class="alert-sev" aria-label="${sev}">${sev[0].toUpperCase()}</span>
                <div class="alert-text">
                    <div class="alert-name">${escapeHtml(a.name)}</div>
                    ${a.summary  ? `<div class="alert-summary">${escapeHtml(a.summary)}</div>` : ''}
                    ${a.instance ? `<div class="alert-meta">on ${escapeHtml(a.instance)}</div>` : ''}
                </div>
            </li>`;
    }).join('') + '</ul>';
}

// --- 3) Resource monitoring table — populates when stats arrive ---
let _statsListenerSetup = false;
function setupResourceTableStatsListener() {
    if (_statsListenerSetup) return;
    _statsListenerSetup = true;

    document.addEventListener('stats:updated', () => {
        if (state.currentView !== 'alerts') return;
        updateResourceTableContent();
    });
}

// Render/update the table body content using the stored state
function updateResourceTableContent() {
    const tbody = document.getElementById('res-table-body');
    if (!tbody) return;

    const stats = window.__lastStats;
    const lang = state.currentLang;
    const rows = [];

    // Build rows for all services using config.js
    for (const [catKey, list] of Object.entries(services)) {
        for (const svc of list) {

            const key = svc.key.toLowerCase();
            const matchSeries = (map) => {
                if (!map) return undefined;
                const variants = [key, key.replace(/-/g, '_'), key.replace(/_/g, '-')];
                for (const v of variants) {
                    for (const [name, val] of map) {
                        if (name === v || name.includes(v) || v.includes(name)) return val;
                    }
                }
                return undefined;
            };

            const dockerCpu  = matchSeries(stats?.dockerCpu);
            const dockerRam  = matchSeries(stats?.dockerRam);
            const systemCpu  = matchSeries(stats?.systemCpu);
            const systemRam  = matchSeries(stats?.systemRam);
            const nvmeReadB  = matchSeries(stats?.nvmeReadB);
            const nvmeWriteB = matchSeries(stats?.nvmeWriteB);

            const catObj = categories.find(c => c.key === catKey);
            rows.push({
                category:    translations[lang][`tab-${catKey}`] || catKey,
                categoryKey: catKey,
                categoryIcon: catObj ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">${catObj.icon}</svg>` : '',
                service:     svc.name,
                serviceIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">${svc.icon}</svg>`,
                dockerCpu:   dockerCpu    !== undefined ? dockerCpu   : null,
                systemCpu:   systemCpu    !== undefined ? systemCpu   : null,
                dockerRam:   dockerRam    !== undefined ? dockerRam   : null,
                systemRam:   systemRam    !== undefined ? systemRam   : null,
                nvmeReadGB:  nvmeReadB    !== undefined ? nvmeReadB   : null,
                nvmeWriteGB: nvmeWriteB   !== undefined ? nvmeWriteB  : null
            });
        }
    }

    renderResourceTableBody(tbody, rows);
}

// Render table body with current sort/filter state
function renderResourceTableBody(tbody, rows) {
    const sortState = window.__resSortState || {};
    const filterState = window.__resFilterState || {};

    // Apply filters
    let filtered = rows;
    for (const [col, query] of Object.entries(filterState)) {
        if (!query) continue;
        const q = query.toLowerCase();
        filtered = filtered.filter(r => {
            const val = r[col];
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(q);
        });
    }

    // Apply sort
    const { column, direction } = sortState;
    if (column && direction) {
        filtered = filtered.slice().sort((a, b) => {
            const va = a[column];
            const vb = b[column];
            if (va === null && vb === null) return 0;
            if (va === null) return 1;
            if (vb === null) return -1;
            if (typeof va === 'number' && typeof vb === 'number') {
                return direction === 'asc' ? va - vb : vb - va;
            }
            const cmp = String(va).localeCompare(String(vb));
            return direction === 'asc' ? cmp : -cmp;
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="res-empty-cell" style="text-align:center;padding:24px;color:var(--text-muted);">No matching services</td></tr>`;
        return;
    }

    const fmt = (val, isGB = false) => {
        if (val === null || val === undefined) return '—';
        const n = isGB ? val : val;
        return Number.isFinite(n) ? (isGB ? n.toFixed(1) : n.toFixed(2)) : '—';
    };

    tbody.innerHTML = filtered.map(row => `
        <tr class="res-row" data-category="${row.categoryKey}">
            <td class="res-td res-td--cat"><span class="res-td-icon">${row.categoryIcon || ''}</span>${escapeHtml(row.category)}</td>
            <td class="res-td res-td--name"><span class="res-td-icon">${row.serviceIcon || ''}</span>${escapeHtml(row.service)}</td>
            <td class="res-td res-td--num">${fmt(row.dockerCpu)}</td>
            <td class="res-td res-td--num">${fmt(row.systemCpu)}</td>
            <td class="res-td res-td--num">${fmt(row.dockerRam)}</td>
            <td class="res-td res-td--num">${fmt(row.systemRam)}</td>
            <td class="res-td res-td--num">${fmt(row.nvmeReadGB, true)}</td>
            <td class="res-td res-td--num">${fmt(row.nvmeWriteGB, true)}</td>
        </tr>
    `).join('');
}

// Bind sorting & filtering events once on the table wrapper using event delegation
function initTableEvents() {
    const table = document.getElementById('resource-table');
    if (!table) return;

    // Delegate sort button clicks
    table.addEventListener('click', (e) => {
        const btn = e.target.closest('.sort-btn');
        if (!btn) return;
        e.stopPropagation();

        const th = btn.closest('.res-th');
        const col = th.dataset.column;
        const dir = btn.dataset.dir;

        // Update active sort button visual state in headers
        th.closest('tr').querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Persist sort state
        window.__resSortState = { column: col, direction: dir };

        // Re-render body
        updateResourceTableContent();
    });

    // Delegate filter input events
    table.addEventListener('input', (e) => {
        const input = e.target;
        if (!input.classList.contains('filter-input')) return;

        const col = input.dataset.filter;
        const query = input.value.trim();

        window.__resFilterState = window.__resFilterState || {};
        window.__resFilterState[col] = query;

        // Re-render body
        updateResourceTableContent();
    });
}

function escapeHtml(t) {
    return String(t).replace(/[&<>"']/g, c => (
        {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
    ));
}

// === HOME PAGE ===
function renderHomePage() {
    const grid = document.getElementById('services-grid');
    const hdr  = document.getElementById('main-header');

    hdr.innerHTML = `
        <div class="page-header home-header">
            <div class="page-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 12l9-9 9 9"></path>
                    <path d="M5 10v10h14V10"></path>
                    <path d="M9 20v-6h6v6"></path>
                </svg>
            </div>
            <div class="page-header-text">
                <h1>${homeInfo.title}</h1>
                <p class="cta-text">${homeInfo.tagline}</p>
            </div>
        </div>
    `;

    grid.classList.add('home-grid');
    grid.classList.remove('services-grid--cards', 'alerts-grid');
    grid.innerHTML = `
        <section class="home-card home-card--prose">
            ${homeInfo.body.map(p => `<p>${p}</p>`).join('')}
        </section>
        <section class="home-card home-card--stacks">
            <h3>Tech stacks</h3>
            <div class="stack-grid">
                ${homeInfo.stacks.map(s => `
                    <div class="stack">
                        <h4>${s.name}</h4>
                        <ul>${s.items.map(i => `<li>${i}</li>`).join('')}</ul>
                    </div>
                `).join('')}
            </div>
        </section>
        <section class="home-card home-card--links">
            <h3>References</h3>
            <div class="link-cloud">
                ${homeInfo.links.map(l => `
                    <a href="${l.href}" target="_blank" rel="noopener" class="ref-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        <span>${l.label}</span>
                    </a>
                `).join('')}
            </div>
        </section>
    `;
}


// === ACTIVITIES PAGE ===
async function renderActivitiesPage() {
    const hdr  = document.getElementById('main-header');
    const grid = document.getElementById('services-grid');
    const lang = state.currentLang;

    const title = translations[lang]['activities-title'] || 'Activity Feed';
    const subtitle = translations[lang]['activities-subtitle'] || 'GitLab commits, CI pipelines, and Plane tasks in a unified timeline.';

    hdr.innerHTML = `
        <div class="page-header category-header-card">
            <div class="page-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
            </div>
            <div class="page-header-text">
                <h1>${title}</h1>
                <p class="cta-text">${subtitle}</p>
            </div>
        </div>`;

    grid.classList.remove('home-grid', 'services-grid--cards');
    grid.classList.add('activities-grid');
    grid.innerHTML = `<div class="act-loading" data-i18n="activities-loading">${translations[lang]['activities-loading'] || 'Loading activity…'}</div>`;

    try {
        const items = await fetchActivities();
        if (items.length === 0) {
            grid.innerHTML = `<div class="act-empty">${translations[lang]['activities-empty'] || 'No recent activities.'}</div>`;
            return;
        }
        grid.innerHTML = `<div class="act-timeline">${items.map(renderActivityItem).join('')}</div>`;
    } catch (err) {
        grid.innerHTML = `<div class="act-empty">Error: ${err.message}</div>`;
    }
    applyTranslations();
}

// === CATEGORY HEADER ===
function renderCategoryHeader(categoryKey) {
    const hdr  = document.getElementById('main-header');
    const cat  = categories.find(c => c.key === categoryKey);
    if (!cat) { hdr.innerHTML = ''; return; }

    const info = categoryInfo[categoryKey] || { desc: { en: '', ru: '' }, links: [] };
    const lang = state.currentLang;
    const desc = (info.desc && (info.desc[lang] || info.desc.en)) || '';
    const count = categoryServiceList(categoryKey).length;
    const title = translations[lang][`tab-${categoryKey}`] || cat.label;

    hdr.innerHTML = `
        <div class="page-header category-header-card">
            <div class="page-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    ${cat.icon}
                </svg>
            </div>
            <div class="page-header-text">
                <h1>${title} <span class="page-header-count">${count}</span></h1>
                <p class="cta-text" title="${desc.replace(/"/g, '&quot;')}">${desc}</p>
                ${info.links && info.links.length ? `
                    <div class="page-header-links">
                        ${info.links.map(l => `
                            <a href="${l.href}" target="_blank" rel="noopener" class="ref-link ref-link--inline">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                </svg>
                                <span>${l.label}</span>
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// === RENDER CARDS ===
export function renderCards(categoryKey) {
    const view = categoryKey || state.currentView || 'home';
    if (view === 'home') return renderHomePage();

    const grid = document.getElementById('services-grid');
    grid.classList.remove('home-grid', 'alerts-grid');
    grid.classList.add('services-grid--cards');
    grid.innerHTML = '';

    let serviceList = categoryServiceList(view);
    // Apply per-category drag-and-drop order if available
    const saved = state.cardOrder && state.cardOrder[view];
    if (Array.isArray(saved) && saved.length) {
        const idx = new Map(saved.map((k, i) => [k, i]));
        serviceList = serviceList.slice().sort((a, b) => {
            const ai = idx.has(a.key) ? idx.get(a.key) : 9999;
            const bi = idx.has(b.key) ? idx.get(b.key) : 9999;
            return ai - bi;
        });
    }

    // Group services if any have group fields
    const hasGroups = serviceList.some(s => s.group);
    if (hasGroups) {
        const groups = {};
        serviceList.forEach(svc => {
            const g = svc.group || '__ungrouped__';
            if (!groups[g]) groups[g] = [];
            groups[g].push(svc);
        });
        // Sort groups by order
        const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
            const oa = serviceGroups[a]?.order ?? 999;
            const ob = serviceGroups[b]?.order ?? 999;
            return oa - ob;
        });
        sortedGroupKeys.forEach(gKey => {
            if (gKey !== '__ungrouped__' && serviceGroups[gKey]) {
                const label = translations[state.currentLang][serviceGroups[gKey].label] || gKey;
                const groupHeader = document.createElement('div');
                groupHeader.className = 'service-group-header';
                groupHeader.innerHTML = `<span class="service-group-label">${label}</span>`;
                grid.appendChild(groupHeader);
            }
            groups[gKey].forEach(svc => {
                grid.appendChild(makeServiceCard(svc, findCategoryFor(svc.key) || view));
            });
        });
    } else {
        serviceList.forEach((service) => {
            grid.appendChild(makeServiceCard(service, findCategoryFor(service.key) || view));
        });
    }

    applyTranslations();
}

// Returns localized description based on current language.
// Falls back: English (descEn) for 'en' mode, Russian (desc) otherwise.
function getLocalizedDescription(service) {
    const lang = state.currentLang;
    if (lang === 'en' && service.descEn) return service.descEn;
    return service.desc || '';
}

function makeServiceCard(service, categoryKey) {
    const card = document.createElement('div');
    card.className = `service-card loading`;
    card.dataset.instance = service.instance || '';
    card.dataset.service = service.key;
    card.dataset.category = categoryKey;
    card.setAttribute('tabindex', '0');
    card.setAttribute('draggable', 'true');

    // Localized description
    const description = getLocalizedDescription(service);
    const isBookmarked = (state.bookmarks || []).includes(service.key);

    card.innerHTML = `
            <div class="card-quick-actions" aria-label="Quick actions">
                ${service.instance ? `
                    <a class="quick-act" data-act="metrics" href="${service.instance}/metrics" target="_blank" rel="noopener" title="Metrics">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                    </a>
                    <a class="quick-act" data-act="logs" href="${service.instance}/logs" target="_blank" rel="noopener" title="Logs">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="8" y1="13" x2="16" y2="13"></line>
                            <line x1="8" y1="17" x2="13" y2="17"></line>
                        </svg>
                    </a>
                    <a class="quick-act" data-act="health" href="${service.instance}/health" target="_blank" rel="noopener" title="Health">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </a>
                ` : ''}
                <button class="quick-act bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                        data-service="${service.key}" 
                        title="Toggle Bookmark" 
                        type="button"
                        aria-label="Toggle Bookmark">
                    <svg viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
                ${service.instance ? `
                    <button class="quick-act detail-btn" data-service="${service.key}" type="button" title="Details" aria-label="Open details">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                    <a class="open-hint" aria-hidden="true" title="Open service" href="${service.instance || '#'}" target="_blank" rel="noopener">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M7 17L17 7"></path>
                            <path d="M9 7h8v8"></path>
                        </svg>
                    </a>
                ` : ''}
            </div>
            <div class="card-header">
                <div class="service-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${service.icon}
                    </svg>
                </div>
                <div class="service-title-group">
                    <div class="service-title">${service.name}</div>
                    <div class="service-subtitle">${service.subtitle}</div>
                </div>
            </div>
            <div class="service-desc">${description}</div>
            <ul class="tech-features">
                ${(service.features || []).map(f => `
                    <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>${f}</span>
                    </li>
                `).join('')}
            </ul>
            <div class="service-meta">
                <div class="meta-row">
                    <span class="status-badge pending">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span data-i18n="status-pending">STATUS: PENDING</span>
                    </span>
                    <span>PORT: ${service.port}</span>
                </div>
                <div class="resource-stats">
                    <div class="stat-item stat-item--cpu">
                        <span class="stat-label">CPU:</span>
                        <span class="cpu-value">--</span><span class="stat-unit">%</span>
                        <div class="stat-bar"><div class="stat-fill cpu-bar" style="width: 0%"></div></div>
                    </div>
                    <div class="stat-item stat-item--ram">
                        <div class="stat-bar"><div class="stat-fill ram-bar" style="width: 0%"></div></div>
                        <span class="ram-value">--</span><span class="stat-unit">%</span>
                        <span class="stat-label">:RAM</span>
                    </div>
                    <canvas class="spark spark-cpu" data-service="${service.key}" data-metric="cpu" aria-hidden="true"></canvas>
                    <canvas class="spark spark-ram" data-service="${service.key}" data-metric="ram" aria-hidden="true"></canvas>
                </div>
            </div>
        `;


    // Apply cached status immediately (from background polling)
    const cachedStatus = (typeof window !== 'undefined' && window.__serviceStatus)
        ? window.__serviceStatus[service.key]
        : null;
    if (cachedStatus) {
        card.setAttribute('data-status', cachedStatus);
        const badge = card.querySelector('.status-badge');
        if (badge) {
            if (cachedStatus === 'up') {
                badge.className = 'status-badge up';
                badge.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span data-i18n="status-online">STATUS: ONLINE</span>
                `;
            } else if (cachedStatus === 'down') {
                badge.className = 'status-badge down';
                badge.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    <span data-i18n="status-down">STATUS: DOWN</span>
                `;
            }
        }
    } else if (!service.instance) {
        // Services without an HTTP endpoint (DB ports, etc.) are shown as online
        card.setAttribute('data-status', 'up');
        const badge = card.querySelector('.status-badge');
        if (badge) {
            badge.className = 'status-badge up';
            badge.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span data-i18n="status-online">STATUS: ONLINE</span>
            `;
        }
    }

    setTimeout(() => {
        card.classList.remove('loading');
    }, 800 + Math.random() * 400);
    return card;
}

// Find the "real" category (the one defined in services{}) that owns a service key.
export function findCategoryFor(serviceKey) {
    for (const [catKey, svcArr] of Object.entries(services)) {
        if (svcArr.some(s => s.key === serviceKey)) return catKey;
    }
    return null;
}

// === APPLY TRANSLATIONS ===
export function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[state.currentLang][key]) {
            el.innerHTML = translations[state.currentLang][key];
        }
    });
    document.documentElement.lang = state.currentLang;
}

// === UPDATE CATEGORY SELECTION ===
export function updateCategorySelection() {
    const view = state.currentView;

    document.querySelectorAll('.category-header').forEach(h => h.classList.remove('active'));

    document.querySelectorAll('.nav-home').forEach(n => {
        n.classList.toggle('active', n.dataset.view === view);
    });

    if (view !== 'home' && view !== 'alerts') {
        const activeHeader = document.querySelector(
            `.nav-category[data-category="${view}"] .category-header`
        );
        if (activeHeader) {
            activeHeader.classList.add('expanded', 'active');
            activeHeader.setAttribute('aria-expanded', 'true');
            const panel = activeHeader.nextElementSibling;
            if (panel) panel.classList.add('open');
        }
    }

    document.querySelectorAll('.compact-category').forEach(c => {
        const matchView = c.dataset.view && c.dataset.view === view;
        const matchCat  = c.dataset.category && c.dataset.category === view;
        c.classList.toggle('active', !!(matchView || matchCat));
    });
}

// === SELECT SERVICE ===
export function selectService(link, { focusCard = false, scroll = true } = {}) {
    document.querySelectorAll('.service-link').forEach(l => {
        l.classList.remove('active');
        l.setAttribute('tabindex', '-1');
    });
    link.classList.add('active');
    link.setAttribute('tabindex', '0');

    const serviceKey = link.dataset.service;
    const card = document.querySelector(`.service-card[data-service="${serviceKey}"]`);
    if (!card) return;

    if (scroll) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.querySelectorAll('.service-card.focused').forEach(c => c.classList.remove('focused'));
    card.classList.add('focused');

    if (focusCard) {
        if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
        card.focus({ preventScroll: true });
    }
}

// === BOOKMARKS PAGE ===
export function renderBookmarksPage() {
    const hdr  = document.getElementById('main-header');
    const grid = document.getElementById('services-grid');
    const lang = state.currentLang;

    const title = translations[lang]['tab-bookmarks'] || 'Bookmarks';
    const subtitle = translations[lang]['bookmarks-subtitle'] || 'Your saved services.';

    hdr.innerHTML = `
        <div class="page-header category-header-card">
            <div class="page-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
            </div>
            <div class="page-header-text">
                <h1>${title}</h1>
                <p class="cta-text" data-i18n="bookmarks-subtitle">${subtitle}</p>
            </div>
        </div>`;

    grid.classList.remove('home-grid', 'alerts-grid');
    grid.classList.add('services-grid--cards');
    grid.innerHTML = '';

    const bookmarkedKeys = state.bookmarks || [];
    const bookmarkedServices = [];

    // Find all services matching the bookmarks from config
    for (const [catKey, list] of Object.entries(services)) {
        for (const svc of list) {
            if (bookmarkedKeys.includes(svc.key)) {
                bookmarkedServices.push({ svc, catKey });
            }
        }
    }

    if (bookmarkedServices.length === 0) {
        grid.innerHTML = `
            <div class="home-card" style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted); font-family: var(--font-tech);">
                <p data-i18n="bookmarks-empty">${translations[lang]['bookmarks-empty'] || 'You have no bookmarked services.'}</p>
            </div>`;
        return;
    }

    bookmarkedServices.forEach(({ svc, catKey }) => {
        grid.appendChild(makeServiceCard(svc, catKey));
    });

    applyTranslations();
}
