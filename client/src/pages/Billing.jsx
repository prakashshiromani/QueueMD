import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Billing = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { 
      label: 'Total Revenue', 
      value: '₹1,45,000', 
      trend: '+12.5% from last month', 
      icon: 'account_balance_wallet', 
      color: 'text-green-500', 
      bg: 'bg-green-500/10' 
    },
    { 
      label: 'Pending Payments', 
      value: '₹32,400', 
      trend: 'Across 14 invoices', 
      icon: 'assignment_late', 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-500/10' 
    },
    { 
      label: 'Paid Today', 
      value: '₹8,500', 
      trend: 'From 4 transactions', 
      icon: 'calendar_today', 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10' 
    },
  ];

  const invoices = [
    { id: 'INV-2041', patient: 'Rajesh Kumar', date: 'Oct 24, 2023', amount: '₹2,400', status: 'Paid', statusColor: 'text-green-400 bg-green-400/10 border-green-400/20' },
    { id: 'INV-2042', patient: 'Priya Sharma', date: 'Oct 24, 2023', amount: '₹1,200', status: 'Pending', statusColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
    { id: 'INV-2038', patient: 'Amit Mishra', date: 'Oct 21, 2023', amount: '₹5,600', status: 'Overdue', statusColor: 'text-red-400 bg-red-400/10 border-red-400/20' },
    { id: 'INV-2040', patient: 'Vikram Singh', date: 'Oct 23, 2023', amount: '₹800', status: 'Paid', statusColor: 'text-green-400 bg-green-400/10 border-green-400/20' },
  ];

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-text-primary tracking-tight">Billing & Invoices</h1>
            <p className="text-[14px] text-text-secondary mt-1">Manage patient payments and financial records.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 h-[44px] rounded-xl bg-bg-secondary border border-border-muted/50 text-text-primary font-bold text-[14px] hover:bg-surface-variant transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export
            </button>
            <button 
              onClick={() => navigate('/billing/create-invoice')}
              className="flex items-center gap-2 px-6 h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Create Invoice
            </button>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-bg-secondary p-4 rounded-xl border border-border-muted/50 flex items-center justify-between group cursor-pointer hover:border-primary-container/30 transition-all">
              <div>
                <div className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">{stat.label}</div>
                <div className="text-[28px] font-black text-text-primary mt-0.5">{stat.value}</div>
                <div className={`text-[11px] mt-1 font-medium ${stat.label === 'Total Revenue' ? 'text-green-500' : 'text-text-secondary'}`}>
                  {stat.trend}
                </div>
              </div>
              <div className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[20px] ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Invoices Section */}
        <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-border-muted/30 flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-text-primary">Recent Invoices</h3>
            <button className="flex items-center gap-2 text-[13px] font-bold text-text-secondary hover:text-text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filter
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-muted bg-surface-variant/50">
                  <th className="px-6 py-4 text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">ID</th>
                  <th className="px-6 py-4 text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">Patient</th>
                  <th className="px-6 py-4 text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">Date</th>
                  <th className="px-6 py-4 text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">Amount</th>
                  <th className="px-6 py-4 text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/30">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-variant/20 transition-colors group">
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-bold text-text-primary tracking-tight">{inv.id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center overflow-hidden border border-border-muted/30">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${inv.patient}`} alt="" />
                        </div>
                        <span className="text-[14px] font-bold text-text-primary">{inv.patient}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[14px] text-text-secondary font-medium">{inv.date}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[14px] text-text-primary font-bold">{inv.amount}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest border ${inv.statusColor}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border-muted/50 flex items-center justify-between bg-surface-variant/10">
            <div className="text-[13px] text-text-secondary font-medium">
              Showing <span className="text-text-primary font-bold">1 to 4</span> of <span className="text-text-primary font-bold">42</span> entries
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 rounded-lg border border-border-muted/50 text-[12px] font-bold text-text-secondary hover:text-text-primary disabled:opacity-30" disabled>
                Prev
              </button>
              <button className="px-4 py-2 rounded-lg border border-border-muted/50 text-[12px] font-bold text-text-secondary hover:text-text-primary">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Billing;
