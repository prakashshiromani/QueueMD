import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Plus, Download, Eye, Filter, Calendar, 
  TrendingUp, AlertCircle, CheckCircle2, Clock,
  Search, X, IndianRupee
} from 'lucide-react';
import { useBillingStore } from '../store/billingStore';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import AnimatePage from '../components/AnimatePage';

// Skeleton Loader Component
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
    ))}
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
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
    <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
      <IndianRupee className="w-12 h-12 text-blue-400" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">No Invoices Yet</h3>
    <p className="text-gray-400 max-w-sm">
      Start by creating your first invoice. Click the "Create Invoice" button to begin.
    </p>
  </motion.div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    Paid: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
    Pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
    Overdue: { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: AlertCircle }
  };
  
  const { color, icon: Icon } = config[status] || config.Pending;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtext, icon: Icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl hover:border-white/20 transition-all duration-300 group"
  >
    <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${color} blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity`} />
    
    <div className="relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-1">₹{value.toLocaleString('en-IN')}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      {subtext && (
        <p className="text-gray-400 text-xs">
          {subtext}
          {trend && (
            <span className={`ml-2 ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </span>
          )}
        </p>
      )}
    </div>
  </motion.div>
);

// Create Invoice Modal
const CreateInvoiceModal = ({ isOpen, onClose, onSuccess }) => {
  const { createInvoice, loading } = useBillingStore();
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    amount: '',
    status: 'Pending',
    description: ''
  });

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Create New Invoice</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Patient Name *</label>
              <input
                type="text"
                required
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Enter patient name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                placeholder="Add notes about this invoice..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
              >
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Billing Page
export default function Billing() {
  const { invoices, stats, loading, fetchInvoices, fetchStats, currentPage, totalPages } = useBillingStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  return (
    <Layout>
      <AnimatePage className="space-y-6">
        <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } }
        }}
      />

      <div className="space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Billing & Invoices</h1>
            <p className="text-gray-400">Manage patient payments and financial records</p>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl text-white font-medium transition-all shadow-lg shadow-blue-600/25"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {loading && invoices.length === 0 ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Revenue"
              value={stats.totalRevenue || 0}
              subtext="Across all invoices"
              icon={TrendingUp}
              color="bg-emerald-500"
              trend={12.5}
            />
            <StatCard
              title="Pending Payments"
              value={stats.pendingPayments || 0}
              subtext={`Across ${stats.pendingCount || 0} invoices`}
              icon={Clock}
              color="bg-amber-500"
            />
            <StatCard
              title="Paid Today"
              value={stats.paidToday || 0}
              subtext={`From ${stats.paidTodayCount || 0} transactions`}
              icon={CheckCircle2}
              color="bg-blue-500"
            />
          </div>
        )}

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name or invoice ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </motion.div>

        {/* Invoices Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
          </div>

          <div className="p-6">
            {loading && invoices.length === 0 ? (
              <TableSkeleton />
            ) : invoices.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-white/10">
                      <th className="pb-3 text-sm font-medium text-gray-400">ID</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Patient</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Date</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Amount</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Status</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((invoice, index) => (
                      <motion.tr 
                        key={invoice._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 text-sm font-medium text-white">{invoice.invoiceNumber}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                              {invoice.patientName.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-300">{invoice.patientName}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-400">
                          {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-4 text-sm font-medium text-white">₹{invoice.amount.toLocaleString('en-IN')}</td>
                        <td className="py-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleStatusUpdate(invoice._id, invoice.status === 'Paid' ? 'Pending' : 'Paid')}
                              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                              title={invoice.status === 'Paid' ? 'Mark as Pending' : 'Mark as Paid'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white">
                              <Eye className="w-4 h-4" />
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <p className="text-sm text-gray-400">
                Showing <span className="font-medium text-white">{(currentPage - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium text-white">{Math.min(currentPage * 10, invoices.length)}</span> of{' '}
                <span className="font-medium text-white">{invoices.length}</span> entries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => useBillingStore.getState().fetchInvoices(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => useBillingStore.getState().fetchInvoices(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
      </AnimatePage>
    </Layout>
  );
}
