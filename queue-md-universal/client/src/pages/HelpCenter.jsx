import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { useFacilityStore } from '../store/facilityStore';
import { 
  fetchTicketsApi, 
  createTicketApi, 
  addTicketCommentApi, 
  fetchTicketDetailsApi, 
  updateTicketStatusApi 
} from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const HelpCenter = () => {
  const { user } = useAuthStore();
  const { facilityType } = useFacilityStore();
  const [activeTab, setActiveTab] = useState('knowledge-base');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Articles Data
  const articles = [
    {
      id: 'reset-queue',
      title: "How to reset a patient's queue position",
      category: 'facility',
      summary: 'Learn how to manually override queue positions and trigger re-numbering.',
      content: `To reset a patient's queue position or manually override the queue order, navigate to the Dashboard. Locate the patient in the Waiting Queue list. Currently, the list is sorted in ascending order of their token number. 

To override, click the action settings for the patient. You can complete them, or call next. If a patient is a no-show, the system automatically marks them as 'no-show' to preserve their record in the database while clearing the active screen. 

Estimated wait times for all subsequent patients in the active queue are automatically recalculated to maintain predictive accuracy based on the Exponential Moving Average (EMA) of recently served patients.`
    },
    {
      id: 'multi-specialty',
      title: 'Configuring multi-specialty triage rules',
      category: 'facility',
      summary: 'Setup isolation rules for Dental, Clinic, PathLab, and Physiotherapy.',
      content: `QueueMD supports multi-department isolation (Clinic, Dental, Pathlab, Physiotherapy, and Rehab) using Facility Types. 

Under the Dashboard preview switcher (only available in Demo Mode), or based on the logged-in user's default department, the backend isolates queue lists. For example:
- Dental queue calls are routed to dentists.
- Lab orders route to lab technician dashboards.
- Clinic visits route to doctors/physicians.

The isolation is handled in the backend controller by decoding the facilityId and facilityType from the JWT auth headers, ensuring complete cross-department security.`
    },
    {
      id: 'sms-alerts',
      title: 'Setting up automated SMS notifications',
      category: 'getting-started',
      summary: 'Toggle patient SMS alerts and custom template configurations.',
      content: `To enable automated SMS notifications for patients:
1. Navigate to Settings > Notifications.
2. Toggle the 'Enable SMS alerts' option to active.
3. Configure the SMS template (e.g., 'Dear {name}, your Token is #{token}. Estimated wait time is {time} mins. Please reach the clinic.').

SMS notifications are queued via BullMQ Redis worker (Phase 4) and sent using the integrated SMS gateway (Twilio/Jio). Note that numbers registered on DND/Jio networks might require DLT template registration.`
    },
    {
      id: 'razorpay-billing',
      title: 'Razorpay integration and billing upgrades',
      category: 'billing',
      summary: 'Process upgrades to the Pro subscription using Razorpay.',
      content: `QueueMD offers a premium Pro Plan (₹499/month or ₹4,999/year) to unlock multi-location support, SMS analytics, and custom themes.

To upgrade:
1. Navigate to Settings > Subscription.
2. Select your plan duration and click 'Upgrade to Pro'.
3. The Razorpay checkout modal will load.
4. Fill in your payment details. Once verified, the backend hooks automatically activate the Pro license.

If the system is running in Mock Mode (no Razorpay credentials in process.env), the upgrade will complete automatically for testing and verification.`
    },
    {
      id: 'webhook-limits',
      title: 'Understanding API rate limits for Webhooks',
      category: 'troubleshooting',
      summary: 'Examine rate limiting parameters for external clinic integrations.',
      content: `QueueMD exposes public webhooks for third-party EHR integrations.
- Rate limits are capped at 100 requests per minute per facility.
- Exceeding the rate limit will return an HTTP 429 Too Many Requests response.
- Webhook payloads send real-time token states (waiting, in-progress, completed, no-show) in JSON format.
- Secure webhook payloads by verifying signatures in headers against the Webhook Secret key generated in Developer settings.`
    },
    {
      id: 'staff-roles',
      title: 'Staff permissions and role setup',
      category: 'getting-started',
      summary: 'Learn about role-based access for Admins, Dentists, and Receptionists.',
      content: `Manage clinic security by assigning correct roles to your team members:
- Admin: Full access to settings, billing, subscriptions, and patient history.
- Receptionist: Authorized to add patients to the queue and manage basic details.
- Doctor / Dentist / Physiotherapist: Full control over calling the 'Next' patient and marking consultations as 'Complete'.
- Lab Technician: Dedicated access to upload reports, view sample lists, and update lab statuses.

Assign roles under Settings > Staff, where you can add staff emails to send invite links.`
    }
  ];

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      desc: 'Basic setup, account creation, and introductory tutorials for new users.',
      icon: 'rocket_launch',
      color: 'from-blue-500/20 to-blue-600/5 text-blue-400'
    },
    {
      id: 'billing',
      title: 'Billing & Payments',
      desc: 'Invoices, subscription management, and patient billing workflows.',
      icon: 'payments',
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400'
    },
    {
      id: 'facility',
      title: 'Facility Configuration',
      desc: 'Queue logic, multi-location setup, and custom routing rules.',
      icon: 'domain',
      color: 'from-purple-500/20 to-purple-600/5 text-purple-400'
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      desc: 'Common errors, connectivity issues, and hardware integration guides.',
      icon: 'build',
      color: 'from-orange-500/20 to-orange-600/5 text-orange-400'
    }
  ];

  // State Management
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: '👋 Hello! Main QueueMD Support Assistant hoon. Main aapki kya sahayata kar sakta hoon?', time: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  // New Ticket Form State
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'technical',
    priority: 'medium'
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // New Comment State
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // API Docs Keys
  const [apiKey, setApiKey] = useState('qmd_live_7a2f9b8c0d1e3f5a6b7c8d9e0f1a2b3c');
  const [isApiKeyRevealed, setIsApiKeyRevealed] = useState(false);

  // Fetch tickets from API
  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const ticketList = await fetchTicketsApi();
      setTickets(ticketList || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      toast.error('Tickets load karne mein samasya aayi.');
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-tickets') {
      loadTickets();
    }
  }, [activeTab]);

  // Load ticket detail when clicked
  const handleSelectTicket = async (ticketId) => {
    try {
      const details = await fetchTicketDetailsApi(ticketId);
      setSelectedTicket(details);
    } catch (err) {
      toast.error('Ticket details fetch karne mein failure.');
    }
  };

  // Open ticket form submission
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      return toast.error('Subject aur Description fill karna mandatory hai!');
    }
    setSubmittingTicket(true);
    try {
      const created = await createTicketApi(newTicket);
      toast.success('Ticket submitted successfully! 🔥');
      setTickets(prev => [created, ...prev]);
      setTicketModalOpen(false);
      setNewTicket({ subject: '', description: '', category: 'technical', priority: 'medium' });
      // Select the newly created ticket to view the bots auto comment
      setSelectedTicket(created);
    } catch (err) {
      toast.error('Ticket open karne mein error.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Add Comment on selected ticket
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;
    setSubmittingComment(true);
    try {
      const updated = await addTicketCommentApi(selectedTicket._id, newComment);
      setSelectedTicket(updated);
      setNewComment('');
      toast.success('Reply posted!');

      // Set timeout of 2.2s to poll again for Mock Support Agent response
      setTimeout(async () => {
        try {
          const fresh = await fetchTicketDetailsApi(selectedTicket._id);
          setSelectedTicket(fresh);
        } catch (err) {
          console.error(err);
        }
      }, 2200);

    } catch (err) {
      toast.error('Reply post karne mein failure.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Resolve Ticket
  const handleResolveTicket = async (ticketId) => {
    try {
      const updated = await updateTicketStatusApi(ticketId, 'resolved');
      setSelectedTicket(updated);
      // Update in ticket list
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: 'resolved' } : t));
      toast.success('Ticket marked as Resolved!');
    } catch (err) {
      toast.error('Status update failed.');
    }
  };

  // Chat send handler (Simulated Support Engine)
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg, time: new Date() }]);
    setChatInput('');
    setIsBotTyping(true);

    setTimeout(() => {
      let reply = "🔍 Hum aapki query check kar rahe hain. Standard details ke liye Knowledge Base tab check karein ya Naya Ticket open karein!";
      const lowerInput = userMsg.toLowerCase();

      if (lowerInput.includes('sms') || lowerInput.includes('whatsapp') || lowerInput.includes('message')) {
        reply = "📱 Patient notifications Phase 4 ke Twilio/Jio integration endpoints se handle hoti hain. Aap Settings > Notifications par jakar templates enable kar sakte hain.";
      } else if (lowerInput.includes('razorpay') || lowerInput.includes('payment') || lowerInput.includes('upgrade') || lowerInput.includes('billing') || lowerInput.includes('pro')) {
        reply = "💳 Settings > Subscription panel par plan upgrade process karein. Razorpay payments logic mock mode me autoverify ho jata hai tests ke liye.";
      } else if (lowerInput.includes('queue') || lowerInput.includes('reset') || lowerInput.includes('position') || lowerInput.includes('token')) {
        reply = "🔄 Patient Queue sequence tokenNumber sorted rehta hai. Agar timer fast-forward skew dikhaye to cleanup function stale tokens ko automatically 'no-show' mark kar deta hai.";
      } else if (lowerInput.includes('role') || lowerInput.includes('staff') || lowerInput.includes('dentist') || lowerInput.includes('receptionist')) {
        reply = "👥 Multiple staff handles setup karne ke liye Settings > Staff Section use karein aur Admin, Dentist, Receptionist roles divide karein.";
      } else if (lowerInput.includes('status') || lowerInput.includes('operational')) {
        reply = "🟢 QueueMD servers perfectly dynamic run kar rahe hain. Aap System Status tab par full network diagnostics inspect kar sakte hain.";
      }

      setChatMessages(prev => [...prev, { role: 'bot', text: reply, time: new Date() }]);
      setIsBotTyping(false);
    }, 1200);
  };

  // Filtering Articles based on search & category
  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory ? art.category === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto pb-32">
        {/* Left Sidebar Menu */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-hide">
          <button 
            onClick={() => { setActiveTab('knowledge-base'); setActiveCategory(null); }}
            className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all shrink-0 w-auto lg:w-full border ${
              activeTab === 'knowledge-base' 
                ? 'bg-blue-600/10 text-blue-400 border-blue-500/25 font-black' 
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-transparent font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">auto_stories</span>
            <span className="text-[13px] uppercase tracking-widest">Knowledge Base</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('my-tickets')}
            className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all shrink-0 w-auto lg:w-full border ${
              activeTab === 'my-tickets' 
                ? 'bg-blue-600/10 text-blue-400 border-blue-500/25 font-black' 
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-transparent font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">confirmation_number</span>
            <span className="text-[13px] uppercase tracking-widest">My Tickets</span>
          </button>

          <button 
            onClick={() => setActiveTab('api-docs')}
            className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all shrink-0 w-auto lg:w-full border ${
              activeTab === 'api-docs' 
                ? 'bg-blue-600/10 text-blue-400 border-blue-500/25 font-black' 
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-transparent font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">code</span>
            <span className="text-[13px] uppercase tracking-widest">API & Webhooks</span>
          </button>

          <button 
            onClick={() => setActiveTab('system-status')}
            className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all shrink-0 w-auto lg:w-full border ${
              activeTab === 'system-status' 
                ? 'bg-blue-600/10 text-blue-400 border-blue-500/25 font-black' 
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-transparent font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">cloud_done</span>
            <span className="text-[13px] uppercase tracking-widest">System Status</span>
          </button>

          <div className="hidden lg:block pt-8 mt-auto">
            <button 
              onClick={() => setTicketModalOpen(true)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[13px] uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              Open New Ticket
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            
            {/* KNOWLEDGE BASE TAB */}
            {activeTab === 'knowledge-base' && (
              <motion.div 
                key="knowledge-base"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-12"
              >
                {/* Header & Search */}
                <div className="text-center space-y-6 pt-4">
                  <h1 className="text-[36px] md:text-[44px] font-black text-text-primary tracking-tight leading-none">
                    How can we help you today?
                  </h1>
                  <p className="text-[16px] text-text-secondary max-w-2xl mx-auto opacity-70">
                    Search our knowledge base for quick answers, integration guides, and troubleshooting steps.
                  </p>

                  <div className="relative max-w-2xl mx-auto group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary opacity-50 group-focus-within:opacity-100 transition-opacity">search</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for articles, features, or error codes..."
                      className="w-full h-16 bg-bg-secondary/50 backdrop-blur-md border border-white/10 rounded-2xl pl-14 pr-32 text-[15px] text-text-primary outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-xl"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-24 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                      >
                        Clear
                      </button>
                    )}
                    <button className="absolute right-3 top-3 bottom-3 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[14px] transition-all">
                      Search
                    </button>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-400">grid_view</span>
                      <h2 className="text-[14px] font-black text-text-primary uppercase tracking-widest">Browse by Category</h2>
                    </div>
                    {activeCategory && (
                      <button 
                        onClick={() => setActiveCategory(null)}
                        className="text-blue-400 text-xs font-bold hover:underline"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.map(cat => (
                      <div 
                        key={cat.id} 
                        onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                        className={`group border rounded-2xl p-6 transition-all cursor-pointer relative overflow-hidden ${
                          activeCategory === cat.id 
                            ? 'bg-blue-600/10 border-blue-500/50 shadow-md' 
                            : 'bg-bg-secondary/50 backdrop-blur-md border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cat.color} rounded-bl-[100px] -mr-8 -mt-8 opacity-40`}></div>
                        <div className="relative z-10 space-y-4">
                          <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-primary group-hover:scale-105 transition-transform`}>
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

                {/* Popular / Filtered Articles */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-400">trending_up</span>
                      <h2 className="text-[14px] font-black text-text-primary uppercase tracking-widest">
                        {activeCategory || searchQuery ? 'Matching Articles' : 'Popular Articles'}
                      </h2>
                    </div>
                  </div>
                  
                  <div className="bg-bg-secondary/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                    {filteredArticles.length > 0 ? (
                      filteredArticles.map(article => (
                        <button 
                          key={article.id} 
                          onClick={() => setSelectedArticle(article)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-text-secondary opacity-50">description</span>
                            <div>
                              <span className="text-[14px] font-bold text-text-primary group-hover:text-blue-400 transition-colors">
                                {article.title}
                              </span>
                              <p className="text-xs text-text-secondary/70 mt-0.5">{article.summary}</p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">chevron_right</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-text-secondary text-sm">
                        No articles match your criteria. Search for something else!
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* MY TICKETS TAB */}
            {activeTab === 'my-tickets' && (
              <motion.div 
                key="my-tickets"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-400">confirmation_number</span>
                    <h2 className="text-[18px] font-black text-text-primary uppercase tracking-widest">Support Tickets</h2>
                  </div>
                  <button 
                    onClick={() => setTicketModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Open Ticket
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Tickets List */}
                  <div className={`${selectedTicket ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
                    {loadingTickets ? (
                      <div className="bg-bg-secondary/30 border border-white/5 rounded-2xl p-8 text-center text-text-secondary">
                        <span className="material-symbols-outlined animate-spin text-3xl mb-2">sync</span>
                        <p>Syncing tickets...</p>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="bg-bg-secondary/30 border border-dashed border-white/10 rounded-2xl p-12 text-center text-text-secondary">
                        <span className="material-symbols-outlined text-4xl opacity-30 mb-3">airplane_ticket</span>
                        <h4 className="font-bold text-text-primary">No Tickets Found</h4>
                        <p className="text-xs max-w-xs mx-auto mt-1">If you are facing an issue with SMS alerts or billing upgrades, raise a ticket.</p>
                      </div>
                    ) : (
                      tickets.map(ticket => (
                        <div 
                          key={ticket._id}
                          onClick={() => handleSelectTicket(ticket._id)}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                            selectedTicket?._id === ticket._id 
                              ? 'bg-blue-600/10 border-blue-500/50' 
                              : 'bg-bg-secondary/50 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">{ticket.category}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                              ticket.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/35' :
                              ticket.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/35' :
                              ticket.priority === 'medium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/35' :
                              'bg-slate-500/20 text-slate-400 border border-slate-500/35'
                            }`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <h4 className="font-black text-text-primary text-[15px] mt-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                            {ticket.subject}
                          </h4>
                          <p className="text-xs text-text-secondary opacity-70 line-clamp-2 mt-1">{ticket.description}</p>
                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                            <span className="text-[10px] text-text-secondary opacity-50">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              ticket.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              ticket.status === 'open' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              ticket.status === 'in-progress' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Selected Ticket Conversation Panel */}
                  {selectedTicket && (
                    <div className="lg:col-span-7 bg-bg-secondary/80 border border-white/10 rounded-2xl p-6 space-y-6 flex flex-col h-[580px] relative">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-text-primary text-base line-clamp-1">{selectedTicket.subject}</h3>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              selectedTicket.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {selectedTicket.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-secondary opacity-60">Category: {selectedTicket.category.toUpperCase()}</span>
                        </div>
                        <div className="flex gap-2">
                          {selectedTicket.status !== 'resolved' && (
                            <button 
                              onClick={() => handleResolveTicket(selectedTicket._id)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <span className="material-symbols-outlined text-[15px]">check_circle</span>
                              Mark Resolved
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedTicket(null)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-text-secondary hover:text-text-primary transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments Feed */}
                      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        
                        {/* Initial Description */}
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between text-[11px] text-text-secondary">
                            <span className="font-bold text-text-primary">{selectedTicket.userId?.name || 'You'} (Creator)</span>
                            <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-[13px] text-text-primary whitespace-pre-wrap">{selectedTicket.description}</p>
                        </div>

                        {selectedTicket.comments?.map((comment, i) => (
                          <div 
                            key={i} 
                            className={`p-4 rounded-xl border flex flex-col space-y-1 max-w-[85%] ${
                              comment.role === 'system' ? 'bg-blue-900/10 border-blue-500/20 text-blue-300 mx-auto w-full text-center' :
                              comment.role === 'support' ? 'bg-orange-500/5 border-orange-500/15 text-text-primary mr-auto' :
                              'bg-bg-primary/50 border-white/5 text-text-primary ml-auto'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] text-text-secondary gap-4">
                              <span className="font-bold flex items-center gap-1">
                                {comment.role === 'support' && <span className="material-symbols-outlined text-[12px] text-orange-400">shield_person</span>}
                                {comment.userName}
                              </span>
                              <span>{new Date(comment.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[13px] whitespace-pre-wrap">{comment.message}</p>
                          </div>
                        ))}
                      </div>

                      {/* Reply Form */}
                      {selectedTicket.status === 'resolved' ? (
                        <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-xl text-center text-xs text-green-400 font-bold">
                          🎫 Yeh ticket solve ho chuka hai. Reply band hai.
                        </div>
                      ) : (
                        <form onSubmit={handleAddComment} className="flex gap-2 items-end border-t border-white/10 pt-4">
                          <input 
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type a reply to support team..."
                            className="flex-1 bg-bg-primary border border-white/10 rounded-xl h-11 px-4 text-sm text-text-primary outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button 
                            type="submit" 
                            disabled={submittingComment || !newComment.trim()}
                            className="h-11 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {submittingComment ? 'Sending...' : 'Reply'}
                            <span className="material-symbols-outlined text-[16px]">send</span>
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* API & WEBHOOKS TAB */}
            {activeTab === 'api-docs' && (
              <motion.div 
                key="api-docs"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-400">code</span>
                  <h2 className="text-[18px] font-black text-text-primary uppercase tracking-widest">Developer Settings</h2>
                </div>

                {/* API Key Panel */}
                <div className="bg-bg-secondary/50 border border-white/10 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-black text-text-primary">REST API Credentials</h3>
                  <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
                    Use your Sandbox or Live key to call QueueMD API from your own internal EHR portal. Keep this credential secret!
                  </p>

                  <div className="flex items-center gap-3 bg-bg-primary p-4 rounded-xl border border-white/5">
                    <span className="material-symbols-outlined text-text-secondary">key</span>
                    <span className="font-mono text-sm text-blue-400 flex-1 tracking-wider">
                      {isApiKeyRevealed ? apiKey : '••••••••••••••••••••••••••••••••••••••••'}
                    </span>
                    <button 
                      onClick={() => setIsApiKeyRevealed(!isApiKeyRevealed)}
                      className="p-1 text-text-secondary hover:text-text-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isApiKeyRevealed ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(apiKey);
                        toast.success('API Key copied to clipboard!');
                      }}
                      className="p-1 text-text-secondary hover:text-text-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      onClick={() => {
                        const randomKey = 'qmd_live_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
                        setApiKey(randomKey);
                        toast.success('Naya API key generate ho gaya!');
                      }}
                      className="text-xs text-blue-400 hover:underline font-bold"
                    >
                      Regenerate API Key
                    </button>
                  </div>
                </div>

                {/* Webhook Payload Example */}
                <div className="bg-bg-secondary/50 border border-white/10 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-black text-text-primary">Webhook Notification Payload</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    When a patient changes status (e.g., from waiting to in-progress), QueueMD sends a POST payload to your Webhook URL.
                  </p>
                  
                  <div className="bg-bg-primary rounded-xl p-4 border border-white/5 overflow-x-auto">
                    <pre className="font-mono text-[12px] text-text-secondary">
{`{
  "event": "queue.patient_status_changed",
  "timestamp": "${new Date().toISOString()}",
  "data": {
    "patientId": "69e4a8b7c6d5e4f3a2b1c0d9",
    "tokenNumber": 42,
    "patientName": "Ramesh Kumar",
    "previousStatus": "waiting",
    "currentStatus": "in-progress",
    "calledAt": "${new Date().toISOString()}",
    "facilityType": "${facilityType || 'clinic'}"
  }
}`}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SYSTEM STATUS TAB */}
            {activeTab === 'system-status' && (
              <motion.div 
                key="system-status"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-400">cloud_done</span>
                  <h2 className="text-[18px] font-black text-text-primary uppercase tracking-widest">System Health Monitor</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: 'Gateway API Router', status: 'operational', details: 'Avg latency: 45ms', load: 'Normal' },
                    { name: 'SMS Worker Queue (BullMQ)', status: 'operational', details: 'Pending jobs: 0', load: 'Idle' },
                    { name: 'Real-time WebSocket Hub', status: 'operational', details: 'Connections: 4 active', load: 'Light' },
                    { name: 'MongoDB Database Cluster', status: 'operational', details: 'Replica lag: 0ms', load: '12% CPU' }
                  ].map(sys => (
                    <div key={sys.name} className="bg-bg-secondary/50 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-bold text-text-primary text-[15px]">{sys.name}</h4>
                        <p className="text-xs text-text-secondary opacity-60">{sys.details} • Load: {sys.load}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-xs font-black uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {sys.status}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-bg-secondary/30 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h4 className="font-bold text-text-primary text-sm">System uptime statistics (last 30 days)</h4>
                    <p className="text-xs text-text-secondary mt-1">99.98% coverage on SMS endpoints and token event sockets.</p>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <span key={i} className="w-1.5 h-6 bg-emerald-500 rounded-full opacity-80" title="100% Operational"></span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Sidebar - Support Card & Operational Health */}
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
              <button 
                onClick={() => setChatOpen(true)}
                className="w-full h-12 bg-white text-blue-600 rounded-xl font-black text-[13px] uppercase tracking-widest hover:bg-blue-55 hover:text-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                Start Live Chat
              </button>
              <a 
                href="mailto:support@queuemd.com?subject=Clinic Support Inquiry"
                className="w-full h-12 bg-white/10 border border-white/20 text-white rounded-xl font-black text-[13px] uppercase tracking-widest hover:bg-white/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">mail</span>
                Email Support
              </a>
            </div>
          </div>

          <div className="bg-bg-secondary/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[13px] font-bold text-text-primary">All Systems Operational</span>
            </div>
            <p className="text-[11px] text-text-secondary opacity-60">Last updated 2 mins ago</p>
            <button 
              onClick={() => setActiveTab('system-status')}
              className="text-blue-400 text-[11px] font-black uppercase tracking-widest hover:underline"
            >
              Status Page
            </button>
          </div>
        </div>
      </div>

      {/* READ ARTICLE OVERLAY MODAL */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-white/15 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute right-6 top-6 text-text-secondary hover:text-text-primary"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              
              <div className="space-y-1">
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">{selectedArticle.category}</span>
                <h3 className="text-xl font-black text-text-primary leading-tight">{selectedArticle.title}</h3>
              </div>
              
              <div className="border-t border-white/5 pt-4 text-sm text-text-secondary space-y-3 leading-relaxed max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedArticle.content.split('\n\n').map((para, idx) => (
                  <p key={idx} className="whitespace-pre-wrap">{para}</p>
                ))}
              </div>
              
              <div className="flex justify-end pt-4 border-t border-white/5">
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Got it, Thanks
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OPEN TICKET FORM DIALOG MODAL */}
      <AnimatePresence>
        {ticketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setTicketModalOpen(false)}
                className="absolute right-6 top-6 text-text-secondary hover:text-text-primary"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              
              <h3 className="text-lg font-black text-text-primary uppercase tracking-widest border-b border-white/5 pb-3">
                Open Support Ticket
              </h3>
              
              <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest">Subject</label>
                  <input 
                    type="text"
                    required
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="e.g. Jio numbers par SMS receive nahi ho rahe"
                    className="w-full h-11 bg-bg-primary border border-white/10 rounded-xl px-4 text-sm text-text-primary outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest">Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                      className="w-full h-11 bg-bg-primary border border-white/10 rounded-xl px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing & Upgrades</option>
                      <option value="triage">Triage Sequence</option>
                      <option value="display">Queue Display TV</option>
                      <option value="notifications">SMS & WhatsApp Alerts</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                      className="w-full h-11 bg-bg-primary border border-white/10 rounded-xl px-3 text-sm text-text-primary outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="low">Low (General Query)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High (Workflow blocked)</option>
                      <option value="urgent">Urgent (Critical System down)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest">Describe your issue</label>
                  <textarea 
                    required
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Problem ki clear description dein..."
                    rows={4}
                    className="w-full bg-bg-primary border border-white/10 rounded-xl p-4 text-sm text-text-primary outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={submittingTicket}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-98 disabled:opacity-50 mt-2"
                >
                  {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI CHATBOT DRAWER */}
      <AnimatePresence>
        {chatOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
            {/* Backdrop Dismiss */}
            <div className="flex-1" onClick={() => setChatOpen(false)}></div>
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-bg-secondary/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl h-full"
            >
              {/* Chat Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-surface-variant/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                  </div>
                  <div>
                    <h3 className="font-black text-text-primary text-[15px] uppercase tracking-wide">QueueMD Support Bot</h3>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Simulated AI Assistant
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div className={`p-4 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white/5 border border-white/5 text-text-primary rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-text-secondary opacity-40 mt-1 px-1">
                      {msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ))}

                {isBotTyping && (
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none w-20">
                    <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="p-4 border-t border-white/10 bg-bg-primary/50 flex gap-2">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about SMS, Razorpay, or Queue reset..."
                  className="flex-1 bg-bg-primary border border-white/10 rounded-xl px-4 h-12 text-sm text-text-primary outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim() || isBotTyping}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default HelpCenter;
