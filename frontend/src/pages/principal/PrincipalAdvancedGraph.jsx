import React, { useState, useEffect, useMemo } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../../services/apiClient';

const PrincipalAdvancedGraph = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter options from backend
  const [filterOptions, setFilterOptions] = useState({
    streams: [],
    years: [],
    classes: []
  });
  
  // Filter state
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  
  // Fetch filter options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const { data } = await apiClient.get('/api/principal/filters/');
        setFilterOptions(data);
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      }
    };
    fetchOptions();
  }, []);

  // Compute available classes based on selected streams and years
  const availableClasses = useMemo(() => {
    return filterOptions.classes.filter(c => {
      const streamMatch = selectedStreams.length === 0 || selectedStreams.includes(c.stream);
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(c.year);
      return streamMatch && yearMatch;
    });
  }, [filterOptions.classes, selectedStreams, selectedYears]);

  // Remove invalid classes if streams/years change
  useEffect(() => {
    const validClassIds = availableClasses.map(c => c.id);
    const newSelected = selectedClasses.filter(id => validClassIds.includes(id));
    if (newSelected.length !== selectedClasses.length) {
      setSelectedClasses(newSelected);
    }
  }, [availableClasses, selectedClasses]);
  
  useEffect(() => {
    fetchGraphData();
  }, [selectedStreams, selectedYears, selectedClasses]);
  
  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      selectedStreams.forEach(s => params.append('streams[]', s));
      selectedYears.forEach(y => params.append('years[]', y));
      selectedClasses.forEach(c => params.append('classes[]', c));
      
      const { data: resData } = await apiClient.get(`/api/principal/advanced-graph/?${params.toString()}`);
      setData(resData);
    } catch (error) {
      console.error("Failed to fetch graph data", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (setter, current, value) => {
    if (current.includes(value)) {
      setter(current.filter(item => item !== value));
    } else {
      setter([...current, value]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl flex flex-col h-[550px]">
      <div className="p-8 border-b border-gray-200 dark:border-white/10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
            Attendance Aggregate Overview
          </h2>
          <p className="text-base text-gray-500 dark:text-white/60 mt-1 font-medium">Filter by Hierarchy (Streams → Years → Classes) for dynamic 3D-styled plotting</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* Stream Filter */}
          <div className="relative group">
            <button className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-white/90 flex items-center gap-2 transition-colors shadow-sm">
              Streams <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg text-xs">{selectedStreams.length === 0 ? 'All' : selectedStreams.length}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 hidden group-hover:block z-30">
              {filterOptions.streams.map(stream => (
                <label key={stream} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedStreams.includes(stream)}
                    onChange={() => toggleSelection(setSelectedStreams, selectedStreams, stream)}
                    className="rounded-md w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-white/20 dark:bg-slate-900"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-white/90">{stream}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Year Filter */}
          <div className="relative group">
            <button className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-white/90 flex items-center gap-2 transition-colors shadow-sm">
              Years <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg text-xs">{selectedYears.length === 0 ? 'All' : selectedYears.length}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 hidden group-hover:block z-30">
              {filterOptions.years.map(year => (
                <label key={year} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedYears.includes(year)}
                    onChange={() => toggleSelection(setSelectedYears, selectedYears, year)}
                    className="rounded-md w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-white/20 dark:bg-slate-900"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-white/90">{year}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Classes Filter */}
          <div className="relative group">
            <button className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-white/90 flex items-center gap-2 transition-colors shadow-sm">
              Classes <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg text-xs">{selectedClasses.length === 0 ? 'All' : selectedClasses.length}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div className="absolute right-0 mt-2 w-64 max-h-[300px] overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 hidden group-hover:block z-30">
              {availableClasses.map(cls => (
                <label key={cls.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedClasses.includes(cls.id)}
                    onChange={() => toggleSelection(setSelectedClasses, selectedClasses, cls.id)}
                    className="rounded-md w-4 h-4 mt-0.5 text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-white/20 dark:bg-slate-900"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{cls.name}</span>
                    <span className="text-xs text-gray-500 dark:text-white/50">{cls.year} • {cls.stream}</span>
                  </div>
                </label>
              ))}
              {availableClasses.length === 0 && <div className="text-sm text-center text-gray-500 p-4">No classes for this selection</div>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-b-3xl">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-purple-600"></div>
              <span className="text-sm font-bold text-purple-700 dark:text-purple-400 animate-pulse">Aggregating...</span>
            </div>
          </div>
        )}
        
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0}/>
                </linearGradient>
                <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#9333ea" floodOpacity="0.4" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="date" tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} axisLine={false} tickLine={false} dy={15} />
              <YAxis tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} dx={-15} />
              <Tooltip 
                contentStyle={{backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '12px 16px'}}
                itemStyle={{color: '#fff', fontWeight: 'bold', fontSize: '15px'}}
                labelStyle={{color: '#94a3b8', marginBottom: '4px', fontSize: '13px'}}
                formatter={(value) => [`${value}%`, 'Attendance']}
              />
              <Area 
                type="monotone" 
                dataKey="percentage" 
                fill="url(#colorPct)" 
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#9333ea"
                strokeWidth={5}
                dot={false}
                activeDot={{r: 8, strokeWidth: 0, fill: '#d8b4fe', style: {filter: 'url(#drop-shadow)'}}}
                style={{filter: 'url(#drop-shadow)'}}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-white/40 font-medium">
            {!loading && 'No attendance data for this period.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrincipalAdvancedGraph;
