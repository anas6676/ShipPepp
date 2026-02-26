import { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { Save, RefreshCw } from 'lucide-react';

// Using the same config as the backend printer
export const DEFAULT_DESIGN = {
    printer_name_x: 20,
    printer_name_y: 20,
    printer_name_size: 40,

    customer_name_x: 20,
    customer_name_y: 80,
    customer_name_size: 30,

    workplace_x: 20,
    workplace_y: 140,
    workplace_size: 24,

    date_x: 20,
    date_y: 200,
    date_size: 20,

    height: 400 // Dynamic roll length in pixels for continuous tape (QL-800 62mm is 696px wide)
};

export default function LabelDesigner() {
    const [config, setConfig] = useState(DEFAULT_DESIGN);
    const [saved, setSaved] = useState(false);

    // Refs for react-draggable to avoid findDOMNode in React 19
    const printerRef = useRef<HTMLDivElement>(null);
    const customerRef = useRef<HTMLDivElement>(null);
    const workplaceRef = useRef<HTMLDivElement>(null);
    const dateRef = useRef<HTMLDivElement>(null);

    // Load from local storage on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem('labelDesignerConfig');
        if (savedConfig) {
            try {
                setConfig(JSON.parse(savedConfig));
            } catch (e) {
                console.error("Failed to parse saved config", e);
            }
        }
    }, []);

    const handleDrag = (field: string, e: any, data: { x: number, y: number }) => {
        setConfig(prev => ({
            ...prev,
            [`${field}_x`]: data.x,
            [`${field}_y`]: data.y
        }));
    };

    const handleSizeChange = (field: string, newSize: number) => {
        setConfig(prev => ({
            ...prev,
            [`${field}_size`]: newSize
        }));
    };

    const saveConfig = () => {
        localStorage.setItem('labelDesignerConfig', JSON.stringify(config));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const resetConfig = () => {
        setConfig(DEFAULT_DESIGN);
        localStorage.removeItem('labelDesignerConfig');
    };

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

            {/* Visual Canvas */}
            <div className="flex-1 bg-slate-200 dark:bg-slate-800 p-8 rounded-3xl flex items-center justify-center overflow-auto shadow-inner border border-slate-300 dark:border-slate-700">

                {/* Simulated 62mm Brother Label Canvas - Fixed Width (proportional) */}
                <div
                    className="bg-white shadow-2xl relative overflow-hidden ring-4 ring-white/50"
                    style={{ width: '696px', height: `${config.height}px`, transform: 'scale(0.8)', transformOrigin: 'top center' }}
                >
                    {/* Grid lines for alignment */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0gMjAgMCBMMCAwIDAgMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2U1ZTdlYiIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-50 pointer-events-none"></div>

                    {/* Draggable Elements */}
                    <Draggable nodeRef={printerRef} bounds="parent" position={{ x: config.printer_name_x, y: config.printer_name_y }} onDrag={(e, d) => handleDrag('printer_name', e, d)}>
                        <div ref={printerRef} className="absolute cursor-move hover:ring-2 hover:ring-primary-500 px-2 py-1 rounded bg-blue-50/50" style={{ fontSize: `${config.printer_name_size}px`, fontWeight: 'bold', color: 'black' }}>
                            Printer: PRINTER-DEMO
                        </div>
                    </Draggable>

                    <Draggable nodeRef={customerRef} bounds="parent" position={{ x: config.customer_name_x, y: config.customer_name_y }} onDrag={(e, d) => handleDrag('customer_name', e, d)}>
                        <div ref={customerRef} className="absolute cursor-move hover:ring-2 hover:ring-primary-500 px-2 py-1 rounded bg-blue-50/50" style={{ fontSize: `${config.customer_name_size}px`, fontWeight: 'bold', color: 'black' }}>
                            Customer: John Doe (JD)
                        </div>
                    </Draggable>

                    <Draggable nodeRef={workplaceRef} bounds="parent" position={{ x: config.workplace_x, y: config.workplace_y }} onDrag={(e, d) => handleDrag('workplace', e, d)}>
                        <div ref={workplaceRef} className="absolute cursor-move hover:ring-2 hover:ring-primary-500 px-2 py-1 rounded bg-blue-50/50" style={{ fontSize: `${config.workplace_size}px`, color: 'black' }}>
                            Workplace: WKP123-ABC
                        </div>
                    </Draggable>

                    <Draggable nodeRef={dateRef} bounds="parent" position={{ x: config.date_x, y: config.date_y }} onDrag={(e, d) => handleDrag('date', e, d)}>
                        <div ref={dateRef} className="absolute cursor-move hover:ring-2 hover:ring-primary-500 px-2 py-1 rounded bg-blue-50/50" style={{ fontSize: `${config.date_size}px`, color: 'black' }}>
                            Date: 26.02.2026
                        </div>
                    </Draggable>
                </div>
            </div>

            {/* Controls Panel */}
            <div className="w-full lg:w-96 space-y-6">
                <div className="glass-panel p-6 rounded-3xl">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Typography Settings</h3>

                    <div className="space-y-6">
                        <SizeSlider label="Printer Font Size" value={config.printer_name_size} onChange={(v) => handleSizeChange('printer_name', v)} />
                        <SizeSlider label="Customer Font Size" value={config.customer_name_size} onChange={(v) => handleSizeChange('customer_name', v)} />
                        <SizeSlider label="Workplace Font Size" value={config.workplace_size} onChange={(v) => handleSizeChange('workplace', v)} />
                        <SizeSlider label="Date Font Size" value={config.date_size} onChange={(v) => handleSizeChange('date', v)} />

                        <div className="pt-4 border-t border-slate-200 dark:border-dark-border">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                                <span>Label Tape Length (px)</span>
                                <span className="text-primary-600 font-bold">{config.height}px</span>
                            </label>
                            <input
                                type="range" min="200" max="1000" step="10"
                                value={config.height}
                                onChange={(e) => setConfig({ ...config, height: parseInt(e.target.value) })}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                            <p className="text-xs text-slate-500 mt-2">Adjust depending on how much white space you need.</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={resetConfig}
                        className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 flex justify-center items-center transition-colors"
                    >
                        <RefreshCw size={18} className="mr-2" /> Reset
                    </button>
                    <button
                        onClick={saveConfig}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white flex justify-center items-center transition-all ${saved ? 'bg-emerald-500 shadow-emerald-500/20 shadow-lg' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30 hover:-translate-y-1 shadow-lg'}`}
                    >
                        <Save size={18} className="mr-2" /> {saved ? 'Saved!' : 'Save Design'}
                    </button>
                </div>
            </div>

        </div>
    );
}

function SizeSlider({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                <span>{label}</span>
                <span className="text-primary-600 font-bold">{value}px</span>
            </label>
            <input
                type="range" min="10" max="100"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
        </div>
    )
}
