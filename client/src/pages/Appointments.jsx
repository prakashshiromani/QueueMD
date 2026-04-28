import React, { useState } from 'react';
import Layout from '../components/Layout';

const Appointments = () => {
  const [view, setView] = useState('Month');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    doctor: '',
    date: '2023-10-10',
    time: '09:00',
    category: 'General'
  });

  const doctors = [
    { id: 'STF-1042', name: 'Dr. Sarah Jenkins' },
    { id: 'STF-2015', name: 'Dr. Michael Chen' },
  ];

  const categories = ['General', 'Dental', 'Pathology', 'Physiotherapy'];

  const calendarDays = [
    { day: 1, type: 'past' }, { day: 2, type: 'past' }, { day: 3, type: 'past' }, { day: 4, type: 'current' },
    { day: 5, type: 'current', events: ['general'] }, { day: 6, type: 'current' }, { day: 7, type: 'current' },
    { day: 8, type: 'current' }, { day: 9, type: 'current' },
    { day: 10, type: 'current', active: true, events: ['general', 'dental', 'pathology'] },
    { day: 11, type: 'current' }, { day: 12, type: 'current', events: ['dental'] }, { day: 13, type: 'current' }, { day: 14, type: 'current' },
    { day: 15, type: 'current' }, { day: 16, type: 'current' }, { day: 17, type: 'current' }, { day: 18, type: 'current' }, { day: 19, type: 'current' }, { day: 20, type: 'current' }, { day: 21, type: 'current' },
    { day: 22, type: 'current' }, { day: 23, type: 'current' }, { day: 24, type: 'current' }, { day: 25, type: 'current' }, { day: 26, type: 'current' }, { day: 27, type: 'current' }, { day: 28, type: 'current' },
    { day: 29, type: 'current' }, { day: 30, type: 'current' }, { day: 31, type: 'current' }, { day: 1, type: 'next' }, { day: 2, type: 'next' }, { day: 3, type: 'next' }, { day: 4, type: 'next' }
  ];

  const dailySchedule = [
    {
      id: 1,
      name: 'Sarah Jenkins',
      time: '09:00 AM',
      token: 'TKN-842',
      category: 'General',
      color: 'border-l-blue-500',
      tagColor: 'bg-blue-400/10 text-blue-400',
      action: 'Check-in'
    },
    {
      id: 2,
      name: 'Michael Chang',
      time: '10:30 AM',
      token: 'TKN-845',
      category: 'Dental',
      color: 'border-l-pink-500',
      tagColor: 'bg-pink-400/10 text-pink-400',
      status: 'In Room 2',
      statusColor: 'text-blue-400'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      time: '11:30 AM',
      token: 'TKN-851',
      category: 'Pathology',
      color: 'border-l-purple-500',
      tagColor: 'bg-purple-400/10 text-purple-400',
      action: 'Check-in'
    },
    {
      id: 4,
      name: 'David Kim',
      time: '02:00 PM',
      token: 'TKN-863',
      category: 'General',
      color: 'border-l-blue-500',
      tagColor: 'bg-blue-400/10 text-blue-400',
      action: 'Check-in'
    }
  ];

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-[28px] font-bold text-text-primary tracking-tight">Appointments Management</h1>
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="bg-white/5 backdrop-blur-md p-1 rounded-xl border border-white/10 flex h-[46px] shadow-inner">
              {['Month', 'Week', 'Day'].map(v => (
                <button 
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-6 rounded-lg text-[14px] font-bold transition-all duration-200 h-full ${
                    view === v 
                      ? 'bg-bg-secondary text-text-primary shadow-lg border border-white/10' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Date Picker Button */}
            <button className="flex items-center gap-3 px-5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-text-primary font-bold text-[14px] hover:bg-bg-secondary transition-all group h-[46px] shadow-sm">
              <span className="material-symbols-outlined text-[20px] text-text-secondary group-hover:text-text-primary">calendar_today</span>
              <span className="text-[14px]">October 2023</span>
              <span className="material-symbols-outlined text-[20px] text-text-secondary ml-1">expand_more</span>
            </button>

            {/* New Appointment Button */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-6 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-[14px] shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)] transition-all active:scale-[0.97] group h-[46px]"
            >
              <span className="material-symbols-outlined text-[20px] font-bold group-hover:rotate-90 transition-transform duration-300">add</span>
              New Appointment
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Calendar View (Left) */}
          <div className="lg:col-span-8 bg-bg-secondary rounded-2xl border border-border-muted overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border-muted bg-surface-variant/20">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="py-4 text-center text-[11px] font-black tracking-widest text-text-secondary">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-collapse">
              {calendarDays.map((d, idx) => (
                <div
                  key={idx}
                  className={`min-h-[100px] p-2 border-r border-b border-border-muted transition-colors ${d.type !== 'current' ? 'bg-bg-primary/30' : 'hover:bg-surface-variant/20'
                    } ${d.active ? 'ring-2 ring-inset ring-primary-container z-10' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[13px] font-bold ${d.active ? 'bg-primary-container text-white w-6 h-6 rounded-full flex items-center justify-center' :
                        d.type === 'current' ? 'text-text-primary' : 'text-text-secondary/50'
                      }`}>
                      {d.day}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {d.events?.map((e, i) => (
                      <div key={i} className={`h-1.5 rounded-full w-full ${e === 'general' ? 'bg-blue-500' : e === 'dental' ? 'bg-pink-500' : 'bg-purple-500'
                        }`}></div>
                    ))}
                    {d.active && (
                      <div className="mt-1 space-y-1">
                        <div className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded truncate font-bold">09:00 - ...</div>
                        <div className="text-[10px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded truncate font-bold">11:30 - ...</div>
                        <div className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded truncate font-bold">14:00 - ...</div>
                        <div className="text-[9px] text-text-secondary font-bold pl-1">+2 more</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="px-6 py-4 flex items-center gap-6 border-t border-border-muted bg-surface-variant/5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-[12px] font-bold text-text-secondary">General</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                <span className="text-[12px] font-bold text-text-secondary">Dental</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-[12px] font-bold text-text-secondary">Pathology</span>
              </div>
            </div>
          </div>

          {/* Daily Schedule (Right) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-bg-secondary rounded-2xl border border-border-muted p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-[18px] font-bold text-text-primary">Daily Schedule</h3>
                <p className="text-[13px] text-text-secondary">Tuesday, October 10th</p>
              </div>

              <div className="space-y-4">
                {dailySchedule.map(item => (
                  <div key={item.id} className={`p-4 bg-surface-variant/20 rounded-xl border-l-4 ${item.color} relative group cursor-pointer hover:bg-surface-variant/40 transition-all`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0">
                        <h4 className="text-[15px] font-bold text-text-primary truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 text-text-secondary mt-1">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          <span className="text-[12px] font-medium">{item.time}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${item.tagColor}`}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-muted/50">
                      <span className="text-[11px] font-black bg-bg-primary/50 px-2 py-0.5 rounded text-text-primary">{item.token}</span>
                      {item.action ? (
                        <button className="text-[12px] font-bold text-text-secondary hover:text-text-primary bg-surface-variant/50 px-3 py-1 rounded transition-colors">
                          {item.action}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                          <span className={`text-[12px] font-bold ${item.statusColor}`}>{item.status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-bg-primary/40 rounded-xl p-4 border border-border-muted text-center">
                  <div className="text-[12px] font-bold text-text-secondary uppercase tracking-widest mb-1">Remaining</div>
                  <div className="text-[24px] font-black text-text-primary">12</div>
                </div>
                <div className="bg-bg-primary/40 rounded-xl p-4 border border-border-muted text-center">
                  <div className="text-[12px] font-bold text-text-secondary uppercase tracking-widest mb-1">Completed</div>
                  <div className="text-[24px] font-black text-status-success">24</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Add Appointment Modal */}
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
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">event_available</span>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-text-primary leading-tight">New Appointment</h2>
                  <p className="text-[12px] text-text-secondary">Schedule a visit for a patient</p>
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-inner backdrop-blur-md"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Assign Doctor</label>
                <div className="relative">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary appearance-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-inner backdrop-blur-md cursor-pointer"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-inner backdrop-blur-md"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Time</label>
                  <input 
                    type="time" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[14px] text-text-primary focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-inner backdrop-blur-md"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest block ml-1">Category</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setFormData({...formData, category: cat})}
                      className={`px-4 py-2 rounded-full text-[12px] font-bold border transition-all ${
                        formData.category === cat 
                          ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20' 
                          : 'bg-white/5 border-white/10 text-text-secondary hover:text-text-primary hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-white/5">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-[14px] py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                CONFIRM APPOINTMENT
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Appointments;
