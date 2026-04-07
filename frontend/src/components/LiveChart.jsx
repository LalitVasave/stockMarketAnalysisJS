import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

export default function LiveChart({ wsData }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        try {
            const chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth || 400,
                height: chartContainerRef.current.clientHeight || 300,
                layout: {
                    background: { type: 'solid', color: '#0a0c10' }, // Match bg-dark
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

            const cSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#0df259',
                downColor: '#ff4d4d',
                borderVisible: false,
                wickUpColor: '#0df259',
                wickDownColor: '#ff4d4d',
            });

            chartRef.current = chart;
            seriesRef.current = cSeries;

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
            };
        } catch (error) {
            console.error("Error creating LiveChart:", error);
        }
    }, []); // Only run once on mount

    // Watch for new websocket data and update chart
    useEffect(() => {
        if (wsData && wsData.type === 'tick' && seriesRef.current) {
            seriesRef.current.update({
                time: wsData.time,
                open: wsData.open,
                high: wsData.high,
                low: wsData.low,
                close: wsData.close
            });
        }
    }, [wsData]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full h-full relative"
        />
    );
}
