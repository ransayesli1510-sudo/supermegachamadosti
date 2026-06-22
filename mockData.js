// Dados mockados iniciais para o SISMV - Sistema Integrado da Super MegaVendas
const initialTickets = [
  {
    id: "CH-001",
    title: "Erro na integração da API de pagamento",
    description: "A API de pagamentos está retornando status 500 ao processar faturas parceladas de novos clientes de Vendas.",
    originSector: "Vendas",
    destSector: "TI",
    status: "andamento",
    createdDate: "2026-06-20T10:30:00Z",
    createdBy: "Samara Souza",
    attachmentName: "erro_api_500.txt",
    attachmentType: "text/plain",
    attachmentData: "data:text/plain;base64,RVJST1JfQ09ERV81MDBfUEFZTUVOVF9GQUlMRUQ="
  },
  {
    id: "CH-002",
    title: "Liberação de orçamento para campanha de Junho",
    description: "Solicitamos a aprovação do orçamento extra de R$ 5.000 para anúncios da campanha de meio de ano no Google e Meta Ads.",
    originSector: "Marketing",
    destSector: "Admin/Financeiro",
    status: "aberto",
    createdDate: "2026-06-21T14:15:00Z",
    createdBy: "Mateus Silva",
    attachmentName: "briefing_campanha_financeiro.pdf",
    attachmentType: "application/pdf",
    attachmentData: "mock-pdf-data"
  },
  {
    id: "CH-003",
    title: "Atualização de criativos para o time de vendas",
    description: "Disponibilizar os novos banners e vídeos com a identidade visual atualizada (Foguete) para o time comercial utilizar nos pitches.",
    originSector: "Vendas",
    destSector: "Marketing",
    status: "concluido",
    createdDate: "2026-06-18T09:00:00Z",
    createdBy: "Samara Souza",
    attachmentName: "banners_rocket.zip",
    attachmentType: "application/zip",
    attachmentData: "mock-zip-data"
  },
  {
    id: "CH-004",
    title: "Instalação de software de BI na máquina do Financeiro",
    description: "Necessito da instalação do Power BI Desktop ou licença equivalente na máquina do setor financeiro para cruzamento de dados de faturamento.",
    originSector: "Admin/Financeiro",
    destSector: "TI",
    status: "devolvido",
    createdDate: "2026-06-19T11:45:00Z",
    createdBy: "Michael Souza",
    attachmentName: null,
    attachmentType: null,
    attachmentData: null,
    reasonDevolvido: "Necessário obter aprovação da gerência de TI para aquisição da licença PRO antes da instalação."
  },
  {
    id: "CH-005",
    title: "Configuração de novo notebook de Vendas",
    description: "Configuração do perfil corporativo e programas de CRM no novo notebook recebido para o novo colaborador de vendas.",
    originSector: "TI",
    destSector: "TI",
    status: "aberto",
    createdDate: "2026-06-22T08:00:00Z",
    createdBy: "Admin TI",
    attachmentName: null,
    attachmentType: null,
    attachmentData: null
  }
];

const initialSales = [
  { id: "VD-001", client: "Tech Solutions Ltda", value: 15400, status: "ganho", date: "2026-06-15" },
  { id: "VD-002", client: "Indústrias Alpha S.A.", value: 32000, status: "negociacao", date: "2026-06-18" },
  { id: "VD-003", client: "Clínica Bem Estar", value: 8500, status: "proposta", date: "2026-06-20" },
  { id: "VD-004", client: "Construtora Silva", value: 45000, status: "ganho", date: "2026-06-21" },
  { id: "VD-005", client: "Supermercado Popular", value: 12000, status: "devolvido", date: "2026-06-22" },
  { id: "VD-006", client: "Startup Spark", value: 6200, status: "lead", date: "2026-06-22" }
];

// Salva os dados padrão no localStorage caso não existam ainda
if (!localStorage.getItem("rocket_tickets")) {
  localStorage.setItem("rocket_tickets", JSON.stringify(initialTickets));
}
if (!localStorage.getItem("rocket_sales")) {
  localStorage.setItem("rocket_sales", JSON.stringify(initialSales));
}
