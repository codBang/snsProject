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
