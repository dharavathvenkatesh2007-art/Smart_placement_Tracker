import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const getResumeRequestURL = (resumeURL) => {
  if (!resumeURL) return '';

  if (resumeURL.includes('/uploads/resumes/')) {
    throw new Error('This resume was uploaded with the old storage system. Please upload the resume again.');
  }

  if (resumeURL.startsWith('/api/')) {
    return `${API_ORIGIN}${resumeURL}`;
  }

  if (resumeURL.startsWith('/student/')) {
    return `${API_URL}${resumeURL}`;
  }

  try {
    const parsedURL = new URL(resumeURL);
    if (parsedURL.pathname.startsWith('/api/')) {
      return `${API_ORIGIN}${parsedURL.pathname}`;
    }
  } catch {
    // Keep the original value below when it is not a URL object.
  }

  return resumeURL;
};

const readErrorMessage = async (error) => {
  const blob = error.response?.data;
  if (blob instanceof Blob) {
    try {
      const text = await blob.text();
      const data = JSON.parse(text);
      return data.message || data.error || text;
    } catch {
      return 'Unable to open resume.';
    }
  }

  return error.response?.data?.message || error.message || 'Unable to open resume.';
};

export const openResume = async (resumeURL) => {
  if (!resumeURL) return;

  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(getResumeRequestURL(resumeURL), {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });

    const file = new Blob([response.data], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
  } catch (error) {
    throw new Error(await readErrorMessage(error));
  }
};
