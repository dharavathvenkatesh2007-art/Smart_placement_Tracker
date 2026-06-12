// Tailwind CSS Configuration and Common Styles
export const commonStyles = {
  // Container styles - responsive padding
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Button styles - responsive sizing
  button: {
    primary: 'px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md transition duration-300 font-semibold',
    secondary: 'px-4 sm:px-6 py-2 sm:py-3 bg-white text-blue-700 border border-blue-600 text-sm sm:text-base rounded-xl hover:bg-blue-50 transition duration-300 font-semibold',
    danger: 'px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white text-sm sm:text-base rounded-xl shadow-sm hover:bg-red-700 transition duration-300 font-semibold',
    success: 'px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white text-sm sm:text-base rounded-xl shadow-sm hover:bg-green-700 transition duration-300 font-semibold',
  },
  
  // Input styles - responsive
  input: 'w-full px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-xl sm:rounded-2xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition',
  textarea: 'w-full px-4 sm:px-5 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-xl sm:rounded-2xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none',
  
  // Card styles - responsive padding
  card: 'bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300 p-4 sm:p-6',
  
  // Header/Navbar styles
  navbar: 'bg-white shadow-sm sticky top-0 z-50',
  
  // Typography - responsive headings
  heading: {
    h1: 'text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight',
    h2: 'text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 leading-tight',
    h3: 'text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-2 leading-snug',
    h4: 'text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-2',
  },
  
  // Grid styles
  gridTwoCol: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
  gridThreeCol: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  gridFourCol: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
  
  // Badge styles
  badge: {
    primary: 'inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold',
    success: 'inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold',
    warning: 'inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold',
    danger: 'inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold',
  },
  
  // Alert styles
  alert: {
    success: 'bg-green-100 border border-green-400 text-green-700 text-sm px-4 py-3 rounded-xl mb-4',
    error: 'bg-red-100 border border-red-400 text-red-700 text-sm px-4 py-3 rounded-xl mb-4',
    warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700 text-sm px-4 py-3 rounded-xl mb-4',
    info: 'bg-blue-100 border border-blue-400 text-blue-700 text-sm px-4 py-3 rounded-xl mb-4',
  },
  
  // Form group
  formGroup: 'mb-4 sm:mb-5',
  label: 'block text-xs sm:text-sm font-semibold text-slate-700 mb-2',
  
  // Flex utilities
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexCol: 'flex flex-col',
  
  // Spacing utilities
  sectionSpacing: 'py-8 sm:py-12 lg:py-16',
  
  // Text utilities
  textCenter: 'text-center',
  textRight: 'text-right',
  textSmall: 'text-xs sm:text-sm',
  textBase: 'text-sm sm:text-base',
};

export default commonStyles;
