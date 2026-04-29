import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No autenticado')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  }
}

async function request(path, options = {}) {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Error en la petición')
  return data
}

export const api = {
  getStudents: () => request('/students/'),
  createStudent: (body) => request('/students/', { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (id, body) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),
}
