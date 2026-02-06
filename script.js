/**
 * Help Desk Pro - Logic
 * Handles state, routing, and simulated backend operations.
 */

// --- State Management ---
// --- State Management ---
const store = {
    view: 'home',
    user: null, // null, { username, role, email }
    tickets: JSON.parse(localStorage.getItem('tickets')) || [],
    users: loadUsersSafe()
};

function loadUsersSafe() {
    try {
        const u = JSON.parse(localStorage.getItem('users'));
        return Array.isArray(u) ? u : [];
    } catch (e) {
        console.error("Error loading users", e);
        return [];
    }
}

// --- Initialization ---
function init() {
    initUsers(); // Seed users if empty
    setupEventListeners();
    checkAuthSession();
    updateUI();
}

function initUsers() {
    if (store.users.length === 0) {
        seedDefaultUsers();
    }
}

function seedDefaultUsers() {
    const seedUsers = [
        { email: 'ransay@supermegavendas.com', password: 'admin123', username: 'Ransay (Gestor)', role: 'admin' },
        { email: 'user', password: 'user123', username: 'Usuário', role: 'user' },
        { email: 'user@email.com', password: 'user123', username: 'Usuário Padrão', role: 'user' }
    ];
    store.users = seedUsers;
    saveUsers();
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(store.users));
}

// --- DOM Elements ---
const views = {
    home: ['hero', 'benefits'],
    createTicket: ['ticket-form'],
    login: ['login'],
    dashboard: ['dashboard']
};

const dom = {
    navLogin: document.getElementById('nav-login-btn'),
    navTicket: document.getElementById('nav-ticket-btn'),
    navLogout: document.getElementById('nav-logout-btn'),
    ticketsTableBody: document.getElementById('tickets-table-body'),
    emptyState: document.getElementById('empty-state'),
    dashboardTitle: document.getElementById('dashboard-title'),
    adminStats: document.getElementById('admin-stats'),
    toast: document.getElementById('toast'),
    forms: {
        ticket: document.getElementById('create-ticket-form'),
        login: document.getElementById('login-form')
    }
};

// --- Navigation & Routing ---
function showSection(sectionId) {
    // Hide all sections first
    document.querySelectorAll('.section-page, .hero, .benefits').forEach(el => el.classList.add('hidden'));

    // Logic to show specific groups
    if (sectionId === 'home') {
        document.getElementById('hero').classList.remove('hidden');
        document.getElementById('benefits').classList.remove('hidden');
        window.scrollTo(0, 0);
    } else {
        const target = document.getElementById(sectionId);
        if (target) {
            target.classList.remove('hidden');
            window.scrollTo(0, 0);
        }
    }
}

function showHome() {
    showSection('home');
}

// --- Authentication ---
function checkAuthSession() {
    const sessionUser = localStorage.getItem('currentUser');
    if (sessionUser) {
        store.user = JSON.parse(sessionUser);
    }
    updateNav();
}

function handleLogin(e) {
    e.preventDefault();
    const usernameInput = e.target.username.value.trim();
    const passwordInput = e.target.password.value;

    // Resolve Alias: 'admin' maps to the Ransay account
    let targetEmail = usernameInput;
    if (usernameInput.toLowerCase() === 'admin') {
        targetEmail = 'ransay@supermegavendas.com';
    }

    // 1. Find User
    let user = store.users.find(u => u.email === targetEmail);

    // Self-Healing
    if (!user && targetEmail === 'ransay@supermegavendas.com') {
        console.warn("User database corrupted/empty. Re-seeding defaults.");
        seedDefaultUsers();
        user = store.users.find(u => u.email === targetEmail);
    }

    // 2. Validate Credentials
    if (user) {
        if (user.password === passwordInput) {
            loginSuccess(user);
        } else {
            showToast('senha incorreta', 'error');
        }
    } else {
        showToast('Usuário não encontrado.', 'error');
    }
}

function loginSuccess(user) {
    store.user = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    dom.forms.login.reset();
    showToast(`Bem-vindo, ${user.username}!`, 'success');
    updateNav();
    renderDashboard();
    showSection('dashboard');
}

function handleLogout() {
    store.user = null;
    localStorage.removeItem('currentUser');
    updateNav();
    showHome();
    showToast('Você saiu do sistema.');
}

function updateNav() {
    if (store.user) {
        dom.navLogin.classList.add('hidden');
        dom.navLogout.classList.remove('hidden');
        dom.navTicket.onclick = () => showSection('ticket-form'); // Authenticated can goes straight to form
    } else {
        dom.navLogin.classList.remove('hidden');
        dom.navLogout.classList.add('hidden');
        dom.navTicket.onclick = () => showSection('ticket-form'); // Guest can also open ticket
    }
}

function scheduleConsultation() {
    // Open Google Calendar with pre-filled details
    const title = encodeURIComponent("Consulta Técnica - Super Mega Ti");
    const details = encodeURIComponent("Agendamento de consulta técnica via site.");
    const guests = encodeURIComponent("ransay@supermegavendas.com");

    // Google Calendar Template URL
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&add=${guests}`;

    window.open(calendarUrl, '_blank');
    showToast('Abrindo agenda para marcar reunião com Ransay...', 'success');
}


// --- Ticket Management ---
function handleSubmitTicket(e) {
    e.preventDefault();

    // Simulate loading
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    setTimeout(() => {
        const formData = {
            id: '#' + Math.floor(1000 + Math.random() * 9000),
            name: e.target.name.value,
            email: e.target.email.value,
            department: e.target.department.value,
            category: e.target.category.value,
            description: e.target.description.value,
            status: 'Aberto', // Aberto, Em atendimento, Resolvido
            date: new Date().toLocaleDateString('pt-BR'),
            byUser: store.user ? store.user.username : 'Visitante',
            attachment: document.getElementById('attachment').files[0] ? document.getElementById('attachment').files[0].name : null
        };

        store.tickets.unshift(formData); // Add to beginning
        saveTickets();

        btn.textContent = originalText;
        btn.disabled = false;
        e.target.reset();

        // Feedback
        showToast('Chamado aberto com sucesso!', 'success');

        // Redirect logic
        if (store.user) {
            renderDashboard();
            showSection('dashboard');
        } else {
            showHome();
        }
    }, 1000); // Fake delay
}

function saveTickets() {
    localStorage.setItem('tickets', JSON.stringify(store.tickets));
}

// --- Dashboard Logic ---
function renderDashboard() {
    if (!store.user) return;

    dom.dashboardTitle.textContent = store.user.role === 'admin'
        ? 'Painel Administrativo'
        : 'Meus Chamados';

    // Clear current
    dom.ticketsTableBody.innerHTML = '';
    dom.adminStats.innerHTML = '';

    // Filter tickets based on role
    // User sees only their tickets (simulated by checking if they created it OR simple filter for demo)
    // For this demo: 'user' sees tickets created by 'Visitante' OR 'Usuário' just to show content, 
    // OR strictly only their own. Let's make 'user' see tickets they "own" (mocked ownership).
    // To make it simple: Admin sees ALL. User sees tickets where 'byUser' is 'Usuário' or match email?
    // Let's keep it simple: Admin sees all. User sees a subset.

    let displayTickets = store.tickets;
    if (store.user.role !== 'admin') {
        // Mock filtering: In real app, check ID. Here, filter by context.
        // Let's show all for demo if user, or filter if we want strictness.
        // Let's filter: User sees only "Usuário" created tickets.
        displayTickets = store.tickets.filter(t => t.byUser === 'Usuário');
    }

    // Render Stats for Admin
    if (store.user.role === 'admin') {
        const total = store.tickets.length;
        const open = store.tickets.filter(t => t.status === 'Aberto').length;
        const resolved = store.tickets.filter(t => t.status === 'Resolvido').length;

        dom.adminStats.innerHTML = `
            <div class="stat-card">
                <div>
                    <div class="stat-value">${total}</div>
                    <div class="stat-label">Total de Chamados</div>
                </div>
                <i class="ph ph-folder-notch lg-icon" style="color:var(--primary)"></i>
            </div>
            <div class="stat-card">
                <div>
                    <div class="stat-value">${open}</div>
                    <div class="stat-label">Em Aberto</div>
                </div>
                <i class="ph ph-warning-circle lg-icon" style="color:var(--status-progress)"></i>
            </div>
             <div class="stat-card">
                <div>
                    <div class="stat-value">${resolved}</div>
                    <div class="stat-label">Resolvidos</div>
                </div>
                <i class="ph ph-check-circle lg-icon" style="color:var(--status-resolved)"></i>
            </div>
        `;
    }

    // Render Table
    if (displayTickets.length === 0) {
        dom.emptyState.classList.remove('hidden');
    } else {
        dom.emptyState.classList.add('hidden');
        displayTickets.forEach(ticket => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${ticket.id}</strong></td>
                <td>
                    <div>${ticket.category} ${ticket.attachment ? '<i class="ph ph-paperclip" title="Anexo: ' + ticket.attachment + '"></i>' : ''}</div>
                    <small style="color:var(--text-muted)">${ticket.description.substring(0, 30)}...</small>
                </td>
                <td>
                    <div>${ticket.name}</div>
                    <small style="color:var(--text-muted)">${ticket.department}</small>
                </td>
                <td>${ticket.date}</td>
                <td><span class="status-badge ${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span></td>
                <td class="actions-col">
                    ${store.user.role === 'admin' ? getAdminActions(ticket.id) : '<button class="btn-outline btn-sm" disabled>Ver</button>'}
                </td>
            `;
            dom.ticketsTableBody.appendChild(tr);
        });
    }
}

function getAdminActions(ticketId) {
    return `
        <select onchange="updateTicketStatus('${ticketId}', this.value)" class="status-select">
            <option value="" disabled selected>Alterar...</option>
            <option value="Aberto">Aberto</option>
            <option value="Em atendimento">Em atendimento</option>
            <option value="Resolvido">Resolvido</option>
        </select>
    `;
}

// Global scope for HTML inline calls
window.updateTicketStatus = function (ticketId, newStatus) {
    const ticketIndex = store.tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex > -1) {
        store.tickets[ticketIndex].status = newStatus;
        saveTickets();
        renderDashboard();
        showToast(`Status atualizado para ${newStatus}`, 'success');
    }
};

// --- Password Reset Logic (UI Modal) ---
function handlePasswordResetRequest() {
    if (!store.user) return;
    openResetModal();
}

function openResetModal() {
    const modal = document.getElementById('reset-modal');
    const adminOption = document.getElementById('admin-reset-option');
    const form = document.getElementById('reset-form');

    // Reset state
    form.reset();
    toggleResetInput(); // Reset view

    // Show/Hide "Other User" option based on role
    if (store.user && store.user.role === 'admin') {
        adminOption.classList.remove('hidden');
    } else {
        adminOption.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeResetModal() {
    document.getElementById('reset-modal').classList.add('hidden');
}

function toggleResetInput() {
    const resetType = document.querySelector('input[name="reset-type"]:checked').value;
    const emailGroup = document.getElementById('reset-email-group');
    const passSection = document.getElementById('new-password-section');

    // Always show password section in this new flow because "Reset" implies changing it now
    passSection.classList.remove('hidden');

    if (resetType === 'other') {
        emailGroup.classList.remove('hidden');
        document.getElementById('reset-email').setAttribute('required', 'true');
    } else {
        emailGroup.classList.add('hidden');
        document.getElementById('reset-email').removeAttribute('required');
    }
}

function handleResetSubmit(e) {
    e.preventDefault();
    const resetType = document.querySelector('input[name="reset-type"]:checked').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;

    let targetEmail = store.user.email; // Default to self logic

    if (resetType === 'other') {
        targetEmail = document.getElementById('reset-email').value;
    }

    // 1. Check if passwords match
    if (newPass !== confirmPass) {
        showToast('As senhas não coincidem.', 'error');
        return;
    }

    // 2. Validate Empty
    if (!newPass || newPass.length < 3) {
        showToast('Senha muito curta.', 'error');
        return;
    }

    // 3. Find User
    const targetUserIndex = store.users.findIndex(u => u.email === targetEmail);

    if (targetUserIndex === -1) {
        // Mock validation for 'user' which is not a real email but a username in the seed
        // The user request said "validate only confirming registered user".
        // If typing 'user', we allow it for the demo sake if it matches seed.
        if (targetEmail === 'user') {
            const hackIndex = store.users.findIndex(u => u.email === 'user');
            if (hackIndex > -1) {
                updateUserPassword(hackIndex, newPass);
                return;
            }
        }
        showToast('Usuário não encontrado com este e-mail.', 'error');
        return;
    }

    // 4. Validate New != Old
    if (store.users[targetUserIndex].password === newPass) {
        showToast('A nova senha deve ser diferente da anterior.', 'error');
        return;
    }

    // 5. Update
    updateUserPassword(targetUserIndex, newPass);
}

function updateUserPassword(index, newPass) {
    store.users[index].password = newPass;
    saveUsers();

    showToast('Senha alterada com sucesso!', 'success');
    closeResetModal();
}

// Remove old mailto logic
function performReset(target) { }

// --- Utilities ---
function showToast(message, type = 'default') {
    const toast = dom.toast;
    const icon = toast.querySelector('i');
    const msg = toast.querySelector('.message');

    msg.textContent = message;
    toast.className = `toast ${type}`;

    if (type === 'success') icon.className = 'ph ph-check-circle lg-icon';
    else if (type === 'error') icon.className = 'ph ph-warning-circle lg-icon';
    else icon.className = 'ph ph-info lg-icon';

    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// --- Event Listeners ---
function setupEventListeners() {
    dom.forms.login.addEventListener('submit', handleLogin);
    dom.forms.ticket.addEventListener('submit', handleSubmitTicket);

    document.getElementById('nav-login-btn').addEventListener('click', () => showSection('login'));
    document.getElementById('nav-logout-btn').addEventListener('click', handleLogout);

    // Initial Setup
    updateUI();
}

function updateUI() {
    // If refreshing on dashboard but not logged in, go home
    if (!store.user && store.view === 'dashboard') {
        showHome();
    }
}

// Start
init();
