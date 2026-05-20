import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Plus, Download, Eye, Filter, Calendar, 
  TrendingUp, AlertCircle, CheckCircle2, Clock,
  Search, X, IndianRupee, User, Phone, FileText
} from 'lucide-react';
import { useBillingStore } from '../store/billingStore';
import { useFacilityStore } from '../store/facilityStore';
import { getFacilityConfig } from '../utils/facilityTypeConfig';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import AnimatePage from '../components/AnimatePage';

// Helper to convert hex to RGB string for use with opacity in inline styles
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
}

// Skeleton Loader Component
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-[120px] rounded-2xl bg-bg-secondary border border-border-muted/50 dark:border-white/5 p-5 flex items-center justify-between animate-pulse">
        <div className="space-y-3 flex-1">
          <div className="h-3 bg-border-muted rounded w-1/3" />
          <div className="h-8 bg-border-muted rounded w-1/2" />
          <div className="h-3 bg-border-muted rounded w-1/4" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-border-muted" />
      </div>
    ))}
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-[76px] rounded-xl bg-bg-secondary border border-border-muted/30 dark:border-white/5 p-4 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-8 h-8 rounded-full bg-border-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-border-muted rounded w-1/4" />
            <div className="h-3 bg-border-muted rounded w-1/6" />
          </div>
        </div>
        <div className="w-24 h-6 rounded bg-border-muted" />
      </div>
    ))}
  </div>
);

// Empty State Component
const EmptyState = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <motion.div 
      animate={{ y: [0, -10, 0] }} 
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      className="w-16 h-16 bg-bg-primary border-2 border-dashed border-border-muted/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
    >
      <span className="material-symbols-outlined text-3xl text-text-secondary/30">receipt</span>
    </motion.div>
    <h3 className="text-text-primary font-black uppercase tracking-widest">No Invoices Yet</h3>
    <p className="text-text-secondary text-xs mt-1 uppercase tracking-widest font-medium max-w-sm">
      Start by creating your first invoice. Click the "Create Invoice" button to begin.
    </p>
  </motion.div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStyle = (status) => {
    switch (status) {
      case 'Paid': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Overdue': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-text-secondary bg-surface-variant border-border-muted/50';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest border ${getStyle(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse"></span>
      {status.toUpperCase()}
    </span>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtext, icon, config, trend }) => {
  const primaryRgb = hexToRgb(config.theme.primary);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl p-5 bg-bg-secondary border border-border-muted/50 dark:border-white/5 hover:shadow-lg transition-all duration-300 group shadow-sm"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${config.theme.primary}50`;
        e.currentTarget.style.boxShadow = `0 8px 30px rgba(${primaryRgb}, 0.08)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div 
        className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] opacity-10 group-hover:opacity-25 transition-opacity duration-500" 
        style={{ backgroundColor: config.theme.primary }}
      />
      
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">{title}</p>
          <h3 className="text-[32px] font-black text-text-primary tracking-tight leading-none mt-1">₹{value.toLocaleString('en-IN')}</h3>
          {subtext && (
            <div className="text-[10px] mt-3 font-black inline-flex px-2.5 py-1 rounded-full uppercase tracking-widest" 
                 style={{ 
                   color: trend ? '#10B981' : config.theme.primary, 
                   backgroundColor: trend ? 'rgba(16, 185, 129, 0.1)' : `rgba(${primaryRgb}, 0.1)` 
                 }}>
              {subtext}
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)` }}>
          <span className="material-symbols-outlined text-2xl animate-pulse" style={{ color: config.theme.primary }}>{icon}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Create Invoice Modal
const CreateInvoiceModal = ({ isOpen, onClose, onSuccess, config }) => {
  const { createInvoice, loading } = useBillingStore();
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    amount: '',
    status: 'Pending',
    description: ''
  });

  const primaryRgb = hexToRgb(config.theme.primary);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInvoice({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success('Invoice created successfully! 🎉');
      onSuccess();
      onClose();
      setFormData({ patientName: '', phone: '', amount: '', status: 'Pending', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-bg-primary/95 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Wrapper */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-3xl shadow-2xl overflow-hidden"
        >
          {loading && (
            <div className="loading-overlay rounded-3xl">
              <div 
                className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" 
                style={{ borderColor: `rgba(${primaryRgb}, 0.2)`, borderTopColor: config.theme.primary }}
              />
            </div>
          )}

          {/* Header */}
          <div className="p-8 border-b border-border-muted/30 dark:border-white/5 flex justify-between items-center bg-bg-primary/30">
            <div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">Create New Invoice</h2>
              <p className="text-text-secondary text-xs mt-1">Generate a billing invoice for patient consultation</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-bg-primary flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              
              {/* Patient Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Patient Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                  <input
                    type="text"
                    required
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-[var(--theme-primary)] transition-all shadow-inner placeholder:text-text-secondary/30"
                    placeholder="e.g. Rahul Sharma"
                    style={{ '--theme-primary': config.theme.primary }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-[var(--theme-primary)] transition-all shadow-inner placeholder:text-text-secondary/30"
                    placeholder="e.g. +91 9876543210"
                    style={{ '--theme-primary': config.theme.primary }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-[var(--theme-primary)] transition-all shadow-inner placeholder:text-text-secondary/30"
                      placeholder="0.00"
                      style={{ '--theme-primary': config.theme.primary }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Status</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-4 pl-12 pr-8 text-sm text-text-primary focus:outline-none focus:border-[var(--theme-primary)] transition-all shadow-inner appearance-none cursor-pointer billing-select"
                      style={{ '--theme-primary': config.theme.primary }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest ml-1">Description</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-4 h-4 text-text-secondary/50" />
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-[var(--theme-primary)] transition-all shadow-inner placeholder:text-text-secondary/30 resize-none"
                    placeholder="Add notes about this invoice..."
                    style={{ '--theme-primary': config.theme.primary }}
                  />
                </div>
              </div>

            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-[54px] border border-border-muted rounded-2xl text-text-primary hover:bg-surface-variant font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-[54px] rounded-2xl text-white font-black text-sm transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: config.theme.primary,
                  boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
                }}
              >
                {loading ? 'CREATING...' : 'CREATE INVOICE'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Main Billing Page
export default function Billing() {
  const { invoices, stats, loading, fetchInvoices, fetchStats, currentPage, totalPages, initSocket } = useBillingStore();
  const { facilityType } = useFacilityStore();
  const config = getFacilityConfig(facilityType);
  const primaryRgb = hexToRgb(config.theme.primary);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    initSocket(); // Listen to real-time billing updates
  }, []);

  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter]);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchInvoices(currentPage, { status: statusFilter }),
        fetchStats()
      ]);
    } catch (error) {
      toast.error('Failed to load billing data');
    }
  };

  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      await useBillingStore.getState().updateStatus(invoiceId, newStatus);
      toast.success(`Invoice marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Search filter
  const filteredInvoices = invoices.filter(invoice => 
    invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <AnimatePage className="space-y-6 max-w-7xl mx-auto w-full pb-32">
        <div className="space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{ 
                  backgroundColor: `rgba(${primaryRgb}, 0.1)`, 
                  color: config.theme.primary, 
                  borderColor: `rgba(${primaryRgb}, 0.25)` 
                }}
              >
                <span className="material-symbols-outlined text-2xl">payments</span>
              </div>
              <div>
                <h1 className="text-[28px] md:text-[32px] font-black text-text-primary tracking-tight leading-none">
                  Billing & Invoices
                </h1>
                <p className="text-[14px] text-text-secondary mt-2">Manage patient payments and financial records</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="px-5 h-[46px] rounded-xl bg-bg-secondary border border-border-muted/50 dark:border-white/5 text-text-secondary hover:text-text-primary font-bold text-[13px] hover:bg-surface-variant/30 transition flex items-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-[18px]">download</span> Export
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-6 h-[46px] rounded-xl text-white font-bold text-[14px] active:scale-[0.98] transition flex items-center gap-2"
                style={{
                  backgroundColor: config.theme.primary,
                  boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
                }}
              >
                <span className="material-symbols-outlined text-[20px]">add</span> Create Invoice
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {loading && invoices.length === 0 ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Revenue"
                value={stats.totalRevenue || 0}
                subtext="Across all invoices"
                icon="trending_up"
                config={config}
                trend={true}
              />
              <StatCard
                title="Pending Payments"
                value={stats.pendingPayments || 0}
                subtext={`Across ${stats.pendingCount || 0} invoices`}
                icon="hourglass_top"
                config={config}
                trend={false}
              />
              <StatCard
                title="Paid Today"
                value={stats.paidToday || 0}
                subtext={`From ${stats.paidTodayCount || 0} transactions`}
                icon="account_balance_wallet"
                config={config}
                trend={false}
              />
            </div>
          )}

          {/* Filters */}
          <div className="bg-bg-secondary p-4 rounded-2xl border border-border-muted/50 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center shadow-sm">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name or invoice ID..."
                className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-[var(--theme-primary)] transition-all placeholder:text-text-secondary/50 shadow-inner"
                style={{ '--theme-primary': config.theme.primary }}
              />
            </div>
            
            <div className="relative w-full md:w-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">filter_list</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-48 bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 pl-10 pr-8 text-sm text-text-primary focus:outline-none appearance-none cursor-pointer billing-select"
              >
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Invoices Table Card */}
          <div className="bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border-muted/50 dark:border-white/5 bg-surface-variant/30 flex items-center justify-between">
              <h2 className="text-[14px] font-black text-text-primary uppercase tracking-[0.15em] flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: config.theme.primary }}>receipt_long</span>
                Recent Invoices
              </h2>
            </div>

            <div className="p-6">
              {loading && invoices.length === 0 ? (
                <TableSkeleton />
              ) : filteredInvoices.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg-primary/50 text-text-secondary text-[11px] uppercase tracking-[0.2em] font-black border-b border-border-muted/50 dark:border-white/5">
                        <th className="px-6 py-5">Invoice ID</th>
                        <th className="px-6 py-5">Patient</th>
                        <th className="px-6 py-5">Date</th>
                        <th className="px-6 py-5">Amount</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-muted/30">
                      {filteredInvoices.map((invoice, index) => (
                        <motion.tr 
                          key={invoice._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-surface-variant/50 transition-colors group"
                        >
                          <td className="px-6 py-5">
                            <span className="font-mono text-xs font-bold text-primary-container bg-primary-container/5 px-2 py-1 rounded border border-primary-container/10">
                              {invoice.invoiceNumber}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                style={{
                                  background: `linear-gradient(135deg, ${config.theme.primary}, ${config.theme.secondary})`
                                }}
                              >
                                {invoice.patientName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-text-primary font-bold tracking-tight">{invoice.patientName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm text-text-secondary font-medium">
                            {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-5 text-sm font-bold text-text-primary">₹{invoice.amount.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-5">
                            <StatusBadge status={invoice.status} />
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => handleStatusUpdate(invoice._id, invoice.status === 'Paid' ? 'Pending' : 'Paid')}
                                className="p-2 hover:bg-surface-variant rounded-lg transition-colors text-text-secondary hover:text-text-primary"
                                title={invoice.status === 'Paid' ? 'Mark as Pending' : 'Mark as Paid'}
                              >
                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                              </button>
                              <button className="p-2 hover:bg-surface-variant rounded-lg transition-colors text-text-secondary hover:text-text-primary">
                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-5 bg-bg-primary/30 border-t border-border-muted/50 dark:border-white/5">
                <span className="text-[12px] text-text-secondary font-medium">
                  Showing <span className="text-text-primary font-bold">{(currentPage - 1) * 10 + 1}</span> to{' '}
                  <span className="text-text-primary font-bold">{Math.min(currentPage * 10, invoices.length)}</span> of{' '}
                  <span className="text-text-primary font-bold">{invoices.length}</span> entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => useBillingStore.getState().fetchInvoices(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary text-xs font-bold hover:bg-bg-primary hover:text-text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-border-muted/50 dark:border-white/5 shadow-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => useBillingStore.getState().fetchInvoices(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary text-xs font-bold hover:bg-bg-primary hover:text-text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-border-muted/50 dark:border-white/5 shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Invoice Modal */}
        <CreateInvoiceModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData}
          config={config}
        />
      </AnimatePage>
    </Layout>
  );
}
