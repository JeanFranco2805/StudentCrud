'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { AlertCircle, Edit2, Trash2, LogOut } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DUMMY_DATA = [
  { id: 'usr_01', name: 'Alfonso De La Cruz', age: 22, grade: 9.5 },
  { id: 'usr_02', name: 'Marina Silva', age: 24, grade: 8.2 },
  { id: 'usr_03', name: 'Neo Anderson', age: 28, grade: 4.0 },
  { id: 'usr_04', name: 'Trinity', age: 27, grade: 9.9 },
];

export default function DashboardPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('Guest Access');
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  
  const gridRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedEmail = localStorage.getItem('userEmail');
    if (savedToken) {
      setToken(savedToken);
      setEmail(savedEmail || 'Authorized User');
    } else {
      window.location.href = '/auth';
    }
  }, []);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const loadStudents = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/students`, { headers });
      if (res.status === 401) {
        localStorage.clear();
        window.location.href = '/auth';
        return;
      }
      const data = await res.json();
      setStudents(data);
    } catch (e) {
      setError('Connection offline. Cannot load data.');
    }
  };

  useEffect(() => {
    loadStudents();
  }, [token]);

  // Luxury GSAP Animations (Slow, smooth drift)
  useEffect(() => {
    if (students.length > 0 && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.profile-card');
      gsap.fromTo(
        cards,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: 'power4.out', overwrite: true }
      );
    }
  }, [students]);

  useEffect(() => {
    gsap.fromTo(containerRef.current, 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.5, ease: 'power3.out' }
    );
  }, []);

  const save = async () => {
    setError('');
    if (!name || !age || !grade) {
      setError('Please complete all fields.');
      return;
    }
    
    if (!token) return;

    const payload = { name, age: Number(age), grade: Number(grade) };
    const res = await fetch(editingId ? `${API_URL}/students/${editingId}` : `${API_URL}/students`, {
      method: editingId ? 'PUT' : 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || 'Unable to save record.');
      return;
    }
    clearForm();
    loadStudents();
  };

  const edit = (student) => {
    setEditingId(student.id);
    setName(student.name);
    setAge(String(student.age));
    setGrade(String(student.grade));
  };

  const remove = async (id) => {
    if (!token) return;
    await fetch(`${API_URL}/students/${id}`, { method: 'DELETE', headers });
    loadStudents();
  };

  const clearForm = () => {
    setEditingId(null);
    setName('');
    setAge('');
    setGrade('');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/auth';
  };

  return (
    <div className="luxury-layout">
      <nav className="luxury-nav">
        <div className="brand-title">University</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="user-badge">{email}</div>
          <button 
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = 0.7}
            onMouseOut={(e) => e.currentTarget.style.opacity = 1}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="luxury-container" ref={containerRef}>
        
        {/* Left Form Panel */}
        <section className="form-panel">
          <div>
            <h1 className="panel-title">{editingId ? 'Edit Profile' : 'New Enrollment'}</h1>
            <p className="panel-subtitle">Manage student academic records.</p>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={18} strokeWidth={1.5} />
              {error}
            </div>
          )}

          <div className="luxury-form">
            <div className="input-wrapper">
              <label>Full Name</label>
              <input 
                className="luxury-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Jane Doe" 
                autoComplete="off"
              />
            </div>
            
            <div className="input-wrapper">
              <label>Age</label>
              <input 
                className="luxury-input" 
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
                placeholder="21" 
                type="number" 
              />
            </div>

            <div className="input-wrapper">
              <label>Academic Score</label>
              <input 
                className="luxury-input" 
                value={grade} 
                onChange={(e) => setGrade(e.target.value)} 
                placeholder="0.0 - 10.0" 
                type="number" 
                step="0.1" 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={save}>
                {editingId ? 'Update Record' : 'Create Record'}
              </button>
              {editingId && (
                <button className="btn-secondary" onClick={clearForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Right Data Grid */}
        <section className="data-panel">
          <div className="data-header">
            <h2>Student Roster</h2>
            <span className="record-count">{students.length} Records</span>
          </div>

          <div className="roster-grid" ref={gridRef}>
            {students.map((s) => (
              <div key={s.id} className="profile-card">
                <div className="card-top">
                  <h3>{s.name}</h3>
                  <span className="card-id">ID: {s.id}</span>
                </div>
                
                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-label">Age</span>
                    <span className="stat-value">{s.age}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Score</span>
                    <span className="stat-value">{Number(s.grade).toFixed(1)}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="icon-btn" onClick={() => edit(s)} title="Edit">
                    <Edit2 size={16} strokeWidth={1.5} />
                  </button>
                  <button className="icon-btn delete" onClick={() => remove(s.id)} title="Delete">
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
