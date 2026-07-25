// === DETAIL PANEL MODULE ===
// Handles the slide-out detail panel with tabs for logs, metrics, traces, container info, config, and notes.

import { services, categories, translations, apiEndpoints } from './config.js';
import { state, setState } from './state.js';

let _currentService = null;
let _logAbort = null;
let _metricsAbort = null;
let _tracesAbort = null;
let _logTimer = null;

// === OPEN / CLOSE ===
export function openDetailPanel(serviceKey) {
    const svc = findService(serviceKey);
    if (!svc) return;

    _currentService = svc;
    setState({ detailService: serviceKey });
    trackRecentVisit(serviceKey);

    const overlay = document.getElementById('detail-overlay');
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('open'));

    // Header
    const iconEl = document.getElementById('detail-panel-icon');
    iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${svc.icon}</svg>`;
    document.getElementById('detail-panel-title').textContent = svc.name;
    document.getElementById('detail-panel-subtitle').textContent = svc.subtitle;

    // Activate default tab
    activateDetailTab(state.detailTab || 'logs');
}

export function closeDetailPanel() {
    const overlay = document.getElementById('detail-overlay');
    overlay.classList.remove('open');
    setTimeout(() => { overlay.hidden = true; }, 300);
    stopLogTail();
    _currentService = null;
    setState({ detailService: null });
}

function findService(key) {
    for (const list of Object.values(services)) {
        const found = list.find(s => s.key === key);
        if (found) return found;
    }
    return null;
}

function findCategoryForService(key) {
    for (const [catKey, list] of Object.entries(services)) {
        if (list.some(s => s.key === key)) return catKey;
    }
    return null;
}

// === TAB ACTIVATION ===
export function activateDetailTab(tabName) {
    setState({ detailTab: tabName });
    stopLogTail();

    document.querySelectorAll('.detail-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });

    const content = document.getElementById('detail-content');
    content.innerHTML = '<div class="detail-loading">Loading…</div>';

    switch (tabName) {
        case 'logs':      renderLogsTab(content); break;
        case 'metrics':   renderMetricsTab(content); break;
        case 'traces':    renderTracesTab(content); break;
        case 'container': renderContainerTab(content); break;
        case 'config':    renderConfigTab(content); break;
        case 'notes':     renderNotesTab(content); break;
    }
}

// === LOGS TAB ===
async function renderLogsTab(container) {
    const svc = _currentService;
    if (!svc) return;

    if (!svc.instance) {
        container.innerHTML = `<div class="detail-empty">${translations[state.currentLang]['detail-no-instance'] || 'No HTTP endpoint for this service.'}</div>`;
        return;
    }

    const hostname = new URL(svc.instance).hostname;

    container.innerHTML = `
        <div class="detail-logs-toolbar">
            <select class="detail-logs-level" id="detail-log-level">
                <option value="">All levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
            </select>
            <label class="detail-logs-tail-label">
                <input type="checkbox" id="detail-log-tail" checked> Auto-refresh
            </label>
            <button class="detail-logs-refresh" id="detail-log-refresh" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
            </button>
        </div>
        <div class="detail-logs-output" id="detail-logs-output">
            <div class="detail-loading">Fetching logs…</div>
        </div>
    `;

    await fetchAndRenderLogs(hostname);

    // Auto-refresh toggle
    const tailCb = document.getElementById('detail-log-tail');
    tailCb.addEventListener('change', () => {
        if (tailCb.checked) startLogTail(hostname);
        else stopLogTail();
    });
    startLogTail(hostname);

    document.getElementById('detail-log-refresh').addEventListener('click', () => {
        fetchAndRenderLogs(hostname);
    });
    document.getElementById('detail-log-level').addEventListener('change', () => {
        fetchAndRenderLogs(hostname);
    });
}

async function fetchAndRenderLogs(hostname) {
    const output = document.getElementById('detail-logs-output');
    if (!output) return;

    const levelFilter = document.getElementById('detail-log-level')?.value || '';

    try {
        const end = Math.floor(Date.now() / 1000);
        const start = end - 3600; // last 1 hour
        const query = `{container="${hostname}"}`;

        if (_logAbort) _logAbort.abort();
        _logAbort = new AbortController();

        const url = `${apiEndpoints.qryn.replace('/api/v1/query', '')}/api/v1/query_range`
                  + `?query=${encodeURIComponent(query)}&start=${start}&end=${end}&limit=200`;

        const res = await fetch(url, {
            signal: _logAbort.signal,
            credentials: 'include',
            headers: { Accept: 'application/json' }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const results = data?.data?.result || [];

        let lines = [];
        for (const stream of results) {
            for (const [ts, line] of (stream.values || [])) {
                let parsed;
                try { parsed = JSON.parse(line); } catch(_) { parsed = null; }
                const level = parsed?.level || parsed?.severity || '';
                const msg = parsed?.msg || parsed?.message || line;
                const time = new Date(parseFloat(ts) * 1000).toLocaleTimeString();
                lines.push({ time, level: level.toLowerCase(), msg, raw: line });
            }
        }

        if (levelFilter) {
            lines = lines.filter(l => l.level.includes(levelFilter));
        }

        // Sort newest first
        lines.sort((a, b) => b.time.localeCompare(a.time));

        if (lines.length === 0) {
            output.innerHTML = '<div class="detail-empty">No log entries found.</div>';
            return;
        }

        output.innerHTML = lines.slice(0, 300).map(l => {
            const cls = l.level.includes('error') ? 'log-error'
                      : l.level.includes('warn')  ? 'log-warn'
                      : l.level.includes('info')  ? 'log-info'
                      : 'log-default';
            return `<div class="log-line ${cls}">
                <span class="log-time">${escapeHtml(l.time)}</span>
                <span class="log-level">${escapeHtml(l.level || '—')}</span>
                <span class="log-msg">${escapeHtml(l.msg)}</span>
            </div>`;
        }).join('');
    } catch (err) {
        if (err.name === 'AbortError') return;
        output.innerHTML = `<div class="detail-empty">Failed to load logs: ${escapeHtml(err.message)}</div>`;
    }
}

function startLogTail(hostname) {
    stopLogTail();
    _logTimer = setInterval(() => fetchAndRenderLogs(hostname), 10000);
}

function stopLogTail() {
    if (_logTimer) { clearInterval(_logTimer); _logTimer = null; }
    if (_logAbort) { _logAbort.abort(); _logAbort = null; }
}

// === METRICS TAB ===
async function renderMetricsTab(container) {
    const svc = _currentService;
    if (!svc) return;

    container.innerHTML = `
        <div class="detail-metrics-toolbar">
            <select class="detail-metrics-range" id="detail-metrics-range">
                <option value="1h">Last 1 hour</option>
                <option value="6h">Last 6 hours</option>
                <option value="24h" selected>Last 24 hours</option>
                <option value="7d">Last 7 days</option>
            </select>
        </div>
        <div class="detail-metrics-charts" id="detail-metrics-charts">
            <div class="detail-metrics-chart">
                <div class="detail-chart-title">CPU Utilization (%)</div>
                <canvas id="detail-chart-cpu" height="120"></canvas>
            </div>
            <div class="detail-metrics-chart">
                <div class="detail-chart-title">Memory Usage (%)</div>
                <canvas id="detail-chart-ram" height="120"></canvas>
            </div>
            <div class="detail-metrics-chart">
                <div class="detail-chart-title">Network I/O (KB/s)</div>
                <canvas id="detail-chart-net" height="120"></canvas>
            </div>
            <div class="detail-metrics-chart">
                <div class="detail-chart-title">Block I/O (KB/s)</div>
                <canvas id="detail-chart-disk" height="120"></canvas>
            </div>
        </div>
    `;

    const rangeSelect = document.getElementById('detail-metrics-range');
    rangeSelect.addEventListener('change', () => fetchAndRenderMetrics(svc, rangeSelect.value));
    await fetchAndRenderMetrics(svc, '24h');
}

async function fetchAndRenderMetrics(svc, range) {
    const end = Math.floor(Date.now() / 1000);
    const rangeSeconds = { '1h': 3600, '6h': 21600, '24h': 86400, '7d': 604800 }[range] || 86400;
    const start = end - rangeSeconds;
    const step = Math.max(60, Math.floor(rangeSeconds / 300));
    const key = svc.key.toLowerCase();
    const variants = [key, key.replace(/-/g, '_'), key.replace(/_/g, '-')];
    const containerRegex = variants.join('|');

    const queries = {
        cpu:  `sum by (container) (container_cpu_utilization_ratio{container=~"${containerRegex}"}) * 100`,
        ram:  `sum by (container) (container_memory_percent_ratio{container=~"${containerRegex}"})`,
        net:  `sum by (container) (rate(container_network_receive_bytes_total{container=~"${containerRegex}"}[5m]) + rate(container_network_transmit_bytes_total{container=~"${containerRegex}"}[5m])) / 1024`,
        disk: `sum by (container) (rate(container_blockio_io_service_bytes_recursive_total{container=~"${containerRegex}"}[5m])) / 1024`
    };

    const vmBase = `${location.origin}/vm/api/v1/query_range`;

    try {
        if (_metricsAbort) _metricsAbort.abort();
        _metricsAbort = new AbortController();

        const results = await Promise.all(Object.entries(queries).map(async ([name, q]) => {
            try {
                const url = `${vmBase}?query=${encodeURIComponent(q)}&start=${start}&end=${end}&step=${step}`;
                const res = await fetch(url, { signal: _metricsAbort.signal, credentials: 'include' });
                if (!res.ok) return { name, points: [] };
                const json = await res.json();
                const series = json?.data?.result?.[0]?.values || [];
                return { name, points: series.map(([ts, v]) => ({ x: parseFloat(ts), y: parseFloat(v) })).filter(p => Number.isFinite(p.y)) };
            } catch(_) { return { name, points: [] }; }
        }));

        const charts = Object.fromEntries(results.map(r => [r.name, r.points]));

        drawMetricChart('detail-chart-cpu',  charts.cpu,  '#10b981');
        drawMetricChart('detail-chart-ram',  charts.ram,  '#8266ed');
        drawMetricChart('detail-chart-net',  charts.net,  '#00e5ff');
        drawMetricChart('detail-chart-disk', charts.disk, '#f59e0b');
    } catch (err) {
        if (err.name === 'AbortError') return;
        document.getElementById('detail-metrics-charts').innerHTML =
            `<div class="detail-empty">Failed to load metrics: ${escapeHtml(err.message)}</div>`;
    }
}

function drawMetricChart(canvasId, points, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !points || points.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 400;
    const h = canvas.clientHeight || 120;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const min = 0;
    const max = Math.max(10, ...points.map(p => p.y));
    const xs = i => (i / (points.length - 1)) * w;
    const ys = v => h - ((v - min) / (max - min)) * h * 0.9 - h * 0.05;

    // Area fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '44');
    grad.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.moveTo(xs(0), h);
    points.forEach((p, i) => ctx.lineTo(xs(i), ys(p.y)));
    ctx.lineTo(xs(points.length - 1), h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(xs(i), ys(p.y)) : ctx.lineTo(xs(i), ys(p.y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
}

// === TRACES TAB ===
async function renderTracesTab(container) {
    const svc = _currentService;
    if (!svc) return;

    const hostname = svc.instance ? new URL(svc.instance).hostname : svc.key;

    try {
        const url = `${apiEndpoints.jaeger}/traces?service=${encodeURIComponent(hostname)}&limit=20&lookback=1h`;
        const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const traces = data?.data || [];

        if (traces.length === 0) {
            container.innerHTML = '<div class="detail-empty">No recent traces found.</div>';
            return;
        }

        container.innerHTML = `<div class="detail-traces-list">${
            traces.slice(0, 30).map(t => {
                const traceId = t.traceID || t.trace_id || '';
                const spans = t.spans || [];
                const rootSpan = spans[0] || {};
                const duration = rootSpan.duration ? (rootSpan.duration / 1000).toFixed(1) + 'ms' : '—';
                const opName = rootSpan.operationName || rootSpan.operation_name || '—';
                const startTime = rootSpan.startTime ? new Date(rootSpan.startTime / 1000).toLocaleString() : '—';
                const svcName = (rootSpan.process?.serviceName) || hostname;
                return `<div class="trace-row">
                    <div class="trace-header">
                        <span class="trace-op">${escapeHtml(opName)}</span>
                        <span class="trace-duration">${duration}</span>
                    </div>
                    <div class="trace-meta">
                        <span class="trace-svc">${escapeHtml(svcName)}</span>
                        <span class="trace-id">${escapeHtml(traceId.substring(0, 16))}…</span>
                        <span class="trace-time">${escapeHtml(startTime)}</span>
                    </div>
                </div>`;
            }).join('')
        }</div>`;
    } catch (err) {
        container.innerHTML = `<div class="detail-empty">Failed to load traces: ${escapeHtml(err.message)}</div>`;
    }
}

// === CONTAINER TAB ===
async function renderContainerTab(container) {
    const svc = _currentService;
    if (!svc) return;

    // Show basic info from config + live stats from VM
    const key = svc.key.toLowerCase();
    const stats = window.__lastStats || {};
    const cpu = matchStatValue(key, stats.dockerCpu);
    const ram = matchStatValue(key, stats.dockerRam);
    const status = window.__serviceStatus?.[svc.key] || 'pending';

    const cpuStr = cpu !== undefined ? cpu.toFixed(1) + '%' : '—';
    const ramStr = ram !== undefined ? ram.toFixed(1) + '%' : '—';

    container.innerHTML = `
        <div class="detail-container-grid">
            <div class="detail-ct-field"><span class="detail-ct-label">Service</span><span class="detail-ct-value">${escapeHtml(svc.name)}</span></div>
            <div class="detail-ct-field"><span class="detail-ct-label">Port</span><span class="detail-ct-value">${escapeHtml(svc.port)}</span></div>
            <div class="detail-ct-field"><span class="detail-ct-label">Status</span><span class="detail-ct-value detail-ct-status ${status}">${status.toUpperCase()}</span></div>
            <div class="detail-ct-field"><span class="detail-ct-label">Instance</span><span class="detail-ct-value">${escapeHtml(svc.instance || 'N/A')}</span></div>
            <div class="detail-ct-field"><span class="detail-ct-label">CPU</span><span class="detail-ct-value">${cpuStr}</span></div>
            <div class="detail-ct-field"><span class="detail-ct-label">RAM</span><span class="detail-ct-value">${ramStr}</span></div>
        </div>
        <div class="detail-ct-section">
            <h4>Features</h4>
            <ul class="detail-ct-features">${(svc.features || []).map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
        </div>
        <div class="detail-ct-section">
            <h4>Description</h4>
            <p class="detail-ct-desc">${escapeHtml(state.currentLang === 'en' ? (svc.descEn || svc.desc) : svc.desc)}</p>
        </div>
    `;
}

function matchStatValue(serviceKey, map) {
    if (!map || !(map instanceof Map)) return undefined;
    const k = (serviceKey || '').toLowerCase();
    const variants = [k, k.replace(/-/g, '_'), k.replace(/_/g, '-')];
    for (const v of variants) {
        for (const [name, val] of map) {
            if (name === v || name.includes(v) || v.includes(name)) return val;
        }
    }
    return undefined;
}

// === CONFIG TAB ===
function renderConfigTab(container) {
    const svc = _currentService;
    if (!svc) return;

    const catKey = findCategoryForService(svc.key);
    const cat = categories.find(c => c.key === catKey);

    container.innerHTML = `
        <div class="detail-config-grid">
            <div class="detail-cfg-field"><span class="detail-cfg-label">Service Key</span><span class="detail-cfg-value mono">${escapeHtml(svc.key)}</span></div>
            <div class="detail-cfg-field"><span class="detail-cfg-label">Category</span><span class="detail-cfg-value">${escapeHtml(cat?.label || catKey)}</span></div>
            <div class="detail-cfg-field"><span class="detail-cfg-label">Port</span><span class="detail-cfg-value mono">${escapeHtml(svc.port)}</span></div>
            <div class="detail-cfg-field"><span class="detail-cfg-label">Instance URL</span><span class="detail-cfg-value mono">${escapeHtml(svc.instance || 'N/A')}</span></div>
            <div class="detail-cfg-field"><span class="detail-cfg-label">Group</span><span class="detail-cfg-value">${escapeHtml(svc.group || '—')}</span></div>
            <div class="detail-cfg-field"><span class="detail-cfg-label">Has HTTP Endpoint</span><span class="detail-cfg-value">${svc.instance ? 'Yes' : 'No'}</span></div>
        </div>
    `;
}

// === NOTES TAB ===
function renderNotesTab(container) {
    const svc = _currentService;
    if (!svc) return;

    const existingNote = state.serviceNotes[svc.key] || '';

    container.innerHTML = `
        <div class="detail-notes-area">
            <textarea class="detail-notes-input" id="detail-notes-input"
                placeholder="${translations[state.currentLang]['notes-placeholder'] || 'Add a note…'}"
                rows="10">${escapeHtml(existingNote)}</textarea>
            <div class="detail-notes-actions">
                <button class="detail-notes-save" id="detail-notes-save" type="button">
                    ${translations[state.currentLang]['notes-save'] || 'Save'}
                </button>
                <span class="detail-notes-status" id="detail-notes-status"></span>
            </div>
        </div>
    `;

    document.getElementById('detail-notes-save').addEventListener('click', () => {
        const text = document.getElementById('detail-notes-input').value;
        const notes = { ...state.serviceNotes, [svc.key]: text };
        setState({ serviceNotes: notes });
        const status = document.getElementById('detail-notes-status');
        status.textContent = 'Saved!';
        setTimeout(() => { if (status) status.textContent = ''; }, 2000);
    });
}

// === RECENTLY VISITED ===
function trackRecentVisit(serviceKey) {
    let recent = [...(state.recentServices || [])];
    recent = recent.filter(k => k !== serviceKey);
    recent.unshift(serviceKey);
    if (recent.length > 10) recent = recent.slice(0, 10);
    setState({ recentServices: recent });
}

export function getRecentServices() {
    return (state.recentServices || []).map(key => {
        for (const list of Object.values(services)) {
            const found = list.find(s => s.key === key);
            if (found) return found;
        }
        return null;
    }).filter(Boolean);
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
