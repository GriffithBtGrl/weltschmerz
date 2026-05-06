const { query } = require("../config/db");
const { AppError } = require("../middleware/errorHandler");
const { generateAnonId } = require("../utils/generateAnonId");

const vote = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { value } = req.body;

    if (![1, -1].includes(Number(value)))
      throw new AppError("Valor de voto inválido", 400);

    if (!["post", "comment"].includes(type))
      throw new AppError("Tipo inválido", 400);

    const user_id = req.user?.id || null;
    const anonymous_id = user_id ? null : generateAnonId(req);

    const post_id = type === "post" ? id : null;
    const comment_id = type === "comment" ? id : null;
    const table = type === "post" ? "posts" : "comments";

    // Buscar voto existente
    let existingResult;
    if (user_id) {
      existingResult = await query(
        `SELECT id, value FROM votes 
         WHERE user_id = $1 AND ${type}_id = $2`,
        [user_id, id],
      );
    } else {
      existingResult = await query(
        `SELECT id, value FROM votes 
         WHERE anonymous_id = $1 AND ${type}_id = $2`,
        [anonymous_id, id],
      );
    }

    const existing = existingResult.rows[0];

    if (existing) {
      if (existing.value === Number(value)) {
        // Quitar voto
        await query("DELETE FROM votes WHERE id = $1", [existing.id]);
        const col = value === 1 ? "upvotes" : "downvotes";
        await query(
          `UPDATE ${table} SET vote_score = vote_score - $1, ${col} = ${col} - 1 WHERE id = $2`,
          [value, id],
        );
        return res.json({ action: "removed" });
      } else {
        // Cambiar voto
        await query("UPDATE votes SET value = $1 WHERE id = $2", [
          value,
          existing.id,
        ]);
        const addCol = value === 1 ? "upvotes" : "downvotes";
        const subCol = value === 1 ? "downvotes" : "upvotes";
        await query(
          `UPDATE ${table} SET vote_score = vote_score + $1, ${addCol} = ${addCol} + 1, ${subCol} = ${subCol} - 1 WHERE id = $2`,
          [Number(value) * 2, id],
        );
        return res.json({ action: "changed" });
      }
    }

    // Voto nuevo
    await query(
      `INSERT INTO votes (user_id, anonymous_id, post_id, comment_id, value)
   VALUES ($1, $2, $3, $4, $5)`,
      [user_id, anonymous_id, post_id, comment_id, value],
    );
    const newCol = Number(value) === 1 ? "upvotes" : "downvotes";
    await query(
      `UPDATE ${table} SET vote_score = vote_score + $1, ${newCol} = ${newCol} + 1 WHERE id = $2`,
      [value, id],
    );

    res.status(201).json({ action: "added" });

    // Voto nuevo — verificar constraint único para usuarios registrados
    if (user_id) {
      const constraint =
        type === "post" ? "AND post_id = $3" : "AND comment_id = $3";

      const duplicate = await query(
        `SELECT id FROM votes WHERE user_id = $1 ${constraint}`,
        [user_id, id],
      );
      if (duplicate.rows.length > 0)
        throw new AppError("Ya votaste en esto", 409);
    }

    await query(
      `INSERT INTO votes (user_id, anonymous_id, post_id, comment_id, value)
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id, anonymous_id, post_id, comment_id, value],
    );
    await query(
      `UPDATE ${table} SET vote_score = vote_score + $1 WHERE id = $2`,
      [value, id],
    );

    res.status(201).json({ action: "added" });
  } catch (err) {
    next(err);
  }
};

module.exports = { vote };
