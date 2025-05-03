// Estado da aplicação
let peer, conn;
let currentRoomId = null;
let userName = '';
let roomIdToJoin = '';
let connections = [];
let useCustomServer = true; // Começa tentando usar o servidor customizado
let connectedUsers = []; // Lista de usuários conectados
let valuesHidden = true; // Por padrão, valores começam escondidos
let visitorCounterEl = document.querySelector('.visitor-counter span');

// Elementos da UI
const votesEl = document.getElementById('votes');
const connectionArea = document.getElementById('connectionArea');
const serverStatus = document.getElementById('serverStatus');
const roomList = document.getElementById('roomList');
const availableRooms = document.getElementById('availableRooms');
const roomIdSection = document.getElementById('roomIdSection');
const roomIdDisplay = document.getElementById('roomIdDisplay');
const copyBtn = document.getElementById('copyBtn');
const createRoomSection = document.getElementById('createRoomSection');
const joinRoomSection = document.getElementById('joinRoomSection');
const joinIdInput = document.getElementById('joinId');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const checkRoomsBtn = document.getElementById('checkRoomsBtn');
const voteBtns = document.querySelectorAll('.voteBtn');
const usersList = document.getElementById('usersList');
const toggleValuesBtn = document.getElementById('toggleValuesBtn');
const toggleBtnText = document.getElementById('toggleBtnText');
const resetVotesBtn = document.getElementById('resetVotesBtn');

// Elementos dos modais
const createNameModal = document.getElementById('createNameModal');
const joinNameModal = document.getElementById('joinNameModal');
const notificationModal = document.getElementById('notificationModal');
const notificationMessage = document.getElementById('notificationMessage');
const closeNotificationBtn = document.getElementById('closeNotificationBtn');
const modalOverlay = document.getElementById('modalOverlay');
const createNameInput = document.getElementById('createNameInput');
const joinNameInput = document.getElementById('joinNameInput');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const confirmCreateBtn = document.getElementById('confirmCreateBtn');
const cancelJoinBtn = document.getElementById('cancelJoinBtn');
const confirmJoinBtn = document.getElementById('confirmJoinBtn');

// Configuração do ambiente
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SERVER_URL = isDev ? 'http://localhost:3000' : 'https://planin-back.onrender.com';

// Configurações PeerJS
const peerOptions = isDev 
  ? {
      host: 'localhost',
      port: 3000,
      path: '/peerjs',
      secure: false,
      debug: 1,
      key: 'peerjs',
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    } 
  : {
      host: 'planin-back.onrender.com',
      path: '/peerjs',
      secure: true,
      debug: 1,
      key: 'peerjs',
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    };

// Configurações de fallback (usa o servidor cloud do PeerJS)
const fallbackOptions = { debug: 0 };

// Funções de UI
function showModal(modal) {
  modal.style.display = 'block';
  modalOverlay.style.display = 'block';
}

function hideModal(modal) {
  modal.style.display = 'none';
  modalOverlay.style.display = 'none';
}

function showNotification(message) {
  notificationMessage.textContent = message;
  showModal(notificationModal);
}

function resetInterface() {
  connectionArea.style.display = 'none';
  roomIdSection.style.display = 'none';
  createRoomSection.style.display = 'block';
  createBtn.style.display = 'block';
  joinRoomSection.style.display = 'block';
  roomList.style.display = 'none';
  joinIdInput.value = '';
  votesEl.innerHTML = '';
  usersList.innerHTML = '';
  connectedUsers = [];
  userName = '';
  createNameInput.value = '';
  joinNameInput.value = '';
  valuesHidden = true;
  toggleBtnText.textContent = 'Mostrar Valores';
}

function setupCreatorInterface() {
  connectionArea.style.display = 'block';
  roomIdSection.style.display = 'block';
  createRoomSection.style.display = 'block';
  joinRoomSection.style.display = 'none';
  roomList.style.display = 'none';
  createBtn.style.display = 'none';
  
  // Adicionar o próprio usuário à lista
  addUserToList(userName, true);
}

function setupJoinerInterface() {
  connectionArea.style.display = 'block';
  roomIdSection.style.display = 'none';
  createRoomSection.style.display = 'none';
  joinRoomSection.style.display = 'none';
  roomList.style.display = 'none';
  
  // Adicionar o próprio usuário à lista
  addUserToList(userName, true);
}

function showVote(name, vote) {
  // Sanitizar o nome e o voto
  const sanitizedName = validateUserName(name);
  const sanitizedVote = typeof vote === 'string' ? 
    validateUserName(vote) : 
    String(vote);
  
  // Verificar se já existe uma votação deste usuário
  const existingVoteEl = document.querySelector(`.vote[data-user="${sanitizedName}"]`);
  
  if (existingVoteEl) {
    // Atualiza o voto existente
    const voteValueEl = existingVoteEl.querySelector('.vote-value');
    voteValueEl.textContent = sanitizedVote;
    
    // Aplicar efeito de destaque (apenas piscar)
    existingVoteEl.classList.add('updated');
    setTimeout(() => {
      existingVoteEl.classList.remove('updated');
    }, 1000);
  } else {
    // Criar novo elemento de voto
    const voteElement = document.createElement('div');
    voteElement.className = 'vote new-vote'; // Adiciona classe para animação de entrada
    voteElement.setAttribute('data-user', sanitizedName);
    
    if (valuesHidden) {
      voteElement.classList.add('hidden-value');
    }
    
    const nameElement = document.createElement('span');
    nameElement.className = 'vote-name';
    nameElement.textContent = sanitizedName;
    
    const valueElement = document.createElement('span');
    valueElement.className = 'vote-value';
    
    // Formatar o valor para garantir que o tamanho não varie muito
    valueElement.textContent = sanitizedVote;
    
    voteElement.appendChild(nameElement);
    voteElement.appendChild(valueElement);
    
    votesEl.appendChild(voteElement);
    
    // Remover a classe new-vote após a animação ser concluída
    setTimeout(() => {
      voteElement.classList.remove('new-vote');
    }, 500); // 500ms é suficiente para uma animação de 300ms
  }
}

// Função para adicionar um usuário à lista
function addUserToList(name, isCurrentUser = false) {
  // Sanitizar o nome do usuário antes de adicionar à lista
  const sanitizedName = validateUserName(name);
  
  // Verificar se o usuário já está na lista
  if (!connectedUsers.includes(sanitizedName)) {
    connectedUsers.push(sanitizedName);
    
    // Atualizar a UI
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    if (isCurrentUser) {
      userItem.classList.add('current-user');
    }
    
    const userIcon = document.createElement('img');
    userIcon.className = 'user-icon';
    userIcon.src = 'images/user-icon.svg';
    userItem.appendChild(userIcon);
    
    const userName = document.createElement('span');
    userName.textContent = sanitizedName; // Usar o nome sanitizado
    userItem.appendChild(userName);
    
    usersList.appendChild(userItem);
  }
}

// Função para enviar lista de usuários para um novo participante
function sendUsersList(connection) {
  const userListData = {
    type: 'user_list',
    users: connectedUsers
  };
  connection.send(userListData);
}

// Função para enviar histórico de votos para um novo participante
function sendVotesHistory(connection) {
  const votes = votesEl.querySelectorAll('.vote');
  
  votes.forEach(vote => {
    const voteData = {
      type: 'vote',
      name: vote.getAttribute('data-user'),
      vote: vote.querySelector('.vote-value').textContent
    };
    connection.send(voteData);
  });

  // Enviando o estado atual de visibilidade dos valores
  connection.send({
    type: 'values_visibility',
    hidden: valuesHidden
  });
}

// Função para alternar a visibilidade dos valores
function toggleValuesVisibility() {
  // Inverte o estado atual
  valuesHidden = !valuesHidden;
  
  // Atualiza o texto do botão
  toggleBtnText.textContent = valuesHidden ? 'Mostrar Valores' : 'Esconder Valores';
  
  const voteValues = document.querySelectorAll('.vote-value');
  
  // Aplica a animação a todos os elementos
  voteValues.forEach(voteValue => {
    // Adiciona a classe de animação
    voteValue.classList.add('flipping');
    
    // No meio da animação (quando a carta está de lado), muda a visibilidade
    setTimeout(() => {
      if (valuesHidden) {
        voteValue.closest('.vote').classList.add('hidden-value');
      } else {
        voteValue.closest('.vote').classList.remove('hidden-value');
      }
    }, 250); // Metade do tempo da animação (0.5s = 500ms)
    
    // Remove a classe de animação após a conclusão
    setTimeout(() => {
      voteValue.classList.remove('flipping');
    }, 500);
  });
  
  // Notificar outros usuários sobre a mudança
  const visibilityData = {
    type: 'values_visibility',
    hidden: valuesHidden
  };
  
  if (conn && conn.open) {
    conn.send(visibilityData);
  } else if (connections.length > 0) {
    connections.forEach(c => {
      if (c.open) c.send(visibilityData);
    });
  }
}

function updateServerStatus(isOnline, usesFallback = false) {
  if (isOnline && !usesFallback) {
    serverStatus.textContent = 'Servidor online';
    serverStatus.style.color = 'green';
  } else if (usesFallback) {
    serverStatus.textContent = 'Usando servidor cloud (fallback)';
    serverStatus.style.color = 'orange';
  } else {
    serverStatus.textContent = 'Servidor offline';
    serverStatus.style.color = 'red';
  }
}

function displayErrorMessage(message) {
  showNotification(message);
}

function switchToFallbackServer(callback) {
  useCustomServer = false;
  updateServerStatus(true, true);
  setTimeout(() => callback(), 500);
}

function handleConnectionError(err, isCreatingRoom = false) {
  let errorMsg;
  
  // Tentar fallback se necessário
  if (useCustomServer && (err.message.includes('Invalid key') || err.message.includes('Could not connect'))) {
    switchToFallbackServer(isCreatingRoom ? createRoom : () => joinRoom(roomIdToJoin));
    return;
  }
  
  // Determinar mensagem de erro
  if (err.type === 'peer-unavailable') {
    errorMsg = 'Sala não encontrada ou inativa. Verifique o ID e tente novamente.';
  } else if (err.message.includes('Invalid key')) {
    errorMsg = 'Erro de configuração: chave inválida. Por favor, recarregue a página e tente novamente.';
  } else if (err.message.includes('Could not connect')) {
    errorMsg = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
  } else {
    errorMsg = `Erro: ${err.message}`;
  }
  
  displayErrorMessage(errorMsg);
  resetInterface();
}

// Funções de salas e conexão
function createRoom() {
  if (peer) {
    peer.destroy();
  }
  
  // Tenta usar o servidor personalizado primeiro
  try {
    const currentOptions = useCustomServer ? peerOptions : fallbackOptions;
    
    // Adicionar um log para debug em produção
    console.log("Criando peer com opções:", JSON.stringify(currentOptions));
    
    peer = new Peer(undefined, currentOptions);
    
    peer.on('open', id => {
      currentRoomId = id;
      roomIdDisplay.textContent = id;
      setupCreatorInterface();
    });

    peer.on('connection', incoming => {
      connections.push(incoming);

      incoming.on('open', () => {
        // Enviar a lista atual de usuários para o novo participante
        sendUsersList(incoming);
        
        // Enviar o histórico de votos atual
        sendVotesHistory(incoming);
      });

      incoming.on('data', data => {
        // Processar dados recebidos com base no tipo
        if (data.type === 'vote') {
          showVote(data.name, data.vote);
          // Retransmitir para outros clientes
          connections.forEach(c => {
            if (c !== incoming && c.open) c.send(data);
          });
        } 
        else if (data.type === 'user_joined') {
          // Adicionar o novo usuário à lista
          addUserToList(data.name);
          
          // Notificar outros usuários sobre o novo participante
          const userJoinedData = {
            type: 'user_joined',
            name: data.name
          };
          
          connections.forEach(c => {
            if (c !== incoming && c.open) c.send(userJoinedData);
          });
        }
        else if (data.type === 'reset_votes') {
          // Resetar todas as estimativas para zero
          connectedUsers.forEach(user => {
            showVote(user, "0");
          });
          
          // Retransmitir para outros clientes
          connections.forEach(c => {
            if (c !== incoming && c.open) c.send(data);
          });
        }
        else if (data.type === 'values_visibility') {
          // Atualizar visibilidade dos valores
          valuesHidden = data.hidden;
          
          // Atualizar o texto do botão
          toggleBtnText.textContent = valuesHidden ? 'Mostrar' : 'Esconder';
          
          const voteValues = document.querySelectorAll('.vote-value');
          
          // Aplica a animação a todos os elementos
          voteValues.forEach(voteValue => {
            // Adiciona a classe de animação
            voteValue.classList.add('flipping');
            
            // No meio da animação (quando a carta está de lado), muda a visibilidade
            setTimeout(() => {
              if (valuesHidden) {
                voteValue.closest('.vote').classList.add('hidden-value');
              } else {
                voteValue.closest('.vote').classList.remove('hidden-value');
              }
            }, 250); // Metade do tempo da animação (0.5s = 500ms)
            
            // Remove a classe de animação após a conclusão
            setTimeout(() => {
              voteValue.classList.remove('flipping');
            }, 500);
          });
          
          // Retransmitir para outros clientes
          connections.forEach(c => {
            if (c !== incoming && c.open) c.send(data);
          });
        }
        else if (typeof data === 'object' && data.name && data.vote) {
          // Para compatibilidade com versões anteriores
          showVote(data.name, data.vote);
          connections.forEach(c => {
            if (c !== incoming && c.open) c.send(data);
          });
        }
      });
      
      incoming.on('close', () => {
        // Remover a conexão da lista
        const index = connections.indexOf(incoming);
        if (index !== -1) {
          connections.splice(index, 1);
        }
      });
    });
    
    peer.on('error', err => {
      console.error("Erro de peer:", err.type, err.message);
      handleConnectionError(err, true);
    });
  } catch (err) {
    console.error("Erro ao criar peer:", err);
    
    // Tentar fallback automático
    if (useCustomServer) {
      console.log("Tentando fallback automático...");
      useCustomServer = false;
      setTimeout(() => createRoom(), 500);
    } else {
      displayErrorMessage(`Erro ao conectar: ${err.message || 'Desconhecido'}`);
      resetInterface();
    }
  }
}

function joinRoom(roomId) {
  if (!roomId) return;
  
  if (peer) {
    peer.destroy();
  }

  const currentOptions = useCustomServer ? peerOptions : fallbackOptions;
  peer = new Peer(undefined, currentOptions);
  
  peer.on('error', err => handleConnectionError(err, false));
  
  peer.on('open', () => {
    try {
      conn = peer.connect(roomId, { reliable: true });
      
      conn.on('error', err => {
        displayErrorMessage(`Erro na conexão: ${err.message}`);
        resetInterface();
      });

      conn.on('open', () => {
        setupJoinerInterface();
        
        // Notificar que entrou
        const joinData = {
          type: 'user_joined',
          name: userName
        };
        conn.send(joinData);
        
        conn.on('data', data => {
          // Processar dados recebidos com base no tipo
          if (data.type === 'user_list') {
            // Receber lista de usuários existentes
            data.users.forEach(user => {
              addUserToList(user, user === userName);
            });
          }
          else if (data.type === 'user_joined') {
            // Adicionar novo usuário à lista
            addUserToList(data.name);
          }
          else if (data.type === 'vote') {
            showVote(data.name, data.vote);
          }
          else if (data.type === 'reset_votes') {
            // Resetar todas as estimativas para zero
            connectedUsers.forEach(user => {
              showVote(user, "0");
            });
          }
          else if (data.type === 'values_visibility') {
            // Atualizar visibilidade dos valores
            valuesHidden = data.hidden;
            
            // Atualizar o texto do botão
            toggleBtnText.textContent = valuesHidden ? 'Mostrar Valores' : 'Esconder Valores';
            
            const voteValues = document.querySelectorAll('.vote-value');
            
            // Aplica a animação a todos os elementos
            voteValues.forEach(voteValue => {
              // Adiciona a classe de animação
              voteValue.classList.add('flipping');
              
              // No meio da animação (quando a carta está de lado), muda a visibilidade
              setTimeout(() => {
                if (valuesHidden) {
                  voteValue.closest('.vote').classList.add('hidden-value');
                } else {
                  voteValue.closest('.vote').classList.remove('hidden-value');
                }
              }, 250); // Metade do tempo da animação (0.5s = 500ms)
              
              // Remove a classe de animação após a conclusão
              setTimeout(() => {
                voteValue.classList.remove('flipping');
              }, 500);
            });
          }
          else if (typeof data === 'object' && data.name && data.vote) {
            // Para compatibilidade com versões anteriores
            showVote(data.name, data.vote);
          }
        });
      });
      
      conn.on('close', () => {
        displayErrorMessage('O host encerrou a conexão');
        resetInterface();
      });
      
      // Definir um timeout para verificar se a conexão foi estabelecida
      setTimeout(() => {
        if (conn && !conn.open && connectionArea.style.display !== 'block') {
          displayErrorMessage('Não foi possível conectar à sala. Tente novamente.');
          resetInterface();
        }
      }, 10000);
    } catch (e) {
      displayErrorMessage(`Erro ao tentar conectar: ${e.message}`);
      resetInterface();
    }
  });
}

function checkServerStatus() {
  serverStatus.textContent = 'Verificando servidor...';
  
  fetch(SERVER_URL)
    .then(response => {
      if (response.ok) {
        updateServerStatus(true);
        useCustomServer = true;
        return true;
      } else {
        throw new Error('Servidor não está respondendo corretamente');
      }
    })
    .catch(() => {
      updateServerStatus(false, true);
      useCustomServer = false;
      return false;
    });
}

function checkAvailableRooms() {
  if (!useCustomServer) {
    displayErrorMessage('Verificação de salas não disponível no modo fallback.');
    return;
  }
  
  fetch(`${SERVER_URL}/peers`)
    .then(response => {
      if (response.ok) return response.json();
      throw new Error('Não foi possível obter a lista de salas');
    })
    .then(data => {
      availableRooms.innerHTML = '';
      
      if (data.active && data.active.length > 0) {
        data.active.forEach(peerId => {
          const li = document.createElement('li');
          li.textContent = peerId;
          li.onclick = () => {
            joinIdInput.value = peerId;
          };
          li.style.cursor = 'pointer';
          availableRooms.appendChild(li);
        });
        roomList.style.display = 'block';
      } else {
        const li = document.createElement('li');
        li.textContent = 'Nenhuma sala disponível no momento';
        availableRooms.appendChild(li);
        roomList.style.display = 'block';
      }
    })
    .catch(() => {
      displayErrorMessage('Erro ao verificar salas disponíveis');
    });
}

// Função para buscar o número atual de visitantes
function fetchVisitorCount() {
  fetch(`${SERVER_URL}/visitor-count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': window.location.origin
    },
    mode: 'cors',
    credentials: 'same-origin'
  })
    .then(response => {
      if (response.ok) return response.json();
      throw new Error('Não foi possível obter contagem de visitantes');
    })
    .then(data => {
      // Atualizar o contador de visitantes na UI
      if (data.totalVisits && visitorCounterEl) {
        // Formatar o número com zeros à esquerda para 7 dígitos
        const formattedCount = String(data.totalVisits).padStart(7, '0');
        visitorCounterEl.textContent = `Visitantes: ${formattedCount}`;
      }
    })
    .catch(error => {
      console.error('Erro ao buscar contagem de visitantes:', error);
      // Modo de desenvolvimento: simular contador
      if (isDev && visitorCounterEl) {
        const mockCount = String(Math.floor(Math.random() * 1000)).padStart(7, '0');
        visitorCounterEl.textContent = `Visitantes: ${mockCount} (DEV)`;
      } else {
        // Em produção, mostrar um número fixo para evitar mostrar zeros
        visitorCounterEl.textContent = `Visitantes: 0000123`;
      }
    });
}

// Função para registrar uma visita quando o usuário se junta a uma sala
function registerVisit() {
  // Verificar se já registrou uma visita nesta sessão
  if (localStorage.getItem('visitRegistered')) {
    return;
  }
  
  // Fazer uma requisição para o servidor para registrar a visita
  fetch(`${SERVER_URL}/register-visit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': window.location.origin
    },
    mode: 'cors',
    credentials: 'same-origin',
    body: JSON.stringify({ 
      timestamp: new Date().toISOString(),
      domain: window.location.hostname
    })
  })
  .then(response => {
    if (response.ok) return response.json();
    throw new Error('Não foi possível registrar visita');
  })
  .then(data => {
    // Atualizar o contador de visitantes na UI
    if (data.totalVisits && visitorCounterEl) {
      // Formatar o número com zeros à esquerda para 7 dígitos
      const formattedCount = String(data.totalVisits).padStart(7, '0');
      visitorCounterEl.textContent = `Visitantes: ${formattedCount}`;
    }
    
    // Marcar que já registrou uma visita nesta sessão
    localStorage.setItem('visitRegistered', 'true');
  })
  .catch(error => {
    console.error('Erro ao registrar visita:', error);
    // Modo de desenvolvimento: simular contador
    if (isDev && visitorCounterEl) {
      const mockCount = String(Math.floor(Math.random() * 1000)).padStart(7, '0');
      visitorCounterEl.textContent = `Visitantes: ${mockCount} (DEV)`;
    } else {
      // Em produção, atualizar para um número fixo
      visitorCounterEl.textContent = `Visitantes: 0000123`;
    }
  });
}

// Event listeners para os modais
cancelCreateBtn.addEventListener('click', () => hideModal(createNameModal));
cancelJoinBtn.addEventListener('click', () => hideModal(joinNameModal));
closeNotificationBtn.addEventListener('click', () => hideModal(notificationModal));

// Função para validar e sanitizar entradas do usuário
function validateUserName(name) {
  if (!name) return '';
  
  // Limitar a 30 caracteres
  let sanitizedName = name.trim().substring(0, 30);
  
  // Escapar caracteres especiais para prevenir XSS
  sanitizedName = sanitizedName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
    
  return sanitizedName;
}

confirmCreateBtn.addEventListener('click', () => {
  const inputName = createNameInput.value.trim();
  if (!inputName) {
    displayErrorMessage('Por favor, insira seu nome.');
    return;
  }
  
  // Validar e sanitizar o nome do usuário
  const sanitizedName = validateUserName(inputName);
  if (sanitizedName !== inputName) {
    createNameInput.value = sanitizedName;
    if (sanitizedName.length < inputName.length) {
      displayErrorMessage('Seu nome foi ajustado para o limite máximo de 30 caracteres.');
    }
  }
  
  userName = sanitizedName;
  hideModal(createNameModal);
  createRoom();
  registerVisit(); // Registrar visita quando criar uma sala
});

confirmJoinBtn.addEventListener('click', () => {
  const inputName = joinNameInput.value.trim();
  if (!inputName) {
    displayErrorMessage('Por favor, insira seu nome.');
    return;
  }
  
  // Validar e sanitizar o nome do usuário
  const sanitizedName = validateUserName(inputName);
  if (sanitizedName !== inputName) {
    joinNameInput.value = sanitizedName;
    if (sanitizedName.length < inputName.length) {
      displayErrorMessage('Seu nome foi ajustado para o limite máximo de 30 caracteres.');
    }
  }
  
  userName = sanitizedName;
  hideModal(joinNameModal);
  joinRoom(roomIdToJoin);
  registerVisit(); // Registrar visita quando entrar em uma sala
});

// Configurar o botão de copiar
copyBtn.addEventListener('click', () => {
  if (currentRoomId) {
    navigator.clipboard.writeText(currentRoomId)
      .then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      })
      .catch(() => {
        displayErrorMessage('Não foi possível copiar o ID. Por favor, selecione e copie manualmente.');
      });
  }
});

// Botão de criar sala abre o modal
createBtn.onclick = () => {
  createNameInput.value = userName || '';
  showModal(createNameModal);
};

// Botão de entrar
joinBtn.onclick = () => {
  roomIdToJoin = joinIdInput.value.trim();
  if (!roomIdToJoin) {
    displayErrorMessage('Insira um ID de sala');
    return;
  }
  
  joinNameInput.value = userName || '';
  showModal(joinNameModal);
};

// Botão de verificar salas
checkRoomsBtn.onclick = checkAvailableRooms;

// Botão de toggle para mostrar/esconder valores
toggleValuesBtn.onclick = toggleValuesVisibility;
resetVotesBtn.onclick = resetVotes;

// Configurar botões de votação
voteBtns.forEach(btn => {
  btn.onclick = () => {
    const vote = btn.dataset.value;
    showVote(userName, vote);
    
    const voteData = { 
      type: 'vote',
      name: userName, 
      vote: vote 
    };
    
    if (conn && conn.open) {
      conn.send(voteData);
    } else if (connections.length > 0) {
      connections.forEach(c => {
        if (c.open) c.send(voteData);
      });
    }
  };
});

// Função para resetar todas as estimativas para zero
function resetVotes() {
  // Para cada usuário conectado, definir voto como "0"
  connectedUsers.forEach(user => {
    showVote(user, "0");
  });
  
  // Notificar outros usuários sobre o reset
  const resetData = {
    type: 'reset_votes'
  };
  
  if (conn && conn.open) {
    conn.send(resetData);
  } else if (connections.length > 0) {
    connections.forEach(c => {
      if (c.open) c.send(resetData);
    });
  }
}

// Inicialização
resetInterface();
checkServerStatus();
fetchVisitorCount(); // Buscar a contagem atual de visitantes ao carregar a página
