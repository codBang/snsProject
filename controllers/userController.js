const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// .env 파일을 불러오기 위한 dotenv 설정
require('dotenv').config();

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).send('Missing required fields');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Email already exists');
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
    res.status(500).send(error.message);
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
      process.env.JWT_SECRET, // 환경 변수에서 비밀키를 가져옴
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = { registerUser, loginUser };
