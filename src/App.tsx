import { useState, ChangeEvent, useEffect } from 'react';
import { Camera, Image as ImageIcon, Upload, CheckCircle, AlertCircle, RefreshCw, X, Settings2 } from 'lucide-react';

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Ready');
    const [logs, setLogs] = useState<string[]>([]);

    // Lifecycle Logging
    useEffect(() => {
        const handleVisibility = () => addLog(`Page Visibility: ${document.visibilityState}`);
        const handlePageShow = (e: PageTransitionEvent) => addLog(`Page Show: persisted=${e.persisted}`);

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, source: string) => {
        // 1. Immediate feedback of event firing
        addLog(`event:change source:${source}`);

        // 2. DOM State Check
        if (!e.target) {
            addLog('Error: e.target is null');
            return;
        }

        // 3. File List Check
        const files = e.target.files;
        if (!files) {
            addLog('Error: e.target.files is null');
            return;
        }

        addLog(`files.length: ${files.length}`);

        if (files.length > 0) {
            try {
                const file = files[0];
                // Detailed file dump
                addLog(`File: ${file.name}`);
                addLog(`Type: ${file.type}`);
                addLog(`Size: ${file.size}`);

                setSelectedFile(file);
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                setStatus(`Success: ${file.name}`);
            } catch (err: any) {
                addLog(`JS Error: ${err.message}`);
                setStatus('Error processing file');
            }
        } else {
            addLog('Warning: files.length is 0 (User cancelled?)');
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setStatus('Ready');
        addLog('--- Cleared ---');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0f172a] text-slate-200">

            <main className="w-full max-w-md p-4 z-10 flex flex-col gap-4">

                <div className="glass-panel p-6 rounded-2xl">
                    <header className="mb-4 text-center">
                        <h1 className="text-2xl font-bold text-white">Camera Debug Matrix</h1>
                        <p className="text-xs text-slate-400">Test different input configurations for Android</p>
                    </header>

                    {/* STATUS BOX */}
                    <div className={`rounded-lg p-3 mb-4 flex items-center gap-3 border ${status.includes('Success') ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${status.includes('Success') ? 'bg-green-400' : 'bg-indigo-400 animate-pulse'}`} />
                        <span className="text-sm font-mono truncate">{status}</span>
                    </div>

                    {previewUrl ? (
                        // PREVIEW MODE
                        <div className="relative rounded-xl overflow-hidden bg-black/50 border border-slate-600 mb-4">
                            <img src={previewUrl} className="w-full aspect-video object-contain" alt="Preview" />
                            <button onClick={clearSelection} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white">
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        // DEBUG BUTTONS LIST
                        <div className="space-y-3">

                            {/* OPTION 1: STANDARD ENVIRONMENT */}
                            <div className="relative group">
                                <button className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold flex items-center justify-between transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                                    <span className="flex items-center gap-3">
                                        <Camera className="w-5 h-5" />
                                        <span>Mode A: Force Rear Camera</span>
                                    </span>
                                    <span className="text-[10px] bg-black/20 px-2 py-1 rounded">capture="env"</span>
                                </button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
                                    onChange={(e) => handleFileChange(e, 'Mode A (Env)')}
                                    onClick={(e) => { addLog('Click: Mode A'); e.currentTarget.value = ''; }}
                                />
                            </div>

                            {/* OPTION 2: NO CAPTURE (SYSTEM CHOOSER) */}
                            <div className="relative group">
                                <button className="w-full py-4 px-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold flex items-center justify-between transition-all active:scale-95 border border-slate-600">
                                    <span className="flex items-center gap-3">
                                        <Settings2 className="w-5 h-5 text-yellow-400" />
                                        <span>Mode B: System Chooser</span>
                                    </span>
                                    <span className="text-[10px] bg-black/20 px-2 py-1 rounded">No capture</span>
                                </button>
                                {/* IMPORTANT: No capture attribute here */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
                                    onChange={(e) => handleFileChange(e, 'Mode B (System)')}
                                    onClick={(e) => { addLog('Click: Mode B'); e.currentTarget.value = ''; }}
                                />
                            </div>

                            {/* OPTION 3: STRICT JPEG + ENV */}
                            <div className="relative group">
                                <button className="w-full py-4 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium flex items-center justify-between transition-all active:scale-95 border border-slate-700 border-dashed">
                                    <span className="flex items-center gap-3">
                                        <Camera className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-300">Mode C: Specific MIME</span>
                                    </span>
                                    <span className="text-[10px] bg-black/20 px-2 py-1 rounded text-slate-400">image/jpeg</span>
                                </button>
                                <input
                                    type="file"
                                    accept="image/jpeg"
                                    capture="environment"
                                    className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
                                    onChange={(e) => handleFileChange(e, 'Mode C (JPEG)')}
                                    onClick={(e) => { addLog('Click: Mode C'); e.currentTarget.value = ''; }}
                                />
                            </div>

                            {/* OPTION 4: STANDARD GALLERY */}
                            <div className="relative group">
                                <button className="w-full py-4 px-4 bg-purple-600/80 hover:bg-purple-600 rounded-xl font-medium flex items-center justify-between transition-all active:scale-95 shadow-lg shadow-purple-500/10">
                                    <span className="flex items-center gap-3">
                                        <ImageIcon className="w-5 h-5" />
                                        <span>Mode D: Gallery</span>
                                    </span>
                                    <span className="text-[10px] bg-black/20 px-2 py-1 rounded">accept="image/*"</span>
                                </button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
                                    onChange={(e) => handleFileChange(e, 'Mode D (Gallery)')}
                                    onClick={(e) => { addLog('Click: Mode D'); e.currentTarget.value = ''; }}
                                />
                            </div>

                        </div>
                    )}
                </div>

                {/* COMPACT CONSOLE */}
                <div className="rounded-xl bg-black/90 p-3 h-48 overflow-y-auto border border-white/10 font-mono text-[10px] shadow-2xl">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10 sticky top-0 bg-black/90">
                        <span className="text-indigo-400 font-bold">EVENT LOG</span>
                        <span className="text-slate-500" onClick={() => setLogs([])}>CLEAR</span>
                    </div>
                    {logs.map((L, i) => (
                        <div key={i} className="mb-1 text-slate-300 border-b border-white/5 pb-0.5">{L}</div>
                    ))}
                    {logs.length === 0 && <div className="text-slate-600 text-center mt-10">No events captured yet</div>}
                </div>

            </main>
        </div>
    )
}

export default App
