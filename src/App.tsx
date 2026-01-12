import { useState, ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, Upload, X, Smartphone, Globe, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base64ToFile, uploadFile, createFileFromData } from './utils/fileUpload';

// Declare the Flutter InAppWebView Bridge type
declare global {
    interface Window {
        flutter_inappwebview?: {
            callHandler: (handlerName: string, ...args: any[]) => Promise<any>;
        };
    }
}

// 上传状态类型
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
    const [showAndroidModal, setShowAndroidModal] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
    const [uploadError, setUploadError] = useState<string | null>(null);
    // 上传接口地址（可以从环境变量或配置中读取）
    // Vite 使用 import.meta.env，但这里使用默认值，实际使用时可以通过 props 或配置传入
    const [uploadUrl] = useState<string>(import.meta.env.VITE_UPLOAD_URL || 'https://your-api.com/upload');

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target || !e.target.files?.length) {
            return;
        }
        const file = e.target.files[0];
        processFile(file);
    };

    const processFile = (file: File) => {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setFileSize((file.size / 1024).toFixed(2) + ' KB');
        // 重置上传状态
        setUploadStatus('idle');
        setUploadError(null);
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setFileSize(null);
        setUploadStatus('idle');
        setUploadError(null);
    };

    const handleAndroidClick = () => {
        setShowAndroidModal(true);
    };

    const callFlutter = (method: 'openCamera' | 'openGallery') => {
        if (window.flutter_inappwebview?.callHandler) {
            window.flutter_inappwebview.callHandler(method, { source: 'web_clicked' })
                .then((result: any) => {
                    if (result && result.base64) {
                        const base64Str = result.base64;
                        
                        // 将 base64 转换为 File 对象（统一处理）
                        try {
                            const file = base64ToFile(base64Str, `android_${method}_${Date.now()}.jpg`);
                            setSelectedFile(file);
                            setPreviewUrl(base64Str); // 预览仍用 base64（data URI）
                            setFileSize((file.size / 1024).toFixed(2) + ' KB');
                            setUploadStatus('idle');
                            setUploadError(null);
                        } catch (err) {
                            console.error('Error converting base64 to file:', err);
                            setUploadError('转换文件失败');
                        }
                    }
                })
                .catch((err: any) => {
                    console.error(`Bridge Error: ${err}`);
                    setUploadError(`Bridge Error: ${err}`);
                });
        }
        setShowAndroidModal(false);
    };

    /**
     * 统一的文件上传函数
     * 处理 iOS (File) 和 Android (base64 -> File) 两种情况
     */
    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadError('请先选择文件');
            return;
        }

        setUploadStatus('uploading');
        setUploadError(null);

        try {
            // 统一使用 File 对象上传
            const result = await uploadFile(selectedFile, uploadUrl, {
                platform: platform,
                timestamp: new Date().toISOString(),
            });

            setUploadStatus('success');
            console.log('Upload success:', result);
            
            // 可选：上传成功后清理或显示成功消息
            // setTimeout(() => {
            //     clearSelection();
            // }, 2000);
        } catch (error: any) {
            setUploadStatus('error');
            setUploadError(error.message || '上传失败，请重试');
            console.error('Upload error:', error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500/30">

            <main className="w-full max-w-md flex flex-col gap-6 z-10">

                {/* HEADER */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        上传图片
                    </h1>
                    <p className="text-sm text-slate-400">请选择平台开始</p>
                </div>

                {/* MAIN PANEL */}
                <div className="glass-panel bg-slate-800/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">

                    {/* PLATFORM TOGGLE */}
                    <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6 relative">
                        <button
                            onClick={() => setPlatform('ios')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${platform === 'ios' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Smartphone className="w-4 h-4" /> iOS
                        </button>
                        <button
                            onClick={() => setPlatform('android')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${platform === 'android' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Globe className="w-4 h-4" /> Android
                        </button>
                    </div>



                    {/* UPLOAD AREA */}
                    {previewUrl ? (
                        <>
                            <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-white/10 group">
                                <img src={previewUrl} className="w-full aspect-square object-cover" alt="Preview" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={clearSelection} className="p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-transform hover:scale-110">
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* FILE SIZE INFO */}
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm p-2 text-center">
                                    <span className="text-xs font-mono text-white/90">{fileSize}</span>
                                </div>
                            </div>

                            {/* UPLOAD BUTTON & STATUS */}
                            <div className="space-y-3 mt-4">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploadStatus === 'uploading'}
                                    className={`
                                        w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl 
                                        font-semibold transition-all duration-300
                                        ${uploadStatus === 'uploading'
                                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                            : uploadStatus === 'success'
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25'
                                        }
                                    `}
                                >
                                    {uploadStatus === 'uploading' ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            上传中...
                                        </>
                                    ) : uploadStatus === 'success' ? (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            上传成功
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            上传图片
                                        </>
                                    )}
                                </button>

                                {/* ERROR MESSAGE */}
                                {uploadError && uploadStatus === 'error' && (
                                    <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{uploadError}</span>
                                    </div>
                                )}

                                {/* SUCCESS MESSAGE */}
                                {uploadStatus === 'success' && (
                                    <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-sm">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        <span>文件上传成功！</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="relative group">
                            <div className={`
                        relative z-10 w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 
                        bg-slate-900/30 hover:bg-slate-800/50 hover:border-indigo-500/50 
                        flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer
                        ${platform === 'android' ? 'active:scale-[0.98]' : ''}
                    `}
                                onClick={platform === 'android' ? handleAndroidClick : undefined}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                                    <Upload className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-white mb-1">
                                        {platform === 'ios' ? 'Tap to Upload' : 'Tap to Select'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {platform === 'ios' ? 'Supports Image & Camera' : 'Via Android Bridge'}
                                    </p>
                                </div>

                                {/* iOS INPUT OVERLAY */}
                                {platform === 'ios' && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"
                                        onChange={handleFileChange}
                                        onClick={(e) => { e.currentTarget.value = ''; }}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>



            </main>

            {/* ANDROID MODAL */}
            {showAndroidModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-slate-800 rounded-3xl p-6 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">选择方式</h3>
                            <button onClick={() => setShowAndroidModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid gap-3">
                            <button
                                onClick={() => callFlutter('openCamera')}
                                className="flex items-center gap-4 p-4 bg-slate-700/50 hover:bg-indigo-600/20 hover:border-indigo-500/50 border border-white/5 rounded-2xl transition-all active:scale-[0.98] group"
                            >
                                <div className="p-3 bg-indigo-500/20 rounded-xl group-hover:bg-indigo-500 text-indigo-400 group-hover:text-white transition-colors">
                                    <Camera size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-white">拍照</p>
                                    <p className="text-xs text-slate-400">使用相机拍摄</p>
                                </div>
                            </button>

                            <button
                                onClick={() => callFlutter('openGallery')}
                                className="flex items-center gap-4 p-4 bg-slate-700/50 hover:bg-purple-600/20 hover:border-purple-500/50 border border-white/5 rounded-2xl transition-all active:scale-[0.98] group"
                            >
                                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500 text-purple-400 group-hover:text-white transition-colors">
                                    <ImageIcon size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-white">手机相册</p>
                                    <p className="text-xs text-slate-400">从相册选择</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;
