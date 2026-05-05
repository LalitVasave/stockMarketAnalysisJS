import React, { useEffect, useMemo, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

function buildCandles(symbol) {
  const now = Math.floor(Date.now() / 1000);
  const seed = symbol?.length || 4;
  return Array.from({ length: 42 }).map((_, index) => {
    const open = 1000 + (seed * 25) + (index * 4) + Math.sin(index / 2) * 18;
    const close = open + Math.cos(index / 3) * 16;
    return {
      time: now - ((42 - index) * 300),
      open: Number(open.toFixed(2)),
      high: Number((Math.max(open, close) + 14).toFixed(2)),
      low: Number((Math.min(open, close) - 12).toFixed(2)),
      close: Number(close.toFixed(2)),
    };
  });
}

export default function StockChart({ symbol, livePrice }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const histogramRef = useRef(null);
  const candles = useMemo(() => buildCandles(symbol), [symbol]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: '#4A7A9B',
      },
      grid: {
        vertLines: { color: 'rgba(13, 31, 45, 0.8)' },
        horzLines: { color: 'rgba(13, 31, 45, 0.8)' },
      },
      rightPriceScale: { borderColor: 'rgba(13,31,45,1)' },
      timeScale: { borderColor: 'rgba(13,31,45,1)', timeVisible: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF88',
      downColor: '#FF3B5C',
      borderVisible: false,
      wickUpColor: '#00FF88',
      wickDownColor: '#FF3B5C',
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#00D4FF',
      lineWidth: 2,
    });

    const histogramSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      base: 0,
    });

    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#FFB800',
      lineWidth: 1.5,
      priceScaleId: 'left',
    });

    candleSeries.setData(candles);
    lineSeries.setData(candles.map((candle) => ({ time: candle.time, value: Number(((candle.open + candle.close) / 2).toFixed(2)) })));
    histogramSeries.setData(candles.map((candle, index) => ({
      time: candle.time,
      value: 120 + (index * 12),
      color: candle.close >= candle.open ? 'rgba(0,255,136,0.45)' : 'rgba(255,59,92,0.45)',
    })));
    rsiSeries.setData(candles.map((candle, index) => ({ time: candle.time, value: 42 + ((index % 7) * 4) })));

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    lineSeriesRef.current = lineSeries;
    histogramRef.current = histogramSeries;
    rsiSeriesRef.current = rsiSeries;

    return () => chart.remove();
  }, [candles]);

  useEffect(() => {
    if (!livePrice || !candleSeriesRef.current || !lineSeriesRef.current) return;
    const time = Math.floor(Date.now() / 1000);
    const open = livePrice * 0.995;
    candleSeriesRef.current.update({
      time,
      open: Number(open.toFixed(2)),
      high: Number((livePrice * 1.006).toFixed(2)),
      low: Number((livePrice * 0.994).toFixed(2)),
      close: Number(livePrice.toFixed(2)),
    });
    lineSeriesRef.current.update({ time, value: Number((livePrice * 0.999).toFixed(2)) });
    rsiSeriesRef.current.update({ time, value: 48 + (Math.round(livePrice) % 18) });
    histogramRef.current.update({
      time,
      value: 420 + (Math.round(livePrice) % 80),
      color: 'rgba(0,212,255,0.45)',
    });
  }, [livePrice]);

  return <div ref={containerRef} className="h-[360px] w-full" />;
}
