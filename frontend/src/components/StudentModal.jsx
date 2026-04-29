import { useState, useEffect } from 'react'

export default function StudentModal({ student, onSave, onClose, loading }) {
  const [form, setForm] = useState({ name: '', age: '', grade: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (student) setForm({ name: student.name, age: student.age, grade: student.grade })
  }, [student])

  function validate() {
    const e = {}
    if (!form.name || form.name.length < 2) e.name = 'Mínimo 2 caracteres'
    if (!form.age || form.age < 1) e.age = 'Edad inválida'
    if (form.grade === '' || form.grade < 0 || form.grade > 5) e.grade = 'Nota debe estar entre 0 y 5'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSave({ name: form.name, age: Number(form.age), grade: Number(form.grade) })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{student ? 'Editar estudiante' : 'Nuevo estudiante'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="field-group">
            <label>Nombre completo</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: María García"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>Edad</label>
              <input
                type="number"
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                placeholder="18"
                min="1"
              />
              {errors.age && <span className="field-error">{errors.age}</span>}
            </div>
            <div className="field-group">
              <label>Nota (0–5)</label>
              <input
                type="number"
                value={form.grade}
                onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                placeholder="4.5"
                min="0"
                max="5"
                step="0.1"
              />
              {errors.grade && <span className="field-error">{errors.grade}</span>}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : student ? 'Actualizar' : 'Crear estudiante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
