const router = require('express').Router();
const { vote } = require('../controllers/voteController');
const { optionalAuth } = require('../middleware/auth');

router.post('/:type/:id', optionalAuth, vote);

module.exports = router;