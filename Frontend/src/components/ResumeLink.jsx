import { openResume } from '../utils/resumeViewer';

const ResumeLink = ({ resumeURL, children = 'View PDF', className = '' }) => {
  if (!resumeURL) {
    return <span className="text-slate-400">Not uploaded</span>;
  }

  const handleOpen = async () => {
    try {
      await openResume(resumeURL);
    } catch (error) {
      console.error('Error opening resume:', error);
      alert(error.message || 'Unable to open resume. Please ask the student to upload the resume again.');
    }
  };

  return (
    <button type="button" onClick={handleOpen} className={className || 'font-semibold text-blue-600 hover:text-blue-700'}>
      {children}
    </button>
  );
};

export default ResumeLink;
