import { state } from './state.js';
import { applyTranslations } from './render.js';
import { services } from './config.js';

// ---------------------------------------------------------------------------
// VictoriaMetrics endpoint
// ---------------------------------------------------------------------------
// If a global override is provided (e.g. <script>window.VM_API_URL='…'</script>)
// we honor it.  Otherwise we default to the same host as the page, on /vm/,
// which is the Caddy reverse-proxy route that handles CORS for the browser.
const VM_API_URL = (typeof window !== 'undefined' && window.VM_API_URL)
    || `${location.origin}/vm/api/v1/query`;

// Alertmanager v2 — used directly (set window.ALERTMANAGER_URL to override).
// Add a Caddy route like `handle /am/* { uri strip_prefix /am; reverse_proxy alertmanager:9093; header ... }`
// and point this var at `${location.origin}/am/api/v2/alerts` if CORS is an issue.
const AM_API_URL = (typeof window !== 'undefined' && window.ALERTMANAGER_URL)
    || `https://alertmanager.semantec.lan/api/v2/alerts`;

const FETCH_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Shared helpers for OTEL/docker_stats series produced by your collector.
//   - Docker CPU: container_cpu_utilization_ratio  (ratio 0..1+, multiply by 100)
//   - Docker RAM: container_memory_percent_ratio   (already a percentage)
//   - System CPU: node_cpu_usage_percentage         (percentage, already 0-100)
//   - System RAM: node_memory_usage_percentage      (percentage)
//   - NVMe read/write: node_disk_read_bytes_total / node_disk_writes_bytes_total
//   - NVMe IOPS: node_disk_reads_total / node_disk_writes_total
//   - Label: container_name (or `container.name` from older OTLP payloads)
// ---------------------------------------------------------------------------
function getContainerName(metric) {
    if (!metric) return null;
    return (metric['container'] || metric['container_name'] || metric['container.name'] || '')
        .toLowerCase().trim();
}

function toContainerMap(results) {
    const map = new Map();
    for (const r of results || []) {
        const name = getContainerName(r.metric);
        if (!name) continue;
        const v = parseFloat(r.value?.[1]);
        if (Number.isFinite(v)) map.set(name, v);
    }
    return map;
}

function toContainerSeriesMap(results) {
    const map = new Map();
    for (const r of results || []) {
        const name = getContainerName(r.metric);
        if (!name) continue;
        map.set(name, r.values || []);
    }
    return map;
}

function matchContainerValue(serviceKey, map) {
    const k = (serviceKey || '').toLowerCase();
    const variants = [k, k.replace(/-/g, '_'), k.replace(/_/g, '-')];
    for (const variant of variants) {
        for (const [name, val] of map) {
            if (name === variant || name.includes(variant) || variant.includes(name)) {
                return val;
            }
        }
    }
    return undefined;
}

// ---------------------------------------------------------------------------
// Notifications (UP→DOWN flips)
// ---------------------------------------------------------------------------
let _prevStatus = null;
function maybeRequestNotifPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        // Only ask once per session, on first user gesture
        const ask = () => {
            Notification.requestPermission();
            window.removeEventListener('click', ask);
            window.removeEventListener('keydown', ask);
        };
        window.addEventListener('click', ask, { once: true });
        window.addEventListener('keydown', ask, { once: true });
    }
}
function notifyFlip(name, from, to) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
        new Notification(`${name} is ${to.toUpperCase()}`, {
            body: `Status changed: ${from} → ${to}`,
            tag: `flip-${name}`,
            silent: false
        });
    } catch (_) {}
}
maybeRequestNotifPermission();


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize anything that might appear in an `instance`/`target` label
 *  or a service `instance` URL down to a bare host:port-less string. */
function normalizeHost(s) {
    if (!s) return '';
    let v = String(s).trim().toLowerCase();
    // Strip protocol
    v = v.replace(/^https?:\/\//, '');
    // Strip path / query / fragment
    v = v.split('/')[0].split('?')[0].split('#')[0];
    // Strip default ports
    v = v.replace(/:(?:80|443)$/, '');
    return v;
}

async function vmFetch(query) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(`${VM_API_URL}?query=${encodeURIComponent(query)}`, {
            signal: ctrl.signal,
            credentials: 'include',
            headers: { Accept: 'application/json' }
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText} for query=${query}`);
        }
        const json = await res.json();
        // VictoriaMetrics returns {status:"success", data:{result:[...]}}
        if (json.status && json.status !== 'success') {
            throw new Error(`VM error: ${json.error || json.errorType || 'unknown'}`);
        }
        return json?.data?.result || [];
    } finally {
        clearTimeout(t);
    }
}

/** Build a "host -> service key" lookup once, from config.js. */
let _hostIndex = null;
function getHostIndex() {
    if (_hostIndex) return _hostIndex;
    _hostIndex = new Map();
    Object.values(services).flat().forEach(svc => {
        if (!svc.instance) return;
        _hostIndex.set(normalizeHost(svc.instance), svc.key);
    });
    return _hostIndex;
}

// ---------------------------------------------------------------------------
// Service status (probe_success)
// ---------------------------------------------------------------------------

export async function updateServiceStatus() {
    try {
        // Suppress hover effects during status update to prevent visual flicker
        document.body.classList.add('status-updating');

        const results = await vmFetch('probe_success');

        // Build a map keyed by normalized host -> "1" or "0"
        const statusByHost = new Map();
        for (const item of results) {
            const m = item.metric || {};
            // probe_success can carry the target as `instance`, `target`,
            // `__address__`, or even a custom `host` label — try them all.
            const candidates = [m.instance, m.target, m.__address__, m.host, m.url]
                .filter(Boolean);
            const value = item.value?.[1];
            for (const c of candidates) {
                statusByHost.set(normalizeHost(c), value);
            }
        }

        // Update the global status cache for ALL services (background update)
        window.__serviceStatus = window.__serviceStatus || {};
        const allSvcs = Object.values(services).flat();
        allSvcs.forEach(svc => {
            if (!svc.instance) {
                // Non-HTTP services (DB ports, etc.) are always online
                window.__serviceStatus[svc.key] = 'up';
                return;
            }
            const host = normalizeHost(svc.instance);
            const status = statusByHost.get(host);
            if (status === '1' || status === 1) {
                window.__serviceStatus[svc.key] = 'up';
            } else if (status === '0' || status === 0) {
                window.__serviceStatus[svc.key] = 'down';
            }
            // else: leave as 'pending' or previous value
        });

        // Update visible card badges from the global cache
        document.querySelectorAll('.service-card[data-service]').forEach(card => {
            const key = card.dataset.service;
            const st = window.__serviceStatus[key];
            if (!st || st === 'pending') return;

            const badge = card.querySelector('.status-badge');
            if (!badge) return;

            card.setAttribute('data-status', st);
            if (st === 'up') {
                badge.className = 'status-badge up';
                badge.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span data-i18n="status-online">STATUS: ONLINE</span>
                `;
            } else if (st === 'down') {
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
        });

        applyTranslations();

        // Fire notifications on status flips
        const prev = _prevStatus || {};
        for (const [key, st] of Object.entries(window.__serviceStatus)) {
            const wasSt = prev[key];
            if (wasSt && wasSt !== st && (wasSt === 'up' || st === 'down')) {
                // Find the service name from config
                const svc = allSvcs.find(s => s.key === key);
                const name = svc ? svc.name : key;
                notifyFlip(name, wasSt, st);
            }
        }
        _prevStatus = { ...window.__serviceStatus };

        // Also paint sidebar link dots and category-down counts
        paintSidebarStatus();
        recomputeCategoryHealth();
        document.dispatchEvent(new CustomEvent('status:updated'));

        // Remove hover suppression after a brief delay (allow CSS to settle)
        setTimeout(() => document.body.classList.remove('status-updating'), 100);
    } catch (error) {
        console.error('[VM] updateServiceStatus failed:', error);
        document.body.classList.remove('status-updating');
    }
}

// Paint .service-status dots on every sidebar link from cached status.
export function paintSidebarStatus() {
    const map = window.__serviceStatus || {};
    document.querySelectorAll('.service-link[data-service]').forEach(link => {
        const dot = link.querySelector('.service-status');
        if (!dot) return;
        const st = map[link.dataset.service];
        dot.classList.toggle('up',   st === 'up');
        dot.classList.toggle('down', st === 'down');
    });
}

// Count down services per category (from config — not DOM-dependent).
export function recomputeCategoryHealth() {
    const map = window.__serviceStatus || {};
    import('./config.js').then(({ services }) => {
        Object.entries(services).forEach(([catKey, list]) => {
            const down = list.filter(s => map[s.key] === 'down').length;
            const headers = document.querySelectorAll(
                `.nav-category[data-category="${catKey}"] .category-header`
            );
            headers.forEach(h => {
                if (down > 0) h.setAttribute('data-down', String(down));
                else          h.removeAttribute('data-down');
            });
        });
    });
}

// ---------------------------------------------------------------------------
// Resource stats — full metrics including Docker, System CPU/RAM, NVMe
// ---------------------------------------------------------------------------

export async function updateResourceStats() {
    // OTEL docker_stats and node_exporter metrics
    // Docker CPU is a ratio (0..1+), multiply by 100 for percent
    // Docker RAM is already emitted as a percentage
    // System CPU/RAM come from node_exporter (0-100 scale)
    // NVMe metrics are cumulative counters in bytes — compute rate per second
    const queries = {
        dockerCpu:   'sum by (container) (container_cpu_utilization_ratio{container!=""}) * 100',
        dockerRam:   'sum by (container) (container_memory_percent_ratio{container!=""})',
        systemCpu:   'sum by (container) (rate(container_cpu_usage_nanoseconds_total{container!=""}[5m])) / scalar(count(count by (cpu)(system_cpu_time_seconds_total))) / 1e7',
        systemRam:   'sum by (container) (container_memory_usage_total_bytes{container!=""} / 1024 / 1024)',
        nvmeReadB:   'sum by (container) (rate(container_blockio_io_service_bytes_recursive_total{container!="", operation=~"(?i)read"}[5m])) / 1024',
        nvmeWriteB:  'sum by (container) (rate(container_blockio_io_service_bytes_recursive_total{container!="", operation=~"(?i)write"}[5m])) / 1024'
    };

    let results = {};
    try {
        const allQueries = Object.entries(queries);
        const fetched = await Promise.all(allQueries.map(([, q]) => vmFetch(q)));
        results = Object.fromEntries(allQueries.map(([k], i) => [k, fetched[i]]));
    } catch (error) {
        console.error('[VM] updateResourceStats failed:', error);
        return;
    }

    const dockerCpuMap   = toContainerMap(results.dockerCpu);
    const dockerRamMap   = toContainerMap(results.dockerRam);
    const systemCpuMap   = toContainerMap(results.systemCpu);
    const systemRamMap   = toContainerMap(results.systemRam);
    const nvmeReadBMap   = toContainerMap(results.nvmeReadB);
    const nvmeWriteBMap  = toContainerMap(results.nvmeWriteB);

    // Publish comprehensive stats for the Alerts table and card widgets
    window.__lastStats = {
        dockerCpu: dockerCpuMap,
        dockerRam: dockerRamMap,
        systemCpu: systemCpuMap,
        systemRam: systemRamMap,
        nvmeReadB: nvmeReadBMap,
        nvmeWriteB: nvmeWriteBMap,
        at: Date.now()
    };
    document.dispatchEvent(new CustomEvent('stats:updated'));

    // Update per-card stat displays
    document.querySelectorAll('.service-card').forEach(card => {
        const key = (card.dataset.service || '').toLowerCase();
        const cpu = matchContainerValue(key, dockerCpuMap);
        const ram = matchContainerValue(key, dockerRamMap);

        const cpuValueEl = card.querySelector('.cpu-value');
        const ramValueEl = card.querySelector('.ram-value');
        const cpuBar     = card.querySelector('.cpu-bar');
        const ramBar     = card.querySelector('.ram-bar');

        if (cpu !== undefined) {
            const v = Math.max(0, Math.min(100, cpu)).toFixed(1);
            if (cpuValueEl) cpuValueEl.textContent = v;
            if (cpuBar) cpuBar.style.width = `${v}%`;
        }
        if (ram !== undefined) {
            const v = Math.max(0, Math.min(100, ram)).toFixed(1);
            if (ramValueEl) ramValueEl.textContent = v;
            if (ramBar) ramBar.style.width = `${v}%`;
        }
    });
}


// ---------------------------------------------------------------------------
// Footer uptime — average service availability over the last 24h
// ---------------------------------------------------------------------------

export async function updateFooterUptime() {
    const el = document.getElementById('footer-uptime-value');
    if (!el) return;
    try {
        // 1.0 = always up over last 24h, 0.0 = always down.  Average across all
        // probed targets gives us a single "lab availability" percentage.
        const results = await vmFetch('avg(avg_over_time(probe_success[24h]))');
        const v = parseFloat(results?.[0]?.value?.[1]);
        if (!Number.isFinite(v)) {
            el.textContent = '—';
            return;
        }
        const pct = v * 100;
        el.textContent = (pct >= 99.95 ? '100' : pct.toFixed(2)) + '%';
        // Color cue
        el.dataset.health = pct >= 99 ? 'good' : (pct >= 95 ? 'warn' : 'bad');
    } catch (err) {
        console.warn('[VM] uptime fetch failed', err);
        el.textContent = '—';
        delete el.dataset.health;
    }
}



// ---------------------------------------------------------------------------
// Per-card CPU & RAM sparklines (last 1h, ~60 points)
// ---------------------------------------------------------------------------

const SPARK_QUERIES = {
    // OTEL docker_stats — same series the resource-stats panel uses, just
    // grouped by container_name so we get one curve per container.
    cpu: 'sum by (container_name) (container_cpu_utilization_ratio{container_name!=""}) * 100',
    ram: 'sum by (container_name) (container_memory_percent_ratio{container_name!=""})'
};

async function fetchRange(promQL) {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 60 * 60;
    const step = 60;
    const url = `${VM_API_URL.replace('/query', '/query_range')}`
              + `?query=${encodeURIComponent(promQL)}`
              + `&start=${start}&end=${end}&step=${step}`;
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(url, {
            signal: ctrl.signal, credentials: 'include',
            headers: { Accept: 'application/json' }
        });
        clearTimeout(t);
        if (!res.ok) return [];
        const json = await res.json();
        return json?.data?.result || [];
    } catch (err) {
        return [];
    }
}

// Use the shared toContainerSeriesMap + matchContainerValue helpers defined
// near the top of the file so sparklines pick the same container as the stats.

export async function updateSparklines() {
    const canvases = document.querySelectorAll('canvas.spark[data-service]');
    if (canvases.length === 0) return;

    const wantCpu = !!document.querySelector('canvas.spark[data-metric="cpu"]');
    const wantRam = !!document.querySelector('canvas.spark[data-metric="ram"]');

    const [cpuRows, ramRows] = await Promise.all([
        wantCpu ? fetchRange(SPARK_QUERIES.cpu) : Promise.resolve([]),
        wantRam ? fetchRange(SPARK_QUERIES.ram) : Promise.resolve([])
    ]);

    const cpuByName = toContainerSeriesMap(cpuRows);
    const ramByName = toContainerSeriesMap(ramRows);

    canvases.forEach(c => {
        const key    = (c.dataset.service || '').toLowerCase();
        const metric = c.dataset.metric || 'cpu';
        const byName = metric === 'ram' ? ramByName : cpuByName;
        const series = matchContainerValue(key, byName);
        if (!series) return;
        const points = series.map(v => parseFloat(v[1])).filter(Number.isFinite);
        drawSpark(c, points, metric);
    });
}

function drawSpark(canvas, points, metric = 'cpu') {
    // Size from layout so we render at the actual CSS pixel size.  Without
    // this the canvases would stay at their default 300×150 and look squashed.
    const cssW = Math.max(1, canvas.clientWidth || canvas.parentElement.clientWidth || 120);
    const cssH = Math.max(1, canvas.clientHeight || 28);
    const dpr  = window.devicePixelRatio || 1;
    if (canvas.width  !== Math.round(cssW * dpr)) canvas.width  = Math.round(cssW * dpr);
    if (canvas.height !== Math.round(cssH * dpr)) canvas.height = Math.round(cssH * dpr);

    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    if (points.length < 2) return;

    const min = 0;
    const max = Math.max(10, ...points);
    const xs = (i) => (i / (points.length - 1)) * w;
    const ys = (v) => h - ((v - min) / (max - min)) * h * 0.9 - h * 0.05;

    // Resolve live color from CSS variables.
    const root = getComputedStyle(document.documentElement);
    let hue   = root.getPropertyValue('--icon-color-hue').trim();
    let sat   = root.getPropertyValue('--icon-color-sat').trim();
    let light = root.getPropertyValue('--icon-color-light').trim();

    const main  = `hsl(${hue}, ${sat}, ${light})`;
    const fill1 = `hsla(${hue}, ${sat}, ${light}, 0.45)`;
    const fill2 = `hsla(${hue}, ${sat}, ${light}, 0)`;

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, fill1);
    g.addColorStop(1, fill2);

    // Area
    ctx.beginPath();
    ctx.moveTo(xs(0), h);
    points.forEach((p, i) => ctx.lineTo(xs(i), ys(p)));
    ctx.lineTo(xs(points.length - 1), h);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // Stroke
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(xs(i), ys(p)) : ctx.lineTo(xs(i), ys(p)));
    ctx.strokeStyle = main;
    ctx.lineWidth = 1.5 * dpr;
    ctx.lineJoin = 'round';
    ctx.stroke();
}


// ---------------------------------------------------------------------------
// ALERTS — pulled directly from Alertmanager v2
//   GET ${AM_API_URL}            -> JSON array of alert objects
//   filter = ?filter=alertname="X" (we don't filter; just keep active ones)
// ---------------------------------------------------------------------------
export async function fetchAlerts() {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(`${AM_API_URL}?active=true&silenced=false&inhibited=false`, {
            signal: ctrl.signal,
            credentials: 'include',
            headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        return data
            // Defensive: keep only firing (Alertmanager labels them `active`)
            .filter(a => (a?.status?.state || 'active') === 'active')
            .map(a => {
                const labels      = a.labels      || {};
                const annotations = a.annotations || {};
                return {
                    name:     labels.alertname || 'alert',
                    severity: (labels.severity || 'warning').toLowerCase(),
                    instance: labels.instance || labels.service || labels.job || '',
                    summary:  annotations.summary || annotations.description || '',
                    startsAt: a.startsAt || null
                };
            });
    } catch (err) {
        console.warn('[Alertmanager] fetchAlerts failed', err);
        return [];
    } finally {
        clearTimeout(t);
    }
}

// ---------------------------------------------------------------------------
// Polling
// ---------------------------------------------------------------------------

let statusTimer = null;
let resourceTimer = null;
let uptimeTimer = null;

// Exported so settings.js can trigger a restart when the interval changes
export function restartPolling(interval) {
    if (statusTimer)   clearInterval(statusTimer);
    if (resourceTimer) clearInterval(resourceTimer);
    if (uptimeTimer)   clearInterval(uptimeTimer);

    const ms = (interval && interval >= 5000 && interval <= 180000) ? interval : 30000;

    statusTimer   = setInterval(updateServiceStatus, ms);
    resourceTimer = setInterval(updateResourceStats, ms);
    uptimeTimer   = setInterval(updateFooterUptime, 5 * 60_000); // every 5 min
    setInterval(updateSparklines, 60_000); // refresh sparklines once a minute

    // Initial fetch
    updateServiceStatus();
    updateResourceStats();
    updateFooterUptime();
}

export function startPolling() {
    // Initialize status cache for ALL services upfront so cards render with correct status immediately
    window.__serviceStatus = window.__serviceStatus || {};
    Object.values(services).flat().forEach(svc => {
        if (!svc.instance) {
            // Services without HTTP endpoint (DB ports, etc.) are always shown as online
            window.__serviceStatus[svc.key] = 'up';
        } else {
            // HTTP services start as pending until first probe
            window.__serviceStatus[svc.key] = 'pending';
        }
    });
    // Paint sidebar with initial status immediately
    paintSidebarStatus();
    recomputeCategoryHealth();

    // Listen for interval changes from settings panel
    document.addEventListener('interval:changed', (e) => {
        restartPolling(e.detail.interval);
    });

    // Use current state interval
    restartPolling(state.updateInterval);

    // Pause polling when the tab is hidden, resume when visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) return;
        updateServiceStatus();
        updateResourceStats();
        updateFooterUptime();
    });
}
