const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { generateAnonId } = require('../utils/generateAnonId');

const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const result = await query(
      `SELECT 
        c.id, c.parent_id, c.content, c.vote_score, c.depth, c.created_at, c.anonymous_id,
        u.username, u.avatar_url
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );

    // Construir árbol de comentarios
    const map = {};
    const roots = [];

    result.rows.forEach(row => {
      map[row.id] = { ...row, replies: [] };
    });

    result.rows.forEach(row => {
      if (row.parent_id) {
        map[row.parent_id]?.replies.push(map[row.id]);
      } else {
        roots.push(map[row.id]);
      }
    });

    res.json(roots);
  } catch (err) {
    next(err);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content, parent_id } = req.body;

    if (!content) throw new AppError('El contenido es requerido', 400);

    // Verificar que el post existe
    const post = await query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (!post.rows[0]) throw new AppError('Post no encontrado', 404);

    // Calcular depth
    let depth = 0;
    if (parent_id) {
      const parent = await query('SELECT depth FROM comments WHERE id = $1', [parent_id]);
      if (!parent.rows[0]) throw new AppError('Comentario padre no encontrado', 404);
      depth = Math.min(parent.rows[0].depth + 1, 6); // máximo 6 niveles
    }

    const user_id = req.user?.id || null;
    const anonymous_id = user_id ? null : generateAnonId(req);

    const result = await query(
      `INSERT INTO comments (post_id, parent_id, user_id, anonymous_id, content, depth)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [postId, parent_id || null, user_id, anonymous_id, content, depth]
    );

    // Actualizar contador del post
    await query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1', [postId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT user_id FROM comments WHERE id = $1', [id]);
    if (!result.rows[0]) throw new AppError('Comentario no encontrado', 404);

    if (result.rows[0].user_id !== req.user.id)
      throw new AppError('No autorizado', 403);

    await query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ message: 'Comentario eliminado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, createComment, deleteComment };