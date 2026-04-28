import React from 'react';
import Layout from '../components/Layout';

const Notifications = () => {
  const notifications = [
    {
      id: 1,
      title: 'New Appointment',
      message: 'Rajesh Kumar has scheduled a new appointment for tomorrow at 10:30 AM.',
      time: '2 mins ago',
      type: 'appointment',
      icon: 'calendar_today',
      color: 'bg-blue-500/10 text-blue-500',
      isNew: true,
    },
    {
      id: 2,
      title: 'Lab Report Ready',
      message: 'The blood test report for Priya Sharma is now available for review.',
      time: '15 mins ago',
      type: 'lab',
      icon: 'biotech',
      color: 'bg-green-500/10 text-green-500',
      isNew: true,
    },
    {
      id: 3,
      title: 'Payment Received',
      message: 'Invoice INV-2041 of ₹2,400 has been paid successfully.',
      time: '1 hour ago',
      type: 'billing',
      icon: 'payments',
      color: 'bg-teal-500/10 text-teal-500',
      isNew: false,
    },
    {
      id: 4,
      title: 'System Update',
      message: 'QueueMD has been updated to version 2.4.0 with new analytics features.',
      time: '5 hours ago',
      type: 'system',
      icon: 'settings',
      color: 'bg-purple-500/10 text-purple-500',
      isNew: false,
    },
  ];

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-text-primary tracking-tight">Notifications</h1>
            <p className="text-[14px] text-text-secondary mt-1">Stay updated with the latest activity in your facility.</p>
          </div>
          <button className="text-[13px] font-bold text-blue-500 hover:text-blue-400 transition-colors">
            Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-5 rounded-2xl border border-border-muted/50 flex items-start gap-5 transition-all cursor-pointer hover:bg-bg-secondary/50 group relative ${
                n.isNew ? 'bg-bg-secondary border-blue-500/30' : 'bg-transparent'
              }`}
            >
              {n.isNew && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
              )}
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${n.color}`}>
                <span className="material-symbols-outlined text-[24px]">{n.icon}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-[16px] font-bold ${n.isNew ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {n.title}
                  </h3>
                  <span className="text-[11px] font-medium text-text-secondary opacity-60">{n.time}</span>
                </div>
                <p className="text-[14px] text-text-secondary leading-relaxed line-clamp-2 group-hover:text-text-primary transition-colors">
                  {n.message}
                </p>
              </div>
              
              <button className="opacity-0 group-hover:opacity-100 p-2 text-text-secondary hover:text-red-500 transition-all">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center pt-4">
          <button className="px-6 py-3 rounded-xl border border-border-muted/50 text-[13px] font-bold text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-all">
            Load Older Notifications
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
