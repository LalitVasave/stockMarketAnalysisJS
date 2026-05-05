import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

export default function LiveChart({ wsData }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const seededRef = useRef(false);

    const buildSeedData = () => {
        const now = Math.floor(Date.now() / 1000);
        let price = 500;
        return Array.from({ length: 24 }).map((_, index) => {
            const drift = Math.sin(index / 3) * 4 + (index * 0.6);
            const open = price;
            const close = 500 + drift;
            const high = Math.max(open, close) + 2.4;
            const low = Math.min(open, close) - 2.1;
            price = close;
            return {
                time: now - ((24 - index) * 300),
                open: Number(open.toFixed(2)),
                high: Number(high.toFixed(2)),
                low: Number(low.toFixed(2)),
                close: Number(close.toFixed(2)),
            };
        });
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        try {
            const chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth || 400,
                height: chartContainerRef.current.clientHeight || 300,
                layout: {
                    background: { type: 'solid', color: 'transparent' },
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
                handleScroll: true,
                handleScale: true,
            });

            const cSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#0df259',
                downColor: '#ff4d4d',
                borderVisible: false,
                wickUpColor: '#0df259',
                wickDownColor: '#ff4d4d',
            });

            chartRef.current = chart;
            seriesRef.current = cSeries;
            cSeries.setData(buildSeedData());
            chart.timeScale().fitContent();
            seededRef.current = true;
            requestAnimationFrame(() => setIsReady(true));

            const resizeObserver = new ResizeObserver(entries => {
                if (entries.length === 0 || entries[0].target !== chartContainerRef.current) { return; }
                const newRect = entries[0].contentRect;
                if (newRect.width > 0 && newRect.height > 0) {
                    chart.applyOptions({ width: newRect.width, height: newRect.height });
                }
            });
            
            resizeObserver.observe(chartContainerRef.current);

            return () => {
                resizeObserver.disconnect();
                if (chart) {
                    chart.remove();
                }
                chartRef.current = null;
                seriesRef.current = null;
                requestAnimationFrame(() => setIsReady(false));
            };
        } catch (error) {
            console.error("Error creating LiveChart:", error);
        }
    }, []);

    const lastUpdateRef = useRef(0);

    useEffect(() => {
        if (!wsData || wsData.type !== 'tick' || !seriesRef.current) return;

        const now = Date.now();
        if (now - lastUpdateRef.current < 50) return;
        lastUpdateRef.current = now;

        seriesRef.current.update({
            time: wsData.time,
            open: wsData.open,
            high: wsData.high,
            low: wsData.low,
            close: wsData.close
        });

        // Ensure the chart stays focused on the new data
        if (chartRef.current) {
            chartRef.current.timeScale().scrollToPosition(0, true);
        }
    }, [wsData]);

    const isConnecting = !wsData && !isReady;

    return (
        <div className="w-full h-full relative group">
            <div
                ref={chartContainerRef}
                className="w-full h-full relative"
            />
            {isConnecting && (
                <div className="chart-overlay opacity-100">
                    <div className="flex flex-col items-center gap-3">
                        <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-bold text-slate-muted uppercase tracking-[0.2em] animate-pulse">Syncing Market Feed</p>
                    </div>
                </div>
            )}
        </div>
    );
}
