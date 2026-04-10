document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    handleRoute();

    // Listen to hash changes
    window.addEventListener('hashchange', handleRoute);

    // Setup click handlers to update hash
    document.querySelectorAll('[data-route]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = e.currentTarget.getAttribute('data-route');
            window.location.hash = route;
        });
    });
});

// -------------- Live Chart ---------------
let liveChart = null;
let candlestickSeries = null;
let ws = null;
let chartResizeObserver = null;

function initLiveChart() {
    const chartContainer = document.getElementById('live-chart-container');
    if (!chartContainer) return;
    if (liveChart) return; // already initialized

    const tryCreate = () => {
        if (chartContainer.clientWidth === 0 || chartContainer.clientHeight === 0) return; // wait

        liveChart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: chartContainer.clientHeight,
            layout: {
                background: { type: 'solid', color: '#0a0c10' },
                textColor: '#64748b',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.06)',
                visible: true,
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.06)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        candlestickSeries = liveChart.addCandlestickSeries({
            upColor: '#0df259',
            downColor: '#ff4d4d',
            borderVisible: false,
            wickUpColor: '#0df259',
            wickDownColor: '#ff4d4d',
        });

        // Disconnect the observer once we successfully created the chart
        if (chartResizeObserver) chartResizeObserver.disconnect();

        // New observer just for resize after creation
        chartResizeObserver = new ResizeObserver(() => {
            if (liveChart && chartContainer) {
                liveChart.applyOptions({
                    width: chartContainer.clientWidth,
                    height: chartContainer.clientHeight,
                });
            }
        });
        chartResizeObserver.observe(chartContainer);

        // Connect WebSocket now
        connectWebSocket();
    };

    // Use ResizeObserver to wait until the container has real dimensions
    chartResizeObserver = new ResizeObserver(tryCreate);
    chartResizeObserver.observe(chartContainer);

    // Also try immediately in case it's already sized
    tryCreate();
}

// -------------- WebSocket ---------------
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Connected to live data stream');
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'tick' && candlestickSeries) {
                candlestickSeries.update({
                    time: data.time,
                    open: data.open,
                    high: data.high,
                    low: data.low,
                    close: data.close,
                });
                updateMarketDeltaUI(data);
            } else if (data.type === 'info') {
                console.log(data.message);
            }
        } catch (e) {
            console.error(e);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting in 5s...');
        setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
    };
}

// -------------- Market Delta UI ---------------
let sessionOpenPrice = null;
function updateMarketDeltaUI(data) {
    if (!sessionOpenPrice) sessionOpenPrice = data.open;
    const delta = ((data.close - sessionOpenPrice) / sessionOpenPrice) * 100;
    const isUp = delta >= 0;

    const valEl = document.getElementById('market-delta-value');
    const chgEl = document.getElementById('market-delta-change');
    if (!valEl || !chgEl) return;

    valEl.textContent = (isUp ? '+' : '') + delta.toFixed(2) + '%';
    valEl.className = `text-2xl font-bold tracking-tight ${isUp ? 'text-primary' : 'text-red-400'}`;

    const tickDelta = ((data.close - data.open) / data.open) * 100;
    chgEl.textContent = (tickDelta >= 0 ? '+' : '') + tickDelta.toFixed(2) + '% tick';
    chgEl.className = `text-[10px] font-bold ${tickDelta >= 0 ? 'text-primary' : 'text-red-400'}`;
}

// -------------- Recent Pipelines Table ---------------
async function loadPipelinesTable() {
    const tbody = document.getElementById('pipelines-tbody');
    if (!tbody) return;

    try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/uploads', { headers });
        if (res.status === 401) {
            console.warn("Unauthorized. Redirecting to registration.");
            window.location.hash = 'registration';
            return;
        }
        if (!res.ok) return;
        const history = await res.json();

        if (history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="px-8 py-6 text-center text-slate-500 text-xs">No uploads yet — upload a CSV from Data Ingestion</td></tr>`;
            return;
        }

        tbody.innerHTML = history.map(entry => `
            <tr class="hover:bg-white/[0.02] transition-colors group">
                <td class="px-8 py-4">
                    <div class="flex items-center gap-3">
                        <div class="size-8 rounded bg-white/5 flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined">description</span>
                        </div>
                        <div>
                            <span class="block text-sm font-semibold text-white/90">${entry.filename}</span>
                            <span class="text-[10px] text-slate-600 font-mono">#${String(entry.id).slice(-6)}</span>
                        </div>
                    </div>
                </td>
                <td class="px-8 py-4 text-xs text-slate-400 font-medium">${entry.timestamp}</td>
                <td class="px-8 py-4">
                    <span class="status-badge bg-primary/5 text-primary border-primary/20">
                        <span class="material-symbols-outlined !text-[14px]">check_circle</span>
                        Ready
                    </span>
                </td>
                <td class="px-8 py-4 text-right font-mono text-xs text-slate-400">${entry.rowsProcessed.toLocaleString()}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Failed to load pipelines:', e);
    }
}

// -------------- Routing ---------------
function handleRoute() {
    const hash = window.location.hash || '#registration';
    const routeId = hash.substring(1);
    navigateTo(routeId);
}

function navigateTo(routeId) {
    const targetView = document.getElementById(`view-${routeId}`);
    if (!targetView) {
        console.warn(`Route ${routeId} not found, defaulting to registration.`);
        return navigateTo('registration');
    }

    // Hide all views
    document.querySelectorAll('.view-container').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    targetView.classList.add('active');

    // Per-route actions
    if (routeId === 'dashboard') {
        // Use requestAnimationFrame so the DOM has rendered the view before measuring sizes
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                initLiveChart();
                loadPipelinesTable();
            });
        });
    }

    // Update active state in sidebars
    document.querySelectorAll('[data-route]').forEach(link => {
        if (link.getAttribute('data-route') === routeId) {
            link.classList.add('text-white', 'bg-white/5');
            link.classList.remove('text-slate-muted');
        } else {
            link.classList.remove('text-white', 'bg-white/5');
            link.classList.add('text-slate-muted');
        }
    });
}

// -------------- Authentication ---------------
// This function can be called to log in a demonstration user
async function ensureAuthenticated() {
    const token = localStorage.getItem('token');
    if (token) return true;

    console.warn("No token found, initializing demo session...");
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `demo_${Date.now()}@quantai.internal`,
                password: 'DemoPassword123!',
                name: 'Demo Trader'
            })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            console.info("Demo session active.");
            return true;
        }
    } catch (e) {
        console.error("Auth initialization failed:", e);
    }
    return false;
}

// Automatically try to init auth on registration view if the button is clicked
document.addEventListener('click', async (e) => {
    if (e.target.closest('[data-route="dashboard"]')) {
        await ensureAuthenticated();
    }
});

