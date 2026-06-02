import { useState, useEffect } from 'react';
import { useFacilityStore } from '../../store/facilityStore';
import { useBillingStore } from '../../store/billingStore';

export const SubscriptionTab = () => {
  const { facilityId } = useFacilityStore();
  const {
    subscriptionPlan,
    subscriptionStatus,
    subscriptionEnd,
    subscriptionHistory,
    fetchSubscriptionStatus,
    fetchSubscriptionHistory,
    initiateUpgrade,
    loading
  } = useBillingStore();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("yearly"); // Default yearly plan selection

  useEffect(() => {
    if (facilityId) {
      fetchSubscriptionStatus();
      fetchSubscriptionHistory();
    }
  }, [facilityId]);

  const isPro = subscriptionPlan === "pro";
  const isExpired = subscriptionStatus === "expired";
  const validDate = subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("en-IN") : "—";

  // Pricing Data
  const plans = {
    monthly: { amount: 499, label: "₹499/month", desc: "Billed monthly", save: null },
    yearly: { amount: 4999, label: "₹4,999/year", desc: "Billed annually", save: "Save ₹989 🎁" }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className={`p-6 rounded-2xl border transition-colors ${isPro ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30" : "bg-bg-primary border-border-muted dark:border-white/10"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-xl font-black tracking-wide ${isPro ? "text-blue-700 dark:text-blue-400" : "text-text-primary"}`}>
              {isPro ? "🎉 PRO PLAN" : "🆓 FREE PLAN"}
            </h3>
            <p className="text-sm text-text-secondary mt-1.5 font-medium">
              {isPro ? `Valid until: ${validDate}` : "Basic queue management • 1 Branch • 5 Staff"}
            </p>
          </div>
          {!isPro && (
            <button
              onClick={() => initiateUpgrade(selectedDuration)}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center gap-2 uppercase tracking-wider shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <span>Upgrade to Pro</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-black">{plans[selectedDuration].label}</span>
                </>
              )}
            </button>
          )}
          {isPro && !isExpired && (
            <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/30 shadow-sm">Active ✓</span>
          )}
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-bg-primary rounded-2xl border border-border-muted dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-muted/50 dark:border-white/10 bg-bg-secondary/40">
          <h4 className="font-bold text-text-primary text-base">Plan Comparison</h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted/50 dark:border-white/10 bg-bg-primary">
              <th className="text-left py-3.5 px-6 font-bold text-text-secondary uppercase tracking-widest text-[11px]">Feature</th>
              <th className="text-center py-3.5 px-3 font-bold text-text-secondary uppercase tracking-widest text-[11px]">Free</th>
              <th className="text-center py-3.5 px-3 font-black text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-500/10 border-b-2 border-blue-500 uppercase tracking-widest text-[11px]">Pro</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Branches", "1", "Unlimited"],
              ["Staff Members", "5", "Unlimited"],
              ["SMS/WhatsApp Alerts", "❌", "✅"],
              ["Advanced Analytics", "❌", "✅"],
              ["Priority Support", "❌", "✅"],
              ["Custom Branding", "❌", "✅"]
            ].map(([feature, freeVal, proVal]) => (
              <tr key={feature} className="border-b border-border-muted/30 dark:border-white/5 last:border-0 hover:bg-bg-secondary/30 transition-colors">
                <td className="py-4 px-6 text-text-primary font-medium">{feature}</td>
                <td className="text-center py-4 px-3 text-text-secondary font-medium">{freeVal}</td>
                <td className="text-center py-4 px-3 bg-blue-50/40 dark:bg-blue-500/5 font-bold text-blue-700 dark:text-blue-400">{proVal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plan Selection Cards */}
      {!isPro && (
        <div className="space-y-4 mt-8">
          <p className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Select your plan</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {["monthly", "yearly"].map((duration) => {
              const plan = plans[duration];
              const isSelected = selectedDuration === duration;

              return (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setSelectedDuration(duration)}
                  className={`relative p-6 rounded-2xl border-2 transition-all text-left overflow-hidden group ${isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20"
                    : "border-border-muted/50 dark:border-white/10 bg-bg-primary hover:border-blue-500/40 dark:hover:border-blue-500/40 opacity-80 hover:opacity-100"
                    }`}
                >
                  {duration === "yearly" && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
                      POPULAR
                    </div>
                  )}

                  {/* Checkmark for selected */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center scale-90 shadow-sm">
                      <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>
                    </div>
                  )}

                  <div className={`text-3xl font-black transition-colors ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-text-primary group-hover:text-blue-500 dark:group-hover:text-blue-400"}`}>
                    ₹{plan.amount.toLocaleString("en-IN")}
                  </div>
                  <div className="text-sm text-text-secondary font-medium mt-1.5">
                    {plan.desc}
                  </div>
                  {plan.save && (
                    <div className="inline-flex text-xs text-emerald-700 dark:text-emerald-400 mt-4 font-bold items-center gap-1.5 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                      <span className="material-symbols-outlined text-[14px]">redeem</span>
                      {plan.save}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom CTA Button - Prominent */}
      {!isPro && (
        <button
          onClick={() => initiateUpgrade(selectedDuration)}
          disabled={loading}
          className="w-full mt-8 py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm disabled:opacity-50 transition-all shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2 uppercase tracking-widest border border-blue-400/20 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? (
            <span className="animate-pulse flex items-center gap-2"><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Processing Upgrade...</span>
          ) : (
            <>
              <span>🚀 Upgrade to Pro — {plans[selectedDuration].label}</span>
              {plans[selectedDuration].save && (
                <span className="text-[10px] bg-white/25 px-2.5 py-0.5 rounded-lg font-black tracking-normal ml-1 border border-white/10">
                  {plans[selectedDuration].save}
                </span>
              )}
            </>
          )}
        </button>
      )}

      {/* Billing History Toggle */}
      <div className="mt-8 border-t border-border-muted/50 dark:border-white/10 pt-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-bold flex items-center gap-1 transition-colors"
        >
          {showHistory ? "Hide" : "View"} Billing History
          <span className="material-symbols-outlined text-[18px]">
            {showHistory ? "expand_less" : "expand_more"}
          </span>
        </button>

        {showHistory && (
          <div className="mt-4 space-y-4">
            {loading && (!subscriptionHistory || subscriptionHistory.length === 0) ? (
              <div className="p-8 text-center text-text-secondary/70">
                <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
                <p className="text-xs mt-1">Loading billing history...</p>
              </div>
            ) : (!subscriptionHistory || subscriptionHistory.length === 0) ? (
              <div className="p-5 rounded-2xl bg-bg-secondary/40 border border-border-muted/40 dark:border-white/5 text-sm text-text-secondary italic flex flex-col items-center justify-center gap-3 py-8">
                <span className="material-symbols-outlined text-[32px] opacity-30">receipt_long</span>
                <p className="font-medium text-text-secondary/80">Billing history will appear here after your first transaction.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-bg-primary rounded-2xl border border-border-muted dark:border-white/10 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border-muted/50 dark:border-white/10 bg-bg-secondary/30">
                      <th className="py-3 px-4 font-bold text-text-secondary uppercase tracking-wider">Date</th>
                      <th className="py-3 px-4 font-bold text-text-secondary uppercase tracking-wider">Plan</th>
                      <th className="py-3 px-4 font-bold text-text-secondary uppercase tracking-wider">Duration</th>
                      <th className="py-3 px-4 font-bold text-text-secondary uppercase tracking-wider">Amount</th>
                      <th className="py-3 px-4 font-bold text-text-secondary uppercase tracking-wider">Order ID</th>
                      <th className="py-3 px-4 font-bold text-text-secondary uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionHistory.map((sub) => (
                      <tr key={sub.razorpayOrderId || sub._id} className="border-b border-border-muted/30 dark:border-white/5 last:border-0 hover:bg-bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 text-text-primary font-medium">
                          {new Date(sub.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 font-bold text-text-primary uppercase">{sub.plan}</td>
                        <td className="py-3 px-4 text-text-secondary capitalize">{sub.duration}</td>
                        <td className="py-3 px-4 text-text-primary font-semibold">₹{(sub.amount / 100).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 text-text-secondary font-mono text-[10px]">{sub.razorpayOrderId || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${sub.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              sub.status === 'created' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
