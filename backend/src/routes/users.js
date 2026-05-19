const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { query } = require("../config/db");
const { AppError } = require("../middleware/errorHandler");
const { uploadImage } = require("../services/cloudinaryService");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new AppError("Formato no permitido", 400));
  },
});

// Ver perfil público
router.get("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const userResult = await query(
      "SELECT id, username, avatar_url, bio, created_at FROM users WHERE username = $1",
      [username],
    );
    if (!userResult.rows[0]) throw new AppError("Usuario no encontrado", 404);
    const user = userResult.rows[0];

    const postsResult = await query(
      `SELECT p.id, p.title, p.content, p.image_url, p.vote_score, p.upvotes, p.downvotes,
              p.comment_count, p.created_at, b.slug as board_slug
       FROM posts p
       JOIN boards b ON p.board_id = b.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [user.id],
    );

    res.json({ user, posts: postsResult.rows });
  } catch (err) {
    next(err);
  }
});

// Actualizar bio
router.patch("/me/bio", requireAuth, async (req, res, next) => {
  try {
    const { bio } = req.body;
    const result = await query(
      "UPDATE users SET bio = $1 WHERE id = $2 RETURNING id, username, email, avatar_url, bio, role",
      [bio, req.user.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Actualizar avatar
router.patch(
  "/me/avatar",
  requireAuth,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new AppError("No se recibió imagen", 400);
      const result = await uploadImage(req.file.buffer, req.file.mimetype);
      const user = await query(
        "UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, email, avatar_url, bio, role",
        [result.secure_url, req.user.id],
      );
      res.json(user.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// Perfil anónimo
router.get("/anon/:anonId", async (req, res, next) => {
  try {
    const { anonId } = req.params;

    const postsResult = await query(
      `SELECT p.id, p.title, p.content, p.image_url, p.vote_score, p.upvotes, p.downvotes,
              p.comment_count, p.created_at, b.slug as board_slug
       FROM posts p
       JOIN boards b ON p.board_id = b.id
       WHERE p.anonymous_id = $1
       ORDER BY p.created_at DESC`,
      [anonId],
    );

    const commentsResult = await query(
      `SELECT c.id, c.content, c.created_at, p.title as post_title, p.id as post_id
       FROM comments c
       JOIN posts p ON c.post_id = p.id
       WHERE c.anonymous_id = $1
       ORDER BY c.created_at DESC
       LIMIT 20`,
      [anonId],
    );

    res.json({
      anonymous_id: anonId,
      posts: postsResult.rows,
      comments: commentsResult.rows,
    });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
