export const getDevicePerformance = () => {
  return 'high';
};

export const getGlassmorphismClass = (performanceLevel, theme = 'dark') => {
  if (performanceLevel === 'high') {
    return theme === 'light' ? 'apple-glass-light rounded-3xl' : 'apple-glass-dark rounded-3xl';
  }
  // Glassmorphism Lite for low-end devices (solid color with slight opacity, no blur)
  return theme === 'light' 
    ? 'bg-slate-200 border border-slate-300 shadow-sm rounded-3xl' 
    : 'bg-slate-800 border border-slate-700 shadow-sm rounded-3xl';
};
