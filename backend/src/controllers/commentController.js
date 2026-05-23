const { query } = require("../config/db");
const { AppError } = require("../middleware/errorHandler");
const { generateAnonId } = require("../utils/generateAnonId");

const createNotification = async (
  type,
  userId,
  postId,
  commentId,
  fromUsername,
  fromAnonId,
) => {
  if (!userId) return; // no notificar si el dueño no tiene cuenta
  try {
    await query(
      `INSERT INTO notifications (user_id, type, post_id, comment_id, from_username, from_anonymous_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        type,
        postId,
        commentId,
        fromUsername || null,
        fromAnonId || null,
      ],
    );
  } catch (err) {
    console.error("Error creando notificación:", err.message);
  }
};

const extractMentions = (content) => {
  const matches = content.match(/@([a-zA-Z0-9_]+)/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.substring(1)))]; // quitar el @ y deduplicar
};

const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const result = await query(
      `SELECT 
        c.id, c.parent_id, c.content, c.vote_score, c.upvotes, c.depth, c.created_at, c.anonymous_id,
        u.username, u.avatar_url, u.role
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId],
    );

    // Construir árbol de comentarios
    const map = {};
    const roots = [];

    result.rows.forEach((row) => {
      map[row.id] = { ...row, replies: [] };
    });

    result.rows.forEach((row) => {
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

    if (!content) throw new AppError("El contenido es requerido", 400);

    const post = await query("SELECT id FROM posts WHERE id = $1", [postId]);
    if (!post.rows[0]) throw new AppError("Post no encontrado", 404);

    let depth = 0;
    if (parent_id) {
      const parent = await query("SELECT depth FROM comments WHERE id = $1", [parent_id]);
      if (!parent.rows[0]) throw new AppError("Comentario padre no encontrado", 404);
      depth = Math.min(parent.rows[0].depth + 1, 6);
    }

    const user_id = req.user?.id || null;
    const anonymous_id = user_id ? null : generateAnonId(req);

    const result = await query(
      `INSERT INTO comments (post_id, parent_id, user_id, anonymous_id, content, depth)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [postId, parent_id || null, user_id, anonymous_id, content, depth],
    );

    await query("UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1", [postId]);

    // Notificar al dueño del post
    const postOwner = await query("SELECT user_id FROM posts WHERE id = $1", [postId]);
    const postOwnerId = postOwner.rows[0]?.user_id;

    if (postOwnerId && postOwnerId !== user_id) {
      await createNotification(
        "comment_on_post",
        postOwnerId,
        postId,
        result.rows[0].id,
        req.user?.username || null,
        anonymous_id,
      );
    }

    // Notificar al dueño del comentario padre si es reply
    if (parent_id) {
      const parentOwner = await query("SELECT user_id FROM comments WHERE id = $1", [parent_id]);
      const parentOwnerId = parentOwner.rows[0]?.user_id;

      if (parentOwnerId && parentOwnerId !== user_id) {
        await createNotification(
          "reply_to_comment",
          parentOwnerId,
          postId,
          result.rows[0].id,
          req.user?.username || null,
          anonymous_id,
        );
      }
    }

    // Notificar menciones con @
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      const mentionedUsers = await query(
        `SELECT id, username FROM users WHERE username = ANY($1)`,
        [mentions]
      );
      for (const mentionedUser of mentionedUsers.rows) {
        if (mentionedUser.id !== user_id && mentionedUser.id !== postOwnerId) {
          await createNotification(
            'mention',
            mentionedUser.id,
            postId,
            result.rows[0].id,
            req.user?.username || null,
            anonymous_id
          );
        }
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT user_id FROM comments WHERE id = $1", [
      id,
    ]);
    if (!result.rows[0]) throw new AppError("Comentario no encontrado", 404);

    if (result.rows[0].user_id !== req.user.id)
      throw new AppError("No autorizado", 403);

    await query("DELETE FROM comments WHERE id = $1", [id]);
    res.json({ message: "Comentario eliminado" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, createComment, deleteComment };
