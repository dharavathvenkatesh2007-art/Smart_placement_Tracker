import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import commonStyles from '../style/common';
import useAuthStore from '../store/authStore';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeApplication, setActiveApplication] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: 'PENDING', feedback: '' });
  const { userRole } = useAuthStore();
  const navigate = useNavigate();
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState(null);
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

  const isCompany = userRole === 'company';

  async function fetchApplications() {
    if (!userRole) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const endpoint = isCompany
        ? `${import.meta.env.VITE_API_URL}/application/drive-applications`
        : `${import.meta.env.VITE_API_URL}/application/list?status=${filter}`;
      const response = await axios.get(endpoint, { headers });
      const data = response.data.applications || [];

      setApplications(isCompany && filter !== 'all' ? data.filter((app) => app.status === filter) : data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchApplications, 0);
    return () => clearTimeout(timer);
  }, [filter, userRole]);

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${import.meta.env.VITE_API_URL}/application/${applicationId}`, { headers });
      setApplications(applications.filter((app) => app._id !== applicationId));
      alert('Application withdrawn');
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application');
    }
  };

  const handleOpenReview = (application) => {
    setActiveApplication(application);
    setReviewForm({
      status: application.status.toUpperCase(),
      feedback: application.feedback || '',
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/application/${activeApplication._id}/status`,
        reviewForm,
        { headers }
      );
      setActiveApplication(null);
      await fetchApplications();
      alert('Application status updated');
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'primary',
      rejected: 'danger',
      shortlisted: 'warning',
      selected: 'success',
      hired: 'success',
    };
    return colors[status] || 'primary';
  };

  if (isLoading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className={commonStyles.container + ' py-10'}>
      <div className="mb-8">
        <h1 className={commonStyles.heading.h1}>{isCompany ? 'Candidate Applications' : 'My Applications'}</h1>
        <p className="max-w-2xl text-slate-600">
          {isCompany
            ? 'Review students who applied to your company drives and move them through the recruitment pipeline.'
            : 'Track your applied drives, current status, and application history in one place.'}
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {['all', 'pending', 'shortlisted', 'selected', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={filter === status ? commonStyles.button.primary : commonStyles.button.secondary}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {applications.length > 0 ? (
        isCompany ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Drive</th>
                    
                    <th className="p-4">Resume</th>
                    <th className="p-4">Applied</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app._id} className="text-sm text-slate-700 hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{app.studentName}</p>
                        <p className="text-xs text-slate-500">{app.studentEmail || 'No email'}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{app.position}</p>
                        <p className="text-xs text-slate-500">{app.companyName}</p>
                      </td>
                      <td className="p-4">
                        {app.resumeURL ? (
                          <a
                            href={app.resumeURL}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-600 hover:text-blue-700"
                          >
                            View PDF
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">Not uploaded</span>
                        )}
                      </td>
                      <td className="p-4">{new Date(app.appliedOn).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={commonStyles.badge[getStatusColor(app.status)]}>{app.status}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setSelectedStudentProfile(app)}
                            className={commonStyles.button.secondary + ' py-1.5 px-3 text-xs text-slate-700 border-slate-300 hover:bg-slate-50'}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => navigate('/schedules', { state: { preSelectApplicationId: app._id } })}
                            className={commonStyles.button.primary + ' py-1.5 px-3 text-xs bg-indigo-600 hover:bg-indigo-700'}
                          >
                            Schedule Round
                          </button>
                          <button onClick={() => handleOpenReview(app)} className={commonStyles.button.secondary + ' py-1.5 px-3 text-xs text-blue-700'}>
                            Update Status
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
          <div className={commonStyles.gridTwoCol}>
            {applications.map((app) => (
              <div key={app._id} className={commonStyles.card}>
                <div className={commonStyles.flexBetween + ' mb-4'}>
                  <div 
                    onClick={() => {
                      if (app.companyDetails) {
                        setSelectedCompanyProfile({
                          ...app.companyDetails,
                          companyName: app.companyName
                        });
                      }
                    }}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition"
                  >
                    {app.companyDetails?.profileImageURL ? (
                      <img src={app.companyDetails.profileImageURL} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white" />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-600 text-sm">
                        {app.companyName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className={commonStyles.heading.h4 + ' mb-0 font-semibold text-slate-950 hover:underline'}>{app.companyName}</h3>
                      {app.companyDetails?.companyType && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {app.companyDetails.companyType}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={commonStyles.badge[getStatusColor(app.status)]}>{app.status}</span>
                </div>

                <div className="mb-4 space-y-2 text-sm text-slate-700">
                  <p><strong>Position:</strong> {app.position}</p>
                  <p><strong>Applied On:</strong> {new Date(app.appliedOn).toLocaleDateString()}</p>
                  <p><strong>CTC:</strong> Rs. {app.ctc} LPA</p>
                  {app.companyDetails?.location && <p><strong>Location:</strong> {app.companyDetails.location}</p>}
                  {app.companyDetails?.email && <p><strong>Company Email:</strong> {app.companyDetails.email}</p>}
                  {app.companyDetails?.phone && <p><strong>Company Phone:</strong> {app.companyDetails.phone}</p>}
                  {app.companyDetails?.hrLinkedInLink && (
                    <p>
                      <strong>HR LinkedIn:</strong>{' '}
                      <a href={app.companyDetails.hrLinkedInLink} target="_blank" rel="noreferrer" className="text-blue-650 hover:underline font-semibold">
                        Contact HR 🔗
                      </a>
                    </p>
                  )}
                  {app.companyDetails?.website && (
                    <p>
                      <strong>Website:</strong>{' '}
                      <a href={app.companyDetails.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold">
                        {app.companyDetails.website}
                      </a>
                    </p>
                  )}
                  {app.companyDetails?.bio && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs italic text-slate-500 leading-relaxed">
                      {app.companyDetails.bio}
                    </div>
                  )}
                  {app.feedback && (
                    <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-slate-700">
                      <strong>Feedback:</strong> {app.feedback}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      if (app.companyDetails) {
                        setSelectedCompanyProfile({
                          ...app.companyDetails,
                          companyName: app.companyName
                        });
                      }
                    }}
                    className={commonStyles.button.secondary + ' flex-1 py-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50'}
                  >
                    View Company
                  </button>
                  <button onClick={() => handleWithdraw(app._id)} className={commonStyles.button.danger + ' flex-1 py-1.5 text-xs'}>
                    Withdraw
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className={commonStyles.card + ' py-10 text-center'}>
          <p className="text-lg text-gray-600">No applications found</p>
          <p className="text-gray-500">
            {isCompany ? 'Applications for your company drives will appear here.' : 'Start applying to drives to see your applications here.'}
          </p>
        </div>
      )}

      {activeApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row my-8 max-h-[90vh]">
            
            {/* Left Column: Student Academic Profile */}
            <div className="flex-1 p-6 border-r border-slate-100 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-inner overflow-hidden shrink-0">
                  {activeApplication.studentDetails?.profileImageURL ? (
                    <img src={activeApplication.studentDetails.profileImageURL} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-blue-600 font-bold uppercase">{activeApplication.studentName.substring(0, 2)}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeApplication.studentName}</h2>
                  <p className="text-sm text-slate-500">{activeApplication.studentEmail}</p>
                  {activeApplication.studentPhone && <p className="text-xs text-slate-450 mt-0.5">Phone: {activeApplication.studentPhone}</p>}
                </div>
              </div>

              <div className="space-y-6 text-sm text-slate-700">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p><strong>College:</strong> {activeApplication.studentCollege || 'N/A'}</p>
                  <p className="mt-1">
                    <strong>Resume Link:</strong>{' '}
                    {activeApplication.resumeURL ? (
                      <a href={activeApplication.resumeURL} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline">
                        View Resume PDF 📄
                      </a>
                    ) : (
                      <span className="text-slate-400">Not uploaded</span>
                    )}
                  </p>
                  {(activeApplication.studentDetails?.linkedInLink || activeApplication.studentDetails?.gitHubLink) && (
                    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-200">
                      {activeApplication.studentDetails?.linkedInLink && (
                        <a href={activeApplication.studentDetails.linkedInLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline">
                          LinkedIn Profile 🔗
                        </a>
                      )}
                      {activeApplication.studentDetails?.gitHubLink && (
                        <a href={activeApplication.studentDetails.gitHubLink} target="_blank" rel="noreferrer" className="text-xs text-slate-800 font-bold hover:underline">
                          GitHub Profile 🔗
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Academic Timeline / History */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Academic Timeline</h3>
                  {activeApplication.studentDetails?.education && activeApplication.studentDetails.education.length > 0 ? (
                    <div className="space-y-3">
                      {activeApplication.studentDetails.education.map((edu, idx) => (
                        <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                          <p className="font-semibold text-slate-800">{edu.degree}</p>
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

                {/* Skills Section */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeApplication.studentDetails?.skills && activeApplication.studentDetails.skills.length > 0 ? (
                      activeApplication.studentDetails.skills.map((skill, idx) => (
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
                {activeApplication.studentDetails?.experience && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Internships & Work Experience</h3>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">{activeApplication.studentDetails.experience}</p>
                  </div>
                )}
                {activeApplication.studentDetails?.projects && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Projects</h3>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">{activeApplication.studentDetails.projects}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recruitment Status Update */}
            <div className="w-full md:w-[350px] p-6 bg-slate-50 flex flex-col justify-between overflow-y-auto">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Recruiter Decision</h3>
                
                <form onSubmit={handleReviewSubmit} className="space-y-5">
                  <div className={commonStyles.formGroup}>
                    <label className={commonStyles.label}>Recruitment Decision</label>
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
                    <button type="button" onClick={() => setActiveApplication(null)} className={commonStyles.button.secondary + ' py-2 text-sm'}>
                      Cancel
                    </button>
                    <button type="submit" className={commonStyles.button.primary + ' py-2 text-sm bg-blue-600 hover:bg-blue-700'}>
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

      {selectedCompanyProfile && (
        <CompanyProfileModal 
          company={selectedCompanyProfile} 
          onClose={() => setSelectedCompanyProfile(null)} 
        />
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

// Reusable CompanyProfileModal inside Applications.jsx
const CompanyProfileModal = ({ company, onClose }) => {
  if (!company) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-650 text-white p-6 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">Company Profile</h3>
            <p className="text-blue-100 text-xs mt-1">Official corporate details and credentials</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-200 text-3xl font-light leading-none">×</button>
        </div>
        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            {company.profileImageURL ? (
              <img src={company.profileImageURL} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-white shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center font-bold text-blue-600 text-xl border border-blue-100 shadow-inner">
                {company.companyName?.substring(0, 2).toUpperCase() || 'CP'}
              </div>
            )}
            <div>
              <h4 className="text-2xl font-bold text-slate-900">{company.companyName}</h4>
              {company.companyType && (
                <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-655 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {company.companyType}
                </span>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Corporate Profile / Bio</h4>
            <div className="text-slate-650 bg-slate-50 p-4 rounded-2xl border border-slate-150 leading-relaxed whitespace-pre-wrap">
              {company.bio || "No profile bio available for this company."}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-slate-700">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Company Type</p>
              <p className="font-semibold text-slate-850">{company.companyType || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Location</p>
              <p className="font-semibold text-slate-850">{company.location || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Website Link</p>
              {company.website ? (
                <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">
                  {company.website}
                </a>
              ) : (
                <p className="text-slate-455 italic">Not provided</p>
              )}
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">HR LinkedIn Profile</p>
              {company.hrLinkedInLink ? (
                <a href={company.hrLinkedInLink} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">
                  View HR LinkedIn 🔗
                </a>
              ) : (
                <p className="text-slate-455 italic">Not provided</p>
              )}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 mt-4 text-xs text-slate-500 flex flex-wrap gap-x-6 gap-y-2">
            {company.email && <span><strong>Email:</strong> {company.email}</span>}
            {company.phone && <span><strong>Phone:</strong> {company.phone}</span>}
          </div>
        </div>
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition text-sm">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable StudentProfileModal inside Applications.jsx
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

export default Applications;
