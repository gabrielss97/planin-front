// Traduções em Português
const pt = {
  title: "Planin 2000 - Planning Poker Retrô",
  oldBrowserNotice: "⚠️ Este site funciona melhor com Internet Explorer 5.5 ou Netscape Navigator 4.7 ⚠️",
  checkingServer: "Verificando servidor...",
  serverOnline: "Servidor online! Usando servidor dedicado.",
  serverOffline: "Servidor offline! Usando servidor na nuvem.",
  usingFallbackServer: "Usando servidor cloud (fallback)",
  fallbackServerOnline: "Servidor alternativo online!",
  creatingRoom: "Criando sala...",
  
  // Criar sala
  createRoomTitle: "Criar Nova Sala",
  createRoom: "Criar Sala",
  roomId: "ID da sala:",
  
  // Entrar em sala
  joinRoomTitle: "Entrar em uma sala existente",
  joinRoomPlaceholder: "Cole o ID da sala aqui",
  join: "Entrar",
  
  // Sala de votação
  votingRoomTitle: "Sala de Votação",
  connectedUsers: "Usuários Conectados",
  vote: "Vote:",
  show: "Mostrar",
  hide: "Ocultar",
  showValues: "Mostrar Valores",
  hideValues: "Esconder Valores",
  clear: "Limpar",
  
  // Modais
  newRoom: "Nova Sala",
  enterName: "Informe seu nome",
  enterNameBeforeCreate: "Digite seu nome antes de criar a sala:",
  enterNameBeforeJoin: "Digite seu nome antes de entrar na sala:",
  namePlaceholder: "Seu nome",
  cancel: "Cancelar",
  create: "Criar Sala",
  enterRoomTitle: "Entrar na Sala",
  ok: "OK",
  systemAlert: "Alerta do Sistema",
  
  // Rodapé
  createdBy: "Criado por Gabriel",
  helpCreator: "Ajude o criador",
  madeWith: "Feito com",
  
  // Mensagens de erro
  pleaseEnterName: "Por favor, insira seu nome.",
  nameTooLong: "Seu nome foi ajustado para o limite máximo de 30 caracteres.",
  enterRoomId: "Insira um ID de sala",
  cannotCopyId: "Não foi possível copiar o ID. Por favor, selecione e copie manualmente.",
  roomNotFound: "Sala não encontrada. Verifique o ID e tente novamente.",
  configError: "Erro de configuração: chave inválida. Por favor, recarregue a página e tente novamente.",
  connectionError: "Erro de conexão. Tente novamente.",
  serverConnectionError: "Erro de conexão com o servidor. Alternando para servidor na nuvem...",
  hostClosedConnection: "O host encerrou a conexão",
  cannotConnect: "Não foi possível conectar à sala. Tente novamente.",
  invalidRoomId: "ID de sala inválido. Verifique e tente novamente.",
  nameRequired: "Nome é obrigatório!",
  
  // Novos textos para tratamento de conexão
  invalidKey: "Chave de acesso inválida. Usando servidor alternativo.",
  networkError: "Erro de rede. Verifique sua conexão internet.",
  webrtcNotSupported: "WebRTC não é suportado por este navegador.",
  serverError: "Erro no servidor. Tentando reconectar...",
  connectionClosed: "Conexão fechada inesperadamente.",
  errorConnecting: "Erro ao conectar",
  timeoutError: "Tempo esgotado ao tentar conectar. A rede pode estar instável.",
  roomCreated: "Sala criada com sucesso! ID",
  lostConnection: "Conexão perdida com o servidor.",
  lostConnectionToHost: "Conexão perdida com o anfitrião da sala.",
  
  // Modos
  darkMode: "Modo Escuro",
  
  // Botões
  toggleDarkMode: "Alternar Modo Escuro"
};

// Exportar traduções
if (typeof module !== 'undefined' && module.exports) {
  module.exports = pt;
} 