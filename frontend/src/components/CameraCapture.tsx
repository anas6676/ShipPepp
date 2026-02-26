import React, { useRef, useState, ChangeEvent } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface CameraCaptureProps {
    onSuccess: (data: any) => void;
}

export default function CameraCapture({ onSuccess }: CameraCaptureProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const retake = () => {
        setImageSrc(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Handle native mobile camera capture via file input
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleNativeCapture = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageSrc(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Convert base64 to file for upload
    const processImage = async () => {
        if (!imageSrc) return;

        setLoading(true);
        setError(null);

        try {
            // Convert base64 to Blob
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`/api/extract/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                onSuccess(response.data.data, response.data.file_path);
            } else {
                setError(response.data.error || "Failed to extract data from image.");
            }
        } catch (err) {
            setError("Network error connecting to the backend.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-6">
            <div className="glass-panel p-6 rounded-3xl overflow-hidden shadow-2xl">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {!imageSrc ? (
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3] md:aspect-video flex-col flex items-center justify-center p-8 text-center">
                        <Camera size={64} className="text-slate-500 mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-2">Capture Ink Note</h3>
                        <p className="text-slate-400 max-w-md mb-8">
                            Use your device's native camera to take a clear, well-lit photo of the delivery label.
                        </p>

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleNativeCapture}
                            ref={fileInputRef}
                            className="hidden"
                            id="native-camera-input"
                        />
                        <label
                            htmlFor="native-camera-input"
                            className="flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-full font-bold text-lg shadow-xl shadow-primary-500/20 cursor-pointer transition-transform active:scale-95"
                        >
                            <Camera size={24} className="mr-3" />
                            Open Camera
                        </label>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="relative rounded-2xl overflow-hidden aspect-video">
                            <img src={imageSrc} alt="Captured" className="w-full h-full object-cover" />
                            {loading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                                    <p className="text-white text-xl font-medium">Running OCR Analysis...</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={retake}
                                disabled={loading}
                                className="flex-1 max-w-xs flex items-center justify-center py-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={20} className="mr-2" />
                                Retake Photo
                            </button>
                            <button
                                onClick={processImage}
                                disabled={loading}
                                className="flex-1 max-w-xs flex items-center justify-center py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                            >
                                <CheckCircle size={20} className="mr-2" />
                                Extract Data
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
