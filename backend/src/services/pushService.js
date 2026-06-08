const webpush = require('../config/webpush');
const { query } = require('../config/db');

const sendPushToUser = async (userId, payload) => {
  try {
    const result = await query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    for (const sub of result.rows) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        if (err.statusCode === 410) {
          // Suscripción expirada, eliminar
          await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
        }
      }
    }
  } catch (err) {
    console.error('Error enviando push:', err.message);
  }
};

module.exports = { sendPushToUser };