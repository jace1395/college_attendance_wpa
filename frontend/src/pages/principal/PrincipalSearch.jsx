import React, { useState } from 'react';

const PrincipalSearch = () => {
  const [query, setQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  // Mock data for search
  const mockStudents = [
      { type: 'student', id: '2511011', name: 'Jace Doe', class: 'SY BVoc(ST)', attendance: 78.5 },
      { type: 'student', id: '2511001', name: 'Alice Smith', class: 'SY BVoc(ST)', attendance: 65.0 },
      { type: 'student', id: '2411022', name: 'Bob Johnson', class: 'FY BBA', attendance: 88.0 },
  ];

  const mockClasses = [
      { type: 'class', id: 'BVC_SEM3_WD', name: 'SY BVoc(ST)', subject: 'Web Development', avg: 82.5 },
      { type: 'class', id: 'BBA_SEM1_MKT', name: 'FY BBA', subject: 'Marketing', avg: 71.2 },
  ];

  const results = [...mockStudents, ...mockClasses].filter(item => {
      if (!query) return false;
      const lowerQuery = query.toLowerCase();
      if (item.type === 'student') {
          return item.name.toLowerCase().includes(lowerQuery) || item.id.includes(lowerQuery) || item.class.toLowerCase().includes(lowerQuery);
      }
      return item.name.toLowerCase().includes(lowerQuery) || item.subject.toLowerCase().includes(lowerQuery) || item.id.toLowerCase().includes(lowerQuery);
  });

  return (
    <div className="flex flex-col items-center animate-fade-in-up mt-10">
      
      {/* Centered Search Bar */}
      <div className="w-full max-w-3xl relative z-20">
          <div className="relative">
              <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by Student Name, ID, or Class Name..."
                  className="w-full bg-white/10 backdrop-blur-md text-white text-lg rounded-full pl-14 pr-6 py-5 outline-none border border-white/20 focus:border-blue-500 shadow-2xl transition-all"
              />
              <svg className="w-6 h-6 absolute left-5 top-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>

          {/* Search Results Dropdown */}
          {query && (
              <div className="absolute top-full left-0 w-full mt-4 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-96 overflow-y-auto">
                  {results.length > 0 ? results.map((res, idx) => (
                      <div 
                          key={idx} 
                          onClick={() => setSelectedResult(res)}
                          className="p-4 border-b border-white/5 hover:bg-white/10 cursor-pointer transition-colors flex justify-between items-center"
                      >
                          {res.type === 'student' ? (
                              <>
                                  <div>
                                      <p className="font-bold text-white flex items-center gap-2">
                                          <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase">Student</span>
                                          {res.name}
                                      </p>
                                      <p className="text-sm text-white/60">{res.id} • {res.class}</p>
                                  </div>
                                  <div className={`font-bold ${res.attendance >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                                      {res.attendance}%
                                  </div>
                              </>
                          ) : (
                              <>
                                  <div>
                                      <p className="font-bold text-white flex items-center gap-2">
                                          <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase">Class</span>
                                          {res.name}
                                      </p>
                                      <p className="text-sm text-white/60">{res.id} • {res.subject}</p>
                                  </div>
                                  <div className={`font-bold ${res.avg >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                                      {res.avg}% Avg
                                  </div>
                              </>
                          )}
                      </div>
                  )) : (
                      <div className="p-8 text-center text-white/40">No results found for "{query}"</div>
                  )}
              </div>
          )}
      </div>

      {/* Deep Dive Modal */}
      {selectedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedResult(null)}></div>
              
              <div className="bg-slate-800/95 backdrop-blur-xl border border-white/20 w-full max-w-md rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden animate-fade-in-up">
                  <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h3 className="text-2xl font-bold">{selectedResult.name}</h3>
                              <p className="text-white/60 uppercase text-xs tracking-wider mt-1">{selectedResult.type} Profile</p>
                          </div>
                          <button onClick={() => setSelectedResult(null)} className="text-white/40 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                      </div>

                      <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 mb-6">
                          {selectedResult.type === 'student' ? (
                              <div className="space-y-4">
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                      <span className="text-white/60">ID Number</span>
                                      <span className="font-semibold">{selectedResult.id}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                      <span className="text-white/60">Enrolled Class</span>
                                      <span className="font-semibold">{selectedResult.class}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-white/60">Overall Attendance</span>
                                      <span className={`font-bold ${selectedResult.attendance >= 75 ? 'text-green-400' : 'text-red-400'}`}>{selectedResult.attendance}%</span>
                                  </div>
                              </div>
                          ) : (
                              <div className="space-y-4">
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                      <span className="text-white/60">Class Code</span>
                                      <span className="font-semibold">{selectedResult.id}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                      <span className="text-white/60">Subject</span>
                                      <span className="font-semibold">{selectedResult.subject}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-white/60">Class Average</span>
                                      <span className={`font-bold ${selectedResult.avg >= 75 ? 'text-green-400' : 'text-red-400'}`}>{selectedResult.avg}%</span>
                                  </div>
                              </div>
                          )}
                      </div>

                      <button 
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg transition-transform transform hover:-translate-y-1"
                          onClick={() => alert(`Navigating to full profile for ${selectedResult.name}...`)}
                      >
                          View Full Records
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default PrincipalSearch;
