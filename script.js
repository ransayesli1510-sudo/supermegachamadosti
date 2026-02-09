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

// --- Supabase initialization is handled in supabase-config.js ---


// GitHub functions removed in favor of Supabase helper functions in supabase-db.js



// --- State Management ---
const store = {
    view: 'home',
    user: null, // null, { username, role, email }
    tickets: [],
    users: []
};


// Subscriptions for Updates
let ticketSubscription = null;
async function startRealtimeSync() {
    if (ticketSubscription) return;

    // Initial Load
    await loadData();

    // Subscribe to changes (Real-time instead of polling)
    ticketSubscription = subscribeToTickets(() => {
        loadData(true); // Silent update when database changes
    });
}

async function loadData(silent = false) {
    if (!silent) updateStatus('syncing');

    const result = await getTickets();
    if (result.success) {
        updateStatus('connected');
        store.tickets = result.tickets || [];

        if (!silent) ErrorLogger.info("Dados carregados do Supabase");

        // Update UI if on dashboard
        if (store.view === 'dashboard' && store.user) {
            renderDashboard();
        }
    } else {
        updateStatus('error');
        if (!silent) ErrorLogger.warn("Falha ao carregar dados do Supabase.");
    }
    // Initial fallbacks if empty (users are not fetched via getTickets, so keep this fallback)
    if (store.users.length === 0) {
        store.users = [
            { id: 'u1', email: 'ransay@supermegavendas.com', password: 'admin123', username: 'Ransay (Gestor)', role: 'admin' },
            { id: 'u2', email: 'user', password: 'user123', username: 'Usuário', role: 'user' },
            { id: 'u3', email: 'user@email.com', password: 'user123', username: 'Usuário Padrão', role: 'user' }
        ];
    }
}

function updateStatus(state) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (!dot || !text) return;

    if (state === 'connected') {
        dot.className = 'status-dot status-connected';
        text.textContent = 'Conectado (Supabase)';
    } else if (state === 'error') {
        dot.className = 'status-dot status-error';
        text.textContent = 'Erro Conexão';
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
    const isSupabaseReady = initSupabase();
    if (isSupabaseReady) {
        startRealtimeSync();
    }
    setupEventListeners();
    checkAuthSession();
    updateUI();
}

// Helper to save entire store to DB
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
async function checkAuthSession() {
    const result = await getCurrentUser();
    if (result) {
        store.user = result.profile;
        // If on dashboard, load data
        if (store.view === 'dashboard') {
            await loadData();
        }
    }
    updateNav();
}

async function handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    const result = await signIn(email, password);
    if (result.success) {
        loginSuccess(result.profile); // Profile contains role
    } else {
        showToast(result.error || 'Erro ao fazer login', 'error');
    }
}

function loginSuccess(profile) {
    store.user = profile;
    dom.forms.login.reset();
    showToast(`Bem-vindo, ${profile.full_name}!`, 'success');
    updateNav();
    showSection('dashboard');
    loadData(); // Fetch tickets for the logged in user
}

async function handleLogout() {
    await signOut();
    store.user = null;
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
async function handleSubmitTicket(e) {
    e.preventDefault();

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    const formData = {
        name: e.target.name.value,
        email: e.target.email.value,
        department: e.target.department.value,
        category: e.target.category.value,
        description: e.target.description.value,
        attachment: document.getElementById('attachment').files[0] ? document.getElementById('attachment').files[0].name : null
    };

    const result = await createTicket(formData);

    btn.textContent = originalText;
    btn.disabled = false;

    if (result.success) {
        showToast('Chamado enviado com sucesso!', 'success');
        e.target.reset();

        if (store.user) {
            await loadData();
            showSection('dashboard');
        } else {
            showHome();
        }
    } else {
        showToast('Erro ao enviar chamado. Tente novamente.', 'error');
    }
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
    let displayTickets = store.tickets;
    if (store.user.role !== 'admin') {
        // User sees only "Usuário" created tickets.
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
            const dateStr = new Date(ticket.created_at).toLocaleDateString('pt-BR');
            const creatorName = ticket.created_by_profile ? ticket.created_by_profile.full_name : 'Anônimo';

            tr.innerHTML = `
                <td><strong>#${ticket.id.substring(0, 4)}</strong></td>
                <td>
                    <div>${ticket.category} ${ticket.attachment_url ? '<i class="ph ph-paperclip" title="Anexo: ' + ticket.attachment_url + '"></i>' : ''}</div>
                    <small style="color:var(--text-muted)">${ticket.description.substring(0, 30)}...</small>
                </td>
                <td>
                    <div>${creatorName}</div>
                    <small style="color:var(--text-muted)">${ticket.department || 'N/A'}</small>
                </td>
                <td>${dateStr}</td>
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
        persistStore(); // Save to Git
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
                const confirmed = confirm(`[SIMULAÇÃO DE E-MAIL]\n\nOlá, ${userExists.username}.\n\nRecebemos um pedido para redefinir sua senha.\nClique em OK para redefinir agora.`);
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
