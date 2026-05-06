const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { generateAnonId } = require('../utils/generateAnonId');

const getPosts = async (req, res, next) => {
  try {
    const { board, sort = 'new', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const orderBy = sort === 'popular' ? 'p.vote_score DESC' : 'p.created_at DESC';

    const boardFilter = board ? 'AND b.slug = $3' : '';
    const params = board ? [limit, offset, board] : [limit, offset];

    const result = await query(
      `SELECT 
        p.id, p.title, p.content, p.image_url, p.vote_score, p.comment_count,
        p.is_pinned, p.created_at, p.anonymous_id,
        b.slug as board_slug, b.name as board_name,
        u.username, u.avatar_url
       FROM posts p
       JOIN boards b ON p.board_id = b.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE 1=1 ${boardFilter}
       ORDER BY p.is_pinned DESC, ${orderBy}
       LIMIT $1 OFFSET $2`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT 
        p.id, p.title, p.content, p.image_url, p.vote_score, p.comment_count,
        p.is_pinned, p.created_at, p.anonymous_id,
        b.slug as board_slug, b.name as board_name,
        u.username, u.avatar_url
       FROM posts p
       JOIN boards b ON p.board_id = b.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    if (!result.rows[0]) throw new AppError('Post no encontrado', 404);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { title, content, board_slug, image_url, image_public_id } = req.body;

    if (!title) throw new AppError('El título es requerido', 400);
    if (!content && !image_url) throw new AppError('El post necesita contenido o imagen', 400);

    // Obtener board_id desde el slug
    const boardResult = await query('SELECT id FROM boards WHERE slug = $1', [board_slug]);
    if (!boardResult.rows[0]) throw new AppError('Board no encontrado', 404);
    const board_id = boardResult.rows[0].id;

    const user_id = req.user?.id || null;
    const anonymous_id = user_id ? null : generateAnonId(req);

    const result = await query(
      `INSERT INTO posts (board_id, user_id, anonymous_id, title, content, image_url, image_public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [board_id, user_id, anonymous_id, title, content, image_url, image_public_id]
    );

    // Actualizar contador del board
    await query('UPDATE boards SET post_count = post_count + 1 WHERE id = $1', [board_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT user_id FROM posts WHERE id = $1', [id]);
    if (!result.rows[0]) throw new AppError('Post no encontrado', 404);

    // Solo el dueño puede borrar
    if (result.rows[0].user_id !== req.user.id)
      throw new AppError('No autorizado', 403);

    await query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ message: 'Post eliminado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPosts, getPost, createPost, deletePost };