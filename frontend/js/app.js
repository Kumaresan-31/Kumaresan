/* ============================================================
   COURSE REGISTRATION SYSTEM — Enhanced Frontend Logic
   Particles · Dashboard · Charts · Theme · Pagination · Export
   ============================================================ */

const API_BASE = 'http://localhost:3000';
const ROWS_PER_PAGE = 8;

// =================== DOM ELEMENTS ===================
const $ = id => document.getElementById(id);

const navRegister = $('navRegister');
const navDashboard = $('navDashboard');
const navAdmin = $('navAdmin');
const registerView = $('registerView');
const dashboardView = $('dashboardView');
const adminView = $('adminView');
const heroSection = $('heroSection');

const registrationForm = $('registrationForm');
const studentName = $('studentName');
const studentEmail = $('studentEmail');
const courseSelect = $('courseSelect');
const submitBtn = $('submitBtn');

const searchInput = $('searchInput');
const filterCourse = $('filterCourse');
const refreshBtn = $('refreshBtn');
const exportBtn = $('exportBtn');
const bulkDeleteBtn = $('bulkDeleteBtn');
const bulkCount = $('bulkCount');
const selectAllBox = $('selectAll');
const tableBody = $('tableBody');
const paginationEl = $('pagination');

const editModal = $('editModal');
const editForm = $('editForm');
const editRegId = $('editRegId');
const editName = $('editName');
const editEmail = $('editEmail');
const editCourse = $('editCourse');
const modalClose = $('modalClose');
const cancelEdit = $('cancelEdit');

const confirmModal = $('confirmModal');
const confirmTitle = $('confirmTitle');
const confirmMessage = $('confirmMessage');
const confirmOk = $('confirmOk');
const confirmCancel = $('confirmCancel');
const confirmIcon = $('confirmIcon');

const themeToggle = $('themeToggle');
const toastContainer = $('toastContainer');

let allRegistrations = [];
let coursesCache = [];
let currentPage = 1;
let selectedIds = new Set();
let confirmResolve = null;

// Avatar color palette
const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'
];

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

// =================== PARTICLES ===================
(function initParticles() {
    const canvas = $('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const count = Math.min(60, Math.floor(window.innerWidth * window.innerHeight / 18000));
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 2 + 0.5,
                dx: (Math.random() - 0.5) * 0.4,
                dy: (Math.random() - 0.5) * 0.4,
                alpha: Math.random() * 0.3 + 0.1
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const theme = document.documentElement.getAttribute('data-theme');
        const baseColor = theme === 'light' ? '99, 102, 241' : '99, 102, 241';

        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${baseColor}, ${p.alpha})`;
            ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${baseColor}, ${0.06 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
        resize();
        createParticles();
    });
})();

// =================== THEME ===================
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const sun = themeToggle.querySelector('.icon-sun');
    const moon = themeToggle.querySelector('.icon-moon');
    if (theme === 'dark') {
        sun.classList.remove('hidden');
        moon.classList.add('hidden');
    } else {
        sun.classList.add('hidden');
        moon.classList.remove('hidden');
    }
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// Init theme
setTheme(localStorage.getItem('theme') || 'light');

// =================== TOAST ===================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
        <div class="toast-progress"></div>
    `;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// =================== CUSTOM CONFIRM ===================
function showConfirm(title, message, icon = '⚠️') {
    return new Promise(resolve => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmIcon.textContent = icon;
        confirmModal.classList.remove('hidden');
        confirmResolve = resolve;
    });
}

confirmOk.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    if (confirmResolve) confirmResolve(true);
});
confirmCancel.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    if (confirmResolve) confirmResolve(false);
});
confirmModal.addEventListener('click', e => {
    if (e.target === confirmModal) {
        confirmModal.classList.add('hidden');
        if (confirmResolve) confirmResolve(false);
    }
});

// =================== NAVIGATION ===================
function switchView(view) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    registerView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    adminView.classList.add('hidden');

    if (view === 'register') {
        navRegister.classList.add('active');
        registerView.classList.remove('hidden');
        heroSection.style.display = '';
    } else if (view === 'dashboard') {
        navDashboard.classList.add('active');
        dashboardView.classList.remove('hidden');
        heroSection.style.display = 'none';
        fetchDashboardStats();
    } else {
        navAdmin.classList.add('active');
        adminView.classList.remove('hidden');
        heroSection.style.display = 'none';
        fetchRegistrations();
    }
}

navRegister.addEventListener('click', () => switchView('register'));
navDashboard.addEventListener('click', () => switchView('dashboard'));
navAdmin.addEventListener('click', () => switchView('admin'));

// Keyboard shortcut Ctrl+K for search
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        switchView('admin');
        setTimeout(() => searchInput.focus(), 100);
    }
});

// =================== FETCH COURSES ===================
async function fetchCourses() {
    try {
        const res = await fetch(`${API_BASE}/courses`);
        const json = await res.json();
        if (json.success) {
            coursesCache = json.data;
            populateCourseDropdown(courseSelect, json.data);
            populateCourseDropdown(editCourse, json.data);
            populateFilterDropdown(json.data);
        }
    } catch (err) {
        console.error('Failed to fetch courses:', err);
        showToast('Failed to load courses. Is the server running?', 'error');
    }
}

function populateCourseDropdown(selectEl, courses) {
    const firstOpt = selectEl.querySelector('option');
    selectEl.innerHTML = '';
    selectEl.appendChild(firstOpt);
    courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.course_name} (${c.course_code})`;
        selectEl.appendChild(opt);
    });
}

function populateFilterDropdown(courses) {
    filterCourse.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.course_code} — ${c.course_name}`;
        filterCourse.appendChild(opt);
    });
}

// =================== FORM VALIDATION ===================
function validateForm() {
    let valid = true;
    const nameErr = $('nameError');
    const emailErr = $('emailError');
    const courseErr = $('courseError');

    [studentName, studentEmail, courseSelect].forEach(el => el.classList.remove('invalid'));
    nameErr.textContent = ''; emailErr.textContent = ''; courseErr.textContent = '';

    if (!studentName.value.trim()) {
        studentName.classList.add('invalid');
        nameErr.textContent = 'Name is required';
        valid = false;
    } else if (studentName.value.trim().length < 2) {
        studentName.classList.add('invalid');
        nameErr.textContent = 'Name must be at least 2 characters';
        valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!studentEmail.value.trim()) {
        studentEmail.classList.add('invalid');
        emailErr.textContent = 'Email is required';
        valid = false;
    } else if (!emailRegex.test(studentEmail.value.trim())) {
        studentEmail.classList.add('invalid');
        emailErr.textContent = 'Enter a valid email address';
        valid = false;
    }

    if (!courseSelect.value) {
        courseSelect.classList.add('invalid');
        courseErr.textContent = 'Please select a course';
        valid = false;
    }

    return valid;
}

// Real-time validation hints
studentName.addEventListener('input', () => {
    studentName.classList.remove('invalid');
    $('nameError').textContent = '';
});
studentEmail.addEventListener('input', () => {
    studentEmail.classList.remove('invalid');
    $('emailError').textContent = '';
});
courseSelect.addEventListener('change', () => {
    courseSelect.classList.remove('invalid');
    $('courseError').textContent = '';
});

// =================== REGISTER ===================
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: studentName.value.trim(),
                email: studentEmail.value.trim(),
                course_id: parseInt(courseSelect.value)
            })
        });
        const json = await res.json();

        if (json.success) {
            showToast(json.message, 'success');
            registrationForm.reset();
            fetchHeroStats();
        } else {
            showToast(json.message, 'error');
        }
    } catch (err) {
        showToast('Registration failed. Please try again.', 'error');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});

// =================== DASHBOARD ===================
async function fetchDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/dashboard/stats`);
        const json = await res.json();
        if (json.success) {
            const d = json.data;
            animateCounter($('dashTotalReg'), d.total_registrations);
            animateCounter($('dashTotalStu'), d.total_students);
            animateCounter($('dashTotalCrs'), d.total_courses);
            renderEnrollmentChart(d.course_stats);
            renderRecentActivity(d.recent_registrations);
        }
    } catch (err) {
        console.error('Dashboard stats error:', err);
        $('enrollmentChart').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">Failed to load chart data</p>';
    }
}

function animateCounter(el, target) {
    const duration = 1200;
    const start = parseInt(el.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;

    function step() {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            el.textContent = target;
            return;
        }
        el.textContent = Math.round(current);
        requestAnimationFrame(step);
    }
    step();
}

function renderEnrollmentChart(courseStats) {
    const chart = $('enrollmentChart');
    if (!courseStats || courseStats.length === 0) {
        chart.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No enrollment data yet</p>';
        return;
    }

    const maxCount = Math.max(...courseStats.map(c => c.enrollment_count), 1);

    chart.innerHTML = '<div class="bar-chart">' + courseStats.map(c => {
        const pct = (c.enrollment_count / maxCount) * 100;
        return `
            <div class="bar-item">
                <span class="bar-label" title="${escapeHtml(c.course_name)}">${escapeHtml(c.course_code)}</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: 0%;" data-width="${pct}%">
                        <span class="bar-value">${c.enrollment_count}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('') + '</div>';

    // Animate bars
    setTimeout(() => {
        chart.querySelectorAll('.bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.width;
        });
    }, 100);
}

function renderRecentActivity(recent) {
    const list = $('recentActivity');
    if (!recent || recent.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No recent activity</p>';
        return;
    }

    list.innerHTML = recent.map(r => {
        const color = getAvatarColor(r.student_name);
        const initials = getInitials(r.student_name);
        return `
            <div class="activity-item">
                <div class="activity-avatar" style="background:${color}">${initials}</div>
                <div class="activity-info">
                    <div class="activity-name">${escapeHtml(r.student_name)}</div>
                    <div class="activity-course">${escapeHtml(r.course_name)}</div>
                </div>
                <span class="activity-time">${timeAgo(r.registered_at)}</span>
            </div>
        `;
    }).join('');
}

// =================== HERO STATS ===================
async function fetchHeroStats() {
    try {
        const res = await fetch(`${API_BASE}/dashboard/stats`);
        const json = await res.json();
        if (json.success) {
            animateCounter($('heroTotalReg'), json.data.total_registrations);
            animateCounter($('heroTotalStu'), json.data.total_students);
            animateCounter($('heroTotalCrs'), json.data.total_courses);
        }
    } catch (err) { /* silent */ }
}

// =================== ADMIN: FETCH REGISTRATIONS ===================
async function fetchRegistrations() {
    try {
        const res = await fetch(`${API_BASE}/registrations`);
        const json = await res.json();
        if (json.success) {
            allRegistrations = json.data;
            selectedIds.clear();
            updateBulkUI();
            currentPage = 1;
            applyFilters();
        }
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load. Is the server running?</td></tr>';
    }
}

// =================== RENDER TABLE WITH PAGINATION ===================
function renderTable(data) {
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No registrations found</td></tr>';
        paginationEl.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const pageData = data.slice(start, start + ROWS_PER_PAGE);

    tableBody.innerHTML = pageData.map((r, i) => {
        const color = getAvatarColor(r.student_name);
        const initials = getInitials(r.student_name);
        const checked = selectedIds.has(r.registration_id) ? 'checked' : '';
        const selected = selectedIds.has(r.registration_id) ? 'selected' : '';
        return `
            <tr class="${selected}" data-id="${r.registration_id}">
                <td class="td-check"><input type="checkbox" class="row-check" data-id="${r.registration_id}" ${checked}></td>
                <td>
                    <div class="student-cell">
                        <div class="avatar" style="background:${color}">${initials}</div>
                        <span class="student-name">${escapeHtml(r.student_name)}</span>
                    </div>
                </td>
                <td>${escapeHtml(r.student_email)}</td>
                <td><span class="course-badge">${escapeHtml(r.course_code)} — ${escapeHtml(r.course_name)}</span></td>
                <td>${formatDate(r.registered_at)}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-icon edit" title="Edit" onclick="openEditModal(${r.registration_id}, '${escapeAttr(r.student_name)}', '${escapeAttr(r.student_email)}', ${r.course_id})">✏️</button>
                        <button class="btn-icon delete" title="Delete" onclick="handleDelete(${r.registration_id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination(data.length, totalPages);
    attachCheckboxListeners();
}

function renderPagination(total, totalPages) {
    if (totalPages <= 1) {
        paginationEl.innerHTML = `<span class="page-info">${total} record${total !== 1 ? 's' : ''}</span>`;
        return;
    }

    let html = `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-info">…</span>`;
        }
    }

    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;
    html += `<span class="page-info">${total} total</span>`;
    paginationEl.innerHTML = html;
}

window.goToPage = function (page) {
    currentPage = page;
    applyFilters();
    document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// =================== CHECKBOXES & BULK ===================
function attachCheckboxListeners() {
    document.querySelectorAll('.row-check').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id);
            if (e.target.checked) {
                selectedIds.add(id);
                e.target.closest('tr').classList.add('selected');
            } else {
                selectedIds.delete(id);
                e.target.closest('tr').classList.remove('selected');
            }
            updateBulkUI();
        });
    });
}

selectAllBox.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.row-check');
    checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        const id = parseInt(cb.dataset.id);
        if (e.target.checked) {
            selectedIds.add(id);
            cb.closest('tr').classList.add('selected');
        } else {
            selectedIds.delete(id);
            cb.closest('tr').classList.remove('selected');
        }
    });
    updateBulkUI();
});

function updateBulkUI() {
    if (selectedIds.size > 0) {
        bulkDeleteBtn.classList.remove('hidden');
        bulkCount.textContent = selectedIds.size;
    } else {
        bulkDeleteBtn.classList.add('hidden');
    }
}

bulkDeleteBtn.addEventListener('click', async () => {
    const ok = await showConfirm(
        'Bulk Delete',
        `Delete ${selectedIds.size} selected registration(s)? This cannot be undone.`,
        '🗑️'
    );
    if (!ok) return;

    try {
        const res = await fetch(`${API_BASE}/registrations/bulk-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedIds) })
        });
        const json = await res.json();
        if (json.success) {
            showToast(json.message, 'success');
            fetchRegistrations();
        } else {
            showToast(json.message, 'error');
        }
    } catch (err) {
        showToast('Bulk delete failed.', 'error');
    }
});

// =================== SEARCH & FILTER ===================
searchInput.addEventListener('input', () => { currentPage = 1; applyFilters(); });
filterCourse.addEventListener('change', () => { currentPage = 1; applyFilters(); });

function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const courseId = filterCourse.value;

    let filtered = allRegistrations;
    if (query) {
        filtered = filtered.filter(r =>
            r.student_name.toLowerCase().includes(query) ||
            r.student_email.toLowerCase().includes(query) ||
            r.course_name.toLowerCase().includes(query) ||
            r.course_code.toLowerCase().includes(query)
        );
    }
    if (courseId) {
        filtered = filtered.filter(r => r.course_id === parseInt(courseId));
    }

    renderTable(filtered);
}

refreshBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterCourse.value = '';
    currentPage = 1;
    fetchRegistrations();
});

// =================== EXPORT CSV ===================
exportBtn.addEventListener('click', () => {
    window.open(`${API_BASE}/export/csv`, '_blank');
});

// =================== DELETE ===================
window.handleDelete = async function (id) {
    const ok = await showConfirm('Delete Registration', 'This registration will be permanently removed.', '🗑️');
    if (!ok) return;

    try {
        const res = await fetch(`${API_BASE}/registrations/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
            showToast(json.message, 'success');
            fetchRegistrations();
        } else {
            showToast(json.message, 'error');
        }
    } catch (err) {
        showToast('Failed to delete.', 'error');
    }
};

// =================== EDIT MODAL ===================
window.openEditModal = function (regId, name, email, courseId) {
    editRegId.value = regId;
    editName.value = name;
    editEmail.value = email;
    editCourse.value = courseId;
    editModal.classList.remove('hidden');
};

function closeEditModal() { editModal.classList.add('hidden'); }

modalClose.addEventListener('click', closeEditModal);
cancelEdit.addEventListener('click', closeEditModal);
editModal.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editRegId.value;

    try {
        const res = await fetch(`${API_BASE}/registrations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: editName.value.trim(),
                email: editEmail.value.trim(),
                course_id: parseInt(editCourse.value)
            })
        });
        const json = await res.json();
        if (json.success) {
            showToast(json.message, 'success');
            closeEditModal();
            fetchRegistrations();
        } else {
            showToast(json.message, 'error');
        }
    } catch (err) {
        showToast('Failed to update.', 'error');
    }
});

// =================== UTILITIES ===================
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    const secs = Math.floor((now - d) / 1000);

    if (secs < 60) return 'Just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
    return formatDate(dateStr);
}

// =================== INIT ===================
fetchCourses();
fetchHeroStats();
