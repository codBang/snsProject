const express = require('express');
const {
  createPost,
  getAllPosts,
  getUserPosts,
  likePost,
  viewPost,
  addComment,
  getCommentsByPostId,
  deletePost, // deletePost 가져오기
  updatePost,
} = require('../controllers/postController');

const authenticateToken = require('../middlewares/authenticate');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post('/', authenticateToken, upload.single('image'), createPost);
router.get('/', getAllPosts);
router.get('/user/:userId', getUserPosts);
router.post('/:postId/like', authenticateToken, likePost);
router.get('/:postId', viewPost);
router.post('/:postId/comments', authenticateToken, addComment);
router.get('/:postId/comments', authenticateToken, getCommentsByPostId);
router.delete('/:postId', authenticateToken, deletePost); // deletePost 사용
router.put('/:postId', authenticateToken, upload.single('image'), updatePost);

module.exports = router;
