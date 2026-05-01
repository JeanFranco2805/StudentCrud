const API_URL = 'https://tu-api.onrender.com';

let currentEmail = '';
let editingId = null;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(elId) {
  document.getElementById(elId).classList.add('hidden');
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  btn.textContent = loading ? 'Por favor espera...' : btn.dataset.label;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-send-otp').dataset.label = 'Enviar código';
  document.getElementById('btn-verify-otp').dataset.label = 'Verificar';
  document.getElementById('btn-save').dataset.label = 'Guardar';

  const token = sessionStorage.getItem('token');
  const email = sessionStorage.getItem('email');
  if (token && email) {
    currentEmail = email;
    document.getElementById('header-email').textContent = email;
    showScreen('screen-students');
    loadStudents();
  }
});

document.getElementById('btn-send-otp').addEventListener('click', async () => {
  const email = document.getElementById('email-input').value.trim();
  hideError('login-error');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('login-error', 'Por favor ingresa un correo electrónico válido.');
    return;
  }

  setLoading('btn-send-otp', true);

  try {
    const res = await fetch(`${API_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Error al enviar el código.');
    }

    currentEmail = email;
    document.getElementById('otp-subtitle').textContent =
      `Código enviado a ${email}. Revisa tu bandeja de entrada.`;
    showScreen('screen-otp');
    document.querySelectorAll('.otp-digit')[0].focus();
  } catch (err) {
    showError('login-error', err.message);
  } finally {
    setLoading('btn-send-otp', false);
  }
});

document.getElementById('btn-back').addEventListener('click', () => {
  hideError('otp-error');
  document.querySelectorAll('.otp-digit').forEach(i => (i.value = ''));
  showScreen('screen-login');
});

document.querySelectorAll('.otp-digit').forEach((input, idx, all) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
    if (input.value && idx < all.length - 1) all[idx + 1].focus();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !input.value && idx > 0) all[idx - 1].focus();
  });
});

document.getElementById('btn-verify-otp').addEventListener('click', async () => {
  const digits = [...document.querySelectorAll('.otp-digit')].map(i => i.value).join('');
  hideError('otp-error');

  if (digits.length !== 6) {
    showError('otp-error', 'Ingresa los 6 dígitos del código.');
    return;
  }

  setLoading('btn-verify-otp', true);

  try {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail, otp: digits })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Código incorrecto.');

    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('email', currentEmail);
    document.getElementById('header-email').textContent = currentEmail;
    showScreen('screen-students');
    loadStudents();
  } catch (err) {
    showError('otp-error', err.message);
  } finally {
    setLoading('btn-verify-otp', false);
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.clear();
  currentEmail = '';
  editingId = null;
  document.getElementById('email-input').value = '';
  document.querySelectorAll('.otp-digit').forEach(i => (i.value = ''));
  showScreen('screen-login');
});

function getToken() {
  return sessionStorage.getItem('token');
}

async function loadStudents() {
  try {
    const res = await fetch(`${API_URL}/students`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (res.status === 401) { sessionStorage.clear(); showScreen('screen-login'); return; }
    const students = await res.json();
    renderTable(students);
  } catch {
    renderTable([]);
  }
}

function getGradeClass(grade) {
  if (grade >= 4.0) return 'grade-high';
  if (grade >= 3.0) return 'grade-mid';
  return 'grade-low';
}

function renderTable(students) {
  const tbody = document.getElementById('students-tbody');
  const countEl = document.getElementById('student-count');
  countEl.textContent = students.length;

  if (students.length === 0) {
    tbody.innerHTML = `<tr id="empty-row"><td colspan="5" class="empty-state">No hay estudiantes registrados aún</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${s.nombre}</td>
      <td>${s.edad}</td>
      <td><span class="grade-pill ${getGradeClass(s.nota)}">${Number(s.nota).toFixed(1)}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" onclick="startEdit(${s.id}, '${s.nombre}', ${s.edad}, ${s.nota})">Editar</button>
          <button class="btn-delete" onclick="deleteStudent(${s.id})">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function startEdit(id, nombre, edad, nota) {
  editingId = id;
  document.getElementById('student-name').value = nombre;
  document.getElementById('student-age').value = edad;
  document.getElementById('student-grade').value = nota;
  document.getElementById('form-title').textContent = 'Editar estudiante';
  document.getElementById('btn-save').textContent = 'Actualizar';
  document.getElementById('btn-cancel').classList.remove('hidden');
  document.getElementById('student-name').focus();
}

document.getElementById('btn-cancel').addEventListener('click', () => {
  cancelEdit();
});

function cancelEdit() {
  editingId = null;
  document.getElementById('student-name').value = '';
  document.getElementById('student-age').value = '';
  document.getElementById('student-grade').value = '';
  document.getElementById('form-title').textContent = 'Registrar estudiante';
  document.getElementById('btn-save').textContent = 'Guardar';
  document.getElementById('btn-cancel').classList.add('hidden');
  hideError('form-error');
}

document.getElementById('btn-save').addEventListener('click', async () => {
  const nombre = document.getElementById('student-name').value.trim();
  const edad = parseInt(document.getElementById('student-age').value);
  const nota = parseFloat(document.getElementById('student-grade').value);
  hideError('form-error');

  if (!nombre) { showError('form-error', 'El nombre es obligatorio.'); return; }
  if (!edad || edad < 1 || edad > 99) { showError('form-error', 'Ingresa una edad válida (1-99).'); return; }
  if (isNaN(nota) || nota < 0 || nota > 5) { showError('form-error', 'La nota debe estar entre 0 y 5.'); return; }

  const payload = { nombre, edad, nota };
  const token = getToken();

  try {
    let res;
    if (editingId) {
      res = await fetch(`${API_URL}/students/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Error al guardar.');
    }

    cancelEdit();
    loadStudents();
  } catch (err) {
    showError('form-error', err.message);
  }
});

async function deleteStudent(id) {
  if (!confirm('¿Estás seguro de eliminar este estudiante?')) return;

  try {
    const res = await fetch(`${API_URL}/students/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Error al eliminar.');
    loadStudents();
  } catch (err) {
    alert(err.message);
  }
}
