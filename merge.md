index.js:
```js
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

```

userRoutes.js:
```js
const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const router = express.Router();

router.post('/', registerUser);
router.post('/login', loginUser);

module.exports = router;

```

authenticate.js:
```js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).send('Access denied. No token provided.');

  jwt.verify(token, process.env.JWT_SECRET || 'secretKey', (err, user) => {
    if (err) return res.status(403).send('Invalid token.');
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;

```

user.js:
```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  bio: { type: String },
});

module.exports = mongoose.model('User', userSchema);

```

post.js:
```js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  image: { type: String },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Post', postSchema);

```

userModel.js:
```js
// models/userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  bio: { type: String },
});

module.exports = mongoose.model('User', userSchema);

```

comment.js:
```js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Comment', commentSchema);

```

postRoutes.test.js:
```js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Post = require('../models/Post');

let token;

beforeAll(async () => {
  // MongoDB 연결
  await mongoose.connect('mongodb://localhost:27017/snsdb_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  // 테스트 후 데이터베이스 정리 및 연결 종료
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('User API Tests', () => {
  test('POST /users - 사용자 추가', async () => {
    const newUser = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'testpassword',
    };

    const res = await request(app).post('/users').send(newUser);

    // 응답 메시지를 콘솔에 출력하여 문제 확인
    if (res.statusCode !== 201) {
      console.error('응답 메시지:', res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
  });

  test('POST /users/login - 사용자 로그인', async () => {
    const loginData = {
      email: 'testuser@example.com',
      password: 'testpassword',
    };

    const res = await request(app).post('/users/login').send(loginData);

    // 응답 메시지를 콘솔에 출력하여 문제 확인
    if (res.statusCode !== 200) {
      console.error('응답 메시지:', res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });
});

describe('Post API Tests', () => {
  test('POST /posts - 게시글 추가', async () => {
    const newPost = {
      content: 'This is a test post!',
    };

    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(newPost);

    // 응답 메시지를 콘솔에 출력하여 문제 확인
    if (res.statusCode !== 201) {
      console.error('응답 메시지:', res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
  });

  test('GET /posts - 모든 게시글 조회', async () => {
    const res = await request(app).get('/posts');

    // 응답 메시지를 콘솔에 출력하여 문제 확인
    if (res.statusCode !== 200) {
      console.error('응답 메시지:', res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});

```

postController.js:
```js
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const createPost = async (req, res) => {
  try {
    const newPost = new Post({
      user: req.user._id,
      content: req.body.content,
      image: req.file ? req.file.path : req.body.imageUrl,
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('user', 'username email');
    res.json(posts);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getUserPosts = async (req, res) => {
  try {
    const userPosts = await Post.find({ user: req.params.userId }).populate(
      'user',
      'username email'
    );
    res.json(userPosts);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send('Post not found');
    if (post.likedBy.includes(req.user._id))
      return res.status(400).send('You have already liked this post');

    post.likes += 1;
    post.likedBy.push(req.user._id);
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const viewPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate(
      'user',
      'username email'
    );
    if (!post) return res.status(404).send('Post not found');

    post.views += 1;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const addComment = async (req, res) => {
  try {
    const newComment = new Comment({
      post: req.params.postId,
      user: req.user._id,
      content: req.body.content,
    });
    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send('Post not found');
    if (post.user.toString() !== req.user._id)
      return res.status(403).send('You are not authorized to delete this post');

    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).send('Post deleted successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getUserPosts,
  likePost,
  viewPost,
  addComment,
  deletePost,
};

```

userController.js:
```js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      profilePicture: req.body.profilePicture,
      bio: req.body.bio,
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).send('Duplicate key error: Email already exists');
    } else {
      res.status(400).send(error.message);
    }
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Invalid email or password');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).send('Invalid email or password');

    const token = jwt.sign(
      { _id: user._id, username: user.username },
      'secretKey'
    );
    res.json({ token });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = { registerUser, loginUser };

```

postRoutes.js:
```js
const express = require('express');
const {
  createPost,
  getAllPosts,
  getUserPosts,
  likePost,
  viewPost,
  addComment,
  deletePost,
} = require('../controllers/postController');
const authenticateToken = require('../middlewares/authenticate');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', authenticateToken, upload.single('image'), createPost);
router.get('/', getAllPosts);
router.get('/user/:userId', getUserPosts);
router.post('/:postId/like', authenticateToken, likePost);
router.get('/:postId', viewPost);
router.post('/:postId/comments', authenticateToken, addComment);
router.delete('/:postId', authenticateToken, deletePost);

module.exports = router;

```

