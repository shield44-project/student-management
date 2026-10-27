const API_BASE = "http://localhost:5000/api";

const tableBody = document.getElementById("studentsTable");
const searchInput = document.getElementById("searchInput");
const departmentFilter = document.getElementById("departmentFilter");
const notice = document.getElementById("notice");
const dialog = document.getElementById("studentDialog");
const form = document.getElementById("studentForm");
const formError = document.getElementById("formError");

let students = [];

function showNotice(message, type = "success") {
  notice.textContent = message;
  notice.className = `notice ${type}`;
  window.clearTimeout(showNotice.timeout);
  showNotice.timeout = window.setTimeout(() => notice.classList.add("hidden"), 4500);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error("Cannot connect to the API. Start the backend and check that it runs on port 5000.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload;
}

async function checkApi() {
  const status = document.getElementById("apiStatus");
  try {
    await apiRequest("/health");
    status.textContent = "● API connected";
    status.className = "status-pill online";
  } catch {
    status.textContent = "● API offline";
    status.className = "status-pill offline";
  }
}

function renderStudents(items) {
  students = items;
  document.getElementById("totalCount").textContent = items.length;
  document.getElementById("departmentCount").textContent =
    new Set(items.map(student => student.department)).size;
  document.getElementById("resultCount").textContent =
    `${items.length} record${items.length === 1 ? "" : "s"}`;

  if (!items.length) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty">No students found. Add a student or change your search.</td></tr>';
    return;
  }

  tableBody.innerHTML = items.map(student => `
    <tr>
      <td><span class="student-name">${escapeHTML(student.name)}</span></td>
      <td><span class="usn">${escapeHTML(student.usn)}</span></td>
      <td><span class="dept-tag">${escapeHTML(student.department)}</span></td>
      <td>${escapeHTML(student.semester)}</td>
      <td><span class="student-email">${escapeHTML(student.email)}</span></td>
      <td>
        <div class="row-actions">
          <button class="action-btn" data-action="edit" data-id="${escapeHTML(student._id)}">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${escapeHTML(student._id)}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function loadStudents() {
  tableBody.innerHTML = '<tr><td colspan="6" class="empty">Loading students…</td></tr>';
  const params = new URLSearchParams();
  const search = searchInput.value.trim();
  const department = departmentFilter.value;
  if (search) params.set("search", search);
  if (department) params.set("department", department);

  try {
    const result = await apiRequest(`/students${params.toString() ? `?${params}` : ""}`);
    renderStudents(result.data || []);
    await checkApi();
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHTML(error.message)}</td></tr>`;
    showNotice(error.message, "error");
    const status = document.getElementById("apiStatus");
    status.textContent = "● API offline";
    status.className = "status-pill offline";
  }
}

function openAddDialog() {
  form.reset();
  document.getElementById("studentId").value = "";
  document.getElementById("dialogTitle").textContent = "Add student";
  document.getElementById("saveBtn").textContent = "Save student";
  formError.classList.add("hidden");
  dialog.showModal();
}

function openEditDialog(student) {
  form.reset();
  document.getElementById("studentId").value = student._id;
  document.getElementById("name").value = student.name;
  document.getElementById("usn").value = student.usn;
  document.getElementById("email").value = student.email;
  document.getElementById("department").value = student.department;
  document.getElementById("semester").value = String(student.semester);
  document.getElementById("phone").value = student.phone || "";
  document.getElementById("dialogTitle").textContent = "Edit student";
  document.getElementById("saveBtn").textContent = "Update student";
  formError.classList.add("hidden");
  dialog.showModal();
}

document.getElementById("addNewBtn").addEventListener("click", openAddDialog);
document.getElementById("closeDialogBtn").addEventListener("click", () => dialog.close());
document.getElementById("cancelBtn").addEventListener("click", () => dialog.close());
document.getElementById("searchBtn").addEventListener("click", loadStudents);
document.getElementById("refreshBtn").addEventListener("click", loadStudents);
departmentFilter.addEventListener("change", loadStudents);
searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") loadStudents();
});
document.getElementById("clearBtn").addEventListener("click", () => {
  searchInput.value = "";
  departmentFilter.value = "";
  loadStudents();
});

tableBody.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const student = students.find(item => item._id === button.dataset.id);
  if (!student) return;

  if (button.dataset.action === "edit") {
    openEditDialog(student);
    return;
  }

  if (button.dataset.action === "delete") {
    const confirmed = window.confirm(`Delete ${student.name} (${student.usn})? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const result = await apiRequest(`/students/${student._id}`, { method: "DELETE" });
      showNotice(result.message || "Student deleted");
      await loadStudents();
    } catch (error) {
      showNotice(error.message, "error");
    }
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  formError.classList.add("hidden");

  const id = document.getElementById("studentId").value;
  const payload = {
    name: document.getElementById("name").value.trim(),
    usn: document.getElementById("usn").value.trim().toUpperCase(),
    email: document.getElementById("email").value.trim().toLowerCase(),
    department: document.getElementById("department").value,
    semester: Number(document.getElementById("semester").value),
    phone: document.getElementById("phone").value.trim()
  };

  const saveButton = document.getElementById("saveBtn");
  saveButton.disabled = true;
  saveButton.textContent = id ? "Updating…" : "Saving…";

  try {
    const result = await apiRequest(id ? `/students/${id}` : "/students", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    dialog.close();
    showNotice(result.message || "Student saved successfully");
    await loadStudents();
  } catch (error) {
    formError.textContent = error.message;
    formError.classList.remove("hidden");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = id ? "Update student" : "Save student";
  }
});

checkApi();
loadStudents();
