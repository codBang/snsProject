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
