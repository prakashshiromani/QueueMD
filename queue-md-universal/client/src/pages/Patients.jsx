import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import AddPatientModal from "../components/AddPatientModal";
import PatientHistoryDrawer from "../components/PatientHistoryDrawer";
import { fetchPatientsApi, addPatientToDirectoryApi, addPatientApi, togglePatientStatusApi, updatePatientApi, deletePatientApi, createInvoiceApi } from "../services/api";
import { useFacilityStore } from "../store/facilityStore";
import { FACILITY_TYPES } from "../utils/facilityTypeConfig";
import { staffApi } from "../services/staffApi";
import { X, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Helper to convert hex to RGB string
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
}

export default function Patients() {
  const { facilityId, facilityType } = useFacilityStore();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editPatient, setEditPatient] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deletePatient, setDeletePatient] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewHistoryPatient, setViewHistoryPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const patientsPerPage = 10;

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await staffApi.getAll();
        const staffList = res.data || res.users || [];
        const activeDoctors = staffList.filter(s => s.role === "doctor" && s.isActive);
        setDoctors(activeDoctors);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // ✅ Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-menu]')) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ✅ Fetch patients with filters
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: patientsPerPage,
        search: searchQuery,
        facility: selectedFacility !== "all" ? selectedFacility : undefined,
      };

      const response = await fetchPatientsApi(params);
      // The updated backend returns { success, patients, total, ... }
      setPatients(response.patients || []);
      setTotalPatients(response.total || 0);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patient directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchQuery, selectedFacility, facilityId]);

  // ✅ Add patient to queue
  const handleAddToQueue = async (patient) => {
    // 🚫 Block inactive patients from being added to the queue
    if (patient.status?.toLowerCase() !== "active") {
      toast.error(`${patient.name} is INACTIVE and cannot be added to the queue.`, { icon: "🚫" });
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [patient._id]: true }));

      // ✅ CRITICAL FIX: Patient ki ACTUAL facilityType bhejo, na ki UI ki selected type.
      const payload = {
        patientId: patient._id,
        patientName: patient.name,
        phone: patient.phone,
        facilityType: patient.facilityType, // ✅ Use the patient's original facility type
        customData: patient.customData || {},
        doctorName: patient.doctorName || ""  // ✅ FIX: Pass doctor name from directory
      };

      const res = await addPatientApi(payload);
      toast.success(`Token #${res.data.tokenNumber} generated for ${patient.name}!`);

    } catch (error) {
      const msg = error.response?.data?.message || "Failed to add to queue";
      toast.error(msg);
    } finally {
      setActionLoading(prev => ({ ...prev, [patient._id]: false }));
    }
  };

  // ✅ Handle Add New Patient (CRM)
  const handleAddNewPatient = async (payload) => {
    try {
      // 🔥 DEBUG: Show exactly what is being sent to backend
      console.log("📤 [REGISTER PATIENT] Payload being sent:", JSON.stringify(payload, null, 2));
      console.log("🏥 FacilityType in payload:", payload.facilityType);

      const res = await addPatientToDirectoryApi(payload);
      toast.success(res.message || "New patient registered successfully!");
      setShowAddModal(false);
      fetchPatients(); // Refresh list

      // 💳 Auto-create invoice if visit fees were entered
      if (payload.visitFees && payload.visitFees > 0) {
        try {
          await createInvoiceApi({
            patientName: payload.patientName,
            phone: payload.phone || "",
            amount: payload.visitFees,
            status: "Pending",
            description: "Visit Consultation Fee",
          });
          toast.success(`Invoice of ₹${payload.visitFees} created in Billing!`, { icon: "🧾" });
        } catch (billingErr) {
          console.error("Billing invoice creation failed:", billingErr);
          toast("Patient registered, but invoice creation failed. Please add it manually in Billing.", {
            icon: "⚠️",
          });
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to register patient";
      toast.error(msg);
    }
  };

  // ✅ Toggle Patient Status (Row-level)
  const handleToggleStatus = async (patientId) => {
    try {
      // 1. Optimistic Update
      setPatients(prev => prev.map(p =>
        p._id === patientId
          ? { ...p, status: p.status?.toLowerCase() === "active" ? "Inactive" : "Active" }
          : p
      ));

      // 2. API Sync
      await togglePatientStatusApi(patientId);
      toast.success("Status updated successfully");
    } catch (err) {
      toast.error("Failed to update status");
      // Rollback on error
      fetchPatients();
    }
  };

  // ✅ Handle Edit Save
  const handleEditSave = async () => {
    if (!editPatient) return;
    setEditLoading(true);
    try {
      await updatePatientApi(editPatient._id, editForm);
      toast.success('Patient updated successfully!');
      setEditPatient(null);
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient');
    } finally {
      setEditLoading(false);
    }
  };

  // ✅ Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deletePatient) return;
    setDeleteLoading(true);
    try {
      await deletePatientApi(deletePatient._id);
      toast.success(`${deletePatient.name} deleted successfully`);
      setDeletePatient(null);
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete patient');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ Open Edit Modal
  const handleEditOpen = (patient) => {
    setOpenMenuId(null);
    setEditPatient(patient);
    setEditForm({ 
      name: patient.name, 
      phone: patient.phone || '', 
      email: patient.email || '',
      facilityType: patient.facilityType || '',
      doctorName: patient.doctorName || '',
      customData: patient.customData || {}
    });
  };

  const handleEditCustomChange = (name, value) => {
    setEditForm(prev => ({
      ...prev,
      customData: { ...(prev.customData || {}), [name]: value }
    }));
  };

  // ✅ Open Delete Confirm
  const handleDeleteOpen = (patient) => {
    setOpenMenuId(null);
    setDeletePatient(patient);
  };

  // ✅ Open History Drawer
  const handleViewHistory = (patient) => {
    setOpenMenuId(null);
    setViewHistoryPatient(patient);
  };

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || "P";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Status badge component
  const StatusBadge = ({ status, patientId }) => {
    const statusConfig = {
      active: {
        color: "text-green-400",
        bg: "bg-green-400/10",
        border: "border-green-400/20",
        label: "ACTIVE"
      },
      inactive: {
        color: "text-gray-400",
        bg: "bg-gray-400/10",
        border: "border-gray-400/20",
        label: "INACTIVE"
      },
      archived: {
        color: "text-red-400",
        bg: "bg-red-400/10",
        border: "border-red-400/20",
        label: "ARCHIVED"
      }
    };

    const s = status?.toLowerCase() || 'active';
    const config = statusConfig[s] || statusConfig.active;

    return (
      <button
        onClick={() => handleToggleStatus(patientId)}
        className={`group/status inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border transition-all active:scale-95 ${config.color} ${config.bg} ${config.border} hover:border-current hover:shadow-sm`}
        title={`Click to mark as ${s === 'active' ? 'Inactive' : 'Active'}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {config.label}
        <span className="material-symbols-outlined text-[12px] opacity-0 group-hover/status:opacity-100 transition-opacity ml-1">swap_horiz</span>
      </button>
    );
  };

  // Facility badge component
  const FacilityBadge = ({ type }) => {
    const config = FACILITY_TYPES[type] || FACILITY_TYPES.clinic;

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap"
        style={{
          backgroundColor: `${config.theme.primary}15`,
          color: config.theme.primary,
          borderColor: `${config.theme.primary}30`
        }}>
        <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-black text-text-primary tracking-tight leading-none">
              Patient Directory
            </h1>
            <p className="text-[14px] text-text-secondary mt-2 font-medium">
              Enterprise Patient Relationship Management (CRM)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-secondary border border-border-muted/50 dark:border-white/5 text-text-primary font-bold text-[13px] hover:bg-surface-variant transition shadow-sm">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-[13px] shadow-lg active:scale-[0.98] transition"
              style={{
                backgroundColor: 'var(--theme-primary)',
                boxShadow: `0 4px 14px rgba(var(--theme-primary-rgb), 0.2)`
              }}
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Register Patient
            </button>
          </div>
        </div>

        {/* Premium Search & Filter Bar */}
        <div className="bg-bg-secondary/50 backdrop-blur-md p-4 rounded-2xl border border-border-muted/50 dark:border-white/5 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-[2]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-xl">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, or phone..."
                className="w-full bg-bg-primary border border-border-muted/50 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 focus:border-[var(--theme-primary)]/50 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              )}
            </div>

            {/* Facility Filter Pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => setSelectedFacility("all")}
                className={`px-5 py-2.5 rounded-xl font-bold text-[13px] whitespace-nowrap transition-all border ${selectedFacility === "all"
                    ? "text-white"
                    : "bg-bg-primary border-border-muted/50 text-text-secondary hover:text-text-primary hover:border-border-muted"
                  }`}
                style={selectedFacility === "all" ? {
                  backgroundColor: 'var(--theme-primary)',
                  borderColor: 'var(--theme-primary)',
                  boxShadow: '0 4px 12px rgba(var(--theme-primary-rgb), 0.2)'
                } : {}}
              >
                All Facilities
              </button>
              {Object.entries(FACILITY_TYPES).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setSelectedFacility(type)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-[13px] whitespace-nowrap transition-all flex items-center gap-2 border ${selectedFacility === type
                      ? "text-white"
                      : "bg-bg-primary border-border-muted/50 text-text-secondary hover:text-text-primary hover:border-border-muted"
                    }`}
                  style={selectedFacility === type ? {
                    backgroundColor: config.theme.primary,
                    borderColor: config.theme.primary,
                    boxShadow: `0 4px 12px ${config.theme.primary}40`
                  } : {}}
                >
                  <span className="material-symbols-outlined text-[18px]">{config.icon}</span>
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Patient Table */}
        <div className="bg-bg-secondary rounded-2xl border border-border-muted/50 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-variant/30 border-b border-border-muted/50 dark:border-white/5">
                  <th className="px-6 py-5 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.2em]">PATIENT</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.2em]">CONTACT</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.2em]">PRIMARY FACILITY</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.2em]">LAST VISIT</th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-text-secondary uppercase tracking-[0.2em]">STATUS</th>
                  <th className="px-6 py-5 text-right text-[11px] font-black text-text-secondary uppercase tracking-[0.2em]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/30">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">refresh</span>
                        <p className="text-[11px] font-black text-text-secondary uppercase tracking-widest">Synchronizing records...</p>
                      </div>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <span className="material-symbols-outlined text-6xl">person_off</span>
                        <div className="space-y-1">
                          <p className="font-black text-text-primary uppercase tracking-widest">No Patients Found</p>
                          <p className="text-xs text-text-secondary font-medium uppercase tracking-widest">
                            {searchQuery ? "Try adjusting your search criteria" : "Start by registering your first patient"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient._id} className="group hover:bg-surface-variant/40 transition-all border-l-4 border-l-transparent hover:border-l-[var(--theme-primary)]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[13px] border"
                            style={{
                              backgroundColor: `${FACILITY_TYPES[patient.facilityType]?.theme.primary}10`,
                              color: FACILITY_TYPES[patient.facilityType]?.theme.primary,
                              borderColor: `${FACILITY_TYPES[patient.facilityType]?.theme.primary}30`
                            }}
                          >
                            {getInitials(patient.name)}
                          </div>
                          <div>
                            <div className="text-[14px] font-black text-text-primary">
                              {patient.name}
                            </div>
                            <div className="text-[10px] font-black text-text-secondary uppercase tracking-wider">
                              ID: {patient._id.slice(-8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-[13px] font-bold text-text-primary whitespace-nowrap">
                          {patient.phone || "N/A"}
                        </div>
                        <div className="text-[11px] font-medium text-text-secondary whitespace-nowrap">
                          {patient.email || "No email provided"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <FacilityBadge type={patient.facilityType || "clinic"} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-[13px] font-bold text-text-primary">
                          {formatDate(patient.lastVisit)}
                        </div>
                        <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                          {patient.lastVisitType || "CONSULTATION"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={patient.status || "active"} patientId={patient._id} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {(() => {
                            const rowConfig = FACILITY_TYPES[patient.facilityType] || FACILITY_TYPES.clinic;
                            const rowPrimary = rowConfig.theme.primary;
                            return (
                              <button
                                onClick={() => handleAddToQueue(patient)}
                                disabled={actionLoading[patient._id]}
                                className="px-4 py-2 rounded-xl font-black text-[11px] tracking-widest uppercase transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm border"
                                style={{
                                  backgroundColor: `${rowPrimary}10`,
                                  color: rowPrimary,
                                  borderColor: `${rowPrimary}30`
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = rowPrimary;
                                  e.currentTarget.style.color = '#fff';
                                  e.currentTarget.style.borderColor = rowPrimary;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = `${rowPrimary}10`;
                                  e.currentTarget.style.color = rowPrimary;
                                  e.currentTarget.style.borderColor = `${rowPrimary}30`;
                                }}
                              >
                                {actionLoading[patient._id] ? (
                                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                                ) : (
                                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                                )}
                                ADD TO QUEUE
                              </button>
                            );
                          })()}
                          {/* ⋮ Three-dot dropdown */}
                          <div className="relative" data-menu>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === patient._id ? null : patient._id)}
                              className="p-2 rounded-xl hover:bg-surface-variant text-text-secondary hover:text-text-primary transition shadow-sm border border-transparent hover:border-border-muted/50"
                            >
                              <span className="material-symbols-outlined text-[18px]">more_vert</span>
                            </button>

                            {openMenuId === patient._id && (
                              <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                <button
                                  onClick={() => handleEditOpen(patient)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-text-primary hover:bg-surface-variant transition-all group"
                                >
                                  <span 
                                    className="material-symbols-outlined text-[18px] group-hover:opacity-80 transition-opacity"
                                    style={{ color: (FACILITY_TYPES[patient.facilityType] || FACILITY_TYPES.clinic).theme.primary }}
                                  >
                                    edit
                                  </span>
                                  Edit Patient
                                </button>
                                <button
                                  onClick={() => handleViewHistory(patient)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-text-primary hover:bg-surface-variant transition-all group"
                                >
                                  <span className="material-symbols-outlined text-[18px] text-purple-400 group-hover:text-purple-500">history</span>
                                  View History
                                </button>
                                <div className="h-px bg-border-muted/30 mx-3" />
                                <button
                                  onClick={() => handleDeleteOpen(patient)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-red-400 hover:bg-red-500/10 transition-all group"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                  Delete Patient
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && patients.length > 0 && (
            <div className="px-6 py-5 border-t border-border-muted/50 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-secondary/50">
              <div className="text-[11px] font-black text-text-secondary uppercase tracking-[0.15em]">
                Registry Index: <span className="text-text-primary">{((currentPage - 1) * patientsPerPage) + 1} — {Math.min(currentPage * patientsPerPage, totalPatients)}</span> / {totalPatients}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-primary font-black text-[11px] uppercase tracking-widest disabled:opacity-30 hover:border-[var(--theme-primary)]/50 transition-all shadow-sm"
                >
                  Prev
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(Math.ceil(totalPatients / patientsPerPage), 5) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-9 h-9 rounded-xl font-black text-[11px] transition-all flex items-center justify-center border shadow-sm ${currentPage === i + 1
                          ? "text-white scale-110"
                          : "bg-bg-primary border-border-muted/50 text-text-secondary hover:border-[var(--theme-primary)]/50"
                        }`}
                      style={currentPage === i + 1 ? {
                        backgroundColor: 'var(--theme-primary)',
                        borderColor: 'var(--theme-primary)',
                        boxShadow: '0 4px 10px rgba(var(--theme-primary-rgb), 0.2)'
                      } : {}}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalPatients / patientsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(totalPatients / patientsPerPage)}
                  className="px-4 py-2 rounded-xl bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-primary font-black text-[11px] uppercase tracking-widest disabled:opacity-30 hover:border-[var(--theme-primary)]/50 transition-all shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Register Patient Modal */}
      <AddPatientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddNewPatient}
        loading={false}
      />

      {/* ✅ Edit Patient Modal */}
      {editPatient && (() => {
        const isDark = document.documentElement.classList.contains('dark');
        const patientFacilityType = editForm.facilityType || facilityType || 'clinic';
        const modalConfig = FACILITY_TYPES[patientFacilityType] || FACILITY_TYPES.clinic;
        const primaryRgb = hexToRgb(modalConfig.theme.primary);
        
        const editFilteredDoctors = editForm.facilityType
          ? doctors.filter(d => d.facilityType === editForm.facilityType)
          : doctors;
        
        const theme = {
          overlay: "bg-black/70 backdrop-blur-md",
          modalBg: "bg-bg-secondary border border-border-muted/50 dark:border-white/5 shadow-2xl",
          text: "text-text-primary",
          label: "text-text-secondary font-medium",
          inputBg: "bg-bg-primary border border-border-muted/50",
          inputText: "text-text-primary placeholder:text-text-secondary/50",
          optionBg: "bg-bg-primary text-text-primary",
          closeBtn: "text-text-secondary hover:text-text-primary hover:bg-surface-variant"
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditPatient(null)}>
            <div
              className={`${theme.modalBg} border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-xl m-4 flex flex-col`}
              style={{
                '--theme-primary': modalConfig.theme.primary,
                '--theme-primary-rgb': primaryRgb,
                '--theme-secondary': modalConfig.theme.secondary
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-inherit p-6 border-b border-border-muted/50 dark:border-white/5 flex justify-between items-center z-10">
                <h2 className={`text-xl font-semibold ${theme.text}`}>Edit Patient Profile</h2>
                <button onClick={() => setEditPatient(null)} className={`p-1 rounded-lg transition ${theme.closeBtn}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditSave();
                }} 
                className="p-6 space-y-6 flex-1 overflow-y-auto"
              >
                
                {/* 👤 Personal Details */}
                <div>
                  <h3 className={`text-sm font-medium ${theme.label} mb-3 uppercase tracking-wider`}>Personal Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm mb-1 ${theme.label}`}>Full Name *</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm mb-1 ${theme.label}`}>Email Address</label>
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                        placeholder="patient@email.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-sm mb-1 ${theme.label}`}>Phone Number *</label>
                      <input
                        type="text"
                        value={editForm.phone || ''}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 🏥 Visit Details */}
                <div>
                  <h3 className={`text-sm font-medium ${theme.label} mb-3 uppercase tracking-wider`}>Visit Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm mb-1 ${theme.label}`}>Facility Type *</label>
                      <div className="relative">
                        <select
                          value={editForm.facilityType || ''}
                          onChange={e => setEditForm(f => ({ ...f, facilityType: e.target.value, customData: {}, doctorName: "" }))}
                          className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all appearance-none cursor-pointer [&>option]:${theme.optionBg}`}
                          required
                        >
                          <option value="" disabled>Select Facility Type</option>
                          {Object.entries(FACILITY_TYPES).map(([type, cfg]) => (
                            <option key={type} value={type} className={theme.optionBg}>
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-xl pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm mb-1 ${theme.label}`}>Assign Doctor</label>
                      <div className="relative">
                        <select
                          value={editForm.doctorName || ''}
                          onChange={e => setEditForm(f => ({ ...f, doctorName: e.target.value }))}
                          disabled={!editForm.facilityType}
                          className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all appearance-none cursor-pointer [&>option]:${theme.optionBg} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="">Select Doctor (Optional)</option>
                          {loadingDoctors ? (
                            <option disabled className={theme.optionBg}>Loading doctors...</option>
                          ) : editFilteredDoctors.length === 0 ? (
                            <option disabled className={theme.optionBg}>No active doctors found for this department</option>
                          ) : (
                            editFilteredDoctors.map((doc) => (
                              <option key={doc._id} value={doc.name} className={theme.optionBg}>
                                {doc.name} {doc.specialization ? `(${doc.specialization})` : ""}
                              </option>
                            ))
                          )}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-xl pointer-events-none">
                          expand_more
                        </span>
                      </div>
                      {editForm.facilityType && editFilteredDoctors.length === 0 && (
                        <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1 pl-1">
                          <span className="material-symbols-outlined text-[14px] leading-none">warning</span>
                          No doctors registered for this department
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 📋 Facility-Specific Custom Fields */}
                {modalConfig.customFields && modalConfig.customFields.length > 0 && (
                  <div>
                    <h3 className={`text-sm font-medium ${theme.label} mb-3 uppercase tracking-wider`}>{modalConfig.label} Specific Details</h3>
                    <div className="border border-border-muted/50 dark:border-white/5 rounded-2xl p-5 bg-bg-primary/20 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {modalConfig.customFields.map((field) => (
                          <div key={field.name} className={field.type === "select" ? "" : "md:col-span-2"}>
                            <label className={`block text-sm mb-1 ${theme.label}`}>
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === "select" ? (
                              <div className="relative">
                                <select
                                  value={(editForm.customData && editForm.customData[field.name]) || ""}
                                  onChange={(e) => handleEditCustomChange(field.name, e.target.value)}
                                  className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all appearance-none cursor-pointer [&>option]:${theme.optionBg}`}
                                  required={field.required}
                                >
                                  <option value="">Select {field.label}</option>
                                  {field.options?.map(opt => (
                                    <option key={opt} value={opt} className={theme.optionBg}>{opt}</option>
                                  ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-lg pointer-events-none">expand_more</span>
                              </div>
                            ) : (
                              <input
                                type={field.type || "text"}
                                value={(editForm.customData && editForm.customData[field.name]) || ""}
                                onChange={(e) => handleEditCustomChange(field.name, e.target.value)}
                                placeholder={field.placeholder || `Enter ${field.label}`}
                                className={`w-full ${theme.inputBg} ${theme.inputText} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/30 focus:border-[var(--theme-primary)]/50 transition-all`}
                                required={field.required}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit / Cancel Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border-muted/50 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditPatient(null)}
                    className={`px-5 py-2.5 rounded-xl border border-border-muted/50 dark:border-white/5 ${theme.label} hover:bg-surface-variant transition`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-medium transition active:scale-95 disabled:opacity-50"
                    style={{
                      backgroundColor: modalConfig.theme.primary,
                      boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
                    }}
                  >
                    {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ✅ Delete Confirm Modal */}
      {deletePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-border-muted/50 dark:border-white/5 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-red-400">person_remove</span>
              </div>
              <h2 className="text-[18px] font-black text-text-primary">Delete Patient?</h2>
              <p className="text-[13px] text-text-secondary font-medium leading-relaxed">
                Are you sure you want to permanently delete <span className="text-text-primary font-black">{deletePatient.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePatient(null)}
                className="flex-1 py-3 rounded-xl bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-secondary font-black text-[13px] uppercase tracking-widest hover:text-text-primary transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-[13px] uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleteLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">delete</span>}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Patient History Drawer */}
      <PatientHistoryDrawer 
        isOpen={!!viewHistoryPatient} 
        onClose={() => setViewHistoryPatient(null)} 
        patient={viewHistoryPatient} 
      />
    </Layout>
  );
}
