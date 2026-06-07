const router = require("express").Router();
const {
  getPosts,
  getPost,
  createPost,
  deletePost,
} = require("../controllers/postController");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { query } = require("../config/db");
const { AppError } = require("../middleware/errorHandler");

router.get("/", optionalAuth, getPosts);
router.get("/:id", optionalAuth, getPost);
router.post("/", optionalAuth, createPost);
router.delete("/:id", requireAuth, deletePost);

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, music_url } = req.body;

    const existing = await query("SELECT user_id FROM posts WHERE id = $1", [
      id,
    ]);
    if (!existing.rows[0]) throw new AppError("Post no encontrado", 404);
    if (existing.rows[0].user_id !== req.user.id)
      throw new AppError("No autorizado", 403);

    const result = await query(
      "UPDATE posts SET title = $1, content = $2, music_url = $3 WHERE id = $4 RETURNING *",
      [title, content, music_url, id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
