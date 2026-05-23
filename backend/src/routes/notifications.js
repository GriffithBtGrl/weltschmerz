const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { query } = require("../config/db");

// Obtener notificaciones del usuario
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT n.id, n.type, n.read, n.created_at,
              n.from_username, n.from_anonymous_id,
              p.title as post_title, p.id as post_id,
              c.content as comment_content
       FROM notifications n
       LEFT JOIN posts p ON n.post_id = p.id
       LEFT JOIN comments c ON n.comment_id = c.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Contar notificaciones no leídas
router.get("/unread-count", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE",
      [req.user.id],
    );
    res.json({ count: Number(result.rows[0].count) });
  } catch (err) {
    next(err);
  }
});

// Marcar todas como leídas
router.patch("/read-all", requireAuth, async (req, res, next) => {
  try {
    await query("UPDATE notifications SET read = TRUE WHERE user_id = $1", [
      req.user.id,
    ]);
    res.json({ message: "ok" });
  } catch (err) {
    next(err);
  }
});

// Marcar una como leída
router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    await query(
      "UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id],
    );
    res.json({ message: "ok" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
