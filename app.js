// Estado Global do App
let currentUser = null;
let currentActiveTab = 'dashboard';
let currentSelectedTicketId = null;
let selectedAttachment = null; // Guardará o arquivo anexado temporariamente {name, type, size, data}

// Instâncias Globais dos Gráficos do Chart.js para destruição/recriação limpa
let chartSectorDestInstance = null;
let chartFlowIOInstance = null;
let chartSalesTrendInstance = null;

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa ícones lucide
  lucide.createIcons();
  
  // Verifica se o usuário já está logado na sessão ativa
  const sessionUser = sessionStorage.getItem("current_rocket_user");
  if (sessionUser) {
    currentUser = JSON.parse(sessionUser);
    showPlatform();
  } else {
    showAuthScreen();
  }
});

// ================= ROTEAMENTO E TABS =================
function switchAuthTab(tab) {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginToggle = document.getElementById("tab-login-toggle");
  const registerToggle = document.getElementById("tab-register-toggle");
  const alertBox = document.getElementById("auth-alert");

  alertBox.style.display = "none";

  if (tab === 'login') {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    loginToggle.classList.add("active");
    registerToggle.classList.remove("active");
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    loginToggle.classList.remove("active");
    registerToggle.classList.add("active");
  }
}

function switchTab(tabId) {
  // Desativa a aba anterior
  document.getElementById(`menu-${currentActiveTab}`).classList.remove("active");
  document.getElementById(`tab-${currentActiveTab}`).classList.remove("active");
  
  // Ativa a nova aba
  document.getElementById(`menu-${tabId}`).classList.add("active");
  document.getElementById(`tab-${tabId}`).classList.add("active");
  
  currentActiveTab = tabId;

  // Atualiza cabeçalhos
  const pageTitle = document.getElementById("page-title");
  const pageSubtitle = document.getElementById("page-subtitle");

  if (tabId === 'dashboard') {
    pageTitle.textContent = "Dashboard Geral";
    pageSubtitle.textContent = "Acompanhe chamados ativos, fluxo de processos e pipelines de vendas.";
    renderDashboard();
  } else if (tabId === 'novo-chamado') {
    pageTitle.textContent = "Novo Chamado";
    pageSubtitle.textContent = "Abra uma solicitação intersetorial detalhada e anexe arquivos.";
    setupNewTicketForm();
  } else if (tabId === 'analytics') {
    pageTitle.textContent = "BI & Analytics";
    pageSubtitle.textContent = "Análise estatística de volume de chamados por setor e desempenho de faturamento.";
    renderBICharts();
  }
  
  // Recria ícones
  lucide.createIcons();
}

// ================= CONTROLE DE AUTENTICAÇÃO =================
function handleRegister(e) {
  e.preventDefault();
  const alertBox = document.getElementById("auth-alert");
  const matricula = document.getElementById("reg-matricula").value.trim();
  const name = document.getElementById("reg-name").value.trim();
  const sector = document.getElementById("reg-sector").value;
  const password = document.getElementById("reg-senha").value;

  if (!matricula || !name || !sector || !password) {
    showAlert("error", "Preencha todos os campos corretamente.");
    return;
  }

  // Busca usuários existentes
  let users = JSON.parse(localStorage.getItem("rocket_users")) || [];

  // Verifica se matrícula já existe
  const exists = users.find(u => u.matricula === matricula);
  if (exists) {
    showAlert("error", "Esta matrícula já está cadastrada no sistema.");
    return;
  }

  // Adiciona novo usuário
  const newUser = { matricula, name, sector, password };
  users.push(newUser);
  localStorage.setItem("rocket_users", JSON.stringify(users));

  showAlert("success", "Cadastro realizado com sucesso! Faça login para prosseguir.");
  
  // Limpa formulário e muda para login após delay
  e.target.reset();
  setTimeout(() => {
    switchAuthTab('login');
    document.getElementById("login-matricula").value = matricula;
  }, 1500);
}

function handleLogin(e) {
  e.preventDefault();
  const matricula = document.getElementById("login-matricula").value.trim();
  const password = document.getElementById("login-senha").value;

  let users = JSON.parse(localStorage.getItem("rocket_users")) || [];
  
  // Usuário administrador padrão de TI caso não existam cadastros
  if (users.length === 0 && matricula === "admin" && password === "admin") {
    const defaultAdmin = { matricula: "admin", name: "Administrador Geral TI", sector: "TI", password: "admin" };
    users.push(defaultAdmin);
    localStorage.setItem("rocket_users", JSON.stringify(users));
  }

  const user = users.find(u => u.matricula === matricula && u.password === password);

  if (!user) {
    showAlert("error", "Matrícula ou senha inválidas. Tente novamente.");
    return;
  }

  // Login bem sucedido
  currentUser = user;
  sessionStorage.setItem("current_rocket_user", JSON.stringify(user));
  
  showAlert("success", `Bem-vindo de volta, ${user.name}!`);
  
  setTimeout(() => {
    e.target.reset();
    showPlatform();
  }, 1000);
}

function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem("current_rocket_user");
  showAuthScreen();
}

function showAuthScreen() {
  document.getElementById("auth-screen").style.display = "flex";
  document.getElementById("main-platform").style.display = "none";
}

function showPlatform() {
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("main-platform").style.display = "grid";
  
  // Atualiza painel do usuário na barra lateral
  document.getElementById("user-name-lbl").textContent = currentUser.name;
  document.getElementById("user-matricula-lbl").textContent = `Matrícula: ${currentUser.matricula}`;
  document.getElementById("user-sector-badge").textContent = currentUser.sector;
  
  // Iniciais do Avatar
  const initials = currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  document.getElementById("user-avatar-lbl").textContent = initials;
  
  // Vai para a página padrão
  switchTab('dashboard');
}

function showAlert(type, msg) {
  const alertBox = document.getElementById("auth-alert");
  alertBox.className = `auth-alert ${type}`;
  alertBox.textContent = msg;
}

// ================= PROCESSAMENTO DE ARQUIVOS (ANEXOS) =================
function triggerFileInput() {
  document.getElementById("ticket-file").click();
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    processFile(file);
  }
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById("upload-zone").classList.add("dragover");
}

function handleDragLeave(e) {
  e.preventDefault();
  document.getElementById("upload-zone").classList.remove("dragover");
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById("upload-zone").classList.remove("dragover");
  
  const file = e.dataTransfer.files[0];
  if (file) {
    processFile(file);
  }
}

function processFile(file) {
  // Limite de 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert("Arquivo muito grande. Limite máximo permitido: 5MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    selectedAttachment = {
      name: file.name,
      type: file.type,
      size: (file.size / 1024).toFixed(1) + " KB",
      data: event.target.result // Base64 data url
    };
    
    // Atualiza preview na UI
    document.getElementById("preview-filename").textContent = selectedAttachment.name;
    document.getElementById("preview-filesize").textContent = selectedAttachment.size;
    document.getElementById("attachment-preview").style.display = "flex";
    document.getElementById("upload-zone").style.display = "none";
  };
  reader.readAsDataURL(file);
}

function clearAttachment(e) {
  if (e) e.stopPropagation();
  selectedAttachment = null;
  document.getElementById("ticket-file").value = "";
  document.getElementById("attachment-preview").style.display = "none";
  document.getElementById("upload-zone").style.display = "block";
}

// ================= GESTÃO DE FORMULÁRIO DE TICKET =================
function setupNewTicketForm() {
  document.getElementById("create-ticket-form").reset();
  document.getElementById("ticket-origin").value = currentUser.sector;
  clearAttachment();
}

function handleCreateTicket(e) {
  e.preventDefault();
  
  const destSector = document.getElementById("ticket-dest").value;
  const title = document.getElementById("ticket-title").value.trim();
  const description = document.getElementById("ticket-desc").value.trim();
  
  if (!destSector || !title || !description) {
    alert("Por favor, preencha todos os campos obrigatórios.");
    return;
  }

  const tickets = JSON.parse(localStorage.getItem("rocket_tickets")) || [];
  
  // Gerar ID sequencial
  const lastId = tickets.length > 0 ? parseInt(tickets[tickets.length - 1].id.split("-")[1]) : 0;
  const newId = `CH-${String(lastId + 1).padStart(3, '0')}`;

  const newTicket = {
    id: newId,
    title: title,
    description: description,
    originSector: currentUser.sector,
    destSector: destSector,
    status: 'aberto',
    createdDate: new Date().toISOString(),
    createdBy: currentUser.name,
    attachmentName: selectedAttachment ? selectedAttachment.name : null,
    attachmentType: selectedAttachment ? selectedAttachment.type : null,
    attachmentData: selectedAttachment ? selectedAttachment.data : null
  };

  tickets.push(newTicket);
  localStorage.setItem("rocket_tickets", JSON.stringify(tickets));

  alert(`Chamado ${newId} criado com sucesso e encaminhado para o setor ${destSector}!`);
  
  // Limpa e redireciona para o painel principal
  setupNewTicketForm();
  switchTab('dashboard');
}

// ================= RENDERIZAR DASHBOARD E KANBAN =================
function renderDashboard() {
  const tickets = JSON.parse(localStorage.getItem("rocket_tickets")) || [];
  const sales = JSON.parse(localStorage.getItem("rocket_sales")) || [];

  // --- 1. Calcular KPIs ---
  const openCount = tickets.filter(t => t.status === 'aberto').length;
  const inProgressCount = tickets.filter(t => t.status === 'andamento').length;
  const completedCount = tickets.filter(t => t.status === 'concluido').length;
  const returnedCount = tickets.filter(t => t.status === 'devolvido').length;

  const totalTickets = tickets.length;
  const completionRate = totalTickets > 0 ? Math.round((completedCount / totalTickets) * 100) : 0;

  // KPIs de Vendas
  const salesWon = sales.filter(s => s.status === 'ganho');
  const totalSalesVal = salesWon.reduce((sum, s) => sum + s.value, 0);
  const salesCount = salesWon.length;

  // Atualizar DOM KPIs
  document.getElementById("kpi-tickets-open").textContent = openCount;
  document.getElementById("kpi-tickets-closed").textContent = completedCount;
  document.getElementById("kpi-tickets-completion-rate").textContent = `${completionRate}% resolução`;
  document.getElementById("kpi-tickets-returned").textContent = returnedCount;
  document.getElementById("kpi-sales-value").textContent = formatBRL(totalSalesVal);
  document.getElementById("kpi-sales-count").textContent = `${salesCount} vendas realizadas`;

  // --- 2. Renderizar Colunas de Chamados ---
  const cols = {
    aberto: document.getElementById("col-aberto"),
    andamento: document.getElementById("col-andamento"),
    concluido: document.getElementById("col-concluido"),
    devolvido: document.getElementById("col-devolvido")
  };

  // Limpa colunas
  Object.keys(cols).forEach(key => {
    cols[key].innerHTML = "";
  });

  // Popula colunas
  tickets.forEach(ticket => {
    const card = document.createElement("div");
    card.className = "ticket-card";
    card.onclick = () => openTicketModal(ticket.id);
    
    // Mostra indicador se houver anexo
    const attachmentIcon = ticket.attachmentName 
      ? `<div class="card-attachment-indicator"><i data-lucide="paperclip" style="width:12px;height:12px;"></i></div>` 
      : "";

    card.innerHTML = `
      <div class="card-tag-row">
        <span class="card-id">${ticket.id}</span>
        <span class="card-sector-tag">${ticket.originSector} ➔ ${ticket.destSector}</span>
      </div>
      <div class="card-title">${escapeHTML(ticket.title)}</div>
      <div class="card-meta-row">
        <div class="card-user">
          <div class="card-user-avatar">${ticket.createdBy[0].toUpperCase()}</div>
          <span>${escapeHTML(ticket.createdBy.split(" ")[0])}</span>
        </div>
        ${attachmentIcon}
      </div>
    `;
    
    if (cols[ticket.status]) {
      cols[ticket.status].appendChild(card);
    }
  });

  // Atualiza contadores dos títulos das colunas
  document.getElementById("count-aberto").textContent = openCount;
  document.getElementById("count-andamento").textContent = inProgressCount;
  document.getElementById("count-concluido").textContent = completedCount;
  document.getElementById("count-devolvido").textContent = returnedCount;

  // --- 3. Renderizar Colunas de Vendas ---
  const salesCols = {
    lead: document.getElementById("vendas-col-lead"),
    negociacao: document.getElementById("vendas-col-negociacao"),
    proposta: document.getElementById("vendas-col-proposta"),
    ganho: document.getElementById("vendas-col-ganho")
  };

  // Limpa colunas de vendas
  Object.keys(salesCols).forEach(key => {
    salesCols[key].innerHTML = "";
  });

  const salesCounts = { lead: 0, negociacao: 0, proposta: 0, ganho: 0 };

  sales.forEach(sale => {
    const card = document.createElement("div");
    card.className = "sale-card";
    
    // Formata o status para a coluna correspondente (caso de devolvido ou ganho vão pra última coluna)
    let colKey = sale.status;
    let badgeColor = "var(--text-muted)";
    let badgeLabel = "Lead";

    if (sale.status === 'devolvido') {
      colKey = 'ganho'; // Renderiza na última coluna
      badgeColor = "var(--status-devolvido)";
      badgeLabel = "Devolvida";
    } else if (sale.status === 'ganho') {
      badgeColor = "var(--status-concluido)";
      badgeLabel = "Concluída";
    } else if (sale.status === 'negociacao') {
      badgeColor = "var(--status-andamento)";
      badgeLabel = "Negociação";
    } else if (sale.status === 'proposta') {
      badgeColor = "var(--status-aberto)";
      badgeLabel = "Proposta";
    }

    card.innerHTML = `
      <div class="card-tag-row">
        <span class="card-id" style="background: rgba(255, 255, 255, 0.05); color: #fff; border-color: rgba(255,255,255,0.1)">${sale.id}</span>
        <span class="card-sector-tag" style="color: ${badgeColor}; background: rgba(255,255,255,0.02)">${badgeLabel}</span>
      </div>
      <div class="sale-card-value">${formatBRL(sale.value)}</div>
      <div class="sale-card-client">${escapeHTML(sale.client)}</div>
    `;

    if (salesCols[colKey]) {
      salesCols[colKey].appendChild(card);
      salesCounts[colKey]++;
    }
  });

  // Atualiza contadores das colunas de vendas
  document.getElementById("vendas-count-lead").textContent = salesCounts.lead;
  document.getElementById("vendas-count-negociacao").textContent = salesCounts.negociacao;
  document.getElementById("vendas-count-proposta").textContent = salesCounts.proposta;
  document.getElementById("vendas-count-ganho").textContent = salesCounts.ganho;

  // Reinicializa ícones do lucide inseridos dinamicamente
  lucide.createIcons();
}

// ================= MODAL DE DETALHES DO TICKET =================
function openTicketModal(ticketId) {
  const tickets = JSON.parse(localStorage.getItem("rocket_tickets")) || [];
  const ticket = tickets.find(t => t.id === ticketId);

  if (!ticket) return;

  currentSelectedTicketId = ticketId;

  // Popula dados no modal
  document.getElementById("modal-ticket-id").textContent = ticket.id;
  document.getElementById("modal-title").textContent = ticket.title;
  document.getElementById("modal-desc").textContent = ticket.description;
  document.getElementById("modal-origin").textContent = ticket.originSector;
  document.getElementById("modal-destination").textContent = ticket.destSector;
  document.getElementById("modal-creator").textContent = ticket.createdBy;
  
  // Data formatada
  const dateObj = new Date(ticket.createdDate);
  document.getElementById("modal-date").textContent = dateObj.toLocaleDateString('pt-BR') + ' às ' + dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

  // Badge Status
  const statusBadge = document.getElementById("modal-status");
  statusBadge.className = `modal-status-badge ${ticket.status}`;
  
  const statusLabels = {
    aberto: "Processo Aberto",
    andamento: "Em Andamento",
    concluido: "Processo Concluído",
    devolvido: "Processo Devolvido"
  };
  statusBadge.textContent = statusLabels[ticket.status] || ticket.status;

  // Caixa de justificativa de devolução
  const devBox = document.getElementById("modal-devolucao-reason-box");
  if (ticket.status === 'devolvido' && ticket.reasonDevolvido) {
    document.getElementById("modal-devolucao-reason").textContent = ticket.reasonDevolvido;
    devBox.style.display = "block";
  } else {
    devBox.style.display = "none";
  }

  // Área de anexos
  const attachmentArea = document.getElementById("modal-attachment-area");
  if (ticket.attachmentName && ticket.attachmentData) {
    document.getElementById("modal-attachment-name").textContent = ticket.attachmentName;
    const downloadBtn = document.getElementById("modal-attachment-download");
    downloadBtn.href = ticket.attachmentData;
    downloadBtn.download = ticket.attachmentName;
    attachmentArea.style.display = "block";
  } else {
    attachmentArea.style.display = "none";
  }

  // Área de ações (Botões de transição de status)
  // O usuário só pode alterar o status se pertencer ao setor de DESTINO do chamado (ou se for o Admin TI)
  const actionRow = document.getElementById("modal-action-row");
  const btnStart = document.getElementById("btn-action-start");
  const btnComplete = document.getElementById("btn-action-complete");
  const btnReturn = document.getElementById("btn-action-return");
  
  // Reseta estado da área de inputs de devolução
  cancelDevolucao();

  const isDestUser = currentUser.sector === ticket.destSector || currentUser.matricula === "admin";
  
  if (isDestUser && ticket.status !== 'concluido') {
    actionRow.style.display = "flex";
    
    // Ajusta quais botões aparecem com base no status atual
    if (ticket.status === 'aberto') {
      btnStart.style.display = "flex";
      btnComplete.style.display = "none";
      btnReturn.style.display = "flex";
    } else if (ticket.status === 'andamento') {
      btnStart.style.display = "none";
      btnComplete.style.display = "flex";
      btnReturn.style.display = "flex";
    } else if (ticket.status === 'devolvido') {
      // Se já está devolvido, o setor de destino (origem inicial) pode reabrir / reiniciar
      btnStart.style.display = "flex";
      btnComplete.style.display = "none";
      btnReturn.style.display = "none";
    }
  } else {
    actionRow.style.display = "none";
  }

  // Abre Modal
  document.getElementById("ticket-modal").classList.add("active");
  lucide.createIcons();
}

function closeTicketModal(e) {
  if (e) e.stopPropagation();
  document.getElementById("ticket-modal").classList.remove("active");
  currentSelectedTicketId = null;
}

function updateTicketStatus(newStatus) {
  if (!currentSelectedTicketId) return;

  const tickets = JSON.parse(localStorage.getItem("rocket_tickets")) || [];
  const index = tickets.findIndex(t => t.id === currentSelectedTicketId);

  if (index !== -1) {
    tickets[index].status = newStatus;
    
    // Se mudou de devolvido para outro status, limpa a justificativa anterior
    if (newStatus !== 'devolvido') {
      delete tickets[index].reasonDevolvido;
    }

    localStorage.setItem("rocket_tickets", JSON.stringify(tickets));
    
    // Atualiza modal com novos dados
    openTicketModal(currentSelectedTicketId);
    
    // Re-renderiza dashboard
    renderDashboard();
  }
}

// Fluxo de devolução com justificativa
function showDevolucaoInput() {
  document.getElementById("devolucao-input-area").classList.add("active");
  document.getElementById("modal-action-row").style.display = "none";
}

function cancelDevolucao() {
  document.getElementById("devolucao-input-area").classList.remove("active");
  document.getElementById("devolucao-reason-text").value = "";
  
  // Volta a mostrar a fileira de ações se o modal ainda estiver ativo e configurado
  if (currentSelectedTicketId) {
    const tickets = JSON.parse(localStorage.getItem("rocket_tickets")) || [];
    const ticket = tickets.find(t => t.id === currentSelectedTicketId);
    if (ticket && ticket.status !== 'concluido') {
      document.getElementById("modal-action-row").style.display = "flex";
    }
  }
}

function submitDevolucao() {
  const reason = document.getElementById("devolucao-reason-text").value.trim();
  if (!reason) {
    alert("Insira uma justificativa para a devolução.");
    return;
  }

  const tickets = JSON.parse(localStorage.getItem("rocket_tickets")) || [];
  const index = tickets.findIndex(t => t.id === currentSelectedTicketId);

  if (index !== -1) {
    tickets[index].status = 'devolvido';
    tickets[index].reasonDevolvido = reason;
    localStorage.setItem("rocket_tickets", JSON.stringify(tickets));

    cancelDevolucao();
    openTicketModal(currentSelectedTicketId);
    renderDashboard();
  }
}

// ================= DASHBOARDS & BI (CHART.JS) =================
function renderBICharts() {
  const tickets = JSON.parse(localStorage.getItem("rocket_tickets")) || [];
  const sales = JSON.parse(localStorage.getItem("rocket_sales")) || [];

  // KPIs de BI
  const completedCount = tickets.filter(t => t.status === 'concluido').length;
  const returnedCount = tickets.filter(t => t.status === 'devolvido').length;
  
  const salesWon = sales.filter(s => s.status === 'ganho');
  const salesReturned = sales.filter(s => s.status === 'devolvido');
  const totalSalesCount = sales.length;
  // Conversão de vendas = (ganhas / total de leads processados terminados)
  const totalFinalizedSales = salesWon.length + salesReturned.length;
  const salesConversion = totalFinalizedSales > 0 ? ((salesWon.length / totalFinalizedSales) * 100).toFixed(1) : "0.0";

  document.getElementById("bi-conversion-rate").textContent = `${salesConversion}%`;
  document.getElementById("bi-resolved-count").textContent = completedCount;
  document.getElementById("bi-returned-count").textContent = returnedCount;

  // --- Destruir gráficos antigos se existirem ---
  if (chartSectorDestInstance) chartSectorDestInstance.destroy();
  if (chartFlowIOInstance) chartFlowIOInstance.destroy();
  if (chartSalesTrendInstance) chartSalesTrendInstance.destroy();

  // --- Gráfico 1: Volume de Chamados por Setor Destino (Pizza/Doughnut) ---
  const sectors = ["Vendas", "Admin/Financeiro", "TI", "Marketing"];
  const sectorDestCounts = sectors.map(sec => tickets.filter(t => t.destSector === sec).length);

  const ctxSector = document.getElementById("chart-sector-dest").getContext("2d");
  chartSectorDestInstance = new Chart(ctxSector, {
    type: 'doughnut',
    data: {
      labels: sectors,
      datasets: [{
        data: sectorDestCounts,
        backgroundColor: [
          'rgba(255, 210, 0, 0.75)',  // Yellow Primary
          'rgba(255, 255, 255, 0.75)', // White
          'rgba(56, 189, 248, 0.75)',  // Blue
          'rgba(248, 113, 113, 0.75)'  // Red/Coral
        ],
        borderColor: '#121216',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#a0a0ab', font: { family: 'Inter', size: 11 } }
        }
      }
    }
  });

  // --- Gráfico 2: Fluxo Enviados vs Recebidos por Setor (Bar) ---
  const sectorSentCounts = sectors.map(sec => tickets.filter(t => t.originSector === sec).length);
  const sectorRecCounts = sectors.map(sec => tickets.filter(t => t.destSector === sec).length);

  const ctxFlow = document.getElementById("chart-flow-io").getContext("2d");
  chartFlowIOInstance = new Chart(ctxFlow, {
    type: 'bar',
    data: {
      labels: sectors,
      datasets: [
        {
          label: 'Chamados Enviados',
          data: sectorSentCounts,
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1
        },
        {
          label: 'Chamados Recebidos',
          data: sectorRecCounts,
          backgroundColor: 'rgba(255, 210, 0, 0.7)',
          borderColor: '#FFD200',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#a0a0ab', font: { family: 'Inter' } } }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0ab' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0ab', stepSize: 1 } }
      }
    }
  });

  // --- Gráfico 3: Desempenho Financeiro de Vendas (Line Area Chart) ---
  // Agrupa valores acumulados de vendas por data nos últimos 7 dias/vendas
  const sortedSales = [...sales].sort((a, b) => new Date(a.date) - new Date(b.date));
  const salesLabels = sortedSales.map(s => formatDateString(s.date));
  
  // Valores acumulados de vendas concluidas (ganhas)
  let runningSum = 0;
  const salesTrendValues = sortedSales.map(s => {
    if (s.status === 'ganho') {
      runningSum += s.value;
    }
    return runningSum;
  });

  const ctxSales = document.getElementById("chart-sales-trend").getContext("2d");
  chartSalesTrendInstance = new Chart(ctxSales, {
    type: 'line',
    data: {
      labels: salesLabels,
      datasets: [{
        label: 'Faturamento Acumulado (R$)',
        data: salesTrendValues,
        fill: true,
        backgroundColor: 'rgba(255, 210, 0, 0.12)',
        borderColor: '#FFD200',
        borderWidth: 2,
        tension: 0.35,
        pointBackgroundColor: '#FFD200',
        pointBorderColor: '#0a0a0c',
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#a0a0ab', font: { family: 'Inter' } } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#a0a0ab' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0ab' } }
      }
    }
  });
}

// ================= FUNÇÕES AUXILIARES =================
function formatBRL(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDateString(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
