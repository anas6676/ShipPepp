import { useState, useEffect } from 'react';
import axios from 'axios';
import { DEFAULT_DESIGN } from './LabelDesigner';
import { Printer, CheckCircle, AlertCircle, RefreshCcw, Edit2 } from 'lucide-react';

interface PreviewProps {
    extractedData: any;
    sourceFilePath: string | null;
    onReset: () => void;
}

export default function LabelPreview({ extractedData, sourceFilePath, onReset }: PreviewProps) {
    // Store editable state of the data
    const [data, setData] = useState({
        printer_name: extractedData?.printer_name || '',
        customer_name: extractedData?.customer_name || '',
        workplace: extractedData?.workplace || '',
        dealer_po: extractedData?.dealer_po || '',
        date: new Date().toLocaleDateString('de-DE')
    });

    const [design, setDesign] = useState(DEFAULT_DESIGN);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        // Load custom design if available
        const savedConfig = localStorage.getItem('labelDesignerConfig');
        if (savedConfig) {
            try {
                setDesign(JSON.parse(savedConfig));
            } catch (e) {
                console.error("Failed to parse saved config", e);
            }
        }
    }, []);

    const handlePrint = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const response = await axios.post(`/api/print`, {
                ...data,
                file_path: sourceFilePath,
                design: design,
                tape_size: "62"
            });

            if (response.data.success) {
                setStatus({ type: 'success', message: response.data.message });
                setTimeout(() => {
                    onReset();
                }, 3000);
            } else {
                setStatus({ type: 'error', message: response.data.error || "Failed to print" });
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: "Network error connecting to printer backend." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 mt-6">

            {/* Editor Panel - Left */}
            <div className="w-full lg:w-1/3 space-y-6">
                <div className="glass-panel p-6 rounded-3xl">
                    <div className="flex items-center mb-6 text-slate-800 dark:text-white">
                        <Edit2 className="w-5 h-5 mr-2 text-primary-500" />
                        <h3 className="text-xl font-bold">Verify Data</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Printer Name</label>
                            <input
                                type="text"
                                value={data.printer_name}
                                onChange={(e) => setData({ ...data, printer_name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Name</label>
                            <input
                                type="text"
                                value={data.customer_name}
                                onChange={(e) => setData({ ...data, customer_name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Workplace / Location</label>
                            <input
                                type="text"
                                value={data.workplace}
                                onChange={(e) => setData({ ...data, workplace: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dealer PO (History Only)</label>
                            <input
                                type="text"
                                value={data.dealer_po}
                                onChange={(e) => setData({ ...data, dealer_po: e.target.value })}
                                className="w-full px-4 py-2 border border-emerald-300 dark:border-emerald-600/50 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                                placeholder="e.g. EB26016735"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                            <input
                                type="text"
                                value={data.date}
                                onChange={(e) => setData({ ...data, date: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                            />
                        </div>
                    </div>
                </div>

                {status && (
                    <div className={`p-4 rounded-xl flex items-start border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
                        : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                        }`}>
                        {status.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 shrink-0" />}
                        <p className="font-medium text-sm">{status.message}</p>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={onReset}
                        disabled={loading}
                        className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 flex justify-center items-center transition-colors disabled:opacity-50"
                    >
                        <RefreshCcw size={18} className="mr-2" /> Cancel
                    </button>

                    <button
                        onClick={handlePrint}
                        disabled={loading}
                        className="flex-[2] py-3 px-4 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:-translate-y-1 flex justify-center items-center transition-all disabled:opacity-50 disabled:transform-none"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        ) : <Printer size={18} className="mr-2" />}
                        {loading ? 'Printing...' : 'Print Label (USB)'}
                    </button>
                </div>
            </div>

            {/* Live Label Preview - Right */}
            <div className="flex-1 bg-slate-200 dark:bg-slate-800 p-8 rounded-3xl flex items-center justify-center overflow-auto shadow-inner border border-slate-300 dark:border-slate-700">
                <div className="text-center relative">
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-4 absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        Live Print Preview
                    </p>

                    {/* Simulated 62mm Brother Label Canvas */}
                    <div
                        className="bg-white shadow-2xl relative overflow-hidden"
                        style={{ width: '696px', height: `${design.height}px`, transform: 'scale(0.8)', transformOrigin: 'top center' }}
                    >
                        <div className="absolute px-2 py-1 bg-transparent" style={{ left: design.printer_name_x, top: design.printer_name_y, fontSize: `${design.printer_name_size}px`, fontWeight: 'bold', color: 'black' }}>
                            Printer: {data.printer_name || '...'}
                        </div>

                        <div className="absolute px-2 py-1 bg-transparent" style={{ left: design.customer_name_x, top: design.customer_name_y, fontSize: `${design.customer_name_size}px`, fontWeight: 'bold', color: 'black' }}>
                            Customer: {data.customer_name || '...'}
                        </div>

                        <div className="absolute px-2 py-1 bg-transparent" style={{ left: design.workplace_x, top: design.workplace_y, fontSize: `${design.workplace_size}px`, color: 'black' }}>
                            Workplace: {data.workplace || '...'}
                        </div>

                        <div className="absolute px-2 py-1 bg-transparent" style={{ left: design.date_x, top: design.date_y, fontSize: `${design.date_size}px`, color: 'black' }}>
                            Date: {data.date || '...'}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
