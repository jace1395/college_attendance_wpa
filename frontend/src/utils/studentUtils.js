export const getDepartmentFromId = (studentId) => {
  if (!studentId || studentId.length < 4) return 'STUDENT';
  
  const deptCode = studentId.substring(2, 4);
  
  const deptMap = {
    '11': 'BVOC',
    '12': 'BBA',
    '13': 'BCA',
    '14': 'BSC',
    '15': 'BCOM',
    '16': 'BA'
  };
  
  return deptMap[deptCode] || 'STUDENT';
};
