const router = require('express').Router({ mergeParams: true });
const { getComments, createComment, deleteComment } = require('../controllers/commentController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

router.get('/',    optionalAuth, getComments);
router.post('/',   optionalAuth, createComment);
router.delete('/:id', requireAuth, deleteComment);
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const result = await require('../config/db').query(
      'UPDATE comments SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [content, id, req.user.id]
    );
    if (!result.rows[0]) throw new require('../middleware/errorHandler').AppError('No autorizado', 403);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;