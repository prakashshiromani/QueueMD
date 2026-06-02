import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Helper to convert string to PascalCase (first letter of each word capitalized)
const toPascalCase = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

export const BranchesTab = ({ facilityId }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', address: '' });
  const [editingBranch, setEditingBranch] = useState(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/facility/${facilityId}/branches`);
      setBranches(response.data.data || []);
    } catch (err) {
      console.error("Fetch branches error:", err);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    if (facilityId) fetchBranches();
  }, [facilityId, fetchBranches]);

  const handleAddBranch = async () => {
    if (!newBranch.name.trim()) return toast.error('Branch name required');
    try {
      await api.post(`/facility/${facilityId}/branch`, newBranch);
      setShowAddForm(false);
      setNewBranch({ name: '', address: '' });
      fetchBranches();
      toast.success('Branch added successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.msg || 'Failed to add branch');
    }
  };

  const handleToggleActive = async (branchId, currentStatus) => {
    try {
      await api.put(`/facility/${facilityId}/branch/${branchId}`, { isActive: !currentStatus });
      fetchBranches();
      toast.success('Branch status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch.name.trim()) return toast.error('Branch name required');
    try {
      await api.put(`/facility/${facilityId}/branch/${editingBranch._id}`, editingBranch);
      setEditingBranch(null);
      fetchBranches();
      toast.success('Branch updated successfully');
    } catch (err) {
      toast.error('Failed to update branch');
    }
  };

  const handleDeleteBranch = async (branchId, branchName) => {
    if (!window.confirm(`Are you sure you want to delete "${branchName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/facility/${facilityId}/branch/${branchId}`);
      fetchBranches();
      toast.success('Branch deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete branch');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-text-primary">Manage Branches</h3>
          <p className="text-xs text-text-secondary mt-1">Configure multi-location branches for this facility</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 h-[38px] rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-text-primary border border-border-muted/50 dark:border-white/5 text-xs font-bold transition flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">add</span> Add Branch
        </button>
      </div>

      {showAddForm && (
        <div className="p-5 bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest">Register Branch</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={newBranch.name}
              onChange={(e) => setNewBranch({ ...newBranch, name: toPascalCase(e.target.value) })}
              placeholder="Branch Name *"
              className="w-full bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none"
            />
            <input
              type="text"
              value={newBranch.address}
              onChange={(e) => setNewBranch({ ...newBranch, address: toPascalCase(e.target.value) })}
              placeholder="Address"
              className="w-full bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddBranch} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider">Save Branch</button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-muted/50 dark:border-white/5 text-text-secondary font-bold text-xs uppercase tracking-wider">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-[72px] bg-bg-primary border border-border-muted/30 dark:border-white/5 animate-pulse rounded-2xl" />)}
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-10 bg-bg-primary rounded-2xl border border-border-muted/30 dark:border-white/5">
          <span className="material-symbols-outlined text-4xl text-text-secondary/35">map</span>
          <p className="font-bold text-text-primary mt-2">No branches added yet</p>
          <p className="text-xs text-text-secondary mt-1">Click "Add Branch" to aggregate location queues</p>
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map((branch) => (
            <div key={branch._id} className="flex items-center justify-between p-4 bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/5 hover:border-border-muted transition-all">
              <div className="flex-1 min-w-0 pr-4">
                {editingBranch?._id === branch._id ? (
                  <div className="space-y-2">
                    <input
                      value={editingBranch.name}
                      onChange={(e) => setEditingBranch({ ...editingBranch, name: toPascalCase(e.target.value) })}
                      className="bg-bg-secondary border border-border-muted/50 dark:border-white/5 outline-none text-text-primary font-bold text-sm px-3 py-1.5 rounded-lg w-full"
                    />
                    <input
                      value={editingBranch.address || ''}
                      onChange={(e) => setEditingBranch({ ...editingBranch, address: toPascalCase(e.target.value) })}
                      className="bg-bg-secondary border border-border-muted/50 dark:border-white/5 outline-none text-text-secondary text-xs px-3 py-1.5 rounded-lg w-full"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-text-primary text-sm capitalize">{branch.name}</p>
                    <p className="text-xs text-text-secondary mt-1 truncate">{branch.address || 'No address configured'}</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3.5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branch.isActive}
                    onChange={() => handleToggleActive(branch._id, branch.isActive)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border-muted peer-focus:ring-2 peer-focus:ring-primary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>

                {editingBranch?._id === branch._id ? (
                  <div className="flex gap-1.5">
                    <button onClick={handleUpdateBranch} className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                    <button onClick={() => setEditingBranch(null)} className="w-8 h-8 rounded-lg bg-bg-secondary border border-border-muted/50 dark:border-white/5 text-text-secondary flex items-center justify-center transition">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEditingBranch(branch)}
                      className="w-8 h-8 rounded-lg bg-bg-secondary border border-border-muted/50 dark:border-white/5 text-text-secondary hover:text-text-primary flex items-center justify-center transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch._id, branch.name)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-500 flex items-center justify-center transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
