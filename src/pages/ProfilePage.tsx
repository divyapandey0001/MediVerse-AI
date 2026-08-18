import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  FileText,
  Calculator,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Heart,
  Shield,
  LogOut,
  AlertCircle,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { LabReportAnalysis, BmiRecord, Appointment } from '../types.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, token, logout, updateProfile, setActiveReport } = useAuth();

  const [reports, setReports] = useState<LabReportAnalysis[]>([]);
  const [bmiRecords, setBmiRecords] = useState<BmiRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAge(user.age?.toString() || '');
      setGender(user.gender || '');
      setBloodGroup(user.bloodGroup || '');
      setAllergies(user.allergies || '');
      setEmergencyContact(user.emergencyContact || '');
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [token]);

  const fetchUserData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [repRes, bmiRes, apptRes] = await Promise.all([
        fetch('/api/reports', { headers }),
        fetch('/api/bmi', { headers }),
        fetch('/api/appointments', { headers })
      ]);

      if (repRes.ok) {
        const repData = await repRes.json();
        setReports(repData.reports || []);
      }
      if (bmiRes.ok) {
        const bmiData = await bmiRes.json();
        setBmiRecords(bmiData.records || []);
      }
      if (apptRes.ok) {
        const apptData = await apptRes.json();
        setAppointments(apptData.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    const res = await updateProfile({
      name,
      phone,
      age: age ? Number(age) : undefined,
      gender,
      bloodGroup,
      allergies,
      emergencyContact
    });

    if (res.success) {
      setProfileMsg('Profile updated successfully.');
      setIsEditingProfile(false);
    } else {
      setProfileMsg(res.error || 'Failed to update profile.');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to permanently delete this report analysis?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  const handleDeleteBmi = async (recordId: string) => {
    try {
      const res = await fetch(`/api/bmi/${recordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBmiRecords(prev => prev.filter(r => r.id !== recordId));
      }
    } catch (err) {
      console.error('Failed to delete BMI record:', err);
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAppointments(prev =>
          prev.map(a => (a.id === apptId ? { ...a, status: 'Cancelled' } : a))
        );
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  const handleViewReportInAnalyzer = (report: LabReportAnalysis) => {
    setActiveReport(report);
    onNavigate('lab-report');
  };

  if (!user) {
    return (
      <div id="profile-unauth" className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <UserIcon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign in to Access Your Health Profile</h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            Log in to view and manage your uploaded lab reports, BMI tracking, and doctor appointments securely.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onNavigate('login')}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              Login
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="flex-1 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="profile-dashboard-page" className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* User Identity Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {user.phone}
                  </span>
                )}
                <span>• Member since {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Clinical Profile Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Age & Gender</p>
            <p className="text-sm font-bold text-slate-800">
              {user.age ? `${user.age} yrs` : 'Not specified'} {user.gender ? `• ${user.gender}` : ''}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Blood Group</p>
            <p className="text-sm font-bold text-slate-800">
              {user.bloodGroup || 'Not set'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Allergies</p>
            <p className="text-sm font-bold text-slate-800 truncate">
              {user.allergies || 'None reported'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Emergency Contact</p>
            <p className="text-sm font-bold text-slate-800 truncate">
              {user.emergencyContact || 'Not set'}
            </p>
          </div>
        </div>

        {/* Section 1: Previous Lab Report Analyses */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Saved Lab Report Analyses</h2>
            </div>
            <button
              onClick={() => onNavigate('lab-report')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>+ Upload New Report</span>
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs sm:text-sm space-y-2">
              <p>No lab reports analyzed yet. New accounts start completely empty.</p>
              <button
                onClick={() => onNavigate('lab-report')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Upload your first medical report
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(rep => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{rep.fileName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rep.urgencyLevel === 'Routine'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rep.urgencyLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{rep.healthSummary}</p>
                    <p className="text-[11px] text-slate-400">
                      Analyzed on {new Date(rep.uploadedAt).toLocaleDateString()} • {rep.testResults.length} test parameters
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleViewReportInAnalyzer(rep)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      View Report
                    </button>
                    <button
                      onClick={() => handleDeleteReport(rep.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Scheduled Appointments */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Doctor Appointments</h2>
            </div>
            <button
              onClick={() => onNavigate('appointment')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>+ Book Appointment</span>
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs sm:text-sm space-y-2">
              <p>No appointments booked yet.</p>
              <button
                onClick={() => onNavigate('appointment')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Schedule a consultation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(appt => (
                <div
                  key={appt.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{appt.doctorName}</span>
                      <span className="text-xs text-blue-600 font-medium">({appt.specialty})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          appt.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Date: <strong>{appt.appointmentDate}</strong> at <strong>{appt.appointmentTime}</strong> • Booking ID: <span className="font-mono">{appt.appointmentCode}</span>
                    </p>
                    {appt.reason && <p className="text-xs text-slate-500">Reason: {appt.reason}</p>}
                  </div>

                  {appt.status === 'Confirmed' && (
                    <button
                      onClick={() => handleCancelAppointment(appt.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold self-end sm:self-center transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: BMI Tracking History */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">BMI Tracking Log</h2>
            </div>
            <button
              onClick={() => onNavigate('bmi')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>+ Calculate New BMI</span>
            </button>
          </div>

          {bmiRecords.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs sm:text-sm space-y-2">
              <p>No BMI logs saved yet.</p>
              <button
                onClick={() => onNavigate('bmi')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Calculate your BMI
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Height</th>
                    <th className="py-3 px-4">Weight</th>
                    <th className="py-3 px-4">BMI Value</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bmiRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(rec.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-800">{rec.heightCm} cm</td>
                      <td className="py-3 px-4 text-slate-800">{rec.weightKg} kg</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{rec.bmi}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{rec.category}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteBmi(rec.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Edit Profile */}
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Edit Personal Health Profile</h3>

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="">Select</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Blood Group
                    </label>
                    <input
                      type="text"
                      value={bloodGroup}
                      onChange={e => setBloodGroup(e.target.value)}
                      placeholder="e.g. O+, A-"
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Known Allergies
                  </label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={e => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Peanuts, Sulfa drugs"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Contact Name & Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={e => setEmergencyContact(e.target.value)}
                    placeholder="e.g. John Doe +1 (555) 019-2834"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                {profileMsg && <p className="text-xs text-blue-600">{profileMsg}</p>}

                <div className="flex gap-2 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <DisclaimerBanner />
      </div>
    </div>
  );
};
