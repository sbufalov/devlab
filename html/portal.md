# Semantec Lab Website

## Layout
```
project/
├── index.html                 # Just main skeleton
├── css/
│   ├── variables.css          # CSS custom properties only
│   ├── layout.css             # Grid system, header, footer, sidebar
│   ├── components.css         # Cards, buttons, forms, badges
│   ├── effects.css            # Backgrounds, animations
│   └── themes.css             # Light/dark mode overrides
├── js/
│   ├── config.js              # Services data + translations (read-only)
│   ├── state.js               # Global state management (currentLang, currentTheme, etc.)
│   ├── render.js              # DOM rendering functions (sidebar, cards)
│   ├── events.js              # Event handlers (clicks, keyboard, search)
│   ├── settings.js            # Settings panel + localStorage
│   ├── api.js                 # VictoriaMetrics + status updates
│   └── particles.js           # Canvas particle system
└── index.js                   # Entry point (imports + init)
```

## Key Principles:

### CSS Split Logic:
- variables.css = Single source of truth for colors, spacing
- layout.css = Structural positioning (flexbox, grid)
- components.css = Visual styling (colors, borders, shadows)
- effects.css = Decorative (nebula, scanlines, particles)
- themes.css = [data-theme="light"] overrides only

### JS Split Logic:
- config.js = Pure data (no logic, just exports)
- state.js = Single reactive store (like Redux lite)
- render.js = DOM creation (renderSidebar(), renderCards())
- events.js = Listeners (onClick, onKeyDown, onSearch)
- settings.js = Settings panel + persistence
- api.js = External communication (fetch, WebSocket future)
- particles.js = Isolated canvas logic (no DOM dependencies)

## Import Strategy:

### In index.html

```html
<!-- CSS (order matters for cascading) -->
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/effects.css">
<link rel="stylesheet" href="css/themes.css">

<!-- JS (use ES6 modules) -->
<script type="module" src="js/index.js"></script>
```

### In js/index.js

```JavaScript
import { services, translations } from './config.js';
import { state, setState } from './state.js';
import { renderSidebar, renderCards } from './render.js';
import { initEvents } from './events.js';
import { initSettings } from './settings.js';
import { updateServiceStatus } from './api.js';
import { initParticles } from './particles.js';

// App initialization
document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
    renderCards();
    initEvents();
    initSettings();
    initParticles();
    updateServiceStatus();
    setInterval(updateServiceStatus, 30000);
});
```

## Benefits of This Approach:

### For Development:
- Change card hover effect? → Edit components.css only
- Add new service? → Edit config.js only
- Fix keyboard navigation? → Edit events.js only
- Tweak nebula colors? → Edit effects.css + variables.css

### For Testing:
- Mock api.js for unit tests (no real VictoriaMetrics needed)
- Test render.js in isolation (pure functions)
- Disable particles.js for performance profiling

### For Performance:
- Lazy-load particles.js (not critical for first paint)
- Inline variables.css + layout.css (critical CSS)
- Defer effects.css (visual candy)

### For Collaboration:
- Designer edits CSS files only (no JS knowledge needed)
- Backend dev edits api.js only
- UX designer edits config.js (service descriptions)

