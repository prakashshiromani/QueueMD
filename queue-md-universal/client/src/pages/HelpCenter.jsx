import React from 'react';
import Layout from '../components/Layout';

const HelpCenter = () => {
  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      desc: 'Basic setup, account creation, and introductory tutorials for new users.',
      icon: 'rocket_launch',
      color: 'from-blue-500/20 to-blue-600/5'
    },
    {
      id: 'billing',
      title: 'Billing & Payments',
      desc: 'Invoices, subscription management, and patient billing workflows.',
      icon: 'payments',
      color: 'from-emerald-500/20 to-emerald-600/5'
    },
    {
      id: 'facility',
      title: 'Facility Configuration',
      desc: 'Queue logic, multi-location setup, and custom routing rules.',
      icon: 'domain',
      color: 'from-purple-500/20 to-purple-600/5'
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      desc: 'Common errors, connectivity issues, and hardware integration guides.',
      icon: 'build',
      color: 'from-orange-500/20 to-orange-600/5'
    }
  ];

  const popularArticles = [
    'How to reset a patient\'s queue position',
    'Configuring multi-specialty triage rules',
    'Understanding API rate limits for Webhooks',
    'Setting up automated SMS notifications'
  ];

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar (Desktop Only) */}
        <div className="hidden lg:flex flex-col w-64 flex-shrink-0 space-y-2">
          <div className="px-4 py-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">auto_stories</span>
            <span className="text-[13px] font-black uppercase tracking-widest">Knowledge Base</span>
          </div>
          {[
            { label: 'My Tickets', icon: 'confirmation_number' },
            { label: 'API Docs', icon: 'code' },
            { label: 'System Status', icon: 'cloud_done' },
            { label: 'Community', icon: 'groups' },
          ].map(item => (
            <button key={item.label} className="px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-xl flex items-center gap-3 transition-all">
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[13px] font-bold">{item.label}</span>
            </button>
          ))}
          <div className="pt-8 mt-auto">
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[13px] uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
              Open New Ticket
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-12">
          {/* Search Section */}
          <div className="text-center space-y-6 pt-8">
            <h1 className="text-[36px] md:text-[44px] font-black text-text-primary tracking-tight leading-none">How can we help you today?</h1>
            <p className="text-[16px] text-text-secondary max-w-2xl mx-auto opacity-70">Search our knowledge base for quick answers, guides, and troubleshooting steps.</p>

            <div className="relative max-w-2xl mx-auto group">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary opacity-50 group-focus-within:opacity-100 transition-opacity">search</span>
              <input
                type="text"
                placeholder="Search for articles, features, or error codes..."
                className="w-full h-16 bg-bg-secondary/50 backdrop-blur-md border border-white/10 rounded-2xl pl-14 pr-32 text-[15px] text-text-primary outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-xl"
              />
              <button className="absolute right-3 top-3 bottom-3 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[14px] transition-all">
                Search
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-400">grid_view</span>
              <h2 className="text-[18px] font-black text-text-primary uppercase tracking-widest">Browse by Category</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className={`group bg-bg-secondary/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cat.color} rounded-bl-[100px] -mr-8 -mt-8 opacity-50`}></div>
                  <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-primary group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined">{cat.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-[16px] font-black text-text-primary">{cat.title}</h3>
                      <p className="text-[13px] text-text-secondary mt-1 leading-relaxed opacity-70">{cat.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Articles */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-400">trending_up</span>
                <h2 className="text-[18px] font-black text-text-primary uppercase tracking-widest">Popular Articles</h2>
              </div>
              <button className="text-blue-400 text-[13px] font-bold flex items-center gap-1 hover:underline">
                View all <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
            <div className="bg-bg-secondary/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
              {popularArticles.map((article, i) => (
                <button key={i} className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-text-secondary opacity-50">description</span>
                    <span className="text-[14px] font-bold text-text-primary group-hover:text-blue-400 transition-colors">{article}</span>
                  </div>
                  <span className="material-symbols-outlined text-text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2 border border-white/20">
              <span className="material-symbols-outlined text-white text-[32px]">support_agent</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-[20px] font-black text-white">Still need help?</h3>
              <p className="text-[13px] text-white/70 leading-relaxed">Our enterprise support team is available 24/7 for urgent clinical workflow issues.</p>
            </div>
            <div className="space-y-3 pt-2">
              <button className="w-full h-12 bg-white text-blue-600 rounded-xl font-black text-[13px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">chat</span>
                Start Live Chat
              </button>
              <button className="w-full h-12 bg-white/10 border border-white/20 text-white rounded-xl font-black text-[13px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                Email Support
              </button>
            </div>
          </div>

          <div className="bg-bg-secondary/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[13px] font-bold text-text-primary">All Systems Operational</span>
            </div>
            <p className="text-[11px] text-text-secondary opacity-60">Last updated 2 mins ago</p>
            <button className="text-blue-400 text-[11px] font-black uppercase tracking-widest hover:underline">Status Page</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HelpCenter;
