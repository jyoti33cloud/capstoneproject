import { useState, useEffect } from 'react';
import api from '../api';

export default function OrgReportsManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [reportData, setReportData] = useState(null);
  const [clientsData, setClientsData] = useState([]);
  const [therapistsData, setTherapistsData] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  async function fetchReports() {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const { data } = await api.get('/org-reports/overview');
        setReportData(data);
      } else if (activeTab === 'clients') {
        const { data } = await api.get('/org-reports/clients');
        setClientsData(data.clients);
      } else if (activeTab === 'therapists') {
        const { data } = await api.get('/org-reports/therapist-performance');
        setTherapistsData(data.therapists);
      } else if (activeTab === 'trends') {
        const [trendsRes, revenueRes] = await Promise.all([
          api.get('/org-reports/monthly-trends'),
          api.get('/org-reports/revenue')
        ]);
        setTrendsData(trendsRes.data.trends);
        setRevenueData(revenueRes.data.revenue);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setLoading(false);
    }
  }

  async function exportToPDF() {
    try {
      const jspdfModule = await import('jspdf');
      const html2canvasModule = await import('html2canvas');

      const jsPDF = jspdfModule.jsPDF;
      const html2canvas = html2canvasModule.default;

      const element = document.getElementById('report-content');
      if (!element) {
        alert('Report content not found');
        return;
      }

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Organization-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Report exported to PDF successfully');
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF export requires jspdf and html2canvas libraries. Install with: npm install jspdf html2canvas');
    }
  }

  async function exportToExcel() {
    try {
      const xlsxModule = await import('xlsx');
      const XLSX = xlsxModule.default;

      if (activeTab === 'overview') {
        const ws = XLSX.utils.json_to_sheet([
          { Category: 'Clients Served', Value: reportData?.clients_served?.total_clients },
          { Category: 'Active Clients (30d)', Value: reportData?.clients_served?.active_clients_30d },
          { Category: 'Active Clients (7d)', Value: reportData?.clients_served?.active_clients_7d },
          { Category: 'Total Sessions', Value: reportData?.therapy_sessions?.total_sessions },
          { Category: 'Completed Sessions', Value: reportData?.therapy_sessions?.completed_sessions },
          { Category: 'Completion Rate', Value: `${reportData?.appointment_statistics?.completion_rate}%` },
          { Category: 'Cancellation Rate', Value: `${reportData?.appointment_statistics?.cancellation_rate}%` },
          { Category: 'Total Events', Value: reportData?.workshop_attendance?.total_events },
          { Category: 'Total Registrations', Value: reportData?.workshop_attendance?.total_registrations },
          { Category: 'Attendance Rate', Value: `${reportData?.workshop_attendance?.attendance_rate}%` }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Overview');
        XLSX.writeFile(wb, `Organization-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (activeTab === 'clients') {
        const ws = XLSX.utils.json_to_sheet(clientsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clients');
        XLSX.writeFile(wb, `Clients-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (activeTab === 'therapists') {
        const ws = XLSX.utils.json_to_sheet(therapistsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Therapists');
        XLSX.writeFile(wb, `Therapists-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
      }
      alert('Report exported to Excel successfully');
    } catch (err) {
      console.error('Excel export error:', err);
      alert('Excel export requires xlsx library. Install with: npm install xlsx');
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'clients', label: 'Clients' },
          { id: 'therapists', label: 'Therapist Performance' },
          { id: 'trends', label: 'Trends & Revenue' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <button
          onClick={exportToPDF}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
        >
          Export PDF
        </button>
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          Export Excel
        </button>
      </div>

      {/* Report Content */}
      <div id="report-content" className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && !loading && reportData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Organization Report</h2>
            <p className="text-sm text-slate-600">Generated: {new Date(reportData.generated_at).toLocaleString()}</p>

            {/* Clients Served */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Clients Served</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBox label="Total Clients" value={reportData.clients_served.total_clients} />
                <StatBox label="Active (Last 30 Days)" value={reportData.clients_served.active_clients_30d} />
                <StatBox label="Active (Last 7 Days)" value={reportData.clients_served.active_clients_7d} />
              </div>
            </div>

            {/* Therapy Sessions */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Therapy Sessions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBox label="Total Sessions" value={reportData.therapy_sessions.total_sessions} />
                <StatBox label="Completed" value={reportData.therapy_sessions.completed_sessions} />
                <StatBox label="Avg Duration (Hours)" value={reportData.therapy_sessions.avg_session_duration} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <StatBox label="Scheduled Sessions" value={reportData.therapy_sessions.scheduled_sessions} />
                <StatBox label="Cancelled Sessions" value={reportData.therapy_sessions.cancelled_sessions} />
              </div>
            </div>

            {/* Appointment Statistics */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Appointment Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBox label="Completion Rate" value={`${reportData.appointment_statistics.completion_rate}%`} />
                <StatBox label="Cancellation Rate" value={`${reportData.appointment_statistics.cancellation_rate}%`} />
                <StatBox label="Avg Booking Advance (Days)" value={Math.round(reportData.appointment_statistics.avg_booking_advance_days || 0)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <StatBox label="Appointments Today" value={reportData.appointment_statistics.appointments_today} />
                <StatBox label="This Week" value={reportData.appointment_statistics.appointments_this_week} />
                <StatBox label="This Month" value={reportData.appointment_statistics.appointments_this_month} />
              </div>
            </div>

            {/* Workshop Attendance */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Workshop & Event Attendance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBox label="Total Events" value={reportData.workshop_attendance.total_events} />
                <StatBox label="Workshops" value={reportData.workshop_attendance.total_workshops} />
                <StatBox label="Parent Trainings" value={reportData.workshop_attendance.parent_trainings} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <StatBox label="Total Registrations" value={reportData.workshop_attendance.total_registrations} />
                <StatBox label="Total Capacity" value={reportData.workshop_attendance.total_capacity} />
                <StatBox label="Attendance Rate" value={`${reportData.workshop_attendance.attendance_rate}%`} />
              </div>
            </div>

            {/* Therapist Workload */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Therapist Workload</h3>
              {reportData.therapist_workload.length === 0 ? (
                <p className="text-slate-600">No therapist data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Therapist</th>
                        <th className="px-4 py-2 text-left">Total</th>
                        <th className="px-4 py-2 text-left">Completed</th>
                        <th className="px-4 py-2 text-left">Upcoming</th>
                        <th className="px-4 py-2 text-left">Clients</th>
                        <th className="px-4 py-2 text-left">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportData.therapist_workload.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium">{t.name}</td>
                          <td className="px-4 py-2">{t.total_appointments}</td>
                          <td className="px-4 py-2">{t.completed}</td>
                          <td className="px-4 py-2">{t.upcoming}</td>
                          <td className="px-4 py-2">{t.unique_clients}</td>
                          <td className="px-4 py-2">{parseFloat(t.avg_duration).toFixed(2)}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Service Utilization */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Service Utilization</h3>
              {reportData.service_utilization.length === 0 ? (
                <p className="text-slate-600">No service data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Service</th>
                        <th className="px-4 py-2 text-left">Clients Using</th>
                        <th className="px-4 py-2 text-left">Sessions</th>
                        <th className="px-4 py-2 text-left">Usage %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportData.service_utilization.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium">{s.name}</td>
                          <td className="px-4 py-2">{s.clients_using}</td>
                          <td className="px-4 py-2">{s.total_sessions}</td>
                          <td className="px-4 py-2">{s.usage_percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLIENTS TAB */}
        {activeTab === 'clients' && !loading && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Client Report</h2>
            {clientsData.length === 0 ? (
              <p className="text-slate-600">No client data</p>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Sessions</th>
                      <th className="px-4 py-2 text-left">Completed</th>
                      <th className="px-4 py-2 text-left">Therapists</th>
                      <th className="px-4 py-2 text-left">First</th>
                      <th className="px-4 py-2 text-left">Last</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {clientsData.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium">{c.name}</td>
                        <td className="px-4 py-2 text-xs">{c.email}</td>
                        <td className="px-4 py-2">{c.total_sessions}</td>
                        <td className="px-4 py-2">{c.completed_sessions}</td>
                        <td className="px-4 py-2 text-xs">{c.therapists}</td>
                        <td className="px-4 py-2 text-xs">{new Date(c.first_session).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-xs">{new Date(c.last_session).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* THERAPISTS TAB */}
        {activeTab === 'therapists' && !loading && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Therapist Performance Report</h2>
            {therapistsData.length === 0 ? (
              <p className="text-slate-600">No therapist data</p>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Completed</th>
                      <th className="px-4 py-2 text-left">Completion %</th>
                      <th className="px-4 py-2 text-left">Clients</th>
                      <th className="px-4 py-2 text-left">Avg Hours</th>
                      <th className="px-4 py-2 text-left">Repeat %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {therapistsData.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium">{t.name}</td>
                        <td className="px-4 py-2">{t.total_appointments}</td>
                        <td className="px-4 py-2">{t.completed}</td>
                        <td className="px-4 py-2">{t.completion_rate}%</td>
                        <td className="px-4 py-2">{t.unique_clients}</td>
                        <td className="px-4 py-2">{parseFloat(t.avg_session_hours).toFixed(2)}</td>
                        <td className="px-4 py-2">{t.repeat_client_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TRENDS TAB */}
        {activeTab === 'trends' && !loading && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Trends & Revenue Report</h2>

            {revenueData && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue & Utilization</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatBox label="Paid Events" value={revenueData.total_paid_events} />
                  <StatBox label="Event Registrations" value={revenueData.total_event_participants} />
                  <StatBox label="Capacity Utilization" value={`${revenueData.capacity_utilization}%`} />
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Monthly Trends (Last 12 Months)</h3>
              {trendsData.length === 0 ? (
                <p className="text-slate-600">No trend data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Month</th>
                        <th className="px-4 py-2 text-left">Total Appointments</th>
                        <th className="px-4 py-2 text-left">Completed</th>
                        <th className="px-4 py-2 text-left">Unique Clients</th>
                        <th className="px-4 py-2 text-left">Active Therapists</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {trendsData.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium">
                            {new Date(t.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-2">{t.total_appointments}</td>
                          <td className="px-4 py-2">{t.completed_appointments}</td>
                          <td className="px-4 py-2">{t.unique_clients}</td>
                          <td className="px-4 py-2">{t.therapists_active}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-slate-600">Generating report...</div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
