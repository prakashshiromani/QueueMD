import { useEffect, useState, useRef } from 'react';
import api from '../services/api';

// Realistic context labels per facility type (viva proof of thought)
const TYPE_CONTEXT = {
  clinic:   { emoji: '🏥', label: 'OPD avg' },
  hospital: { emoji: '🏨', label: 'Ward avg' },
  pathlab:  { emoji: '🔬', label: 'Sample processing' },
  dental:   { emoji: '🦷', label: 'Procedure avg' },
  physio:   { emoji: '🧘', label: 'Session avg' },
  vet:      { emoji: '🐾', label: 'Checkup avg' },
};

const WaitTimeBadge = ({ facilityType = 'clinic' }) => {
  const [wait, setWait] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(null);
  const prevTypeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const isTypeSwitch = prevTypeRef.current && prevTypeRef.current !== facilityType;
    prevTypeRef.current = facilityType;

    // Show loading spinner on type switch for instant feedback
    if (isTypeSwitch) {
      setLoading(true);
      setWait(null);
    }

    const fetchWait = async () => {
      try {
        const res = await api.get(`/analytics/predicted-wait?facilityType=${facilityType}`);
        if (!cancelled && res.data?.success) {
          setWait(res.data.predicted_minutes);
          setSource(res.data.source);
        }
      } catch (err) {
        console.error("Failed to fetch predicted wait time:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWait();

    // Poll every 2 minutes (cache TTL is 5 min, so this is safe)
    const interval = setInterval(fetchWait, 120000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [facilityType]); // ← Re-fetches whenever facility type changes

  const ctx = TYPE_CONTEXT[facilityType] || TYPE_CONTEXT.clinic;

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/5 border border-orange-500/10 rounded-full mt-2 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-orange-500/40" />
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400/50">
          Calculating {ctx.emoji}...
        </span>
      </div>
    );
  }

  if (wait === null) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full mt-2 group">
      {/* Pulsing neon dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
      </span>
      <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
        {ctx.emoji} AI: ~{wait} min
      </span>
      {/* Source badge — cache vs live */}
      {source === 'cache' && (
        <span className="text-[8px] font-bold text-orange-300/50 uppercase tracking-wider">
          (cached)
        </span>
      )}
    </div>
  );
};

export default WaitTimeBadge;
