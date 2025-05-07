// Estado da aplicação
let peer, conn;
let currentRoomId = null;
let userName = '';
let roomIdToJoin = '';
let connections = [];
let useCustomServer = true; // Começa tentando usar o servidor customizado
let connectedUsers = []; // Lista de usuários conectados
let valuesHidden = true; // Por padrão, valores começam escondidos
let darkModeActive = false; // Estado do modo escuro

// Elementos da UI
const votesEl = document.getElementById('votes');
const connectionArea = document.getElementById('connectionArea');
const serverStatus = document.getElementById('serverStatus');


const roomIdSection = document.getElementById('roomIdSection');
const roomIdDisplay = document.getElementById('roomIdDisplay');
const copyBtn = document.getElementById('copyBtn');
const createRoomSection = document.getElementById('createRoomSection');
const joinRoomSection = document.getElementById('joinRoomSection');
const joinIdInput = document.getElementById('joinId');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');

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

// Seletores de idioma
const ptBtn = document.getElementById('pt-btn');
const enBtn = document.getElementById('en-btn');

// Botão de modo escuro
const darkModeBtn = document.getElementById('dark-mode-toggle');

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
  joinIdInput.value = '';
  votesEl.innerHTML = '';
  usersList.innerHTML = '';
  connectedUsers = [];
  userName = '';
  createNameInput.value = '';
  joinNameInput.value = '';
  valuesHidden = true;
  toggleBtnText.textContent = 'Mostrar Valores';
  
  // Desabilitar o botão de criar sala até que o servidor seja verificado
  createBtn.disabled = true;
  createBtn.classList.add('loading');
}

function setupCreatorInterface() {
  connectionArea.style.display = 'block';
  roomIdSection.style.display = 'block';
  createRoomSection.style.display = 'block';
  joinRoomSection.style.display = 'none';
  createBtn.style.display = 'none';
  
  // Adicionar o próprio usuário à lista
  addUserToList(userName, true);
}

function setupJoinerInterface() {
  connectionArea.style.display = 'block';
  roomIdSection.style.display = 'none';
  createRoomSection.style.display = 'none';
  joinRoomSection.style.display = 'none';
  
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
  toggleBtnText.textContent = valuesHidden ? translate('show') : translate('hide');
  
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
    serverStatus.textContent = translate('serverOnline');
    serverStatus.style.color = 'green';
    // Habilitar o botão de criar sala quando o servidor estiver online
    createBtn.disabled = false;
    createBtn.classList.remove('loading');
  } else if (usesFallback) {
    serverStatus.textContent = translate('usingFallbackServer');
    serverStatus.style.color = 'orange';
    // Habilitar o botão mesmo no fallback
    createBtn.disabled = false;
    createBtn.classList.remove('loading');
  } else {
    serverStatus.textContent = translate('serverOffline');
    serverStatus.style.color = 'red';
    // Manter o botão desabilitado se o servidor estiver offline
    createBtn.disabled = true;
    createBtn.classList.remove('loading');
  }
}

function displayErrorMessage(message) {
  notificationMessage.textContent = message;
  showModal(notificationModal);
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
    errorMsg = translate('roomNotFound');
  } else if (err.message.includes('Invalid key')) {
    errorMsg = translate('configError');
  } else if (err.message.includes('Could not connect')) {
    errorMsg = translate('connectionError');
  } else {
    errorMsg = `Erro: ${err.message}`;
  }
  
  displayErrorMessage(errorMsg);
  resetInterface();
}

// Função para criar sala
function createRoom() {
  // Mostrar estado de loading no botão
  createBtn.disabled = true;
  createBtn.classList.add('loading');
  createBtn.innerHTML = `<img src="images/loading-icon.svg" width="14" height="14" alt="loading"> <span>${translate('creatingRoom')}</span>`;
  
  if (peer) {
    peer.destroy();
  }
  
  // Tenta usar o servidor personalizado primeiro
  try {
    const currentOptions = useCustomServer ? peerOptions : fallbackOptions;
    
    peer = new Peer(undefined, currentOptions);
    
    peer.on('open', id => {
      currentRoomId = id;
      roomIdDisplay.textContent = id;
      setupCreatorInterface();
      
      // Restaurar o botão após sucesso
      createBtn.disabled = false;
      createBtn.classList.remove('loading');
      createBtn.innerHTML = `<img src="images/create-icon.svg" width="14" height="14" alt="icon"> <span data-i18n="createRoom">${translate('createRoom')}</span>`;
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
          // Limpar todos os votos do container
          votesEl.innerHTML = '';
          
          // Retransmitir para outros clientes
          connections.forEach(c => {
            if (c !== incoming && c.open) c.send(data);
          });
        }
        else if (data.type === 'values_visibility') {
          // Atualizar visibilidade dos valores
          valuesHidden = data.hidden;
          
          // Atualizar o texto do botão
          toggleBtnText.textContent = valuesHidden ? translate('show') : translate('hide');
          
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
      // Restaurar o botão em caso de erro
      createBtn.disabled = false;
      createBtn.classList.remove('loading');
      createBtn.innerHTML = `<img src="images/create-icon.svg" width="14" height="14" alt="icon"> <span data-i18n="createRoom">${translate('createRoom')}</span>`;
      
      handleConnectionError(err, true);
    });
  } catch (err) {
    console.error("Erro ao criar peer:", err);
    
    // Restaurar o botão em caso de erro
    createBtn.disabled = false;
    createBtn.classList.remove('loading');
    createBtn.innerHTML = `<img src="images/create-icon.svg" width="14" height="14" alt="icon"> <span data-i18n="createRoom">${translate('createRoom')}</span>`;
    
    // Tentar fallback automático
    if (useCustomServer) {
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
            // Limpar todos os votos do container
            votesEl.innerHTML = '';
          }
          else if (data.type === 'values_visibility') {
            // Atualizar visibilidade dos valores
            valuesHidden = data.hidden;
            
            // Atualizar o texto do botão
            toggleBtnText.textContent = valuesHidden ? translate('show') : translate('hide');
            
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
        displayErrorMessage(translate('hostClosedConnection'));
        resetInterface();
      });
      
      // Definir um timeout para verificar se a conexão foi estabelecida
      setTimeout(() => {
        if (conn && !conn.open && connectionArea.style.display !== 'block') {
          displayErrorMessage(translate('cannotConnect'));
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
  serverStatus.textContent = translate('checkingServer');
  serverStatus.style.color = '#0000ff';
  
  // Desabilitar o botão de criar sala e adicionar classe de loading enquanto verifica
  createBtn.disabled = true;
  createBtn.classList.add('loading');
  
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

// Event listeners para os modais
cancelCreateBtn.addEventListener('click', () => {
  hideModal(createNameModal);
  // Garantir que o botão de criar sala esteja no estado normal
  createBtn.disabled = false;
  createBtn.classList.remove('loading');
  createBtn.innerHTML = `<img src="images/create-icon.svg" width="14" height="14" alt="icon"> <span data-i18n="createRoom">${translate('createRoom')}</span>`;
});
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
    displayErrorMessage(translate('pleaseEnterName'));
    return;
  }
  
  // Validar e sanitizar o nome do usuário
  const sanitizedName = validateUserName(inputName);
  if (sanitizedName !== inputName) {
    createNameInput.value = sanitizedName;
    if (sanitizedName.length < inputName.length) {
      displayErrorMessage(translate('nameTooLong'));
    }
  }
  
  userName = sanitizedName;
  hideModal(createNameModal);
  createRoom();
});

confirmJoinBtn.addEventListener('click', () => {
  const inputName = joinNameInput.value.trim();
  if (!inputName) {
    displayErrorMessage(translate('pleaseEnterName'));
    return;
  }
  
  // Validar e sanitizar o nome do usuário
  const sanitizedName = validateUserName(inputName);
  if (sanitizedName !== inputName) {
    joinNameInput.value = sanitizedName;
    if (sanitizedName.length < inputName.length) {
      displayErrorMessage(translate('nameTooLong'));
    }
  }
  
  userName = sanitizedName;
  hideModal(joinNameModal);
  joinRoom(roomIdToJoin);
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
        displayErrorMessage(translate('cannotCopyId'));
      });
  }
});

// Botão de criar sala abre o modal
createBtn.onclick = () => {
  if (createBtn.disabled) return; // Não fazer nada se o botão estiver desabilitado
  
  createNameInput.value = userName || '';
  showModal(createNameModal);
};

// Botão de entrar
joinBtn.onclick = () => {
  roomIdToJoin = joinIdInput.value.trim();
  if (!roomIdToJoin) {
    displayErrorMessage(translate('enterRoomId'));
    return;
  }
  
  joinNameInput.value = userName || '';
  showModal(joinNameModal);
};

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
  // Limpar todos os votos do container
  votesEl.innerHTML = '';
  
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

// Configurar os botões de seleção de idioma
ptBtn.addEventListener('click', () => {
  changeLanguage('pt');
  ptBtn.classList.add('active');
  enBtn.classList.remove('active');
});

enBtn.addEventListener('click', () => {
  changeLanguage('en');
  enBtn.classList.add('active');
  ptBtn.classList.remove('active');
});

// Função para tocar efeito sonoro
function playSound(soundType) {
  // Criar um elemento de áudio
  const audio = new Audio();
  
  // Configurar a fonte do áudio com base no tipo
  if (soundType === 'dark') {
    // Som para o modo escuro
    audio.src = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaGFuZyBzb3VuZCBlZmZlY3QgZm9yIGRhcmsgbW9kZQBUSVQyAAAAGAAAAFNvdW5kIEVmZmVjdCAtIERhcmsgTW9kZQBUWUVSAAAABQAAADIwMjMAVENPTgAAAAkAAABTb3VuZCBGWABQUklWAAAAOwAAAE1hcmtlcnMAEwAAABIAZQBmAGYAZQBjAHQAXwAwADIAAgED/wIBAf8=";
  }
  
  // Tocar o som
  audio.volume = 0.5; // Volume moderado
  audio.play()
    .catch(e => console.log("Erro ao reproduzir som:", e)); // Silenciar erro se o navegador bloquear
}

// Função para alternar o modo escuro
function toggleDarkMode() {
  darkModeActive = !darkModeActive;
  document.body.classList.toggle('dark-mode', darkModeActive);
  darkModeBtn.classList.toggle('active', darkModeActive);
  localStorage.setItem('darkMode', darkModeActive ? 'true' : 'false');
  
  // Tocar efeito sonoro
  playSound('dark');
}

// Inicialização
resetInterface();
checkServerStatus();

// Inicializar o sistema de tradução e configurar o idioma com base na preferência do usuário
document.addEventListener('DOMContentLoaded', () => {
  const savedLanguage = localStorage.getItem('preferredLanguage');
  
  if (savedLanguage) {
    // Atualizar a interface de seleção de idioma
    if (savedLanguage === 'en') {
      enBtn.classList.add('active');
      ptBtn.classList.remove('active');
    } else {
      ptBtn.classList.add('active');
      enBtn.classList.remove('active');
    }
    
    changeLanguage(savedLanguage);
  } else {
    // Detectar idioma do navegador
    const detectedLanguage = getBrowserLanguage();
    
    // Atualizar a interface de seleção de idioma
    if (detectedLanguage === 'en') {
      enBtn.classList.add('active');
      ptBtn.classList.remove('active');
    } else {
      ptBtn.classList.add('active');
      enBtn.classList.remove('active');
    }
    
    loadTranslation();
  }
  
  // Configurar o modo escuro com base na preferência salva
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    darkModeActive = true;
    document.body.classList.add('dark-mode');
    darkModeBtn.classList.add('active');
  }
});

// Inicializar o modo escuro
darkModeBtn.addEventListener('click', toggleDarkMode);
