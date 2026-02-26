import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface UploadProps {
    onSuccess: (data: any, filePath?: string) => void;
}

export default function PDFUpload({ onSuccess }: UploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            setError("Please upload a valid PDF file.");
            return;
        }

        setError(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // In a real app, the API URL would be in an env variable
            const response = await axios.post(`/api/extract/pdf`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                onSuccess(response.data.data, response.data.file_path);
            } else {
                setError(response.data.error || "Failed to extract PDF data.");
            }
        } catch (err) {
            setError("Network error connecting to the backend.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto mt-10">
            <div
                className={`relative h-[400px] border-2 border-dashed rounded-3xl flex items-center justify-center flex-col transition-all duration-300 ${isDragging
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 scale-105 shadow-2xl'
                    : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 bg-white dark:bg-dark-surface shadow-xl'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf"
                    onChange={handleChange}
                />

                {loading ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-xl font-medium text-slate-600 dark:text-slate-300">Extracting Document...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center pointer-events-none">
                        <div className={`p-6 rounded-full mb-6 transition-colors ${isDragging ? 'bg-primary-100 dark:bg-primary-800' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            <FileText size={48} className={isDragging ? 'text-primary-600 dark:text-primary-300' : 'text-slate-400 dark:text-slate-500'} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                            Drop Invoice PDF Here
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            or <span className="text-primary-500 font-semibold cursor-pointer">browse your files</span>
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
}
