const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const errorHandler = require('./middlewares/errorHandler');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = process.env.PORT || 3000;
// HTTP 서버와 Socket.io 설정
const server = http.createServer(app);
const io = socketIo(server); // Socket.io를 HTTP 서버에 연결

app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect('mongodb://localhost:27017/snsdb', {})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB...', err));

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // 댓글이 추가될 때 알림 이벤트 전송
  socket.on('new_comment', (data) => {
    io.emit('receive_comment', data); // 모든 클라이언트에게 새로운 댓글 알림 전송
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);

// 에러 핸들러 미들웨어 추가 (항상 라우트 정의 후에 추가)
app.use(errorHandler);

module.exports = app;
