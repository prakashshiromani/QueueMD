import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useFacilityStore } from "../store/facilityStore";
import Layout from "../components/Layout";
import CalendarView from "../components/appointments/CalendarView";
import DayView from "../components/appointments/DayView";
import DailySchedule from "../components/appointments/DailySchedule";
import AppointmentModal from "../components/appointments/AppointmentModal";
import { socket } from "../services/socket";
import {
  fetchAppointments,
  fetchTodaySchedule,
  createAppointmentApi,
  updateAppointmentApi,
  updateAppointmentStatusApi,
  deleteAppointmentApi,
  deletePatientEntirelyApi,
  syncAppointmentsToDirectoryApi
} from "../services/api";
import { toast } from "react-hot-toast";

export default function Appointments() {
  const { facilityId, facilityType } = useFacilityStore();
  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, remaining: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!facilityId) return;
    setLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const calData = await fetchAppointments({ startDate: start.toISOString(), endDate: end.toISOString() });
      setAppointments(calData.appointments);

      const todayData = await fetchTodaySchedule();
      setTodaySchedule(todayData.appointments);
      setStats(todayData.stats);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!facilityId) return;
    socket.emit("join_facility", { facilityId, facilityType });
    socket.on("appointment_update", (data) => {
      if (data.facilityType !== facilityType) return;
      if (data.action === "create") setAppointments(prev => [...prev, data.appointment]);
      else if (data.action === "update") setAppointments(prev => prev.map(a => a._id === data.appointment._id ? data.appointment : a));
      else if (data.action === "delete") setAppointments(prev => prev.filter(a => a._id !== data.appointmentId));
      else if (data.action === "patient_deleted") loadData();

      fetchTodaySchedule().then(d => {
        if (d) {
          setTodaySchedule(d.appointments);
          setStats(d.stats);
        }
      });
    });
    return () => socket.off("appointment_update");
  }, [facilityId, facilityType]);

  useEffect(() => { loadData(); }, [currentDate]);

  const handleSubmit = async (formData) => {
    try {
      if (selectedAppointment) {
        await updateAppointmentApi(selectedAppointment._id, formData);
      } else {
        await createAppointmentApi(formData);
      }
      setIsModalOpen(false);
      setSelectedAppointment(null);
      loadData();
    } catch (err) {
      console.error("Submit error:", err);
      throw err; // Propagate to modal
    }
  };

  const handleStatus = async (id, status) => {
    await updateAppointmentStatusApi(id, { status });
  };

  const handleDelete = async (appointment) => {
    //  Choice 1: User se confirm karo
    // OK = Delete Appointment
    // Cancel = Delete Patient (We handle logic below)
    const choice = window.confirm(
      "Delete this Appointment?\n\n" +
      "Click OK -> Delete Appointment Only\n" +
      "Click Cancel -> Delete Patient Entirely"
    );

    if (choice === true) {
      // ✅ Action: Delete Appointment Only
      try {
        await deleteAppointmentApi(appointment._id);
        toast.success("Appointment deleted!");
        loadData(); // Refresh
      } catch (err) {
        toast.error("Failed to delete appointment");
      }
    }
    else if (choice === false) {
      //  Action: User wants to Delete Patient
      const confirmPatientDelete = window.confirm(
        "️ WARNING: Are you sure you want to DELETE THIS PATIENT?\n\n" +
        "This will remove the patient from the Directory AND delete all their past appointments.\n" +
        "This action cannot be undone."
      );

      if (confirmPatientDelete === true) {
        if (!appointment.patientId) {
          toast.error("Error: Patient ID not found for this appointment.");
          return;
        }
        try {
          await deletePatientEntirelyApi(appointment.patientId);
          toast.success("Patient deleted successfully!");
          loadData(); // Refresh
        } catch (err) {
          toast.error("Failed to delete patient");
        }
      }
    }
  };

  const handleSync = async () => {
    try {
      const res = await syncAppointmentsToDirectoryApi();
      toast.success(res.message);
      loadData();
    } catch (err) {
      toast.error("Sync failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-bg-primary p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-black text-text-primary tracking-tight leading-none">
              Appointments Management
            </h1>
            <p className="text-[14px] text-text-secondary mt-2">Manage schedules & real-time updates</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSync} className="px-5 h-[44px] rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 font-bold text-[13px] hover:bg-purple-600/20 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">sync</span> Sync Directory
            </button>
            <button onClick={() => setIsModalOpen(true)} className="px-6 h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">add</span> New Appointment
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex bg-bg-secondary rounded-lg p-1 border border-border-muted/50">
            {["month", "week", "day"].map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-md text-[13px] font-bold capitalize transition ${view === v ? "bg-blue-600 text-white shadow-lg" : "text-text-secondary hover:bg-surface-variant"}`}>{v}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-bg-secondary px-4 py-2 rounded-lg border border-border-muted/50">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="text-text-secondary hover:text-text-primary"><span className="material-symbols-outlined">chevron_left</span></button>
            <span className="text-[14px] font-bold text-text-primary min-w-[120px] text-center">{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="text-text-secondary hover:text-text-primary"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 rounded-lg border border-border-muted/50 text-[13px] font-bold text-text-secondary hover:bg-surface-variant">Today</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={view === "day" ? "lg:col-span-3" : "lg:col-span-2"}>
            {view === "day" ? (
              <DayView
                date={currentDate}
                appointments={appointments}
                onAppointmentClick={(a) => { setSelectedAppointment(a); setIsModalOpen(true); }}
                onAdd={() => { setSelectedAppointment(null); setIsModalOpen(true); }}
                loading={loading}
              />
            ) : (
              <CalendarView
                view={view}
                currentDate={currentDate}
                appointments={appointments}
                onDateClick={(d) => { setCurrentDate(d); setView("day"); }}
                onAppointmentClick={(a) => { setSelectedAppointment(a); setIsModalOpen(true); }}
                onDelete={handleDelete}
                onViewChange={setView}
                loading={loading}
              />
            )}
          </div>

          {view !== "day" && (
            <DailySchedule
              appointments={todaySchedule}
              stats={stats}
              onStatusChange={handleStatus}
              onEdit={(a) => { setSelectedAppointment(a); setIsModalOpen(true); }}
              onDelete={handleDelete}
              loading={loading}
            />
          )}
        </div>

        {isModalOpen && (
          <AppointmentModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedAppointment(null); }} onSubmit={handleSubmit} onDelete={handleDelete} appointment={selectedAppointment} selectedDate={currentDate} />
        )}
      </div>
    </Layout>
  );
}
