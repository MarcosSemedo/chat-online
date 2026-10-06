const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Lista de usuários online
const users = new Map(); // socket.id -> username

io.on('connection', (socket) => {
  console.log('Novo usuário conectado:', socket.id);

  // Quando o usuário entra com um nome
  socket.on('join', (username) => {
    if (!username || username.trim() === '') {
      socket.emit('error', 'Nome de usuário inválido');
      return;
    }

    const cleanName = username.trim().substring(0, 20);
    users.set(socket.id, cleanName);

    // Avisa todo mundo que alguém entrou
    socket.broadcast.emit('user-joined', cleanName);
    
    // Envia a lista atualizada de usuários
    io.emit('users-list', Array.from(users.values()));

    // Confirma pro usuário que ele entrou
    socket.emit('joined', cleanName);
    
    console.log(`${cleanName} entrou no chat`);
  });

  // Quando alguém manda mensagem
  socket.on('chat-message', (msg) => {
    const username = users.get(socket.id);
    if (!username) return;

    const messageData = {
      username,
      message: msg.trim().substring(0, 500), // limite de caracteres
      time: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    // Envia a mensagem para todos (incluindo quem mandou)
    io.emit('chat-message', messageData);
  });

  // Quando o usuário desconecta
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      socket.broadcast.emit('user-left', username);
      io.emit('users-list', Array.from(users.values()));
      console.log(`${username} saiu do chat`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log('Abra o navegador e compartilhe o link com amigos na mesma rede!');
});
