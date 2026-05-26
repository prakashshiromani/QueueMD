import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useLabStore } from '../store/labStore';
import { useAuthStore } from '../store/authStore';
import { useFacilityStore } from '../store/facilityStore';
import { socket } from '../services/socket';
import { labApi } from '../services/labApi';
import { staffApi } from '../services/staffApi';
import { Beaker, Search, Filter, Calendar, Plus, X, FlaskConical, Clock, User, Phone, CheckCircle2, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function LabReports() {
  const { facilityId } = useFacilityStore();
  const { reports, stats, loading, filters, fetchReports, fetchStats, setFilters, updateReportRealtime, removeReportRealtime, pagination } = useLabStore();
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    testType: '',
    sampleId: `SAM-${Math.floor(1000 + Math.random() * 9000)}`,
    doctorName: ''
  });

  // Format phone number (Indian format, max 10 digits)
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.startsWith("91")) {
      const sliced = numbers.slice(2);
      return `+91 ${sliced.slice(0, 5)}${sliced.length > 5 ? ' ' + sliced.slice(5, 10) : sliced.slice(5)}`;
    }
    if (numbers.length > 0) {
      return `+91 ${numbers.slice(0, 5)}${numbers.length > 5 ? ' ' + numbers.slice(5, 10) : numbers.slice(5)}`;
    }
    return "";
  };

  // Initial Load
  useEffect(() => {
    fetchReports();
    fetchStats();

    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await staffApi.getAll();
        const staffList = res.data || res.users || [];
        const activeDoctors = staffList.filter(s => s.role === "doctor" && s.isActive && s.facilityType === "pathlab");
        if (activeDoctors.length === 0) {
          setDoctors(staffList.filter(s => s.role === "doctor" && s.isActive));
        } else {
          setDoctors(activeDoctors);
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Join Socket Room
  useEffect(() => {
    if (!facilityId) return;
    socket.emit("join_facility", { facilityId, facilityType: 'pathlab' });
  }, [facilityId]);

  // Socket Listener for Real-time Updates
  useEffect(() => {
    const handleSocketUpdate = (data) => {
      // Backend emits { action, report, reportId }
      if (data.facilityType === 'pathlab') {
        if (data.action === 'delete' && data.reportId) {
          removeReportRealtime(data.reportId);
          toast.success("Lab order deleted by staff");
        } else if (data.report) {
          updateReportRealtime(data.report);
          if (data.action === 'add') {
            toast.success(`New lab order: ${data.report.customData?.sampleId || 'Created'}`);
          }
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
        doctorName: formData.doctorName,
        customData: {
          sampleId: formData.sampleId,
          testType: formData.testType
        }
      };

      if (editingReport) {
        await labApi.updateOrder(editingReport._id, payload);
        toast.success("Lab order updated successfully");
      } else {
        await labApi.createOrder(payload);
        toast.success("Lab order created successfully");
        setFilters({ status: 'all', search: '', page: 1 }); // Force reset filters so new order is instantly shown!
      }

      setIsModalOpen(false);
      setEditingReport(null);
      setFormData({
        patientName: '',
        phone: '',
        testType: '',
        sampleId: `SAM-${Math.floor(1000 + Math.random() * 9000)}`,
        doctorName: ''
      });
      fetchReports();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save lab order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lab order?")) return;
    try {
      await labApi.deleteOrder(id);
      toast.success("Lab order deleted successfully");
      fetchReports();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete lab order");
    }
  };

  const openEditModal = (report) => {
    setEditingReport(report);
    setFormData({
      patientName: report.patientName || '',
      phone: report.phone || '',
      testType: report.customData?.testType || '',
      sampleId: report.customData?.sampleId || '',
      doctorName: report.doctorName || ''
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingReport(null);
    setFormData({
      patientName: '',
      phone: '',
      testType: '',
      sampleId: `SAM-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorName: ''
    });
    setIsModalOpen(true);
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
            onClick={openCreateModal}
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
                  <th className="px-6 py-5">Doctor</th>
                  <th className="px-6 py-5">Date & Time</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/30">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-text-secondary text-sm font-medium">Fetching reports...</p>
                      </div>
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
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
                        <span className="text-sm text-text-secondary font-medium">{report.doctorName || 'Not Assigned'}</span>
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
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleStatusUpdate(report._id, report.status)}
                            disabled={report.status === 'delivered'}
                            className="px-3 py-1.5 bg-bg-primary hover:bg-surface-variant text-text-primary text-[10px] font-black rounded-lg transition-all border border-border-muted/50 dark:border-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            NEXT STEP
                          </button>
                          
                          <button
                            onClick={() => openEditModal(report)}
                            title="Edit Lab Order"
                            className="p-1.5 bg-bg-primary hover:bg-blue-600/10 text-text-secondary hover:text-blue-500 rounded-lg transition-all border border-border-muted/50 dark:border-white/5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteOrder(report._id)}
                            title="Delete Lab Order"
                            className="p-1.5 bg-bg-primary hover:bg-red-600/10 text-text-secondary hover:text-red-500 rounded-lg transition-all border border-border-muted/50 dark:border-white/5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
        {isModalOpen && (() => {
          const inputCls = "w-full h-[50px] bg-bg-primary border border-border-muted/50 rounded-xl px-11 text-[14px] text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm";
          const labelCls = "text-[12px] font-black text-text-secondary uppercase tracking-widest mb-2 block pl-1";
          const iconCls = "absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-[18px] h-[18px] transition-colors group-focus-within:text-blue-500";

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/75 backdrop-blur-md"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingReport(null);
                }}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-3xl bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
              >
                {/* Header */}
                <div className="shrink-0 bg-bg-secondary/95 backdrop-blur-md border-b border-border-muted/50 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600/10 text-blue-500">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-text-primary tracking-tight">
                        {editingReport ? 'Edit Lab Order' : 'New Lab Order'}
                      </h2>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {editingReport ? 'Modify existing sample details or category' : 'Register a new sample for clinical testing'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingReport(null);
                    }} 
                    className="p-2 rounded-lg hover:bg-surface-variant text-text-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <form id="lab-order-form" onSubmit={handleCreateOrder} className="space-y-6">
                    
                    {/* Section 1: Patient Details */}
                    <div className="bg-bg-primary/20 backdrop-blur-xl border border-border-muted/30 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-[14px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                        <span className="w-6 h-[2px] rounded-full bg-blue-500"></span>
                        Patient Details
                      </h3>

                      {/* Patient Name */}
                      <div className="group relative">
                        <label className={labelCls}>
                          Patient Full Name *
                        </label>
                        <div className="relative">
                          <User className={iconCls} />
                          <input
                            required
                            type="text"
                            placeholder="e.g. Rahul Sharma"
                            className={inputCls}
                            value={formData.patientName}
                            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="group relative">
                        <label className={labelCls}>
                          Phone Number (Optional)
                        </label>
                        <div className="relative">
                          <Phone className={iconCls} />
                          <input
                            type="tel"
                            placeholder="e.g. +91 98765 43210"
                            className={inputCls}
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Order & Test Details */}
                    <div className="bg-bg-primary/20 backdrop-blur-xl border border-border-muted/30 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-[14px] font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                        <span className="w-6 h-[2px] rounded-full bg-blue-500"></span>
                        Order & Test Details
                      </h3>

                      {/* Test Category & Sample ID Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="group relative">
                          <label className={labelCls}>
                            Test Category *
                          </label>
                          <div className="relative">
                            <Beaker className={`${iconCls} pointer-events-none`} />
                            <input
                              required
                              type="text"
                              placeholder="e.g. CBC, HbA1c, Urine"
                              className={inputCls}
                              value={formData.testType}
                              onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="group relative">
                          <label className={labelCls}>
                            Sample ID *
                          </label>
                          <div className="relative">
                            <FlaskConical className={iconCls} />
                            <input
                              required
                              type="text"
                              placeholder="e.g. SAM-101"
                              className={inputCls}
                              value={formData.sampleId}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (!val.startsWith("SAM-")) {
                                  if ("SAM-".startsWith(val)) {
                                    val = "SAM-";
                                  } else {
                                    val = "SAM-" + val.replace(/^SAM-?/i, "");
                                  }
                                }
                                setFormData({ ...formData, sampleId: val });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Doctor Assignment */}
                      <div className="group relative mt-4">
                        <label className={labelCls}>
                          Assign Doctor (Optional)
                        </label>
                        <div className="relative">
                          <User className={iconCls} />
                          <select
                            className={inputCls}
                            value={formData.doctorName}
                            onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                          >
                            <option value="">Select Doctor (Not Assigned)</option>
                            {doctors.map((doc) => (
                              <option key={doc._id} value={doc.name}>
                                {doc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                  </form>
                </div>

                {/* Footer Buttons */}
                <div className="shrink-0 px-6 py-5 border-t border-border-muted/50 bg-bg-secondary flex items-center gap-3">
                  {editingReport && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        handleDeleteOrder(editingReport._id);
                      }}
                      className="px-4 h-[50px] rounded-xl bg-red-600/10 border border-red-600/20 text-red-400 font-bold text-[14px] hover:bg-red-600/20 flex items-center gap-2 transition-all active:scale-[0.98] mr-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}

                  <button 
                    type="button" 
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingReport(null);
                    }} 
                    className="w-[100px] h-[50px] rounded-xl bg-bg-primary border border-border-muted/50 text-[14px] font-bold text-text-secondary hover:text-text-primary hover:bg-surface-variant transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="lab-order-form"
                    disabled={isSubmitting}
                    className="flex-1 h-[50px] rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[14px] shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {isSubmitting ? 'SAVING...' : (editingReport ? 'SAVE CHANGES' : 'GENERATE LAB ORDER')}
                  </button>
                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </Layout>
  );
}
