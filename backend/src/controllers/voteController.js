const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { generateAnonId } = require('../utils/generateAnonId');

const vote = async (req, res, next) => {
  try {
    const { type, id } = req.params; // type: 'post' o 'comment'
    const { value } = req.body;      // 1 o -1

    if (![1, -1].includes(Number(value)))
      throw new AppError('Valor de voto inválido', 400);

    if (!['post', 'comment'].includes(type))
      throw new AppError('Tipo inválido', 400);

    const user_id = req.user?.id || null;
    const anonymous_id = user_id ? null : generateAnonId(req);

    const post_id    = type === 'post'    ? id : null;
    const comment_id = type === 'comment' ? id : null;

    // Verificar si ya votó
    let existingVote;
    if (user_id) {
      existingVote = await query(
        `SELECT id, value FROM votes WHERE user_id = $1 AND ${type}_id = $2`,
        [user_id, id]
      );
    } else {
      existingVote = await query(
        `SELECT id, value FROM votes WHERE anonymous_id = $1 AND ${type}_id = $2`,
        [anonymous_id, id]
      );
    }

    const table = type === 'post' ? 'posts' : 'comments';

    if (existingVote.rows.length > 0) {
      const existing = existingVote.rows[0];

      if (existing.value === Number(value)) {
        // Mismo voto = quitar voto
        await query('DELETE FROM votes WHERE id = $1', [existing.id]);
        await query(`UPDATE ${table} SET vote_score = vote_score - $1 WHERE id = $2`, [value, id]);
        return res.json({ message: 'Voto eliminado', vote_score: null });
      } else {
        // Voto diferente = cambiar voto
        await query('UPDATE votes SET value = $1 WHERE id = $2', [value, existing.id]);
        await query(`UPDATE ${table} SET vote_score = vote_score + $1 WHERE id = $2`, [value * 2, id]);
        return res.json({ message: 'Voto actualizado' });
      }
    }

    // Voto nuevo
    await query(
      `INSERT INTO votes (user_id, anonymous_id, post_id, comment_id, value)
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id, anonymous_id, post_id, comment_id, value]
    );
    await query(`UPDATE ${table} SET vote_score = vote_score + $1 WHERE id = $2`, [value, id]);

    res.status(201).json({ message: 'Voto registrado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { vote };