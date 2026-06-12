import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import commonStyles from '../style/common';
import useAuthStore from '../store/authStore';

const DriveDetails = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuthStore();
  
  const [drive, setDrive] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [showCompanyProfile, setShowCompanyProfile] = useState(false);
  
  // Eligibility check state
  const [eligibility, setEligibility] = useState({
    eligible: true,
    cgpaOk: true,
    skillsOk: true,
    studentCGPA: 0,
    missingSkills: []
  });

  useEffect(() => {
    fetchDriveDetails();
  }, [driveId]);

  const fetchDriveDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/drive/${driveId}`,
        { headers }
      );

      const driveData = response.data.drive;
      setDrive(driveData);
      setHasApplied(response.data.hasApplied || false);

      // Fetch student details for Smart Eligibility check
      const isStudentUser = userRole === 'student' || user?.role === 'STUDENT';
      if (isStudentUser) {
        try {
          const profileRes = await axios.get(
            `${import.meta.env.VITE_API_URL}/student/profile`,
            { headers }
          );
          const profile = profileRes.data?.payload;
          setStudentProfile(profile);

          if (profile) {
            // Get highest CGPA
            const cgpas = (profile.education || []).map(edu => edu.cgpa || 0);
            const maxCGPA = cgpas.length > 0 ? Math.max(...cgpas) : 0;
            
            // Check CGPA requirement
            const cgpaOk = maxCGPA >= (driveData.minCGPA || 0);
            
            // Check required skills coverage
            const studentSkills = (profile.skills || []).map(s => s.toLowerCase());
            const driveSkills = (driveData.requiredSkills || []).map(s => s.toLowerCase());
            const missing = (driveData.requiredSkills || []).filter(
              s => !studentSkills.includes(s.toLowerCase())
            );
            
            setEligibility({
              eligible: cgpaOk && missing.length === 0,
              cgpaOk,
              skillsOk: missing.length === 0,
              studentCGPA: maxCGPA,
              missingSkills: missing
            });
          }
        } catch (profileErr) {
          console.error('Error fetching student profile for eligibility:', profileErr);
        }
      }
    } catch (error) {
      console.error('Error fetching drive details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!eligibility.eligible && !window.confirm('You do not meet all eligibility criteria for this job drive. Are you sure you want to apply anyway?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/application/apply`,
        { driveId },
        { headers }
      );

      setHasApplied(true);
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to drive:', error);
      alert('Failed to apply. Please try again.');
    }
  };

  if (isLoading) return <div className="text-center py-20 font-medium text-lg">Loading Drive Details...</div>;

  if (!drive) return <div className="text-center py-20 font-medium text-lg text-red-500">Drive not found</div>;

  const isStudent = userRole === 'student' || user?.role === 'STUDENT';
  const isCompany = userRole === 'company' || user?.role === 'COMPANY';

  return (
    <div className={commonStyles.container + ' py-10'}>
      <button onClick={() => navigate('/drives')} className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
        ← Back to Drives
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className={commonStyles.card + ' space-y-8'}>
            <div className={commonStyles.flexBetween}>
              <div>
                <p className="text-sm text-slate-500 font-semibold uppercase tracking-widest">
                  {drive.companyName}
                </p>
                <h1 className="text-3xl font-extrabold text-slate-900 mt-2">{drive.position}</h1>
              </div>
              <span className="rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                {drive.status || 'ACTIVE'}
              </span>
            </div>

            <div>
              <h3 className={commonStyles.heading.h4 + ' text-slate-800 mb-4 border-b pb-2'}>Role Parameters</h3>
              <div className="grid gap-4 sm:grid-cols-2 text-slate-700 text-sm">
                <p><strong>CTC Package:</strong> ₹{drive.ctc} LPA</p>
                <p><strong>Location:</strong> {drive.location}</p>
                <p><strong>Job Type:</strong> {drive.jobType || 'Full-time'}</p>
                <p><strong>Experience Level:</strong> {drive.experience || 'Freshers'}</p>
                {drive.minCGPA > 0 && <p><strong>Min CGPA Required:</strong> {drive.minCGPA} / 10</p>}
              </div>
            </div>

            {drive.description && (
              <div>
                <h3 className={commonStyles.heading.h4 + ' text-slate-800 mb-3 border-b pb-2'}>Job Description</h3>
                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed">{drive.description}</p>
              </div>
            )}

            {drive.requiredSkills && drive.requiredSkills.length > 0 && (
              <div>
                <h3 className={commonStyles.heading.h4 + ' text-slate-800 mb-3 border-b pb-2'}>Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {drive.requiredSkills.map((skill, index) => (
                    <span key={index} className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {drive.requirements && drive.requirements.length > 0 && (
              <div>
                <h3 className={commonStyles.heading.h4 + ' text-slate-800 mb-3 border-b pb-2'}>Additional Requirements</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm leading-relaxed">
                  {drive.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {drive.selectionProcess && drive.selectionProcess.length > 0 && (
              <div>
                <h3 className={commonStyles.heading.h4 + ' text-slate-800 mb-3 border-b pb-2'}>Selection Process</h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 text-sm leading-relaxed">
                  {drive.selectionProcess.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply & Eligibility Card */}
          <div className={commonStyles.card}>
            {isStudent && studentProfile && (
              <div className="mb-6 p-4 rounded-2xl border bg-slate-50 border-slate-200">
                <h4 className="font-bold text-sm text-slate-800 mb-3">Eligibility Profile</h4>
                {eligibility.eligible ? (
                  <p className="text-xs text-green-600 font-semibold flex items-center gap-1.5">
                    <span className="text-base">✓</span> Meets all placement criteria
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {!eligibility.cgpaOk && (
                      <p className="text-red-600 font-medium flex items-center gap-1.5">
                        <span>⚠️</span> CGPA required: {drive.minCGPA} (Yours: {eligibility.studentCGPA || 'N/A'})
                      </p>
                    )}
                    {!eligibility.skillsOk && (
                      <p className="text-amber-600 font-medium flex items-center gap-1.5">
                        <span>⚠️</span> Missing skills: {eligibility.missingSkills.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4 mb-6 text-sm text-slate-700">
              <div>
                <p className="text-slate-500 text-xs uppercase font-bold">Registration Deadline</p>
                <p className="font-semibold text-red-500 mt-1">{new Date(drive.deadline).toLocaleDateString()}</p>
              </div>
              {drive.startDate && (
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">Drive Starting Date</p>
                  <p className="font-semibold text-slate-800 mt-1">{new Date(drive.startDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {isStudent && (
              <button
                onClick={() => setShowCompanyProfile(true)}
                className={commonStyles.button.secondary + ' w-full text-slate-850 mb-3 border-slate-300 hover:bg-slate-50'}
              >
                Company Profile
              </button>
            )}

            {hasApplied ? (
              <div className="text-center py-3 bg-green-50 border border-green-200 text-green-700 font-bold rounded-xl text-sm">
                ✓ Already Applied
              </div>
            ) : isStudent ? (
              <button
                onClick={handleApply}
                className={commonStyles.button.primary + ' w-full'}
              >
                Apply Now
              </button>
            ) : isCompany ? (
              <button
                onClick={() => navigate('/applications')}
                className={commonStyles.button.secondary + ' w-full text-slate-900'}
              >
                View Applicants
              </button>
            ) : (
              <div className="text-center py-3 bg-slate-50 text-slate-500 font-semibold rounded-xl text-xs">
                Student login required to apply
              </div>
            )}
          </div>

          {/* Vacancies Card */}
          <div className={commonStyles.card}>
            <h3 className={commonStyles.heading.h4 + ' text-slate-800 mb-4'}>Placement Vacancies</h3>
            <div className="space-y-3 text-slate-600 text-sm">
              <p><strong>Total Openings:</strong> {drive.openings || 1}</p>
              <p><strong>Total Applicants:</strong> {drive.applicants?.length || 0} students</p>
            </div>
          </div>
        </div>
      </div>
      
      {showCompanyProfile && drive?.userId && (
        <CompanyProfileModal 
          company={{
            ...drive.userId,
            companyName: drive.companyName || drive.userId.companyName
          }} 
          onClose={() => setShowCompanyProfile(false)} 
        />
      )}
    </div>
  );
};

// Reusable CompanyProfileModal helper inside DriveDetails.jsx
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
          {/* Logo and Name */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            {company.profileImageURL ? (
              <img src={company.profileImageURL} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-white shadow-sm" />
            ) : (
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center font-bold text-blue-600 text-xl border border-blue-100 shadow-inner">
                {company.companyName?.substring(0, 2).toUpperCase() || 'CP'}
              </div>
            )}
            <div>
              <h4 className="text-2xl font-bold text-slate-900">{company.companyName || company.name}</h4>
              {company.companyType && (
                <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-655 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {company.companyType}
                </span>
              )}
            </div>
          </div>
          {/* Overview / Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Corporate Profile / Bio</h4>
            <div className="text-slate-650 bg-slate-50 p-4 rounded-2xl border border-slate-150 leading-relaxed whitespace-pre-wrap">
              {company.bio || "No profile bio available for this company."}
            </div>
          </div>
          {/* Key details */}
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
          {/* Contact details */}
          <div className="border-t border-slate-100 pt-4 mt-4 text-xs text-slate-500 flex flex-wrap gap-x-6 gap-y-2">
            {company.email && <span><strong>Email:</strong> {company.email}</span>}
            {company.phone && <span><strong>Phone:</strong> {company.phone}</span>}
          </div>
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

export default DriveDetails;
