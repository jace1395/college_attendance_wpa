import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const PrincipalSearch = () => {
  const [query, setQuery] = useState('');
  const [stream, setStream] = useState('');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const STREAMS = ['BCA', 'BVoc', 'BCom', 'BBA', 'BBA(FS)'];

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchResults = async () => {
        if (!query && !stream) {
          setStudents([]);
          setTeachers([]);
          return;
        }
        setLoading(true);
        try {
          const { data } = await apiClient.get(`/api/principal/search/?q=${encodeURIComponent(query)}&stream=${stream}`);
          setStudents(data.students || []);
          setTeachers(data.teachers || []);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setLoading(false);
        }
      };
      fetchResults();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, stream]);

  const totalResults = students.length + teachers.length;
  const hasQuery = query || stream;

  const openModal = (result, type) => {
    setSelectedResult(result);
    setSelectedType(type);
  };

  return (
    <div className="flex flex-col items-center mt-6 gap-6 px-2">
      
      {/* Search Bar */}
      <div className="w-full max-w-3xl relative z-20">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Name, Roll No, or Email..."
            className="w-full bg-white/10 backdrop-blur-md text-white text-lg rounded-full pl-14 pr-6 py-5 outline-none border border-white/20 focus:border-purple-500 shadow-2xl"
          />
          <svg className="w-6 h-6 absolute left-5 top-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {loading && (
            <div className="absolute right-5 top-5">
              <div className="animate-spin h-6 w-6 border-2 border-t-purple-500 border-white/10 rounded-full" />
            </div>
          )}
        </div>

        {/* Stream Filter */}
        <div className="flex flex-wrap gap-2 mt-4 px-2">
          <button
            onClick={() => setStream('')}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${stream === '' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}
          >
            All Streams
          </button>
          {STREAMS.map(s => (
            <button
              key={s}
              onClick={() => setStream(stream === s ? '' : s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${stream === s ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {hasQuery && !loading && totalResults === 0 && (
        <div className="text-center text-white/40 py-12">No results found</div>
      )}

      {/* Students */}
      {students.length > 0 && (
        <div className="w-full max-w-5xl">
          <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3 px-1">
            Students ({students.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {students.map(s => (
              <div
                key={s.id}
                onClick={() => openModal(s, 'student')}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-purple-500/60 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{s.name}</p>
                    <p className="text-sm text-white/50 mt-0.5">{s.roll_no} • {s.stream}</p>
                    <p className="text-xs text-white/30 mt-1">{s.email}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${s.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {s.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-xs bg-purple-500/20 text-purple-400 font-semibold">{s.year}</span>
                  <svg className="w-4 h-4 text-white/20 group-hover:text-purple-400 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teachers */}
      {teachers.length > 0 && (
        <div className="w-full max-w-5xl">
          <h3 className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-3 px-1">
            Faculty ({teachers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teachers.map(t => (
              <div
                key={t.id}
                onClick={() => openModal(t, 'teacher')}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-blue-500/60 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{t.name}</p>
                    <p className="text-sm text-white/50 mt-0.5">{t.department}</p>
                    <p className="text-xs text-white/30 mt-1">{t.email}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${t.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {t.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-xs bg-blue-500/20 text-blue-400 font-semibold">{t.role}</span>
                  <svg className="w-4 h-4 text-white/20 group-hover:text-blue-400 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedResult(null)} />
          <div className="bg-slate-800/95 backdrop-blur-xl border border-white/20 w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedResult.name}</h3>
                  <p className="text-white/60 uppercase text-xs tracking-wider mt-1">
                    {selectedType === 'student' ? 'Student Profile' : 'Faculty Profile'}
                  </p>
                </div>
                <button onClick={() => setSelectedResult(null)} className="text-white/40 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
                {selectedType === 'student' ? (
                  <>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-white/60">Roll No</span>
                      <span className="font-semibold text-white">{selectedResult.roll_no}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-white/60">Stream</span>
                      <span className="font-semibold text-white">{selectedResult.stream}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-white/60">Year</span>
                      <span className="font-semibold text-white">{selectedResult.year}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-white/60">Email</span>
                      <span className="font-semibold text-white text-sm">{selectedResult.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <span className={`font-bold ${selectedResult.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedResult.status}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-white/60">Role</span>
                      <span className="font-semibold text-white">{selectedResult.role}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-white/60">Department</span>
                      <span className="font-semibold text-white">{selectedResult.department}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-3">
                      <span className="text-white/60">Email</span>
                      <span className="font-semibold text-white text-sm">{selectedResult.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <span className={`font-bold ${selectedResult.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedResult.status}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrincipalSearch;
