// Estado da aplicação
let peer, conn;
let currentRoomId = null;
let userName = '';
let roomIdToJoin = '';
let connections = [];
let useCustomServer = true; // Começa tentando usar o servidor customizado

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
      debug: 0,
      key: 'peerjs'
    } 
  : {
      host: 'planin-back.onrender.com',
      path: '/peerjs',
      secure: true,
      debug: 0,
      key: 'peerjs'
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
  userName = '';
  createNameInput.value = '';
  joinNameInput.value = '';
}

function setupCreatorInterface() {
  connectionArea.style.display = 'block';
  roomIdSection.style.display = 'block';
  createRoomSection.style.display = 'block';
  joinRoomSection.style.display = 'none';
  roomList.style.display = 'none';
  createBtn.style.display = 'none';
}

function setupJoinerInterface() {
  connectionArea.style.display = 'block';
  roomIdSection.style.display = 'none';
  createRoomSection.style.display = 'none';
  joinRoomSection.style.display = 'none';
  roomList.style.display = 'none';
}

function showVote(name, vote) {
  const voteElement = document.createElement('div');
  voteElement.className = 'vote';
  voteElement.textContent = `${name}: ${vote}`;
  votesEl.appendChild(voteElement);
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
  
  const currentOptions = useCustomServer ? peerOptions : fallbackOptions;
  peer = new Peer(undefined, currentOptions);
  
  peer.on('open', id => {
    currentRoomId = id;
    roomIdDisplay.textContent = id;
    setupCreatorInterface();
  });

  peer.on('connection', incoming => {
    connections.push(incoming);

    incoming.on('data', data => {
      showVote(data.name, data.vote);
      connections.forEach(c => {
        if (c !== incoming && c.open) c.send(data);
      });
    });
  });
  
  peer.on('error', err => handleConnectionError(err, true));
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
        
        conn.on('data', data => {
          showVote(data.name, data.vote);
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

// Event listeners para os modais
cancelCreateBtn.addEventListener('click', () => hideModal(createNameModal));
cancelJoinBtn.addEventListener('click', () => hideModal(joinNameModal));
closeNotificationBtn.addEventListener('click', () => hideModal(notificationModal));

confirmCreateBtn.addEventListener('click', () => {
  const name = createNameInput.value.trim();
  if (!name) {
    displayErrorMessage('Por favor, insira seu nome.');
    return;
  }
  userName = name;
  hideModal(createNameModal);
  createRoom();
});

confirmJoinBtn.addEventListener('click', () => {
  const name = joinNameInput.value.trim();
  if (!name) {
    displayErrorMessage('Por favor, insira seu nome.');
    return;
  }
  userName = name;
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

// Configurar botões de votação
voteBtns.forEach(btn => {
  btn.onclick = () => {
    const vote = btn.dataset.value;
    showVote(userName, vote);
    
    const voteData = { name: userName, vote };
    
    if (conn && conn.open) {
      conn.send(voteData);
    } else if (connections.length > 0) {
      connections.forEach(c => {
        if (c.open) c.send(voteData);
      });
    }
  };
});

// Inicialização
resetInterface();
checkServerStatus();
