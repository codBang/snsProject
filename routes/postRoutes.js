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
