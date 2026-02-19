/**
 * Help Desk Pro - Logic
 * Handles state, routing, and simulated backend operations.
 */

// --- Production Error Logging ---
const ErrorLogger = {
    logs: [],
    maxLogs: 100,

    log(level, message, error = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output with emoji
        const emoji = {
            'error': '❌',
            'warn': '⚠️',
            'info': 'ℹ️',
            'success': '✅'
        };

        console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
            `${emoji[level] || '📝'} [${timestamp}] ${message}`,
            error || ''
        );

        // Show user-friendly toast for errors
        if (level === 'error' && typeof showToast === 'function') {
            showToast(message, 'error');
        }
    },

    error(message, error) {
        this.log('error', message, error);
    },

    warn(message, error) {
        this.log('warn', message, error);
    },

    info(message) {
        this.log('info', message);
    },

    success(message) {
        this.log('success', message);
    },

    getLogs() {
        return this.logs;
    },

    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
};

// Global error handlers
window.addEventListener('error', (event) => {
    ErrorLogger.error('Uncaught Error', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    ErrorLogger.error('Unhandled Promise Rejection', event.reason);
});

// Network status monitoring
window.addEventListener('online', () => {
    ErrorLogger.success('Conexão restaurada');
    if (typeof updateStatus === 'function') updateStatus('connected');
});

window.addEventListener('offline', () => {
    ErrorLogger.warn('Sem conexão com a internet');
    if (typeof updateStatus === 'function') updateStatus('error');
});

// --- Cloud Storage Configuration (Professional Upgrade: Google Sheets) ---
// Para sincronizar em TODOS os dispositivos, cole o seu link do Google abaixo entre as aspas:
const HARDCODED_CLOUD_URL = "https://script.google.com/a/macros/supermegavendas.com/s/AKfycbyQU8ZPwjfNZ1ZXxWA8a5Yoru-w3YcDSa_YfAxu7Brp9U1GjZM-c3I77h9cDSFzxqg/exec";

let CLOUD_URL = HARDCODED_CLOUD_URL || localStorage.getItem('supermegati_cloud_url') || "";

// Fallback to previous services if URL is not set (for initial setup)
const FALLBACK_PANTRY_ID = "0b14c330-8041-4c6e-826c-d227db0290ca";

// --- Data Storage Helpers (Cloud) ---
async function fetchDB() {
    if (!CLOUD_URL) {
        ErrorLogger.warn("Cloud URL não configurada. Use o Setup no Dashboard.");
        const local = localStorage.getItem('supermegati_db');
        return local ? JSON.parse(local) : null;
    }

    ErrorLogger.info("Sincronizando com a Nuvem...");
    try {
        const response = await fetch(CLOUD_URL);

        if (!response.ok) {
            throw new Error(`Servidor retornou erro ${response.status}`);
        }

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            if (text.includes("<html") || text.includes("<body")) {
                throw new Error("A URL da nuvem retornou uma página HTML em vez de dados. Verifique se você copiou o link de 'Execução' e não o do Editor.");
            }
            throw new Error("Resposta da nuvem inválida.");
        }
    } catch (error) {
        ErrorLogger.error("Erro na Sincronização", error);
        throw error;
    }
}

async function saveDB(newData) {
    if (!CLOUD_URL) {
        localStorage.setItem('supermegati_db', JSON.stringify(newData));
        return true;
    }

    try {
        // We use text/plain to avoid CORS preflight, Apps Script will still get the data in e.postData.contents
        const response = await fetch(CLOUD_URL, {
            method: 'POST',
            body: JSON.stringify(newData)
        });

        ErrorLogger.success("Dados salvos na Nuvem");
        return true;
    } catch (error) {
        ErrorLogger.error("Falha ao salvar na Nuvem", error);
        return false;
    }
}

// Cloud Sync persists the store to the cloud
async function persistStore() {
    return await saveDB({ tickets: store.tickets, users: store.users });
}

// --- State Management ---
const store = {
    view: 'home',
    user: null, // null, { username, role, email }
    tickets: [],
    users: []
};


// Polling for Updates (Simple Sync)
let pollInterval = null;
async function startPolling() {
    if (pollInterval) return;
    await loadData();
    pollInterval = setInterval(() => loadData(true), 5000); // 5s sync for "instant" feel
}

async function loadData(silent = false) {
    if (!silent) updateStatus('syncing');

    try {
        const data = await fetchDB();
        if (data && (data.tickets || data.users)) {
            updateStatus('connected');
            store.tickets = data.tickets || [];
            store.users = data.users || [];

            if (store.view === 'dashboard') {
                renderDashboard();
            }
        } else {
            throw new Error("EMPTY_DATA");
        }
    } catch (error) {
        updateStatus('error');

        // Always ensure the admin user exists locally even if cloud fails
        const adminEmail = 'ransay@supermegavendas.com';
        if (store.users.findIndex(u => u.email.toLowerCase() === adminEmail) === -1) {
            store.users.push({
                id: 'u_ransay',
                email: adminEmail,
                password: 'admin',
                username: 'Ransay (Gestor)',
                role: 'admin',
                full_name: 'Ransay (Gestor)'
            });
            persistStore();
        }
    }
}

function updateStatus(state) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (!dot || !text) return;

    if (state === 'connected') {
        dot.className = 'status-dot status-connected';
        text.textContent = 'Nuvem Conectada';
    } else if (state === 'error') {
        dot.className = 'status-dot status-error';
        text.textContent = 'Erro na Nuvem';
    } else if (state === 'auth_error') {
        dot.className = 'status-dot status-auth-error';
        text.textContent = 'Erro de Acesso';
    } else if (state === 'syncing') {
        dot.className = 'status-dot status-syncing';
        text.textContent = 'Sincronizando...';
    }
}

function createStatusUI() {
    // Add Styles
    const style = document.createElement('style');
    style.textContent = `
        #connection-status {
            position: fixed;
            bottom: 10px;
            right: 10px;
            font-size: 12px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 5px;
            font-family: sans-serif;
            transition: all 0.3s ease;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #ccc;
        }
        .status-connected { background-color: #00e676; }
        .status-error { background-color: #ff1744; }
        .status-auth-error { background-color: #aa00ff; }
        .status-syncing { background-color: #2979ff; }
    `;
    document.head.appendChild(style);

    // Add Element
    const div = document.createElement('div');
    div.id = 'connection-status';
    div.innerHTML = `
        <div id="status-dot" class="status-dot"></div>
        <span id="status-text">Iniciando...</span>
    `;
    document.body.appendChild(div);
}

// --- Initialization ---
function init() {
    createStatusUI();
    startPolling();
    setupEventListeners();
    checkAuthSession();
    updateUI();
}

async function persistStore() {
    const data = {
        tickets: store.tickets,
        users: store.users
    };
    return await saveDB(data);
}

// --- DOM Elements ---
const views = {
    home: ['hero', 'benefits'],
    createTicket: ['ticket-form'],
    login: ['login'],
    forgotPassword: ['forgot-password'],
    resetPasswordExternal: ['reset-password-external'],
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
        login: document.getElementById('login-form'),
        register: document.getElementById('register-form')
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

async function handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value.toLowerCase().trim();
    const password = e.target.password.value;

    const user = store.users.find(u =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );

    if (user) {
        loginSuccess(user);
    } else {
        showToast('Credenciais inválidas. Verifique seu e-mail e senha.', 'error');
    }
}

async function handleSignUpSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (store.users.find(u => u.email === email)) {
        showToast('E-mail já cadastrado', 'error');
        return;
    }

    const newUser = {
        id: 'u' + Date.now(),
        email,
        password,
        full_name: name,
        role: 'user'
    };

    store.users.push(newUser);
    const success = await persistStore();

    if (success) {
        showToast('Conta criada com sucesso!', 'success');
        toggleToLogin();
    } else {
        showToast('Erro ao salvar usuário no GitHub', 'error');
    }
}

function toggleToRegister() {
    dom.forms.login.classList.add('hidden');
    dom.forms.register.classList.remove('hidden');
}

function toggleToLogin() {
    dom.forms.register.classList.add('hidden');
    dom.forms.login.classList.remove('hidden');
}

function loginSuccess(user) {
    store.user = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    dom.forms.login.reset();
    showToast(`Bem-vindo, ${user.full_name || user.username}!`, 'success');
    updateNav();
    showSection('dashboard');
    renderDashboard();
}

function handleLogout() {
    store.user = null;
    localStorage.removeItem('currentUser');
    updateNav();
    showHome();
    showToast('Você saiu do sistema.');
}

function updateNav() {
    const navDashboard = document.getElementById('nav-dashboard-btn');
    const navTicket = document.getElementById('nav-ticket-btn');

    // Anyone can open a ticket
    if (navTicket) {
        navTicket.onclick = () => showSection('ticket-form');
    }

    if (store.user) {
        dom.navLogin.classList.add('hidden');
        dom.navLogout.classList.remove('hidden');
        if (navDashboard) navDashboard.classList.remove('hidden');
    } else {
        dom.navLogin.classList.remove('hidden');
        dom.navLogout.classList.add('hidden');
        if (navDashboard) navDashboard.classList.add('hidden');
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
async function handleSubmitTicket(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    const ticket = {
        id: '#' + Math.floor(1000 + Math.random() * 9000),
        category: e.target.category.value,
        description: e.target.description.value,
        department: e.target.department.value,
        status: 'Aberto',
        created_at: new Date().toISOString(),
        created_by: store.user ? store.user.id : null,
        full_name: e.target.name.value,
        email: e.target.email.value,
        attachment: document.getElementById('attachment').files[0] ? document.getElementById('attachment').files[0].name : null
    };

    store.tickets.unshift(ticket);
    const success = await persistStore();

    btn.textContent = originalText;
    btn.disabled = false;

    if (success) {
        showToast('Chamado enviado com sucesso!', 'success');
        e.target.reset();

        if (store.user) {
            showSection('dashboard');
            renderDashboard();
        } else {
            showHome();
        }
    } else {
        showToast('Erro ao sincronizar com a Nuvem.', 'error');
    }
}

// --- Dashboard Logic ---
function renderDashboard() {
    if (!store.user) {
        showSection('login');
        return;
    }

    // Determine title
    dom.dashboardTitle.textContent = store.user.role === 'admin'
        ? 'Painel Administrativo'
        : 'Meus Chamados';

    // Clear current
    dom.ticketsTableBody.innerHTML = '';
    dom.adminStats.innerHTML = '';

    // Filter tickets based on role
    let displayTickets = store.tickets;
    if (store.user.role !== 'admin') {
        displayTickets = store.tickets.filter(t => t.created_by === store.user.id);
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
            <!-- Cloud Setup Button for Admin -->
            <div class="stat-card" style="cursor:pointer; border: 1px dashed var(--primary)" onclick="setupCloud()">
                <div>
                    <div class="stat-value"><i class="ph ph-cloud-arrow-up"></i></div>
                    <div class="stat-label">Configurar Nuvem</div>
                </div>
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
            const dateStr = new Date(ticket.created_at).toLocaleDateString('pt-BR');
            const creatorName = ticket.full_name || 'Anônimo';

            tr.innerHTML = `
                <td><strong>${ticket.id}</strong></td>
                <td>
                    <div>${ticket.category} ${ticket.attachment ? '<i class="ph ph-paperclip" title="Anexo: ' + ticket.attachment + '"></i>' : ''}</div>
                    <small style="color:var(--text-muted)">${ticket.description.substring(0, 30)}...</small>
                </td>
                <td>
                    <div>${creatorName}</div>
                    <small style="color:var(--text-muted)">${ticket.department || 'N/A'}</small>
                </td>
                <td>${dateStr}</td>
                <td><span class="status-badge ${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span></td>
                <td class="actions-col">
                    ${store.user && store.user.role === 'admin' ? getAdminActions(ticket.id) : '<button class="btn-outline btn-sm" disabled>Ver</button>'}
                </td>
            `;
            dom.ticketsTableBody.appendChild(tr);
        });
    }
}

function getAdminActions(ticketId) {
    return `
        < select onchange = "updateTicketStatus('${ticketId}', this.value)" class="status-select" >
            <option value="" disabled selected>Alterar...</option>
            <option value="Aberto">Aberto</option>
            <option value="Em atendimento">Em atendimento</option>
            <option value="Resolvido">Resolvido</option>
        </select >
        `;
}

// Global setup for Cloud
window.setupCloud = function () {
    let url = prompt("Cole aqui a URL do seu Google Apps Script (deve terminar em /exec):", CLOUD_URL);
    if (url !== null) {
        url = url.trim();
        if (url && !url.includes("/exec")) {
            showToast("Atenção: A URL deve terminar em /exec. Verifique se você não copiou a URL do editor.", "error");
        }
        CLOUD_URL = url;
        localStorage.setItem('supermegati_cloud_url', CLOUD_URL);
        showToast("Nuvem configurada! Sincronizando...", "success");
        loadData();
    }
};

// Global scope for HTML inline calls
window.updateTicketStatus = function (ticketId, newStatus) {
    const ticketIndex = store.tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex > -1) {
        store.tickets[ticketIndex].status = newStatus;
        persistStore(); // Save to Git
        renderDashboard();
        showToast(`Status atualizado para ${newStatus} `, 'success');
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
    persistStore();

    showToast('Senha alterada com sucesso!', 'success');
    closeResetModal();
}

// Remove old mailto logic
function performReset(target) { }

// --- Forgot Password / External Reset Logic ---
let recoveryEmailTemp = null; // Store email during the flow

function handleRecoverySubmit(e) {
    e.preventDefault();
    const email = document.getElementById('recovery-email').value.trim();

    // 1. Check if user exists
    // Resolve Alias: 'admin' maps to the Ransay account just in case they try to recover 'admin'
    let targetEmail = email;
    if (email.toLowerCase() === 'admin') {
        targetEmail = 'ransay@supermegavendas.com';
    }

    const userExists = store.users.find(u => u.email === targetEmail);

    if (userExists) {
        // Simulate sending email
        const btn = e.target.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Enviando...';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;

            showToast('Link de redefinição enviado para o e-mail!', 'success');

            // SIMULATION: Navigate to reset page after a delay, as if they clicked the link
            setTimeout(() => {
                const confirmed = confirm(`[SIMULAÇÃO DE E - MAIL]\n\nOlá, ${userExists.username}.\n\nRecebemos um pedido para redefinir sua senha.\nClique em OK para redefinir agora.`);
                if (confirmed) {
                    recoveryEmailTemp = targetEmail;
                    showSection('reset-password-external');
                }
            }, 1000);

        }, 1500);
    } else {
        showToast('E-mail não encontrado.', 'error');
    }
}

function handleExternalResetSubmit(e) {
    e.preventDefault();
    const newPass = document.getElementById('ext-new-password').value;
    const confirmPass = document.getElementById('ext-confirm-password').value;

    if (!recoveryEmailTemp) {
        showToast('Sessão expirada. Comece novamente.', 'error');
        showSection('forgot-password');
        return;
    }

    if (newPass !== confirmPass) {
        showToast('As senhas não coincidem.', 'error');
        return;
    }

    if (!newPass || newPass.length < 3) {
        showToast('Senha muito curta.', 'error');
        return;
    }

    // Find User
    const userIndex = store.users.findIndex(u => u.email === recoveryEmailTemp);
    if (userIndex > -1) {
        // Update Password
        store.users[userIndex].password = newPass;
        persistStore(); // Save to Git

        showToast('Senha redefinida com sucesso! Faça login.', 'success');
        recoveryEmailTemp = null; // Clear
        document.getElementById('external-reset-form').reset();
        showSection('login');
    } else {
        showToast('Erro ao atualizar senha.', 'error');
    }
}

// --- Utilities ---
function showToast(message, type = 'default') {
    const toast = dom.toast;
    const icon = toast.querySelector('i');
    const msg = toast.querySelector('.message');

    msg.textContent = message;
    toast.className = `toast ${type} `;

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
    dom.forms.register.addEventListener('submit', handleSignUpSubmit);
    dom.forms.ticket.addEventListener('submit', handleSubmitTicket);

    document.getElementById('toggle-register').addEventListener('click', (e) => {
        e.preventDefault();
        toggleToRegister();
    });
    document.getElementById('toggle-login').addEventListener('click', (e) => {
        e.preventDefault();
        toggleToLogin();
    });

    document.getElementById('forgot-password-form').addEventListener('submit', handleRecoverySubmit);
    document.getElementById('external-reset-form').addEventListener('submit', handleExternalResetSubmit);

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
