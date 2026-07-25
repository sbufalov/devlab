// === ACTIVITIES MODULE ===
// Aggregates GitLab commits, CI pipelines, and Plane tasks into a unified timeline.

import { apiEndpoints, translations } from './config.js';
import { state } from './state.js';

const FETCH_TIMEOUT = 10000;

// === MAIN ACTIVITY FEED ===
export async function fetchActivities() {
    const [commits, pipelines, tasks] = await Promise.allSettled([
        fetchGitLabCommits(),
        fetchGitLabPipelines(),
        fetchPlaneTasks()
    ]);

    const items = [];

    if (commits.status === 'fulfilled') {
        commits.value.forEach(c => items.push({
            kind: 'commit',
            title: c.title || c.message?.split('\n')[0] || '—',
            author: c.author_name || c.author?.name || '—',
            project: c.project || '',
            time: new Date(c.created_at || c.committed_date),
            ref: c.short_id || (c.id || '').substring(0, 8),
            url: c.web_url || ''
        }));
    }

    if (pipelines.status === 'fulfilled') {
        pipelines.value.forEach(p => items.push({
            kind: 'pipeline',
            title: `${p.ref || '—'} — ${p.status || 'unknown'}`,
            author: p.user?.name || '—',
            project: p.project || '',
            time: new Date(p.created_at),
            ref: `#${p.id || ''}`,
            status: p.status,
            url: p.web_url || ''
        }));
    }

    if (tasks.status === 'fulfilled') {
        tasks.value.forEach(t => items.push({
            kind: 'task',
            title: t.name || t.title || '—',
            author: t.assignees?.map(a => a.display_name || a.email).join(', ') || '—',
            project: t.project?.name || '',
            time: new Date(t.created_at || t.updated_at),
            ref: t.identifier || t.sequence_id || '',
            state: t.state || '',
            url: ''
        }));
    }

    // Sort by time, newest first
    items.sort((a, b) => b.time - a.time);
    return items;
}

// === GITLAB COMMITS ===
async function fetchGitLabCommits() {
    const token = window.GITLAB_TOKEN || '';
    if (!token) return [];
    try {
        const url = `${apiEndpoints.gitlab}/events?action=pushed&per_page=20`;
        const res = await fetchWithTimeout(url, {
            headers: { 'PRIVATE-TOKEN': token }
        });
        if (!res.ok) return [];
        const events = await res.json();
        const commits = [];
        for (const ev of events) {
            if (ev.push_data?.commit_to) {
                commits.push({
                    title: ev.push_data.commit_title || ev.push_data.ref,
                    author_name: ev.author?.name || '—',
                    created_at: ev.created_at,
                    short_id: (ev.push_data.commit_to || '').substring(0, 8),
                    web_url: '',
                    project: ev.project?.name || ''
                });
            }
        }
        return commits;
    } catch { return []; }
}

// === GITLAB PIPELINES ===
async function fetchGitLabPipelines() {
    const token = window.GITLAB_TOKEN || '';
    if (!token) return [];
    try {
        const url = `${apiEndpoints.gitlab}/events?action=pushed&per_page=20`;
        const res = await fetchWithTimeout(url, {
            headers: { 'PRIVATE-TOKEN': token }
        });
        if (!res.ok) return [];
        const events = await res.json();
        const pipelines = [];
        for (const ev of events) {
            if (ev.target_type === 'Ci::Pipeline' || ev.push_data?.commit_to) {
                pipelines.push({
                    id: ev.target_id || '',
                    ref: ev.push_data?.ref || ev.target_title || '—',
                    status: ev.push_data?.action === 'pushed' ? 'success' : 'unknown',
                    user: { name: ev.author?.name || '—' },
                    created_at: ev.created_at,
                    web_url: '',
                    project: ev.project?.name || ''
                });
            }
        }
        return pipelines;
    } catch { return []; }
}

// === PLANE TASKS ===
async function fetchPlaneTasks() {
    const token = window.PLANE_TOKEN || '';
    if (!token) return [];
    try {
        const url = `${apiEndpoints.plane}/work-items?per_page=20&order_by=-updated_at`;
        const res = await fetchWithTimeout(url, {
            headers: { 'x-api-key': token }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data?.results || data?.data || [];
    } catch { return []; }
}

// === HELPERS ===
async function fetchWithTimeout(url, opts = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    try {
        const res = await fetch(url, { ...opts, signal: ctrl.signal, credentials: 'include' });
        return res;
    } finally {
        clearTimeout(t);
    }
}

export function renderActivityItem(item) {
    const lang = state.currentLang;
    const timeStr = formatRelativeTime(item.time, lang);
    const kindLabel = translations[lang][`act-${item.kind}`] || item.kind;

    const kindClass = item.kind === 'commit' ? 'act-commit'
                    : item.kind === 'pipeline' ? 'act-pipeline'
                    : 'act-task';

    const statusIcon = item.kind === 'pipeline'
        ? (item.status === 'success' ? '✓' : item.status === 'failed' ? '✗' : '●')
        : item.kind === 'task'
        ? (item.state === 'completed' ? '✓' : item.state === 'cancelled' ? '✗' : '●')
        : '●';

    const titleContent = item.url
        ? `<a href="${item.url}" target="_blank" rel="noopener" class="act-title-link">${escapeHtml(item.title)}</a>`
        : `<span class="act-title-text">${escapeHtml(item.title)}</span>`;

    return `
        <div class="act-item act-${kindClass}">
            <div class="act-dot">${statusIcon}</div>
            <div class="act-body">
                <div class="act-header">
                    ${titleContent}
                    <span class="act-kind">${kindLabel}</span>
                </div>
                <div class="act-meta">
                    <span class="act-author">${escapeHtml(item.author)}</span>
                    ${item.ref ? `<span class="act-ref">${escapeHtml(item.ref)}</span>` : ''}
                    ${item.project ? `<span class="act-project">${escapeHtml(item.project)}</span>` : ''}
                    <span class="act-time">${timeStr}</span>
                </div>
            </div>
        </div>
    `;
}

function formatRelativeTime(date, lang) {
    if (!(date instanceof Date) || isNaN(date)) return '—';
    const now = Date.now();
    const diff = Math.max(0, now - date.getTime());
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60)  return lang === 'ru' ? 'только что' : 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)  return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)    return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
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
