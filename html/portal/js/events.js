import { state, setState } from './state.js';
import {
    renderCards, renderSidebar, renderMain,
    updateCategorySelection, selectService, applyTranslations,
    sortedCategories, findCategoryFor, renderBreadcrumbs
} from './render.js';
import { categories, services } from './config.js';
import { openDetailPanel, closeDetailPanel, activateDetailTab } from './detail-panel.js';

let allServiceLinks = [];

// === INITIALIZE EVENT LISTENERS ===
export function initEvents() {
    setupHeaderEvents();
    setupSidebarEvents();
    setupCardEvents();
    setupKeyboardNavigation();
    setupModalEvents();
    applySidebarStateFromStorage();
    updateServiceLinksList();

    // When VM status/stats update, refresh the alerts view if it's open
    const refreshAlertsOnStatus = () => {
        if (state.currentView === 'alerts') {
            import('./render.js').then(({ paintAlertsDown, paintAlertsOtel }) => {
                if (paintAlertsDown) paintAlertsDown();
                if (paintAlertsOtel) paintAlertsOtel();
            });
        }
    };
    document.addEventListener('status:updated', refreshAlertsOnStatus);

    // Palette → navigation bridge
    document.addEventListener('palette:navigate', (e) => {
        const { viewKey, serviceKey } = e.detail || {};
        if (!viewKey) return;
        if (viewKey === 'home') {
            goHome({ focusFirstCard: true, keepMode: true });
        } else if (viewKey === 'alerts') {
            openAlerts();
        } else if (viewKey === 'bookmarks') {
            openBookmarks();
        } else {
            activateCategory(viewKey, { focusFirstCard: !serviceKey, keepMode: true });
        }
        if (serviceKey) {
            setTimeout(() => {
                const link = document.querySelector(`.service-link[data-service="${serviceKey}"]`);
                if (link) selectService(link, { focusCard: true });
            }, 80);
        }
    });

    // Interval change handler (triggered from settings.js)
    document.addEventListener('interval:changed', (e) => {
        import('./api.js').then(({ restartPolling }) => {
            restartPolling(e.detail.interval);
        });
    });

    // Refresh bookmarks page if it's active
    const refreshBookmarksIfActive = () => {
        if (state.currentView === 'bookmarks') {
            import('./render.js').then(({ renderMain }) => renderMain());
        }
    };
    document.addEventListener('stats:updated', refreshBookmarksIfActive);

    // Detail panel events
    setupDetailPanelEvents();

    // Breadcrumb events
    setupBreadcrumbEvents();

    // Header search
    setupHeaderSearch();
}

// === Apply persisted sidebar collapse ===
function applySidebarStateFromStorage() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.style.width = '';
    sidebar.classList.toggle('collapsed', !!state.sidebarCollapsed);
}

// === HEADER EVENTS ===
function setupHeaderEvents() {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const themeLabel = themeToggle.querySelector('.theme-label');

    themeToggle.addEventListener('click', () => {
        const newTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
        setState({ currentTheme: newTheme });

        document.body.dataset.theme = newTheme;

        if (newTheme === 'light') {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
            themeLabel.setAttribute('data-i18n', 'theme-light');

            const monoOption = document.querySelector('.color-option.mono');
            if (monoOption && monoOption.classList.contains('active')) {
                document.documentElement.style.setProperty('--icon-color-light', '0%');
                setState({ iconLight: '0%' });
            }
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
            themeLabel.setAttribute('data-i18n', 'theme-dark');

            const monoOption = document.querySelector('.color-option.mono');
            if (monoOption && monoOption.classList.contains('active')) {
                document.documentElement.style.setProperty('--icon-color-light', '100%');
                setState({ iconLight: '100%' });
            }
        }

        applyTranslations();
        import('./settings.js').then(m => m.updateContrastHint && m.updateContrastHint());
    });

    // Language Toggle
    const langToggle = document.getElementById('lang-toggle');
    const langLabel = langToggle.querySelector('.lang-label');

    langToggle.addEventListener('click', () => {
        const newLang = state.currentLang === 'ru' ? 'en' : 'ru';
        setState({ currentLang: newLang });
        langLabel.textContent = newLang.toUpperCase();
        // Re-render sidebar + main so the new labels appear
        renderSidebar();
        rebindSidebarInternals();
        renderMain();
        setupCardEvents();
        updateCategorySelection();
        updateServiceLinksList();
    });

    // Help Modal
    const helpBtn = document.getElementById('help-btn');
    const modal = document.getElementById('shortcut-modal');

    helpBtn.addEventListener('click', () => {
        modal.classList.toggle('active');
    });
}

// =========================================================================
// SIDEBAR
// =========================================================================

function setupSidebarEvents() {
    setupSidebarToggles();
    rebindSidebarInternals();
}

// (Re)bind the things that live inside the sidebar. Safe to call repeatedly:
function rebindSidebarInternals() {
    setupNavTree();
    setupTreeMenu();
    setupCompactRail();
    setupSearch();

    const inline = document.getElementById('sidebar-toggle-inline');
    if (inline && !inline.__bound) {
        inline.addEventListener('click', toggleSidebar);
        inline.__bound = true;
    }

    // Repaint dots/badges from cached statuses
    import('./api.js').then(({ paintSidebarStatus, recomputeCategoryHealth }) => {
        paintSidebarStatus();
        recomputeCategoryHealth();
    });
}

function setupSidebarToggles() {
    const rail = document.getElementById('sidebar-toggle-rail');
    if (rail && !rail.__bound) {
        rail.addEventListener('click', toggleSidebar);
        rail.__bound = true;
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = sidebar.classList.toggle('collapsed');
    setState({ sidebarCollapsed: isCollapsed });
}

// ---- Tree-level controls (expand/collapse all, sort) --------------------

function setupTreeMenu() {
    const expandAll = document.getElementById('tree-expand-all');
    const collapseAll = document.getElementById('tree-collapse-all');
    const sortBtn = document.getElementById('tree-sort-btn');
    const sortMenu = document.getElementById('tree-sort-menu');

    if (expandAll && !expandAll.__bound) {
        expandAll.__bound = true;
        expandAll.addEventListener('click', () => setAllExpanded(true));
    }
    if (collapseAll && !collapseAll.__bound) {
        collapseAll.__bound = true;
        collapseAll.addEventListener('click', () => setAllExpanded(false));
    }

    if (sortBtn && !sortBtn.__bound) {
        sortBtn.__bound = true;
        sortBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = sortMenu.classList.toggle('active');
            sortBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', (e) => {
            if (sortMenu && !sortMenu.contains(e.target) && !sortBtn.contains(e.target)) {
                sortMenu.classList.remove('active');
                sortBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (sortMenu && !sortMenu.__bound) {
        sortMenu.__bound = true;
        sortMenu.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-sort]');
            if (!btn) return;
            setState({ treeSort: btn.dataset.sort });
            sortMenu.classList.remove('active');
            sortBtn.setAttribute('aria-expanded', 'false');
            renderSidebar();
            rebindSidebarInternals();
            updateCategorySelection();
            updateServiceLinksList();
        });
    }
}

function setAllExpanded(expand) {
    document.querySelectorAll('.nav-category').forEach(cat => {
        const header = cat.querySelector('.category-header');
        const panel  = cat.querySelector('.service-links');
        if (!header || !panel) return;
        header.classList.toggle('expanded', expand);
        header.setAttribute('aria-expanded', expand ? 'true' : 'false');
        panel.classList.toggle('open', expand);
    });
}

// ---- Nav tree (expanded mode) -------------------------------------------

function setupNavTree() {
    const navTree = document.getElementById('nav-tree');
    if (!navTree || navTree.__bound) return;
    navTree.__bound = true;

    navTree.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-home');
        if (navItem) {
            if (navItem.dataset.view === 'alerts') openAlerts();
            else if (navItem.dataset.view === 'bookmarks') openBookmarks();
            else if (navItem.dataset.view === 'activities') openActivities();
            else goHome({ focusFirstCard: true });
            return;
        }

        const link = e.target.closest('.service-link');
        if (link) {
            const linkCat = link.dataset.category;
            const realCat = findCategoryFor(link.dataset.service) || linkCat;
            const desired = realCat;

            if (state.currentView !== desired) {
                setState({ currentView: desired });
                renderMain();
                setupCardEvents();
                updateCategorySelection();
                updateServiceLinksList();
            }

            const freshLink = document.querySelector(
                `.service-link[data-service="${link.dataset.service}"]`
            ) || link;
            selectService(freshLink, { focusCard: true });
            return;
        }

        const header = e.target.closest('.category-header');
        if (!header) return;

        const category = header.parentElement.dataset.category;
        const chevronClick = !!e.target.closest('.chevron');

        if (chevronClick) {
            const panel = header.nextElementSibling;
            const expanded = header.classList.toggle('expanded');
            header.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            panel.classList.toggle('open', expanded);
            return;
        }

        activateCategory(category, { focusFirstCard: true });
    });

    navTree.addEventListener('keydown', (e) => {
        const navItem = e.target.closest('.nav-home');
        if (navItem && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            if (navItem.dataset.view === 'alerts') openAlerts();
            else if (navItem.dataset.view === 'bookmarks') openBookmarks();
            else if (navItem.dataset.view === 'activities') openActivities();
            else goHome({ focusFirstCard: true });
            return;
        }

        const header = e.target.closest('.category-header');
        if (header) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateCategory(header.parentElement.dataset.category, { focusFirstCard: true });
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (!header.classList.contains('expanded')) {
                    header.classList.add('expanded');
                    header.setAttribute('aria-expanded', 'true');
                    header.nextElementSibling.classList.add('open');
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (header.classList.contains('expanded')) {
                    header.classList.remove('expanded');
                    header.setAttribute('aria-expanded', 'false');
                    header.nextElementSibling.classList.remove('open');
                }
            }
            return;
        }
        const link = e.target.closest('.service-link');
        if (link && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            link.click();
        }
    });
}

// ---- Compact rail (hamburger mode) --------------------------------------

function setupCompactRail() {
    document.querySelectorAll('.compact-category').forEach(icon => {
        if (icon.__bound) return;
        icon.__bound = true;
        icon.addEventListener('click', () => {
            if (icon.dataset.view === 'home') {
                goHome({ focusFirstCard: true, keepMode: true });
                return;
            }
            if (icon.dataset.view === 'alerts') {
                openAlerts();
                return;
            }
            if (icon.dataset.view === 'bookmarks') {
                openBookmarks();
                return;
            }
            if (icon.dataset.view === 'activities') {
                openActivities();
                return;
            }
            activateCategory(icon.dataset.category, { focusFirstCard: true, keepMode: true });
        });
    });
}

// ---- Search filter ------------------------------------------------------

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput || searchInput.__bound) return;
    searchInput.__bound = true;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        document.querySelectorAll('.nav-category').forEach(category => {
            const links = category.querySelectorAll('.service-link');
            let hasVisibleLinks = false;

            links.forEach(link => {
                const text = link.textContent.toLowerCase();
                const isVisible = !query || text.includes(query);
                link.style.display = isVisible ? '' : 'none';
                if (isVisible) hasVisibleLinks = true;
            });

            const header = category.querySelector('.category-header');
            const panel  = category.querySelector('.service-links');

            if (query) {
                if (hasVisibleLinks) {
                    header.classList.add('expanded');
                    header.setAttribute('aria-expanded', 'true');
                    panel.classList.add('open');
                    category.style.display = '';
                } else {
                    category.style.display = 'none';
                }
            } else {
                category.style.display = '';
                const isActive = category.dataset.category === state.currentView;
                header.classList.toggle('expanded', isActive);
                header.setAttribute('aria-expanded', isActive ? 'true' : 'false');
                panel.classList.toggle('open', isActive);
            }
        });

        updateServiceLinksList();
    });
}

// =========================================================================
// SHARED ACTIONS
// =========================================================================

function openAlerts({ focusFirstCard = false } = {}) {
    if (state.currentView === 'alerts') {
        import('./render.js').then(({ renderMain }) => renderMain());
        return;
    }
    setState({ currentView: 'alerts' });
    import('./render.js').then(({ renderMain, updateCategorySelection }) => {
        renderMain();
        setupCardEvents();
        updateCategorySelection();
        updateServiceLinksList();
    });
}

function openActivities({ focusFirstCard = false } = {}) {
    if (state.currentView === 'activities') {
        import('./render.js').then(({ renderMain }) => renderMain());
        return;
    }
    setState({ currentView: 'activities' });
    import('./render.js').then(({ renderMain, updateCategorySelection }) => {
        renderMain();
        setupCardEvents();
        updateCategorySelection();
        updateServiceLinksList();
    });
}

function openBookmarks({ focusFirstCard = false } = {}) {
    if (state.currentView === 'bookmarks') {
        import('./render.js').then(({ renderMain }) => renderMain());
        return;
    }
    setState({ currentView: 'bookmarks' });
    import('./render.js').then(({ renderMain, updateCategorySelection }) => {
        renderMain();
        setupCardEvents();
        updateCategorySelection();
        updateServiceLinksList();
    });
}

function goHome({ focusFirstCard = false, keepMode = false } = {}) {
    if (state.currentView === 'home') {
        if (focusFirstCard) focusFirstMainElement();
        return;
    }
    setState({ currentView: 'home' });
    renderMain();
    setupCardEvents();
    updateCategorySelection();
    updateServiceLinksList();
    if (focusFirstCard) focusFirstMainElement();
}

function activateCategory(category, { focusFirstCard = false, keepMode = false } = {}) {
    if (!category) return;
    if (state.currentView === category) {
        if (focusFirstCard) focusFirstServiceCard();
        return;
    }
    setState({ currentView: category });
    updateCategorySelection();
    renderMain();
    updateServiceLinksList();
    setupCardEvents();
    if (focusFirstCard) focusFirstServiceCard();
}

function focusFirstServiceCard() {
    const card = document.querySelector('.services-grid .service-card');
    if (!card) return;
    if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
    card.focus({ preventScroll: false });
    document.querySelectorAll('.service-card.focused').forEach(c => c.classList.remove('focused'));
    card.classList.add('focused');

    const link = document.querySelector(
        `.service-link[data-service="${card.dataset.service}"]`
    );
    if (link) {
        document.querySelectorAll('.service-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        link.setAttribute('tabindex', '0');
    }
}

function focusFirstMainElement() {
    const target = document.querySelector('.services-grid .home-card, .services-grid .service-card');
    if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: false });
    }
}

// =========================================================================
// CARDS (right side)
// =========================================================================

export function setupCardEvents() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    grid.querySelectorAll('.service-card').forEach(c => {
        if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0');
    });

    if (grid.querySelector('canvas.spark')) {
        import('./api.js').then(({ updateSparklines }) => updateSparklines());
    }

    if (grid.__bound) return;
    grid.__bound = true;

    grid.addEventListener('focusin', (e) => {
        const card = e.target.closest('.service-card');
        if (!card) return;
        document.querySelectorAll('.service-card.focused').forEach(c => c.classList.remove('focused'));
        card.classList.add('focused');

        const key = card.dataset.service;
        const link = document.querySelector(
            `.nav-category[data-category="${card.dataset.category}"] .service-link[data-service="${key}"]`
        ) || document.querySelector(`.service-link[data-service="${key}"]`);
        if (link) {
            document.querySelectorAll('.service-link').forEach(l => {
                l.classList.remove('active');
                l.setAttribute('tabindex', '-1');
            });
            link.classList.add('active');
            link.setAttribute('tabindex', '0');
        }
    });

    grid.addEventListener('keydown', (e) => {
        const card = e.target.closest('.service-card');
        if (!card) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const href = card.dataset.instance || card.querySelector('.open-hint')?.getAttribute('href');
            if (href && href !== '#') window.open(href, '_blank', 'noopener');
        }
    });

    grid.addEventListener('click', (e) => {
        // First priority: intercept click on bookmark buttons and prevent parent link navigation
        const btn = e.target.closest('.bookmark-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            
            const serviceKey = btn.dataset.service;
            let bookmarks = state.bookmarks || [];
            if (bookmarks.includes(serviceKey)) {
                bookmarks = bookmarks.filter(k => k !== serviceKey);
            } else {
                bookmarks = [...bookmarks, serviceKey];
            }
            
            setState({ bookmarks });
            
            // Sync all visual bookmark buttons for this service
            document.querySelectorAll(`.bookmark-btn[data-service="${serviceKey}"]`).forEach(b => {
                const svg = b.querySelector('svg');
                if (bookmarks.includes(serviceKey)) {
                    b.classList.add('bookmarked');
                    if (svg) svg.setAttribute('fill', 'currentColor');
                } else {
                    b.classList.remove('bookmarked');
                    if (svg) svg.setAttribute('fill', 'none');
                }
            });

            // Dynamic grid refresh if on Bookmarks view
            if (state.currentView === 'bookmarks') {
                import('./render.js').then(({ renderMain }) => {
                    renderMain();
                    setupCardEvents();
                });
            }
            return;
        }

        // Handle detail button click — open detail panel
        const detailBtn = e.target.closest('.detail-btn');
        if (detailBtn) {
            e.preventDefault();
            e.stopPropagation();
            const svcKey = detailBtn.dataset.service;
            if (svcKey) openDetailPanel(svcKey);
            return;
        }

        // Handle open-hint link click — stop propagation so it opens in new tab
        const openHint = e.target.closest('.open-hint');
        if (openHint) {
            e.stopPropagation();
            return; // Let the <a> tag handle the navigation naturally
        }

        // Handle quick-act buttons (metrics, logs, health links)
        const qa = e.target.closest('.quick-act');
        if (!qa) {
            // Click on the card body — focus, select in nav tree, and open detail panel
            const card = e.target.closest('.service-card');
            if (card) {
                e.preventDefault();
                e.stopPropagation();
                // Focus card visually
                document.querySelectorAll('.service-card.focused').forEach(c => c.classList.remove('focused'));
                card.classList.add('focused');
                card.focus({ preventScroll: true });
                // Select in nav tree
                const key = card.dataset.service;
                const catKey = card.dataset.category;
                const link = document.querySelector(
                    `.nav-category[data-category="${catKey}"] .service-link[data-service="${key}"]`
                ) || document.querySelector(`.service-link[data-service="${key}"]`);
                if (link) {
                    document.querySelectorAll('.service-link').forEach(l => {
                        l.classList.remove('active');
                        l.setAttribute('tabindex', '-1');
                    });
                    link.classList.add('active');
                    link.setAttribute('tabindex', '0');
                    link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                // Open detail panel
                if (card.dataset.service) openDetailPanel(card.dataset.service);
            }
            return;
        }
        e.stopPropagation();
    });

    // Drag-and-drop reordering
    let dragKey = null;
    grid.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.service-card');
        if (!card) return;
        if (e.target.closest('.quick-act')) { e.preventDefault(); return; }
        if (['home', 'alerts'].includes(state.currentView)) { e.preventDefault(); return; }
        dragKey = card.dataset.service;
        card.classList.add('dragging');
        try { e.dataTransfer.setData('text/plain', dragKey); } catch (_) {}
        e.dataTransfer.effectAllowed = 'move';
    });
    grid.addEventListener('dragend', (e) => {
        const card = e.target.closest('.service-card');
        if (card) card.classList.remove('dragging');
        grid.querySelectorAll('.drop-target').forEach(c => c.classList.remove('drop-target'));
        dragKey = null;
    });
    grid.addEventListener('dragover', (e) => {
        if (!dragKey) return;
        const card = e.target.closest('.service-card');
        if (!card || card.dataset.service === dragKey) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        grid.querySelectorAll('.drop-target').forEach(c => c.classList.remove('drop-target'));
        card.classList.add('drop-target');
    });
    grid.addEventListener('drop', (e) => {
        if (!dragKey) return;
        const target = e.target.closest('.service-card');
        if (!target || target.dataset.service === dragKey) return;
        e.preventDefault();

        const rect = target.getBoundingClientRect();
        const insertAfter = (e.clientY - rect.top) > rect.height / 2;

        const dragged = grid.querySelector(`.service-card[data-service="${dragKey}"]`);
        if (!dragged) return;
        target.parentNode.insertBefore(dragged, insertAfter ? target.nextSibling : target);

        const order = Array.from(grid.querySelectorAll('.service-card[data-service]'))
            .map(c => c.dataset.service);
        const next = { ...(state.cardOrder || {}) };
        next[state.currentView] = order;
        setState({ cardOrder: next });

        grid.querySelectorAll('.drop-target').forEach(c => c.classList.remove('drop-target'));
    });
}

// =========================================================================
// KEYBOARD NAVIGATION (global)
// =========================================================================

function setupKeyboardNavigation() {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Alt') document.body.classList.add('show-hotkeys');
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') document.body.classList.remove('show-hotkeys');
    });
    window.addEventListener('blur', () => document.body.classList.remove('show-hotkeys'));

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') e.target.blur();
            return;
        }

        if (e.ctrlKey || e.metaKey || e.altKey) return;

        // 1..9 → jump to category N
        if (/^[1-9]$/.test(e.key)) {
            const idx = parseInt(e.key, 10) - 1;
            const cat = sortedCategories()[idx];
            if (cat) {
                e.preventDefault();
                activateCategory(cat.key, { focusFirstCard: true, keepMode: true });
            }
            return;
        }

        const key = e.key.toLowerCase();
        switch (key) {
            case 's':
                e.preventDefault();
                {
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar && sidebar.classList.contains('collapsed')) {
                        toggleSidebar();
                    }
                    const inp = document.getElementById('search-input');
                    if (inp) setTimeout(() => inp.focus(), 50);
                }
                break;
            case 'h':
                e.preventDefault();
                toggleSidebar();
                break;
            case 'a':
                e.preventDefault();
                openAlerts();
                break;
            case 'm':
                e.preventDefault();
                openActivities();
                break;
            case 'b':
                e.preventDefault();
                openBookmarks();
                break;
            case '0':
                e.preventDefault();
                goHome({ focusFirstCard: true, keepMode: true });
                break;
            case 'arrowdown':
                e.preventDefault();
                navigateServices(1);
                break;
            case 'arrowup':
                e.preventDefault();
                navigateServices(-1);
                break;
            case 'home':
                e.preventDefault();
                goHome({ focusFirstCard: true, keepMode: true });
                break;
            case 'end':
                e.preventDefault();
                navigateServicesAbsolute(-1);
                break;
            case 'enter':
                activateFocusedService();
                break;
            case 't':
                document.getElementById('theme-toggle').click();
                break;
            case 'l':
                document.getElementById('lang-toggle').click();
                break;
            case '?':
            case '/':
                e.preventDefault();
                document.getElementById('shortcut-modal').classList.toggle('active');
                break;
            case 'escape':
                closeAllOverlays();
                break;
        }
    });
}

function allLinksFlat() {
    updateServiceLinksList();
    return allServiceLinks.filter(link => link.style.display !== 'none');
}

function navigateServices(direction) {
    const flat = allLinksFlat();
    if (flat.length === 0) return;

    let currentIndex = flat.findIndex(l => l.classList.contains('active'));
    if (currentIndex === -1) {
        currentIndex = direction > 0 ? 0 : flat.length - 1;
    } else {
        currentIndex = (currentIndex + direction + flat.length) % flat.length;
    }

    const target = flat[currentIndex];
    const desired = findCategoryFor(target.dataset.service) || target.dataset.category;

    if (desired !== state.currentView) {
        setState({ currentView: desired });
        updateCategorySelection();
        renderMain();
        setupCardEvents();
        updateServiceLinksList();
    }

    const freshTarget = document.querySelector(
        `.service-link[data-service="${target.dataset.service}"]`
    ) || target;
    selectService(freshTarget, { focusCard: true });
    freshTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setState({ focusedServiceIndex: currentIndex });
}

function navigateServicesAbsolute(index) {
    const flat = allLinksFlat();
    if (flat.length === 0) return;
    const idx = index < 0 ? flat.length - 1 : 0;
    const target = flat[idx];
    const desired = findCategoryFor(target.dataset.service) || target.dataset.category;
    if (desired !== state.currentView) {
        setState({ currentView: desired });
        updateCategorySelection();
        renderMain();
        setupCardEvents();
        updateServiceLinksList();
    }
    const freshTarget = document.querySelector(
        `.service-link[data-service="${target.dataset.service}"]`
    ) || target;
    selectService(freshTarget, { focusCard: true });
    freshTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function activateFocusedService() {
    const card = document.querySelector('.service-card:focus, .service-card.focused');
    if (card) {
        const href = card.dataset.instance || card.querySelector('.open-hint')?.getAttribute('href');
        if (href && href !== '#') window.open(href, '_blank', 'noopener');
        return;
    }
    const active = document.querySelector('.service-link.active');
    if (!active) return;
    const href = active.dataset.href;
    if (href) window.open(href, '_blank', 'noopener');
}

function updateServiceLinksList() {
    allServiceLinks = Array.from(document.querySelectorAll('.service-link'));
}

function closeAllOverlays() {
    document.getElementById('shortcut-modal').classList.remove('active');
    const sp = document.getElementById('settings-panel');
    if (sp) sp.classList.remove('active');
    const tsm = document.getElementById('tree-sort-menu');
    if (tsm) tsm.classList.remove('active');
}

// === DETAIL PANEL EVENTS ===
function setupDetailPanelEvents() {
    const closeBtn = document.getElementById('detail-close-btn');
    const backdrop = document.getElementById('detail-backdrop');
    const tabs = document.getElementById('detail-tabs');
    const noteBtn = document.getElementById('detail-note-btn');

    if (closeBtn) closeBtn.addEventListener('click', closeDetailPanel);
    if (backdrop) backdrop.addEventListener('click', closeDetailPanel);

    if (tabs) {
        tabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.detail-tab');
            if (tab) activateDetailTab(tab.dataset.tab);
        });
    }

    if (noteBtn) {
        noteBtn.addEventListener('click', () => activateDetailTab('notes'));
    }
}

// === BREADCRUMB EVENTS ===
function setupBreadcrumbEvents() {
    const el = document.getElementById('breadcrumbs');
    if (!el || el.__bound) return;
    el.__bound = true;

    el.addEventListener('click', (e) => {
        const link = e.target.closest('.bc-link');
        if (!link) return;
        e.preventDefault();
        const view = link.dataset.view;
        if (view === 'home') goHome({ focusFirstCard: true });
        else if (view === 'alerts') openAlerts();
        else if (view === 'bookmarks') openBookmarks();
        else if (view === 'activities') openActivities();
        else activateCategory(view, { focusFirstCard: true });
    });
}

// === HEADER SEARCH ===
function setupHeaderSearch() {
    const input = document.getElementById('header-search-input');
    if (!input) return;

    input.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const dropdown = document.getElementById('header-search-dropdown');
        if (!dropdown) return;

        if (!q) { dropdown.classList.remove('open'); return; }

        const items = [];
        Object.entries(services).forEach(([catKey, list]) => {
            list.forEach(svc => {
                const haystack = [svc.name, svc.subtitle, catKey].join(' ').toLowerCase();
                if (haystack.includes(q)) {
                    items.push({ svc, catKey });
                }
            });
        });

        if (items.length === 0) {
            dropdown.innerHTML = '<div class="hs-empty">No matches</div>';
        } else {
            dropdown.innerHTML = items.slice(0, 10).map(({ svc, catKey }) => `
                <div class="hs-item" data-service="${svc.key}" data-category="${catKey}">
                    <svg class="hs-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">${svc.icon}</svg>
                    <span class="hs-item-name">${svc.name}</span>
                    <span class="hs-item-cat">${catKey}</span>
                </div>
            `).join('');
        }
        dropdown.classList.add('open');
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const dropdown = document.getElementById('header-search-dropdown');
            const first = dropdown?.querySelector('.hs-item');
            if (first) {
                const svcKey = first.dataset.service;
                const catKey = first.dataset.category;
                activateCategory(catKey, { focusFirstCard: false });
                setTimeout(() => openDetailPanel(svcKey), 100);
                input.value = '';
                dropdown.classList.remove('open');
            }
        }
        if (e.key === 'Escape') {
            input.value = '';
            document.getElementById('header-search-dropdown')?.classList.remove('open');
            input.blur();
        }
    });

    // Delegate clicks in dropdown
    const dropdown = document.getElementById('header-search-dropdown');
    if (dropdown && !dropdown.__bound) {
        dropdown.__bound = true;
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.hs-item');
            if (!item) return;
            const svcKey = item.dataset.service;
            const catKey = item.dataset.category;
            activateCategory(catKey, { focusFirstCard: false });
            setTimeout(() => openDetailPanel(svcKey), 100);
            input.value = '';
            dropdown.classList.remove('open');
        });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.header-search-wrap')) {
            dropdown?.classList.remove('open');
        }
    });
}

// === MODAL EVENTS ===
function setupModalEvents() {
    const modal = document.getElementById('shortcut-modal');
    const closeBtn = document.getElementById('close-modal');

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
}

// === RESPONSIVE ADJUSTMENTS ===
export function setupResponsive() {
    function adjustParticleDensity() {
        const width = window.innerWidth;
        let density;
        if (width < 900) density = 40;
        else if (width < 1400) density = 60;
        else density = 80;

        const densitySlider = document.getElementById('density-slider');
        const densityValue = document.getElementById('density-value');
        if (densitySlider && densityValue) {
            densitySlider.value = density;
            densityValue.textContent = density;
        }
        document.documentElement.style.setProperty('--particle-density', density);
        setState({ particleDensity: density });
    }

    function adjustCardGap() {
        const width = window.innerWidth;
        let gap;
        if (width < 900) gap = '1rem';
        else if (width < 1400) gap = '1.5rem';
        else gap = '2rem';
        document.documentElement.style.setProperty('--card-gap', gap);
    }

    adjustParticleDensity();
    adjustCardGap();

    let resizeTimer;
    window.addEventListener('resize', () => {
        adjustParticleDensity();
        adjustCardGap();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            import('./api.js').then(({ updateSparklines }) => updateSparklines());
        }, 200);
    });
}