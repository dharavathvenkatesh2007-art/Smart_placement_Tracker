import { useState, useEffect } from 'react';
import axios from 'axios';
import commonStyles from '../style/common';
import useAuthStore from '../store/authStore';
import ResumeLink from './ResumeLink';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const { user, updateProfile, userRole } = useAuthStore();

  // Student specific profile state
  const [studentProfile, setStudentProfile] = useState({
    education: [],
    skills: [],
    experience: '',
    projects: '',
    resumeURL: '',
    rollNumber: '',
    branch: '',
    linkedInLink: '',
    gitHubLink: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [tempSkill, setTempSkill] = useState('');
  
  // Temp education form to add new entry
  const [newEdu, setNewEdu] = useState({
    degree: '',
    institution: '',
    yearOfPassing: '',
    cgpa: '',
    branch: '',
    rollNumber: ''
  });

  // Change password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const calculateCompletion = () => {
    const basicFields = [
      formData.name,
      formData.email,
      formData.phone,
      formData.location,
      formData.bio,
    ];

    if (isAdmin) {
      return Math.round((basicFields.filter(Boolean).length / basicFields.length) * 100);
    }

    if (!isStudent) {
      const companyFields = [
        ...basicFields,
        formData.website,
        formData.companyType,
        formData.hrLinkedInLink
      ];
      return Math.round((companyFields.filter(Boolean).length / companyFields.length) * 100);
    }

    const studentFields = [
      formData.college,
      studentProfile.skills?.length > 0,
      studentProfile.education?.length > 0,
      studentProfile.experience,
      studentProfile.projects,
      studentProfile.resumeURL,
      studentProfile.linkedInLink,
      studentProfile.gitHubLink
    ];

    const allFields = [...basicFields, ...studentFields];
    return Math.round((allFields.filter(Boolean).length / allFields.length) * 100);
  };

  async function fetchStudentProfile() {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/student/profile`,
        { headers }
      );
      if (response.data?.payload) {
        setStudentProfile(response.data.payload);
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        setFormData(user);
        if (user.role === 'STUDENT' || userRole === 'student') {
          fetchStudentProfile();
        } else {
          setIsLoading(false);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [user, userRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add education entry
  const handleAddEducation = () => {
    if (!newEdu.degree || !newEdu.institution || !newEdu.yearOfPassing || !newEdu.cgpa) {
      alert('Please fill out all education fields');
      return;
    }
    
    const cgpaNum = Number(newEdu.cgpa);
    if (cgpaNum < 0 || cgpaNum > 10) {
      alert('CGPA must be between 0 and 10');
      return;
    }

    setStudentProfile(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: newEdu.degree,
        institution: newEdu.institution,
        yearOfPassing: Number(newEdu.yearOfPassing),
        cgpa: cgpaNum,
        branch: newEdu.branch || '',
        rollNumber: newEdu.rollNumber || ''
      }]
    }));

    setNewEdu({
      degree: '',
      institution: '',
      yearOfPassing: '',
      cgpa: '',
      branch: '',
      rollNumber: ''
    });
  };

  // Delete education entry
  const handleDeleteEducation = (indexToDelete) => {
    setStudentProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, idx) => idx !== indexToDelete)
    }));
  };

  // Add skill pill
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (tempSkill.trim() && !studentProfile.skills.includes(tempSkill.trim())) {
      setStudentProfile(prev => ({
        ...prev,
        skills: [...prev.skills, tempSkill.trim()]
      }));
      setTempSkill('');
    }
  };

  // Delete skill pill
  const handleDeleteSkill = (skillToDelete) => {
    setStudentProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToDelete)
    }));
  };

  // Handle resume file select
  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleProfileImageChange = (e) => {
    setProfileImage(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const basicPayload = profileImage ? new FormData() : formData;
      if (profileImage) {
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) basicPayload.append(key, value);
        });
        basicPayload.append('profileImage', profileImage);
      }

      // 1. Update basic user profile (name, email, phone, location, bio)
      await updateProfile(basicPayload);

      // 2. If student, save student specific profile using FormData for file uploads
      if (user.role === 'STUDENT' || userRole === 'student') {
        const token = localStorage.getItem('token');
        const headers = { 
          Authorization: `Bearer ${token}`
        };

        const sData = new FormData();
        sData.append('experience', studentProfile.experience || '');
        sData.append('projects', studentProfile.projects || '');
        sData.append('skills', JSON.stringify(studentProfile.skills || []));
        sData.append('education', JSON.stringify(studentProfile.education || []));
        sData.append('linkedInLink', studentProfile.linkedInLink || '');
        sData.append('gitHubLink', studentProfile.gitHubLink || '');
        if (resumeFile) {
          sData.append('resume', resumeFile);
        }

        await axios.post(
          `${import.meta.env.VITE_API_URL}/student/profile`,
          sData,
          { headers }
        );

        await fetchStudentProfile();
        setResumeFile(null);
      }

      setIsEditing(false);
      setProfileImage(null);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/user/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers }
      );

      setPasswordSuccess('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 font-medium text-lg">Loading Profile Data...</div>;

  const isStudent = user?.role === 'STUDENT' || userRole === 'student';
  const isAdmin = user?.role === 'ADMIN' || userRole === 'admin';
  const completion = calculateCompletion();

  return (
    <div className={commonStyles.container + ' py-10'}>
      <h1 className={commonStyles.heading.h1}>My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card & Basic Info */}
        <div className="lg:col-span-1">
          <div className={commonStyles.card + ' text-center'}>
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-500 shadow-inner">
              {formData.profileImageURL ? (
                <img
                  src={formData.profileImageURL}
                  alt={isStudent ? 'Student profile' : 'Company logo'}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl text-blue-600 font-bold uppercase">
                  {formData.name ? formData.name.substring(0, 2) : 'U'}
                </span>
              )}
            </div>
            <h2 className={commonStyles.heading.h3}>{formData.name}</h2>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block mt-1">
              {user?.role}
            </p>
            
            <div className="mt-8 text-left space-y-4 text-slate-700 border-t border-slate-100 pt-6">
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Phone:</strong> {formData.phone || 'Not provided'}</p>
              <p><strong>Location:</strong> {formData.location || 'Not provided'}</p>
              {isStudent && (
                <p><strong>College:</strong> {formData.college || 'Not provided'}</p>
              )}
              {!isStudent && !isAdmin && (
                <>
                  <p><strong>Website:</strong> {formData.website ? <a href={formData.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{formData.website}</a> : 'Not provided'}</p>
                  <p><strong>Company Type:</strong> {formData.companyType || 'Not provided'}</p>
                  <p><strong>HR LinkedIn:</strong> {formData.hrLinkedInLink ? <a href={formData.hrLinkedInLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View Profile</a> : 'Not provided'}</p>
                </>
              )}
              {isAdmin && (
                <div className="mt-4 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs">
                  <p className="font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>🔐</span> Admin Privileges
                  </p>
                  <p className="text-slate-300 leading-relaxed">System-wide administrative rights. Access includes account registry suspension/approval, drive lifecycle operations, notification broadcasting, and statistical oversight.</p>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Profile completion</span>
                <span className={completion === 100 ? 'text-green-600' : 'text-blue-600'}>{completion}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={completion === 100 ? 'h-full rounded-full bg-green-500' : 'h-full rounded-full bg-blue-600'}
                  style={{ width: `${completion}%` }}
                />
              </div>
              {completion < 100 && (
                <p className="mt-3 text-xs text-slate-500">
                  Complete missing details to improve recruiter visibility.
                </p>
              )}
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={commonStyles.button.primary + ' w-full mt-8'}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className={commonStyles.card + ' mt-6 text-left'}>
            <h3 className={commonStyles.heading.h3 + ' mb-4 text-blue-600'}>Change Password</h3>
            
            {passwordError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={commonStyles.input}
                  required
                />
              </div>
              
              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={commonStyles.input}
                  required
                />
              </div>
              
              <div className={commonStyles.formGroup}>
                <label className={commonStyles.label}>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={commonStyles.input}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className={commonStyles.button.primary + ' w-full mt-2'}
              >
                {isChangingPassword ? 'Changing Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Details & Student Profile Forms */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Edit */}
              <div className={commonStyles.card}>
                <h3 className={commonStyles.heading.h3 + ' mb-6 text-blue-600'}>Basic Information</h3>
                <div className={commonStyles.gridTwoCol}>
                  <div className={commonStyles.formGroup}>
                    <label className={commonStyles.label}>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className={commonStyles.input}
                      required
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label className={commonStyles.label}>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className={commonStyles.input}
                      required
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label className={commonStyles.label}>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      className={commonStyles.input}
                    />
                  </div>
                  <div className={commonStyles.formGroup}>
                    <label className={commonStyles.label}>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location || ''}
                      onChange={handleChange}
                      className={commonStyles.input}
                      placeholder="City, Country"
                    />
                  </div>
                  
                  {isStudent && (
                    <div className={commonStyles.formGroup}>
                      <label className={commonStyles.label}>College / Institution *</label>
                      <input
                        type="text"
                        name="college"
                        value={formData.college || ''}
                        onChange={handleChange}
                        className={commonStyles.input}
                        required
                      />
                    </div>
                  )}

                  {!isStudent && !isAdmin && (
                    <>
                      <div className={commonStyles.formGroup}>
                        <label className={commonStyles.label}>Website</label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website || ''}
                          onChange={handleChange}
                          className={commonStyles.input}
                          placeholder="e.g. https://company.com"
                        />
                      </div>
                      <div className={commonStyles.formGroup}>
                        <label className={commonStyles.label}>Company Type</label>
                        <select
                          name="companyType"
                          value={formData.companyType || ''}
                          onChange={handleChange}
                          className={commonStyles.input}
                        >
                          <option value="">-- Select Type --</option>
                          <option value="Product Based">Product Based</option>
                          <option value="Service Based">Service Based</option>
                          <option value="Startup">Startup</option>
                          <option value="MNC">MNC</option>
                          <option value="Government">Government</option>
                        </select>
                      </div>
                      <div className={commonStyles.formGroup + ' sm:col-span-2'}>
                        <label className={commonStyles.label}>HR LinkedIn Link</label>
                        <input
                          type="url"
                          name="hrLinkedInLink"
                          value={formData.hrLinkedInLink || ''}
                          onChange={handleChange}
                          className={commonStyles.input}
                          placeholder="e.g. https://linkedin.com/in/hr-profile"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className={commonStyles.formGroup + ' mt-2'}>
                  <label className={commonStyles.label}>{isStudent ? 'Profile Photo' : 'Company Logo'}</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleProfileImageChange}
                    className={commonStyles.input + ' py-2.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'}
                  />
                  {profileImage && <p className="mt-2 text-xs text-slate-500">Selected: {profileImage.name}</p>}
                </div>

                <div className={commonStyles.formGroup + ' mt-2'}>
                  <label className={commonStyles.label}>Short Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    rows="3"
                    className={commonStyles.textarea}
                    placeholder={isAdmin ? "Enter administrative notes..." : "Tell recruiters about yourself..."}
                  />
                </div>
              </div>

              {/* Student Profile details Edit */}
              {isStudent && (
                <div className={commonStyles.card + ' space-y-6'}>
                  <h3 className={commonStyles.heading.h3 + ' text-indigo-600'}>Student Profile Details</h3>

                  {/* Skills Section */}
                  <div>
                    <label className={commonStyles.label}>Skills List</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={tempSkill}
                        onChange={(e) => setTempSkill(e.target.value)}
                        placeholder="e.g. React"
                        className={commonStyles.input}
                      />
                      <button onClick={handleAddSkill} className={commonStyles.button.primary + ' py-2.5 px-6 font-semibold'}>
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      {studentProfile.skills && studentProfile.skills.length > 0 ? (
                        studentProfile.skills.map((skill, index) => (
                          <span key={index} className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {skill}
                            <button type="button" onClick={() => handleDeleteSkill(skill)} className="text-indigo-400 hover:text-indigo-600 font-bold ml-0.5">×</button>
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-400 text-sm italic">No skills added yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Education Form */}
                  <div>
                    <label className={commonStyles.label}>Education Profile</label>
                    <div className="space-y-4 mb-4">
                      {studentProfile.education && studentProfile.education.map((edu, index) => (
                        <div key={index} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                          <div>
                            <p className="font-semibold text-slate-800">{edu.degree}</p>
                            <p className="text-sm text-slate-600">{edu.institution} ({edu.yearOfPassing})</p>
                            <p className="text-xs text-indigo-600 font-medium mt-1">
                               
                              {edu.rollNumber ? ` | Roll No: ${edu.rollNumber}` : ''}
                              {edu.branch ? ` | Branch: ${edu.branch}` : ''} 
                              CGPA: {edu.cgpa}/10
                              
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEducation(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Education Fields */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Add Academic Entry</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={newEdu.degree}
                          onChange={(e) => setNewEdu({...newEdu, degree: e.target.value})}
                          placeholder="Degree (e.g. B.Tech)"
                          className={commonStyles.input + ' py-2 text-sm'}
                        />
                        <input
                          type="text"
                          value={newEdu.institution}
                          onChange={(e) => setNewEdu({...newEdu, institution: e.target.value})}
                          placeholder="Institution/College"
                          className={commonStyles.input + ' py-2 text-sm'}
                        />
                        <input
                          type="text"
                          value={newEdu.rollNumber}
                          onChange={(e) => setNewEdu({...newEdu, rollNumber: e.target.value})}
                          placeholder="Roll Number (e.g. 21CS001)"
                          className={commonStyles.input + ' py-2 text-sm'}
                        />
                        <select
                          value={newEdu.branch}
                          onChange={(e) => setNewEdu({...newEdu, branch: e.target.value})}
                          className={commonStyles.input + ' py-2 text-sm'}
                        >
                          <option value="">-- Select Branch --</option>
                          <option value="Computer Science and Engineering (CSE)">Computer Science and Engineering (CSE)</option>
                          <option value="Information Technology (IT)">Information Technology (IT)</option>
                          <option value="Electronics and Communication Engineering (ECE)">Electronics and Communication Engineering (ECE)</option>
                          <option value="Electrical and Electronics Engineering (EEE)">Electrical and Electronics Engineering (EEE)</option>
                          <option value="Mechanical Engineering (ME)">Mechanical Engineering (ME)</option>
                          <option value="Civil Engineering (CE)">Civil Engineering (CE)</option>
                          <option value="Chemical Engineering (CHE)">Chemical Engineering (CHE)</option>
                          <option value="Aerospace Engineering (AE)">Aerospace Engineering (AE)</option>
                          <option value="Biotechnology (BT)">Biotechnology (BT)</option>
                          <option value="Electronics and Instrumentation Engineering (EIE)">Electronics and Instrumentation Engineering (EIE)</option>
                          <option value="Metallurgical and Materials Engineering (MME)">Metallurgical and Materials Engineering (MME)</option>
                          <option value="Production and Industrial Engineering (PIE)">Production and Industrial Engineering (PIE)</option>
                          <option value="Textile Technology (TT)">Textile Technology (TT)</option>
                          <option value="Mining Engineering (MN)">Mining Engineering (MN)</option>
                          <option value="Artificial Intelligence and Data Science (AI & DS)">Artificial Intelligence and Data Science (AI & DS)</option>
                          <option value="Computer Science and Business Systems (CSBS)">Computer Science and Business Systems (CSBS)</option>
                          <option value="Cyber Security (CS)">Cyber Security (CS)</option>
                          <option value="Data Science (DS)">Data Science (DS)</option>
                          <option value="Robotics and Automation">Robotics and Automation</option>
                          <option value="Mechatronics Engineering">Mechatronics Engineering</option>
                        </select>
                        
                        <input
                          type="number"
                          step="0.01"
                          value={newEdu.cgpa}
                          onChange={(e) => setNewEdu({...newEdu, cgpa: e.target.value})}
                          placeholder="CGPA (out of 10)"
                          className={commonStyles.input + ' py-2 text-sm'}
                          min="0"
                          max="10"
                        />
                        <input
                          type="number"
                          value={newEdu.yearOfPassing}
                          onChange={(e) => setNewEdu({...newEdu, yearOfPassing: e.target.value})}
                          placeholder="Year of Passing (e.g. 2026)"
                          className={commonStyles.input + ' py-2 text-sm'}
                        />
                        
                      </div>
                      <button
                        type="button"
                        onClick={handleAddEducation}
                        className={commonStyles.button.secondary + ' w-full py-2 text-sm bg-white'}
                      >
                        + Add Education Entry
                      </button>
                    </div>
                  </div>

                  {/* Personal & Professional Links */}
                  <div className={commonStyles.gridTwoCol + ' border-t border-slate-100 pt-6 mt-6'}>
                    <div className={commonStyles.formGroup}>
                      <label className={commonStyles.label}>LinkedIn Profile Link</label>
                      <input
                        type="url"
                        name="linkedInLink"
                        value={studentProfile.linkedInLink || ''}
                        onChange={handleStudentChange}
                        className={commonStyles.input}
                        placeholder="e.g. https://linkedin.com/in/username"
                      />
                    </div>
                    <div className={commonStyles.formGroup}>
                      <label className={commonStyles.label}>GitHub Profile Link</label>
                      <input
                        type="url"
                        name="gitHubLink"
                        value={studentProfile.gitHubLink || ''}
                        onChange={handleStudentChange}
                        className={commonStyles.input}
                        placeholder="e.g. https://github.com/username"
                      />
                    </div>
                  </div>

                  {/* Experience & Projects */}
                  <div className={commonStyles.gridTwoCol}>
                    <div className={commonStyles.formGroup}>
                      <label className={commonStyles.label}>Experience / Internships</label>
                      <textarea
                        name="experience"
                        value={studentProfile.experience || ''}
                        onChange={handleStudentChange}
                        rows="3"
                        placeholder="Detail any past job or internship experience..."
                        className={commonStyles.textarea}
                      />
                    </div>
                    <div className={commonStyles.formGroup}>
                      <label className={commonStyles.label}>Academic / Personal Projects</label>
                      <textarea
                        name="projects"
                        value={studentProfile.projects || ''}
                        onChange={handleStudentChange}
                        rows="3"
                        placeholder="Summarize key projects, technologies used..."
                        className={commonStyles.textarea}
                      />
                    </div>
                  </div>

                  {/* Resume Upload */}
                  <div>
                    <label className={commonStyles.label}>Resume Upload (PDF)</label>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFileChange}
                      className={commonStyles.input + ' py-2.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'}
                    />
                    {studentProfile.resumeURL && (
                      <p className="text-xs text-blue-600 mt-2">
                        Current Resume: <ResumeLink resumeURL={studentProfile.resumeURL} className="underline font-semibold">View uploaded resume</ResumeLink>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button type="submit" className={commonStyles.button.primary + ' flex-grow py-3'}>
                  Save Profile Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setResumeFile(null);
                    setProfileImage(null);
                  }}
                  className={commonStyles.button.secondary + ' px-8 py-3 text-slate-800 border-slate-300'}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Basic Bio */}
              <div className={commonStyles.card}>
                <h3 className={commonStyles.heading.h3 + ' mb-3 text-slate-800'}>About Me</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {formData.bio || 'No bio written yet. Click Edit Profile to add one!'}
                </p>
              </div>

              {/* Student Details Card */}
              {isStudent && (
                <div className={commonStyles.card + ' space-y-8'}>
                  <h3 className={commonStyles.heading.h3 + ' text-indigo-600 border-b border-slate-100 pb-3'}>Professional & Academic Details</h3>

                  {/* Social Profile Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-200 text-sm">
                    <div>
                      <p className="text-slate-500 font-medium text-xs uppercase">LinkedIn Profile</p>
                      {studentProfile.linkedInLink ? (
                        <a href={studentProfile.linkedInLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold block mt-1">
                          View LinkedIn
                        </a>
                      ) : (
                        <p className="text-slate-400 italic mt-1">Not provided</p>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium text-xs uppercase">GitHub Profile</p>
                      {studentProfile.gitHubLink ? (
                        <a href={studentProfile.gitHubLink} target="_blank" rel="noreferrer" className="text-slate-800 hover:underline font-semibold block mt-1">
                          View GitHub
                        </a>
                      ) : (
                        <p className="text-slate-400 italic mt-1">Not provided</p>
                      )}
                    </div>
                  </div>

                  {/* Skills pills display */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">Skills & Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {studentProfile.skills && studentProfile.skills.length > 0 ? (
                        studentProfile.skills.map((skill, index) => (
                          <span key={index} className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-500 text-sm italic">No skills listed yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Education list display */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">Education History</h4>
                    {studentProfile.education && studentProfile.education.length > 0 ? (
                      <div className="space-y-4">
                        {studentProfile.education.map((edu, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                              🎓
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{edu.degree}</p>
                              <p className="text-sm text-slate-600">{edu.institution}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1.5 text-xs font-medium text-slate-500">
                                <span>Passed in: <strong>{edu.yearOfPassing}</strong></span>
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">CGPA: <strong>{edu.cgpa}/10</strong></span>
                                {edu.branch && <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Branch: <strong>{edu.branch}</strong></span>}
                                {edu.rollNumber && <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Roll No: <strong>{edu.rollNumber}</strong></span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic">No education history recorded yet.</p>
                    )}
                  </div>

                  {/* Experience display */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Work Experience</h4>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                      {studentProfile.experience || 'No experience listed yet.'}
                    </p>
                  </div>

                  {/* Projects display */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Key Projects</h4>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                      {studentProfile.projects || 'No projects listed yet.'}
                    </p>
                  </div>

                  {/* Resume display */}
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Resume Attachment</h4>
                    {studentProfile.resumeURL ? (
                      <ResumeLink resumeURL={studentProfile.resumeURL} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 transition rounded-xl text-sm font-semibold border border-blue-200">
                        Download / View Resume PDF
                      </ResumeLink>
                    ) : (
                      <p className="text-red-500 text-sm italic">No resume uploaded. Click Edit Profile to upload one.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

