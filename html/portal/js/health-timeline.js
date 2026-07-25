// === HEALTH TIMELINE MODULE ===
// Historical view of service uptime/down events stored in VictoriaMetrics.

import { services, translations } from './config.js';
import { state, setState } from './state.js';

const VM_BASE = `${location.origin}/vm/api/v1`;
const FETCH_TIMEOUT = 15000;

// Fetch uptime history for all services over the given period (in days)
export async function fetchHealthTimeline(periodDays) {
    const end = Math.floor(Date.now() / 1000);
    const start = end - periodDays * 86400;
    const step = Math.max(300, Math.floor(periodDays * 86400 / 200));

    try {
        const query = 'probe_success';
        const url = `${VM_BASE}/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${step}`;
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
        const res = await fetch(url, { signal: ctrl.signal, credentials: 'include' });
        clearTimeout(t);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const results = json?.data?.result || [];

        // Build per-service timeline
        const hostIndex = buildHostIndex();
        const timelines = {};

        for (const series of results) {
            const m = series.metric || {};
            const candidates = [m.instance, m.target, m.__address__, m.host, m.url].filter(Boolean);
            let matchedKey = null;
            for (const c of candidates) {
                const host = normalizeHost(c);
                if (hostIndex.has(host)) { matchedKey = hostIndex.get(host); break; }
            }
            if (!matchedKey) continue;

            timelines[matchedKey] = (series.values || []).map(([ts, v]) => ({
                time: parseFloat(ts),
                up: v === '1' || v === 1
            }));
        }

        return timelines;
    } catch (err) {
        console.warn('[HealthTimeline] fetch failed', err);
        return {};
    }
}

// Render the health timeline section
export function renderHealthTimeline(timelines, container) {
    const lang = state.currentLang;
    const allSvcs = Object.values(services).flat();
    const periodDays = state.healthPeriod || 7;

    if (!timelines || Object.keys(timelines).length === 0) {
        container.innerHTML = `<p class="detail-empty">${translations[lang]['alerts-top-empty'] || 'No data from VictoriaMetrics.'}</p>`;
        return;
    }

    const rows = allSvcs.map(svc => {
        const data = timelines[svc.key] || [];
        return { svc, data };
    }).filter(r => r.data.length > 0);

    if (rows.length === 0) {
        container.innerHTML = `<p class="detail-empty">No uptime data available.</p>`;
        return;
    }

    // Calculate uptime percentage per service
    const summary = rows.map(({ svc, data }) => {
        const upCount = data.filter(d => d.up).length;
        const pct = data.length > 0 ? (upCount / data.length * 100) : 0;
        return { svc, data, pct };
    });

    container.innerHTML = `
        <div class="ht-grid">
            <div class="ht-header-row">
                <span class="ht-label-svc">Service</span>
                <span class="ht-label-bar">Timeline (${periodDays}d)</span>
                <span class="ht-label-pct">Uptime</span>
            </div>
            ${summary.map(({ svc, data, pct }) => {
                const cells = data.map(d => d.up ? '1' : '0').join('');
                const pctStr = pct >= 99.95 ? '100' : pct.toFixed(1);
                const cls = pct >= 99 ? 'ht-good' : pct >= 95 ? 'ht-warn' : 'ht-bad';
                return `<div class="ht-row">
                    <span class="ht-svc-name">${escapeHtml(svc.name)}</span>
                    <span class="ht-bar" data-cells="${cells}" title="${pctStr}% uptime"></span>
                    <span class="ht-pct ${cls}">${pctStr}%</span>
                </div>`;
            }).join('')}
        </div>
    `;

    // Draw timeline bars using CSS grid of colored cells
    container.querySelectorAll('.ht-bar').forEach(bar => {
        const cells = bar.dataset.cells || '';
        const totalCells = Math.min(cells.length, 200);
        const cellSize = Math.max(2, Math.floor(600 / totalCells));
        bar.style.display = 'flex';
        bar.style.gap = '1px';
        bar.style.height = '16px';
        bar.style.alignItems = 'center';

        for (let i = 0; i < totalCells; i++) {
            const el = document.createElement('span');
            el.style.cssText = `display:inline-block;width:${cellSize}px;height:100%;border-radius:1px;background:${cells[i] === '1' ? 'var(--status-up)' : 'var(--status-down)'};flex-shrink:0;`;
            bar.appendChild(el);
        }
    });
}

// Helper functions
function buildHostIndex() {
    const idx = new Map();
    Object.values(services).flat().forEach(svc => {
        if (svc.instance) idx.set(normalizeHost(svc.instance), svc.key);
    });
    return idx;
}

function normalizeHost(s) {
    if (!s) return '';
    let v = String(s).trim().toLowerCase();
    v = v.replace(/^https?:\/\//, '');
    v = v.split('/')[0].split('?')[0].split('#')[0];
    v = v.replace(/:(?:80|443)$/, '');
    return v;
}

function escapeHtml(t) {
    return String(t).replace(/[&<>"']/g, function(c) {
        if (c === "&") return "&amp;";
        if (c === "<") return "&lt;";
        if (c === ">") return "&gt;";
        if (c === '"') return "&quot;";
        return "&#39;";
    });
}
