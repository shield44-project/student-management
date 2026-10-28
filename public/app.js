/**
 * Student Management Platform - Client Application
 * Features:
 * - Full Directory Management (CRUD for Admin, Search, Multi-Filter, Pagination, CSV Export)
 * - Student Academic Hub (Attendance 75% Calculator, Timetable, CGPA, Notices, Resources)
 * - Interactive Student Profile Dossier Modal
 * - Dark & White Mode with instant persistence
 */

const API = "/api";
const $ = id => document.getElementById(id);

const state = {
  token: localStorage.getItem("student-management_token") || "",
  user: null,
  activeView: "overview", // "overview" | "studentHub"
  page: 1,
  limit: 8,
  pages: 1,
  students: [],
  selectedStudent: null,
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
   VIEW SWITCHING (DIRECTORY vs. STUDENT ACADEMIC HUB)
   ========================================================================== */
function switchView(viewName) {
  state.activeView = viewName;
  const isOverview = viewName === "overview";

  $("overviewNav").classList.toggle("active", isOverview);
  $("studentHubNav").classList.toggle("active", !isOverview);

  $("directoryView").classList.toggle("hidden", !isOverview);
  $("studentHubView").classList.toggle("hidden", isOverview);

  $("activeViewTitle").textContent = isOverview
    ? "Overview & Student Directory"
    : "Student Academic Hub & Portal";

  if (!isOverview) {
    updateStudentHub();
  }
}

$("overviewNav").onclick = () => switchView("overview");
$("studentHubNav").onclick = () => switchView("studentHub");

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

  // Pre-load student for hub
  if (state.students.length > 0) {
    state.selectedStudent = state.students[0];
    populateStudentHubSelector();
  }
}

/* ==========================================================================
   METRICS & STATS
   ========================================================================== */
async function stats() {
  try {
    const d = (await api("/students/stats")).data;
    $("metricTotal").textContent = d.total ?? 0;
    if ($("metricAvgAttendance")) $("metricAvgAttendance").textContent = `${d.avgAttendance ?? 85}%`;
    if ($("metricShortage")) $("metricShortage").textContent = `${d.shortageCount ?? 0} students`;
    if ($("metricAvgCgpa")) $("metricAvgCgpa").textContent = `${d.avgCgpa ?? 8.2} / 10`;
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
        <td colspan="9" class="empty">
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

    // Attendance styling
    const attVal = Number(s.attendance ?? 85);
    let attClass = "att-good";
    if (attVal < 75) attClass = "att-shortage";
    else if (attVal < 85) attClass = "att-warning";

    // CGPA styling
    const cgpaVal = Number(s.cgpa ?? 8.0).toFixed(2);

    // Fee Status styling
    const feeVal = s.feeStatus || "Paid";

    return `
      <tr>
        <td>
          <div class="person">
            <span class="initial ${avatarClass}">${esc(initials)}</span>
            <span>
              <span class="pname">${esc(s.name)}</span>
              <span class="sub">${esc(s.phone || s.email)}</span>
            </span>
          </div>
        </td>
        <td>
          <span class="usn-text">${esc(s.usn)}</span>
        </td>
        <td>
          <span class="dept-badge dept-${esc(deptKey)}">${esc(s.department)}</span>
        </td>
        <td>Sem ${esc(s.semester)}</td>
        <td>
          <div class="att-cell ${attClass}">
            <div class="att-top">
              <span class="att-pct">${attVal}%</span>
              ${attVal < 75 ? '<small class="text-danger" title="Shortage Alert">&lt;75% ⚠️</small>' : ''}
            </div>
            <div class="att-track">
              <div class="att-bar" style="width: ${attVal}%;"></div>
            </div>
          </div>
        </td>
        <td>
          <span class="cgpa-pill">⭐ ${cgpaVal}</span>
        </td>
        <td>
          <span class="fee-badge fee-${esc(feeVal)}">${esc(feeVal)}</span>
        </td>
        <td>
          <span class="status-badge status-${esc(statusKey)}">
            <span class="status-dot"></span>
            ${esc(s.status)}
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="action view" data-action="profile" data-id="${esc(s._id)}" title="View complete student dossier">👁️ View</button>
            ${admin ? `
              <button class="action" data-action="edit" data-id="${esc(s._id)}">Edit</button>
              <button class="action delete" data-action="delete" data-id="${esc(s._id)}">Delete</button>
            ` : ""}
          </div>
        </td>
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

  if ($("departmentFilter").value) p.set("department", $("departmentFilter").value);
  if ($("semesterFilter").value) p.set("semester", $("semesterFilter").value);
  if ($("statusFilter").value) p.set("status", $("statusFilter").value);
  if ($("feeFilter").value) p.set("feeStatus", $("feeFilter").value);
  if ($("attendanceFilter").value) p.set("attendanceTier", $("attendanceFilter").value);

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

    populateStudentHubSelector();
  } catch (e) {
    $("studentsBody").innerHTML = `
      <tr>
        <td colspan="9" class="empty">
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

["departmentFilter", "semesterFilter", "statusFilter", "feeFilter", "attendanceFilter"].forEach(id => {
  $(id).onchange = filters;
});

$("resetFilters").onclick = () => {
  ["searchInput", "departmentFilter", "semesterFilter", "statusFilter", "feeFilter", "attendanceFilter"].forEach(id => {
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

/* ==========================================================================
   STUDENT ACADEMIC HUB MANAGEMENT
   ========================================================================== */
function populateStudentHubSelector() {
  const sel = $("hubStudentSelector");
  if (!sel || !state.students.length) return;

  const currentVal = sel.value || (state.selectedStudent ? state.selectedStudent._id : state.students[0]._id);
  sel.innerHTML = state.students.map(s => `
    <option value="${esc(s._id)}" ${s._id === currentVal ? "selected" : ""}>
      ${esc(s.name)} (${esc(s.usn)}) - ${esc(s.department)}
    </option>
  `).join("");

  sel.onchange = () => {
    const s = state.students.find(x => x._id === sel.value);
    if (s) {
      state.selectedStudent = s;
      updateStudentHub();
    }
  };
}

function updateStudentHub() {
  const s = state.selectedStudent || state.students[0];
  if (!s) return;

  const rawName = s.name || "Student";
  const initials = rawName.trim().split(/\s+/).slice(0, 2).map(x => x[0] || "").join("").toUpperCase();

  // Banner
  $("hubAvatar").textContent = initials;
  $("hubAvatar").className = `banner-avatar ${getAvatarClass(rawName)}`;
  $("hubName").textContent = s.name;
  $("hubUsn").textContent = s.usn;
  $("hubDeptBadge").textContent = s.department;
  $("hubDeptBadge").className = `dept-badge dept-${s.department}`;

  const statusKey = (s.status || "Active").replace(/\s+/g, "-");
  $("hubStatusBadge").innerHTML = `<span class="status-dot"></span> ${esc(s.status || "Active")}`;
  $("hubStatusBadge").className = `status-badge status-${statusKey}`;

  $("hubSemester").textContent = `Semester ${s.semester}`;
  $("hubEmail").textContent = s.email;
  $("hubPhone").textContent = s.phone || "Not listed";

  const feeStatus = s.feeStatus || "Paid";
  $("hubFeeStatus").textContent = feeStatus;
  $("hubFeeStatus").className = `fee-badge fee-${feeStatus}`;

  // Attendance Section
  const attVal = Number(s.attendance ?? 85);
  $("hubAttendanceValue").textContent = `${attVal}%`;
  $("hubAttendanceBar").style.width = `${attVal}%`;

  const safeTag = $("attendanceStatusTag");
  if (attVal >= 75) {
    safeTag.textContent = "✓ Exam Eligible";
    safeTag.className = "tag-safe";
    $("hubAttendanceBar").style.background = "var(--primary-gradient)";
  } else {
    safeTag.textContent = "⚠️ Shortage Alert (<75%)";
    safeTag.className = "tag-danger";
    $("hubAttendanceBar").style.background = "linear-gradient(90deg, #ef4444, #dc2626)";
  }

  // Pre-fill calculator with student's values
  const totalEstimatedClasses = 50;
  const attendedClasses = Math.round((attVal / 100) * totalEstimatedClasses);
  $("calcAttended").value = attendedClasses;
  $("calcTotal").value = totalEstimatedClasses;
  calculateAttendanceTarget();

  // CGPA Section
  const cgpa = Number(s.cgpa ?? 8.2).toFixed(2);
  $("hubCgpaValue").textContent = cgpa;
  let standing = "First Class with Distinction";
  if (cgpa < 7.0) standing = "Second Class";
  else if (cgpa < 8.0) standing = "First Class";
  $("hubCgpaBadge").textContent = standing;

  // Subjects List
  renderSubjectAttendance(s);
}

function renderSubjectAttendance(s) {
  const container = $("hubSubjectsList");
  if (!container) return;

  const defaultCourses = s.courses && s.courses.length ? s.courses : [
    "Design & Analysis of Algorithms",
    "Database Management Systems",
    "Operating Systems Architecture",
    "Computer Networks & Protocols",
    "Cloud Native Computing"
  ];

  const baseAtt = Number(s.attendance ?? 85);

  container.innerHTML = defaultCourses.map((c, i) => {
    // Generate realistic variance around the student's attendance
    const offsets = [4, -6, 2, -10, 5, -3];
    const subAtt = Math.min(100, Math.max(50, baseAtt + (offsets[i % offsets.length] || 0)));
    const totalHeld = 45 + (i * 2);
    const attended = Math.round((subAtt / 100) * totalHeld);
    const isShortage = subAtt < 75;

    return `
      <div class="subject-row">
        <div class="sub-info">
          <strong>${esc(c)}</strong>
          <small>Course Code: ${esc(s.department)}70${i + 1} · 4 Credits</small>
        </div>
        <div class="sub-bar-wrap">
          <div class="progress-bar">
            <div class="progress-fill ${isShortage ? "fill-shortage" : "fill-good"}" style="width: ${subAtt}%;"></div>
          </div>
          <span class="sub-count">${attended}/${totalHeld} classes (${subAtt}%)</span>
        </div>
        <span class="sub-tag ${isShortage ? "tag-shortage" : "tag-good"}">
          ${isShortage ? "⚠️ Shortage" : "Good"}
        </span>
      </div>
    `;
  }).join("");
}

/* ==========================================================================
   ATTENDANCE BUNK / RECOVERY CALCULATOR
   ========================================================================== */
function calculateAttendanceTarget() {
  const attended = Math.max(0, parseInt($("calcAttended").value) || 0);
  const total = Math.max(1, parseInt($("calcTotal").value) || 1);
  const targetPct = Math.min(100, Math.max(1, parseInt($("calcTarget").value) || 75)) / 100;

  const currentPct = (attended / total) * 100;
  const resultBox = $("calcResultBox");
  const resultMsg = $("calcResultMessage");

  if (currentPct >= targetPct * 100) {
    // Can skip classes
    // (attended) / (total + x) >= targetPct => total + x <= attended / targetPct => x = floor(attended/targetPct - total)
    const canSkip = Math.floor(attended / targetPct - total);
    resultBox.className = "calc-result safe";
    resultBox.querySelector(".calc-icon").textContent = "🎉";
    resultMsg.innerHTML = `Current attendance: <strong>${currentPct.toFixed(1)}%</strong>. You can safely miss <strong>${canSkip} more ${canSkip === 1 ? 'class' : 'classes'}</strong> and still maintain ${targetPct * 100}%!`;
  } else {
    // Need to attend consecutive classes
    // (attended + x) / (total + x) >= targetPct => attended + x >= targetPct*total + targetPct*x => x(1 - targetPct) >= targetPct*total - attended
    const needed = Math.ceil((targetPct * total - attended) / (1 - targetPct));
    resultBox.className = "calc-result danger";
    resultBox.querySelector(".calc-icon").textContent = "⚠️";
    resultMsg.innerHTML = `Shortage alert! Current attendance: <strong>${currentPct.toFixed(1)}%</strong>. You must attend the next <strong>${needed} consecutive ${needed === 1 ? 'class' : 'classes'}</strong> without missing to reach ${targetPct * 100}%.`;
  }
}

["calcAttended", "calcTotal", "calcTarget"].forEach(id => {
  const el = $(id);
  if (el) el.oninput = calculateAttendanceTarget;
});

/* ==========================================================================
   TIMETABLE DAY SWITCHER
   ========================================================================== */
const timetableSchedule = {
  Mon: [
    { time: "09:00 - 10:00", sub: "Distributed Systems", loc: "CS-LH302 · Prof. K. N. Sridhar" },
    { time: "10:00 - 11:00", sub: "Cloud Computing & DevOps", loc: "CS-LH302 · Dr. Meenakshi" },
    { time: "11:00 - 11:15", break: true, label: "☕ Morning Refreshment Break" },
    { time: "11:15 - 12:15", sub: "Deep Learning Architecture", loc: "AI-Lab 2 · Prof. Anirudh" },
    { time: "13:30 - 16:30", lab: true, sub: "Network Security & Pentest Lab", loc: "Systems Lab 4 · Practical Assessment" }
  ],
  Tue: [
    { time: "09:00 - 10:00", sub: "Compiler Design & Code Gen", loc: "CS-LH201 · Dr. P. Joshi" },
    { time: "10:00 - 11:00", sub: "Distributed Systems", loc: "CS-LH302 · Prof. K. N. Sridhar" },
    { time: "11:00 - 11:15", break: true, label: "☕ Morning Refreshment Break" },
    { time: "11:15 - 12:15", sub: "Cybersecurity & Cryptography", loc: "CS-LH201 · Prof. Vandana" },
    { time: "13:30 - 15:30", sub: "Capstone Project Mentorship", loc: "Incubation Center · Industry Mentors" }
  ],
  Wed: [
    { time: "09:00 - 11:00", lab: true, sub: "Cloud Deployment & Docker Lab", loc: "Cloud Center Lab 1 · Hands-on" },
    { time: "11:00 - 11:15", break: true, label: "☕ Morning Refreshment Break" },
    { time: "11:15 - 12:15", sub: "Deep Learning Architecture", loc: "AI-Lab 2 · Prof. Anirudh" },
    { time: "13:30 - 14:30", sub: "Professional Ethics in Engineering", loc: "Auditorium · Seminar" },
    { time: "14:30 - 16:30", sub: "Technical Seminar Presentations", loc: "Seminar Hall 1" }
  ],
  Thu: [
    { time: "09:00 - 10:00", sub: "Cybersecurity & Cryptography", loc: "CS-LH201 · Prof. Vandana" },
    { time: "10:00 - 11:00", sub: "Cloud Computing & DevOps", loc: "CS-LH302 · Dr. Meenakshi" },
    { time: "11:00 - 11:15", break: true, label: "☕ Morning Refreshment Break" },
    { time: "11:15 - 12:15", sub: "Compiler Design & Code Gen", loc: "CS-LH201 · Dr. P. Joshi" },
    { time: "13:30 - 16:30", lab: true, sub: "Autonomous Systems Project Lab", loc: "Robotics Facility" }
  ],
  Fri: [
    { time: "09:00 - 10:00", sub: "Distributed Systems Revision", loc: "CS-LH302 · Prof. K. N. Sridhar" },
    { time: "10:00 - 11:00", sub: "Deep Learning Model Tuning", loc: "AI-Lab 2 · Prof. Anirudh" },
    { time: "11:00 - 11:15", break: true, label: "☕ Morning Refreshment Break" },
    { time: "11:15 - 12:15", sub: "Placement Training & Soft Skills", loc: "Placement Cell Hall" },
    { time: "13:30 - 15:30", sub: "Coding Club Hack Session", loc: "Open Source Lab" }
  ]
};

document.querySelectorAll("#timetableDays .day-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("#timetableDays .day-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const day = btn.dataset.day;
    renderTimetable(day);
  };
});

function renderTimetable(day) {
  const list = $("timetableList");
  if (!list) return;
  const items = timetableSchedule[day] || timetableSchedule.Mon;

  list.innerHTML = items.map(it => {
    if (it.break) {
      return `
        <div class="time-item break">
          <span class="time-pill">${it.time}</span>
          <span>${it.label}</span>
        </div>
      `;
    }
    return `
      <div class="time-item ${it.lab ? "lab" : ""}">
        <span class="time-pill">${it.time}</span>
        <div class="time-details">
          <strong>${esc(it.sub)}</strong>
          <small>${esc(it.loc)}</small>
        </div>
      </div>
    `;
  }).join("");
}

/* ==========================================================================
   STUDENT PROFILE DOSSIER MODAL (VIEW FULL PROFILE)
   ========================================================================== */
function openProfileModal(s) {
  const rawName = s.name || "Student";
  const initials = rawName.trim().split(/\s+/).slice(0, 2).map(x => x[0] || "").join("").toUpperCase();

  $("dossierName").textContent = s.name;
  $("dossierFullName").textContent = s.name;
  $("dossierAvatar").textContent = initials;
  $("dossierAvatar").className = `dossier-avatar ${getAvatarClass(rawName)}`;
  $("dossierUsn").textContent = s.usn;
  $("dossierDept").textContent = s.department;
  $("dossierDept").className = `dept-badge dept-${s.department}`;
  $("dossierSem").textContent = `Semester ${s.semester}`;

  const statusKey = (s.status || "Active").replace(/\s+/g, "-");
  $("dossierStatus").innerHTML = `<span class="status-dot"></span> ${esc(s.status || "Active")}`;
  $("dossierStatus").className = `status-badge status-${statusKey}`;

  // Stats
  const attVal = Number(s.attendance ?? 85);
  $("dossierAttendance").textContent = `${attVal}%`;
  const attTag = $("dossierAttendanceTag");
  if (attVal >= 75) {
    attTag.textContent = "Good";
    attTag.className = "mini-tag tag-good";
  } else {
    attTag.textContent = "Shortage";
    attTag.className = "mini-tag tag-shortage";
  }

  const cgpa = Number(s.cgpa ?? 8.0).toFixed(2);
  $("dossierCgpa").textContent = cgpa;

  const fee = s.feeStatus || "Paid";
  $("dossierFees").textContent = fee;
  $("dossierFeeTag").textContent = fee === "Paid" ? "Cleared" : "Attention";
  $("dossierFeeTag").className = `mini-tag ${fee === "Paid" ? "tag-good" : "tag-shortage"}`;

  // Contact & Remarks
  $("dossierEmail").textContent = s.email;
  $("dossierPhone").textContent = s.phone || "No phone provided";

  // Courses
  const courses = s.courses && s.courses.length ? s.courses : [
    "Design & Analysis of Algorithms",
    "Operating Systems Architecture",
    "Database Systems",
    "Computer Networks"
  ];
  $("dossierCourses").innerHTML = courses.map(c => `<span class="course-tag">${esc(c)}</span>`).join("");

  $("dossierNotes").textContent = s.notes || "No disciplinary or academic notes on file.";

  $("profileDialog").showModal();
}

$("closeProfileModal").onclick = () => $("profileDialog").close();
$("closeProfileModalBtn").onclick = () => $("profileDialog").close();

$("profileDialog").addEventListener("click", e => {
  const rect = $("profileDialog").getBoundingClientRect();
  const isInDialog = (
    rect.top <= e.clientY &&
    e.clientY <= rect.top + rect.height &&
    rect.left <= e.clientX &&
    e.clientX <= rect.left + rect.width
  );
  if (!isInDialog) $("profileDialog").close();
});

/* ==========================================================================
   STUDENT RECORD MODAL (CREATE & UPDATE - ADMIN ONLY)
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
      ["studentAttendance", "attendance"],
      ["studentCgpa", "cgpa"],
      ["studentFeeStatus", "feeStatus"],
      ["studentStatus", "status"],
      ["studentPhone", "phone"],
      ["studentNotes", "notes"]
    ]) {
      $(id).value = s[key] ?? "";
    }
    if ($("studentCourses")) {
      $("studentCourses").value = (s.courses || []).join(", ");
    }
  } else {
    if ($("studentAttendance")) $("studentAttendance").value = "85";
    if ($("studentCgpa")) $("studentCgpa").value = "8.20";
    if ($("studentFeeStatus")) $("studentFeeStatus").value = "Paid";
  }

  $("studentDialog").showModal();
}

$("addBtn").onclick = () => openModal();
$("closeModal").onclick = () => $("studentDialog").close();
$("cancelModal").onclick = () => $("studentDialog").close();

$("studentDialog").addEventListener("click", e => {
  const rect = $("studentDialog").getBoundingClientRect();
  const isInDialog = (
    rect.top <= e.clientY &&
    e.clientY <= rect.top + rect.height &&
    rect.left <= e.clientX &&
    e.clientX <= rect.left + rect.width
  );
  if (!isInDialog) $("studentDialog").close();
});

$("studentsBody").onclick = async e => {
  const b = e.target.closest("[data-action]");
  if (!b) return;

  const s = state.students.find(x => x._id === b.dataset.id);
  if (!s) return;

  if (b.dataset.action === "profile") {
    return openProfileModal(s);
  }

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
    attendance: Number($("studentAttendance").value) || 85,
    cgpa: Number($("studentCgpa").value) || 8.0,
    feeStatus: $("studentFeeStatus").value || "Paid",
    status: $("studentStatus").value,
    phone: $("studentPhone").value.trim(),
    courses: $("studentCourses").value.trim(),
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
