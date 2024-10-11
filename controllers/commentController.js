const Comment = require('../models/Comment');

const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).send('Comment not found');
    if (comment.likedBy.includes(req.user._id))
      return res.status(400).send('You have already liked this comment');

    comment.likes += 1;
    comment.likedBy.push(req.user._id);
    await comment.save();
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const addReply = async (req, res) => {
  try {
    const parentComment = await Comment.findById(req.params.commentId);
    if (!parentComment) return res.status(404).send('Comment not found');

    const newReply = new Comment({
      post: parentComment.post,
      user: req.user._id,
      content: req.body.content,
      parentComment: req.params.commentId,
    });
    const savedReply = await newReply.save();
    res.status(201).json(savedReply);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

module.exports = {
  likeComment,
  addReply,
};
