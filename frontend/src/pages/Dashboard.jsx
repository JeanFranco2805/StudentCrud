import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import StudentModal from '../components/StudentModal'
import Toast from '../components/Toast'

function gradeColor(g) {
  if (g >= 4) return 'grade--high'
  if (g >= 3) return 'grade--mid'
  return 'grade--low'
}

function GradeBar({ value }) {
  const pct = (value / 5) * 100
  return (
    <div className="grade-bar-wrap">
      <div className="grade-bar-track">
        <div className="grade-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className={`grade-badge ${gradeColor(value)}`}>{Number(value).toFixed(1)}</span>
    </div>
  )
}

export default function Dashboard({ session }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null) // null | 'create' | student object
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')

  const email = session.user.email

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getStudents()
      setStudents(data)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  async function handleSave(form) {
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.createStudent(form)
        showToast('Estudiante creado correctamente')
      } else {
        await api.updateStudent(modal.id, form)
        showToast('Estudiante actualizado')
      }
      setModal(null)
      load()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteStudent(id)
      showToast('Estudiante eliminado')
      setDeleteTarget(null)
      load()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const total = students.length
  const avg = total ? (students.reduce((a, s) => a + s.grade, 0) / total).toFixed(2) : '—'
  const top = total ? students.reduce((a, s) => s.grade > a.grade ? s : a, students[0]) : null

  return (
    <div className="dash-root">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-logo">
          <span className="dash-logo-mark">L</span>
          <span className="dash-logo-text">Ledger</span>
        </div>
        <div className="dash-header-right">
          <span className="dash-user-email">{email}</span>
          <button className="btn-signout" onClick={() => supabase.auth.signOut()}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dash-main">
        {/* Stats */}
        <section className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Total estudiantes</span>
            <span className="stat-value">{total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Nota promedio</span>
            <span className="stat-value">{avg}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Mayor nota</span>
            <span className="stat-value">{top ? `${top.name.split(' ')[0]} · ${top.grade}` : '—'}</span>
          </div>
        </section>

        {/* Table section */}
        <section className="table-section">
          <div className="table-toolbar">
            <div className="toolbar-left">
              <h2 className="table-title">Estudiantes</h2>
              <span className="table-count">{filtered.length} registros</span>
            </div>
            <div className="toolbar-right">
              <div className="search-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  className="search-input"
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={() => setModal('create')}>
                + Agregar
              </button>
            </div>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div className="table-empty">
                <div className="loading-ring" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="table-empty">
                <span className="empty-icon">◈</span>
                <p>{search ? 'Sin resultados para tu búsqueda' : 'No hay estudiantes registrados'}</p>
                {!search && (
                  <button className="btn-primary" onClick={() => setModal('create')}>Agregar primero</button>
                )}
              </div>
            ) : (
              <table className="students-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Edad</th>
                    <th>Nota</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td><span className="td-id">#{s.id}</span></td>
                      <td><span className="td-name">{s.name}</span></td>
                      <td><span className="td-age">{s.age} años</span></td>
                      <td><GradeBar value={s.grade} /></td>
                      <td>
                        <div className="row-actions">
                          <button className="btn-action btn-edit" onClick={() => setModal(s)}>
                            Editar
                          </button>
                          <button className="btn-action btn-delete" onClick={() => setDeleteTarget(s)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* Modal create/edit */}
      {modal !== null && (
        <StudentModal
          student={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          loading={saving}
        />
      )}

      {/* Confirm delete */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal modal--sm">
            <div className="modal-header">
              <h3>Confirmar eliminación</h3>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>×</button>
            </div>
            <p className="delete-confirm-text">
              ¿Eliminar a <strong>{deleteTarget.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteTarget.id)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
