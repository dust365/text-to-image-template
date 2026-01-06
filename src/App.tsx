import { useState, ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, Upload, CheckCircle, AlertCircle } from 'lucide-react';

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Ready');

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setStatus(`File selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
        }
    };

    const handleActionClick = () => {
        // This button could trigger an upload or other action
        if (selectedFile) {
            setStatus('Simulating upload...');
            setTimeout(() => setStatus('Upload complete!'), 1500);
        } else {
            setStatus('Please select a file first.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

            <main className="glass-panel max-w-md w-full p-8 z-10 transition-all duration-300 hover:shadow-2xl">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        Client Service
                    </h1>
                    <p className="text-sm text-[var(--text-dim)] mt-2">
                        WebView Camera & Upload Debugger
                    </p>
                </header>

                <div className="space-y-6">

                    {/* Status Indicator */}
                    <div className="bg-[#0f172a80] rounded-lg p-3 flex items-center space-x-3 border border-indigo-500/20">
                        {status.includes('complete') ? (
                            <CheckCircle className="text-green-400 w-5 h-5 flex-shrink-0" />
                        ) : status.includes('Please') ? (
                            <AlertCircle className="text-yellow-400 w-5 h-5 flex-shrink-0" />
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{status}</span>
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium mb-1 text-[var(--text-dim)]">
                            Upload / Camera Capture
                        </label>

                        <div className="relative group">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment" /* Default to rear camera on mobile */
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                id="file-upload"
                            />
                            <div className="border-2 border-dashed border-indigo-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors group-hover:border-indigo-500/60 bg-[#1e293b50]">
                                {previewUrl ? (
                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/40">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex space-x-4 mb-3 text-indigo-400">
                                            <Camera className="w-8 h-8" />
                                            <ImageIcon className="w-8 h-8" />
                                        </div>
                                        <p className="text-sm font-medium">Tap to take photo or choose file</p>
                                        <p className="text-xs text-[var(--text-dim)] mt-1">Supports image/* capture</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleActionClick}
                        className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/20 transform transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Processing Action</span>
                    </button>

                </div>
            </main>

            <footer className="mt-8 text-center text-xs text-[var(--text-dim)] z-10 w-full px-4">
                WebView Debugger • {new Date().getFullYear()} • Client Service Platform
            </footer>
        </div>
    )
}

export default App
