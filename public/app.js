/**
 * Student Management Platform - Client Application
 * Handles authentication, real-time search & filters, pagination,
 * student CRUD modal operations, CSV export, and Theme (Dark/Light) switching.
 */

const API = "/api";
const $ = id => document.getElementById(id);

const state = {
  token: localStorage.getItem("student-management_token") || "",
  user: null,
  page: 1,
  limit: 8,
  pages: 1,
  students: [],
  mode: "login",
  timer: null
};

// Safe HTML character escaping
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[c]));

/* ==========================================================================
   THEME TOGGLE MANAGEMENT (DARK / LIGHT MODE)
   ========================================================================== */
function getSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || getSystemTheme();
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const target = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", target);
  localStorage.setItem("theme", target);
}

// Bind theme toggle buttons
const themeBtnApp = $("themeToggle");
const themeBtnAuth = $("themeToggleAuth");
if (themeBtnApp) themeBtnApp.onclick = toggleTheme;
if (themeBtnAuth) themeBtnAuth.onclick = toggleTheme;

/* ==========================================================================
   API CLIENT
   ========================================================================== */
async function api(path, opt = {}) {
  let r;
  try {
    r = await fetch(API + path, {
      ...opt,
      headers: {
        ...(opt.body ? { "Content-Type": "application/json" } : {}),
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
        ...(opt.headers || {})
      }
    });
  } catch (e) {
    throw Error("Cannot reach the API server. Please check your network and server status.");
  }

  if (opt.download && r.ok) return r.blob();

  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && state.token) {
      logout();
    }
    throw Error(d.message || `Request failed with status ${r.status}`);
  }
  return d;
}

/* ==========================================================================
   TOAST NOTIFICATION
   ========================================================================== */
function notify(msg, type = "success") {
  const t = $("toast");
  if (!t) return;
  t.innerHTML = `<span>${type === "success" ? "✓" : "⚠️"}</span> <span>${esc(msg)}</span>`;
  t.className = `toast ${type}`;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => t.classList.add("hidden"), 4000);
}

/* ==========================================================================
   AUTHENTICATION VIEW & TAB SWITCHING
   ========================================================================== */
function mode(m) {
  state.mode = m;
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.mode === m));
  const isRegister = m === "register";

  $("nameGroup").classList.toggle("hidden", !isRegister);
  $("authName").required = isRegister;
  $("authTitle").textContent = isRegister ? "Create your student account" : "Sign in to your workspace";
  $("authSubtitle").textContent = isRegister
    ? "Register as a student to access directory records."
    : "Enter your credentials to access the student directory.";
  $("authSubmit").innerHTML = isRegister
    ? '<span>Create account</span> <span class="btn-arrow">→</span>'
    : '<span>Sign in</span> <span class="btn-arrow">→</span>';
  $("authPassword").autocomplete = isRegister ? "new-password" : "current-password";
  $("authError").classList.add("hidden");
}

document.querySelectorAll(".tab").forEach(b => {
  b.onclick = () => mode(b.dataset.mode);
});

$("authForm").onsubmit = async e => {
  e.preventDefault();
  const b = $("authSubmit");
  b.disabled = true;

  try {
    const body = {
      email: $("authEmail").value.trim().toLowerCase(),
      password: $("authPassword").value
    };
    if (state.mode === "register") {
      body.name = $("authName").value.trim();
    }

    const d = await api(`/auth/${state.mode}`, {
      method: "POST",
      body: JSON.stringify(body)
    });

    state.token = d.token;
    state.user = d.user;
    localStorage.setItem("student-management_token", d.token);
    notify(d.message || "Signed in successfully!");
    await showApp();
  } catch (err) {
    $("authError").textContent = err.message;
    $("authError").classList.remove("hidden");
  } finally {
    b.disabled = false;
  }
};

function logout() {
  state.token = "";
  state.user = null;
  localStorage.removeItem("student-management_token");
  $("appView").classList.add("hidden");
  $("authView").classList.remove("hidden");
  mode("login");
}

$("logoutBtn").onclick = logout;

/* ==========================================================================
   APPLICATION WORKSPACE
   ========================================================================== */
async function showApp() {
  try {
    const res = await api("/auth/me");
    state.user = res.user;
  } catch (e) {
    logout();
    return;
  }

  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");

  const u = state.user;
  const admin = u.role === "admin";

  $("userName").textContent = u.name || "User";
  $("userRole").textContent = admin ? "Administrator" : "Student";
  $("greetingName").textContent = (u.name || "there").split(" ")[0];
  $("avatar").textContent = (u.name || "U")[0].toUpperCase();

  const roleBadge = $("roleBadge");
  roleBadge.textContent = u.role.toUpperCase();
  roleBadge.style.color = admin ? "var(--badge-admin-text)" : "var(--badge-student-text)";
  roleBadge.style.background = admin ? "var(--badge-admin-bg)" : "var(--badge-student-bg)";

  // Show/hide administrative controls
  document.querySelectorAll(".admin-only").forEach(x => {
    x.classList.toggle("hidden", !admin);
  });

  $("todayLabel").textContent = "📅 " + new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date());

  const currentYear = new Date().getFullYear();
  if ($("year")) $("year").textContent = currentYear;
  document.querySelectorAll(".auth-year").forEach(x => x.textContent = currentYear);

  await Promise.all([stats(), students()]);
}

/* ==========================================================================
   METRICS & STATS
   ========================================================================== */
async function stats() {
  try {
    const d = (await api("/students/stats")).data;
    $("metricTotal").textContent = d.total ?? 0;
    $("metricActive").textContent = d.active ?? 0;
    $("metricDepartments").textContent = d.departments ?? 0;
  } catch (e) {
    notify(e.message, "error");
  }
}

/* ==========================================================================
   TABLE RENDERING
   ========================================================================== */
function getAvatarClass(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return `avatar-${Math.abs(hash) % 6}`;
}

function render(items) {
  const admin = state.user?.role === "admin";
  const body = $("studentsBody");

  if (!items.length) {
    body.innerHTML = `
      <tr>
        <td colspan="${admin ? 7 : 6}" class="empty">
          <div class="empty-state">
            <span class="empty-icon">🔍</span>
            <strong>No matching student records found</strong>
            <p>Try clearing filters or adjusting your search keywords.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = items.map(s => {
    const rawName = s.name || "Student";
    const initials = rawName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(x => x[0] || "")
      .join("")
      .toUpperCase();
    
    const avatarClass = getAvatarClass(rawName);
    const rawStatus = s.status || "Active";
    const statusKey = rawStatus.replace(/\s+/g, "-");
    const deptKey = (s.department || "OTHER").toUpperCase();

    return `
      <tr>
        <td>
          <div class="person">
            <span class="initial ${avatarClass}">${esc(initials)}</span>
            <span>
              <span class="pname">${esc(s.name)}</span>
              <span class="sub">${esc(s.phone || "No phone listed")}</span>
            </span>
          </div>
        </td>
        <td>
          <span class="usn-text">${esc(s.usn)}</span>
        </td>
        <td>
          <span class="dept-badge dept-${esc(deptKey)}">${esc(s.department)}</span>
        </td>
        <td>Semester ${esc(s.semester)}</td>
        <td>
          <span class="status-badge status-${esc(statusKey)}">
            <span class="status-dot"></span>
            ${esc(s.status)}
          </span>
        </td>
        <td>${esc(s.email)}</td>
        ${admin ? `
          <td>
            <div class="row-actions">
              <button class="action" data-action="edit" data-id="${esc(s._id)}">Edit</button>
              <button class="action delete" data-action="delete" data-id="${esc(s._id)}">Delete</button>
            </div>
          </td>
        ` : ""}
      </tr>
    `;
  }).join("");
}

/* ==========================================================================
   FILTERING & PAGINATION
   ========================================================================== */
async function students() {
  const p = new URLSearchParams({
    page: state.page,
    limit: state.limit
  });

  const searchVal = $("searchInput").value.trim();
  if (searchVal) p.set("search", searchVal);

  for (const [id, key] of [
    ["departmentFilter", "department"],
    ["semesterFilter", "semester"],
    ["statusFilter", "status"]
  ]) {
    if ($(id).value) p.set(key, $(id).value);
  }

  try {
    const d = await api(`/students?${p}`);
    state.students = d.data;
    state.pages = Math.max(1, d.pagination.pages);
    render(d.data);

    const x = d.pagination;
    const startRange = x.total ? (x.page - 1) * x.limit + 1 : 0;
    const endRange = Math.min(x.page * x.limit, x.total);

    $("tableSummary").textContent = `Showing ${startRange}–${endRange} of ${x.total} students`;
    $("pageLabel").textContent = `Page ${x.page} of ${state.pages}`;
    $("prevPage").disabled = state.page <= 1;
    $("nextPage").disabled = state.page >= state.pages;
  } catch (e) {
    $("studentsBody").innerHTML = `
      <tr>
        <td colspan="7" class="empty">
          <div class="empty-state">
            <span class="empty-icon">⚠️</span>
            <strong>Failed to load student records</strong>
            <p>${esc(e.message)}</p>
          </div>
        </td>
      </tr>
    `;
  }
}

function filters() {
  state.page = 1;
  students();
}

$("searchInput").oninput = () => {
  clearTimeout(state.timer);
  state.timer = setTimeout(filters, 250);
};

["departmentFilter", "semesterFilter", "statusFilter"].forEach(id => {
  $(id).onchange = filters;
});

$("resetFilters").onclick = () => {
  ["searchInput", "departmentFilter", "semesterFilter", "statusFilter"].forEach(id => {
    $(id).value = "";
  });
  filters();
};

$("prevPage").onclick = () => {
  if (state.page > 1) {
    state.page--;
    students();
  }
};

$("nextPage").onclick = () => {
  if (state.page < state.pages) {
    state.page++;
    students();
  }
};

$("directoryNav").onclick = () => {
  $("searchInput").focus();
};

/* ==========================================================================
   STUDENT RECORD MODAL (CREATE & UPDATE)
   ========================================================================== */
function openModal(s = null) {
  $("studentForm").reset();
  $("formError").classList.add("hidden");
  $("studentId").value = s?._id || "";
  $("modalTitle").textContent = s ? "Edit Student Details" : "Add New Student";
  $("saveStudent").innerHTML = s
    ? '<span>Save changes</span> <span class="btn-arrow">→</span>'
    : '<span>Save student</span> <span class="btn-arrow">→</span>';

  if (s) {
    for (const [id, key] of [
      ["studentName", "name"],
      ["studentUsn", "usn"],
      ["studentEmail", "email"],
      ["studentDepartment", "department"],
      ["studentSemester", "semester"],
      ["studentStatus", "status"],
      ["studentPhone", "phone"],
      ["studentNotes", "notes"]
    ]) {
      $(id).value = s[key] ?? "";
    }
  }

  $("studentDialog").showModal();
}

$("addBtn").onclick = () => openModal();
$("closeModal").onclick = () => $("studentDialog").close();
$("cancelModal").onclick = () => $("studentDialog").close();

// Close dialog when clicking backdrop
$("studentDialog").addEventListener("click", e => {
  const rect = $("studentDialog").getBoundingClientRect();
  const isInDialog = (
    rect.top <= e.clientY &&
    e.clientY <= rect.top + rect.height &&
    rect.left <= e.clientX &&
    e.clientX <= rect.left + rect.width
  );
  if (!isInDialog) {
    $("studentDialog").close();
  }
});

$("studentsBody").onclick = async e => {
  const b = e.target.closest("[data-action]");
  if (!b) return;

  const s = state.students.find(x => x._id === b.dataset.id);
  if (!s) return;

  if (b.dataset.action === "edit") {
    return openModal(s);
  }

  if (b.dataset.action === "delete") {
    if (confirm(`Are you sure you want to delete ${s.name} (${s.usn})? This action cannot be undone.`)) {
      try {
        const res = await api(`/students/${s._id}`, { method: "DELETE" });
        notify(res.message);
        await Promise.all([stats(), students()]);
      } catch (err) {
        notify(err.message, "error");
      }
    }
  }
};

$("studentForm").onsubmit = async e => {
  e.preventDefault();
  const id = $("studentId").value;
  const p = {
    name: $("studentName").value.trim(),
    usn: $("studentUsn").value.trim().toUpperCase(),
    email: $("studentEmail").value.trim().toLowerCase(),
    department: $("studentDepartment").value,
    semester: Number($("studentSemester").value),
    status: $("studentStatus").value,
    phone: $("studentPhone").value.trim(),
    notes: $("studentNotes").value.trim()
  };

  const b = $("saveStudent");
  b.disabled = true;

  try {
    const d = await api(id ? `/students/${id}` : "/students", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(p)
    });
    $("studentDialog").close();
    notify(d.message);
    state.page = 1;
    await Promise.all([stats(), students()]);
  } catch (err) {
    $("formError").textContent = err.message;
    $("formError").classList.remove("hidden");
  } finally {
    b.disabled = false;
  }
};

/* ==========================================================================
   EXPORT CSV
   ========================================================================== */
$("exportBtn").onclick = async () => {
  try {
    const blob = await api("/students/export.csv", { download: true });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-directory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Student directory downloaded as CSV.");
  } catch (e) {
    notify(e.message, "error");
  }
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
(async () => {
  initTheme();
  if (state.token) {
    await showApp();
  } else {
    mode("login");
    $("authView").classList.remove("hidden");
  }
  const y = new Date().getFullYear();
  if ($("year")) $("year").textContent = y;
  document.querySelectorAll(".auth-year").forEach(x => x.textContent = y);
})();
