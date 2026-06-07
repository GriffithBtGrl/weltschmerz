const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { generateAnonId } = require('../utils/generateAnonId');

const createNotification = async (type, userId, postId, commentId, fromUsername, fromAnonId) => {
  if (!userId) return;
  try {
    await query(
      `INSERT INTO notifications (user_id, type, post_id, comment_id, from_username, from_anonymous_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, postId, commentId, fromUsername || null, fromAnonId || null],
    );
  } catch (err) {
    console.error("Error creando notificación:", err.message);
  }
};

const vote = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { value } = req.body;
    const numValue = Number(value);

    if (![1, -1].includes(numValue))
      throw new AppError('Valor de voto inválido', 400);
    if (!['post', 'comment'].includes(type))
      throw new AppError('Tipo inválido', 400);

    const user_id = req.user?.id || null;
    const anonymous_id = user_id ? null : generateAnonId(req);
    const post_id    = type === 'post'    ? id : null;
    const comment_id = type === 'comment' ? id : null;
    const table      = type === 'post' ? 'posts' : 'comments';

    // Buscar voto existente
    let existingResult;
    if (user_id) {
      existingResult = await query(
        `SELECT id, value FROM votes WHERE user_id = $1 AND ${type}_id = $2`,
        [user_id, id]
      );
    } else {
      existingResult = await query(
        `SELECT id, value FROM votes WHERE anonymous_id = $1 AND ${type}_id = $2`,
        [anonymous_id, id]
      );
    }

    const existing = existingResult.rows[0];

    if (existing) {
      const existingValue = Number(existing.value);

      if (existingValue === numValue) {
        // Quitar voto
        await query('DELETE FROM votes WHERE id = $1', [existing.id]);
        if (numValue === 1) {
          await query(`UPDATE ${table} SET upvotes = upvotes - 1, vote_score = vote_score - 1 WHERE id = $1`, [id]);
        } else {
          await query(`UPDATE ${table} SET downvotes = downvotes - 1, vote_score = vote_score + 1 WHERE id = $1`, [id]);
        }
        return res.json({ action: 'removed' });
      } else {
        // Cambiar voto
        await query('UPDATE votes SET value = $1 WHERE id = $2', [numValue, existing.id]);
        if (numValue === 1) {
          await query(`UPDATE ${table} SET upvotes = upvotes + 1, downvotes = downvotes - 1, vote_score = vote_score + 2 WHERE id = $1`, [id]);
        } else {
          await query(`UPDATE ${table} SET upvotes = upvotes - 1, downvotes = downvotes + 1, vote_score = vote_score - 2 WHERE id = $1`, [id]);
        }
        return res.json({ action: 'changed' });
      }
    }

    // Voto nuevo
    await query(
      `INSERT INTO votes (user_id, anonymous_id, post_id, comment_id, value)
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id, anonymous_id, post_id, comment_id, numValue]
    );
    if (numValue === 1) {
      await query(`UPDATE ${table} SET upvotes = upvotes + 1, vote_score = vote_score + 1 WHERE id = $1`, [id]);
    } else {
      await query(`UPDATE ${table} SET downvotes = downvotes + 1, vote_score = vote_score - 1 WHERE id = $1`, [id]);
    }

    // Notificar solo si es like (upvote) y el votante no es el dueño
    if (numValue === 1) {
      let ownerId = null;
      let notifPostId = post_id;

      if (type === 'post') {
        const owner = await query('SELECT user_id FROM posts WHERE id = $1', [id]);
        ownerId = owner.rows[0]?.user_id;
        notifPostId = id;
      } else {
        const owner = await query('SELECT user_id, post_id FROM comments WHERE id = $1', [id]);
        ownerId = owner.rows[0]?.user_id;
        notifPostId = owner.rows[0]?.post_id;
      }

      if (ownerId && ownerId !== user_id) {
        await createNotification(
          type === 'post' ? 'like_post' : 'like_comment',
          ownerId,
          notifPostId,
          type === 'comment' ? id : null,
          req.user?.username || null,
          anonymous_id
        );
      }
    }

    res.status(201).json({ action: 'added' });
  } catch (err) {
    next(err);
  }
};

module.exports = { vote };