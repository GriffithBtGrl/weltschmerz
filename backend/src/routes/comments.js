const router = require('express').Router({ mergeParams: true });
const { getComments, createComment, deleteComment } = require('../controllers/commentController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

router.get('/',    optionalAuth, getComments);
router.post('/',   optionalAuth, createComment);
router.delete('/:id', requireAuth, deleteComment);

module.exports = router;