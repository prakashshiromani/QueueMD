import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useLabStore } from '../store/labStore';
import { useAuthStore } from '../store/authStore';
import { socket } from '../services/socket';
import { labApi } from '../services/labApi';
import { Beaker, Search, Filter, Calendar, Plus, X, FlaskConical, Clock, User, Phone, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function LabReports() {
  const { reports, stats, loading, filters, fetchReports, fetchStats, setFilters, updateReportRealtime, pagination } = useLabStore();
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    testType: 'CBC',
    sampleId: `SAM-${Math.floor(1000 + Math.random() * 9000)}`
  });

  // Initial Load
  useEffect(() => {
    fetchReports();
    fetchStats();
  }, []);

  // Socket Listener for Real-time Updates
  useEffect(() => {
    const handleSocketUpdate = (data) => {
      // Backend emits { action, report }
      if (data.facilityType === 'pathlab' && data.report) {
        updateReportRealtime(data.report);
        if (data.action === 'add') {
          toast.success(`New lab order: ${data.report.customData?.sampleId || 'Created'}`);
        }
      }
    };
    socket.on('queue_update', handleSocketUpdate);
    return () => socket.off('queue_update', handleSocketUpdate);
  }, []);

  // Handle Search with Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.sampleId) return toast.error("Patient Name & Sample ID required");

    setIsSubmitting(true);
    try {
      const payload = {
        patientName: formData.patientName,
        phone: formData.phone,
        customData: {
          sampleId: formData.sampleId,
          testType: formData.testType
        }
      };
      await labApi.createOrder(payload);
      setIsModalOpen(false);
      setFormData({
        patientName: '',
        phone: '',
        testType: 'CBC',
        sampleId: `SAM-${Math.floor(1000 + Math.random() * 9000)}`
      });
      // No need to fetchReports manually, socket will handle it or store will unshift
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create lab order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, currentStatus) => {
    const transitions = {
      'waiting': 'in-progress',
      'in-progress': 'completed',
      'completed': 'delivered'
    };
    const nextStatus = transitions[currentStatus];
    if (!nextStatus) return;

    try {
      await labApi.updateStatus(id, nextStatus);
      toast.success(`Status updated to ${nextStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  // Status Badge Helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'in-progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'delivered': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-text-secondary bg-surface-variant border-border-muted/50';
    }
  };

  return (
    <Layout>
      <div className="space-y-6 p-2 pb-[100px] max-w-7xl mx-auto w-full">

        {/* 1. Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-text-primary flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-primary-container/10 rounded-xl">
                <Beaker className="w-8 h-8 text-primary-container" />
              </div>
              Lab Reports
            </h1>
            <p className="text-text-secondary text-sm mt-1 ml-1">Manage and track patient test results</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-[46px] rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Lab Order
          </button>
        </div>

        {/* 2. Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pending Samples', count: stats.pending, color: 'text-yellow-400', icon: '📋', bg: 'bg-yellow-400/10' },
            { label: 'Processing', count: stats.processing, color: 'text-blue-400', icon: '🔬', bg: 'bg-blue-400/10' },
            { label: 'Results Ready', count: stats.ready, color: 'text-green-400', icon: '✅', bg: 'bg-green-400/10' },
            { label: 'Delivered', count: stats.delivered, color: 'text-purple-400', icon: '🚚', bg: 'bg-purple-400/10' }
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="bg-bg-secondary border border-border-muted/50 dark:border-white/5 p-5 rounded-2xl hover:border-primary-container/30 transition-all group shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-text-secondary text-[11px] uppercase tracking-[0.15em] font-black">{item.label}</p>
                  <h3 className={`text-3xl font-black mt-2 tracking-tight ${item.color}`}>{item.count}</h3>
                </div>
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all`}>
                  {item.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3. Filters & Search */}
        <div className="bg-bg-secondary/80 backdrop-blur-md p-4 rounded-2xl border border-border-muted/50 dark:border-white/5 flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by Patient Name or Sample ID..."
              className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-blue-600 transition-all placeholder:text-text-secondary/50 shadow-inner"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <select
                className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 pl-10 pr-8 text-sm text-text-primary focus:outline-none appearance-none cursor-pointer"
                value={filters.date}
                onChange={(e) => setFilters({ date: e.target.value })}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="relative flex-1 lg:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <select
                className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 pl-10 pr-8 text-sm text-text-primary focus:outline-none appearance-none cursor-pointer"
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
              >
                <option value="all">All Statuses</option>
                <option value="waiting">Pending</option>
                <option value="in-progress">Processing</option>
                <option value="completed">Ready</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Data Table */}
        <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-primary/50 text-text-secondary text-[11px] uppercase tracking-[0.2em] font-black border-b border-border-muted/50 dark:border-white/5">
                  <th className="px-6 py-5">Sample ID</th>
                  <th className="px-6 py-5">Patient Name</th>
                  <th className="px-6 py-5">Test Type</th>
                  <th className="px-6 py-5">Date & Time</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/30">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-text-secondary text-sm font-medium">Fetching reports...</p>
                      </div>
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-bg-primary rounded-2xl flex items-center justify-center text-3xl">📭</div>
                        <div>
                          <p className="text-text-primary font-bold">No reports found</p>
                          <p className="text-text-secondary text-sm mt-1">Try adjusting your filters or search query</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((report, idx) => (
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={report._id}
                      className="hover:bg-surface-variant/50 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <span className="font-mono text-xs font-bold text-primary-container bg-primary-container/5 px-2 py-1 rounded border border-primary-container/10">
                          {report.customData?.sampleId || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-bg-primary flex items-center justify-center text-[10px] font-black text-text-secondary border border-border-muted/50 dark:border-white/5">
                            {report.patientName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm text-text-primary font-bold tracking-tight">{report.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-text-secondary font-medium">{report.customData?.testType || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm text-text-primary font-bold">{new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[10px] text-text-secondary uppercase tracking-widest mt-0.5">{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusStyle(report.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse"></span>
                          {(report.status || 'unknown').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleStatusUpdate(report._id, report.status)}
                          className="px-3 py-1.5 bg-bg-primary hover:bg-surface-variant text-text-primary text-[10px] font-black rounded-lg transition-all border border-border-muted/50 dark:border-white/5"
                        >
                          NEXT STEP
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-5 bg-bg-primary/30 border-t border-border-muted/50 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[12px] text-text-secondary font-medium">
              Showing <span className="text-text-primary font-bold">{reports.length}</span> of <span className="text-text-primary font-bold">{pagination.total}</span> reports
            </span>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary text-xs font-bold hover:bg-bg-primary hover:text-text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-border-muted/50 dark:border-white/5"
                disabled={pagination.page === 1}
                onClick={() => setFilters({ page: pagination.page - 1 })}
              >
                Previous
              </button>
              <div className="flex gap-1">
                {[...Array(Math.ceil(pagination.total / pagination.limit) || 1)].map((_, i) => (
                  <button
                    key={i}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${pagination.page === i + 1
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-text-secondary hover:bg-bg-primary'
                      }`}
                    onClick={() => setFilters({ page: i + 1 })}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary text-xs font-bold hover:bg-bg-primary hover:text-text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-border-muted/50 dark:border-white/5"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => setFilters({ page: pagination.page + 1 })}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Lab Order Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg-primary/90 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border-muted/30 dark:border-white/5 flex justify-between items-center bg-bg-primary/30">
                <div>
                  <h2 className="text-2xl font-black text-text-primary tracking-tight">New Lab Order</h2>
                  <p className="text-text-secondary text-xs mt-1">Register a new sample for clinical testing</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-bg-primary flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Patient Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                      <input
                        required
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-blue-600 transition-all shadow-inner placeholder:text-text-secondary/30"
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-blue-600 transition-all shadow-inner placeholder:text-text-secondary/30"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Test Category</label>
                      <div className="relative">
                        <Beaker className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                        <select
                          className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-blue-600 transition-all shadow-inner appearance-none cursor-pointer"
                          value={formData.testType}
                          onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                        >
                          <option value="Blood">Blood Test</option>
                          <option value="Urine">Urine Test</option>
                          <option value="X-Ray">X-Ray</option>
                          <option value="MRI">MRI Scan</option>
                          <option value="CBC">CBC</option>
                          <option value="HbA1c">HbA1c</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Sample ID</label>
                      <div className="relative">
                        <FlaskConical className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                        <input
                          required
                          type="text"
                          className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-blue-600 transition-all shadow-inner"
                          value={formData.sampleId}
                          onChange={(e) => setFormData({ ...formData, sampleId: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {isSubmitting ? 'GENERATING...' : 'GENERATE LAB ORDER'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
