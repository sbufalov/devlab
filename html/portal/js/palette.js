import { services, categories, translations, categoryInfo } from './config.js';
import { state, setState } from './state.js';

let allItems = [];
let visibleItems = [];
let activeIndex = 0;

function buildItems() {
    const items = [];

    // Recently visited (at the top for quick-switch)
    try {
        const recent = JSON.parse(localStorage.getItem('recent-services') || '[]');
        if (recent.length > 0) {
            recent.slice(0, 5).forEach(key => {
                let svc = null;
                let catKey = '';
                for (const [ck, list] of Object.entries(services)) {
                    const found = list.find(s => s.key === key);
                    if (found) { svc = found; catKey = ck; break; }
                }
                if (!svc) return;
                const catLabel = translations[state.currentLang][`tab-${catKey}`] || catKey;
                items.push({
                    kind: 'recent',
                    id: `recent:${svc.key}`,
                    title: svc.name,
                    subtitle: `Recently visited · ${catLabel}`,
                    icon: rawIcon(svc.icon),
                    action: () => {
                        navigateView(catKey, svc.key);
                        if (svc.instance) setTimeout(() => window.open(svc.instance, '_blank', 'noopener'), 50);
                    }
                });
            });
        }
    } catch(_) {}

    // Activities
    items.push({
        kind: 'view',
        id: 'view:activities',
        title: translations[state.currentLang]['tab-activities'] || 'Activities',
        subtitle: 'Activity feed timeline',
        icon: rawIcon('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>'),
        action: () => navigateView('activities')
    });

    // Home
    items.push({
        kind: 'view',
        id: 'view:home',
        title: translations[state.currentLang]['tab-home'] || 'Home Page',
        subtitle: 'Open the home page',
        icon: homeIcon(),
        action: () => navigateView('home')
    });

    // Alerts
    items.push({
        kind: 'view',
        id: 'view:alerts',
        title: translations[state.currentLang]['tab-alerts'] || 'Alerts',
        subtitle: translations[state.currentLang]['alerts-title'] || 'Alerts & Health',
        icon: rawIcon('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'),
        action: () => navigateView('alerts')
    });

    // Categories
    categories.forEach(cat => {
        const label = translations[state.currentLang][`tab-${cat.key}`] || cat.label;
        const desc  = categoryInfo[cat.key]?.desc?.[state.currentLang]
                   || categoryInfo[cat.key]?.desc?.en || '';
        items.push({
            kind: 'category',
            id: `cat:${cat.key}`,
            title: label,
            subtitle: desc,
            icon: rawIcon(cat.icon),
            action: () => navigateView(cat.key)
        });
    });

    // Services
    Object.entries(services).forEach(([catKey, list]) => {
        list.forEach(svc => {
            const catLabel = translations[state.currentLang][`tab-${catKey}`] || catKey;
            items.push({
                kind: 'service',
                id: `svc:${svc.key}`,
                title: svc.name,
                subtitle: `${catLabel} · ${svc.subtitle}`,
                icon: rawIcon(svc.icon),
                
                href: svc.instance || '',
                action: () => {
                    navigateView(catKey, svc.key);
                    if (svc.instance) {
                        setTimeout(() => window.open(svc.instance, '_blank', 'noopener'), 50);
                    }
                }
            });
        });
    });

    // Built-in actions
    const acts = [
        { id: 'act:theme',  title: 'Toggle theme',           subtitle: 'Switch dark / light',
          icon: dotIcon('🌓'), action: () => document.getElementById('theme-toggle').click() },
        { id: 'act:lang',   title: 'Toggle language',        subtitle: 'EN / RU',
          icon: dotIcon('🌐'), action: () => document.getElementById('lang-toggle').click() },
        { id: 'act:ham',    title: 'Toggle sidebar',         subtitle: 'Hamburger / expanded',
          icon: dotIcon('☰'), action: () => {
              const sb = document.getElementById('sidebar');
              const collapsed = sb.classList.toggle('collapsed');
              setState({ sidebarCollapsed: collapsed });
          }},
        { id: 'act:help',   title: 'Show keyboard shortcuts',subtitle: 'All hotkeys',
          icon: dotIcon('?'), action: () => document.getElementById('shortcut-modal').classList.add('active') },
        { id: 'act:settings',title:'Open settings',          subtitle: 'Theme, particles, colors',
          icon: dotIcon('⚙'), action: () => document.getElementById('settings-panel').classList.add('active') }
    ];
    acts.forEach(a => items.push({ kind: 'action', ...a }));

    return items;
}

function rawIcon(svgInner) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">${svgInner}</svg>`;
}
function homeIcon() {
    return rawIcon('<path d="M3 12l9-9 9 9"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path>');
}
function dotIcon(ch) {
    return `<span class="palette-glyph">${ch}</span>`;
}

// === Fuzzy scoring ===
function fuzzyScore(query, text) {
    if (!query) return 1;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t === q) return 1000;
    if (t.startsWith(q)) return 500;
    const idx = t.indexOf(q);
    if (idx !== -1) return 300 - idx;
    // Subsequence match
    let qi = 0, score = 0, lastIdx = -2;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) {
            score += (i === lastIdx + 1) ? 8 : 4;
            lastIdx = i;
            qi++;
        }
    }
    return qi === q.length ? score : 0;
}

function scoreItem(query, item) {
    const titleScore = fuzzyScore(query, item.title) * 2;
    const subScore   = fuzzyScore(query, item.subtitle || '') * 0.5;
    return titleScore + subScore;
}

// === Rendering ===
function render(query) {
    const list = document.getElementById('palette-list');
    const q = (query || '').trim();
    const scored = allItems
        .map(item => ({ item, score: q ? scoreItem(q, item) : 1 }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

    visibleItems = scored.map(x => x.item);
    if (activeIndex >= visibleItems.length) activeIndex = 0;

    if (visibleItems.length === 0) {
        list.innerHTML = `<div class="palette-empty">No matches</div>`;
        return;
    }

    list.innerHTML = visibleItems.map((it, i) => `
        <div class="palette-item ${i === activeIndex ? 'active' : ''}"
             data-index="${i}" role="option" aria-selected="${i === activeIndex}">
            <span class="palette-icon palette-icon--${it.kind}">${it.icon}</span>
            <span class="palette-text">
                <span class="palette-title">${escapeHtml(it.title)}</span>
                ${it.subtitle ? `<span class="palette-subtitle">${escapeHtml(it.subtitle)}</span>` : ''}
            </span>
            <span class="palette-kind">${it.kind}</span>
        </div>
    `).join('');

    const active = list.querySelector('.palette-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
}

function escapeHtml(t) {
    return String(t).replace(/[&<>"']/g, c => (
        {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
    ));
}

// === Navigation actions ===
function navigateView(viewKey, serviceKey) {
    setState({ currentView: viewKey });
    document.dispatchEvent(new CustomEvent('palette:navigate', {
        detail: { viewKey, serviceKey }
    }));
}

// === Public API ===
export function openPalette() {
    const overlay = document.getElementById('palette-overlay');
    const input   = document.getElementById('palette-input');
    if (!overlay) return;
    allItems = buildItems();
    activeIndex = 0;
    input.value = '';
    render('');
    overlay.hidden = false;
    requestAnimationFrame(() => input.focus());
}

export function closePalette() {
    const overlay = document.getElementById('palette-overlay');
    if (overlay) overlay.hidden = true;
}

export function isPaletteOpen() {
    const overlay = document.getElementById('palette-overlay');
    return overlay && !overlay.hidden;
}

export function initPalette() {
    const overlay = document.getElementById('palette-overlay');
    const input   = document.getElementById('palette-input');
    const list    = document.getElementById('palette-list');
    if (!overlay || !input || !list) return;

    // Global hotkey: Cmd/Ctrl+K
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            isPaletteOpen() ? closePalette() : openPalette();
        } else if (e.key === 'Escape' && isPaletteOpen()) {
            closePalette();
        }
    });

    input.addEventListener('input', (e) => {
        activeIndex = 0;
        render(e.target.value);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = Math.min(activeIndex + 1, visibleItems.length - 1);
            render(input.value);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = Math.max(activeIndex - 1, 0);
            render(input.value);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const it = visibleItems[activeIndex];
            if (it) { closePalette(); it.action(); }
        }
    });

    list.addEventListener('click', (e) => {
        const row = e.target.closest('.palette-item');
        if (!row) return;
        const it = visibleItems[parseInt(row.dataset.index, 10)];
        if (it) { closePalette(); it.action(); }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePalette();
    });
}
