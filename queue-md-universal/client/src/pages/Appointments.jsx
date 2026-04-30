import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useFacilityStore } from "../store/facilityStore";
import Layout from "../components/Layout";
import CalendarView from "../components/appointments/CalendarView";
import DailySchedule from "../components/appointments/DailySchedule";
import AppointmentModal from "../components/appointments/AppointmentModal";
import { socket } from "../services/socket";
import { fetchAppointments, fetchTodaySchedule, createAppointmentApi, updateAppointmentStatusApi, deleteAppointmentApi } from "../services/api";

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
      fetchTodaySchedule().then(d => { setTodaySchedule(d.appointments); setStats(d.stats); });
    });
    return () => socket.off("appointment_update");
  }, [facilityId, facilityType]);

  useEffect(() => { loadData(); }, [currentDate]);

  const handleCreate = async (formData) => {
    await createAppointmentApi(formData);
    setIsModalOpen(false);
    loadData();
  };

  const handleStatus = async (id, status) => {
    await updateAppointmentStatusApi(id, { status });
  };

  const handleDelete = async (id) => {
    if (confirm("Delete appointment?")) {
      await deleteAppointmentApi(id);
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
          <button onClick={() => setIsModalOpen(true)} className="px-6 h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">add</span> New Appointment
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex bg-bg-secondary rounded-lg p-1 border border-border-muted/50">
            {["month", "week", "day"].map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-md text-[13px] font-bold capitalize transition ${view === v ? "bg-blue-600 text-white shadow-lg" : "text-text-secondary hover:bg-surface-variant"}`}>{v}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-bg-secondary px-4 py-2 rounded-lg border border-border-muted/50">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="text-text-secondary hover:text-text-primary"><span className="material-symbols-outlined">chevron_left</span></button>
            <span className="text-[14px] font-bold text-text-primary min-w-[120px] text-center">{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="text-text-secondary hover:text-text-primary"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 rounded-lg border border-border-muted/50 text-[13px] font-bold text-text-secondary hover:bg-surface-variant">Today</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarView view={view} currentDate={currentDate} appointments={appointments} onDateClick={(d) => { setCurrentDate(d); setIsModalOpen(true); }} onAppointmentClick={(a) => { setSelectedAppointment(a); setIsModalOpen(true); }} loading={loading} />
          </div>
          <DailySchedule appointments={todaySchedule} stats={stats} onStatusChange={handleStatus} onEdit={(a) => { setSelectedAppointment(a); setIsModalOpen(true); }} onDelete={handleDelete} loading={loading} />
        </div>

        {isModalOpen && (
          <AppointmentModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedAppointment(null); }} onSubmit={handleCreate} appointment={selectedAppointment} selectedDate={currentDate} />
        )}
      </div>
    </Layout>
  );
}
