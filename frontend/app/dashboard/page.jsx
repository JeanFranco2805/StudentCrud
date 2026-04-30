'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { AlertCircle, User, Activity, Hash, Edit2, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Mock data to ensure the UI is visible even if backend auth fails (as per user priority to see CRUD first)
const DUMMY_DATA = [
  { id: 'usr_01', name: 'Alfonso De La Cruz', age: 22, grade: 9.5 },
  { id: 'usr_02', name: 'Marina Silva', age: 24, grade: 8.2 },
  { id: 'usr_03', name: 'Neo Anderson', age: 28, grade: 4.0 },
  { id: 'usr_04', name: 'Trinity', age: 27, grade: 9.9 },
];

export default function DashboardPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('GUEST_ACCESS');
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  
  const gridRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedEmail = localStorage.getItem('userEmail');
    if (savedToken) {
      setToken(savedToken);
      setEmail(savedEmail || 'AUTHORIZED_USER');
    } else {
      // Bypassing hard redirect to allow UI testing of the "Brutalist" design
      setStudents(DUMMY_DATA);
    }
  }, []);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const loadStudents = async () => {
    if (!token) return; // Fallback handles dummy data
    try {
      const res = await fetch(`${API_URL}/students`, { headers });
      if (res.status === 401) {
        // Show dummy data if token is invalid, allowing UI design to be tested
        setStudents(DUMMY_DATA);
        setError('UNAUTHORIZED. Showing local simulated data.');
        return;
      }
      const data = await res.json();
      setStudents(data);
    } catch (e) {
      setStudents(DUMMY_DATA);
      setError('OFFLINE. Showing local simulated data.');
    }
  };

  useEffect(() => {
    loadStudents();
  }, [token]);

  // GSAP Animations
  useEffect(() => {
    if (students.length > 0 && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.dossier-card');
      gsap.fromTo(
        cards,
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', overwrite: true }
      );
    }
  }, [students]);

  useEffect(() => {
    gsap.fromTo(headerRef.current, 
      { x: -20, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 1, ease: 'expo.out' }
    );
  }, []);

  const save = async () => {
    setError('');
    if (!name || !age || !grade) {
      setError('ALL FIELDS REQUIRED.');
      return;
    }
    
    if (!token) {
      // Simulate save for the UI demo
      if (editingId) {
        setStudents(s => s.map(x => x.id === editingId ? { ...x, name, age, grade } : x));
      } else {
        setStudents(s => [...s, { id: `usr_${Date.now()}`, name, age, grade }]);
      }
      clearForm();
      return;
    }

    const payload = { name, age: Number(age), grade: Number(grade) };
    const res = await fetch(editingId ? `${API_URL}/students/${editingId}` : `${API_URL}/students`, {
      method: editingId ? 'PUT' : 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || 'SYS_ERROR: SAVE FAILED');
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
    if (!token) {
      setStudents(s => s.filter(x => x.id !== id));
      return;
    }
    await fetch(`${API_URL}/students/${id}`, { method: 'DELETE', headers });
    loadStudents();
  };

  const clearForm = () => {
    setEditingId(null);
    setName('');
    setAge('');
    setGrade('');
  };

  return (
    <main className="dashboard-layout">
      {/* 1. Left Vertical Branding */}
      <aside className="vertical-brand">
        <div className="status-dot" title="SYSTEM ONLINE" />
        <h1 ref={headerRef}>S T U D E N T S</h1>
      </aside>

      {/* 2. Middle Control Panel (Form) */}
      <section className="control-panel">
        <div className="panel-header">
          <h2>{editingId ? 'UPDATE_REC' : 'INSERT_REC'}</h2>
          <span>{email}</span>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="brutal-form">
          <div className="input-group">
            <label>
              <span>IDENTIFIER_NAME</span>
              <User size={14} />
            </label>
            <input 
              className="brutal-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="J. DOE" 
              autoComplete="off"
            />
          </div>
          
          <div className="input-group">
            <label>
              <span>AGE_PARAM</span>
              <Activity size={14} />
            </label>
            <input 
              className="brutal-input" 
              value={age} 
              onChange={(e) => setAge(e.target.value)} 
              placeholder="00" 
              type="number" 
            />
          </div>

          <div className="input-group">
            <label>
              <span>EVAL_GRADE</span>
              <Hash size={14} />
            </label>
            <input 
              className="brutal-input" 
              value={grade} 
              onChange={(e) => setGrade(e.target.value)} 
              placeholder="0.0" 
              type="number" 
              step="0.1" 
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button className="brutal-btn" onClick={save}>
              <span>{editingId ? 'COMMIT_UPDATE' : 'EXECUTE_INSERT'}</span>
            </button>
            {editingId && (
              <button className="brutal-btn-ghost" onClick={clearForm}>
                ABORT_EDIT
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Right Data Vault (Grid) */}
      <section className="data-vault">
        <div className="vault-header">
          <h2>VAULT_DATA</h2>
          <div className="stat-box">
            <div className="label">ACTIVE_RECORDS</div>
            <div className="value">[{students.length}]</div>
          </div>
        </div>

        <div className="dossier-grid" ref={gridRef}>
          {students.map((s) => (
            <article key={s.id} className="dossier-card">
              <div className="card-top">
                <span className="id">ID: {s.id}</span>
                <span>SYS_VERIFIED</span>
              </div>
              <div className="card-body">
                <h3>{s.name}</h3>
                <div className="card-meta">
                  <div className="meta-item">
                    <span>AGE</span>
                    <span>{s.age}</span>
                  </div>
                  <div className="meta-item grade">
                    <span>SCORE</span>
                    <span>{Number(s.grade).toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <div className="card-actions">
                <button className="action-btn" onClick={() => edit(s)}>
                  <Edit2 size={14} className="mx-auto" />
                </button>
                <button className="action-btn delete" onClick={() => remove(s.id)}>
                  <Trash2 size={14} className="mx-auto" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
