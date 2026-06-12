import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import commonStyles from '../style/common';
import useAuthStore from '../store/authStore';

const CompanyDashboard = () => {
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Modals state
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [driveForm, setDriveForm] = useState({
    position: '',
    ctc: '',
    location: '',
    jobType: 'Full-time',
    experience: 'Freshers',
    description: '',
    requirements: '',
    selectionProcess: '',
    deadline: '',
    startDate: '',
    openings: 1
  });

  const [showAppModal, setShowAppModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'PENDING',
    feedback: ''
  });
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [driveRes, appRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/drive/my-drives`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/application/drive-applications`, { headers }),
      ]);

      setDrives(driveRes.data.drives || []);
      setApplications(appRes.data.applications || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete drive
  const handleDeleteDrive = async (driveId) => {
    if (!window.confirm('Are you sure you want to delete this drive? This will delete all applications associated with it.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${import.meta.env.VITE_API_URL}/drive/${driveId}`, { headers });
      alert('Drive deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting drive:', error);
      alert('Failed to delete drive');
    }
  };

  // Open Drive Modal (Create)
  const handleOpenCreate = () => {
    setEditingDrive(null);
    setDriveForm({
      position: '',
      ctc: '',
      location: '',
      jobType: 'Full-time',
      experience: 'Freshers',
      description: '',
      requirements: '',
      selectionProcess: '',
      deadline: '',
      startDate: '',
      openings: 1
    });
    setShowDriveModal(true);
  };

  // Open Drive Modal (Edit)
  const handleOpenEdit = (drive) => {
    setEditingDrive(drive);
    setDriveForm({
      position: drive.position || '',
      ctc: drive.ctc || '',
      location: drive.location || '',
      jobType: drive.jobType || 'Full-time',
      experience: drive.experience || 'Freshers',
      description: drive.description || '',
      requirements: Array.isArray(drive.requirements) ? drive.requirements.join(', ') : '',
      selectionProcess: Array.isArray(drive.selectionProcess) ? drive.selectionProcess.join(', ') : '',
      deadline: drive.deadline ? new Date(drive.deadline).toISOString().split('T')[0] : '',
      startDate: drive.startDate ? new Date(drive.startDate).toISOString().split('T')[0] : '',
      openings: drive.openings || 1
    });
    setShowDriveModal(true);
  };

  // Submit Drive Form
  const handleDriveSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Validate inputs
      const payload = {
        ...driveForm,
        ctc: Number(driveForm.ctc),
        openings: Number(driveForm.openings)
      };

      if (editingDrive) {
        await axios.put(`${import.meta.env.VITE_API_URL}/drive/${editingDrive._id}`, payload, { headers });
        alert('Drive updated successfully');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/drive/create`, payload, { headers });
        alert('Drive created successfully and students notified');
      }

      setShowDriveModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving drive:', error);
      alert(error.response?.data?.message || 'Failed to save drive');
    }
  };

  // Open Review Application Modal
  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setReviewForm({
      status: app.status.toUpperCase(),
      feedback: app.feedback || ''
    });
    setShowAppModal(true);
  };

  // Submit Review Form
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `${import.meta.env.VITE_API_URL}/application/${selectedApp._id}/status`,
        reviewForm,
        { headers }
      );

      alert('Application status updated and student notified via email');
      setShowAppModal(false);
      fetchData();
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = status.toLowerCase();
    if (s === 'selected' || s === 'hired') return commonStyles.badge.success;
    if (s === 'shortlisted') return commonStyles.badge.warning;
    if (s === 'rejected') return commonStyles.badge.danger;
    return commonStyles.badge.primary;
  };

  if (isLoading) return <div className="text-center py-20 font-medium text-lg">Loading Dashboard Data...</div>;

  // Placement Analytics math
  const totalCTC = drives.reduce((acc, d) => acc + (d.ctc || 0), 0);
  const avgCTC = drives.length > 0 ? (totalCTC / drives.length).toFixed(1) : 0;
  const highestCTC = drives.length > 0 ? Math.max(...drives.map(d => d.ctc || 0)) : 0;
  const selectedApps = applications.filter(a => a.status === 'selected' || a.status === 'hired').length;
  const successRate = applications.length > 0 ? ((selectedApps / applications.length) * 100).toFixed(0) : 0;

  return (
    <div className={commonStyles.container + ' py-10'}>
      <div className={commonStyles.flexBetween + ' mb-8'}>
        <div>
          <h1 className={commonStyles.heading.h1}>Welcome, {user?.name}</h1>
          <p className="text-slate-600">Recruitment dashboard for managing placement drives and candidates.</p>
        </div>
        <button onClick={handleOpenCreate} className={commonStyles.button.primary}>
          + Create New Drive
        </button>
      </div>

      {/* Stats Section */}
      <div className={commonStyles.gridThreeCol + ' mb-6'}>
        <div className={commonStyles.card + ' text-center hover:scale-105 transform transition'}>
          <h3 className="text-4xl font-extrabold text-blue-600 mb-1">{drives.length}</h3>
          <p className="text-slate-600 font-medium">Job Drives Posted</p>
        </div>
        <div className={commonStyles.card + ' text-center hover:scale-105 transform transition'}>
          <h3 className="text-4xl font-extrabold text-indigo-600 mb-1">{applications.length}</h3>
          <p className="text-slate-600 font-medium">Total Applications</p>
        </div>
        <div className={commonStyles.card + ' text-center hover:scale-105 transform transition'}>
          <h3 className="text-4xl font-extrabold text-emerald-600 mb-1">
            {selectedApps}
          </h3>
          <p className="text-slate-600 font-medium">Candidates Selected</p>
        </div>
      </div>

      {/* Placement Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Average CTC Package</p>
            <h4 className="text-2xl font-bold text-slate-800 mt-2">₹{avgCTC} LPA</h4>
          </div>
          <span className="text-3xl">📊</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Highest CTC Offered</p>
            <h4 className="text-2xl font-bold text-slate-800 mt-2">₹{highestCTC} LPA</h4>
          </div>
          <span className="text-3xl">🔥</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Selection Success Rate</p>
            <h4 className="text-2xl font-bold text-slate-800 mt-2">{successRate}%</h4>
          </div>
          <span className="text-3xl">🎯</span>
        </div>
      </div>

      {/* My Drives Section */}
      <div className="mb-12">
        <h2 className={commonStyles.heading.h2 + ' mb-6'}>Active Drives</h2>
        {drives.length > 0 ? (
          <div className={commonStyles.gridTwoCol}>
            {drives.map((drive) => (
              <div key={drive._id} className={commonStyles.card + ' border border-slate-200 flex flex-col justify-between'}>
                <div>
                  <div className={commonStyles.flexBetween + ' mb-3'}>
                    <h3 className={commonStyles.heading.h3 + ' text-slate-900 mb-0 font-semibold'}>{drive.position}</h3>
                    <span className="rounded-full bg-cyan-100 text-cyan-800 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      {drive.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="space-y-2 text-slate-600 mb-6 text-sm">
                    <p><strong>CTC Package:</strong> ₹{drive.ctc} LPA</p>
                    <p><strong>Location:</strong> {drive.location}</p>
                    <p><strong>Experience:</strong> {drive.experience}</p>
                    <p><strong>Job Type:</strong> {drive.jobType}</p>
                    <p><strong>Openings:</strong> {drive.openings} vacancies</p>
                    <p><strong>Deadline:</strong> {new Date(drive.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-auto">
                  <button onClick={() => handleOpenEdit(drive)} className={commonStyles.button.secondary + ' flex-1 py-2 text-sm'}>
                    Edit Drive
                  </button>
                  <button onClick={() => handleDeleteDrive(drive._id)} className={commonStyles.button.danger + ' flex-1 py-2 text-sm bg-red-500 hover:bg-red-600'}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-3xl">
            <p className="text-slate-600">No active job drives posted yet.</p>
            <button onClick={handleOpenCreate} className="mt-4 text-blue-600 font-semibold hover:underline">
              Create your first placement drive now
            </button>
          </div>
        )}
      </div>

      {/* Recent Applications Section */}
      <div>
        <h2 className={commonStyles.heading.h2 + ' mb-6'}>Candidate Applications</h2>
        {applications.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-slate-700 text-sm font-semibold uppercase tracking-wider">
                    <th className="p-4 pl-6">Student Name</th>
                    <th className="p-4">Position</th>
                    <th className="p-4">College</th>
                    <th className="p-4">Resume</th>
                    <th className="p-4">Applied Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 pl-6 font-semibold">{app.studentName}</td>
                      <td className="p-4">{app.position}</td>
                      <td className="p-4 text-sm">{app.studentCollege || 'N/A'}</td>
                      <td className="p-4 text-sm">
                        {app.resumeURL ? (
                          <a href={app.resumeURL} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:text-blue-700">
                            View PDF
                          </a>
                        ) : (
                          <span className="text-slate-400">Not uploaded</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">{new Date(app.appliedOn).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={getStatusBadgeClass(app.status)}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setSelectedStudentProfile(app)}
                            className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 transition rounded-xl text-xs font-semibold border border-slate-200"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => navigate('/schedules', { state: { preSelectApplicationId: app._id } })}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition rounded-xl text-xs font-semibold"
                          >
                            Schedule Round
                          </button>
                          <button
                            onClick={() => handleOpenReview(app)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition rounded-xl text-xs font-semibold"
                          >
                            Review & Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-slate-500">
            No applicant submissions received yet.
          </div>
        )}
      </div>

      {/* 1. Drive Create/Edit Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            <div className="bg-blue-600 text-white p-6">
              <h3 className="text-2xl font-bold">{editingDrive ? 'Modify Job Drive' : 'Launch New Job Drive'}</h3>
              <p className="text-blue-100 text-sm mt-1">Provide the placement details and requirements below.</p>
            </div>

            <form onSubmit={handleDriveSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={commonStyles.formGroup}>
                  <label className={commonStyles.label}>Job Title / Position *</label>
                  <input
                    type="text"
                    required
                    value={driveForm.position}
                    onChange={(e) => setDriveForm({ ...driveForm, position: e.target.value })}
                    placeholder="e.g. Associate Software Engineer"
                    className={commonStyles.input}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={commonStyles.label}>CTC Package (LPA) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={driveForm.ctc}
                    onChange={(e) => setDriveForm({ ...driveForm, ctc: e.target.value })}
                    placeholder="e.g. 8.5"
                    className={commonStyles.input}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className={commonStyles.formGroup}>
                  <label className={commonStyles.label}>Location *</label>
                  <input
                    type="text"
                    required
                    value={driveForm.location}
                    onChange={(e) => setDriveForm({ ...driveForm, location: e.target.value })}
                    placeholder="e.g. Bangalore (Hybrid)"
                    className={commonStyles.input}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={commonStyles.label}>Experience Level</label>
                  <input
                    type="text"
                    value={driveForm.experience}
                    onChange={(e) => setDriveForm({ ...driveForm, experience: e.target.value })}
                    placeholder="e.g. Freshers / 0-1 Years"
                    className={commonStyles.input}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className={commonStyles.formGroup}>
                  <label className={commonStyles.label}>Job Type</label>
                  <select
                    value={driveForm.jobType}
                    onChange={(e) => setDriveForm({ ...driveForm, jobType: e.target.value })}
                    className={commonStyles.input}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={commonStyles.label}>Openings Vacancies</label>
                  <input
                    type="number"
                    value={driveForm.openings}
                    onChange={(e) => setDriveForm({ ...driveForm, openings: e.target.value })}
                    className={commonStyles.input}
                    min="1"
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={commonStyles.label}>Drive Status</label>
                  <select
                    value={driveForm.status}
                    onChange={(e) => setDriveForm({ ...driveForm, status: e.target.value })}
                    className={commonStyles.input}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Job Description</label>
                <textarea
                  value={driveForm.description}
                  onChange={(e) => setDriveForm({ ...driveForm, description: e.target.value })}
                  rows="4"
                  placeholder="Summarize key responsibilities, role information, etc."
                  className={commonStyles.textarea}
                />
              </div>

              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Skills / Requirements (Comma-separated)</label>
                <input
                  type="text"
                  value={driveForm.requirements}
                  onChange={(e) => setDriveForm({ ...driveForm, requirements: e.target.value })}
                  placeholder="e.g. React, Node.js, REST APIs"
                  className={commonStyles.input}
                />
              </div>

              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Selection Rounds (Comma-separated)</label>
                <input
                  type="text"
                  value={driveForm.selectionProcess}
                  onChange={(e) => setDriveForm({ ...driveForm, selectionProcess: e.target.value })}
                  placeholder="e.g. Resume Shortlisting, Coding Round, HR Interview"
                  className={commonStyles.input}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className={commonStyles.formGroup}>
                  <label className={commonStyles.label}>Drive Start Date</label>
                  <input
                    type="date"
                    value={driveForm.startDate}
                    onChange={(e) => setDriveForm({ ...driveForm, startDate: e.target.value })}
                    className={commonStyles.input}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={commonStyles.label}>Registration Deadline *</label>
                  <input
                    type="date"
                    required
                    value={driveForm.deadline}
                    onChange={(e) => setDriveForm({ ...driveForm, deadline: e.target.value })}
                    className={commonStyles.input}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={commonStyles.button.primary + ' py-2.5'}
                >
                  {editingDrive ? 'Save Changes' : 'Post Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Review Application Status Modal */}
      {showAppModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row my-8 max-h-[90vh]">

            {/* Left Column: Student Academic Profile */}
            <div className="flex-1 p-6 border-r border-slate-100 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-inner overflow-hidden shrink-0">
                  {selectedApp.studentDetails?.profileImageURL ? (
                    <img src={selectedApp.studentDetails.profileImageURL} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-blue-600 font-bold uppercase">{selectedApp.studentName.substring(0, 2)}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedApp.studentName}</h2>
                  <p className="text-sm text-slate-500">{selectedApp.studentEmail}</p>
                  {selectedApp.studentPhone && <p className="text-xs text-slate-450 mt-0.5">Phone: {selectedApp.studentPhone}</p>}
                </div>
              </div>

              <div className="space-y-6 text-sm text-slate-700">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p><strong>College:</strong> {selectedApp.studentCollege || 'N/A'}</p>
                  <p className="mt-1">
                    <strong>Resume Link:</strong>{' '}
                    {selectedApp.resumeURL ? (
                      <a href={selectedApp.resumeURL} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">
                        View Resume PDF 📄
                      </a>
                    ) : (
                      <span className="text-slate-400">Not uploaded</span>
                    )}
                  </p>
                  {(selectedApp.studentDetails?.linkedInLink || selectedApp.studentDetails?.gitHubLink) && (
                    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200">
                      {selectedApp.studentDetails?.linkedInLink && (
                        <a href={selectedApp.studentDetails.linkedInLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline">
                          LinkedIn Profile 🔗
                        </a>
                      )}
                      {selectedApp.studentDetails?.gitHubLink && (
                        <a href={selectedApp.studentDetails.gitHubLink} target="_blank" rel="noreferrer" className="text-xs text-slate-800 font-bold hover:underline">
                          GitHub Profile 🔗
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Academic Timeline / History */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Academic Timeline</h3>
                  {selectedApp.studentDetails?.education && selectedApp.studentDetails.education.length > 0 ? (
                    <div className="space-y-3">
                      {selectedApp.studentDetails.education.map((edu, idx) => (
                        <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                          <p className="font-semibold text-slate-850">{edu.degree}</p>
                          <p className="text-xs text-slate-500">{edu.institution} ({edu.yearOfPassing})</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs font-medium">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">CGPA: {edu.cgpa}/10</span>
                            {edu.branch && <span className="bg-slate-100 text-slate-655 px-2 py-0.5 rounded">Branch: {edu.branch}</span>}
                            {edu.rollNumber && <span className="bg-slate-100 text-slate-655 px-2 py-0.5 rounded">Roll No: {edu.rollNumber}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No education history details provided.</p>
                  )}
                </div>

                {/* Skills Section */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.studentDetails?.skills && selectedApp.studentDetails.skills.length > 0 ? (
                      selectedApp.studentDetails.skills.map((skill, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No skills listed.</span>
                    )}
                  </div>
                </div>

                {/* Experience & Projects */}
                {selectedApp.studentDetails?.experience && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Internships & Work Experience</h3>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">{selectedApp.studentDetails.experience}</p>
                  </div>
                )}
                {selectedApp.studentDetails?.projects && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Projects</h3>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">{selectedApp.studentDetails.projects}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recruitment Status Update */}
            <div className="w-full md:w-[350px] p-6 bg-slate-50 flex flex-col justify-between overflow-y-auto">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Review Candidate</h3>

                <form onSubmit={handleReviewSubmit} className="space-y-5">
                  <div className={commonStyles.formGroup}>
                    <label className={commonStyles.label}>Recruitment Decision *</label>
                    <select
                      value={reviewForm.status}
                      onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                      className={commonStyles.input}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="SHORTLISTED">SHORTLISTED</option>
                      <option value="SELECTED">SELECTED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div className={commonStyles.formGroup}>
                    <label className={commonStyles.label}>Remarks / Feedback</label>
                    <textarea
                      value={reviewForm.feedback}
                      onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                      className={commonStyles.textarea}
                      rows="6"
                      placeholder="Add assessment remarks for the student..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-200 justify-end">
                    <button type="button" onClick={() => setShowAppModal(false)} className={commonStyles.button.secondary + ' py-2 text-sm'}>
                      Cancel
                    </button>
                    <button type="submit" className={commonStyles.button.success + ' py-2 text-sm'}>
                      Save Status
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-8 text-[11px] text-slate-400 leading-snug">
                Assessment decision is recorded immediately. The candidate will receive a system dashboard notification and email confirmation of the updated recruitment status.
              </div>
            </div>

          </div>
        </div>
      )}
      {selectedStudentProfile && (
        <StudentProfileModal
          student={selectedStudentProfile}
          onClose={() => setSelectedStudentProfile(null)}
        />
      )}
    </div>
  );
};

// Reusable StudentProfileModal inside CompanyDashboard.jsx
const StudentProfileModal = ({ student, onClose }) => {
  if (!student) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-650 text-white p-6 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">Candidate Profile</h3>
            <p className="text-blue-100 text-xs mt-1">Detailed academic and professional credentials</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-200 text-3xl font-light leading-none">×</button>
        </div>
        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Basic Info */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-inner overflow-hidden shrink-0">
              {student.studentDetails?.profileImageURL ? (
                <img src={student.studentDetails.profileImageURL} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-blue-600 font-bold uppercase">{student.studentName.substring(0, 2)}</span>
              )}
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">{student.studentName}</h4>
              <p className="text-slate-500">{student.studentEmail}</p>
              {student.studentPhone && <p className="text-xs text-slate-450 mt-0.5">Phone: {student.studentPhone}</p>}
              <p className="text-xs text-slate-455">College: {student.studentCollege || 'N/A'}</p>
            </div>
          </div>
          {/* Links and Resume */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <p>
              <strong>Resume Link:</strong>{' '}
              {student.resumeURL ? (
                <a href={student.resumeURL} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">
                  View Resume PDF 📄
                </a>
              ) : (
                <span className="text-slate-400">Not uploaded</span>
              )}
            </p>
            {(student.studentDetails?.linkedInLink || student.studentDetails?.gitHubLink) && (
              <div className="flex gap-4 pt-2 border-t border-slate-200">
                {student.studentDetails?.linkedInLink && (
                  <a href={student.studentDetails.linkedInLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline">
                    LinkedIn Profile 🔗
                  </a>
                )}
                {student.studentDetails?.gitHubLink && (
                  <a href={student.studentDetails.gitHubLink} target="_blank" rel="noreferrer" className="text-xs text-slate-800 font-bold hover:underline">
                    GitHub Profile 🔗
                  </a>
                )}
              </div>
            )}
          </div>
          {/* Education Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Academic Timeline</h4>
            {student.studentDetails?.education && student.studentDetails.education.length > 0 ? (
              <div className="space-y-3">
                {student.studentDetails.education.map((edu, idx) => (
                  <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                    <p className="font-semibold text-slate-850">{edu.degree}</p>
                    <p className="text-xs text-slate-500">{edu.institution} ({edu.yearOfPassing})</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs font-medium">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">CGPA: {edu.cgpa}/10</span>
                      {edu.branch && <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded">Branch: {edu.branch}</span>}
                      {edu.rollNumber && <span className="bg-slate-100 text-slate-655 px-2 py-0.5 rounded">Roll No: {edu.rollNumber}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No education history details provided.</p>
            )}
          </div>
          {/* Skills */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Skills & Expertise</h4>
            <div className="flex flex-wrap gap-1.5">
              {student.studentDetails?.skills && student.studentDetails.skills.length > 0 ? (
                student.studentDetails.skills.map((skill, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No skills listed.</span>
              )}
            </div>
          </div>
          {/* Experience & Projects */}
          {student.studentDetails?.experience && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Internships & Work Experience</h4>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">{student.studentDetails.experience}</p>
            </div>
          )}
          {student.studentDetails?.projects && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Projects</h4>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">{student.studentDetails.projects}</p>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition text-sm">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
