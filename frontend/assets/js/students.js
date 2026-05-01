const API_URL = "http://localhost:8000";
const token = localStorage.getItem("token");

if (!token) window.location.href = "index.html";

let allStudents = [];
let editingId = null;
let deletingId = null;

document.addEventListener("DOMContentLoaded", async () => {
    loadUserInfo();
    bindEvents();
    await fetchStudents();
});

function loadUserInfo() {
    const email = localStorage.getItem("userEmail") || "usuario";
    document.getElementById("user-email").textContent = email;
    document.getElementById("user-avatar").textContent = email.slice(0, 2).toUpperCase();
}

function bindEvents() {
    document.getElementById("logout-btn").addEventListener("click", logout);
    document.getElementById("add-btn").addEventListener("click", () => openFormModal(null));
    document.getElementById("modal-close-btn").addEventListener("click", closeFormModal);
    document.getElementById("modal-cancel-btn").addEventListener("click", closeFormModal);
    document.getElementById("modal-save-btn").addEventListener("click", saveStudent);
    document.getElementById("delete-modal-close").addEventListener("click", closeDeleteModal);
    document.getElementById("delete-cancel-btn").addEventListener("click", closeDeleteModal);
    document.getElementById("delete-confirm-btn").addEventListener("click", confirmDelete);
    document.getElementById("search-input").addEventListener("input", filterTable);

    document.getElementById("f-name").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("modal-save-btn").click();
    });
    document.getElementById("f-age").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("modal-save-btn").click();
    });
    document.getElementById("f-grade").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("modal-save-btn").click();
    });

    document.getElementById("form-modal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("form-modal")) closeFormModal();
    });
    document.getElementById("delete-modal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("delete-modal")) closeDeleteModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeFormModal();
            closeDeleteModal();
        }
    });
}

async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (res.status === 401) {
        localStorage.clear();
        window.location.href = "index.html";
        return null;
    }

    return res;
}

async function fetchStudents() {
    showTableLoading(true);
    try {
        const res = await apiFetch("/students/");
        if (!res) return;
        if (!res.ok) throw new Error("Error al cargar estudiantes");
        allStudents = await res.json();
        renderTable(allStudents);
        updateStats(allStudents);
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        showTableLoading(false);
    }
}

function renderTable(students) {
    const tbody = document.getElementById("students-tbody");
    const table = document.getElementById("students-table");
    const empty = document.getElementById("empty-state");
    const countBadge = document.getElementById("count-badge");

    countBadge.textContent = students.length === 0
        ? ""
        : `${students.length} registro${students.length !== 1 ? "s" : ""}`;

    if (students.length === 0) {
        table.style.display = "none";
        empty.style.display = "block";
        return;
    }

    table.style.display = "table";
    empty.style.display = "none";

    tbody.innerHTML = "";
    students.forEach((s, i) => {
        const tr = document.createElement("tr");
        tr.className = "row-enter";
        tr.style.animationDelay = `${i * 30}ms`;
        tr.innerHTML = `
            <td class="td-id">#${s.id}</td>
            <td class="td-name">${escapeHtml(s.name)}</td>
            <td>${s.age} <span style="color:var(--slate-400);font-size:12px">años</span></td>
            <td>${renderGradeBadge(s.grade)}</td>
            <td>
                <div class="row-actions">
                    <button class="btn-edit" title="Editar" onclick="openFormModal(${s.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-delete" title="Eliminar" onclick="openDeleteModal(${s.id}, '${escapeHtml(s.name)}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderGradeBadge(grade) {
    if (grade >= 4.5) return `<span class="badge badge-green">${grade.toFixed(1)}</span>`;
    if (grade >= 3.5) return `<span class="badge badge-blue">${grade.toFixed(1)}</span>`;
    if (grade >= 3.0) return `<span class="badge badge-amber">${grade.toFixed(1)}</span>`;
    return `<span class="badge badge-red">${grade.toFixed(1)}</span>`;
}

function updateStats(students) {
    const total = students.length;
    const avg = total > 0 ? students.reduce((s, st) => s + st.grade, 0) / total : 0;
    const best = total > 0 ? Math.max(...students.map((s) => s.grade)) : null;
    const bestStudent = best !== null ? students.find((s) => s.grade === best) : null;

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-avg").innerHTML = total > 0
        ? `${avg.toFixed(2)} <span>/ 5</span>`
        : `0.0 <span>/ 5</span>`;
    document.getElementById("stat-best").innerHTML = best !== null
        ? `${best.toFixed(1)} <span>${bestStudent ? escapeHtml(bestStudent.name.split(" ")[0]) : ""}</span>`
        : `— <span></span>`;

    setTimeout(() => {
        document.getElementById("bar-total").style.width = `${Math.min((total / 20) * 100, 100)}%`;
        document.getElementById("bar-avg").style.width = `${(avg / 5) * 100}%`;
        document.getElementById("bar-best").style.width = best !== null ? `${(best / 5) * 100}%` : "0%";
    }, 100);
}

function filterTable() {
    const query = document.getElementById("search-input").value.toLowerCase().trim();
    const filtered = query
        ? allStudents.filter((s) => s.name.toLowerCase().includes(query))
        : allStudents;
    renderTable(filtered);
}

function openFormModal(id) {
    editingId = id;
    const isEdit = id !== null;
    document.getElementById("modal-title").textContent = isEdit ? "Editar estudiante" : "Nuevo estudiante";
    document.getElementById("modal-save-btn").textContent = isEdit ? "Guardar cambios" : "Guardar";
    clearFieldErrors();

    if (isEdit) {
        const s = allStudents.find((st) => st.id === id);
        if (s) {
            document.getElementById("f-name").value = s.name;
            document.getElementById("f-age").value = s.age;
            document.getElementById("f-grade").value = s.grade;
        }
    } else {
        document.getElementById("f-name").value = "";
        document.getElementById("f-age").value = "";
        document.getElementById("f-grade").value = "";
    }

    const modal = document.getElementById("form-modal");
    modal.style.display = "flex";
    modal.classList.remove("closing");
    setTimeout(() => document.getElementById("f-name").focus(), 100);
}

function closeFormModal() {
    const modal = document.getElementById("form-modal");
    modal.classList.add("closing");
    modal.addEventListener("animationend", () => {
        modal.style.display = "none";
        modal.classList.remove("closing");
    }, { once: true });
}

function openDeleteModal(id, name) {
    deletingId = id;
    document.getElementById("delete-student-name").textContent = name;
    const modal = document.getElementById("delete-modal");
    modal.style.display = "flex";
    modal.classList.remove("closing");
}

function closeDeleteModal() {
    const modal = document.getElementById("delete-modal");
    modal.classList.add("closing");
    modal.addEventListener("animationend", () => {
        modal.style.display = "none";
        modal.classList.remove("closing");
    }, { once: true });
}

async function saveStudent() {
    const name = document.getElementById("f-name").value.trim();
    const age = parseInt(document.getElementById("f-age").value);
    const grade = parseFloat(document.getElementById("f-grade").value);

    clearFieldErrors();
    let hasError = false;

    if (!name || name.length < 2) {
        showFieldError("err-name", "f-name");
        hasError = true;
    }
    if (!age || age < 1) {
        showFieldError("err-age", "f-age");
        hasError = true;
    }
    if (isNaN(grade) || grade < 0 || grade > 5) {
        showFieldError("err-grade", "f-grade");
        hasError = true;
    }

    if (hasError) return;

    const btn = document.getElementById("modal-save-btn");
    const originalText = btn.textContent;
    btn.innerHTML = `<span class="spinner"></span> Guardando...`;
    btn.disabled = true;

    try {
        const isEdit = editingId !== null;
        const res = await apiFetch(
            isEdit ? `/students/${editingId}` : "/students/",
            {
                method: isEdit ? "PUT" : "POST",
                body: JSON.stringify({ name, age, grade }),
            }
        );

        if (!res) return;
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Error al guardar");
        }

        closeFormModal();
        await fetchStudents();
        showToast(isEdit ? "Estudiante actualizado" : "Estudiante creado", "success");
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function confirmDelete() {
    if (!deletingId) return;

    const btn = document.getElementById("delete-confirm-btn");
    btn.innerHTML = `<span class="spinner"></span> Eliminando...`;
    btn.disabled = true;

    try {
        const res = await apiFetch(`/students/${deletingId}`, { method: "DELETE" });
        if (!res) return;
        if (!res.ok && res.status !== 204) throw new Error("Error al eliminar");

        closeDeleteModal();
        await fetchStudents();
        showToast("Estudiante eliminado", "success");
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> Eliminar`;
        btn.disabled = false;
        deletingId = null;
    }
}

function showTableLoading(show) {
    document.getElementById("table-loading").style.display = show ? "flex" : "none";
    if (show) {
        document.getElementById("students-table").style.display = "none";
        document.getElementById("empty-state").style.display = "none";
    }
}

function showFieldError(errorId, inputId) {
    document.getElementById(errorId).classList.add("visible");
    document.getElementById(inputId).classList.add("error");
}

function clearFieldErrors() {
    ["err-name", "err-age", "err-grade"].forEach((id) => {
        document.getElementById(id).classList.remove("visible");
    });
    ["f-name", "f-age", "f-grade"].forEach((id) => {
        document.getElementById(id).classList.remove("error");
    });
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function showToast(message, type = "info", duration = 3500) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-dot"></span>${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("leaving");
        toast.addEventListener("animationend", () => toast.remove());
    }, duration);
}
