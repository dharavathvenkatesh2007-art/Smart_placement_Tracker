import { useState, useEffect } from 'react';
import axios from 'axios';
import commonStyles from '../style/common';
import useAuthStore from '../store/authStore';

const StudentDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [drives, setDrives] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  async function fetchData() {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [appRes, driveRes, profileRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/application/my-applications`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/drive/active-drives`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/student/profile`, { headers }),
      ]);

      setApplications(appRes.data.applications || []);
      setDrives(driveRes.data.drives || []);
      setProfileCompletion(calculateProfileCompletion(profileRes.data.payload || {}));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function calculateProfileCompletion(studentProfile) {
    const fields = [
      user?.name,
      user?.email,
      user?.phone,
      user?.college,
      studentProfile.skills?.length > 0,
      studentProfile.education?.length > 0,
      studentProfile.experience,
      studentProfile.projects,
      studentProfile.resumeURL,
    ];

    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }

  useEffect(() => {
    const timer = setTimeout(fetchData, 0);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <div className="text-center py-20">Loading...</div>;

  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;

  return (
    <div className={commonStyles.container + ' py-10'}>
      <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-slate-200 mb-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className={commonStyles.heading.h1}>Welcome back, {user?.name}</h1>
            <p className="text-slate-600 max-w-2xl">
              Your placement dashboard with latest drives, application updates, and interview status.
            </p>
          </div>
          <div className="rounded-3xl bg-blue-50 p-6 text-slate-900">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-700">Next interview</p>
            <p className="mt-3 text-2xl font-semibold">TCS Drive — 23 June</p>
            <p className="mt-2 text-slate-600">Prepare your resume and join the interview round.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-10">
        <div className={commonStyles.card + ' text-center'}>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Applications</p>
          <p className="mt-4 text-4xl font-bold text-blue-600">{applications.length}</p>
          <p className="mt-2 text-slate-600">Total applied</p>
        </div>
        <div className={commonStyles.card + ' text-center'}>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Accepted</p>
          <p className="mt-4 text-4xl font-bold text-green-600">{acceptedCount}</p>
          <p className="mt-2 text-slate-600">Offers received</p>
        </div>
        <div className={commonStyles.card + ' text-center'}>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Active Drives</p>
          <p className="mt-4 text-4xl font-bold text-yellow-600">{drives.length}</p>
          <p className="mt-2 text-slate-600">Open opportunities</p>
        </div>
        <div className={commonStyles.card + ' text-center'}>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Profile</p>
          <p className="mt-4 text-4xl font-bold text-purple-600">{profileCompletion}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-purple-600" style={{ width: `${profileCompletion}%` }} />
          </div>
          <p className="mt-2 text-slate-600">
            {profileCompletion === 100 ? 'Complete profile' : 'Complete your profile'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] mb-10">
        <div className={commonStyles.card}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={commonStyles.heading.h2}>Active Drives</h2>
              <p className="text-slate-600">Explore the latest placement drives matching your profile.</p>
            </div>
          </div>
          {drives.length > 0 ? (
            <div className="grid gap-4">
              {drives.map((drive) => (
                <div key={drive._id} className="rounded-3xl border border-slate-200 p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-blue-600 font-semibold uppercase tracking-[0.2em]">{drive.companyName}</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">{drive.position}</h3>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">{drive.status}</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <p className="text-slate-600"><strong>CTC:</strong> ₹{drive.ctc} LPA</p>
                    <p className="text-slate-600"><strong>Location:</strong> {drive.location}</p>
                    <p className="text-slate-600"><strong>Deadline:</strong> {new Date(drive.deadline).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => window.location.assign(`/drive/${drive._id}`)}
                    className={commonStyles.button.primary + ' mt-6'}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">No active drives available at the moment.</p>
          )}
        </div>

        <div className={commonStyles.card}>
          <h2 className={commonStyles.heading.h2}>My Applications</h2>
          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-sm uppercase tracking-[0.2em] text-slate-500">
                    <th className="pb-3">Company</th>
                    <th className="pb-3">Position</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id} className="bg-slate-50 rounded-3xl">
                      <td className="p-4 text-slate-700">{app.companyName}</td>
                      <td className="p-4 text-slate-700">{app.position}</td>
                      <td className="p-4">
                        <span className={commonStyles.badge[app.status] || commonStyles.badge.primary}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{new Date(app.appliedOn).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-600">You have not applied to any drive yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
