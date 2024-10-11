const NodeCache = require('node-cache');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const cache = new NodeCache({ stdTTL: 60 }); // 캐시 TTL 60초 설정

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
    res.status(400).send({
      message: 'Failed to create post',
      error: error.message,
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `posts-page-${page}-limit-${limit}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const posts = await Post.find()
      .populate('user', 'username email')
      .skip(skip)
      .limit(limit);

    if (!Array.isArray(posts)) {
      return res.status(500).send('Data retrieval failed');
    }

    const totalPosts = await Post.countDocuments();

    const result = {
      posts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
    };

    cache.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    res.status(500).send({
      message: 'Failed to retrieve posts',
      error: error.message,
    });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userPosts = await Post.find({ user: userId }).populate(
      'user',
      'username email'
    );

    if (!userPosts) {
      return res.status(404).send('User posts not found');
    }

    res.status(200).json(userPosts);
  } catch (error) {
    res.status(500).send({
      message: 'Failed to retrieve user posts',
      error: error.message,
    });
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
    res.status(500).send({
      message: 'Failed to like the post',
      error: error.message,
    });
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
    res.status(500).send({
      message: 'Failed to view post',
      error: error.message,
    });
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
    res.status(400).send({
      message: 'Failed to add comment',
      error: error.message,
    });
  }
};

const getCommentsByPostId = async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({ post: postId });

    if (!comments || comments.length === 0) {
      return res.status(404).send('Comments not found');
    }

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).send({
      message: 'Failed to retrieve comments',
      error: error.message,
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send('Post not found');

    post.content = req.body.content || post.content;
    if (req.file) {
      post.image = req.file.path;
    }

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(400).send({
      message: 'Failed to update post',
      error: error.message,
    });
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
    res.status(500).send({
      message: 'Failed to delete post',
      error: error.message,
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getUserPosts,
  likePost,
  viewPost,
  addComment,
  getCommentsByPostId,
  deletePost,
  updatePost,
};
