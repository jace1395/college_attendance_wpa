import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
const PROGRAMMES = ["BCom", "BCA", "BVoc", "BBA", "BBA(FS)"];
const YEARS = ["First Year (FY)", "Second Year (SY)", "Third Year (TY)"];
const GENDERS = ["Male", "Female", "Other"];
const DEPTS = ["Computer Science", "Finance"];

const inp = "w-full bg-slate-900/70 text-white/90 rounded-xl px-4 py-2.5 border border-white/10 focus:border-blue-500/70 outline-none text-sm transition-colors placeholder-white/25";
const sel = inp + " appearance-none cursor-pointer";
const lbl = "block text-xs text-white/50 font-semibold uppercase tracking-wider mb-1.5";
const errCls = "text-red-400 text-xs mt-1 ml-1";

const STAFF_ROLES = ["Teacher", "HOD", "Lab Incharge", "Admin Staff"];

// ─── Student Form ────────────────────────────────────────────────────────────
const StudentForm = () => {
  const empty = { name: "", rollNo: "", programme: "", year: "", email: "", phone: "", dob: "", gender: "", address: "" };
  const [form, setForm]       = useState(empty);
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await apiClient.get('/api/admin/users/?role=Student&limit=5');
        setRecords(data.users.map(u => ({
          name: u.name, rollNo: u.roll_no, programme: u.stream, year: u.year, email: u.email
        })));
      } catch (err) {
        console.error("Failed to load recent students");
      }
    };
    fetchStudents();
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name = "Full name is required.";
    if (!form.rollNo.trim())  e.rollNo = "Roll number is required.";
    if (!form.programme)      e.programme = "Select a programme.";
    if (!form.year)           e.year = "Select a year.";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required.";
    if (form.phone && !form.phone.match(/^\d{10}$/)) e.phone = "Enter valid 10-digit phone.";
    if (!form.gender)         e.gender = "Select gender.";
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setLoading(true);
    try {
      await apiClient.post('/api/admin/users/', {
        name: form.name,
        roll_no: form.rollNo,
        email: form.email,
        role: 'Student',
        stream: form.programme
      });
      setRecords(prev => [{ name: form.name, rollNo: form.rollNo, programme: form.programme, year: form.year.split(" ")[0], email: form.email }, ...prev]);
      setForm(empty);
      setErrors({});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {success && (
        <div className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 rounded-2xl px-5 py-4">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-green-300 font-semibold text-sm">Student record added successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white/80 mb-5">New Student Entry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className={lbl}>Full Name *</label><input className={inp} value={form.name} onChange={set("name")} placeholder="e.g. Priya Naik"/>{errors.name && <p className={errCls}>{errors.name}</p>}</div>
          <div><label className={lbl}>Roll Number *</label><input className={inp} value={form.rollNo} onChange={set("rollNo")} placeholder="e.g. BC011"/>{errors.rollNo && <p className={errCls}>{errors.rollNo}</p>}</div>
          <div>
            <label className={lbl}>Programme *</label>
            <select className={sel} value={form.programme} onChange={set("programme")}>
              <option value="">Select...</option>
              {PROGRAMMES.map(p => <option key={p}>{p}</option>)}
            </select>
            {errors.programme && <p className={errCls}>{errors.programme}</p>}
          </div>
          <div>
            <label className={lbl}>Year *</label>
            <select className={sel} value={form.year} onChange={set("year")}>
              <option value="">Select...</option>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
            {errors.year && <p className={errCls}>{errors.year}</p>}
          </div>
          <div><label className={lbl}>Email *</label><input type="email" className={inp} value={form.email} onChange={set("email")} placeholder="student@college.edu"/>{errors.email && <p className={errCls}>{errors.email}</p>}</div>
          <div><label className={lbl}>Phone</label><input className={inp} value={form.phone} onChange={set("phone")} placeholder="10-digit number"/>{errors.phone && <p className={errCls}>{errors.phone}</p>}</div>
          <div><label className={lbl}>Date of Birth</label><input type="date" className={inp + " [color-scheme:dark]"} value={form.dob} onChange={set("dob")}/></div>
          <div>
            <label className={lbl}>Gender *</label>
            <select className={sel} value={form.gender} onChange={set("gender")}>
              <option value="">Select...</option>
              {GENDERS.map(g => <option key={g}>{g}</option>)}
            </select>
            {errors.gender && <p className={errCls}>{errors.gender}</p>}
          </div>
          <div className="sm:col-span-2 lg:col-span-1"><label className={lbl}>Address</label><input className={inp} value={form.address} onChange={set("address")} placeholder="City, State"/></div>
        </div>
        <div className="flex justify-end mt-5">
          <button type="button" onClick={() => { setForm(empty); setErrors({}); }} className="px-5 py-2 text-white/50 hover:text-white text-sm mr-3 transition-colors" disabled={loading}>Clear</button>
          <button type="submit" disabled={loading} className="px-7 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Adding...' : 'Add Student'}</button>
        </div>
      </form>

      {/* Records Preview */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/80">Recently Added Students</h3>
          <span className="text-xs text-white/40">{records.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead><tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Roll No</th><th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Programme</th><th className="px-4 py-3">Year</th><th className="px-4 py-3">Email</th>
            </tr></thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-purple-300 text-xs">{r.rollNo}</td>
                  <td className="px-4 py-3 font-semibold text-white/90">{r.name}</td>
                  <td className="px-4 py-3"><span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-md font-bold">{r.programme}</span></td>
                  <td className="px-4 py-3 text-white/50">{r.year}</td>
                  <td className="px-4 py-3 text-white/50">{r.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Staff Form ──────────────────────────────────────────────────────────────
const StaffForm = () => {
  const empty = { name: "", staffId: "", role: "", dept: "", email: "", phone: "", qualification: "", joining: "" };
  const [form, setForm]       = useState(empty);
  const [errors, setErrors]   = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data } = await apiClient.get('/api/admin/users/?limit=20');
        const staff = data.users.filter(u => u.role !== 'Student').slice(0, 5);
        setRecords(staff.map(u => ({
          name: u.name, staffId: u.roll_no || u.id, role: u.role, dept: u.department, email: u.email
        })));
      } catch (err) {
        console.error("Failed to load recent staff");
      }
    };
    fetchStaff();
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name = "Full name is required.";
    if (!form.staffId.trim()) e.staffId = "Staff ID is required.";
    if (!form.role)           e.role = "Select a role.";
    if (!form.dept)           e.dept = "Select a department.";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required.";
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setLoading(true);
    try {
      await apiClient.post('/api/admin/users/', {
        name: form.name,
        roll_no: form.staffId,
        email: form.email,
        role: form.role,
        department: form.dept
      });
      setRecords(prev => [{ name: form.name, staffId: form.staffId, role: form.role, dept: form.dept, email: form.email }, ...prev]);
      setForm(empty); setErrors({});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add staff.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {success && (
        <div className="flex items-center gap-3 bg-green-500/15 border border-green-500/30 rounded-2xl px-5 py-4">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-green-300 font-semibold text-sm">Staff record added successfully!</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white/80 mb-5">New Staff Entry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className={lbl}>Full Name *</label><input className={inp} value={form.name} onChange={set("name")} placeholder="Prof. Name"/>{errors.name && <p className={errCls}>{errors.name}</p>}</div>
          <div><label className={lbl}>Staff ID *</label><input className={inp} value={form.staffId} onChange={set("staffId")} placeholder="e.g. T103"/>{errors.staffId && <p className={errCls}>{errors.staffId}</p>}</div>
          <div>
            <label className={lbl}>Role *</label>
            <select className={sel} value={form.role} onChange={set("role")}>
              <option value="">Select...</option>
              {STAFF_ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            {errors.role && <p className={errCls}>{errors.role}</p>}
          </div>
          <div>
            <label className={lbl}>Department *</label>
            <select className={sel} value={form.dept} onChange={set("dept")}>
              <option value="">Select...</option>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
            {errors.dept && <p className={errCls}>{errors.dept}</p>}
          </div>
          <div><label className={lbl}>Email *</label><input type="email" className={inp} value={form.email} onChange={set("email")} placeholder="staff@college.edu"/>{errors.email && <p className={errCls}>{errors.email}</p>}</div>
          <div><label className={lbl}>Phone</label><input className={inp} value={form.phone} onChange={set("phone")} placeholder="10-digit"/></div>
          <div><label className={lbl}>Qualification</label><input className={inp} value={form.qualification} onChange={set("qualification")} placeholder="e.g. M.Com, B.Ed"/></div>
          <div><label className={lbl}>Date of Joining</label><input type="date" className={inp + " [color-scheme:dark]"} value={form.joining} onChange={set("joining")}/></div>
        </div>
        <div className="flex justify-end mt-5">
          <button type="button" onClick={() => { setForm(empty); setErrors({}); }} className="px-5 py-2 text-white/50 hover:text-white text-sm mr-3 transition-colors" disabled={loading}>Clear</button>
          <button type="submit" disabled={loading} className="px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Adding...' : 'Add Staff'}</button>
        </div>
      </form>

      {/* Records */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/80">Recently Added Staff</h3>
          <span className="text-xs text-white/40">{records.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead><tr className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Staff ID</th><th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Email</th>
            </tr></thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-emerald-300 text-xs">{r.staffId}</td>
                  <td className="px-4 py-3 font-semibold text-white/90">{r.name}</td>
                  <td className="px-4 py-3"><span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-md font-bold">{r.role}</span></td>
                  <td className="px-4 py-3 text-white/50">{r.dept}</td>
                  <td className="px-4 py-3 text-white/50">{r.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Subject Management ────────────────────────────────────────────────────────
const SubjectManagement = () => {
  const empty = { name: "", stream: "", semester: "", is_elective: false };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const fetchSubjects = async () => {
    try {
      const { data } = await apiClient.get('/api/admin/subjects/');
      setRecords(data);
    } catch (err) {
      console.error("Failed to load subjects");
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Subject name is required.";
    if (!form.stream) e.stream = "Select a stream.";
    if (!form.semester) e.semester = "Select a semester.";
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setLoading(true);
    try {
      if (editingId) {
        await apiClient.put('/api/admin/subjects/', { id: editingId, ...form });
      } else {
        await apiClient.post('/api/admin/subjects/', form);
      }
      fetchSubjects();
      setForm(empty);
      setEditingId(null);
      setErrors({});
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save subject.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await apiClient.delete(`/api/admin/subjects/?id=${id}`);
      fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete subject.");
    }
  };

  const handleEdit = (sub) => {
    setForm({ name: sub.name, stream: sub.stream, semester: sub.semester, is_elective: sub.is_elective });
    setEditingId(sub.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white/80 mb-5">{editingId ? 'Edit Subject' : 'New Subject Entry'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className={lbl}>Subject Name *</label><input className={inp} value={form.name} onChange={set("name")} placeholder="e.g. Mathematics II"/>{errors.name && <p className={errCls}>{errors.name}</p>}</div>
          <div>
            <label className={lbl}>Stream *</label>
            <select className={sel} value={form.stream} onChange={set("stream")}>
              <option value="">Select...</option>
              {PROGRAMMES.map(p => <option key={p}>{p}</option>)}
            </select>
            {errors.stream && <p className={errCls}>{errors.stream}</p>}
          </div>
          <div>
            <label className={lbl}>Semester *</label>
            <select className={sel} value={form.semester} onChange={set("semester")}>
              <option value="">Select...</option>
              {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map(s => <option key={s}>{s}</option>)}
            </select>
            {errors.semester && <p className={errCls}>{errors.semester}</p>}
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" id="is_elective" checked={form.is_elective} onChange={set("is_elective")} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-white/20 bg-slate-900"/>
            <label htmlFor="is_elective" className="text-sm font-medium text-white/80">Is Elective?</label>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <button type="button" onClick={() => { setForm(empty); setEditingId(null); setErrors({}); }} className="px-5 py-2 text-white/50 hover:text-white text-sm mr-3 transition-colors" disabled={loading}>Clear</button>
          <button type="submit" disabled={loading} className="px-7 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Saving...' : editingId ? 'Update Subject' : 'Add Subject'}</button>
        </div>
      </form>

      {/* Records Preview */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/80">Subjects</h3>
          <span className="text-xs text-white/40">{records.length} records</span>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm text-left relative">
            <thead className="sticky top-0 bg-slate-900 border-b border-white/10">
            <tr className="text-white/40 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Stream</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white/90">{r.name}</td>
                  <td className="px-4 py-3"><span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-md font-bold">{r.stream}</span></td>
                  <td className="px-4 py-3 text-white/70">{r.semester}</td>
                  <td className="px-4 py-3 text-white/50">{r.is_elective ? <span className="text-yellow-400">Elective</span> : 'Core'}</td>
                  <td className="px-4 py-3 text-right flex justify-end gap-3">
                    <button onClick={() => handleEdit(r)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Edit">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Delete">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Main Export ─────────────────────────────────────────────────────────────
const StudentDataEntry = () => {
  const [tab, setTab] = useState("student");
  return (
    <div className="flex flex-col gap-5 ">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-white/90">Data Entry</h2>
          <p className="text-xs text-white/40">Insert new student, staff, or subject records into the system</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/10 w-fit">
        {["student", "staff", "subjects"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={"px-5 py-2 rounded-lg text-sm font-bold capitalize  " + (tab === t ? "bg-blue-600 text-white shadow" : "text-white/50 hover:text-white hover:bg-white/5")}>
            {t === "student" ? "Student" : t === "staff" ? "Staff / Teacher" : "Subjects"}
          </button>
        ))}
      </div>

      {tab === "student" ? <StudentForm /> : tab === "staff" ? <StaffForm /> : <SubjectManagement />}
    </div>
  );
};

export default StudentDataEntry;