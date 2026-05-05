import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

const SMA_WINDOW = 20;
const timeframeToSec = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600 };

export default function LiveChart({ wsData }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const candleSeriesRef = useRef(null);
    const smaSeriesRef = useRef(null);
    const bbUpperSeriesRef = useRef(null);
    const bbLowerSeriesRef = useRef(null);
    const volumeSeriesRef = useRef(null);
    const rawCandlesRef = useRef([]);
    const [isReady, setIsReady] = useState(false);
    const [timeframe, setTimeframe] = useState('5m');
    const [showBands, setShowBands] = useState(true);
    const lastUpdateRef = useRef(0);
    const aggregatedRef = useRef([]);

    const buildSeedData = () => {
        const now = Math.floor(Date.now() / 1000);
        let price = 500;
        return Array.from({ length: 120 }).map((_, index) => {
            const drift = Math.sin(index / 4) * 3 + (index * 0.2);
            const open = price;
            const close = 500 + drift;
            const high = Math.max(open, close) + 2.2;
            const low = Math.min(open, close) - 2.0;
            price = close;
            return {
                time: now - ((120 - index) * 60),
                open: Number(open.toFixed(2)),
                high: Number(high.toFixed(2)),
                low: Number(low.toFixed(2)),
                close: Number(close.toFixed(2)),
                volume: Math.round(400 + Math.random() * 300),
            };
        });
    };

    const aggregateCandles = (candles, bucketSec) => {
        const grouped = new Map();
        for (const c of candles) {
            const bucket = Math.floor(c.time / bucketSec) * bucketSec;
            const existing = grouped.get(bucket);
            if (!existing) {
                grouped.set(bucket, {
                    time: bucket,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    volume: c.volume || 0,
                });
            } else {
                existing.high = Math.max(existing.high, c.high);
                existing.low = Math.min(existing.low, c.low);
                existing.close = c.close;
                existing.volume += c.volume || 0;
            }
        }
        return Array.from(grouped.values()).sort((a, b) => a.time - b.time);
    };

    const buildSMA = (candles, windowSize) => {
        const closes = candles.map((c) => c.close);
        return candles.map((c, i) => {
            const start = Math.max(0, i - windowSize + 1);
            const slice = closes.slice(start, i + 1);
            const avg = slice.reduce((acc, v) => acc + v, 0) / slice.length;
            return { time: c.time, value: Number(avg.toFixed(2)) };
        });
    };

    const buildBBands = (candles, windowSize) => {
        const closes = candles.map((c) => c.close);
        const upper = [];
        const lower = [];
        for (let i = 0; i < candles.length; i++) {
            const start = Math.max(0, i - windowSize + 1);
            const slice = closes.slice(start, i + 1);
            const mean = slice.reduce((acc, v) => acc + v, 0) / slice.length;
            const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / slice.length;
            const std = Math.sqrt(variance);
            upper.push({ time: candles[i].time, value: Number((mean + 2 * std).toFixed(2)) });
            lower.push({ time: candles[i].time, value: Number((mean - 2 * std).toFixed(2)) });
        }
        return { upper, lower };
    };

    const renderAllSeries = useCallback(() => {
        if (!candleSeriesRef.current || !smaSeriesRef.current || !volumeSeriesRef.current) return;
        const bucket = timeframeToSec[timeframe] || 300;
        const candles = aggregateCandles(rawCandlesRef.current, bucket).slice(-220);
        aggregatedRef.current = candles;
        candleSeriesRef.current.setData(candles.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
        smaSeriesRef.current.setData(buildSMA(candles, SMA_WINDOW));

        const volumeData = candles.map((c) => ({
            time: c.time,
            value: c.volume || 0,
            color: c.close >= c.open ? 'rgba(13,242,89,0.35)' : 'rgba(255,77,77,0.35)',
        }));
        volumeSeriesRef.current.setData(volumeData);

        const { upper, lower } = buildBBands(candles, SMA_WINDOW);
        if (showBands) {
            bbUpperSeriesRef.current?.setData(upper);
            bbLowerSeriesRef.current?.setData(lower);
        } else {
            bbUpperSeriesRef.current?.setData([]);
            bbLowerSeriesRef.current?.setData([]);
        }
        chartRef.current?.timeScale().fitContent();
    }, [timeframe, showBands]);

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
                    vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
                    horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
                },
                rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)', visible: true },
                leftPriceScale: { visible: false },
                timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true, secondsVisible: false },
                crosshair: {
                    mode: 0,
                    vertLine: { labelBackgroundColor: '#0f172a' },
                    horzLine: { labelBackgroundColor: '#0f172a' },
                },
                handleScroll: true,
                handleScale: true,
            });

            const candles = chart.addSeries(CandlestickSeries, {
                upColor: '#0df259',
                downColor: '#ff4d4d',
                borderVisible: false,
                wickUpColor: '#0df259',
                wickDownColor: '#ff4d4d',
            });
            const sma = chart.addSeries(LineSeries, {
                color: '#38bdf8',
                lineWidth: 2,
                title: 'SMA 20',
                priceLineVisible: false,
            });
            const bbUpper = chart.addSeries(LineSeries, {
                color: 'rgba(148,163,184,0.65)',
                lineWidth: 1,
                lineStyle: 2,
                priceLineVisible: false,
            });
            const bbLower = chart.addSeries(LineSeries, {
                color: 'rgba(148,163,184,0.65)',
                lineWidth: 1,
                lineStyle: 2,
                priceLineVisible: false,
            });
            const volume = chart.addSeries(HistogramSeries, {
                priceScaleId: '',
                priceFormat: { type: 'volume' },
                base: 0,
            });

            chartRef.current = chart;
            candleSeriesRef.current = candles;
            smaSeriesRef.current = sma;
            bbUpperSeriesRef.current = bbUpper;
            bbLowerSeriesRef.current = bbLower;
            volumeSeriesRef.current = volume;

            rawCandlesRef.current = buildSeedData();
            requestAnimationFrame(() => setIsReady(true));

            const resizeObserver = new ResizeObserver((entries) => {
                if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
                const r = entries[0].contentRect;
                if (r.width > 0 && r.height > 0) chart.applyOptions({ width: r.width, height: r.height });
            });
            resizeObserver.observe(chartContainerRef.current);

            return () => {
                resizeObserver.disconnect();
                chart.remove();
                chartRef.current = null;
                candleSeriesRef.current = null;
                smaSeriesRef.current = null;
                bbUpperSeriesRef.current = null;
                bbLowerSeriesRef.current = null;
                volumeSeriesRef.current = null;
                rawCandlesRef.current = [];
                requestAnimationFrame(() => setIsReady(false));
            };
        } catch (error) {
            console.error('Error creating LiveChart:', error);
        }
    }, []);

    useEffect(() => {
        renderAllSeries();
    }, [renderAllSeries]);

    useEffect(() => {
        if (!wsData || wsData.type !== 'tick' || !candleSeriesRef.current) return;
        const now = Date.now();
        if (now - lastUpdateRef.current < 50) return;
        lastUpdateRef.current = now;

        const tick = {
            time: wsData.time,
            open: wsData.open,
            high: wsData.high,
            low: wsData.low,
            close: wsData.close,
            volume: Math.round(380 + Math.random() * 300),
        };

        rawCandlesRef.current.push(tick);
        if (rawCandlesRef.current.length > 1500) rawCandlesRef.current.shift();

        const bucketSize = timeframeToSec[timeframe] || 60;
        const bucketTime = Math.floor(tick.time / bucketSize) * bucketSize;
        const lastAgg = aggregatedRef.current[aggregatedRef.current.length - 1];

        if (lastAgg && lastAgg.time === bucketTime) {
            lastAgg.high = Math.max(lastAgg.high, tick.high);
            lastAgg.low = Math.min(lastAgg.low, tick.low);
            lastAgg.close = tick.close;
            lastAgg.volume += tick.volume;

            candleSeriesRef.current.update({
                time: lastAgg.time,
                open: lastAgg.open,
                high: lastAgg.high,
                low: lastAgg.low,
                close: lastAgg.close,
            });
            volumeSeriesRef.current.update({
                time: lastAgg.time,
                value: lastAgg.volume,
                color: lastAgg.close >= lastAgg.open ? 'rgba(13,242,89,0.35)' : 'rgba(255,77,77,0.35)',
            });
            
            smaSeriesRef.current.setData(buildSMA(aggregatedRef.current, SMA_WINDOW));
            if (showBands) {
                const { upper, lower } = buildBBands(aggregatedRef.current, SMA_WINDOW);
                bbUpperSeriesRef.current?.setData(upper);
                bbLowerSeriesRef.current?.setData(lower);
            }
        } else {
            renderAllSeries();
        }
    }, [wsData, timeframe, showBands, renderAllSeries]);

    const isConnecting = !wsData && !isReady;
    const timeframes = ['1m', '5m', '15m', '1h'];

    return (
        <div className="w-full h-full relative group">
            <div ref={chartContainerRef} className="w-full h-full relative" />

            <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                <div className="rounded-lg border border-border-subtle bg-bg-dark/80 p-1 backdrop-blur-sm">
                    {timeframes.map((tf) => (
                        <button
                            key={tf}
                            type="button"
                            onClick={() => setTimeframe(tf)}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                timeframe === tf ? 'text-primary' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setShowBands((v) => !v)}
                    className={`rounded-lg border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        showBands
                            ? 'border-primary/20 bg-primary/10 text-primary'
                            : 'border-border-subtle bg-bg-dark/80 text-slate-400'
                    }`}
                >
                    BBands
                </button>
            </div>

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
