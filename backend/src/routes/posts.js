const router = require('express').Router();
const { getPosts, getPost, createPost, deletePost } = require('../controllers/postController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

router.get('/',       optionalAuth, getPosts);
router.get('/:id',    optionalAuth, getPost);
router.post('/',      optionalAuth, createPost);
router.delete('/:id', requireAuth,  deletePost);

module.exports = router;