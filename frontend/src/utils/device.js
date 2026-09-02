export const getDevicePerformance = () => {
  // Check if navigator properties exist to prevent errors
  const hardwareConcurrency = navigator.hardwareConcurrency || 4; 
  const deviceMemory = navigator.deviceMemory || 4; // in GB

  // We define a "high-end" device as having >= 8 cores or >= 8GB RAM
  const isHighEnd = hardwareConcurrency >= 8 || deviceMemory >= 8;

  return isHighEnd ? 'high' : 'low';
};

export const getGlassmorphismClass = (performanceLevel) => {
  if (performanceLevel === 'high') {
    return 'bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl';
  }
  // Glassmorphism Lite for low-end devices (solid color with slight opacity, no blur)
  return 'bg-slate-800/90 border border-slate-700 shadow-sm';
};
