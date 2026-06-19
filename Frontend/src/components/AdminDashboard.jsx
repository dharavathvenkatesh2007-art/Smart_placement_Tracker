import { useState, useEffect } from 'react';
import axios from 'axios';
import commonStyles from '../style/common';
import useAuthStore from '../store/authStore';
import ResumeLink from './ResumeLink';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalDrives: 0,
    totalApplications: 0,
    successRate: 0,
    avgCTC: 0,
    highestCTC: 0
  });

  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  
  // Search & filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBranchFilter, setStudentBranchFilter] = useState('all');
  const [companySearch, setCompanySearch] = useState('');
  const [driveSearch, setDriveSearch] = useState('');
  
  // Broadcast states
  const [broadcast, setBroadcast] = useState({
    title: '',
    message: '',
    targetRole: 'ALL'
  });
  
  // Modal for viewing student detail
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // JWT Flow visualizer step
  const [jwtStep, setJwtStep] = useState(1);
  
  const [isLoading, setIsLoading] = useState(true);

  async function fetchAdminData() {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [analyticsRes, studentsRes, companiesRes, drivesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/admin/analytics`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/students`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/companies`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/drives`, { headers })
      ]);

      setAnalytics(analyticsRes.data);
      setStudents(studentsRes.data.students || []);
      setCompanies(companiesRes.data.companies || []);
      setDrives(drivesRes.data.drives || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Toggle User Active Status (Deactivate / Activate)
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'suspend/block' : 'approve/reactivate';
    if (!window.confirm(`Are you sure you want to ${action} this user account?`)) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/users/${userId}/status`,
        { isUserActive: !currentStatus },
        { headers }
      );

      alert('User status updated successfully');
      await fetchAdminData();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update status');
    }
  };

  // Toggle Drive Active/Blocked Status
  const handleToggleDriveStatus = async (driveId, currentStatus) => {
    const isBlocked = currentStatus === 'BLOCKED';
    const nextStatus = isBlocked ? 'ACTIVE' : 'BLOCKED';
    const action = isBlocked ? 'reactivate' : 'suspend/block';
    
    if (!window.confirm(`Are you sure you want to ${action} this placement drive?`)) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/drives/${driveId}/status`,
        { status: nextStatus },
        { headers }
      );

      alert('Drive status updated successfully');
      await fetchAdminData();
    } catch (error) {
      console.error('Error updating drive status:', error);
      alert('Failed to update drive status');
    }
  };

  // Broadcast announcement
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.message) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/broadcast-notification`,
        broadcast,
        { headers }
      );

      alert(`${res.data.message} (${res.data.notifiedCount} users notified)`);
      setBroadcast({ title: '', message: '', targetRole: 'ALL' });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      alert('Failed to send broadcast');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-medium">Loading Administration Panel...</p>
        </div>
      </div>
    );
  }

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          student.email.toLowerCase().includes(studentSearch.toLowerCase());
    
    const hasTimeline = student.education && student.education.length > 0;
    const studentBranches = hasTimeline ? student.education.map(e => e.branch?.toLowerCase() || '') : [];
    
    const matchesBranch = studentBranchFilter === 'all' || 
                          studentBranches.some(b => b.includes(studentBranchFilter.toLowerCase()));
    
    return matchesSearch && matchesBranch;
  });

  // Filter companies
  const filteredCompanies = companies.filter(company => 
    company.companyName?.toLowerCase().includes(companySearch.toLowerCase()) ||
    company.email?.toLowerCase().includes(companySearch.toLowerCase())
  );

  // Filter drives
  const filteredDrives = drives.filter(drive => 
    drive.position?.toLowerCase().includes(driveSearch.toLowerCase()) ||
    drive.companyName?.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-slate-100 font-sans">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border-b border-teal-500/30 p-8">
        <div className={commonStyles.container + ' flex flex-col md:flex-row justify-between items-start md:items-center gap-4'}>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              System Administration Panel
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Oversee college placement pipelines, security controls, and registries.</p>
          </div>
          <span className="bg-teal-500/10 border border-teal-400/30 text-teal-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Role: System Administrator
          </span>
        </div>
      </div>

      <div className={commonStyles.container + ' py-10 flex flex-col lg:flex-row gap-8'}>
        
        {/* Sidebar Nav menu */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 space-y-2.5">
            <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Registry Modules</h3>
            
            {[
              { id: 'analytics', label: '📊 Dashboard Stats' },
              { id: 'students', label: '🎓 Student Registry' },
              { id: 'companies', label: '🏢 Corporate Registry' },
              { id: 'drives', label: '💼 Placement Drives' },
              { id: 'broadcast', label: '📢 Broadcast announcements' },
              { id: 'jwt-visualizer', label: '🔒 JWT Auth Flow' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition flex items-center gap-3 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
            
            <div className="mt-6 p-4 rounded-2xl bg-teal-950/40 border border-teal-500/20 text-xs">
              <p className="font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🔐</span> Admin Account Info
              </p>
              <p className="text-slate-350"><strong>Email:</strong> admin@tracker.com</p>
              <p className="text-slate-350 mt-1"><strong>Password:</strong> admin123</p>
              <p className="text-slate-400 mt-2.5 text-[10px] leading-relaxed">This is the default system administrator account seeded automatically.</p>
            </div>
          </div>
        </div>

        {/* Tab contents */}
        <div className="flex-grow">
          
          {/* Tab 1: Analytics Dashboard */}
          {activeTab === 'analytics' && (() => {
            const appStats = [
              { label: 'Applications', count: analytics.totalApplications || 0, color: '#0ea5e9' },
              { label: 'Shortlisted', count: analytics.applicationsByStatus?.SHORTLISTED || 0, color: '#f59e0b' },
              { label: 'Selected/Placed', count: analytics.selectedCount || 0, color: '#10b981' },
              { label: 'Rejected', count: analytics.applicationsByStatus?.REJECTED || 0, color: '#ef4444' }
            ];
            const maxCount = Math.max(...appStats.map(s => s.count), 5);

            return (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Students', value: analytics.totalStudents, emoji: '🎓', color: 'from-blue-500 to-indigo-500' },
                    { label: 'Registered HRs', value: analytics.totalCompanies, emoji: '🏢', color: 'from-purple-500 to-pink-500' },
                    { label: 'Placement Drives', value: analytics.totalDrives, emoji: '💼', color: 'from-teal-500 to-emerald-500' },
                    { label: 'Job Applications', value: analytics.totalApplications, emoji: '📄', color: 'from-amber-500 to-orange-500' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl hover:scale-[1.02] transition">
                      <div className={`absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-xl`}></div>
                      <span className="text-3xl">{stat.emoji}</span>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-4">{stat.label}</p>
                      <h3 className="text-3xl font-extrabold mt-2 text-white">{stat.value}</h3>
                    </div>
                  ))}
                </div>

                {/* SVG Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Pipeline bar chart */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl col-span-1 md:col-span-2 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">📊 Application Pipeline Funnel</h4>
                      <div className="h-64 flex items-end gap-6 md:gap-10 px-4 border-b border-slate-800 pb-2">
                        {appStats.map((item, idx) => {
                          const barHeight = (item.count / maxCount) * 100;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                              <div className="relative w-full flex justify-center">
                                <span className="absolute -top-8 bg-slate-950 text-teal-400 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition shadow border border-slate-800 pointer-events-none font-mono">
                                  {item.count}
                                </span>
                                <div 
                                  style={{ height: `${barHeight}%`, backgroundColor: item.color }} 
                                  className="w-full max-w-[48px] rounded-t-lg transition-all duration-500 ease-out hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                              </div>
                              <span className="text-[10px] md:text-xs font-semibold text-slate-400 text-center truncate w-full">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Placement Success Gauge */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">🎯 Selection Success Rate</h4>
                    <div className="flex items-center justify-center py-6 relative">
                      <svg className="w-40 h-40 transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="64"
                          className="stroke-slate-850 fill-transparent"
                          strokeWidth="12"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="64"
                          className="stroke-teal-500 fill-transparent transition-all duration-1000 ease-out"
                          strokeWidth="12"
                          strokeDasharray="402"
                          strokeDashoffset={402 - (402 * (analytics.successRate || 0)) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-4xl font-extrabold text-white">{analytics.successRate || 0}%</span>
                        <p className="text-[10px] text-slate-450 uppercase tracking-wider mt-1">Hired Success</p>
                      </div>
                    </div>
                    <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-850">
                      <strong>{analytics.selectedCount || 0}</strong> out of <strong>{analytics.totalApplications || 0}</strong> applicants selected.
                    </div>
                  </div>

                  {/* Drive status breakdown */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">💼 Drive Status Breakdown</h4>
                    <div className="space-y-4">
                      {[
                        { label: 'Active Drives', count: analytics.drivesByStatus?.ACTIVE || 0, color: 'bg-teal-500', barColor: 'from-teal-500 to-emerald-400' },
                        { label: 'Closed Drives', count: analytics.drivesByStatus?.CLOSED || 0, color: 'bg-slate-500', barColor: 'from-slate-600 to-slate-400' },
                        { label: 'Blocked Drives', count: analytics.drivesByStatus?.BLOCKED || 0, color: 'bg-red-500', barColor: 'from-red-600 to-red-400' }
                      ].map((item, idx) => {
                        const pct = analytics.totalDrives > 0 ? Math.round((item.count / analytics.totalDrives) * 100) : 0;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-355 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                                {item.label}
                              </span>
                              <span className="text-slate-450 font-mono">{item.count} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-slate-955 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${pct}%` }} 
                                className={`h-full bg-gradient-to-r ${item.barColor} rounded-full transition-all duration-700`}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-slate-500 pt-4 border-t border-slate-850 mt-4">
                      Total registered drives: <strong>{analytics.totalDrives || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Package stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Highest Package Offered', val: `₹${analytics.highestCTC} LPA`, icon: '🔥', text: 'Top drive value' },
                    { label: 'Average CTC Package', val: `₹${analytics.avgCTC} LPA`, icon: '📊', text: 'Across active drives' },
                    { label: 'Selection Success Rate', val: `${analytics.successRate}%`, icon: '🎯', text: 'Hired vs applied students' }
                  ].map((pkg, idx) => (
                    <div key={idx} className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-md flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{pkg.label}</p>
                        <h4 className="text-2xl font-bold mt-2 text-slate-100">{pkg.val}</h4>
                        <p className="text-slate-500 text-xs mt-1">{pkg.text}</p>
                      </div>
                      <span className="text-3xl p-3 bg-slate-800/40 rounded-2xl">{pkg.icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Tab 2: Student Registry */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search candidate name or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="w-full sm:w-60">
                  <select
                    value={studentBranchFilter}
                    onChange={(e) => setStudentBranchFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                  >
                    <option value="all">All Academic Branches</option>
                    <option value="Computer Science">Computer Science (CSE/IT)</option>
                    <option value="Electronics">Electronics (ECE/EEE)</option>
                    <option value="Mechanical">Mechanical (ME)</option>
                    <option value="Civil">Civil (CE)</option>
                  </select>
                </div>
              </div>

              {filteredStudents.length > 0 ? (
                <div className="bg-slate-900/40 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-left text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-850">
                          <th className="p-5">Student</th>
                          <th className="p-5">College details</th>
                          <th className="p-5">Resume file</th>
                          <th className="p-5">Social profile</th>
                          <th className="p-5">Access status</th>
                          <th className="p-5 text-right">Credentials</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {filteredStudents.map(student => (
                          <tr key={student._id} className="text-sm hover:bg-slate-900/30">
                            <td className="p-5 flex items-center gap-3">
                              <div className="w-10 h-10 bg-teal-500/10 border border-teal-400/20 rounded-full flex items-center justify-center font-bold text-teal-400 uppercase shrink-0">
                                {student.profileImageURL ? (
                                  <img src={student.profileImageURL} alt="photo" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  student.name.substring(0, 2)
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-200">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.email}</p>
                              </div>
                            </td>
                            <td className="p-5">
                              <p className="text-slate-300 font-medium">{student.college}</p>
                              <p className="text-xs text-slate-500">{student.phone}</p>
                            </td>
                            <td className="p-5">
                              <ResumeLink resumeURL={student.resumeURL} className="text-teal-400 hover:underline font-semibold flex items-center gap-1">PDF Resume</ResumeLink>
                            </td>
                            <td className="p-5">
                              <div className="flex gap-2">
                                {student.linkedInLink ? (
                                  <a href={student.linkedInLink} target="_blank" rel="noreferrer" className="text-xs bg-slate-850 hover:bg-slate-800 px-2.5 py-1 rounded text-teal-400">
                                    LinkedIn
                                  </a>
                                ) : (
                                  <span className="text-xs text-slate-600">No LinkedIn</span>
                                )}
                              </div>
                            </td>
                            <td className="p-5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                student.isUserActive 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/20' 
                                  : 'bg-red-500/10 text-red-400 border border-red-400/20'
                              }`}>
                                {student.isUserActive ? 'ACTIVE' : 'SUSPENDED'}
                              </span>
                            </td>
                            <td className="p-5 text-right space-x-2">
                              <button
                                onClick={() => setSelectedStudent(student)}
                                className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-teal-400 font-bold rounded-xl text-xs"
                              >
                                View CV Profile
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(student._id, student.isUserActive)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                                  student.isUserActive 
                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' 
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-400/20'
                                }`}
                              >
                                {student.isUserActive ? 'Block User' : 'Approve User'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-3xl text-slate-500 font-medium">
                  No matching student accounts found.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Corporate Registry */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl w-full max-w-sm">
                <input
                  type="text"
                  placeholder="Search company name or HR email..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              {filteredCompanies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredCompanies.map(company => (
                    <div key={company._id} className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-800 transition">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          {company.profileImageURL ? (
                            <img src={company.profileImageURL} alt="Logo" className="w-14 h-14 rounded-2xl object-cover border border-slate-800 bg-white" />
                          ) : (
                            <div className="w-14 h-14 bg-teal-500/10 border border-teal-400/20 rounded-2xl flex items-center justify-center font-bold text-teal-400 text-lg uppercase shadow-inner">
                              {company.companyName?.substring(0, 2).toUpperCase() || 'CO'}
                            </div>
                          )}
                          <div>
                            <h4 className="text-lg font-bold text-slate-100">{company.companyName}</h4>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {company.companyType || 'Corporate HR'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-850">
                          <p><strong>Corporate HR:</strong> {company.email}</p>
                          <p><strong>Contact Tel:</strong> {company.phone || "N/A"}</p>
                          <p><strong>Location:</strong> {company.location || "N/A"}</p>
                          {company.website && (
                            <p>
                              <strong>Website:</strong>{' '}
                              <a href={company.website} target="_blank" rel="noreferrer" className="text-teal-450 hover:underline">
                                {company.website}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 pt-5 mt-5 border-t border-slate-850/60 items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          company.isUserActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-400/20'
                        }`}>
                          {company.isUserActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                        <button
                          onClick={() => handleToggleUserStatus(company._id, company.isUserActive)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                            company.isUserActive 
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' 
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-400/20'
                          }`}
                        >
                          {company.isUserActive ? 'Block Company' : 'Approve Company'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-3xl text-slate-500 font-medium">
                  No matching company accounts found.
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Placement Drives */}
          {activeTab === 'drives' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl w-full max-w-sm">
                <input
                  type="text"
                  placeholder="Search drive position or company name..."
                  value={driveSearch}
                  onChange={(e) => setDriveSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              {filteredDrives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredDrives.map(drive => (
                    <div key={drive._id} className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-800 transition">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs text-teal-400 font-bold uppercase tracking-wider">{drive.companyName}</p>
                            <h4 className="text-lg font-bold text-slate-100 mt-1">{drive.position}</h4>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            drive.status === 'BLOCKED'
                              ? 'bg-red-500/10 text-red-400 border border-red-400/20'
                              : drive.status === 'CLOSED'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-teal-500/10 text-teal-400 border border-teal-400/20'
                          }`}>
                            {drive.status || 'ACTIVE'}
                          </span>
                        </div>
                        <div className="space-y-2 text-xs text-slate-400 pt-3 mt-3 border-t border-slate-850">
                          <p><strong>Salary Package:</strong> ₹{drive.ctc} LPA</p>
                          <p><strong>Job Location:</strong> {drive.location}</p>
                          <p><strong>Vacancy Openings:</strong> {drive.openings || 1}</p>
                          <p><strong>Min CGPA Requirement:</strong> {drive.minCGPA || 0}</p>
                          <p><strong>Deadline:</strong> {new Date(drive.deadline).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-850/60 flex justify-between items-center">
                        <button
                          onClick={() => handleToggleDriveStatus(drive._id, drive.status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            drive.status === 'BLOCKED'
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-400/20'
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {drive.status === 'BLOCKED' ? 'Activate' : 'Block'}
                        </button>
                        <button
                          onClick={() => window.location.assign(`/drive/${drive._id}`)}
                          className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-teal-400 text-xs font-bold rounded-xl"
                        >
                          View Parameters
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-3xl text-slate-500 font-medium">
                  No placement drives found matching search query.
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Broadcast announcements */}
          {activeTab === 'broadcast' && (
            <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-8 max-w-2xl shadow-xl">
              <h3 className="text-xl font-bold text-slate-100 mb-2">Publish System Announcement</h3>
              <p className="text-slate-450 text-xs mb-6">Write a title and custom message to send high-priority notifications instantly to users.</p>
              
              <form onSubmit={handleBroadcast} className="space-y-5">
                <div className={commonStyles.formGroup}>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Announcement Target Users</label>
                  <select
                    value={broadcast.targetRole}
                    onChange={(e) => setBroadcast({ ...broadcast, targetRole: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 text-slate-300"
                  >
                    <option value="ALL">All Accounts (Students & Corporate HRs)</option>
                    <option value="STUDENT">Student Pool Only</option>
                    <option value="COMPANY">Recruiter Accounts Only</option>
                  </select>
                </div>

                <div className={commonStyles.formGroup}>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Announcement Title</label>
                  <input
                    type="text"
                    required
                    value={broadcast.title}
                    onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                    placeholder="e.g. Schedule Update: Coding Round Rescheduled"
                    className="w-full bg-slate-950 border border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 text-slate-300"
                  />
                </div>

                <div className={commonStyles.formGroup}>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Broadcast message</label>
                  <textarea
                    required
                    rows="6"
                    value={broadcast.message}
                    onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                    placeholder="Provide full description, link details, or requirements..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 text-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-650 hover:to-emerald-700 text-slate-950 font-bold rounded-2xl transition shadow-lg shadow-teal-500/10 text-sm"
                >
                  Broadcast Announcement Now
                </button>
              </form>
            </div>
          )}

          {/* Tab 6: JWT Auth Flow Visualizer */}
          {activeTab === 'jwt-visualizer' && (
            <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-8 max-w-4xl shadow-xl space-y-8">
              <div>
                <h3 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  JWT Authentication Flow Handshake
                </h3>
                <p className="text-slate-450 text-xs mt-1">Interactive step-by-step diagram detailing token exchange and RBAC middleware verification.</p>
              </div>

              {/* Progress Stepper Bar */}
              <div className="flex items-center justify-between border-b border-slate-850 pb-6">
                {[1, 2, 3, 4, 5].map(step => (
                  <button
                    key={step}
                    onClick={() => setJwtStep(step)}
                    className={`w-10 h-10 rounded-full font-bold text-sm transition flex items-center justify-center border ${
                      jwtStep === step 
                        ? 'bg-teal-500 border-teal-400 text-slate-950 shadow-md shadow-teal-500/20' 
                        : jwtStep > step 
                          ? 'bg-teal-900/30 border-teal-500/30 text-teal-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>

              {/* Active Step Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
                
                {/* Text Panel */}
                <div className="space-y-4">
                  <span className="text-[10px] bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-teal-400/20">
                    Step {jwtStep} of 5
                  </span>
                  
                  {jwtStep === 1 && (
                    <>
                      <h4 className="text-xl font-bold text-slate-200">1. Credentials Submission</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        The user fills in their email and password credentials. The Client application packages this into a JSON payload and makes an HTTPS POST request to the backend server.
                      </p>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs font-mono text-slate-400 space-y-1">
                        <p className="text-teal-400">POST /api/user/login HTTP/1.1</p>
                        <p>Content-Type: application/json</p>
                        <p className="text-slate-500 mt-2">{"{"}</p>
                        <p className="pl-4">"email": "admin@tracker.com",</p>
                        <p className="pl-4">"password": "••••••••"</p>
                        <p className="text-slate-500">{"}"}</p>
                      </div>
                    </>
                  )}

                  {jwtStep === 2 && (
                    <>
                      <h4 className="text-xl font-bold text-slate-200">2. Server Signature & JWT Issue</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        The Server receives the payload, queries MongoDB, checks the bcrypt hash, and generates a signed JSON Web Token (JWT) combining user metadata (`id`, `role`, `email`) and private `SECRET_KEY`.
                      </p>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs font-mono text-slate-400 space-y-1">
                        <p className="text-emerald-400">HTTP/1.1 200 OK</p>
                        <p>Content-Type: application/json</p>
                        <p className="text-slate-500 mt-2">{"{"}</p>
                        <p className="pl-4">"message": "Login successful",</p>
                        <p className="pl-4 text-amber-400">"token": "eyJhbGciOiJIUzI1NiIsIn..."</p>
                        <p className="text-slate-500">{"}"}</p>
                      </div>
                    </>
                  )}

                  {jwtStep === 3 && (
                    <>
                      <h4 className="text-xl font-bold text-slate-200">3. Handshake & Local Storage</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        The Client application receives the token response, saves it to `localStorage` (or stores it in HTTP-only session cookies), and updates the global Zustand store to set the user state to authenticated.
                      </p>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs font-mono text-slate-400 space-y-1">
                        <p className="text-slate-550">// Client Side Script</p>
                        <p className="text-teal-400">localStorage.setItem('token', response.data.token);</p>
                        <p>useAuthStore.setState({ "{" } isAuthenticated: true, userRole: 'admin' { "}" });</p>
                      </div>
                    </>
                  )}

                  {jwtStep === 4 && (
                    <>
                      <h4 className="text-xl font-bold text-slate-200">4. Client Request with Auth Header</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        For subsequent API resource requests (such as loading admin analytics), the client extracts the JWT and inserts it as a Bearer Token in the HTTP Request Header.
                      </p>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs font-mono text-slate-400 space-y-1">
                        <p className="text-teal-400">GET /api/admin/analytics HTTP/1.1</p>
                        <p className="text-amber-400">Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...</p>
                        <p>Accept: application/json, text/plain</p>
                      </div>
                    </>
                  )}

                  {jwtStep === 5 && (
                    <>
                      <h4 className="text-xl font-bold text-slate-200">5. Middleware Decryption & RBAC Verification</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        The `verifyToken("ADMIN")` middleware intercepts the request, decrypts the signature using the `SECRET_KEY`, checks if the token is valid, parses the metadata role, and yields access to the query.
                      </p>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-xs font-mono text-slate-450 space-y-1">
                        <p className="text-slate-500">// verifyToken Middleware Decryption</p>
                        <p>const decoded = jwt.verify(token, process.env.SECRET_KEY);</p>
                        <p className="text-emerald-400">console.log(decoded.role); // Yields: "ADMIN"</p>
                        <p className="text-emerald-400">next(); // Success access allowed</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Animated Diagram Panel */}
                <div className="bg-slate-950 rounded-3xl border border-slate-850 p-6 aspect-square flex flex-col items-center justify-center relative overflow-hidden">
                  
                  {/* Client Block */}
                  <div className={`p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl w-40 text-center font-bold transition duration-300 ${
                    [1, 3, 4].includes(jwtStep) ? 'bg-teal-500/20 border-teal-400 text-teal-400 shadow-md shadow-teal-500/10Scale' : 'text-slate-400'
                  }`}>
                    💻 Client App
                  </div>

                  {/* Flow Arrow Wrapper */}
                  <div className="h-20 w-0.5 bg-slate-850 relative flex items-center justify-center my-2">
                    {jwtStep === 1 && (
                      <div className="absolute top-0 w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce mt-1"></div>
                    )}
                    {jwtStep === 2 && (
                      <div className="absolute bottom-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce mb-1"></div>
                    )}
                    {jwtStep === 3 && (
                      <div className="absolute bottom-0 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping"></div>
                    )}
                    {jwtStep === 4 && (
                      <div className="absolute top-0 w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce mt-1"></div>
                    )}
                    {jwtStep === 5 && (
                      <div className="absolute bottom-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
                    )}
                  </div>

                  {/* Server Block */}
                  <div className={`p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl w-40 text-center font-bold transition duration-300 ${
                    [2, 5].includes(jwtStep) ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-md shadow-emerald-500/10Scale' : 'text-slate-400'
                  }`}>
                    ⚙️ Express Server
                  </div>
                </div>

              </div>

              {/* Back / Next buttons */}
              <div className="flex justify-between pt-4 border-t border-slate-850">
                <button
                  disabled={jwtStep === 1}
                  onClick={() => setJwtStep(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl"
                >
                  Previous Step
                </button>
                <button
                  disabled={jwtStep === 5}
                  onClick={() => setJwtStep(prev => prev + 1)}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-teal-500/10"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Student Profile CV Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-extrabold">{selectedStudent.name}</h3>
                <p className="text-slate-900 text-xs mt-0.5">{selectedStudent.email} • {selectedStudent.phone}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-950 hover:text-white text-3xl font-light leading-none">×</button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
              
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                <p><strong>Institution:</strong> {selectedStudent.college}</p>
                <p className="mt-1">
                  <strong>Resume file:</strong>{' '}
                  <ResumeLink resumeURL={selectedStudent.resumeURL} className="font-semibold text-teal-400 hover:underline">Download CV PDF</ResumeLink>
                </p>
                {(selectedStudent.linkedInLink || selectedStudent.gitHubLink) && (
                  <div className="flex gap-4 mt-3 pt-3 border-t border-slate-850">
                    {selectedStudent.linkedInLink && (
                      <a href={selectedStudent.linkedInLink} target="_blank" rel="noreferrer" className="text-xs text-teal-400 font-bold hover:underline">
                        LinkedIn 🔗
                      </a>
                    )}
                    {selectedStudent.gitHubLink && (
                      <a href={selectedStudent.gitHubLink} target="_blank" rel="noreferrer" className="text-xs text-slate-300 font-bold hover:underline">
                        GitHub 🔗
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Education history */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Education History</h4>
                {selectedStudent.education && selectedStudent.education.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.education.map((edu, idx) => (
                      <div key={idx} className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                        <p className="font-semibold text-slate-200">{edu.degree}</p>
                        <p className="text-xs text-slate-500">{edu.institution} ({edu.yearOfPassing})</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs font-semibold text-slate-400">
                          <span className="bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded border border-teal-500/20">CGPA: {edu.cgpa}/10</span>
                          {edu.branch && <span className="bg-slate-800 text-slate-350 px-2 py-0.5 rounded">Branch: {edu.branch}</span>}
                          {edu.rollNumber && <span className="bg-slate-800 text-slate-350 px-2 py-0.5 rounded">Roll No: {edu.rollNumber}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No academic timeline recorded.</p>
                )}
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.skills && selectedStudent.skills.length > 0 ? (
                    selectedStudent.skills.map((skill, idx) => (
                      <span key={idx} className="bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full text-xs font-bold border border-teal-500/20">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No skills listed.</span>
                  )}
                </div>
              </div>

              {/* Internships */}
              {selectedStudent.experience && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Work Experience & Internships</h4>
                  <p className="text-xs text-slate-300 bg-slate-950/40 p-4 rounded-2xl border border-slate-850 whitespace-pre-wrap leading-relaxed">{selectedStudent.experience}</p>
                </div>
              )}

              {/* Projects */}
              {selectedStudent.projects && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Projects</h4>
                  <p className="text-xs text-slate-300 bg-slate-950/40 p-4 rounded-2xl border border-slate-850 whitespace-pre-wrap leading-relaxed">{selectedStudent.projects}</p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex justify-end">
              <button onClick={() => setSelectedStudent(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">
                Close CV Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

