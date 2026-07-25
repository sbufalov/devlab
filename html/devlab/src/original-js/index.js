// === Entry point ===
async function init() {
    try {
        const { loadState }          = await import('./state.js');
        const { renderHeader, renderFooter, renderModal, renderSidebar,
                renderMain, applyTranslations } = await import('./render.js');
        const { initEvents, setupResponsive } = await import('./events.js');
        const { initSettings }       = await import('./settings.js');
        const { startPolling }       = await import('./api.js');
        const { initParticles }      = await import('./particles.js');
        const { initPalette }        = await import('./palette.js');

        loadState();

        renderHeader();
        renderFooter();
        renderModal();
        renderSidebar();
        renderMain();
        applyTranslations();

        initEvents();
        initSettings();
        setupResponsive();
        initParticles();
        startPolling();
        initPalette();

        // Fade loader out
        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (!loader) return;
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.visibility = 'hidden'; }, 500);
        }, 400);
    } catch (error) {
        console.error('INITIALIZATION FAILED:', error);
        const loader = document.getElementById('loader');
        if (loader) {
            loader.innerHTML = `
                <div style="color:#ef4444;font-family:monospace;text-align:center;padding:40px;max-width:680px;">
                    <h2 style="margin-bottom:12px;">⚠ Initialization error</h2>
                    <p style="margin:12px 0;word-break:break-all;"><strong>${error.message}</strong></p>
                    <pre style="background:rgba(0,0,0,0.5);padding:15px;border-radius:5px;text-align:left;font-size:11px;overflow:auto;max-height:300px;">${(error.stack || '').replace(/[<&]/g, c => ({'<':'&lt;','&':'&amp;'}[c]))}</pre>
                    <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:#8266ed;color:#fff;border:none;border-radius:6px;cursor:pointer;">Reload</button>
                </div>
            `;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
