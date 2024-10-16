const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// .env 파일을 불러오기 위한 dotenv 설정
require('dotenv').config();

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({
      message: '사용자 등록 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('Stored password:', user.password);
    console.log('Provided password:', password);
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword);
    if (!validPassword) {
      console.log('Invalid password');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Generated Token:', token);
    res.json({ token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { bio } = req.body;
    const profileImage = req.file ? req.file.path : undefined;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        bio,
        ...(profileImage && { profileImage }),
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json(updatedUser);
  } catch (error) {
    res
      .status(400)
      .json({ message: '프로필 업데이트 실패', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: '프로필 조회 실패', error: error.message });
  }
};

const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({ message: '이미 팔로우하고 있습니다.' });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    res.json({ message: '팔로우 성공' });
  } catch (error) {
    res.status(500).json({ message: '팔로우 실패', error: error.message });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({ message: '팔로우하고 있지 않습니다.' });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: '언팔로우 성공' });
  } catch (error) {
    res.status(500).json({ message: '언팔로우 실패', error: error.message });
  }
};

const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      'followers',
      'username email'
    );
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ message: '팔로워 조회 실패', error: error.message });
  }
};

const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      'following',
      'username email'
    );
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: '팔로잉 조회 실패', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateProfile,
  getProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
