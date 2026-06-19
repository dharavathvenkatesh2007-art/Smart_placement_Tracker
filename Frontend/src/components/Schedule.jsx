import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import commonStyles from '../style/common';
import useAuthStore from '../store/authStore';
import ResumeLink from './ResumeLink';

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userRole } = useAuthStore();
  const isCompany = userRole === 'company';
  const location = useLocation();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Forms state
  const [createForm, setCreateForm] = useState({
    applicationId: '',
    roundType: 'Resume Shortlist',
    date: '',
    time: '',
    details: '',
  });

  const [editForm, setEditForm] = useState({
    status: 'SCHEDULED',
    feedback: '',
    date: '',
    time: '',
    details: '',
    roundType: 'Resume Shortlist'
  });

  useEffect(() => {
    fetchSchedules();
    if (isCompany) {
      fetchApplications();
    }
  }, [userRole]);

  useEffect(() => {
    if (location.state?.preSelectApplicationId) {
      setCreateForm(prev => ({
        ...prev,
        applicationId: location.state.preSelectApplicationId
      }));
      setShowCreateModal(true);
    }
  }, [location, applications]);


  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/schedule/my-schedules`, { headers });
      setSchedules(response.data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/application/drive-applications`, { headers });
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.applicationId) {
      alert('Please select a student application');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${import.meta.env.VITE_API_URL}/schedule/create`, createForm, { headers });
      alert('Recruitment round scheduled successfully!');
      setShowCreateModal(false);
      setCreateForm({
        applicationId: '',
        roundType: 'Resume Shortlist',
        date: '',
        time: '',
        details: '',
      });
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert(error.response?.data?.message || 'Failed to create schedule');
    }
  };

  const handleOpenEdit = (sch) => {
    setSelectedSchedule(sch);
    setEditForm({
      status: sch.status || 'SCHEDULED',
      feedback: sch.feedback || '',
      date: sch.date ? new Date(sch.date).toISOString().split('T')[0] : '',
      time: sch.time || '',
      details: sch.details || '',
      roundType: sch.roundType || 'Resume Shortlist'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/schedule/${selectedSchedule._id}`,
        editForm,
        { headers }
      );
      alert('Schedule updated successfully!');
      setShowEditModal(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert(error.response?.data?.message || 'Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled round?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${import.meta.env.VITE_API_URL}/schedule/${scheduleId}`, { headers });
      alert('Schedule cancelled successfully');
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to cancel schedule');
    }
  };

  // Quick shortlist/reject for Resume Shortlist rounds
  const handleResumeDecision = async (scheduleId, decision) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/schedule/${scheduleId}`,
        { status: decision, feedback: decision === 'SHORTLISTED' ? 'Resume shortlisted for next round.' : 'Resume did not meet requirements.' },
        { headers }
      );
      fetchSchedules();
    } catch (error) {
      console.error('Error updating resume decision:', error);
      alert('Failed to update decision. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'scheduled';
    if (s === 'passed' || s === 'shortlisted' || s === 'selected') {
      return commonStyles.badge.success;
    }
    if (s === 'failed' || s === 'rejected') {
      return commonStyles.badge.danger;
    }
    if (s === 'scheduled' || s === 'pending') {
      return commonStyles.badge.warning;
    }
    return commonStyles.badge.primary;
  };

  // Determine if round type is Resume Shortlist
  const isResumeRound = (roundType) => roundType === 'Resume Shortlist';

  // Get the resume URL for a selected application
  const getSelectedAppResumeURL = () => {
    if (!createForm.applicationId) return '';
    const app = applications.find(a => a._id === createForm.applicationId);
    return app?.resumeURL || '';
  };

  if (isLoading) return <div className="text-center py-20 font-medium text-lg">Loading Schedules...</div>;

  return (
    <div className={commonStyles.container + ' py-10'}>
      <div className={commonStyles.flexBetween + ' mb-8'}>
        <div>
          <h1 className={commonStyles.heading.h1}>Recruitment Schedules</h1>
          <p className="text-slate-600">
            {isCompany
              ? 'Organize, modify and monitor selection rounds for applicants.'
              : 'Track dates, times, status, and feedback for all your recruitment rounds.'}
          </p>
        </div>
        {isCompany && (
          <button onClick={() => setShowCreateModal(true)} className={commonStyles.button.primary}>
            + Schedule Round
          </button>
        )}
      </div>

      {schedules.length > 0 ? (
        <div className="grid gap-6">
          {schedules.map((sch) => {
            const isResume = isResumeRound(sch.roundType);
            return (
              <div key={sch._id} className={commonStyles.card + ' flex flex-col justify-between'}>
                <div>
                  <div className={commonStyles.flexBetween + ' mb-4 border-b border-slate-100 pb-3'}>
                    <div>
                      <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">{sch.roundType}</span>
                      <h3 className={commonStyles.heading.h3 + ' text-slate-900 mt-1 mb-0'}>{sch.companyName}</h3>
                    </div>
                    <span className={getStatusBadge(sch.status)}>{sch.status}</span>
                  </div>

                  <div className={`grid gap-4 sm:grid-cols-2 ${isResume ? '' : 'lg:grid-cols-4'} mb-6 text-sm text-slate-700`}>
                    <div>
                      <p className="text-slate-500 font-medium text-xs uppercase">Position / Role</p>
                      <p className="font-semibold text-slate-900 mt-1">{sch.position}</p>
                    </div>
                    {isCompany && (
                      <div>
                        <p className="text-slate-500 font-medium text-xs uppercase">Candidate</p>
                        <p className="font-semibold text-slate-900 mt-1">{sch.studentName}</p>
                        <p className="text-xs text-slate-500">{sch.studentEmail}</p>
                      </div>
                    )}

                    {/* For Resume Shortlist: show View Resume button instead of Date/Time */}
                    {isResume ? (
                      <div>
                        <p className="text-slate-500 font-medium text-xs uppercase">Resume</p>
                        <ResumeLink resumeURL={sch.resumeURL} className="inline-flex items-center gap-1.5 mt-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition border border-blue-200">View Resume PDF</ResumeLink>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-slate-500 font-medium text-xs uppercase">Scheduled Date</p>
                          <p className="font-semibold text-slate-900 mt-1">{sch.date ? new Date(sch.date).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium text-xs uppercase">Scheduled Time</p>
                          <p className="font-semibold text-slate-900 mt-1">{sch.time || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Details — only show for non-resume rounds */}
                  {!isResume && sch.details && (
                    <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-150 text-sm">
                      <p className="text-slate-500 font-medium text-xs uppercase mb-1">Details & Link</p>
                      <p className="text-slate-800 break-words whitespace-pre-line">{sch.details}</p>
                    </div>
                  )}

                  {sch.feedback && (
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-sm">
                      <p className="text-blue-700 font-semibold text-xs uppercase mb-1">Feedback from Recruiter</p>
                      <p className="text-slate-800 whitespace-pre-line">{sch.feedback}</p>
                    </div>
                  )}
                </div>

                {isCompany && (
                  <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 justify-end flex-wrap">
                    {/* Resume Shortlist: show Shortlist/Reject quick actions */}
                    {isResume && sch.status?.toUpperCase() === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleResumeDecision(sch._id, 'SHORTLISTED')}
                          className="py-1.5 px-5 bg-emerald-50 text-emerald-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-100 transition border border-emerald-200"
                        >
                          ✓ Shortlist
                        </button>
                        <button
                          onClick={() => handleResumeDecision(sch._id, 'REJECTED')}
                          className="py-1.5 px-5 bg-red-50 text-red-600 rounded-xl text-xs sm:text-sm font-bold hover:bg-red-100 transition border border-red-200"
                        >
                          ✗ Reject
                        </button>
                      </>
                    )}
                    {isResume && sch.status?.toUpperCase() !== 'PENDING' && (
                      <span className="text-xs text-slate-500 italic self-center">Decision recorded: {sch.status}</span>
                    )}
                    <button onClick={() => handleOpenEdit(sch)} className={commonStyles.button.secondary + ' py-1.5 px-4 text-xs sm:text-sm'}>
                      Edit / Update Status
                    </button>
                    <button onClick={() => handleDeleteSchedule(sch._id)} className={commonStyles.button.danger + ' py-1.5 px-4 text-xs sm:text-sm bg-red-500 hover:bg-red-600'}>
                      Cancel Round
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-300 rounded-[2rem]">
          <p className="text-slate-600 text-lg font-medium">No selection rounds scheduled yet.</p>
          {isCompany ? (
            <button onClick={() => setShowCreateModal(true)} className="mt-4 text-blue-600 font-semibold hover:underline">
              Schedule a round for a candidate now
            </button>
          ) : (
            <p className="text-slate-500 mt-2 text-sm">Schedules from companies will appear here once you are shortlisted.</p>
          )}
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
            <div className="bg-blue-600 text-white p-6">
              <h3 className="text-2xl font-bold">Schedule Recruitment Round</h3>
              <p className="text-blue-100 text-sm mt-1">Select applicant and define selection round details.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Select Candidate Application *</label>
                <select
                  required
                  value={createForm.applicationId}
                  onChange={(e) => setCreateForm({ ...createForm, applicationId: e.target.value })}
                  className={commonStyles.input}
                >
                  <option value="">-- Choose Candidate --</option>
                  {applications.map((app) => (
                    <option key={app._id} value={app._id}>
                      {app.studentName} — {app.position} ({app.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Round Type *</label>
                <select
                  value={createForm.roundType}
                  onChange={(e) => setCreateForm({ ...createForm, roundType: e.target.value })}
                  className={commonStyles.input}
                >
                  <option value="Resume Shortlist">Resume Shortlist</option>
                  <option value="Aptitude Round">Aptitude Round</option>
                  <option value="Coding Round">Coding Round</option>
                  <option value="Interview">Interview</option>
                </select>
              </div>

              {/* Show View Resume link when Resume Shortlist is selected */}
              {createForm.roundType === 'Resume Shortlist' && createForm.applicationId && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-2">Candidate's Resume</p>
                  {getSelectedAppResumeURL() ? (
                    <a
                      href={getSelectedAppResumeURL()}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition border border-blue-200"
                    >
                      📄 View Resume PDF
                    </a>
                  ) : (
                    <p className="text-slate-400 text-sm italic">No resume uploaded by this student.</p>
                  )}
                </div>
              )}

              {/* Only show Date/Time/Details for non-Resume Shortlist rounds */}
              {createForm.roundType !== 'Resume Shortlist' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={commonStyles.formGroup}>
                      <label className={commonStyles.label}>Date *</label>
                      <input
                        type="date"
                        required
                        value={createForm.date}
                        onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                        className={commonStyles.input}
                      />
                    </div>
                    <div className={commonStyles.formGroup}>
                      <label className={commonStyles.label}>Time *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 10:00 AM or 14:30"
                        value={createForm.time}
                        onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                        className={commonStyles.input}
                      />
                    </div>
                  </div>

                  <div className={commonStyles.formGroup}>
                    <label className={commonStyles.label}>Location / Link / Details</label>
                    <textarea
                      value={createForm.details}
                      onChange={(e) => setCreateForm({ ...createForm, details: e.target.value })}
                      rows="3"
                      placeholder="e.g. Join Google Meet: https://meet.google.com/xxx-xxxx-xxx"
                      className={commonStyles.textarea}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className={commonStyles.button.primary + ' py-2.5 text-sm'}>
                  {createForm.roundType === 'Resume Shortlist' ? 'Create Resume Review' : 'Schedule Round'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Update Status Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
            <div className="bg-indigo-600 text-white p-6">
              <h3 className="text-2xl font-bold">Manage Schedule</h3>
              <p className="text-indigo-100 text-sm mt-1">
                For {selectedSchedule?.studentName} — {selectedSchedule?.roundType}
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Round Type</label>
                <select
                  value={editForm.roundType}
                  onChange={(e) => setEditForm({ ...editForm, roundType: e.target.value })}
                  className={commonStyles.input}
                >
                  <option value="Resume Shortlist">Resume Shortlist</option>
                  <option value="Aptitude Round">Aptitude Round</option>
                  <option value="Coding Round">Coding Round</option>
                  <option value="Interview">Interview</option>
                </select>
              </div>

              {/* View Resume link in edit modal for Resume Shortlist */}
              {editForm.roundType === 'Resume Shortlist' && selectedSchedule?.resumeURL && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-2">Candidate's Resume</p>
                  <ResumeLink resumeURL={selectedSchedule.resumeURL} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition border border-blue-200">View Resume PDF</ResumeLink>
                </div>
              )}

              {/* Only show Date/Time/Details for non-Resume Shortlist rounds */}
              {editForm.roundType !== 'Resume Shortlist' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className={commonStyles.formGroup}>
                      <label className={commonStyles.label}>Date</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className={commonStyles.input}
                      />
                    </div>
                    <div className={commonStyles.formGroup}>
                      <label className={commonStyles.label}>Time</label>
                      <input
                        type="text"
                        value={editForm.time}
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                        className={commonStyles.input}
                      />
                    </div>
                  </div>

                  <div className={commonStyles.formGroup}>
                    <label className={commonStyles.label}>Location / Link / Details</label>
                    <textarea
                      value={editForm.details}
                      onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                      rows="3"
                      className={commonStyles.textarea}
                    />
                  </div>
                </>
              )}

              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Round Result / Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className={commonStyles.input}
                >
                  {editForm.roundType === 'Resume Shortlist' ? (
                    <>
                      <option value="PENDING">PENDING (Under Review)</option>
                      <option value="SHORTLISTED">SHORTLISTED</option>
                      <option value="REJECTED">REJECTED</option>
                    </>
                  ) : (
                    <>
                      <option value="SCHEDULED">SCHEDULED (Upcoming)</option>
                      <option value="PENDING">PENDING (Reviewing Result)</option>
                      <option value="PASSED">PASSED (Advanced)</option>
                      <option value="FAILED">FAILED (Disqualified)</option>
                      <option value="SHORTLISTED">SHORTLISTED</option>
                      <option value="REJECTED">REJECTED</option>
                    </>
                  )}
                </select>
              </div>

              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Recruiter Feedback</label>
                <textarea
                  value={editForm.feedback}
                  onChange={(e) => setEditForm({ ...editForm, feedback: e.target.value })}
                  rows="3"
                  placeholder="e.g. Cleared with strong scores, scheduled coding round."
                  className={commonStyles.textarea}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className={commonStyles.button.success + ' py-2.5 text-sm'}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;

