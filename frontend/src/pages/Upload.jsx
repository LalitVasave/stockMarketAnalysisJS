import React, { useRef, useState, useEffect } from 'react';
import { Upload as UploadIcon, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Upload() {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { success, message, rows, predictions }
    const [previewRows, setPreviewRows] = useState([]);
    const [uploadHistory, setUploadHistory] = useState([]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/uploads`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUploadHistory(data);
            }
        } catch (err) {
            console.error("Failed to fetch upload history", err);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Clear previous results
        setResult(null);
        setPreviewRows([]);

        // Read a small preview from the CSV client-side (no upload needed for preview)
        const text = await file.text();
        const lines = text.trim().split('\n');
        if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim());
            const dateIdx = headers.findIndex(h => /date/i.test(h));
            const openIdx = headers.findIndex(h => /open/i.test(h));
            const closeIdx = headers.findIndex(h => /close/i.test(h));

            const rows = lines.slice(1, 6).map(line => {
                const cols = line.split(',');
                return {
                    date: dateIdx >= 0 ? cols[dateIdx]?.trim() : cols[0]?.trim(),
                    open: openIdx >= 0 ? cols[openIdx]?.trim() : cols[1]?.trim(),
                    close: closeIdx >= 0 ? cols[closeIdx]?.trim() : cols[cols.length - 1]?.trim(),
                };
            });
            setPreviewRows(rows);
        }

        const formData = new FormData();
        formData.append('dataset', file);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            setResult({
                success: true,
                message: `Successfully processed ${data.rowsProcessed} rows.`,
                prediction: data.predictions?.[0]?.predictedClose,
            });
        } catch (err) {
            setResult({
                success: false,
                message: err.message || 'Failed to upload file.',
            });
        } finally {
            fetchHistory(); // refresh the history table
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <main className="flex-1 flex flex-col bg-bg-dark w-full h-full overflow-y-auto custom-scrollbar">
            <div className="p-4 pt-20 md:pt-8 md:p-8 max-w-5xl mx-auto w-full space-y-8">
                <header>
                    <h2 className="text-3xl font-black text-white tracking-tight">Pro Data Ingestion &amp; Mapping</h2>
                    <p className="text-slate-400 mt-1">Scale your analysis with high-fidelity data pipelines</p>
                </header>

                <section>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".csv,.json,.xlsx"
                    />
                    <div
                        onClick={() => !loading && fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-slate bg-white/5 hover:bg-white/[0.08] hover:border-primary/50 transition-all py-16 px-6 ${loading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
                    >
                        <div className="size-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 transition-transform duration-300">
                            {loading
                                ? <Loader2 className="w-10 h-10 animate-spin" />
                                : <UploadIcon className="w-10 h-10" />
                            }
                        </div>
                        <h3 className="text-xl font-bold text-white text-center mb-2">Drop data files to start analysis</h3>
                        <p className="text-slate-400 text-sm text-center mb-6 max-w-sm">
                            Automated mapping for OHLCV, Sentiment scores, and Custom Vishleshak indicators.
                        </p>
                        <button className="px-8 py-3 bg-primary text-bg-dark font-bold rounded-xl hover:shadow-[0_0_20px_rgba(13,242,89,0.4)] transition-all pointer-events-none">
                            {loading ? 'Ingesting & Analyzing...' : 'Select File'}
                        </button>
                    </div>
                </section>

                {/* Inline result banner — no alert() blocking */}
                {result && (
                    <div className={`flex items-start gap-4 rounded-xl p-4 border ${result.success ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {result.success
                            ? <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            : <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                        }
                        <div>
                            <p className="font-semibold text-sm">{result.message}</p>
                            {result.prediction != null && (
                                <p className="text-xs mt-1 text-slate-300">
                                    AI Prediction (Next Day Close): <span className="font-bold text-primary">${Number(result.prediction).toFixed(2)}</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">Live Mapping Preview</h3>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-border-subtle bg-panel-dark overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-border-subtle text-slate-300 text-sm">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Open</th>
                                    <th className="px-6 py-4">Close</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {previewRows.length > 0
                                    ? previewRows.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] text-sm text-slate-400">
                                            <td className="px-6 py-3">{row.date}</td>
                                            <td className="px-6 py-3">{row.open}</td>
                                            <td className="px-6 py-3 font-bold text-primary">{row.close}</td>
                                        </tr>
                                    ))
                                    : (
                                        <>
                                            <tr className="hover:bg-white/[0.02] text-sm text-slate-400">
                                                <td className="px-6 py-3">2023-11-01</td>
                                                <td className="px-6 py-3">170.91</td>
                                                <td className="px-6 py-3 font-bold text-primary">173.00</td>
                                            </tr>
                                            <tr className="hover:bg-white/[0.02] text-sm text-slate-400">
                                                <td className="px-6 py-3">2023-10-31</td>
                                                <td className="px-6 py-3">173.05</td>
                                                <td className="px-6 py-3 font-bold text-primary">173.44</td>
                                            </tr>
                                        </>
                                    )
                                }
                            </tbody>
                        </table>
                    </div>
                </section>

                {uploadHistory.length > 0 && (
                    <section className="space-y-4 pt-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Recent Uploads History</h3>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-border-subtle bg-panel-dark overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-border-subtle text-slate-300 text-sm tracking-wider uppercase font-bold">
                                        <th className="px-6 py-4">Filename</th>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Rows</th>
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {uploadHistory.map((upload) => (
                                        <tr key={upload.id} className="hover:bg-white/[0.02] text-sm text-slate-400 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-white/90">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-slate-500" />
                                                    {upload.filename}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{upload.createdAt || upload.timestamp}</td>
                                            <td className="px-6 py-4 font-mono text-xs">{upload.rowsProcessed.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-3 py-1 rounded bg-primary/10 text-primary text-xs font-bold border border-primary/20">Processed</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
