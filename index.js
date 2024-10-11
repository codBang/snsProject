const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();
const port = process.env.PORT || 3000;

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

// Use routes
app.use('/users', userRoutes);
app.use('/posts', postRoutes);

module.exports = app;
