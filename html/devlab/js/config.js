// === TRANSLATIONS ===
export const translations = {
    ru: {
        'loading': 'ИНИЦИАЛИЗАЦИЯ ЗАЩИЩЕННОЙ СРЕДЫ...',
        'homelab-badge': 'Домашняя лаборатория',
        'nav-mail': 'Почта',
        'theme-dark': 'Dark',
        'theme-light': 'Light',
        'theme-system': 'Auto',
        'settings': 'Настройки',
        'color-scheme': 'Цветовая схема иконок',
        'nebula-intensity': 'Интенсивность туманности',
        'particle-density': 'Плотность частиц',
        'update-interval': 'Интервал обновления метрик',
        'help-title': 'Горячие клавиши',
        'help-sidebar': 'Поиск в боковой панели',
        'help-navigate': 'Навигация по сервисам',
        'help-theme': 'Сменить тему',
        'help-lang': 'Сменить язык',
        'help-qa': 'Меню быстрого доступа',
        'help-help': 'Показать это окно',
        'help-home': 'Главная страница',
        'uptime-label': 'Доступность',
        'uptime-tooltip': 'Средняя доступность сервисов за 24 часа',
        'help-palette': 'Командная палитра',
        'help-alerts': 'Страница алертов',
        'tab-alerts': 'Алерты',
        'alerts-title': 'Алерты и здоровье',
        'alerts-down-heading': 'Неактивные сервисы',
        'alerts-down-subtitle': 'Раннее выявление неработающих сервисов',
        'alerts-down-empty': 'Все сервисы работают.',
        'alerts-otel-heading': 'Сбои в работе',
        'alerts-otel-subtitle': 'Мониторинг сервисов через OTel и AlertManager',
        'alerts-otel-empty': 'Активных алертов нет.',
        'alerts-top-heading': 'Мониторинг ресурсов',
        'alerts-top-subtitle': 'Полная статистика использования CPU, RAM и NVMe по всем сервисам',
        'alerts-top-empty': 'Нет данных от VictoriaMetrics.',
        'alerts-loading': 'Загрузка…',
        'help-hamburger': 'Свернуть/развернуть меню',
        'help-category-n': 'Открыть категорию 1–9',
        'help-card-open': 'Открыть выбранный сервис',
        'home-title': 'Главная страница',
        'sort-by': 'Сортировка',
        'sort-default': 'По умолчанию',
        'sort-alpha': 'По алфавиту',
        'sort-count': 'По числу сервисов',
        'expand-all': 'Развернуть всё',
        'collapse-all': 'Свернуть всё',
        'tab-home': 'Главная',
        'subtitle': 'Централизованный портал для доступа ко всем инструментам разработки, инфраструктурным сервисам и инженерным системам.',
        'tab-workspace': 'Workspace',
        'tab-workflow': 'Workflow',
        'tab-datalake': 'Datalake',
        'tab-datasource': 'Datasource',
        'tab-infrastructure': 'Infrastructure',
        'tab-observability': 'Observability',
        'status-online': 'СТАТУС: ONLINE',
        'status-down': 'СТАТУС: DOWN',
        'status-pending': 'СТАТУС: ОЖИДАНИЕ',
        'footer-text': 'Локальная IT-инфраструктура.',
        // Resource table headers
        'th-category': 'Category',
        'th-service': 'Service',
        'th-docker-cpu': 'Docker CPU, %',
        'th-system-cpu': 'System Cores',
        'th-docker-ram': 'Docker RAM, %',
        'th-system-ram': 'System RAM, MB',
        'th-nvme-read-gb': 'NVMe Read, KB/s',
        'th-nvme-write-gb': 'NVMe Write, KB/s',
        // Table actions
        'table-no-data': 'Нет данных от VictoriaMetrics.',
                'table-filter-placeholder': 'фильтр...',
        'tab-bookmarks': 'Закладки',
        'bookmarks-title': 'Закладки',
        'bookmarks-subtitle': 'Ваши сохраненные сервисы.',
        'bookmarks-empty': 'У вас нет закладок.',
        'cards-per-row': 'Карточек в ряду',
        'tab-activities': 'Активности',
        'activities-title': 'Лента активности',
        'activities-subtitle': 'Коммиты GitLab, пайплайны и задачи Plane в единой ленте.',
        'activities-loading': 'Загрузка активности…',
        'activities-empty': 'Нет недавних активностей.',
        'act-commit': 'Коммит',
        'act-pipeline': 'Пайплайн',
        'act-task': 'Задача',
        'act-merge': 'Merge Request',
        'detail-logs': 'Логи',
        'detail-metrics': 'Метрики',
        'detail-traces': 'Трассировки',
        'detail-container': 'Контейнер',
        'detail-config': 'Конфигурация',
        'detail-notes': 'Заметки',
        'detail-no-instance': 'Нет HTTP-эндпоинта для этого сервиса.',
        'notes-placeholder': 'Добавить заметку…',
        'notes-save': 'Сохранить',
        'health-timeline-title': 'История доступности',
        'health-timeline-subtitle': 'Хронология событий доступности сервисов за выбранный период',
        'group-ai': 'AI Агенты',
        'group-auto': 'Автоматизация',
        'group-search': 'Поиск',
        'group-relational': 'Реляционные',
        'group-vector': 'Векторные',
        'group-cache': 'Кэш',
        'group-object': 'Объектные',
        'group-analytics': 'Аналитика',
        'group-storage': 'Хранилище',
        'group-media': 'Медиа',
        'group-docs': 'Документы',
        'group-comms': 'Коммуникации',
        'group-network': 'Сеть',
        'group-infra': 'Инфраструктура',
        'group-security': 'Безопасность',
        'group-metrics': 'Метрики',
        'group-logs': 'Логи',
        'group-traces': 'Трассировки',
        'group-profiling': 'Профилирование'
    },
    en: {
        'loading': 'INITIALIZING SECURE ENVIRONMENT...',
        'homelab-badge': 'Homelab Portal',
        'nav-mail': 'Webmail',
        'theme-dark': 'Dark',
        'theme-light': 'Light',
        'theme-system': 'Auto',
        'settings': 'Settings',
        'color-scheme': 'Icon Color Scheme',
        'nebula-intensity': 'Nebula Intensity',
        'particle-density': 'Particle Density',
        'update-interval': 'Metrics Update Interval',
        'help-title': 'Keyboard Shortcuts',
        'help-sidebar': 'Focus Sidebar Search',
        'help-navigate': 'Navigate Services',
        'help-theme': 'Toggle Theme',
        'help-lang': 'Toggle Language',
        'help-qa': 'Quick Access Menu',
        'help-help': 'Show this Menu',
        'help-home': 'Open Home Page',
        'uptime-label': 'Uptime',
        'uptime-tooltip': 'Average service availability over the last 24 hours',
        'help-palette': 'Command palette',
        'help-alerts': 'Alerts dashboard',
        'tab-alerts': 'Alerts',
        'alerts-title': 'Alerts & Health',
        'alerts-down-heading': 'Services Down',
        'alerts-down-subtitle': 'Early Detection of Unhealthy Services',
        'alerts-down-empty': 'All services are healthy.',
        'alerts-otel-heading': 'Active Alerts',
        'alerts-otel-subtitle': 'Monitor Services via OTel & AlertManager',
        'alerts-otel-empty': 'No active alerts.',
        'alerts-top-heading': 'Resource Monitoring',
        'alerts-top-subtitle': 'Full CPU, RAM and NVMe usage statistics across all services',
        'alerts-top-empty': 'No data from VictoriaMetrics.',
        'alerts-loading': 'Loading…',
        'help-hamburger': 'Toggle sidebar (hamburger)',
        'help-category-n': 'Jump to category 1–9',
        'help-card-open': 'Open focused service',
        'home-title': 'Home Page',
        'sort-by': 'Sort',
        'sort-default': 'Default order',
        'sort-alpha': 'Alphabetical',
        'sort-count': 'By service count',
        'expand-all': 'Expand all',
        'collapse-all': 'Collapse all',
        'tab-home': 'Home',
        'subtitle': 'Centralized portal for accessing all development tools, infrastructure services and engineering systems.',
        'tab-workspace': 'Workspace',
        'tab-workflow': 'Workflow',
        'tab-datalake': 'Datalake',
        'tab-datasource': 'Datasource',
        'tab-infrastructure': 'Infrastructure',
        'tab-observability': 'Observability',
        'status-online': 'STATUS: ONLINE',
        'status-down': 'STATUS: DOWN',
        'status-pending': 'STATUS: PENDING',
        'footer-text': 'Enterprise HomeLab Infrastructure.',
        // Resource table headers
        'th-category': 'Category',
        'th-service': 'Service',
        'th-docker-cpu': 'Docker CPU, %',
        'th-system-cpu': 'System Cores',
        'th-docker-ram': 'Docker RAM, %',
        'th-system-ram': 'System RAM, MB',
        'th-nvme-read-gb': 'NVMe Read, KB/s',
        'th-nvme-write-gb': 'NVMe Write, KB/s',
        // Table actions
        'table-no-data': 'No data from VictoriaMetrics.',
                'table-filter-placeholder': 'filter...',
        'tab-bookmarks': 'Bookmarks',
        'bookmarks-title': 'Bookmarks',
        'bookmarks-subtitle': 'Your saved services.',
        'bookmarks-empty': 'You have no bookmarked services.',
        'cards-per-row': 'Cards Per Row',
        'tab-activities': 'Activities',
        'activities-title': 'Activity Feed',
        'activities-subtitle': 'GitLab commits, CI pipelines, and Plane tasks in a unified timeline.',
        'activities-loading': 'Loading activity…',
        'activities-empty': 'No recent activities.',
        'act-commit': 'Commit',
        'act-pipeline': 'Pipeline',
        'act-task': 'Task',
        'act-merge': 'Merge Request',
        'detail-logs': 'Logs',
        'detail-metrics': 'Metrics',
        'detail-traces': 'Traces',
        'detail-container': 'Container',
        'detail-config': 'Config',
        'detail-notes': 'Notes',
        'detail-no-instance': 'No HTTP endpoint for this service.',
        'notes-placeholder': 'Add a note…',
        'notes-save': 'Save',
        'health-timeline-title': 'Uptime History',
        'health-timeline-subtitle': 'Service availability timeline over the selected period',
        'group-ai': 'AI Agents',
        'group-auto': 'Automation',
        'group-search': 'Search',
        'group-relational': 'Relational',
        'group-vector': 'Vector',
        'group-cache': 'Cache',
        'group-object': 'Object',
        'group-analytics': 'Analytics',
        'group-storage': 'Storage',
        'group-media': 'Media',
        'group-docs': 'Documents',
        'group-comms': 'Communications',
        'group-network': 'Network',
        'group-infra': 'Infrastructure',
        'group-security': 'Security',
        'group-metrics': 'Metrics',
        'group-logs': 'Logs',
        'group-traces': 'Traces',
        'group-profiling': 'Profiling'
    }
};

// === SERVICE DEFINITIONS ===
export const services = {
    workspace: [
        {
            key: 'gitlab',
            name: 'GitLab',
            subtitle: 'Source Control & CI/CD',
            desc: 'Платформа управления исходным кодом, CI/CD-конвейеры, Container & Package Registry (включая C++ Conan).',
            descEn: 'Complete DevOps platform for source control, CI/CD pipelines, Container & Package Registry (including C++ Conan).',
            icon: '<path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"></path>',
            features: ['Git Repository & Web IDE', 'Container Registry', 'C++ Conan Packages', 'Auto DevOps'],
            port: '80',
            instance: 'https://gitlab.semantec.lan'
        },
        {
            key: 'plane',
            name: 'Plane',
            subtitle: 'Agile Project Management',
            desc: 'Таск-трекер нового поколения для управления спринтами, циклами разработки и гибкими Kanban-досками.',
            descEn: 'Next-generation agile task tracker for sprint, cycle, and Kanban board management.',
            icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path>',
            features: ['Sprint Planning', 'Kanban Boards', 'Cycle Management', 'GitHub Integration'],
            port: '80',
            instance: 'https://plane.semantec.lan'
        },
        {
            key: 'outline',
            name: 'Outline',
            subtitle: 'Knowledge Base & Wiki',
            desc: 'Корпоративная база знаний и техническая wiki-документация с поддержкой разметки Markdown.',
            descEn: 'Fast team wiki, centralized internal knowledge base, and technical Markdown documentation.',
            icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><line x1="8" y1="7" x2="16" y2="7"></line><line x1="8" y1="11" x2="14" y2="11"></line>',
            features: ['Markdown Editor', 'Real-time Collaboration', 'Version History', 'API Access'],
            port: '80',
            instance: 'https://outline.semantec.lan'
        },
        {
            key: 'mattermost',
            name: 'Mattermost',
            subtitle: 'Enterprise Chat & ChatOps',
            desc: 'Корпоративный мессенджер и центральный интерфейс для управления ИИ-агентами через ChatOps.',
            descEn: 'Enterprise team messenger and primary command interface for ChatOps AI agent execution.',
            icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><circle cx="12" cy="10" r="2"></circle><path d="M8 10h.01"></path><path d="M16 10h.01"></path>',
            features: ['E2E Encryption', 'AI Agent Plugins', 'Channel Management', 'Webhooks & Bots'],
            port: '8065',
            instance: 'https://mattermost.semantec.lan'
        },
        {
            key: 'mcp-hub',
            name: 'Unified MCP Hub',
            subtitle: 'AI Orchestration & Sandbox',
            desc: 'Центральный ИИ-драйвер и защищенная «песочница» с g++ и Python для безопасной компиляции C++, бенчмаркинга и управления Docker/GitLab через MCP.',
            descEn: 'Unified AI driver and sandboxed development runtime executing C++ compilation (g++), Python analytics, and infrastructure control via MCP.',
            icon: '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path><path d="M12 6v6l4 2"></path><circle cx="12" cy="12" r="3"></circle>',
            features: ['C++ Sandbox (g++)', 'Python Runtime', 'Docker Controller', 'GitLab MCP Integration'],
            port: '3000',
            instance: 'https://mcp-hub.semantec.lan'
        }
    ],
    workflow: [
        {
            key: 'mattermost-ai',
            group: 'ai',
            name: 'Mattermost AI Framework',
            subtitle: 'AI Orchestration Engine',
            desc: 'Фоновый оркестратор ИИ-ассистентов, транслирующий команды из чата в инструменты MCP.',
            descEn: 'Core background AI orchestrator executing Model Context Protocol (MCP) tools directly from chat.',
            icon: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path>',
            features: ['MCP Tool Execution', 'Chat Command Parsing', 'Background Workers', 'Result Caching'],
            port: '8080',
        },
        {
            key: 'dify',
            group: 'ai',
            name: 'Dify',
            subtitle: 'LLMOps & AI Workflows',
            desc: 'LLMOps-платформа для визуального проектирования рабочих процессов ИИ, промпт-инженерии и RAG-систем.',
            descEn: 'Full-stack LLMOps platform for visual prompt engineering, application workflows, and RAG design.',
            icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>',
            features: ['Visual Workflow Builder', 'Prompt Engineering', 'RAG Pipeline', 'Multi-model Support'],
            port: '80',
            instance: 'https://dify.semantec.lan'
        },
        {
            key: 'onyx',
            group: 'search',
            name: 'Onyx',
            subtitle: 'Semantic AI Search',
            desc: 'Семантическая ИИ-поисковая система, непрерывно индексирующая код в GitLab и статьи в Outline.',
            descEn: 'Semantic AI search engine providing continuous indexing for source code (GitLab) and docs (Outline).',
            icon: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line>',
            features: ['Vector Embeddings', 'GitLab Indexing', 'Outline Integration', 'Fast Semantic Search'],
            port: '8080',
        },
        {
            key: 'autogen',
            group: 'ai',
            name: 'AutoGen Studio',
            subtitle: 'Multi-Agent Prototyping',
            desc: 'Среда проектирования, прототипирования и изолированного исполнения кода мультиагентных систем от Microsoft.',
            descEn: 'Microsoft multi-agent prototyping workspace and sandboxed code execution runtime environment.',
            icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline><circle cx="15" cy="15" r="1.5"></circle>',
            features: ['Agent Studio UI', 'Code Sandbox', 'Multi-agent Orchestration', 'Python Runtime'],
            port: '8080',
        },
        {
            key: 'crewai',
            group: 'ai',
            name: 'CrewAI Factory',
            subtitle: 'AI Crew Orchestration',
            desc: 'Студия оркестрации и фоновые воркеры для выполнения задач структурированными командами ИИ-агентов.',
            descEn: 'Orchestration production studio and background execution nodes for role-based AI agent crews.',
            icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
            features: ['Crew Designer', 'Role-based Agents', 'Task Pipeline', 'Background Executor'],
            port: '8080',
        },
        {
            key: 'mlflow',
            group: 'auto',
            name: 'MLflow',
            subtitle: 'ML Experiment Tracking',
            desc: 'Платформа жизненного цикла машинного обучения для логирования экспериментов и трекинга весов моделей.',
            descEn: 'Open-source MLOps platform for machine learning experiment logging and model weight tracking.',
            icon: '<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line>',
            features: ['Experiment Logging', 'Model Registry', 'S3 Artifact Store', 'PostgreSQL Metadata'],
            port: '5000',
            instance: 'https://mlflow.semantec.lan'
        },
        {
            key: 'n8n',
            group: 'auto',
            name: 'n8n',
            subtitle: 'Workflow Automation',
            desc: 'Визуальный движок автоматизации процессов, маршрутизации вебхуков и интеграции продвинутых ИИ-нод.',
            descEn: 'Node-based workflow automation engine, webhook orchestration, and advanced AI node logic.',
            icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
            features: ['Visual Workflow Editor', 'Webhook Triggers', 'AI Nodes', 'HTTP Request Integration'],
            port: '5678',
            instance: 'https://n8n.semantec.lan'
        }
    ],
    datalake: [
        {
            key: 'postgres',
            group: 'relational',
            name: 'PostgreSQL',
            subtitle: 'Relational Database Cluster',
            desc: 'Центральный высокопроизводительный кластер реляционной базы данных для хранения метаданных всех систем.',
            descEn: 'Central high-performance relational database cluster for shared application metadata storage.',
            icon: '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>',
            features: ['ACID Transactions', 'JSONB Support', 'Connection Pooling', 'Replication Ready'],
            port: '5432',
        },
        {
            key: 'weaviate',
            group: 'vector',
            name: 'Weaviate',
            subtitle: 'Vector Database',
            desc: 'Выделенная векторная база данных для быстрого семантического поиска, HNSW-графов и долговременной памяти ИИ.',
            descEn: 'Cloud-native vector database for fast text embeddings, HNSW graphs, and AI long-term memory.',
            icon: '<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><line x1="22" y1="8.5" x2="2" y2="15.5"></line>',
            features: ['HNSW Indexing', 'Text Embeddings', 'AI Memory Store', 'Semantic Search'],
            port: '8080',
            instance: 'https://weaviate.semantec.lan'
        },
        {
            key: 'redis',
            group: 'cache',
            name: 'Redis',
            subtitle: 'In-Memory Cache & Queue',
            desc: 'Быстрая база данных в оперативной памяти, выполняющая роль кэша и брокера очередей фоновых задач.',
            descEn: 'High-speed in-memory key-value database serving as a shared cache and Celery task queue broker.',
            icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>',
            features: ['Sub-millisecond Latency', 'Pub/Sub Messaging', 'Celery Broker', 'TTL Support'],
            port: '6379',
        },
        {
            key: 'minio',
            group: 'object',
            name: 'MinIO',
            subtitle: 'S3 Object Storage',
            desc: 'Высокоскоростное S3-совместимое объектное хранилище и run-once демон автоматической инициализации бакетов.',
            descEn: 'High-performance S3-compatible object storage infrastructure and automated multi-bucket setup daemon.',
            icon: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>',
            features: ['AWS S3 API', 'Versioning', 'Encryption', 'Multi-bucket Init'],
            port: '9001',
            instance: 'https://minio.semantec.lan'
        },
        {
            key: 'clickhouse',
            group: 'analytics',
            name: 'ClickHouse',
            subtitle: 'Analytical Database',
            desc: 'Столбцовая база данных больших объемов для сверхбыстрой аналитики и долгосрочного хранения логов.',
            descEn: 'Column-oriented analytical database cluster optimized for terabyte-scale log storage and analysis.',
            icon: '<path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="12" y2="17"></line>',
            features: ['Column-oriented Storage', 'TB-scale Analytics', 'Log Retention', 'SQL Interface'],
            port: '8123',
            instance: 'https://clickhouse.semantec.lan'
        },
        {
            key: 'nextcloud',
            group: 'storage',
            name: 'Nextcloud',
            subtitle: 'Private Cloud Storage',
            desc: 'Локальное облачное хранилище для пользовательских файлов и двусторонней синхронизации документов.',
            descEn: 'Private self-hosted cloud storage hub for multi-device document and file synchronization.',
            icon: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline>',
            features: ['Desktop & Mobile Sync', 'Office Collaboration', 'Calendar Integration', 'File Sharing'],
            port: '8080',
        }
    ],
    datasource: [
        {
            key: 'photoprism',
            group: 'media',
            name: 'PhotoPrism',
            subtitle: 'AI Photo Gallery',
            desc: 'Локальная медиагалерея под управлением ИИ с автоматическим распознаванием лиц и разметкой объектов.',
            descEn: 'AI-powered decentralized photo gallery featuring automated asset grouping and facial recognition.',
            icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
            features: ['Facial Recognition', 'RAW Support', 'Auto-organization', 'AI Tagging'],
            port: '2342',
        },
        {
            key: 'paperless',
            group: 'docs',
            name: 'Paperless-ngx',
            subtitle: 'Document Management',
            desc: 'Система каталогизации документов и цифрового архива со встроенным OCR-распознаванием текста Tesseract.',
            descEn: 'Digital document management archiving system with automated Tesseract OCR transcription and tagging.',
            icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line>',
            features: ['OCR with Tesseract', 'Auto-tagging', 'Email Ingestion', 'Full-text Search'],
            port: '8000',
        },
        {
            key: 'freshrss',
            group: 'docs',
            name: 'FreshRSS',
            subtitle: 'RSS Feed Aggregator',
            desc: 'Легковесный и модульный агрегатор новостных и технических веб-лент RSS/Atom с поддержкой синхронизации по API.',
            descEn: 'Lightweight, self-hosted RSS/Atom feed aggregator with integrated mobile third-party sync APIs.',
            icon: '<path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle>',
            features: ['Multi-user Support', 'Mobile API', 'Feed Categories', 'Auto-refresh'],
            port: '8080',
        },
        {
            key: 'jitsi',
            group: 'comms',
            name: 'Jitsi Meet',
            subtitle: 'Video Conferencing',
            desc: 'Защищенный сервер видеоконференций на базе WebRTC, работающий без создания учетных записей.',
            descEn: 'Fully encrypted peer-to-peer WebRTC video conferencing engine running completely account-free.',
            icon: '<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>',
            features: ['WebRTC Encryption', 'Screen Sharing', 'No Account Required', 'Virtual Backgrounds'],
            port: '8443',
        },
        {
            key: 'jitsi-recorder',
            group: 'comms',
            name: 'Jitsi Meet Audio Recorder',
            subtitle: 'Session Audio Capture',
            desc: 'Легковесный аудиобот для автоматического захвата и сохранения звука из активных комнат конференций.',
            descEn: 'Lightweight session audio recorder bot capturing streaming sound directly from active video rooms.',
            icon: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>',
            features: ['Auto Recording', 'Audio-only Mode', 'Auto-upload to Storage', 'Bot Join Detection'],
            port: '8080',
        },
        {
            key: 'whisper',
            group: 'media',
            name: 'Faster-Whisper Server',
            subtitle: 'Speech-to-Text Engine',
            desc: 'Высокопроизводительный C++ движок ИИ для локальной и быстрой расшифровки аудиозаписей в текст.',
            descEn: 'High-performance, C++ optimized AI speech-to-text engine for localized audio transcription.',
            icon: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line><line x1="8" y1="12" x2="8" y2="15"></line>',
            features: ['C++ Optimized', 'Batch Transcription', 'Multiple Languages', 'JSON Output'],
            port: '8000',
        }
    ],
    infrastructure: [
        {
            key: 'caddy',
            group: 'network',
            name: 'Caddy',
            subtitle: 'Reverse Proxy & SSL',
            desc: 'Отказоустойчивый обратный прокси-сервер, автоматический генератор локальных SSL и единая точка входа.',
            descEn: 'Production-ready automated reverse proxy, unified network entry point, and internal SSL generator.',
            icon: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
            features: ['Auto HTTPS', 'HTTP/3 Support', 'Config Hot Reload', 'Dynamic Config'],
            port: '80',
        },
        {
            key: 'coredns',
            group: 'network',
            name: 'CoreDNS',
            subtitle: 'Local DNS Server',
            desc: 'Локальный DNS-сервер для маршрутизации зоны .lan и wildcard-записей статических сайтов GitLab Pages.',
            descEn: 'Flexible network DNS server managing internal zone routing and wildcard entries for GitLab Pages.',
            icon: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line>',
            features: ['Zone Routing (.lan)', 'GitLab Pages Wildcard', 'Plugin Architecture', 'DNS-over-TLS'],
            port: '53',
        },
        {
            key: 'portainer',
            group: 'infra',
            name: 'Portainer CE',
            subtitle: 'Container Management',
            desc: 'Графическая веб-панель для администрирования контейнеров, инспекции логов и развертывания Docker-стеков.',
            descEn: 'Graphical container management interface for monitoring, real-time log streaming, and stacks deployment.',
            icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>',
            features: ['Multi-Host Docker', 'Stack Templates', 'RBAC', 'Log Streaming'],
            port: '9000',
            instance: 'https://portainer.semantec.lan'
        },
        {
            key: 'vaultwarden',
            group: 'security',
            name: 'Vaultwarden',
            subtitle: 'Password Manager',
            desc: 'Сверхлегкий менеджер паролей на Rust, полностью совместимый с официальными клиентами Bitwarden.',
            descEn: 'Lightweight, Rust-based password manager backend fully compatible with the Bitwarden ecosystem.',
            icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
            features: ['E2E Encryption', 'Browser Extensions', 'TOTP Support', 'Bitwarden API'],
            port: '8000',
        }
    ],
    observability: [
        {
            key: 'grafana',
            group: 'metrics',
            name: 'Grafana',
            subtitle: 'Monitoring Dashboards',
            desc: 'Единая платформа мониторинга для визуализации системных метрик, трассировки задержек ИИ и износа NVMe.',
            descEn: 'Unified visualization platform for dashboards monitoring resource metrics, latency traces, and NVMe lifespan.',
            icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>',
            features: ['VictoriaMetrics Source', 'Custom Dashboards', 'Alerting', 'NVMe Health'],
            port: '3000',
            instance: 'https://grafana.semantec.lan'
        },
        {
            key: 'otel',
            group: 'metrics',
            name: 'OpenTelemetry Collector',
            subtitle: 'Telemetry Pipeline',
            desc: 'Универсальный конвейер сбора, валидации и маршрутизации метрик, логов и трассировок хоста.',
            descEn: 'High-performance universal telemetry pipeline for host metric, log, and trace ingestion.',
            icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>',
            features: ['Prometheus Receiver', 'OTLP gRPC', 'Batch Processing', 'Docker Discovery'],
            port: '4317',
        },
        {
            key: 'victoria',
            group: 'metrics',
            name: 'VictoriaMetrics',
            subtitle: 'Time-Series Database',
            desc: 'Масштабируемая и экономичная база данных временных рядов, оптимизированная для долгосрочного хранения метрик.',
            descEn: 'Fast, cost-effective time-series database optimized for long-term platform metrics storage.',
            icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
            features: ['Prometheus Compatible', 'Low RAM Usage', 'High Cardinality', 'Long Retention'],
            port: '8428',
            instance: 'https://victoria.semantec.lan'
        },
        {
            key: 'qryn',
            group: 'logs',
            name: 'Qryn',
            subtitle: 'Log Aggregation',
            desc: 'Полнофункциональный полиглот-бэкенд для агрегации, парсинга логов Loki и корреляции данных в ClickHouse.',
            descEn: 'Polyglot log aggregation engine and log parsing pipeline backed by ClickHouse analytical storage.',
            icon: '<path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline>',
            features: ['Loki Protocol', 'ClickHouse Backend', 'JSON Parsing', 'Grafana LogQL'],
            port: '3100',
            instance: 'https://qryn.semantec.lan'
        },
        {
            key: 'jaeger',
            group: 'traces',
            name: 'Jaeger',
            subtitle: 'Distributed Tracing',
            desc: 'Платформа распределенной трассировки запросов для поиска узких мест и задержек в цепочках ИИ-агентов.',
            descEn: 'Distributed request tracing platform optimized for profiling latency bottlenecks in agent chains.',
            icon: '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>',
            features: ['BadgerDB Storage', 'Trace-to-Log Correlation', 'DAG Visualization', 'AI Chain Profiling'],
            port: '16686',
            instance: 'https://jaeger.semantec.lan'
        },
        {
            key: 'pyroscope',
            group: 'profiling',
            name: 'Pyroscope',
            subtitle: 'Continuous Profiling',
            desc: 'Сервер непрерывного профилирования кода для поиска утечек памяти и вычисления загрузки CPU в реальном времени.',
            descEn: 'Continuous memory and CPU profiling backend mapping code runtime performance optimization.',
            icon: '<path d="M12 2.69l5.66 4.12A8 8 0 1 1 6.34 6.81L12 2.69z"></path>',
            features: ['eBPF Agents', 'Flamegraphs', 'MinIO Storage', 'Real-time CPU/Memory'],
            port: '4040',
            instance: 'https://pyroscope.semantec.lan'
        }
    ]
};

// === CATEGORY DEFINITIONS ===
export const categories = [
    { 
        key: 'workspace', 
        label: 'Workspace', 
        icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>' 
    },
    { 
        key: 'workflow', 
        label: 'Workflow', 
        icon: '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>' 
    },
    { 
        key: 'datalake', 
        label: 'Datalake', 
        icon: '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>' 
    },
    { 
        key: 'datasource', 
        label: 'Datasource', 
        icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>' 
    },
    { 
        key: 'infrastructure', 
        label: 'Infrastructure', 
        icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>' 
    },
    { 
        key: 'observability', 
        label: 'Observability', 
        icon: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>' 
    }
];

// === TOP NAVIGATION LINKS ===
export const topNavLinks = [
    {
        label: 'GitLab',
        href: 'https://gitlab.semantec.lan',
        icon: '<path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"></path>'
    },
    {
        label: 'Outline',
        href: 'https://outline.semantec.lan',
        icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>'
    },
    {
        label: 'Grafana',
        href: 'https://grafana.semantec.lan',
        icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>'
    },
    {
        label: 'MLflow',
        href: 'https://mlflow.semantec.lan',
        icon: '<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line>'
    }
];

// === KEYBOARD SHORTCUTS ===
export const keyboardShortcuts = [
    { action: 'help-sidebar',    key: 'S' },
    { action: 'help-hamburger',  key: 'H' },
    { action: 'help-home',       key: '0' },
    { action: 'help-palette',    key: '⌘K / Ctrl-K' },
    { action: 'help-alerts',     key: 'A' },
    { action: 'help-category-n', key: '1 – 9' },
    { action: 'help-navigate',   key: '↑ ↓' },
    { action: 'help-card-open',  key: 'Enter' },
    { action: 'help-theme',      key: 'T' },
    { action: 'help-lang',       key: 'L' },
    { action: 'help-qa',         key: 'Q' },
    { action: 'help-help',       key: '?' }
];
// === EXTERNAL API ENDPOINTS ===
export const apiEndpoints = {
    qryn:  (typeof window !== 'undefined' && window.QRYN_API_URL)
        || `${location.origin}/qryn/api/v1/query`,
    jaeger: (typeof window !== 'undefined' && window.JAEGER_API_URL)
        || `${location.origin}/jaeger/api`,
    portainer: (typeof window !== 'undefined' && window.PORTAINER_API_URL)
        || `${location.origin}/portainer/api`,
    gitlab: (typeof window !== 'undefined' && window.GITLAB_API_URL)
        || 'https://gitlab.semantec.lan/api/v4',
    plane:  (typeof window !== 'undefined' && window.PLANE_API_URL)
        || 'https://plane.semantec.lan/api/v1'
};

// === SERVICE GROUP DEFINITIONS (for grouped rendering within categories) ===
export const serviceGroups = {
    ai:        { label: 'group-ai',        order: 0 },
    search:    { label: 'group-search',    order: 1 },
    auto:      { label: 'group-auto',      order: 2 },
    relational:{ label: 'group-relational',order: 0 },
    vector:    { label: 'group-vector',    order: 1 },
    cache:     { label: 'group-cache',     order: 2 },
    object:    { label: 'group-object',    order: 3 },
    analytics: { label: 'group-analytics', order: 4 },
    storage:   { label: 'group-storage',   order: 5 },
    media:     { label: 'group-media',     order: 0 },
    docs:      { label: 'group-docs',      order: 1 },
    comms:     { label: 'group-comms',     order: 2 },
    network:   { label: 'group-network',   order: 0 },
    infra:     { label: 'group-infra',     order: 1 },
    security:  { label: 'group-security',  order: 2 },
    metrics:   { label: 'group-metrics',   order: 0 },
    logs:      { label: 'group-logs',      order: 1 },
    traces:    { label: 'group-traces',    order: 2 },
    profiling: { label: 'group-profiling', order: 3 }
};



// === HOME PAGE CONTENT ===
export const homeInfo = {
    title: 'Semantec Homelab',
    tagline: 'A private engineering lab for C++, AI/ML, HPC and security research.',
    body: [
        'This portal aggregates every service running on the local infrastructure — source control, CI/CD, MLOps, observability, container management, and more. Everything is reachable from a single entry point on the LAN, hardened with TLS-internal certificates and pinned to <code>.semantec.lan</code>.',
        'The stack is tuned for low-latency, GPU-accelerated workloads: model training on local CUDA hardware, classical HPC experiments (OpenMPI/NCCL), and security R&D against well-instrumented services.'
    ],
    stacks: [
        {
            name: 'Languages & runtimes',
            items: ['C++17 / 20 / 23', 'Python 3.12', 'CUDA 12 / cuBLAS / cuDNN', 'Rust (tooling)']
        },
        {
            name: 'AI / ML',
            items: ['PyTorch', 'TensorRT', 'ONNX Runtime', 'MLflow', 'vLLM / llama.cpp']
        },
        {
            name: 'HPC',
            items: ['OpenMPI', 'NCCL', 'SLURM (single-node)', 'OpenMP / TBB']
        },
        {
            name: 'Security',
            items: ['Vaultwarden', 'Wazuh', 'OPA', 'Trivy / Grype', 'OpenZiti']
        }
    ],
    links: [
        { label: 'ISO C++',          href: 'https://isocpp.org/' },
        { label: 'cppreference',     href: 'https://en.cppreference.com/' },
        { label: 'LLVM',             href: 'https://llvm.org/' },
        { label: 'PyTorch docs',     href: 'https://pytorch.org/docs/stable/' },
        { label: 'HuggingFace',      href: 'https://huggingface.co/' },
        { label: 'CUDA Toolkit',     href: 'https://developer.nvidia.com/cuda-zone' },
        { label: 'MITRE ATT&CK',     href: 'https://attack.mitre.org/' },
        { label: 'OWASP',            href: 'https://owasp.org/' }
    ]
};

// === PER-CATEGORY DESCRIPTION + REFERENCE LINKS ===
export const categoryInfo = {
    workspace: {
        desc: {
            ru: 'Управление исходным кодом, CI/CD, задачи, базы знаний и ИИ-агенты.',
            en: 'Source control, CI/CD, task management, knowledge base and AI agents.'
        },
        links: [
            { label: 'GitLab docs',     href: 'https://docs.gitlab.com/' },
            { label: 'Plane docs',      href: 'https://docs.plane.so/' },
            { label: 'Outline wiki',    href: 'https://www.getoutline.com/help' },
            { label: 'MCP Protocol',    href: 'https://modelcontextprotocol.io/' }
        ]
    },
    workflow: {
        desc: {
            ru: 'Оркестрация ИИ-агентов, LLMOps, автоматизация процессов и MLOps.',
            en: 'AI agent orchestration, LLMOps, process automation and MLOps.'
        },
        links: [
            { label: 'Dify',            href: 'https://docs.dify.ai/' },
            { label: 'AutoGen',         href: 'https://microsoft.github.io/autogen/' },
            { label: 'CrewAI',          href: 'https://docs.crewai.com/' },
            { label: 'MLflow docs',     href: 'https://mlflow.org/docs/latest/' }
        ]
    },
    datalake: {
        desc: {
            ru: 'Хранилища данных: реляционные, векторные, объектные и колоночные БД.',
            en: 'Data stores: relational, vector, object and columnar databases.'
        },
        links: [
            { label: 'PostgreSQL',      href: 'https://www.postgresql.org/docs/' },
            { label: 'Weaviate',        href: 'https://weaviate.io/developers' },
            { label: 'Redis docs',      href: 'https://redis.io/docs/' },
            { label: 'ClickHouse',      href: 'https://clickhouse.com/docs/' }
        ]
    },
    datasource: {
        desc: {
            ru: 'Контент: фотографии, документы, RSS-ленты и транскрибация аудио.',
            en: 'Content: photos, documents, RSS feeds and audio transcription.'
        },
        links: [
            { label: 'PhotoPrism',      href: 'https://docs.photoprism.app/' },
            { label: 'Paperless-ngx',   href: 'https://docs.paperless-ngx.com/' },
            { label: 'Jitsi handbook',  href: 'https://jitsi.github.io/handbook/' },
            { label: 'Faster-Whisper',  href: 'https://github.com/guillaumekln/faster-whisper' }
        ]
    },
    infrastructure: {
        desc: {
            ru: 'Сеть, контейнеры, пароли и DNS.',
            en: 'Networking, containers, passwords and DNS.'
        },
        links: [
            { label: 'Caddy docs',      href: 'https://caddyserver.com/docs/' },
            { label: 'CoreDNS',         href: 'https://coredns.io/manual/' },
            { label: 'Docker docs',     href: 'https://docs.docker.com/' },
            { label: 'Bitwarden',       href: 'https://bitwarden.com/help/' }
        ]
    },
    observability: {
        desc: {
            ru: 'Метрики, логи, трассировки и профилирование на OpenTelemetry.',
            en: 'Metrics, logs, traces and profiling via OpenTelemetry.'
        },
        links: [
            { label: 'Prometheus',      href: 'https://prometheus.io/' },
            { label: 'OpenTelemetry',   href: 'https://opentelemetry.io/' },
            { label: 'Grafana docs',    href: 'https://grafana.com/docs/' },
            { label: 'VictoriaMetrics', href: 'https://docs.victoriametrics.com/' }
        ]
    }
};