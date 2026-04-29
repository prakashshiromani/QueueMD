import React, { useState } from 'react';
import Layout from '../components/Layout';

const LabReports = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    testType: '',
    sampleId: '',
    priority: 'Normal',
    doctor: '',
    date: '2023-10-24',
    time: '09:00',
    status: 'Pending'
  });

  const doctors = [
    { id: 'STF-1042', name: 'Dr. Sarah Jenkins' },
    { id: 'STF-2015', name: 'Dr. Michael Chen' },
  ];

  const testTypes = ['CBC', 'Lipid Profile', 'Thyroid Panel', 'HbA1c', 'Liver Function Test', 'Kidney Function Test'];

  const stats = [
    { label: 'Pending Samples', value: '24', icon: 'inventory_2', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Processing', value: '18', icon: 'biotech', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Results Ready', value: '42', icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  const reports = [
    {
      id: 'SMP-8821',
      name: 'John Smith',
      initials: 'JS',
      test: 'Complete Blood Count (CBC)',
      dateTime: 'Oct 24, 2023 | 09:15 AM',
      status: 'Ready',
      statusColor: 'text-green-400 bg-green-400/10 border-green-400/20',
      accentColor: 'bg-green-500'
    },
    {
      id: 'SMP-8822',
      name: 'Maria Johnson',
      initials: 'MJ',
      test: 'Lipid Profile',
      dateTime: 'Oct 24, 2023 | 10:30 AM',
      status: 'Processing',
      statusColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      accentColor: 'bg-blue-500'
    },
    {
      id: 'SMP-8823',
      name: 'Robert Davis',
      initials: 'RD',
      test: 'Thyroid Panel (TSH, FT4)',
      dateTime: 'Oct 24, 2023 | 11:45 AM',
      status: 'Pending',
      statusColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      accentColor: 'bg-yellow-500'
    },
    {
      id: 'SMP-8824',
      name: 'Emily Wilson',
      initials: 'EW',
      test: 'HbA1c',
      dateTime: 'Oct 23, 2023 | 02:10 PM',
      status: 'Ready',
      statusColor: 'text-green-400 bg-green-400/10 border-green-400/20',
      accentColor: 'bg-green-500'
    }
  ];

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-black text-text-primary tracking-tight">Lab Reports</h1>
            <p className="text-[14px] text-text-secondary mt-1">Manage and track patient test results</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 h-[46px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Lab Order
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-bg-secondary p-4 rounded-xl border border-border-muted/50 flex items-center justify-between group cursor-pointer hover:border-primary-container/30 transition-all">
              <div>
                <div className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">{stat.label}</div>
                <div className="text-[28px] font-black text-text-primary mt-0">{stat.value}</div>
              </div>
              <div className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-[20px] ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-bg-secondary/80 p-4 rounded-xl border border-border-muted/50 flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">search</span>
            <input 
              type="text"
              placeholder="Search by Patient Name or Sample ID..."
              className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-[14px] text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-container shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-text-secondary font-bold text-[13px] hover:text-text-primary hover:bg-white/10 transition-all flex-1 lg:min-w-[140px] shadow-sm">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              Today
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-text-secondary font-bold text-[13px] hover:text-text-primary hover:bg-white/10 transition-all flex-1 lg:min-w-[140px] shadow-sm">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              All Statuses
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-muted bg-surface-variant/50">
                  <th className="px-6 py-4 text-[12px] font-black text-text-secondary uppercase tracking-[0.1em]">Sample ID</th>
                  <th className="px-6 py-4 text-[12px] font-black text-text-secondary uppercase tracking-[0.1em]">Patient Name</th>
                  <th className="px-6 py-4 text-[12px] font-black text-text-secondary uppercase tracking-[0.1em]">Test Type</th>
                  <th className="px-6 py-4 text-[12px] font-black text-text-secondary uppercase tracking-[0.1em]">Date & Time</th>
                  <th className="px-6 py-4 text-[12px] font-black text-text-secondary uppercase tracking-[0.1em]">Status</th>
                  <th className="px-6 py-4 text-[12px] font-black text-text-secondary uppercase tracking-[0.1em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/30">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-[#1a1d21]/30 transition-colors group relative">
                    <td className="px-6 py-5 relative">
                      {/* Left Accent Border */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${report.accentColor}`}></div>
                      <span className="text-[14px] font-bold text-text-primary tracking-tight">{report.id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-[11px] font-black text-text-secondary border border-border-muted/30">
                          {report.initials}
                        </div>
                        <span className="text-[15px] font-bold text-text-primary">{report.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[14px] text-text-secondary font-medium">{report.test}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[13px] text-text-primary font-bold">{report.dateTime.split(' | ')[0]}</div>
                      <div className="text-[11px] text-text-secondary uppercase tracking-wider">{report.dateTime.split(' | ')[1]}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest border ${report.statusColor}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {report.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border-muted/50 flex items-center justify-between bg-surface-variant/20">
            <div className="text-[13px] text-text-secondary font-medium">
              Showing <span className="text-text-primary font-bold">1 to 4</span> of <span className="text-text-primary font-bold">84</span> results
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-border-muted/50 text-text-secondary hover:text-text-primary disabled:opacity-30" disabled>
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map(n => (
                  <button key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold ${n === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-text-secondary hover:bg-surface-variant'}`}>
                    {n}
                  </button>
                ))}
                <span className="text-text-secondary px-1">...</span>
              </div>
              <button className="p-2 rounded-lg border border-border-muted/50 text-text-secondary hover:text-text-primary">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Lab Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-bg-secondary border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">biotech</span>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-text-primary leading-tight">New Lab Order</h2>
                  <p className="text-[12px] text-text-secondary">Register a new sample for testing</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Patient Name</label>
                <input 
                  type="text" 
                  placeholder="Enter patient full name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-inner backdrop-blur-md"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Test Type</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary appearance-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-inner backdrop-blur-md cursor-pointer"
                      value={formData.testType}
                      onChange={(e) => setFormData({...formData, testType: e.target.value})}
                    >
                      <option value="" className="bg-bg-secondary text-text-secondary">Select test</option>
                      {testTypes.map(test => (
                        <option key={test} value={test} className="bg-bg-secondary text-text-primary">{test}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary/50">
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Sample ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. SMP-9900"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-inner backdrop-blur-md"
                    value={formData.sampleId}
                    onChange={(e) => setFormData({...formData, sampleId: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-inner backdrop-blur-md"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Time</label>
                  <input 
                    type="time" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-inner backdrop-blur-md"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Refering Doctor</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary appearance-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-inner backdrop-blur-md cursor-pointer"
                    value={formData.doctor}
                    onChange={(e) => setFormData({...formData, doctor: e.target.value})}
                  >
                    <option value="" className="bg-bg-secondary text-text-secondary">Select a doctor</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.name} className="bg-bg-secondary text-text-primary">{doc.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary/50">
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Initial Status</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary appearance-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all shadow-inner backdrop-blur-md cursor-pointer"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Pending" className="bg-bg-secondary text-text-primary">Pending</option>
                    <option value="Processing" className="bg-bg-secondary text-text-primary">Processing</option>
                    <option value="Ready" className="bg-bg-secondary text-text-primary">Ready</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary/50">
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Priority</label>
                <div className="flex gap-2 pt-1">
                  {['Normal', 'Urgent', 'Stat'].map(prio => (
                    <button 
                      key={prio}
                      onClick={() => setFormData({...formData, priority: prio})}
                      className={`px-6 py-2.5 rounded-xl text-[12px] font-bold border transition-all flex-1 ${
                        formData.priority === prio 
                          ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20' 
                          : 'bg-white/5 border-white/10 text-text-secondary hover:text-text-primary hover:bg-white/10'
                      }`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-white/5">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-[14px] py-3.5 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">science</span>
                GENERATE LAB ORDER
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LabReports;
