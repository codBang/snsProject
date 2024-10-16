const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const errorHandler = require('./middlewares/errorHandler');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/snsdb', {});
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Could not connect to MongoDB...', err);
    process.exit(1);
  }
};

const closeDB = async () => {
  await mongoose.connection.close();
  console.log('Disconnected from MongoDB');
};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('new_comment', (data) => {
    io.emit('receive_comment', data);
  });

  socket.on('disconnect', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('Client disconnected:', socket.id);
    }
  });
});

app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  connectDB();
}

module.exports = { app, server, io, connectDB, closeDB };
