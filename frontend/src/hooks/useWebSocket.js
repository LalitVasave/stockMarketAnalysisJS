import { useState, useEffect } from 'react';

export function useWebSocket(url) {
    const [data, setData] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let ws;
        let reconnectTimeout;

        const connect = () => {
            ws = new WebSocket(url);

            ws.onopen = () => {
                console.log("Connected to live data stream");
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data);
                    setData(parsed);
                } catch (e) {
                    console.error(e);
                }
            };

            ws.onclose = () => {
                console.log("WebSocket disconnected, trying to reconnect...");
                setIsConnected(false);
                // Reconnect after 5 seconds
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
    }, [url]);

    return { data, isConnected };
}
