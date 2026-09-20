const commentService = require("../services/commentService");

async function createComment(req, res) {
  const comment = await commentService.createComment(
    req.params.postId,
    req.user._id,
    req.body.content,
  );
  res.status(201).json({ success: true, data: comment });
}

async function listComments(req, res) {
  const result = await commentService.listComments(
    req.params.postId,
    req.query,
  );
  res.status(200).json({ success: true, ...result });
}

module.exports = { createComment, listComments };
