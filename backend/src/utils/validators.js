const { body } = require('express-validator');

const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username solo puede tener letras, números y _'),
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password debe tener al menos 6 caracteres'),
];

const loginValidator = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password requerido'),
];

module.exports = { registerValidator, loginValidator };