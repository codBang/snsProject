const express = require('express');
const {
  createPost,
  getAllPosts,
  getUserPosts,
  likePost,
  viewPost,
  addComment,
  getCommentsByPostId, // 추가
  deletePost,
  updatePost,
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
router.get('/:postId/comments', authenticateToken, getCommentsByPostId); // 댓글 조회 라우트 추가
router.delete('/:postId', authenticateToken, deletePost);
router.put('/:postId', authenticateToken, upload.single('image'), updatePost);

module.exports = router;
