const router = require('express').Router();
const { query } = require('../config/db');
const { optionalAuth } = require('../middleware/auth');
const { generateAnonId } = require('../utils/generateAnonId');

// Guardar suscripción
router.post('/subscribe', optionalAuth, async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    const { p256dh, auth } = keys;

    const user_id = req.user?.id || null;
    const anonymous_id = user_id ? null : generateAnonId(req);

    // Upsert — actualizar si ya existe
    await query(
      `INSERT INTO push_subscriptions (user_id, anonymous_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         anonymous_id = EXCLUDED.anonymous_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth`,
      [user_id, anonymous_id, endpoint, p256dh, auth]
    );

    res.json({ message: 'Suscripción guardada' });
  } catch (err) { next(err); }
});

// Eliminar suscripción
router.post('/unsubscribe', async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ message: 'Suscripción eliminada' });
  } catch (err) { next(err); }
});

// Obtener clave pública VAPID
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;