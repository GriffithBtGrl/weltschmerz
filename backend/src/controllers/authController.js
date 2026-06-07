const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { query } = require("../config/db");
const { AppError } = require("../middleware/errorHandler");

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    // Sin expiresIn = token permanente
  );

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

    const { username, email, password } = req.body;

    // Verificar si ya existe
    const exists = await query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );
    if (exists.rows.length > 0)
      throw new AppError("Email o username ya está en uso", 409);

    const password_hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (username, email, password_hash)
   VALUES ($1, $2, $3)
   RETURNING id, username, email, avatar_url, bio, role, created_at`,
      [username, email, password_hash],
    );
    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

    const { email, password } = req.body;

    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      throw new AppError("Credenciales inválidas", 401);

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: user.role,
        created_at: user.created_at,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, username, email, avatar_url, bio, role, created_at FROM users WHERE id = $1",
      [req.user.id],
    );
    if (!result.rows[0]) throw new AppError("Usuario no encontrado", 404);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
