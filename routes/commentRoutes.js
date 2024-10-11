const express = require('express');
const { likeComment, addReply } = require('../controllers/commentController');
const authenticateToken = require('../middlewares/authenticate');

const router = express.Router();

router.post('/:commentId/like', authenticateToken, likeComment);
router.post('/:commentId/reply', authenticateToken, addReply);

module.exports = router;
