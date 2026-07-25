import { restartPolling } from './api.js';
import { state, setState } from './state.js';
import { initParticles } from './particles.js';



// === Contrast helpers ===
function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0)*255), Math.round(f(8)*255), Math.round(f(4)*255)];
}
function relLum([r, g, b]) {
    const cs = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * cs[0] + 0.7152 * cs[1] + 0.0722 * cs[2];
}
function contrastRatio(rgb1, rgb2) {
    const l1 = relLum(rgb1), l2 = relLum(rgb2);
    const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (a + 0.05) / (b + 0.05);
}
export function updateContrastHint() {
    const hint = document.getElementById('contrast-hint');
    if (!hint) return;
    const h = parseFloat(state.iconHue) || 0;
    const sNum = parseFloat(String(state.iconSat).replace('%','')) || 0;
    const lNum = parseFloat(String(state.iconLight).replace('%','')) || 50;
    const iconRgb = hslToRgb(h, sNum, lNum);
    const bgRgb = state.currentTheme === 'dark' ? [3, 5, 10] : [232, 236, 241];
    const ratio = contrastRatio(iconRgb, bgRgb);
    const ok = ratio >= 4.5;
    const warn = !ok && ratio >= 3;
    hint.hidden = ok;
    if (!ok) {
        hint.classList.toggle('warn', warn);
        hint.classList.toggle('bad', !warn);
        hint.innerHTML = (warn
            ? `⚠ Low contrast (${ratio.toFixed(2)}:1). Text may be hard to read on ${state.currentTheme} background.`
            : `⛔ Fails WCAG AA (${ratio.toFixed(2)}:1). Consider another shade.`);
    } else {
        hint.classList.remove('warn','bad');
    }
}

// === INITIALIZE SETTINGS PANEL ===
export function initSettings() {
    initSystemTheme();
    setupSettingsTrigger();
    setupColorScheme();
    setupNebulaSlider();
    setupDensitySlider();
    setupIntervalSlider();
    setupCardsSlider();
    applyStoredSettings();
}

// === SETTINGS PANEL TRIGGER ===
function setupSettingsTrigger() {
    const trigger = document.getElementById('settings-trigger');
    const panel = document.getElementById('settings-panel');

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!trigger.contains(e.target) && !panel.contains(e.target)) {
            panel.classList.remove('active');
        }
    });
}

// === COLOR SCHEME PICKER ===
function setupColorScheme() {
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');

            const hue = option.dataset.hue;
            const sat = option.dataset.sat;
            const light = option.dataset.light;

            if (option.classList.contains('mono')) {
                const lightValue = state.currentTheme === 'dark' ? '100%' : '0%';
                document.documentElement.style.setProperty('--icon-color-hue', '0');
                document.documentElement.style.setProperty('--icon-color-sat', '0%');
                document.documentElement.style.setProperty('--icon-color-light', lightValue);
                setState({ iconHue: '0', iconSat: '0%', iconLight: lightValue });
                updateContrastHint();
            } else {
                document.documentElement.style.setProperty('--icon-color-hue', hue);
                document.documentElement.style.setProperty('--icon-color-sat', sat);
                document.documentElement.style.setProperty('--icon-color-light', light);
                setState({ iconHue: hue, iconSat: sat, iconLight: light });
                updateContrastHint();
            }
        });
    });
}

// === NEBULA INTENSITY SLIDER ===
function setupNebulaSlider() {
    const slider = document.getElementById('nebula-slider');
    const valueDisplay = document.getElementById('nebula-value');

    slider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        valueDisplay.textContent = e.target.value;
        document.documentElement.style.setProperty('--nebula-opacity', value);
        setState({ nebulaOpacity: value });
    });
}

// === PARTICLE DENSITY SLIDER ===
function setupDensitySlider() {
    const slider = document.getElementById('density-slider');
    const valueDisplay = document.getElementById('density-value');

    slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        valueDisplay.textContent = value;
        document.documentElement.style.setProperty('--particle-density', value);
        setState({ particleDensity: value });
        initParticles();
    });
}

// === OTEL METRICS UPDATE INTERVAL SLIDER ===
function setupIntervalSlider() {
    const slider = document.getElementById('interval-slider');
    const valueDisplay = document.getElementById('interval-value');
    if (!slider) return;

    slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        const secs = value / 1000;
        if (valueDisplay) {
            valueDisplay.textContent = secs;
        }
        setState({ updateInterval: value });
        
        // Instantly restart background/mock polling with new interval
        restartPolling(value);

        // Also dispatch event for compatibility
        document.dispatchEvent(new CustomEvent('interval:changed', {
            detail: { interval: value }
        }));
    });
}

// === CARDS PER ROW SLIDER ===
function setupCardsSlider() {
    const slider = document.getElementById('cards-slider');
    const valueDisplay = document.getElementById('cards-value');
    if (!slider) return;

    slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        if (valueDisplay) {
            valueDisplay.textContent = value;
        }
        // Set CSS variable on html element for standard pages
        document.documentElement.style.setProperty('--cards-per-row', value);
        // Set CSS variable directly on the grid itself for instant rearrangement
        const grid = document.getElementById('services-grid');
        if (grid) {
            grid.style.setProperty('--cards-per-row', value);
        }
        setState({ cardsPerRow: value });
    });
}

// === SYSTEM THEME AUTO-SWITCHING ===
let _systemThemeQuery = null;

export function initSystemTheme() {
    if (!window.matchMedia) return;
    _systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applySystemTheme = (e) => {
        if (state.currentTheme === 'system') {
            const resolved = e.matches ? 'dark' : 'light';
            document.body.dataset.theme = resolved;
            updateMonoColor(resolved);
        }
    };

    _systemThemeQuery.addEventListener('change', applySystemTheme);

    // If stored theme is 'system', apply it
    if (state.currentTheme === 'system') {
        document.body.dataset.theme = _systemThemeQuery.matches ? 'dark' : 'light';
    }
}

function updateMonoColor(theme) {
    const monoOption = document.querySelector('.color-option.mono');
    if (monoOption && monoOption.classList.contains('active')) {
        const lightValue = theme === 'dark' ? '100%' : '0%';
        document.documentElement.style.setProperty('--icon-color-light', lightValue);
        setState({ iconLight: lightValue });
    }
}

// === APPLY STORED SETTINGS ===
function applyStoredSettings() {
    // Theme button visuals
    const resolvedTheme = state.currentTheme === 'system'
        ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : state.currentTheme;
    document.body.dataset.theme = resolvedTheme;

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const moonIcon = themeToggle.querySelector('.moon-icon');
        const sunIcon = themeToggle.querySelector('.sun-icon');
        const themeLabel = themeToggle.querySelector('.theme-label');

        if (state.currentTheme === 'system') {
            if (moonIcon) moonIcon.style.display = 'none';
            if (sunIcon)  sunIcon.style.display  = 'none';
            if (themeLabel) { themeLabel.textContent = 'Auto'; themeLabel.setAttribute('data-i18n', 'theme-system'); }
        } else if (state.currentTheme === 'light') {
            if (moonIcon) moonIcon.style.display = 'none';
            if (sunIcon)  sunIcon.style.display  = 'block';
            if (themeLabel) themeLabel.setAttribute('data-i18n', 'theme-light');
        } else {
            if (moonIcon) moonIcon.style.display = 'block';
            if (sunIcon)  sunIcon.style.display  = 'none';
            if (themeLabel) themeLabel.setAttribute('data-i18n', 'theme-dark');
        }
    }

    // Icon color scheme — vars are already set in loadState(), but reflect in UI
    const matching = document.querySelector(
        `.color-option[data-hue="${state.iconHue}"][data-sat="${state.iconSat}"]`
    );
    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
    if (matching) {
        matching.classList.add('active');
    } else if (state.iconSat === '0%') {
        const mono = document.querySelector('.color-option.mono');
        if (mono) mono.classList.add('active');
    } else {
        const def = document.querySelector('.color-option.cyan');
        if (def) def.classList.add('active');
    }

    // Nebula slider
    const nebulaSlider = document.getElementById('nebula-slider');
    const nebulaValue  = document.getElementById('nebula-value');
    if (nebulaSlider && nebulaValue) {
        const pct = Math.round((state.nebulaOpacity || 0.3) * 100);
        nebulaSlider.value = pct;
        nebulaValue.textContent = pct;
    }

    // Particle density slider
    const densitySlider = document.getElementById('density-slider');
    const densityValue  = document.getElementById('density-value');
    if (densitySlider && densityValue) {
        densitySlider.value = state.particleDensity;
        densityValue.textContent = state.particleDensity;
    }

    // Update interval slider
    const intervalSlider = document.getElementById('interval-slider');
    const intervalValue  = document.getElementById('interval-value');
    if (intervalSlider && intervalValue) {
        intervalSlider.value = state.updateInterval;
        // Output clean number, the "seconds" unit is handled by surrounding HTML
        intervalValue.textContent = state.updateInterval / 1000;
    }

    // Cards per row slider
    const cardsSlider = document.getElementById('cards-slider');
    const cardsValue  = document.getElementById('cards-value');
    if (cardsSlider && cardsValue) {
        cardsSlider.value = state.cardsPerRow;
        cardsValue.textContent = state.cardsPerRow;
        // Inject current cardsPerRow into CSS on load
        document.documentElement.style.setProperty('--cards-per-row', state.cardsPerRow);
        const grid = document.getElementById('services-grid');
        if (grid) {
            grid.style.setProperty('--cards-per-row', state.cardsPerRow);
        }
    }

    updateContrastHint();
    // Sidebar persistence is applied in events.js (`applySidebarStateFromStorage`)
}