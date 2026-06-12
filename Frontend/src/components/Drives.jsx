import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import commonStyles from '../style/common';
import useAuthStore from '../store/authStore';

const Drives = () => {
  const [drives, setDrives] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { userRole } = useAuthStore();
  const isCompany = userRole === 'company';
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState(null);
  const [appliedDriveIds, setAppliedDriveIds] = useState([]);

  useEffect(() => {
    fetchDrives();
  }, [filter, userRole]);

  const fetchDrives = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const endpoint = isCompany
        ? `${import.meta.env.VITE_API_URL}/drive/my-drives`
        : `${import.meta.env.VITE_API_URL}/drive/active-drives?filter=${filter}`;

      const [drivesRes, appsRes] = await Promise.all([
        axios.get(endpoint, { headers }),
        !isCompany ? axios.get(`${import.meta.env.VITE_API_URL}/application/my-applications`, { headers }).catch(() => null) : null
      ]);

      setDrives(drivesRes.data.drives || []);
      if (appsRes && appsRes.data?.applications) {
        setAppliedDriveIds(appsRes.data.applications.map(app => app.driveId));
      }
    } catch (error) {
      console.error('Error fetching drives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDrives = drives.filter((drive) =>
    drive.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drive.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className={commonStyles.container + ' py-10'}>
      <div className="rounded-[2rem] bg-white p-8 shadow-lg border border-slate-200">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className={commonStyles.heading.h1}>{isCompany ? 'My Company Drives' : 'Active Drives'}</h1>
            <p className="text-slate-600 max-w-2xl">
              {isCompany
                ? 'View and manage placement drives created by your company.'
                : 'Search and filter live placement drives from top companies across locations.'}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              placeholder="Search by company, role or skill"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={commonStyles.input + ' min-w-[260px]'}
            />
            {!isCompany && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={commonStyles.input + ' min-w-[180px]'}
              >
                <option value="all">All Drives</option>
                <option value="recent">Recent</option>
                <option value="highestctc">Highest CTC</option>
                <option value="lowestdeadline">Deadline Soon</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {filteredDrives.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredDrives.map((drive) => (
            <div
              key={drive._id}
              className={commonStyles.card + ' cursor-pointer hover:shadow-2xl transition'}
              onClick={() => navigate(`/drive/${drive._id}`)}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500 font-semibold uppercase tracking-[0.2em]">
                    {drive.companyName}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">{drive.position}</h3>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  {drive.status}
                </span>
              </div>

              <div className="space-y-3 text-slate-600">
                <p>
                  <strong>CTC:</strong> ₹{drive.ctc} LPA
                </p>
                <p>
                  <strong>Location:</strong> {drive.location}
                </p>
                <p>
                  <strong>Deadline:</strong> {new Date(drive.deadline).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/drive/${drive._id}`);
                  }}
                  className={commonStyles.button.primary + ' w-full py-2 text-xs font-semibold'}
                >
                  View Details
                </button>
                <div className="flex gap-2">
                  {!isCompany && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (drive.userId) {
                          setSelectedCompanyProfile({
                            ...drive.userId,
                            companyName: drive.companyName || drive.userId.companyName
                          });
                        }
                      }}
                      className={commonStyles.button.secondary + ' flex-1 py-1.5 text-xs text-slate-700 hover:bg-slate-50'}
                    >
                      Company Info
                    </button>
                  )}
                  {isCompany ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/applications');
                      }}
                      className={commonStyles.button.secondary + ' flex-1 py-1.5 text-xs text-slate-900'}
                    >
                      Applicants
                    </button>
                  ) : appliedDriveIds.includes(drive._id) ? (
                    <div className="flex-1 text-center py-2 bg-green-50 border border-green-200 text-green-700 font-bold rounded-xl text-xs self-center flex items-center justify-center">
                      ✓ Applied
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/drive/${drive._id}`);
                      }}
                      className={commonStyles.button.secondary + ' flex-1 py-1.5 text-xs text-slate-900 bg-blue-50/50 hover:bg-blue-100/50'}
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={commonStyles.card + ' mt-8 text-center py-10'}>
          <p className="text-slate-600 text-lg">No drives found</p>
          <p className="text-slate-500">Try adjusting the search or filter options.</p>
        </div>
      )}
      
      {selectedCompanyProfile && (
        <CompanyProfileModal 
          company={selectedCompanyProfile} 
          onClose={() => setSelectedCompanyProfile(null)} 
        />
      )}
    </div>
  );
};

const CompanyProfileModal = ({ company, onClose }) => {
  if (!company) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-650 text-white p-6 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">Company Profile</h3>
            <p className="text-blue-100 text-xs mt-1">Official corporate details and credentials</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-200 text-3xl font-light leading-none">×</button>
        </div>
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
              <h4 className="text-2xl font-bold text-slate-900">{company.companyName || company.name}</h4>
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
                <p className="text-slate-450 italic">Not provided</p>
              )}
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">HR LinkedIn Profile</p>
              {company.hrLinkedInLink ? (
                <a href={company.hrLinkedInLink} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">
                  View HR LinkedIn 🔗
                </a>
              ) : (
                <p className="text-slate-450 italic">Not provided</p>
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

export default Drives;
