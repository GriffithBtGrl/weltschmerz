const router = require('express').Router();
const { requireAdmin } = require('../middleware/auth');
const { query } = require('../config/db');

// Stats generales
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const [posts, users, comments, votes] = await Promise.all([
      query('SELECT COUNT(*) FROM posts'),
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM comments'),
      query('SELECT COUNT(*) FROM votes'),
    ]);
    res.json({
      posts:    Number(posts.rows[0].count),
      users:    Number(users.rows[0].count),
      comments: Number(comments.rows[0].count),
      votes:    Number(votes.rows[0].count),
    });
  } catch (err) { next(err); }
});

// Todos los posts con info de autor
router.get('/posts', requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.id, p.title, p.vote_score, p.comment_count, p.is_pinned,
              p.created_at, p.anonymous_id,
              b.slug as board_slug,
              u.username, u.email
       FROM posts p
       JOIN boards b ON p.board_id = b.id
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// Eliminar cualquier post
router.delete('/posts/:id', requireAdmin, async (req, res, next) => {
  try {
    await query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Post eliminado' });
  } catch (err) { next(err); }
});

// Pinear/despinear post
router.patch('/posts/:id/pin', requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE posts SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING is_pinned`,
      [req.params.id]
    );
    res.json({ is_pinned: result.rows[0].is_pinned });
  } catch (err) { next(err); }
});

// Todos los usuarios
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// Eliminar cualquier comentario
router.delete('/comments/:id', requireAdmin, async (req, res, next) => {
  try {
    await query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Comentario eliminado' });
  } catch (err) { next(err); }
});

module.exports = router;