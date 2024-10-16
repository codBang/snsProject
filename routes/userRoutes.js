const express = require('express');
const {
  registerUser,
  loginUser,
  updateProfile,
  getProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} = require('../controllers/userController');
const authenticateToken = require('../middlewares/authenticate');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put(
  '/profile',
  authenticateToken,
  upload.single('profileImage'),
  updateProfile
);
router.get('/profile/:userId', getProfile);
router.post('/follow/:userId', authenticateToken, followUser);
router.post('/unfollow/:userId', authenticateToken, unfollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

module.exports = router;
