import axios from 'axios';

export const openResume = async (resumeURL) => {
  if (!resumeURL) return;

  const token = localStorage.getItem('token');
  const response = await axios.get(resumeURL, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });

  const file = new Blob([response.data], { type: 'application/pdf' });
  const fileURL = URL.createObjectURL(file);
  window.open(fileURL, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
};
