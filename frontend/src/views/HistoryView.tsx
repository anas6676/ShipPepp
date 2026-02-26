import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Printer, User, MapPin, Search, Filter, FileSpreadsheet, FileText, Plus, Trash2, Edit2, CheckCircle, Clock, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Delivery {
    id: number;
    printer_name: string;
    customer_name: string;
    workplace: string;
    dealer_po: string;
    filename: string;
    delivery_date: string;
    status: string;
}

export default function HistoryView() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        printer_name: '',
        customer_name: '',
        workplace: '',
        dealer_po: '',
        status: 'ready'
    });

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Include status, search, and date params in GET request
            const response = await axios.get(`/api/history`, {
                params: {
                    status: statusFilter,
                    search: searchQuery,
                    start_date: startDate || undefined,
                    end_date: endDate || undefined
                }
            });
            setDeliveries(response.data);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when filters change (debounced search would be better, but triggering on enter/blur is fine here)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchHistory();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, statusFilter, startDate, endDate]);

    // Status Toggle
    const toggleStatus = async (delivery: Delivery) => {
        const newStatus = delivery.status === 'ready' ? 'delivered' : 'ready';
        try {
            await axios.put(`/api/history/${delivery.id}`, { status: newStatus });
            // Update local state instantly 
            setDeliveries(prev => prev.map(d => d.id === delivery.id ? { ...d, status: newStatus } : d));
        } catch (err) {
            console.error("Failed to toggle status", err);
        }
    };

    // Delete Record
    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this record permanently?")) return;
        try {
            await axios.delete(`/api/history/${id}`);
            setDeliveries(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    // Export PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Ink Delivery Invoice Report", 14, 15);

        autoTable(doc, {
            startY: 20,
            head: [['ID', 'Date', 'Printer', 'Customer', 'Workplace', 'PO', 'Status']],
            body: deliveries.map(d => [
                d.id,
                new Date(d.delivery_date).toLocaleDateString(),
                d.printer_name,
                d.customer_name,
                d.workplace,
                d.dealer_po || '',
                d.status.toUpperCase()
            ]),
        });
        doc.save("Ink_Deliveries_Report.pdf");
    };

    // Export Excel
    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(deliveries.map(d => ({
            ID: d.id,
            Date: new Date(d.delivery_date).toLocaleString(),
            Printer: d.printer_name,
            Customer: d.customer_name,
            Workplace: d.workplace,
            "Dealer PO": d.dealer_po,
            Source: d.filename,
            Status: d.status.toUpperCase()
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Deliveries");
        XLSX.writeFile(wb, "Ink_Deliveries_Report.xlsx");
    };

    // Modal submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`/api/history/${editingId}`, formData);
            } else {
                await axios.post(`/api/history`, formData);
            }
            setShowModal(false);
            fetchHistory(); // refresh data
        } catch (err) {
            console.error("Failed to save record", err);
        }
    };

    const openModal = (delivery?: Delivery) => {
        if (delivery) {
            setEditingId(delivery.id);
            setFormData({
                printer_name: delivery.printer_name || '',
                customer_name: delivery.customer_name || '',
                workplace: delivery.workplace || '',
                dealer_po: delivery.dealer_po || '',
                status: delivery.status || 'ready'
            });
        } else {
            setEditingId(null);
            setFormData({ printer_name: '', customer_name: '', workplace: '', dealer_po: '', status: 'ready' });
        }
        setShowModal(true);
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">

            {/* Top Controls Bar */}
            <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-dark-border flex flex-col xl:flex-row justify-between gap-4 items-center">

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row flex-1 w-full gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search Customer, Printer, or PO..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-dark-bg border-none rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="relative shrink-0">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-100 dark:bg-dark-bg border-none rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white text-sm"
                                title="Start Date"
                            />
                        </div>
                        <span className="text-slate-400 flex items-center">-</span>
                        <div className="relative shrink-0">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-100 dark:bg-dark-bg border-none rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white text-sm"
                                title="End Date"
                            />
                        </div>
                    </div>

                    <div className="relative w-full md:w-40 shrink-0">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 z-10 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-8 py-2 appearance-none bg-slate-100 dark:bg-dark-bg border-none rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white font-medium relative"
                        >
                            <option value="all">All Statuses</option>
                            <option value="ready">Ready</option>
                            <option value="delivered">Delivered</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 shrink-0 w-full xl:w-auto">
                    <button onClick={exportPDF} className="flex hidden lg:flex items-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl font-medium transition-colors">
                        <FileText size={18} className="mr-2" /> PDF Invoice
                    </button>
                    <button onClick={exportExcel} className="flex flex-1 lg:flex-none justify-center items-center px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-xl font-medium transition-colors">
                        <FileSpreadsheet size={18} className="mr-2" /> Excel Report
                    </button>
                    <button onClick={() => openModal()} className="flex flex-1 lg:flex-none justify-center items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 font-medium rounded-xl transition-all hover:-translate-y-0.5">
                        <Plus size={18} className="mr-2" /> Add Manual
                    </button>
                </div>
            </div>

            {/* Database Table */}
            <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-sm border border-slate-200 dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-dark-bg/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Status</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Date/Time</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Printer</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Customer</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Workplace</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Dealer PO</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading database...</td></tr>
                            ) : deliveries.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No records found matching filters.</td></tr>
                            ) : (
                                deliveries.map((delivery) => (
                                    <tr key={delivery.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">

                                        {/* Status Toggle Badge */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleStatus(delivery)}
                                                className={`flex items-center px-3 py-1 rounded-full text-xs font-bold transition-colors ${delivery.status === 'delivered'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200'
                                                    }`}
                                            >
                                                {delivery.status === 'delivered' ? <CheckCircle size={14} className="mr-1" /> : <Clock size={14} className="mr-1" />}
                                                {delivery.status.toUpperCase()}
                                            </button>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center">
                                                <Calendar size={14} className="mr-2 text-slate-400" />
                                                {new Date(delivery.delivery_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {delivery.printer_name || '-'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">
                                            {delivery.customer_name || '-'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">
                                            {delivery.workplace || '-'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 dark:text-white">
                                            {delivery.dealer_po || '-'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal(delivery)} className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(delivery.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingId ? 'Edit Delivery Record' : 'Add Manual Record'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Name</label>
                                    <input required type="text" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. John Doe" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Printer ID</label>
                                    <input type="text" value={formData.printer_name} onChange={e => setFormData({ ...formData, printer_name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dealer PO</label>
                                    <input type="text" value={formData.dealer_po} onChange={e => setFormData({ ...formData, dealer_po: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Workplace / Location</label>
                                    <input type="text" value={formData.workplace} onChange={e => setFormData({ ...formData, workplace: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>

                                <div className="col-span-2 mt-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Delivery Status</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex items-center justify-center py-2 px-4 rounded-xl border cursor-pointer font-medium transition-colors ${formData.status === 'ready' ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400' : 'bg-white border-slate-200 text-slate-500 dark:bg-dark-bg dark:border-slate-600'}`}>
                                            <input type="radio" value="ready" checked={formData.status === 'ready'} onChange={() => setFormData({ ...formData, status: 'ready' })} className="hidden" />
                                            <Clock size={16} className="mr-2" /> Ready
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center py-2 px-4 rounded-xl border cursor-pointer font-medium transition-colors ${formData.status === 'delivered' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400' : 'bg-white border-slate-200 text-slate-500 dark:bg-dark-bg dark:border-slate-600'}`}>
                                            <input type="radio" value="delivered" checked={formData.status === 'delivered'} onChange={() => setFormData({ ...formData, status: 'delivered' })} className="hidden" />
                                            <CheckCircle size={16} className="mr-2" /> Delivered
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-[2] py-3 px-4 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5">
                                    {editingId ? 'Save Changes' : 'Create Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
