const socket = io();

// Elementos
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesDiv = document.getElementById('messages');
const usersList = document.getElementById('users-list');
const onlineCount = document.getElementById('online-count');
const leaveBtn = document.getElementById('leave-btn');

let myUsername = '';

// Entrar no chat
function joinChat() {
  const username = usernameInput.value.trim();
  if (!username) {
    usernameInput.focus();
    return;
  }
  socket.emit('join', username);
}

joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinChat();
});

// Confirmação de entrada
socket.on('joined', (username) => {
  myUsername = username;
  loginScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  messageInput.focus();
  
  addSystemMessage(`Você entrou como ${username}`);
});

// Enviar mensagem
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  
  socket.emit('chat-message', text);
  messageInput.value = '';
  messageInput.focus();
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Receber mensagem
socket.on('chat-message', (data) => {
  const isMine = data.username === myUsername;
  addMessage(data, isMine);
});

// Usuário entrou
socket.on('user-joined', (username) => {
  addSystemMessage(`${username} entrou no chat`);
});

// Usuário saiu
socket.on('user-left', (username) => {
  addSystemMessage(`${username} saiu do chat`);
});

// Atualizar lista de usuários
socket.on('users-list', (users) => {
  usersList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user === myUsername ? `${user} (você)` : user;
    usersList.appendChild(li);
  });
  onlineCount.textContent = `${users.length} online`;
});

// Erro
socket.on('error', (msg) => {
  alert(msg);
});

// Funções auxiliares
function addMessage(data, isMine) {
  const div = document.createElement('div');
  div.className = `message ${isMine ? 'mine' : 'other'}`;
  
  div.innerHTML = `
    <div class="username">${data.username}</div>
    <div class="text">${escapeHtml(data.message)}</div>
    <div class="time">${data.time}</div>
  `;
  
  messagesDiv.appendChild(div);
  scrollToBottom();
}

function addSystemMessage(text) {
  const div = document.createElement('div');
  div.className = 'system-message';
  div.textContent = text;
  messagesDiv.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Sair
leaveBtn.addEventListener('click', () => {
  if (confirm('Deseja sair do chat?')) {
    location.reload();
  }
});

// Foco automático
usernameInput.focus();
