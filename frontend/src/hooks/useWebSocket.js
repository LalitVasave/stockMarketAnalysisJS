import { useState, useEffect } from 'react';

export function useWebSocket(url, token = null) {
    const [data, setData] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        let ws;
        let reconnectTimeout;
        const lastPrices = {};

        const connect = () => {
            ws = new WebSocket(url);
            setSocket(ws);

            ws.onopen = () => {
                console.log("Connected to live data stream");
                setIsConnected(true);
                
                // If token is provided, authenticate immediately
                if (token) {
                    ws.send(JSON.stringify({ type: 'auth', token }));
                }
            };

            ws.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data);
                    if (parsed?.type === 'tick' && typeof parsed.ltp === 'number' && parsed.close == null) {
                        const previous = lastPrices[parsed.symbol] ?? parsed.ltp;
                        lastPrices[parsed.symbol] = parsed.ltp;
                        setData({
                            type: 'tick',
                            symbol: parsed.symbol,
                            time: Math.floor(Date.now() / 1000),
                            open: previous,
                            high: Math.max(previous, parsed.ltp),
                            low: Math.min(previous, parsed.ltp),
                            close: parsed.ltp,
                        });
                        return;
                    }
                    setData(parsed);
                } catch (e) {
                    console.error(e);
                }
            };

            ws.onclose = () => {
                console.log("WebSocket disconnected, trying to reconnect...");
                setIsConnected(false);
                reconnectTimeout = setTimeout(connect, 5000);
            };
        };

        connect();

        return () => {
            if (ws) {
                ws.close();
            }
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [url, token]);

    const sendMessage = (msg) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(msg));
        }
    };

    return { data, isConnected, sendMessage };
}
